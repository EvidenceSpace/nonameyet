# Building blocks

Every case type is made from the same small set of blocks. Case types only choose which blocks to suggest and which legal elements to track. The car-accident scene is the **Place** block at its richest. It isn't a special feature.

Each block exists once in the case and can appear in many places (board, Evidence, Brief, Room, Reports). Every block shows **Used in** and **From** (its source document, page or time).

## Blocks

| Block | What it is | Key fields | Connects to |
| --- | --- | --- | --- |
| **Person** | Anyone in the case: you, the other side, witnesses, experts | name, role, side (you / independent / other side / expert), contact, where they were | statements, claims, Room membership |
| **Statement** | One account by one person at one time | person, date, channel (email, police note, letter, call note), source document | contains claims |
| **Claim** | One sentence someone asserts | text, source location (page/line or timestamp), statement | supports a version of a disputed point, can be struck with a reason |
| **Disputed point** | A question with competing versions | question, time it refers to, versions (which is "yours"), legal element it serves | claims, frames, measurements and records as support |
| **Document** | Any file | type, date, origin, integrity info, extracted items | claims, amounts, dates, places |
| **Media** | Video or photo | timestamps, frames, markers, reviewed state | frames pinned onto disputed points, damage markers |
| **Money** | A cost or a sum owed | label, amount, have vs need, backing papers | ledger total, letter table |
| **Deadline** | A date that matters | date, consequence, source (law, contract, practice) | proof panel, notifications |
| **Lead** | Evidence not obtained yet | what, who holds it, why it matters, likely loss date, action | disputed point it could settle, Room request |
| **Rule** | Law, code, contract clause | text, source, jurisdiction | legal element it settles, disputed point it applies to |
| **Place** | A plan or map | base map source, items placed (people, vehicles, cameras), scale, sightlines | people, media, disputed points |
| **Event** | Something that happened at a time | date/time, who, source | timeline, disputed points |
| **Note** | Visual only: sticky, text, ink | author | never counts as evidence |

## Strings

| String | Meaning | Effect |
| --- | --- | --- |
| supports | source → version of a disputed point | adds weight by source type |
| contradicts | claim ↔ claim | opens side-by-side compare, can lead to striking a claim |
| rule applies | rule → legal element or point | can settle an element ("settled by law") |
| backs | document → money line | fills a hole |
| related | anything ↔ anything | no computation, just context |

An unlabelled line is drawing. Only labelled strings change the case.

## Legal elements by case type (examples, England & Wales)

- **Road traffic negligence**: duty of care / rule broken; breach (e.g. ran a red light); causation; loss. Their likely argument: contributory negligence (speed, seatbelt).
- **Unpaid invoice / contract**: agreement and terms; work delivered; acceptance or no valid complaint in time; sum due; interest.
- **Tenancy deposit**: deposit paid; protected in a scheme within 30 days or not; deductions justified by check-in/out evidence.
- **Employment (unfair dismissal)**: employee with qualifying service; dismissal; reason; fair procedure; time limit (3 months less a day, ACAS early conciliation).

These lists must be reviewed by a qualified lawyer before release. They're design examples, not legal content.

## How gaps become next steps

Every block can expose a **gap**: a missing paper, an unreviewed video, an unanswered argument, a lead with a deadline. The next step is the gap with the highest value, roughly: deadline soonest first, then a disputed point that serves an unproven legal element, then the other side's arguments, then money papers, then outputs. The next step always says why, in one sentence.

## Accessibility equivalent

Everything on the board has a structured outline view: points, versions, supports, struck claims with reasons, gaps and deadlines as lists. These are keyboard operable, so the board is never the only way in.
