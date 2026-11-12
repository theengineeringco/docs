# From demo narration to docs

Source: the team's scripted product demos (local copies in `~/Desktop/demo-transcripts`
on the author's machine; not committed, since one walkthrough is customer-specific).
These notes keep the demos' structure and drop their delivery.

## What the demos do that the docs keep

| Demo move | Docs equivalent |
| --- | --- |
| Opens on the promise: one source of truth for teams iterating quickly | First paragraph of What is Flow states the problem and the promise, once |
| Shows a requirement decomposing before explaining anything | Lead with a concrete record (Top Speed → Cd → frontal area), then name the concept |
| Names the reason it matters: engineers understand why each requirement exists, and stop working in different directions | Follow each example with one sentence of consequence |
| Ownership is a deliberate act, by the engineer closest to the part | Ownership appears early and by role; it is a principle, not a field |
| "Where in the design is this delivered?" leads into the systems view | Use the engineer's question as the transition between sections |
| Pivots the same information by activity: systems, functions, verification, risk | Describe views by the task they serve; same records, no duplication |
| Table, tree, Reader in quick succession, each with its job | One sentence per view: what it is for |
| Comment in Reader to ask a colleague about a simulation; the thread is kept | Collaboration happens on the record and stays with it |
| Branches do two things: variation and parallel work | Variants and proposals are introduced together and kept distinct |
| Agent connected to the tools teams already use; review lands in GitHub | Agents appear where the engineer works; outcome first, setup elsewhere |
| Ends on: all information in one place, iterate quickly, same direction | Close each overview page on outcome, not on a feature list |

The second demo adds three useful patterns, to be re-expressed with the EV project:

- Find your own work first: search for the record you own, then act on it.
- Bring an existing document in through the agent, which applies the team's skills
  so the result follows house rules.
- After a change, run impact analysis to see who else is affected, then talk to them.

## What the docs drop

- Filler and intensifiers: "very, very", "really", "easily", "actually", "Fantastic".
- Presenter framing: "Let me show you", "As you can see", "I've loaded in".
- First-person singular narration. Rewrite as "you" (Get started) or third person
  (Core concepts).
- Customer names, customer programs, and customer vocabulary.
- People's names. Use roles.
- Counts tied to a specific dataset (for example, how many dependencies a demo
  analysis reviewed).
- Claims about features that are not on `master`.

## Before and after

Demo: "I've navigated to my requirements and I can see very easily how the top speed
decomposes into things like the coefficient of drag, the torque requirement from the
powertrain."

Docs: "Open the requirements and follow Top Speed down. It decomposes into the
aerodynamic drag coefficient and powertrain peak torque, and drag decomposes again
into frontal area. Each requirement now has a visible reason to exist."

Demo: "This is not meant to be a systems engineer, it's actually meant to be the
mechanical engineer, the electrical engineer, maybe even the software engineer."

Docs: "Ownership does not default to a systems engineer. It belongs to the engineer
closest to the design: the aerodynamics engineer owns the drag target; the BMS
software engineer owns the firmware limits."
