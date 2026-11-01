# Collaboration protocol: Astra + Fable

Two agents, one working tree. Michael reads this folder to follow along but
should rarely need to intervene. Everything is plain files so it works for any
agent that can read and write the filesystem. No daemon, no server.

## 0. Roles

- **Astra is the project lead** (Michael's call, 2026-10-31). Astra owns
  priorities, the roadmap order, final say on decisions, and may reassign work.
- **Fable** proposes, builds, reviews, and keeps the shared docs tidy. Fable
  can proceed on anything reversible without waiting, but defers to Astra when
  Astra has stated a direction.
- Either agent may override a decision only by writing a new numbered decision
  file; Astra's is final if we disagree. Disagreement itself is welcome and
  should be written down, not smoothed over.

## 1. Messages (`collab/messages/`)

One file per message. Append-only. Never edit or delete another agent's message.

Filename: `<UTC timestamp>-<from>-to-<to>-<slug>.md`
Example:  `20261031T200112Z-fable-to-astra-vision-v0.md`

Use the helper so the format stays consistent:

```
collab/msg send fable astra "Subject here" proposal < body.md
collab/msg inbox astra              # unread messages for astra
collab/msg read <filename>          # print a message
collab/msg ack astra <filename>     # mark as read (appends to collab/read/astra.txt)
collab/msg log                      # whole thread, oldest first
```

Message header (YAML frontmatter) fields:
- `from`, `to`, `subject`, `sent` (UTC)
- `type`: `proposal | review | question | answer | decision | status | idea | handoff`
- `re`: filename of the message this replies to (optional)
- `needs_reply`: `true|false`

Keep messages concrete. Prefer "I propose X, objections by <time> or I proceed"
over open-ended questions, so neither of us blocks on the other.

**Checking for mail:** run `collab/msg inbox <you>` at the start of every work
session, after finishing any task, and before every commit. If you are a Claude
Code session on this machine, also run ListAgents; if the other agent shows up,
SendMessage them a one-line nudge ("new mail in collab/") so they don't have to
poll. The file is always the source of truth; the nudge is a courtesy.

## 2. Claims (`collab/claims/<agent>.md`)

Before touching a source area, write what you are working on in your OWN claims
file (only you edit it). List paths/globs and a one-line intent. Remove the
claim when done. Read the other agent's claims file before starting anything.
If a path is claimed by the other agent, don't edit it; send a message instead.

## 3. Reviews (`collab/reviews/`)

When you finish a milestone slice, send a message of type `handoff` naming the
commit and what to look at. The reviewer writes
`collab/reviews/<timestamp>-<reviewer>-reviews-<slug>.md` with:
- What was checked (ran it? read it? tested what?)
- Findings, severity-tagged: `blocker | should-fix | nit | praise`
- Verdict: `approve | approve-with-fixes | request-changes`
Then sends a `review` message pointing at it. Author fixes or replies with reasons.
Praise is allowed and encouraged; being specific about what worked teaches us both.

## 4. Decisions (`collab/decisions/NNN-slug.md`)

Anything that constrains future work (stack, schema, naming, scope) gets a
numbered decision file once both agree, or once one proposes and the other
doesn't object within the stated window. Fields: context, decision,
alternatives considered, consequences. Decisions can be superseded by a later
numbered decision; never silently edited. Astra signs off on all decisions.

## 5. Git

- Same working tree, so `git add` specific paths only. Never `git add -A`.
- Commit subject prefix: `[astra]` or `[fable]`. Small, frequent commits.
- Never `git reset --hard`, `git checkout -- <file>`, `git stash`, or rebase:
  it destroys the other agent's uncommitted work.
- No branches for now; one `main`. Revisit if we start conflicting.
- Don't push unless Michael asks.

## 6. Docs that we co-own

- `docs/VISION.md`        the north star; edit via proposal message, not unilaterally
- `docs/ROADMAP.md`       milestones; Astra owns the order, milestone owner edits its section
- `docs/ARCHITECTURE.md`  the shared contracts (schemas, module boundaries)
- `docs/LOG.md`           append-only dated progress log; one line per meaningful step
- `docs/IDEAS.md`         parking lot; anyone appends anytime, no process

## 7. Tone

Disagree freely and specifically. Cite a file and line, or run the thing. The
best outcome is that each of us makes the other's work better, not that we are
polite about it. If you are unsure whether to ask or proceed: proceed on the
reversible thing, ask on the irreversible one, and write down what you assumed.
