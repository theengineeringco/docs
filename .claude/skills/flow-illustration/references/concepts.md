# Concept map: what to draw for each Flow concept

Built from the product pages (systems graph, requirements management, branching, agents),
the homepage, and the API docs (entities, links, cross-links, formulas, data model,
branches, baselines, change requests, reviewers, stage gates, automations, MCP). Each row
gives the claim the figure makes, the metaphor, and a tested example in `examples/`.
`small/` = 240×200 glyph, `large/` = explainer or scene.

A support page usually needs three kinds of figure:

- **One scene** at the top of a section (systems graph stack, agents graph, Lissajous hero).
- **A steps explainer** for "how it works" (3–5 panels, one glyph each, captions under).
- **A glyph per concept** beside each sub-heading or in a three-up benefits row.

Reuse the same glyph for the same concept everywhere, so readers learn the language.

## A. The systems graph

| Concept | Claim | Metaphor | Example |
|---|---|---|---|
| Systems graph | Every item in the program is connected to one live model. | Radial graph round the node | `small/systems-graph` |
| Across disciplines | Requirements, architecture, CAD and tests are layers of one model. | Exploded 3D stack, a trace through every plane | `large/systems-graph-stack` |
| Views | Each discipline sees the same model with its own focus. | Three planes, same items, different squares | `small/views` |
| Data model | You define the entity types your program needs. | Tree whose branches use different mark kinds | `small/data-model` |
| Decomposition | Intent breaks down into subsystem and component requirements. | Tree, node at the root, squares at the leaves | `small/decomposition` |
| Traceability | Every level is linked down and verified up. | The V: decomposition left, verification right, links across | `small/traceability` |
| Cross-links | Peers stay linked across hierarchies. | Two trees, fine links between their leaves | `small/cross-links` |
| Source links | Every item keeps a live link to its source document. | Ghosts (documents) dotted to circles, joined to the node | `small/source-links` |
| Formulas, live parameters | A value computed from others stays current. | Inbound fan: circles → node → one square | `small/formulas` |

## B. Change and impact

| Concept | Claim | Metaphor | Example |
|---|---|---|---|
| Impact analysis | Change one item and everything it touches is found in seconds. | Radial graph, inner ring all squares, one flag; node pings | `small/impact-analysis` |
| Suspect links | Links out of a changed item stay suspect until reviewed. | Node → circles, a flag on each link | `small/suspect-links` |
| Contradictions | A requirement that contradicts another is flagged on edit. | Rows, middle lane flagged | `small/conflicts` |
| What-if | Explore alternatives without touching the live program. | Dotted ghost paths beside one worked path | `small/what-if` |
| Change, end to end | A spec lands, the graph flags impact, an agent works it, a human merges. | Four-panel steps | `large/change-flow` |

## C. Requirements quality

| Concept | Claim | Metaphor | Example |
|---|---|---|---|
| Structured authoring (EARS) | Every requirement has the same shape, so checks can read it. | Three aligned chains, one still a ghost | `small/structured-authoring` |
| Quality checks, compliance | Every clause is checked on every change. | Grid sweep: squares done, circles pending, one flag | `small/compliance` |
| Legacy ingestion, AI authoring | Documents in, structured requirements out. | Ghosts → node → squares | `small/ingestion` |

## D. Branching and baselines

| Concept | Claim | Metaphor | Example |
|---|---|---|---|
| Branch | Work forks off the baseline and merges back when ready. | One lane above the trunk | `small/branching` |
| Parallel workstreams | Many changes move at once; the baseline stays stable. | Wide branch diagram with labels | `large/branching-wide` |
| Merge with confidence | Conflicts surface before a branch lands. | Lane merging at a flag | `small/merge-conflicts` |
| Baselines | Every merge leaves an immutable snapshot. | Timeline ticks with frozen donuts above | `small/baselines` |
| Compare baselines | See exactly what changed between two snapshots. | Two columns of rows, changed rows are squares | `small/compare-baselines` |
| Revert | Going back is proposed and reviewed like going forward. | Dotted arc from the head back to an earlier tick | `small/revert` |
| Variants, configurations | Product families share one platform. | Petals with squares at the tips | `small/variants` |
| Branch permissions | A branch can be scoped to the partners allowed on it. | Dashed frame round one lane | `small/branch-permissions` |
| Rebase | A branch's changes are replayed onto the latest baseline. | Dotted old lane, a dotted arc to a new lane off the head | `small/rebase` |

## E. Reviews and governance

| Concept | Claim | Metaphor | Example |
|---|---|---|---|
| Required reviewers | Nothing merges until every required reviewer approves. | Donut → gate on the trunk, reviewers joined above (2 of 3 squares) | `small/reviews` |
| How reviews work | Open, assign reviewers, approve, merge as a baseline. | Four-panel steps on one recurring branch | `large/how-reviews-work` |
| Stage gates | An item moves one gate at a time. | Timeline: square │ node │ circle | `small/stage-gates` |
| Audit trail | Every change records what, who and why. | Vertical log with entry lines | `small/audit-trail` |
| Verification vs validation | Two signals per item, tracked apart. | Two chains: one all squares, one with donuts | `small/verification-validation` |

## F. Agents and automation

| Concept | Claim | Metaphor | Example |
|---|---|---|---|
| Agents (fleet) | Agents work the whole program at once. | Orbit, satellites spin | `small/agents`, `large/agents-graph` |
| Skills | Standards encoded once hold every artifact in shape. | Triangle: squares at corners, circles on edges | `small/skills` |
| Automations | A change fires the agent, which fans work out. | Circle → node → squares | `small/automations` |
| Webhooks | An outside event crosses one port and starts the work. | Ghost outside a boundary, port, node, fan | `small/webhooks` |
| Scheduled runs | Automations can run on a clock. | Dial of dots, a square orbiting | `small/scheduled` |
| Agent on a branch, human merges | Agents propose; people decide. | Steps panels 03–04 | `large/change-flow` |
| Sandboxed analysis | Calculations run isolated; only results return. | Node → dashed box of dots → square | `small/sandbox` |
| Finder, search | Read-only search finds the few items that matter. | Dot grid with a lens | `small/search` |
| Notifications | The owners of affected items hear about it. | Node → circles with travellers | `small/notifications` |
| Model per session | Each session runs on the model you pick. | Node in a faint ring, one accentDashed spoke to a square | `small/model-per-session` |

## G. Platform

| Concept | Claim | Metaphor | Example |
|---|---|---|---|
| Integrations | Engineers stay in their tools; agents run across them. | Boundary ring with ports, tools outside | `small/integrations` |
| MCP and API | Any AI client connects to the graph through a port. | Boundary ring, ports, squares outside | `small/mcp` |
| External collaboration | Suppliers see only what you share, live. | Hub reaching into a dashed frame | `small/scoped-sharing` |
| Security | The program sits inside nested boundaries. | Concentric rings, one port | `small/security` |
| Deployment options | The same program in cloud, GovCloud, or self-hosted. | 3D stack of alternatives, one more boundary per plane | `large/deployment-stack` |
| Brand moment | Engineering, without the drift. | Lissajous 1:3 with guides | `large/lissajous-hero` |

## Concepts without an example yet (recipes)

| Concept | Recipe |
|---|---|
| Restore deleted | A radial `graph` whose neighbours appear first, then a `ghost` arcs (dotted, `lift`) into its empty slot as a circle and its links redraw. Test it: it can read as "a draft becomes real". |
| Dashboards | `grid` with `selected` forming a bar-like column pattern (keep it abstract, no axes). |
| Comments, mentions | `chain` of circles with one `donut` (open thread) and a fine line to a circle off the chain. |
| SSO, SCIM | `security` rings with a `fan` of circles (people) entering through the port. |
| Write tools opt-in | `mcp` with one port drawn as a `donut` (awaiting approval) instead of a small circle. |

When a concept is new: write the claim, find the closest shape in the motif table in
SKILL.md, start from the example that already uses that motif, and keep the meaning of
every mark (circle = thing, square = result, node = Flow, donut = waiting, ghost = not yet
real, flag = needs a human).
