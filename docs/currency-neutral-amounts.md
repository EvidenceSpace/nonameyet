# Currency-neutral case amounts

CaseFind stores and displays the amount exactly as the user enters it. It does not infer a currency from browser language, location, account information, or numeric formatting.

Examples:

- `5000` remains `5000`.
- `USD 5,000` remains `USD 5,000`.
- `€4.500` remains `€4.500`.

The workspace and exported report use the same rule. If a currency matters, the user must include it explicitly. This avoids silently changing the meaning of a payment record and keeps international cases usable without location assumptions.
