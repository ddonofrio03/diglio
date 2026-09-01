# In re Diglio — citizenship evidence file

A working tracker for the Diglio *jure sanguinis* research: the ten-step
evidence checklist, a research log, the apostille chain, and what it has cost
so far. Progress syncs through Supabase, so the phone and the laptop see the
same file.

**Live:** https://ddonofrio03.github.io/diglio/

## What it does

- Every checklist item carries a status — `—` open, `REQ` requested,
  `REC` record found, `NIL` no record, `N/A` — plus a free-text note.
  `NIL` is a result, not a gap: a documented negative search is the evidence.
- Five pivotal answers (the WWI card, the 1900 and 1920 census columns, the
  household link, the comune) are captured separately, because they change
  what is worth doing next. The decision tree reacts to the WWI answer.
- The apostille chain tracks ordered / apostilled / translated per document.
- A research log records what was searched and what came back.
- A cost ledger runs actual spend against the checklist's estimate.

## Stack

Static HTML, CSS and vanilla JS on GitHub Pages. No build step — edit and push.

Assets are requested as `?v=dev` in the source; the Pages workflow rewrites that
to the commit SHA on deploy, so a browser holding a cached `app.js` picks up the
new one. Nothing to bump by hand.

Data lives in the `Evening Scout & Life Stuff` Supabase project
(ref `bawcxalgdcuwnpkajkxa`) in four `diglio_`-prefixed tables:
`diglio_progress`, `diglio_facts`, `diglio_log`, `diglio_costs`.

There is no sign-in. The tracker is one shared set of rows read and written
with the anon key, which is why `assets/app.js` can carry that key in the open.
The page is unlisted and `noindex`, and RLS withholds `delete` on
`diglio_progress` and `diglio_facts`, so the worst anyone who finds the URL can
do is edit a checklist — they cannot wipe it.

`SETUP.sql` is the whole database setup in one idempotent script — the removal
of per-user scoping plus the document bucket. Safe to re-run.

PDFs and scans attach to any checklist item and to any row of the apostille
chain, by drag-and-drop or the file picker. Files go to the public
`diglio-docs` bucket under random UUID filenames; `diglio_docs` maps them back
to item keys. The bucket cannot be listed, and storage grants `insert` only —
so "Remove" drops the row and leaves the object in place, and no visitor can
delete a scan you paid for.

## Editing the checklist

All content lives in `assets/data.js`. Item keys (`s7.m1904` and the like) are
the Supabase primary key, so **renaming a key orphans its saved status and
notes**. Add and remove freely; rename only if you mean to reset that item.

## Not legal advice

The source checklist was not written by a lawyer, and neither is this. The
open-questions page lists what is unresolved — in particular whether this is a
1948 case at all, which is worth a paid consultation before spending anything
on a judicial route.
