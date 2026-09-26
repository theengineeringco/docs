# Customer API reference sync

This automation reads **only public `/customer-api-json` OpenAPI documents** from production, RVT, and Rivian. It does not call application endpoints, access AWS, or require API keys.

Run from the docs repository:

```sh
python3 -m unittest discover -s scripts -p 'test_*.py' -v
python3 scripts/sync-customer-api.py
```

The sync requires Python 3.10+ and uses only the standard library. It writes `openapi/customer-api.json` when a candidate differs and writes a machine-readable report to `/tmp/customer-api-sync-report.json`. `--report` and `--output` override those locations. Only use `--initialize` when deliberately creating the first snapshot.

The checked-in snapshot includes customer endpoints, removes `/pylon-identity/token` (support-widget identity), prunes unreachable components, merges Branch/Branches, renames the ai reference group Automations, and supplies production/RVT/Rivian servers for the playground. The authored quickstart and authentication pages replace the Swagger overview's shorthand routes and embedded changelog. Endpoint and schema descriptions are preserved.

## Nightly behavior

`.github/workflows/sync-customer-api.yml` runs at 10:00 UTC daily (03:00 PDT / 02:00 PST), or manually through GitHub Actions. It starts operating after this workflow is merged onto the repository's default branch.

1. All three public deployed specs must be fetched and pass structural validation. Any network error, invalid document, or unresolved retained component reference stops publication. The workflow also runs Mintlify 4.2.939 build validation on authored pages and each changed reference candidate before publishing or opening a PR.
2. Compare the complete deployed documents, including unused schemas and descriptions. Object key order and root/path/operation server overrides are ignored. Differences between environments retain the published snapshot and create or update one attention issue.
3. Compare the prepared spec with the checked-in reference. Identical reference content does nothing. Reading a changed deployed spec is the deployment signal; deployments with unchanged public contracts do not generate commits. No backend deployment hook or version file is needed.
4. Description/example changes and new operations/components can update the reference automatically. Any modification or removal of an existing structural contract goes into `automation/customer-api-review` and a preview-labelled review PR. The classifier intentionally prefers review when compatibility is uncertain. Review the impact on authored authentication guidance and integration examples before merging; authored pages never change automatically.
5. An existing review containing the same candidate is left untouched. A rollback, compatible replacement, or tenant divergence closes a superseded review proposal. Divergence/failure reports update one issue instead of creating daily duplicates. Workflow reports are retained as artifacts for 30 days.

A review candidate **does change the local output file**. Only the workflow's `compatible` branch of execution commits to the default branch. Local users should read `status` before deciding where to commit a generated candidate.

## Repository setup

- Enable GitHub Actions for this repository, with permission to create pull requests. The workflow scopes `contents: write`, `pull-requests: write`, and `issues: write` to the sync job.
- Enable GitHub Issues for failure/divergence reporting.
- Permit the Actions bot to push compatible spec updates to the default branch. If repository rules require every update through a PR, use a GitHub App allowed by those rules or change compatible updates to PR-only mode. Rejected writes fail closed and report an issue.
- Keep the dedicated `automation/customer-api-review` branch for automation only; its candidate is replaced using a force-with-lease push. The job refuses to replace a branch containing non-bot amendments and reports the issue for human attention.
- Connect the Mintlify project to this GitHub repository and its default branch, with GitHub synchronization/deployments enabled. A compatible Git commit is published through that integration; this job does not use a Mintlify API token. Mintlify must also have PR previews enabled; a `preview` label alone does not configure preview hosting.
- Commits and PRs created with `GITHUB_TOKEN` do not trigger other GitHub Actions workflows. If documentation deployment or mandatory PR checks depend on a subsequent Actions event rather than Mintlify's GitHub integration, use an appropriately scoped GitHub App token. This workflow runs its own tests before syncing.
- Failure issues are not automatically closed; close them once the cause has been addressed. A missing/denied token can prevent issue reporting too; the GitHub Actions failure remains visible.

The three-server comparison establishes a shared documented contract. Tenant permissions, feature settings, and custom models can still differ and are never read by this job. Newly added schema elements conservatively require review when they change an existing component.
