---
Document ID: SOLO-MAINTAINER-PR-GUIDE
Title: Solo Maintainer Pull Request Self-Approval Guide
Subject(s): GitHub | Pull Requests | Branch Protection | Solo Developer Workflows
Project: Cyrano
Version: v606
Created: 2026-02-08 (2026-W06)
Last Substantive Revision: 2026-02-08 (2026-W06)
Last Format Update: 2026-02-08 (2026-W06)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Summary: Comprehensive guide for solo maintainers to approve and merge their own pull requests with branch protection enabled
Status: Active
Related Documents: .github/rulesets/README.md, .github/workflows/solo-maintainer-auto-approve.yml
---

# Solo Maintainer Pull Request Self-Approval Guide

**Purpose:** Enable solo developers/maintainers to approve and merge their own pull requests without compromising repository security  
**Status:** Active - Solution Implemented  
**Last Updated:** 2026-02-08

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Solution Overview](#solution-overview)
3. [Implementation Details](#implementation-details)
4. [Usage Guide](#usage-guide)
5. [Configuration Options](#configuration-options)
6. [Troubleshooting](#troubleshooting)
7. [Security Considerations](#security-considerations)
8. [Transitioning to Team Development](#transitioning-to-team-development)

---

## Problem Statement

### The Challenge

Solo developers and maintainers often face a frustrating challenge with GitHub's branch protection rules:

- **Cannot approve their own PRs:** GitHub doesn't allow PR authors to approve their own pull requests
- **Branch protection blocks merging:** Repository security settings require at least one approving review
- **Unnecessary friction:** For one-person repositories, this creates a workflow blocker with no security benefit
- **No built-in solution:** GitHub doesn't provide a native "solo developer mode"

### Why This Matters

For solo maintainers:
- You maintain code quality through PR reviews without needing external approval
- You want branch protection for safety (prevent accidental force pushes, require CI checks)
- You need to maintain velocity without artificial blockers
- You are both the author AND the reviewer - both roles are legitimate

### Traditional Workarounds (And Why They're Bad)

❌ **Disable branch protection entirely**
- Loses valuable safety features (CI checks, linear history, etc.)
- Risk of accidental force pushes or direct commits to main

❌ **Create a bot account for approvals**
- Violates GitHub Terms of Service (fake accounts)
- Adds maintenance overhead
- Not a sustainable solution

❌ **Push directly to main**
- Bypasses CI/CD workflows
- Loses PR-based code review history
- Makes tracking changes difficult

✅ **This Solution:** Automated self-approval with GitHub Actions + Ruleset configuration

---

## Solution Overview

This repository implements a two-part solution:

### Part 1: Ruleset Bypass Configuration

**File:** `.github/rulesets/main-ruleset.json`

Configures GitHub rulesets to allow Repository Admins to bypass pull request requirements:

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

**What This Does:**
- Grants Repository Admins the ability to bypass PR approval requirements
- Doesn't automatically approve - just removes the restriction
- Works in conjunction with the auto-approval workflow

### Part 2: Auto-Approval Workflow

**File:** `.github/workflows/solo-maintainer-auto-approve.yml`

GitHub Actions workflow that automatically approves PRs created by the repository owner:

**Triggers:**
- When a PR is opened, synchronized, reopened, or marked ready for review

**Conditions:**
- PR author must be the repository owner (`MightyPrytanis`)
- PR must not be in draft mode
- Automatically approves and adds informative comments

**Benefits:**
- ✓ Fully automated - no manual steps required
- ✓ Transparent - clear comments explain what happened
- ✓ Safe - only works for the repository owner
- ✓ Flexible - easy to disable or customize

---

## Implementation Details

### Ruleset Configuration

The ruleset bypass is configured using GitHub's Repository Role IDs:

| Role ID | Role Name          | Description                          |
|---------|-------------------|--------------------------------------|
| 1       | Repository Reader  | Read-only access                     |
| 2       | Repository Triager | Can manage issues and PRs            |
| 3       | Repository Writer  | Can push to branches                 |
| 4       | Repository Maintainer | Can manage some settings          |
| 5       | Repository Admin   | Full administrative access           |

**Why Actor ID 5 (Admin)?**
- Solo maintainers are typically repository admins
- Ensures only users with full repository control can bypass
- Maintains security for any future collaborators

### Workflow Permissions

The auto-approval workflow requires these permissions:

```yaml
permissions:
  contents: write       # Required to read PR content
  pull-requests: write  # Required to approve PRs and add comments
```

These permissions are scoped to the workflow run and don't grant persistent access.

### Workflow Logic Flow

```
PR Created by Owner
    ↓
Workflow Triggers
    ↓
Check: Is author the repository owner?
    ↓ (Yes)
Auto-approve PR
    ↓
Add "solo-maintainer-approved" label
    ↓
Post informative comment
    ↓
Owner can now merge (after CI checks pass)
```

### Files Modified/Created

1. **Modified:** `.github/rulesets/main-ruleset.json`
   - Updated `bypass_actors` configuration
   - Changed from null placeholder to active admin bypass

2. **Created:** `.github/workflows/solo-maintainer-auto-approve.yml`
   - New GitHub Actions workflow
   - Handles automatic PR approval

3. **Updated:** `.github/rulesets/README.md`
   - Added comprehensive solo maintainer documentation
   - Included usage examples and troubleshooting

4. **Created:** `docs/SOLO_MAINTAINER_PR_GUIDE.md` (this file)
   - Comprehensive guide for solo maintainers
   - Usage instructions and best practices

---

## Usage Guide

### Creating and Merging a PR

#### Step 1: Create Your Feature Branch

```bash
# Create and checkout a new branch
git checkout -b feature/my-awesome-feature

# Make your changes
vim src/my-file.js

# Commit your changes
git add .
git commit -m "Add awesome new feature"

# Push to GitHub
git push origin feature/my-awesome-feature
```

#### Step 2: Open a Pull Request

**Option A: GitHub Web UI**
1. Navigate to your repository on GitHub
2. Click "Compare & pull request" button
3. Fill in PR title and description
4. Click "Create pull request"

**Option B: GitHub CLI**
```bash
gh pr create --title "Add awesome feature" --body "Description of changes"
```

**Option C: Git CLI with URL**
```bash
# Push will output a URL to create PR
git push origin feature/my-awesome-feature
# Follow the URL in the output
```

#### Step 3: Automatic Approval

**What Happens Automatically:**
1. GitHub Actions workflow triggers
2. Workflow checks that you're the repository owner
3. Workflow approves your PR
4. Workflow adds a comment explaining the auto-approval
5. Workflow adds `solo-maintainer-approved` label (if labels exist)

**You'll See:**
- ✅ An approval from "github-actions[bot]"
- 💬 A comment explaining the auto-approval
- 🏷️ A label indicating solo maintainer approval

#### Step 4: Wait for CI Checks

**Required Checks:**
- All status checks must pass (CodeQL, Snyk, tests, etc.)
- Branch must be up-to-date with main (if strict checks enabled)
- All conversation threads must be resolved

**Viewing Check Status:**
```bash
# Via GitHub CLI
gh pr checks

# Via Web UI
# Look for green checkmarks next to each check
```

#### Step 5: Merge Your PR

Once approved and all checks pass:

**Option A: GitHub Web UI**
1. Click "Merge pull request" button
2. Choose merge strategy:
   - "Squash and merge" (recommended for clean history)
   - "Rebase and merge" (maintains individual commits)
   - ~~"Merge commit"~~ (blocked by linear history requirement)

**Option B: GitHub CLI**
```bash
# Squash merge (recommended)
gh pr merge --squash --delete-branch

# Rebase merge
gh pr merge --rebase --delete-branch

# Auto-merge (merges when checks pass)
gh pr merge --auto --squash
```

**Option C: Let GitHub Auto-Merge**
```bash
# Enable auto-merge via CLI
gh pr merge --auto --squash --delete-branch

# Or via Web UI
# Click "Enable auto-merge" → Choose "Squash and merge"
```

### Example Complete Workflow

```bash
# 1. Create feature branch
git checkout -b feature/update-readme
git commit -am "Update README with new instructions"
git push origin feature/update-readme

# 2. Create PR
gh pr create --title "Update README" --body "Added setup instructions"

# 3. Wait for auto-approval (happens automatically)

# 4. Check CI status
gh pr checks

# 5. Merge when ready
gh pr merge --squash --delete-branch

# 6. Pull latest main
git checkout main
git pull
```

---

## Configuration Options

### Customizing the Workflow

#### Change Who Can Auto-Approve

Edit `.github/workflows/solo-maintainer-auto-approve.yml`:

```yaml
# Current: Only repository owner
if: github.event.pull_request.user.login == 'MightyPrytanis'

# Allow multiple users (for small teams)
if: |
  github.event.pull_request.user.login == 'MightyPrytanis' ||
  github.event.pull_request.user.login == 'TrustedCollaborator'

# Allow any repository admin
if: github.event.pull_request.user.permissions.admin == true
```

#### Skip Auto-Approval for Certain Branches

```yaml
# Add to job conditions
if: |
  github.event.pull_request.user.login == 'MightyPrytanis' &&
  github.event.pull_request.draft == false &&
  !startsWith(github.event.pull_request.head.ref, 'release/')
```

#### Add Required Labels or Checks

```yaml
# After auto-approval step, add checks
- name: Verify required label
  run: |
    LABELS=$(gh pr view ${{ github.event.pull_request.number }} --json labels -q '.labels[].name')
    if ! echo "$LABELS" | grep -q "ready-to-merge"; then
      echo "Missing required label: ready-to-merge"
      exit 1
    fi
```

### Disabling Auto-Approval

#### Temporary Disable (keep workflow file)

**Method 1: Disable in GitHub UI**
1. Go to repository Settings → Actions → General
2. Under "Workflow permissions", adjust as needed

**Method 2: Edit workflow condition**
```yaml
# Change the if condition to always be false
if: false  # Auto-approval disabled
```

**Method 3: Rename workflow file**
```bash
# Workflows ending in .disabled are ignored
mv .github/workflows/solo-maintainer-auto-approve.yml \
   .github/workflows/solo-maintainer-auto-approve.yml.disabled
```

#### Permanent Disable (remove workflow)

```bash
git rm .github/workflows/solo-maintainer-auto-approve.yml
git commit -m "Remove solo maintainer auto-approval workflow"
git push
```

### Modifying Ruleset Bypass

If you want to change who can bypass ruleset restrictions:

#### Edit `.github/rulesets/main-ruleset.json`

```json
// Option 1: Keep admin bypass (current)
"bypass_actors": [
  {
    "actor_id": 5,
    "actor_type": "RepositoryRole",
    "bypass_mode": "always"
  }
]

// Option 2: Add specific user bypass (requires GitHub user ID)
"bypass_actors": [
  {
    "actor_id": 12345678,  // Your GitHub user ID
    "actor_type": "User",
    "bypass_mode": "always"
  }
]

// Option 3: Allow bypass only via PRs (not direct push)
"bypass_actors": [
  {
    "actor_id": 5,
    "actor_type": "RepositoryRole",
    "bypass_mode": "pull_request"  // Changed from "always"
  }
]

// Option 4: No bypass (strict enforcement)
"bypass_actors": []
```

#### Apply Ruleset Changes

After editing `main-ruleset.json`, you need to apply it via GitHub:

**Via GitHub UI:**
1. Go to Settings → Rules → Rulesets
2. If ruleset exists: Edit and update
3. If new: Click "Import a ruleset" and select the JSON file

**Via GitHub CLI:**
```bash
# List existing rulesets
gh api repos/MightyPrytanis/codebase/rulesets

# Update ruleset (requires ruleset ID)
gh api repos/MightyPrytanis/codebase/rulesets/RULESET_ID \
  -X PUT \
  --input .github/rulesets/main-ruleset.json
```

---

## Troubleshooting

### Workflow Not Running

**Problem:** PR created but no auto-approval appears

**Solutions:**

1. **Check workflow is enabled:**
   ```bash
   gh workflow list
   # Look for "Solo Maintainer Auto-Approve"
   ```

2. **Check workflow permissions:**
   - Go to Settings → Actions → General → Workflow permissions
   - Ensure "Read and write permissions" is enabled
   - OR explicitly grant permissions in workflow file

3. **Check PR author:**
   ```bash
   # Workflow only runs for repository owner
   gh pr view <PR_NUMBER> --json author
   ```

4. **Check draft status:**
   ```bash
   # Workflow skips draft PRs
   gh pr view <PR_NUMBER> --json isDraft
   ```

5. **View workflow run logs:**
   ```bash
   gh run list --workflow="Solo Maintainer Auto-Approve"
   gh run view <RUN_ID> --log
   ```

### Approval Present But Can't Merge

**Problem:** PR is approved but merge button is disabled

**Possible Causes:**

1. **Status checks not passing:**
   ```bash
   gh pr checks
   # All checks must be green
   ```

2. **Branch not up-to-date:**
   ```bash
   # Update branch with main
   git checkout feature-branch
   git merge main
   git push
   ```

3. **Unresolved conversations:**
   - Review all conversation threads
   - Resolve or comment on each one

4. **Commit signature missing:**
   ```bash
   # If signatures required, ensure commits are signed
   git log --show-signature
   
   # Set up GPG signing
   git config --global commit.gpgsign true
   ```

5. **Linear history violation:**
   ```bash
   # Use rebase instead of merge
   git rebase main
   git push --force-with-lease
   ```

### "Required status check missing" Error

**Problem:** Can't merge because status check "xyz" is missing

**Solutions:**

1. **Update ruleset with actual check names:**
   - Edit `.github/rulesets/main-ruleset.json`
   - Replace placeholder check names with your actual CI job names
   - Apply the updated ruleset

2. **Find your actual check names:**
   ```bash
   # List checks for a PR
   gh pr checks <PR_NUMBER>
   
   # Use the exact names shown in the output
   ```

3. **Temporarily disable specific checks:**
   - Go to Settings → Rules → Rulesets
   - Edit ruleset
   - Remove or modify required status checks

### Bypass Not Working

**Problem:** Even with bypass configured, still can't approve own PR

**Solutions:**

1. **Verify admin status:**
   ```bash
   # Check your permissions
   gh api repos/MightyPrytanis/codebase/collaborators/MightyPrytanis/permission
   ```

2. **Check ruleset is applied:**
   ```bash
   # List active rulesets
   gh api repos/MightyPrytanis/codebase/rulesets
   ```

3. **Verify bypass mode:**
   - Ensure `bypass_mode` is set to `"always"` (not `"pull_request"`)
   - Check `actor_id` matches your role/user ID

4. **Use workflow approval:**
   - Even if bypass fails, the workflow should still approve
   - Check workflow run logs for errors

---

## Security Considerations

### What This Solution Maintains

✅ **CI/CD Enforcement:**
- All status checks still required
- Code must pass tests, security scans, linting

✅ **Linear History:**
- Merge commits still blocked
- Forces squash or rebase merging

✅ **Conversation Resolution:**
- All review threads must be resolved
- Encourages thorough self-review

✅ **Audit Trail:**
- All PRs tracked in GitHub history
- Auto-approval clearly documented in comments

✅ **Commit Signatures:**
- Signed commits still required (if configured)
- Maintains cryptographic verification

### What This Solution Changes

⚠️ **Review Requirement:**
- Removes need for external reviewer
- Solo maintainer approves own work

**Mitigation:**
- Self-review is still valuable for quality
- PR workflow encourages structured review
- CI checks catch many issues automatically

### Best Practices for Solo Maintainers

1. **Use PRs for all changes:**
   - Never push directly to main
   - Maintain PR-based workflow even alone

2. **Write good PR descriptions:**
   - Explain what changed and why
   - Link to issues or context
   - Future-you will thank present-you

3. **Wait for CI checks:**
   - Don't bypass status checks
   - Fix failing tests before merging

4. **Review your own diffs:**
   - Look at the "Files changed" tab
   - Catch mistakes before merging
   - Consider implications of changes

5. **Keep branch protection:**
   - Don't disable rulesets entirely
   - Maintain the safety net

6. **Use draft PRs:**
   - Mark work-in-progress as draft
   - Auto-approval won't trigger
   - Convert to ready when done

### When NOT to Use This Solution

❌ **Multiple active contributors:**
- If others are regularly contributing, disable auto-approval
- Use traditional PR review process

❌ **Public repositories with community contributions:**
- External PRs won't auto-approve (by design)
- Review all external contributions manually

❌ **Compliance requirements:**
- Some industries require multi-party review
- Check your organization's policies

❌ **Learning/educational projects:**
- If practicing collaborative workflows
- Keep traditional review process for practice

---

## Transitioning to Team Development

### When to Disable Solo Maintainer Mode

Consider disabling when:
- Adding regular contributors
- Growing beyond 1-2 developers
- Requiring true multi-party review
- Compliance mandates separate reviewers

### Migration Steps

#### 1. Disable Auto-Approval Workflow

```bash
# Option A: Delete workflow
git rm .github/workflows/solo-maintainer-auto-approve.yml

# Option B: Disable in UI
# Go to Actions → Solo Maintainer Auto-Approve → "..." → Disable

# Option C: Rename to disable
mv .github/workflows/solo-maintainer-auto-approve.yml \
   .github/workflows/solo-maintainer-auto-approve.yml.disabled
```

#### 2. Update Ruleset Bypass (Optional)

Decide if you want to keep admin bypass for flexibility:

**Keep bypass for admin emergencies:**
```json
// No changes needed - admins can still bypass in emergencies
```

**Remove all bypass:**
```json
"bypass_actors": []
```

#### 3. Update CODEOWNERS

Add team members as code owners:

```bash
# Edit .github/CODEOWNERS
# Add team members for specific paths

# Example:
/frontend/**/*.tsx @MightyPrytanis @FrontendDev
/backend/**/*.go @MightyPrytanis @BackendDev
* @MightyPrytanis  # Fallback owner
```

#### 4. Configure Team Review Requirements

Update ruleset to require specific reviewers:

```json
{
  "type": "pull_request",
  "parameters": {
    "required_approving_review_count": 2,  // Increased from 1
    "dismiss_stale_reviews_on_push": true,
    "require_code_owner_review": true
  }
}
```

#### 5. Communicate Changes

Create a PR updating team documentation:
```markdown
# Team Review Process

As of [DATE], we've disabled solo maintainer auto-approval:

- All PRs require review from another team member
- Code owners must approve changes to their areas
- Follow standard GitHub PR review process

## New Workflow
1. Create PR
2. Request review from relevant team member
3. Address feedback
4. Merge after approval
```

### Keeping Flexibility

Consider a hybrid approach:

```yaml
# In workflow file, allow both solo and reviewed PRs
if: |
  (github.event.pull_request.user.login == 'MightyPrytanis' &&
   contains(github.event.pull_request.labels.*.name, 'solo-maintainer')) ||
  github.event.pull_request.reviews[0].state == 'approved'
```

This allows:
- Manual reviews for team PRs
- Auto-approval for solo work (with explicit label)

---

## Additional Resources

### GitHub Documentation

- [About Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [About Rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)
- [About CODEOWNERS](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)
- [GitHub Actions Permissions](https://docs.github.com/en/actions/security-guides/automatic-token-authentication)
- [Approving Pull Requests via CLI](https://cli.github.com/manual/gh_pr_review)

### Related Repository Files

- `.github/rulesets/main-ruleset.json` - Ruleset configuration
- `.github/rulesets/README.md` - Rulesets overview and usage
- `.github/workflows/solo-maintainer-auto-approve.yml` - Auto-approval workflow
- `.github/CODEOWNERS` - Code ownership configuration
- `.github/workflows/dependabot-auto-merge.yml` - Similar pattern for Dependabot

### Finding Your GitHub User ID

If you need your GitHub user ID for bypass configuration:

```bash
# Via GitHub CLI
gh api users/MightyPrytanis | jq '.id'

# Via curl
curl https://api.github.com/users/MightyPrytanis | jq '.id'

# Via web browser
# Visit: https://api.github.com/users/MightyPrytanis
# Look for "id" field
```

### Example Workflows

See these repository workflows for patterns and examples:
- `.github/workflows/dependabot-auto-merge.yml` - Auto-merge for Dependabot
- `.github/workflows/ci.yml` - CI status checks
- `.github/workflows/codeql.yml` - Security scanning

---

## Changelog

| Date       | Version | Changes                                    |
|------------|---------|-------------------------------------------|
| 2026-02-08 | v606    | Initial creation - Solo maintainer solution |

---

## Support and Feedback

If you encounter issues with this solution:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review workflow run logs in the Actions tab
3. Verify your configuration against the examples
4. Check GitHub status page for API issues

For questions or improvements:
- Open an issue in the repository
- Create a PR with proposed changes
- Contact the repository maintainer

---

*Last updated: 2026-02-08 | Version: v606*
