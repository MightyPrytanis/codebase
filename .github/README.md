# Solo Maintainer PR Self-Approval

## Quick Start

This repository is configured to allow the solo maintainer (@MightyPrytanis) to approve and merge their own pull requests.

### How It Works

1. **Create a PR as normal** - Create your feature branch and open a PR
2. **Automatic Approval** - The GitHub Actions workflow automatically approves your PR
3. **Merge When Ready** - Once CI checks pass, merge your PR

### Documentation

- **Comprehensive Guide:** [`/docs/SOLO_MAINTAINER_PR_GUIDE.md`](../docs/SOLO_MAINTAINER_PR_GUIDE.md)
- **Rulesets Overview:** [`/rulesets/README.md`](rulesets/README.md)
- **Auto-Approval Workflow:** [`/workflows/solo-maintainer-auto-approve.yml`](workflows/solo-maintainer-auto-approve.yml)

### Key Features

✅ **Automated** - No manual approval needed  
✅ **Safe** - Only works for repository owner  
✅ **Transparent** - Clear comments and audit trail  
✅ **Flexible** - Easy to disable when needed  
✅ **Secure** - All CI checks still required  

### Disabling

To disable auto-approval:

```bash
# Option 1: Delete the workflow
git rm .github/workflows/solo-maintainer-auto-approve.yml

# Option 2: Disable in GitHub UI
# Actions → Solo Maintainer Auto-Approve → "..." → Disable
```

### Support

- See [Troubleshooting Guide](../docs/SOLO_MAINTAINER_PR_GUIDE.md#troubleshooting)
- Check workflow logs in Actions tab
- Review [GitHub Rulesets Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)
