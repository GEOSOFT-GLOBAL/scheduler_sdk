Here's a comprehensive walkthrough for publishing your scoped npm package, from account setup to post-publish verification.

---

## Phase 1: Account & Organization Setup

### 1. Create Your npm Account
- Go to [npmjs.com/signup](https://www.npmjs.com/signup)
- Choose a **username** (this can also serve as your personal scope, e.g., `@arziblack`)
- Verify your email address

### 2. Enable 2FA (Strongly Recommended)
- Go to Account Settings → Security
- Enable two-factor authentication
- Choose **"Authorization and Publishing"** for maximum security

### 3. Create the Organization Scope
- Visit [npmjs.com/org/create](https://www.npmjs.com/org/create)
- Enter `geo-soft` (no `@` symbol — npm adds it automatically)
- Select **"Unlimited public packages — Free"** and click **Create**
- You now own the `@geo-soft` scope

---

## Phase 2: Local Project Preparation

### 4. Verify Your package.json
Your existing config is mostly correct. Double-check these critical fields:

```json
{
  "name": "@geo-soft/timetablely-sdk",
  "version": "1.0.0",
  "publishConfig": {
    "access": "public"
  },
  "files": ["dist", "styles", "README.md"]
}
```

**Key requirements:**
- Name must match your scope exactly (`@geo-soft/...`)
- `version` must follow semver and be unique (never published before)
- `files` whitelists what gets published

### 5. Ensure Your Build Outputs Exist
```bash
pnpm install
pnpm build
```

Verify these files exist:
```
dist/timetablely-sdk.es.js
dist/timetablely-sdk.umd.js
dist/index.d.ts
styles/scheduler.css
README.md
```

### 6. Write a Proper README.md
Required sections for npm:
- **Installation**: `npm install @geo-soft/timetablely-sdk`
- **Usage**: Code examples showing import/require
- **API Documentation**: Props, methods, configuration options
- **Peer Dependencies**: Note that React >=18 is required
- **License**: Reference Apache-2.0

### 7. Include a LICENSE File
Create `LICENSE` in your project root with the Apache-2.0 text. npm will include it automatically even if not in `files`.

---

## Phase 3: Pre-Publish Verification

### 8. Test with npm pack
```bash
npm pack
```

This creates `@geo-soft-timetablely-sdk-1.0.0.tgz`. Inspect it:

```bash
tar -tzf @geo-soft-timetablely-sdk-1.0.0.tgz
```

Expected contents:
```
package/dist/timetablely-sdk.es.js
package/dist/timetablely-sdk.umd.js
package/dist/index.d.ts
package/styles/scheduler.css
package/README.md
package/package.json
```

### 9. Test Local Installation
```bash
# In a fresh test directory
mkdir test-install && cd test-install
npm init -y
npm install /path/to/your/package/@geo-soft-timetablely-sdk-1.0.0.tgz
```

Verify it imports correctly:
```js
// Test ESM
import { Scheduler } from '@geo-soft/timetablely-sdk';

// Test CommonJS
const { Scheduler } = require('@geo-soft/timetablely-sdk');

// Test styles import
import '@geo-soft/timetablely-sdk/styles';
```

### 10. Run npm publish --dry-run
```bash
npm publish --dry-run
```

Check for warnings about:
- Missing README
- Large bundle size
- Security vulnerabilities
- Incorrect `main`/`module` paths

---

## Phase 4: Publishing

### 11. Log In to npm CLI
```bash
npm login
```

Enter:
- Username
- Password
- Email
- 2FA code (if enabled)

Verify you're logged in:
```bash
npm whoami
```

### 12. Publish the Package
```bash
npm publish
```

Because of your `"publishConfig": { "access": "public" }`, this publishes immediately as public. Without that field, scoped packages default to private and would fail without a paid plan.

**Expected output:**
```
npm notice Publishing to https://registry.npmjs.org/ with tag latest
+ @geo-soft/timetablely-sdk@1.0.0
```

---

## Phase 5: Post-Publish Verification

### 13. Verify on the npm Website
Visit:
```
https://www.npmjs.com/package/@geo-soft/timetablely-sdk
```

Check that:
- README renders correctly
- Version shows `1.0.0`
- "Install" command is displayed
- File count and size look reasonable
- Types, exports, and dependencies are listed

### 14. Test Installation from the Registry
```bash
# In a completely fresh directory
mkdir verify && cd verify
npm init -y
npm install @geo-soft/timetablely-sdk
```

Check `node_modules/@geo-soft/timetablely-sdk/` contains the expected files.

### 15. Verify Both Import Methods Work
```js
// ESM test
import { Scheduler } from '@geo-soft/timetablely-sdk';
import '@geo-soft/timetablely-sdk/styles';

// CommonJS test
const SDK = require('@geo-soft/timetablely-sdk');
```

### 16. Verify TypeScript Support
```ts
import { Scheduler } from '@geo-soft/timetablely-sdk';
// IDE should show autocomplete and type definitions
```

---

## Phase 6: npm Search Visibility

### 17. Understanding Search Timing

| Timeline | What Happens |
|----------|--------------|
| **Immediately** | Package is installable via exact name |
| **5–15 minutes** | Appears in `npm search @geo-soft/timetablely-sdk` |
| **15 minutes – 2 hours** | Appears in general keyword searches ("timetable scheduler sdk") |
| **24–48 hours** | Full indexing, optimal discoverability |

### 18. Force a Search Check
```bash
npm search @geo-soft/timetablely-sdk
```

If not found immediately, don't worry — the registry search index updates asynchronously.

### 19. Alternative Discovery Methods (Work Immediately)
- Direct URL: `https://www.npmjs.com/package/@geo-soft/timetablely-sdk`
- npm website search bar (sometimes faster than CLI search)
- Google indexing (takes days)

---

## Phase 7: Maintenance & Updates

### 20. Version Bumping
Never republish the same version. Use npm's version command:

```bash
npm version patch   # 1.0.0 → 1.0.1 (bug fixes)
npm version minor   # 1.0.0 → 1.1.0 (new features, backward compatible)
npm version major   # 1.0.0 → 2.0.0 (breaking changes)
```

This:
- Updates `package.json` version
- Creates a git tag
- Commits the change

Then publish:
```bash
npm publish
```

### 21. Deprecating Old Versions
If a version has bugs but you don't want to unpublish it:
```bash
npm deprecate @geo-soft/timetablely-sdk@1.0.0 "Critical bug in CSS loading, upgrade to 1.0.1"
```

### 22. Unpublishing (24-Hour Window)
npm allows unpublishing within 24 hours of publish:
```bash
npm unpublish @geo-soft/timetablely-sdk@1.0.0
```

After 24 hours, you must contact npm support to unpublish.

---

## Phase 8: Automation (Optional but Recommended)

### 23. GitHub Actions CI/CD
Create `.github/workflows/publish.yml`:

```yaml
name: Publish to npm
on:
  release:
    types: [created]
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run build
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Add `NPM_TOKEN` to your GitHub repository secrets (generate at npm → Access Tokens).

---

## Troubleshooting Quick Reference

| Error | Cause | Fix |
|-------|-------|-----|
| `403 Forbidden` | Not org member / wrong login | `npm login`, verify org membership |
| `EPUBLISHCONFLICT` | Version already exists | Bump version in `package.json` |
| `ENEEDAUTH` | Not logged in | `npm login` |
| `E402 Payment Required` | Scoped package defaults to private | Add `"publishConfig": { "access": "public" }` |
| `ELIFECYCLE` | `prepare`/`prepublish` script failed | Check Husky or build scripts |
| Missing `dist/` in tarball | Build not run / `files` misconfigured | Run `pnpm build`, check `files` array |

---

Your package should now be live and discoverable. Want help setting up the GitHub Actions workflow or handling semantic versioning automation?