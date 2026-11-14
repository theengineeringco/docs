# UI labels verified against master

Checked on `theengineeringco/branch-demo` `origin/master`, 2026-11-12. Re-check any
label before relying on it; the UI moves.

| Topic | What the UI says |
| --- | --- |
| Skills | **Settings → AI → Skills**, with **Organizational Skills** and **Personal Skills** sections, each with **New skill**; **My FLOW.md** under Personal |
| Skill scope | Personal skills and My FLOW.md apply to the user's chats and agents they delegate to, never to automation runs |
| Agent sidebar | No Automations, Skills, or Activity entries; those live in Settings → AI |
| New project | **New project** dialog: **Name**, **Start from** (**Default template**, **Blank project**, or a project), **What to import** (Data model, Views, Automations, Skills) |
| New branch | **New branch** by default. With the org's updated variant view (off by default): **New change request** or **Variant name** |
| Import | **More actions → Import from → CSV/Excel**; **Match items by**; the import writes into a new branch |
| Impact analysis | Branch **Review** page: **Changed Items** tab, **Impact analysis** tab, **Run impact analysis**. Hidden from external users |
| Parent updates | **Update from parent** |
| Agent tool call | **Loaded skill** shows which skill ran |
| GitHub | Automations can trigger on GitHub pull request review events |
