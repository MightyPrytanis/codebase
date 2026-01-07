# Setup Instructions for Beta Testers

This patch addresses a ReDoS vulnerability in the MCP SDK package by updating the regex pattern used within the `UriTemplate` class. Beta testers should follow these steps:

## Steps:
1. Install dependencies:
   ```sh
   npm install
   ```

2. Apply the patch:
   ```sh
   npx patch-package
   ```

3. Verify the changes:
   Run relevant unit tests or manual tests to ensure that the changes work as expected.

4. Report any issues in the issue tracker for the repository.

Your participation will ensure this fix is robust before it is rolled out widely.