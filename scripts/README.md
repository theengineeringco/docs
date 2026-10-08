# Customer API reference sync

This automation reads **only public `/customer-api-json` OpenAPI documents** from production, RVT, and Rivian. It does not call application endpoints, access AWS, or require API keys.

Run from the docs repository:

```sh
python3 -m unittest discover -s scripts -p 'test_*.py' -v
node --test scripts/test_api_deployment.mjs
python3 scripts/sync-customer-api.py
```

The sync requires Python 3.10+ and uses only the standard library. It writes `openapi/customer-api.json` when a candidate differs and writes a machine-readable report to `/tmp/customer-api-sync-report.json`. `--report` and `--output` override those locations. Only use `--initialize` when deliberately creating the first snapshot.

The checked-in snapshot includes customer endpoints, removes `/pylon-identity/token` (support-widget identity), prunes unreachable components, merges Branch/Branches, renames the ai reference group Automations, and supplies a `baseUrl` server variable defaulting to the standard Production server. All three deployments remain comparison sources; their server overrides are removed so nightly updates cannot reintroduce the selector. The authored quickstart and authentication pages replace the Swagger overview's shorthand routes and embedded changelog. Known tenant wording in editorial descriptions and titles becomes workspace wording. Wire names, required headers, enum values, and example payloads remain unchanged.

App links supply `apiBaseUrl` to `api-deployment.js`, which validates the HTTPS hosted backend root and applies it through Mintlify's [server-variable API](https://www.mintlify.com/docs/customize/custom-scripts#set-api-playground-server-variables). The selected URL stays in session storage for navigation and reloads in that tab; a new app link replaces it. Invalid links clear the previous selection and restore Production. Direct visits without a stored selection also use Production. API keys are never passed in the URL or copied by this script. On-premises, local, staging, and GovCloud apps use their own Swagger documentation.

The publication policy is permanent: API guides, navigation, and generated reference cannot contain tenant/environment terminology or deployment names. Unhandled references and incoming cURL-only descriptions fail synchronization before the snapshot is written, retaining the published reference for review. `test_api_docs.py` also enforces the three sidebar sections, cURL/Python/JavaScript options for authored requests, all three generated example languages, and syntax checks without making API calls. These checks require Node.js and Bash alongside Python; the sync itself remains standard-library-only.

## Nightly behavior

`.github/workflows/sync-customer-api.yml` runs at 10:00 UTC daily (03:00 PDT / 02:00 PST), or manually through GitHub Actions. It starts operating after this workflow is merged onto the repository's default branch.

1. All three public deployed specs must be fetched and pass structural validation. Any network error, invalid document, or unresolved retained component reference stops publication. The workflow also runs Mintlify 4.2.939 build validation on authored pages and each changed reference candidate before publishing.
2. Compare the complete deployed documents, including unused schemas and descriptions. Object key order and root/path/operation server overrides are ignored. Differences between environments retain the published snapshot and create or update one attention issue.
3. Compare the prepared spec with the checked-in reference. Identical reference content does nothing. Reading a changed deployed spec is the deployment signal; deployments with unchanged public contracts do not generate commits. No backend deployment hook or version file is needed.
4. All validated reference changes publish automatically to the default branch, including modifications and removals of existing endpoints and schemas. The report distinguishes `compatible` additions/editorial changes from `structural` changes for visibility; neither requires approval. Authored authentication guidance, API examples, and automation guides remain separately maintained and never change automatically.
5. Once the reference is synchronized successfully (or already unchanged), close any legacy `automation/customer-api-review` proposal. Failed validation, publication, or deployment divergence leaves that proposal intact. Divergence/failure reports update one issue instead of creating daily duplicates. Workflow reports are retained as artifacts for 30 days.

Both `compatible` and `structural` candidates change the local output file. The workflow publishes either only after Mintlify validation succeeds; `unchanged` and `divergent` results leave the snapshot untouched.

## Repository setup

- Enable GitHub Actions for this repository, with write permission for generated reference commits and permission to close legacy review proposals. The workflow scopes `contents: write`, `pull-requests: write`, and `issues: write` to the sync job.
- Enable GitHub Issues for failure/divergence reporting.
- Permit the Actions bot to push validated spec updates to the default branch. If repository rules require every update through a PR, use a GitHub App allowed by those rules or adjust those rules to allow the automatic reference sync. Rejected writes fail closed and report an issue.
- Connect the Mintlify project to this GitHub repository and its default branch, with GitHub synchronization/deployments enabled. A generated reference commit is published through that integration; this job does not use a Mintlify API token.
- Pushes made with `GITHUB_TOKEN` do not trigger other GitHub Actions workflows. Publishing uses Mintlify's GitHub integration directly; the sync does not create PRs or depend on PR-check approvals. This workflow runs its own tests before syncing and validates each candidate before publishing.
- Failure issues are not automatically closed; close them once the cause has been addressed. A missing/denied token can prevent issue reporting too; the GitHub Actions failure remains visible.

The three-server comparison establishes a shared documented contract. Tenant permissions, feature settings, and custom models can still differ and are never read by this job. Existing-contract changes are recorded in the sync report and publish automatically after validation.
