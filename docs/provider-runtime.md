# AI provider runtime

CaseFind uses an OpenAI-compatible server adapter. Original file bytes remain in IndexedDB; only user-requested extracted page text is sent to `/api/analyze`.

## Configuration

Set these as server environment variables—never in browser code:

- `AI_API_KEY`: provider credential.
- `AI_MODEL`: provider model identifier.
- `AI_BASE_URL`: compatible API base URL, default `https://api.openai.com/v1`.
- `APP_ORIGIN`: exact permitted browser origin.
- `HOST` and `PORT`: local server binding.

OpenAI, xAI/Grok, OpenRouter, and other compatible APIs can be selected through `AI_BASE_URL` and `AI_MODEL`. Remote endpoints must use HTTPS.

## Run

After `npm install`:

```bash
npm run serve
```

Without both `AI_API_KEY` and `AI_MODEL`, the app still runs but `/api/analyze` returns `503 analysis_unavailable`. Partial configuration fails at startup.

## Security boundaries

- Authorization is added only inside the server adapter.
- Credentials never enter provider requests, endpoint responses, or browser bundles.
- System instructions and untrusted evidence are separate messages.
- Requests are exact-origin checked and JSON-only.
- Input, output, timeout, contract, hash, page, quote, and candidate-count gates fail closed.
