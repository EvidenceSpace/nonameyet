# Browser storage health

The local case library reports site-storage health using the browser Storage API when available.

- `navigator.storage.estimate()` supplies approximate usage and quota for the entire CaseFind site origin, not only original records.
- `navigator.storage.persisted()` reports whether the browser currently treats the origin as persistent.
- **Protect local storage** calls `navigator.storage.persist()` only after a user click. The browser decides whether to grant the request.

CaseFind distinguishes browser-managed, high-pressure, protected, and unavailable states. “Protected” means the browser should avoid automatic eviction; it does not protect against manual site-data clearing, browser-profile loss, device loss, or forgotten backup passwords. The interface therefore continues recommending encrypted backups.

These checks are local browser APIs. They do not upload storage metadata or case content and do not require an account.
