import { DB_NAME, DB_VERSION, upgradeDatabaseSchema } from "./storage-schema.js";

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export class StorageOpenError extends Error {
  constructor(code, message, cause) {
    super(message);
    this.name = "StorageOpenError";
    this.code = code;
    this.cause = cause;
  }
}

export function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    let settled = false;
    const rejectOnce = (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };
    request.onupgradeneeded = () => {
      try {
        upgradeDatabaseSchema(request.result, request.transaction);
      } catch {
        request.transaction?.abort();
      }
    };
    request.onblocked = () => rejectOnce(new StorageOpenError(
      "upgrade_blocked",
      "Local storage needs an upgrade, but another CaseFind tab is still using it. Close other CaseFind tabs and try again.",
    ));
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close();
      if (settled) { db.close(); return; }
      settled = true;
      resolve(db);
    };
    request.onerror = () => rejectOnce(new StorageOpenError(
      "open_failed",
      "Local storage could not be opened safely. Nothing was changed.",
      request.error,
    ));
  });
}

async function transaction(storeName, mode, action) {
  const db = await openDatabase();
  try {
    const tx = db.transaction(storeName, mode);
    const result = await action(tx.objectStore(storeName));
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error("Transaction aborted"));
    });
    return result;
  } finally { db.close(); }
}

export const saveCase = (value) => transaction("cases", "readwrite", (store) => requestResult(store.put(value)));
export const getCase = (id) => transaction("cases", "readonly", (store) => requestResult(store.get(id)));
export const getAllCases = () => transaction("cases", "readonly", (store) => requestResult(store.getAll()));

const SOURCE_LINKED_WRITE_MESSAGES = {
  source_missing: "The source record no longer exists on this device. Nothing was saved.",
  source_changed: "The source record changed before this linked item could be saved. Nothing was saved.",
  case_missing: "This case is no longer available on this device. Nothing was saved.",
  write_failed: "The source-linked item could not be saved on this device. Nothing was changed.",
};

export class SourceLinkedWriteError extends Error {
  constructor(code, cause) {
    super(SOURCE_LINKED_WRITE_MESSAGES[code] || SOURCE_LINKED_WRITE_MESSAGES.write_failed);
    this.name = "SourceLinkedWriteError";
    this.code = code;
    this.cause = cause;
  }
}

function nonEmptyString(value) {
  return typeof value === "string" && Boolean(value.trim());
}

function sourceIdentity(storeName, value) {
  if (!value || !nonEmptyString(value.caseId)) return null;
  if (storeName === "processing") {
    if (!nonEmptyString(value.fileId) || !nonEmptyString(value.fileHash)) return null;
    return { fileId: value.fileId, fileHash: value.fileHash, caseId: value.caseId };
  }
  const fileId = storeName === "suggestions" ? value.fileId : value.sourceFileId;
  const reference = value.sourceReference;
  if (!nonEmptyString(fileId)
    || !nonEmptyString(reference?.fileId)
    || reference.fileId !== fileId
    || !nonEmptyString(reference.sha256)) return null;
  return { fileId, fileHash: reference.sha256, caseId: value.caseId };
}

function sourceMatches(file, identity) {
  return file?.id === identity.fileId
    && file.caseId === identity.caseId
    && file.sha256 === identity.fileHash;
}

async function saveSourceLinkedWithActivity(storeName, value, method, {
  openDatabaseImpl = openDatabase,
  now = () => new Date().toISOString(),
} = {}) {
  const identity = sourceIdentity(storeName, value);
  if (!identity) throw new TypeError("Invalid source-linked write identity.");

  const db = await openDatabaseImpl();
  try {
    const tx = db.transaction([storeName, "files", "cases"], "readwrite");
    const target = tx.objectStore(storeName);
    const files = tx.objectStore("files");
    const cases = tx.objectStore("cases");
    let writeError;
    let fileRequest;
    let caseRequest;
    let valueRequest;
    const abortWith = (error) => {
      writeError = error;
      try { tx.abort(); }
      catch (abortError) { writeError = writeError || abortError; }
    };
    const completion = new Promise((resolve, reject) => {
      let settled = false;
      const rejectOnce = () => {
        if (settled) return;
        settled = true;
        reject(writeError || new SourceLinkedWriteError(
          "write_failed",
          tx.error || valueRequest?.error || caseRequest?.error || fileRequest?.error,
        ));
      };
      tx.oncomplete = () => {
        if (settled) return;
        settled = true;
        resolve(undefined);
      };
      tx.onerror = rejectOnce;
      tx.onabort = rejectOnce;
    });

    try {
      fileRequest = files.get(identity.fileId);
      fileRequest.onsuccess = () => {
        if (!fileRequest.result) {
          abortWith(new SourceLinkedWriteError("source_missing"));
          return;
        }
        if (!sourceMatches(fileRequest.result, identity)) {
          abortWith(new SourceLinkedWriteError("source_changed"));
          return;
        }
        caseRequest = cases.get(identity.caseId);
        caseRequest.onsuccess = () => {
          if (!caseRequest.result) {
            abortWith(new SourceLinkedWriteError("case_missing"));
            return;
          }
          try {
            const updatedAt = now();
            if (!nonEmptyString(updatedAt)) throw new TypeError("Invalid activity timestamp.");
            valueRequest = target[method](value);
            cases.put({ ...caseRequest.result, updatedAt });
          } catch (cause) {
            abortWith(new SourceLinkedWriteError("write_failed", cause));
          }
        };
      };
    } catch (cause) {
      abortWith(new SourceLinkedWriteError("write_failed", cause));
    }

    await completion;
    return valueRequest?.result;
  } finally { db.close(); }
}

async function deleteWithActivity(storeName, id, relatedStoreNames = []) {
  const db = await openDatabase();
  try {
    const tx = db.transaction([storeName, ...relatedStoreNames, "cases"], "readwrite");
    const store = tx.objectStore(storeName);
    const valueRequest = store.get(id);
    valueRequest.onsuccess = () => {
      const value = valueRequest.result;
      store.delete(id);
      for (const relatedStoreName of relatedStoreNames) tx.objectStore(relatedStoreName).delete(id);
      if (value?.caseId) {
        const cases = tx.objectStore("cases");
        const caseRequest = cases.get(value.caseId);
        caseRequest.onsuccess = () => {
          if (caseRequest.result) cases.put({ ...caseRequest.result, updatedAt: new Date().toISOString() });
        };
      }
    };
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onabort = () => reject(tx.error || valueRequest.error || new Error("Transaction aborted"));
    });
  } finally { db.close(); }
}

const FILE_REMOVAL_MESSAGES = {
  stale_file: "This source record changed in another tab. Nothing was removed. Reload and review the latest version.",
  file_linked: "Remove any linked facts, suggestions, or timeline items before deleting this source record.",
  case_missing: "This case is no longer available on this device. Nothing was changed.",
  write_failed: "This source record could not be removed from this device. Nothing was changed.",
};

export class FileRemovalError extends Error {
  constructor(code, cause) {
    super(FILE_REMOVAL_MESSAGES[code] || FILE_REMOVAL_MESSAGES.write_failed);
    this.name = "FileRemovalError";
    this.code = code;
    this.cause = cause;
  }
}

function fileMetadata(value) {
  if (!value || typeof value !== "object") return undefined;
  return Object.fromEntries(Object.entries(value).filter(([key]) => key !== "original"));
}

function originalFileMetadata(value) {
  const original = value?.original;
  if (!original || typeof original !== "object") return undefined;
  return {
    name: original.name,
    type: original.type,
    size: original.size,
    lastModified: original.lastModified,
  };
}

export function validFileRemovalSnapshot(file) {
  const original = file?.original;
  return Boolean(
    file
    && ["id", "caseId", "name", "type", "sha256", "createdAt"].every((key) => (
      typeof file[key] === "string" && Boolean(file[key])
    ))
    && /^[a-f0-9]{64}$/i.test(file.sha256)
    && Number.isSafeInteger(file.size)
    && file.size >= 0
    && original
    && typeof original.name === "string"
    && typeof original.type === "string"
    && Number.isSafeInteger(original.size)
    && original.size >= 0
    && Number.isFinite(original.lastModified)
    && original.name === file.name
    && original.type === file.type
    && original.size === file.size
  );
}

const FILE_WRITE_MESSAGES = {
  case_missing: "This case is no longer available on this device. The source file was not saved.",
  write_failed: "The source file could not be saved on this device. Nothing was changed.",
};

export class FileWriteError extends Error {
  constructor(code, cause) {
    super(FILE_WRITE_MESSAGES[code] || FILE_WRITE_MESSAGES.write_failed);
    this.name = "FileWriteError";
    this.code = code;
    this.cause = cause;
  }
}

export async function saveFile(value, {
  openDatabaseImpl = openDatabase,
  now = () => new Date().toISOString(),
} = {}) {
  if (!validFileRemovalSnapshot(value)) throw new TypeError("Invalid source file identity.");

  const db = await openDatabaseImpl();
  try {
    const tx = db.transaction(["files", "cases"], "readwrite");
    const files = tx.objectStore("files");
    const cases = tx.objectStore("cases");
    let caseRequest;
    let fileRequest;
    let writeError;
    const abortWith = (error) => {
      writeError = error;
      try { tx.abort(); }
      catch (abortError) { writeError = writeError || abortError; }
    };
    const completion = new Promise((resolve, reject) => {
      let settled = false;
      const rejectOnce = () => {
        if (settled) return;
        settled = true;
        reject(writeError || new FileWriteError(
          "write_failed",
          tx.error || fileRequest?.error || caseRequest?.error,
        ));
      };
      tx.oncomplete = () => {
        if (settled) return;
        settled = true;
        resolve(undefined);
      };
      tx.onerror = rejectOnce;
      tx.onabort = rejectOnce;
    });

    try {
      caseRequest = cases.get(value.caseId);
      caseRequest.onsuccess = () => {
        if (!caseRequest.result) {
          abortWith(new FileWriteError("case_missing"));
          return;
        }
        try {
          const updatedAt = now();
          if (!nonEmptyString(updatedAt)) throw new TypeError("Invalid activity timestamp.");
          fileRequest = files.add(value);
          cases.put({ ...caseRequest.result, updatedAt });
        } catch (cause) {
          abortWith(new FileWriteError("write_failed", cause));
        }
      };
    } catch (cause) {
      abortWith(new FileWriteError("write_failed", cause));
    }

    await completion;
    return fileRequest?.result;
  } finally { db.close(); }
}

export function fileValuesMatch(current, expected) {
  if (!validFileRemovalSnapshot(current) || !validFileRemovalSnapshot(expected)) return false;
  try {
    return JSON.stringify(fileMetadata(current)) === JSON.stringify(fileMetadata(expected))
      && JSON.stringify(originalFileMetadata(current)) === JSON.stringify(originalFileMetadata(expected));
  } catch {
    return false;
  }
}

export async function deleteFile(expectedFile, {
  openDatabaseImpl = openDatabase,
  now = () => new Date().toISOString(),
} = {}) {
  if (!validFileRemovalSnapshot(expectedFile)) throw new TypeError("Invalid file removal identity.");

  const db = await openDatabaseImpl();
  try {
    const tx = db.transaction(["files", "processing", "facts", "suggestions", "events", "cases"], "readwrite");
    const files = tx.objectStore("files");
    const processing = tx.objectStore("processing");
    const facts = tx.objectStore("facts");
    const suggestions = tx.objectStore("suggestions");
    const events = tx.objectStore("events");
    const cases = tx.objectStore("cases");
    let currentRequest;
    let transitionError;
    let settled = false;
    let rejectCompletion;

    const completion = new Promise((resolve, reject) => {
      rejectCompletion = reject;
      const rejectOnce = (error) => {
        if (settled) return;
        settled = true;
        reject(error);
      };
      tx.oncomplete = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      tx.onerror = () => rejectOnce(transitionError || new FileRemovalError(
        "write_failed",
        tx.error || currentRequest?.error,
      ));
      tx.onabort = () => rejectOnce(transitionError || new FileRemovalError(
        "write_failed",
        tx.error || currentRequest?.error,
      ));
    });

    const abortWith = (error) => {
      if (transitionError) return;
      transitionError = error;
      try {
        tx.abort();
      } catch (cause) {
        if (!settled) {
          settled = true;
          rejectCompletion(new FileRemovalError("write_failed", cause));
        }
      }
    };

    try {
      currentRequest = files.get(expectedFile.id);
      currentRequest.onsuccess = () => {
        if (!fileValuesMatch(currentRequest.result, expectedFile)) {
          abortWith(new FileRemovalError("stale_file"));
          return;
        }

        const linkRequests = [
          facts.index("sourceFileId").getKey(expectedFile.id),
          suggestions.index("fileId").getKey(expectedFile.id),
          events.index("sourceFileId").getKey(expectedFile.id),
        ];
        let remainingLinks = linkRequests.length;
        let linked = false;
        const finishLinkCheck = () => {
          remainingLinks -= 1;
          if (remainingLinks) return;
          if (linked) {
            abortWith(new FileRemovalError("file_linked"));
            return;
          }

          const caseRequest = cases.get(expectedFile.caseId);
          caseRequest.onsuccess = () => {
            const caseRecord = caseRequest.result;
            if (!caseRecord) {
              abortWith(new FileRemovalError("case_missing"));
              return;
            }
            try {
              const updatedAt = now();
              if (typeof updatedAt !== "string" || !updatedAt) throw new TypeError("Invalid activity timestamp.");
              files.delete(expectedFile.id);
              processing.delete(expectedFile.id);
              cases.put({ ...caseRecord, updatedAt });
            } catch (cause) {
              abortWith(new FileRemovalError("write_failed", cause));
            }
          };
        };
        for (const request of linkRequests) {
          request.onsuccess = () => {
            linked ||= request.result !== undefined;
            finishLinkCheck();
          };
        }
      };
    } catch (cause) {
      abortWith(new FileRemovalError("write_failed", cause));
    }

    await completion;
    return true;
  } finally { db.close(); }
}

export const getFilesForCase = (id) => transaction("files", "readonly", (store) => requestResult(store.index("caseId").getAll(id)));
export const saveFact = (value, options) => saveSourceLinkedWithActivity("facts", value, "put", options);
export const getFactsForCase = (id) => transaction("facts", "readonly", (store) => requestResult(store.index("caseId").getAll(id)));
export const deleteFact = (id) => deleteWithActivity("facts", id);
export const saveSuggestion = (value, options) => saveSourceLinkedWithActivity("suggestions", value, "put", options);
export const getSuggestionsForCase = (id) => transaction("suggestions", "readonly", (store) => requestResult(store.index("caseId").getAll(id)));
export const deleteSuggestion = (id) => deleteWithActivity("suggestions", id);
export const saveProcessing = (value, options) => saveSourceLinkedWithActivity("processing", value, "put", options);

function processingValuesMatch(current, expected) {
  if (!current || !expected) return false;
  try {
    return JSON.stringify(current) === JSON.stringify(expected);
  } catch {
    return false;
  }
}

export async function saveProcessingIfCurrent(expected, replacement, {
  openDatabaseImpl = openDatabase,
  now = () => new Date().toISOString(),
} = {}) {
  const sameIdentity = expected && replacement
    && ["fileId", "caseId", "fileHash"].every((key) => (
      typeof expected[key] === "string"
      && Boolean(expected[key])
      && expected[key] === replacement[key]
    ));
  if (!sameIdentity) throw new TypeError("Processing replacement identity is invalid.");

  const db = await openDatabaseImpl();
  try {
    const tx = db.transaction(["processing", "cases"], "readwrite");
    const processing = tx.objectStore("processing");
    const cases = tx.objectStore("cases");
    let replaced = false;
    let currentRequest;
    const completion = new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error || currentRequest?.error || new Error("Transaction failed"));
      tx.onabort = () => reject(tx.error || currentRequest?.error || new Error("Transaction aborted"));
    });
    currentRequest = processing.get(expected.fileId);
    currentRequest.onsuccess = () => {
      if (!processingValuesMatch(currentRequest.result, expected)) return;
      processing.put(replacement);
      const caseRequest = cases.get(replacement.caseId);
      caseRequest.onsuccess = () => {
        if (caseRequest.result) cases.put({ ...caseRequest.result, updatedAt: now() });
      };
      replaced = true;
    };
    await completion;
    return replaced;
  } finally { db.close(); }
}

export const getProcessingForCase = (id) => transaction("processing", "readonly", (store) => requestResult(store.index("caseId").getAll(id)));
export const deleteProcessing = (id) => deleteWithActivity("processing", id);

export const EVENT_TRANSITION_MESSAGES = {
  stale_event: "This timeline event changed in another tab. Nothing was changed. Reload and review the latest version.",
  source_missing: "The selected source record no longer exists on this device. Nothing was saved.",
  source_changed: "The selected source record changed before this timeline event could be saved. Nothing was saved.",
  case_missing: "This case is no longer available on this device. Nothing was changed.",
  write_failed: "The timeline event change could not be saved on this device. Nothing was changed.",
};

export class EventTransitionError extends Error {
  constructor(code, cause) {
    super(EVENT_TRANSITION_MESSAGES[code] || EVENT_TRANSITION_MESSAGES.write_failed);
    this.name = "EventTransitionError";
    this.code = code;
    this.cause = cause;
  }
}

function validCalendarDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

function validTimestamp(value) {
  if (!nonEmptyString(value)) return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value;
}

function hasOnlyKeys(value, requiredKeys, optionalKeys = []) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  return requiredKeys.every((key) => Object.hasOwn(value, key))
    && keys.every((key) => requiredKeys.includes(key) || optionalKeys.includes(key));
}

export function validEventLocator(locator) {
  if (!hasOnlyKeys(locator, ["kind"], ["page", "quote"])) return false;
  const validQuote = locator.quote === undefined
    || (typeof locator.quote === "string" && locator.quote.length <= 500);
  if (!validQuote) return false;
  if (locator.kind === "whole_file") {
    return !Object.hasOwn(locator, "page");
  }
  return locator.kind === "pdf_page"
    && Object.hasOwn(locator, "page")
    && Number.isInteger(locator.page)
    && locator.page >= 1
    && locator.page <= 10000;
}

export function validEventSnapshot(value) {
  return Boolean(
    hasOnlyKeys(
      value,
      [
        "id", "caseId", "eventDate", "title", "sourceFileId", "sourceReference",
        "origin", "revision", "createdAt", "updatedAt",
      ],
      ["description"],
    )
    && nonEmptyString(value.id)
    && nonEmptyString(value.caseId)
    && validCalendarDate(value.eventDate)
    && typeof value.title === "string"
    && value.title.trim() === value.title
    && value.title.length >= 3
    && value.title.length <= 120
    && (value.description === undefined
      || (typeof value.description === "string" && value.description.length <= 1000))
    && nonEmptyString(value.sourceFileId)
    && hasOnlyKeys(value.sourceReference, ["fileId", "sha256", "locator"])
    && value.sourceReference?.fileId === value.sourceFileId
    && /^[a-f0-9]{64}$/.test(value.sourceReference?.sha256 || "")
    && validEventLocator(value.sourceReference?.locator)
    && value.origin === "user_entered"
    && Number.isSafeInteger(value.revision)
    && value.revision >= 1
    && validTimestamp(value.createdAt)
    && validTimestamp(value.updatedAt)
  );
}

export function eventValuesMatch(current, expected) {
  if (!validEventSnapshot(current) || !validEventSnapshot(expected)) return false;
  try {
    const comparable = (value) => [
      value.id,
      value.caseId,
      value.eventDate,
      value.title,
      value.description,
      value.sourceFileId,
      value.sourceReference.fileId,
      value.sourceReference.sha256,
      value.sourceReference.locator.kind,
      value.sourceReference.locator.page,
      value.sourceReference.locator.quote,
      value.origin,
      value.revision,
      value.createdAt,
      value.updatedAt,
    ];
    return JSON.stringify(comparable(current)) === JSON.stringify(comparable(expected));
  } catch {
    return false;
  }
}

export function validEventReplacement(expected, replacement) {
  return validEventSnapshot(expected)
    && validEventSnapshot(replacement)
    && replacement.id === expected.id
    && replacement.caseId === expected.caseId
    && replacement.createdAt === expected.createdAt
    && replacement.origin === expected.origin
    && replacement.revision === expected.revision + 1;
}

function eventTransitionKind(expected, replacement) {
  if (expected === null && validEventSnapshot(replacement) && replacement.revision === 1) return "create";
  if (validEventReplacement(expected, replacement)) return "replace";
  if (validEventSnapshot(expected) && replacement === null) return "remove";
  return null;
}

export async function commitEventTransition(expected, replacement, {
  openDatabaseImpl = openDatabase,
  now = () => new Date().toISOString(),
} = {}) {
  const kind = eventTransitionKind(expected, replacement);
  if (!kind) throw new TypeError("Invalid timeline event transition.");
  const event = kind === "remove" ? expected : replacement;
  const storeNames = kind === "remove" ? ["events", "cases"] : ["events", "files", "cases"];
  let db;
  try {
    db = await openDatabaseImpl();
  } catch (cause) {
    throw new EventTransitionError("write_failed", cause);
  }

  try {
    const tx = db.transaction(storeNames, "readwrite");
    const events = tx.objectStore("events");
    const cases = tx.objectStore("cases");
    const files = kind === "remove" ? null : tx.objectStore("files");
    let transitionError;
    let currentRequest;
    let expectedFileRequest;
    let replacementFileRequest;
    let caseRequest;
    let eventRequest;
    let caseWriteRequest;
    let settled = false;
    let rejectCompletion;

    const failure = () => transitionError || new EventTransitionError(
      "write_failed",
      tx.error
        || eventRequest?.error
        || caseWriteRequest?.error
        || caseRequest?.error
        || replacementFileRequest?.error
        || expectedFileRequest?.error
        || currentRequest?.error,
    );
    const completion = new Promise((resolve, reject) => {
      rejectCompletion = reject;
      const rejectOnce = () => {
        if (settled) return;
        settled = true;
        reject(failure());
      };
      tx.oncomplete = () => {
        if (settled) return;
        settled = true;
        resolve(undefined);
      };
      tx.onerror = rejectOnce;
      tx.onabort = rejectOnce;
    });
    const abortWith = (error) => {
      if (transitionError) return;
      transitionError = error;
      try { tx.abort(); }
      catch (cause) {
        if (settled) return;
        settled = true;
        rejectCompletion(new EventTransitionError("write_failed", cause));
      }
    };
    const commitAfterCaseCheck = () => {
      try {
        caseRequest = cases.get(event.caseId);
        caseRequest.onsuccess = () => {
          if (!caseRequest.result) {
            abortWith(new EventTransitionError("case_missing"));
            return;
          }
          try {
            const updatedAt = now();
            if (!validTimestamp(updatedAt)) throw new TypeError("Invalid activity timestamp.");
            if (kind === "create") eventRequest = events.add(event);
            else if (kind === "replace") eventRequest = events.put(event);
            else eventRequest = events.delete(event.id);
            caseWriteRequest = cases.put({ ...caseRequest.result, updatedAt });
          } catch (cause) {
            abortWith(new EventTransitionError("write_failed", cause));
          }
        };
      } catch (cause) {
        abortWith(new EventTransitionError("write_failed", cause));
      }
    };
    const readAndValidateSource = (identity, assignRequest, onValid) => {
      try {
        const request = files.get(identity.fileId);
        assignRequest(request);
        request.onsuccess = () => {
          if (!request.result) {
            abortWith(new EventTransitionError("source_missing"));
            return;
          }
          if (!sourceMatches(request.result, identity)) {
            abortWith(new EventTransitionError("source_changed"));
            return;
          }
          try { onValid(request.result); }
          catch (cause) { abortWith(new EventTransitionError("write_failed", cause)); }
        };
      } catch (cause) {
        abortWith(new EventTransitionError("write_failed", cause));
      }
    };
    const checkReplacementSource = (validatedExpectedFile = null) => {
      const identity = sourceIdentity("events", replacement);
      if (validatedExpectedFile?.id === identity.fileId) {
        if (!sourceMatches(validatedExpectedFile, identity)) {
          abortWith(new EventTransitionError("source_changed"));
          return;
        }
        commitAfterCaseCheck();
        return;
      }
      readAndValidateSource(
        identity,
        (request) => { replacementFileRequest = request; },
        commitAfterCaseCheck,
      );
    };
    const checkExpectedAndReplacementSources = () => {
      const identity = sourceIdentity("events", expected);
      readAndValidateSource(
        identity,
        (request) => { expectedFileRequest = request; },
        checkReplacementSource,
      );
    };

    try {
      if (kind === "create") checkReplacementSource();
      else {
        currentRequest = events.get(expected.id);
        currentRequest.onsuccess = () => {
          if (!eventValuesMatch(currentRequest.result, expected)) {
            abortWith(new EventTransitionError("stale_event"));
            return;
          }
          if (kind === "replace") checkExpectedAndReplacementSources();
          else commitAfterCaseCheck();
        };
      }
    } catch (cause) {
      abortWith(new EventTransitionError("write_failed", cause));
    }

    await completion;
    return kind === "remove" ? true : eventRequest?.result;
  } catch (failure) {
    if (failure instanceof EventTransitionError) throw failure;
    throw new EventTransitionError("write_failed", failure);
  } finally { db.close(); }
}

export const createEvent = (value, options) => commitEventTransition(null, value, options);
export const saveEvent = createEvent;
export const saveEventIfCurrent = (expected, replacement, options) => (
  commitEventTransition(expected, replacement, options)
);
export const getEventsForCase = (id) => transaction("events", "readonly", (store) => requestResult(store.index("caseId").getAll(id)));
export const deleteEvent = (expected, options) => commitEventTransition(expected, null, options);

export async function markCaseBackedUp(caseId, at = new Date().toISOString()) {
  const record = await getCase(caseId);
  if (!record) throw new Error("Case not found.");
  await saveCase({ ...record, lastBackupAt: at });
}
export async function setCaseArchived(caseId, archived, at = new Date().toISOString()) {
  const record = await getCase(caseId);
  if (!record) throw new Error("Case not found.");
  const updated = { ...record, updatedAt: at };
  if (archived) updated.archivedAt = at;
  else delete updated.archivedAt;
  await saveCase(updated);
  return updated;
}

export async function deleteCase(caseId) {
  const db = await openDatabase();
  try {
    const names = ["cases", "files", "facts", "suggestions", "processing", "events"];
    const tx = db.transaction(names, "readwrite");
    const range = IDBKeyRange.only(caseId);
    for (const storeName of names.slice(1)) {
      const request = tx.objectStore(storeName).index("caseId").openCursor(range);
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) { cursor.delete(); cursor.continue(); }
      };
    }
    tx.objectStore("cases").delete(caseId);
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(new Error("The case could not be deleted. Nothing was changed."));
      tx.onabort = () => reject(new Error("The case could not be deleted. Nothing was changed."));
    });
  } finally { db.close(); }
}

export async function restoreCaseBundle(bundle) {
  const existing = await getCase(bundle.record.id);
  if (existing) throw new Error("This case already exists on this device. Nothing was overwritten.");
  const db = await openDatabase();
  try {
    const tx = db.transaction(["cases", "files", "facts", "suggestions", "processing", "events"], "readwrite");
    tx.objectStore("cases").add(bundle.record);
    for (const file of bundle.files) tx.objectStore("files").add(file);
    for (const fact of bundle.facts) tx.objectStore("facts").add(fact);
    for (const suggestion of bundle.suggestions) tx.objectStore("suggestions").add(suggestion);
    for (const job of bundle.processing) tx.objectStore("processing").add(job);
    for (const event of bundle.events || []) tx.objectStore("events").add(event);
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(new Error("The backup collided with existing local data. Nothing was restored."));
      tx.onabort = () => reject(new Error("The backup could not be restored. Nothing was changed."));
    });
    return bundle.record.id;
  } finally { db.close(); }
}

export async function sha256(file) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
export const createId = (prefix) => `${prefix}_${crypto.randomUUID()}`;

if (location.pathname.endsWith("/case.html")) import("./workspace-bootstrap.js");
