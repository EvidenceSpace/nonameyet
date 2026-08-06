const FILE_CONTROL_SELECTOR = ".preview-file, .source-file, .delete-file";

function isUsableFileId(value) {
  return typeof value === "string" && Boolean(value.trim());
}

export function createProcessingFileIndex(files) {
  const index = new Map();
  if (!Array.isArray(files)) return index;
  for (const file of files) {
    const fileId = file?.id;
    if (!isUsableFileId(fileId)) continue;
    if (index.has(fileId)) index.set(fileId, null);
    else index.set(fileId, file);
  }
  return index;
}

export function resolveProcessingFileForRow(row, filesById) {
  if (!row || typeof row.querySelectorAll !== "function" || !(filesById instanceof Map)) return null;
  const controls = [...row.querySelectorAll(FILE_CONTROL_SELECTOR)];
  if (!controls.length) return null;
  const controlIds = controls.map((control) => control?.dataset?.id);
  if (controlIds.some((fileId) => !isUsableFileId(fileId))) return null;
  const uniqueIds = new Set(controlIds);
  if (uniqueIds.size !== 1) return null;
  const [fileId] = uniqueIds;
  const assignedId = row.dataset?.fileId;
  if (isUsableFileId(assignedId) && assignedId !== fileId) return null;
  const file = filesById.get(fileId);
  if (!file || file.id !== fileId) return null;
  if (row.dataset) row.dataset.fileId = fileId;
  return file;
}
