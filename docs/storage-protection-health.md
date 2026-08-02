# Storage protection health

CaseFind uses IndexedDB for originals and case records, so browser eviction and quota pressure are product risks rather than implementation details.

The case hub reports `navigator.storage.estimate()` values as **estimates**, not guaranteed free disk space. Usage can be padded and quota varies by browser and device. The panel therefore says “estimated quota” and “reported origin quota” and never promises that the displayed remainder can be written successfully.

Best-effort storage may be evicted under browser or device pressure. The **Protect local storage** action calls `navigator.storage.persist()` only after a user click. Browsers apply their own permission rules and may deny the request. When granted, CaseFind describes protection from automatic cleanup while preserving the warning that manual site-data clearing, device loss, and quota limits still matter.

Pressure is highlighted when reported usage reaches 80% of the reported origin quota. This is a CaseFind warning threshold, not a browser guarantee; writes still handle transaction and quota failures independently.

References:

- [MDN: StorageManager.persist()](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist)
- [MDN: Storage quotas and eviction criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
- [web.dev: Storage for the web](https://web.dev/articles/storage-for-the-web)
