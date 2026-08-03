# Local image OCR active cleanup

Image OCR timeout and cancellation now propagate through a dedicated runtime work signal. CaseFind races browser text detection against that signal, rejects immediately when work is cancelled, and closes the decoded image bitmap in `finally` even if the browser detector never settles.

The outer user-cancellation signal remains separate from the internal timeout controller. A user cancellation persists `cancelled`; a deadline persists the safe, retryable `ocr_timeout` failure. In both cases, no extraction artifact or AI action is created. Detector results that arrive after cancellation or timeout are ignored and cannot overwrite the terminal processing state.

This is cooperative cancellation: the browser's underlying text detector may continue internally when its platform API provides no abort method, but CaseFind releases its bitmap, listeners, timer, and result path immediately.
