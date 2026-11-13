# Diagrams

Draw branching and history diagrams as Mermaid `gitGraph` blocks; Mintlify renders
them natively, so they ship with the page instead of waiting on a placeholder. Use a
`VisualPlaceholder` only for screenshots and for diagrams Mermaid cannot express.

Start every `gitGraph` with this init line so branches use Flow's palette and the
main line is called **Base**:

```
%%{init: {"theme": "base", "gitGraph": {"mainBranchName": "Base", "rotateCommitLabel": false}, "themeVariables": {"fontFamily": "Inter, sans-serif", "git0": "#1F3ACB", "git1": "#646461", "git2": "#C9A227", "git3": "#979692", "git4": "#4F6BED", "git5": "#8A6D1B", "gitBranchLabel0": "#ffffff", "gitBranchLabel1": "#ffffff", "gitBranchLabel2": "#1a1a1a", "gitBranchLabel3": "#ffffff", "gitBranchLabel4": "#ffffff", "gitBranchLabel5": "#ffffff", "commitLabelColor": "#3a3a38", "commitLabelBackground": "#F6F6F3", "tagLabelColor": "#1F3ACB", "tagLabelBackground": "#EEF1FD", "tagLabelBorder": "#1F3ACB"}}}%%
```

Conventions:

- A commit is a recorded change; label it with the value or the change, not "commit".
- A `merge` is a Flow merge, or an update from the parent when the parent merges into
  the child. Tag merges into a parent with `Merge: <branch>`, matching the record Flow
  creates.
- Use `tag:` for baselines and `type: REVERSE` for reverts.
- Branch names have no spaces; use hyphens (`Trade-study`). Commit ids must be unique
  within a diagram.
- Keep each diagram to the one action the section explains. Follow the diagram with a
  sentence that says what it shows.
- Check every diagram in `mint dev` before pushing; a syntax error renders as an error
  box on the page.
