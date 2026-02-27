# Repository Rulesets

This directory contains GitHub repository rulesets for branch protection and workflow enforcement.

## Solo Maintainer Support

**For solo developers/maintainers:** This repository is configured to support self-approval and self-merging of PRs. See the [Solo Maintainer Configuration](#solo-maintainer-configuration) section below for details.

## Main Branch Ruleset

The `main-ruleset.json` file defines protection rules for the `main` branch.

### Rules Enforced

1. **Required Pull Request Reviews**
   - At least 1 approving review required
   - Stale reviews are dismissed on new pushes
   - CODEOWNERS reviews are required (see `.github/CODEOWNERS`)
   - All conversations must be resolved before merging

2. **Required Status Checks**
   - Strict status checks disabled (up-to-date requirement relaxed for bot PRs)
   - Required checks (matched to actual CI job names in `.github/workflows/ci.yml`):
     - `Run Tests` - Cyrano TypeScript build and unit tests
     - `Security Scan` - Snyk code security scanning
   - **Important**: The `main-ruleset.json` in this directory is documentation for the ruleset configuration. After merging this PR, you must also manually update the **enforced** ruleset in GitHub Settings → Rules → Rulesets → Main Branch Protection to replace the old placeholder check names (`snyk/scan`, `zap-scan`) with the ones above. The old placeholders never matched any real check and prevented all PRs from auto-merging.

3. **Required Commit Signatures**
   - All commits must be signed with GPG/SSH keys

4. **Required Linear History**
   - Merge commits are not allowed; use squash or rebase merging

5. **Required Conversation Resolution**
   - All review conversations must be resolved before merging

6. **Block Force Pushes**
   - Force pushes to the main branch are blocked (via `non_fast_forward` rule)

## Solo Maintainer Configuration

### Problem Statement

Solo developers and maintainers often face a challenge with GitHub's branch protection rules: they cannot approve their own pull requests. This creates unnecessary friction for one-person repositories where the owner is both the contributor and the reviewer.

### Solution Implemented

This repository implements a two-part solution to enable solo maintainer self-approval:

#### 1. Ruleset Bypass Configuration

The `main-ruleset.json` file includes a `bypass_actors` configuration that allows **Repository Admins** to bypass pull request requirements:

```json
"bypass_actors": [
  {
    "_comment": "Repository admins can bypass pull request requirements for solo maintainer workflows.",
    "actor_id": 5,
    "actor_type": "RepositoryRole",
    "bypass_mode": "always"
  }
]
```

**Key Details:**
- `actor_id: 5` represents the "Repository Admin" role in GitHub
- `actor_type: "RepositoryRole"` targets role-based access (not individual users)
- `bypass_mode: "always"` allows admins to bypass all ruleset restrictions

**GitHub Repository Roles by ID:**
- `1` = Repository Reader
- `2` = Repository Triager
- `3` = Repository Writer
- `4` = Repository Maintainer
- `5` = Repository Admin

#### 2. Auto-Approval Workflow

The `.github/workflows/solo-maintainer-auto-approve.yml` workflow automatically approves PRs created by the repository owner:

**Workflow Behavior:**
- Triggers on PR events: `opened`, `synchronize`, `reopened`, `ready_for_review`
- Only runs for PRs created by the repository owner (`MightyPrytanis`)
- Skips draft PRs (only approves when ready for review)
- Automatically approves the PR with a descriptive comment
- Adds a `solo-maintainer-approved` label (if labels exist)
- Posts an informative comment explaining the auto-approval

**Workflow Features:**
- ✓ Safe: Only activates for PRs created by the repository owner
- ✓ Transparent: Adds comments explaining the auto-approval
- ✓ Flexible: Can be disabled by deleting or editing the workflow file
- ✓ Non-intrusive: Doesn't affect PRs from other contributors (if any)

### How to Use

1. **Create a PR as normal:**
   ```bash
   git checkout -b feature/my-feature
   # Make your changes
   git commit -m "Add feature"
   git push origin feature/my-feature
   # Create PR via GitHub UI or gh CLI
   ```

2. **Automatic approval:**
   - The workflow automatically approves your PR
   - You'll see an approval from "github-actions[bot]"
   - A comment explains the auto-approval

3. **Merge your PR:**
   - Once status checks pass, you can merge immediately
   - Use "Squash and merge" or "Rebase and merge" (merge commits are blocked)

### Disabling Solo Maintainer Auto-Approval

If you want to disable auto-approval (e.g., when adding team members):

**Option 1: Delete the workflow**
```bash
git rm .github/workflows/solo-maintainer-auto-approve.yml
git commit -m "Disable solo maintainer auto-approval"
git push
```

**Option 2: Disable in GitHub UI**
1. Go to Actions tab
2. Find "Solo Maintainer Auto-Approve" workflow
3. Click "..." → "Disable workflow"

**Option 3: Update the condition**
Edit `.github/workflows/solo-maintainer-auto-approve.yml` and change the `if` condition to always be false:
```yaml
if: false  # Disabled
```

### For Team Repositories

If you're transitioning from solo to team:

1. **Disable the auto-approval workflow** (see above)
2. **Keep the ruleset bypass** for admin flexibility
3. **Add team members** to CODEOWNERS file
4. **Configure different approval rules** if needed

### Troubleshooting

**Problem:** Workflow doesn't approve my PR
- Check that you're logged in as `MightyPrytanis` (the repository owner)
- Ensure the PR is not in draft mode
- Check Actions tab for workflow run logs
- Verify workflow has necessary permissions (`contents: write`, `pull-requests: write`)

**Problem:** Can't merge after approval
- Ensure all required status checks pass
- Check that your branch is up-to-date with main
- Verify commit signatures if required
- Review any pending conversation threads

**Problem:** Want to require actual reviews for certain files
- Update CODEOWNERS with specific reviewers for those files
- Create a separate ruleset for sensitive directories
- Use GitHub's "Required reviewers" feature in branch protection settings

### Updating Placeholder Status Check Names

The ruleset currently includes placeholder status check names (`snyk/scan` and `zap-scan`). To update these with your actual CI/CD job names:

1. **Via GitHub UI:**
   - Navigate to Settings → Rules → Rulesets
   - Edit the "Main Branch Protection" ruleset
   - Update the "Required status checks" section with your actual job names
   - Save the ruleset

2. **Via Rulesets API:**
   ```bash
   # Get the ruleset ID
   curl -H "Authorization: token YOUR_GITHUB_TOKEN" \
     https://api.github.com/repos/MightyPrytanis/codebase/rulesets

   # Update the ruleset
   curl -X PUT \
     -H "Authorization: token YOUR_GITHUB_TOKEN" \
     -H "Content-Type: application/json" \
     -d @main-ruleset.json \
     https://api.github.com/repos/MightyPrytanis/codebase/rulesets/RULESET_ID
   ```

3. **Finding Your Actual Job Names:**
   - Go to Actions tab in your repository
   - Click on a workflow run
   - The job names displayed are what you should use in the ruleset
   - Example: If your Snyk workflow shows "security / snyk-test", use "security / snyk-test"

## Applying the Ruleset

### Option 1: Via Pull Request (Recommended)

This ruleset is included in a pull request. Once the PR is merged to `main`:

1. Navigate to your repository Settings → Rules → Rulesets
2. Click "Import a ruleset"
3. Select the `main-ruleset.json` file from `.github/rulesets/`
4. Review and create the ruleset

### Option 2: Via GitHub Rulesets API

```bash
# Create a new ruleset from the JSON file
curl -X POST \
  -H "Authorization: token YOUR_GITHUB_TOKEN" \
  -H "Content-Type: application/json" \
  -d @.github/rulesets/main-ruleset.json \
  https://api.github.com/repos/MightyPrytanis/codebase/rulesets
```

### Option 3: Manual Configuration via UI

1. Go to Settings → Rules → Rulesets
2. Click "New ruleset" → "New branch ruleset"
3. Configure according to the rules listed above
4. Apply to the `main` branch

## Moving the /IP/ Folder to a Private Repository

The `/IP/` folder contains sensitive intellectual property and should be moved to a separate private repository. This approach:

- Keeps sensitive IP isolated and secure
- Allows granular access control
- Maintains clean separation of concerns
- Enables the main repo to remain public (if desired)

### Recommended Approach: Git Submodule

Use a git submodule to reference the private IP repository from this main repository.

#### Step-by-Step Checklist

- [ ] **Create the private repository**
  ```bash
  # Via GitHub CLI
  gh repo create MightyPrytanis/ip-private --private --clone
  
  # Or via GitHub web UI: New Repository → set to Private
  ```

- [ ] **Move IP folder contents to the new private repo**
  ```bash
  # If IP/ folder exists locally (not in git):
  # Copy the IP/ folder contents to the new private repo
  cp -r IP/* /path/to/ip-private/
  cd /path/to/ip-private/
  git add .
  git commit -m "Initial commit: Move IP folder from main codebase"
  git push origin main
  ```

- [ ] **Remove IP/ folder from main repo (if tracked)**
  ```bash
  # Note: IP/ is already in .gitignore, so it's not tracked
  # If it were tracked, you would run:
  # git rm -r IP/
  # git commit -m "Remove IP folder (moved to private repository)"
  ```

- [ ] **Add the private repo as a submodule**
  ```bash
  cd /path/to/codebase
  git submodule add git@github.com:MightyPrytanis/ip-private.git IP
  git commit -m "Add IP private repository as submodule"
  git push
  ```

- [ ] **Update .gitignore (if needed)**
  ```bash
  # Remove IP/ from .gitignore since it's now a submodule
  # Edit .gitignore and remove the "IP/" line
  git add .gitignore
  git commit -m "Update .gitignore: IP is now a submodule"
  git push
  ```

- [ ] **Clone with submodules in the future**
  ```bash
  # Clone the repo with submodules
  git clone --recurse-submodules git@github.com:MightyPrytanis/codebase.git
  
  # Or if already cloned, initialize submodules
  git submodule update --init --recursive
  ```

#### Sample .gitmodules File

Once you add the submodule, git will create a `.gitmodules` file:

```ini
[submodule "IP"]
	path = IP
	url = git@github.com:MightyPrytanis/ip-private.git
```

A template `.gitmodules` file is included in the repository root for reference.

### Alternative Approach: Package Dependency

If the IP folder contains code that can be packaged (e.g., npm package, Python package):

1. Create a private package repository (npm, PyPI, etc.)
2. Package the IP code and publish to the private registry
3. Add the private package as a dependency in this repo's `package.json` or `requirements.txt`
4. Configure authentication for the private registry

Example for npm:
```json
{
  "dependencies": {
    "@mightyprytanis/ip-private": "^1.0.0"
  }
}
```

Configure npm to authenticate to your private registry:
```bash
npm config set @mightyprytanis:registry https://npm.pkg.github.com/
npm login --registry=https://npm.pkg.github.com/
```

## CODEOWNERS Integration

The `.github/CODEOWNERS` file defines code ownership:

- `@MightyPrytanis` is the default owner for all files
- The `/IP/` folder (if present) requires explicit review from `@MightyPrytanis`

When the `/IP/` folder is moved to a private repository and added as a submodule, the CODEOWNERS pattern will still apply to that submodule directory in this repository.

## Security Best Practices

1. **Enable Two-Factor Authentication (2FA)** for all repository contributors
2. **Use SSH keys or GPG keys** for commit signing
3. **Review security alerts** regularly in the Security tab
4. **Keep dependencies updated** to patch known vulnerabilities
5. **Run security scans** (Snyk, ZAP, etc.) before merging
6. **Limit repository access** to only those who need it
7. **Audit repository access logs** periodically

## Additional Resources

- [GitHub Rulesets Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)
- [CODEOWNERS Documentation](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)
- [Git Submodules Documentation](https://git-scm.com/book/en/v2/Git-Tools-Submodules)
- [Commit Signature Verification](https://docs.github.com/en/authentication/managing-commit-signature-verification)
