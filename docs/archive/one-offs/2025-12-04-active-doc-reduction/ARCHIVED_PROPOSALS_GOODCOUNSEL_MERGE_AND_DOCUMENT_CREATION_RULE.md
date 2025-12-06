---
Document ID: PROPOSALS-GOODCOUNSEL-MERGE
Title: Proposals: GoodCounsel Merge Strategy & Document Creation Rule
Subject(s): Documentation | Proposals | GoodCounsel
Project: Cyrano
Version: v548
Created: 2025-11-28 (2025-W48)
Last Substantive Revision: 2025-11-28 (2025-W48)
Last Format Update: 2025-11-28 (2025-W48)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Summary: Proposals for merging GoodCounsel README with Philosophy document, other README/document overlaps, and enforceable rule for document creation.
Status: Archived (2025-12-04)
---

# Proposals: GoodCounsel Merge Strategy & Document Creation Rule

## 1. GoodCounsel README Issues

### Current Problems

**File:** `Cyrano/src/engines/goodcounsel/README.md`

**Outdated Content:**
- Line 22: "Currently uses direct tools and AI providers"
- Line 23: "Future modules may include: wellness tracking, ethics compliance, client relationship management"

**Reality Check:**
- ✅ Client relationship management is **already implemented** as `tools/client-recommendations.ts`
- ✅ Ethics compliance is **already implemented** as `tools/ethics-reviewer.ts` and `services/ethics-rules-engine.ts`
- ✅ Wellness tracking is **already implemented** via wellness_check workflow
- The engine uses **tools and services**, not modules (which is correct architecture)

**Other Issues:**
- Missing standardized header (has basic header but not full format)
- Philosophy document (`docs/ui/UI_UI_GOODCOUNSEL_PHILOSOPHY_AND_DESIGN_INTENT.md`) contains design principles that should inform the README
- README focuses on technical usage; Philosophy focuses on design intent - they complement each other but are separate

---

## 2. GoodCounsel Merge Strategy Proposal

### Option A: Keep Separate, Cross-Reference (RECOMMENDED)

**Rationale:**
- README = Technical reference (usage, workflows, API)
- Philosophy = Design principles (why, how it should feel, UI/UX)
- Different audiences: developers vs. designers/product

**Structure:**
1. **README** (`Cyrano/src/engines/goodcounsel/README.md`)
   - Technical overview
   - Workflows and usage
   - API reference
   - Configuration
   - **Add link:** "For design philosophy and UI principles, see: `docs/ui/UI_UI_GOODCOUNSEL_PHILOSOPHY_AND_DESIGN_INTENT.md`"

2. **Philosophy Document** (`docs/ui/UI_UI_GOODCOUNSEL_PHILOSOPHY_AND_DESIGN_INTENT.md`)
   - Design principles
   - Color philosophy
   - Tone of voice
   - UI/UX guidelines
   - **Add link:** "For technical implementation and API, see: `Cyrano/src/engines/goodcounsel/README.md`"

**Updates Needed:**
- Remove outdated "Future modules" section from README
- Update README to reflect actual implementation (tools/services, not modules)
- Add cross-references between documents
- Add standardized header to README

### Option B: Merge into Single Document

**Structure:**
- Single document with sections:
  1. Philosophy & Design Intent
  2. Technical Overview
  3. Workflows & Usage
  4. API Reference
  5. Configuration
  6. UI/UX Guidelines

**Pros:**
- Single source of truth
- Easier to maintain consistency

**Cons:**
- Mixes technical and design concerns
- Longer document (harder to navigate)
- Different update cadences (technical changes vs. design principles)

### Option C: Split Philosophy into README Sections

**Structure:**
- Keep README as primary
- Add "Design Philosophy" section to README
- Archive or reference-only the philosophy document

**Pros:**
- Developers see everything in one place

**Cons:**
- Loses focus on design principles
- Makes README very long
- Designers lose dedicated reference

---

## 3. Recommended Action: Option A with Updates

**Update GoodCounsel README:**
1. Remove outdated "Future modules" section
2. Update "Modules" section to reflect actual architecture:
   ```markdown
   ## Architecture
   
   This engine uses:
   - **Tools:** `client-recommendations`, `ethics-reviewer`
   - **Services:** `client-analyzer`, `ethics-rules-engine`
   - **Workflows:** Multi-step orchestration for wellness, ethics, client relationships, and crisis support
   - **AI Providers:** OpenAI, Anthropic
   
   Note: GoodCounsel uses tools and services directly, not modules. This follows the engine pattern of orchestrating tools and AI providers.
   ```
3. Add cross-reference to philosophy document
4. Add standardized header

**Update Philosophy Document:**
1. Add cross-reference to README
2. Ensure header is complete

---

## 4. Other README/Document Overlaps Investigation

### Engine READMEs vs. Architecture Documents

**Overlap Found:**
- `docs/reference/GENERAL_README_GOODCOUNSEL_ENGINE.md` (duplicate of `Cyrano/src/engines/goodcounsel/README.md`)
- `docs/reference/GENERAL_README_MAE_ENGINE.md` (mostly TODO - should be in source)
- `docs/reference/GENERAL_README_POTEMKIN_ENGINE.md` (duplicate of `Cyrano/src/engines/potemkin/README.md`)
- `docs/architecture/ARCHITECTURE_ARCHITECTURE_ENGINE_ARCHITECTURE.md` (general engine architecture)

**Recommendation:**
- **Keep source READMEs** (`Cyrano/src/engines/*/README.md`) - these are the canonical technical references
- **Archive duplicate reference docs** - they're redundant
- **Keep architecture doc** - it explains the general pattern, not specific engines

### Module READMEs vs. Architecture Documents

**Overlap Found:**
- `docs/reference/GENERAL_README_CHRONOMETRIC_MODULE.md` (mostly TODO - should be in source)
- `docs/architecture/ARCHITECTURE_ARCHITECTURE_MODULE_ARCHITECTURE.md` (general module architecture)

**Recommendation:**
- **Keep source READMEs** when they exist (`Cyrano/src/modules/*/README.md`)
- **Archive TODO-only reference docs** - they add no value
- **Keep architecture doc** - explains general pattern

### Tool Documentation

**Overlap Found:**
- `docs/guides/GENERAL_GUIDE_TOOL_CATEGORIES.md` (categorization)
- `docs/guides/GENERAL_GUIDE_TOOL_INVENTORY.md` (inventory)
- `docs/guides/GENERAL_GUIDE_TOOL_DOCUMENTATION_TEMPLATE.md` (template)

**Recommendation:**
- **Keep all** - they serve different purposes (categorization, inventory, template)
- **Consider merging** tool inventory and categories if they overlap significantly

---

## 5. Proposed Mergers

### High Priority

1. **Archive duplicate engine READMEs:**
   - `docs/reference/GENERAL_README_GOODCOUNSEL_ENGINE.md` → Archive (duplicate of source)
   - `docs/reference/GENERAL_README_POTEMKIN_ENGINE.md` → Archive (duplicate of source)
   - `docs/reference/GENERAL_README_MAE_ENGINE.md` → Archive (TODO-only, no value)

2. **Archive TODO-only module README:**
   - `docs/reference/GENERAL_README_CHRONOMETRIC_MODULE.md` → Archive (TODO-only, check if source README exists)

### Medium Priority

3. **Update GoodCounsel README:**
   - Remove outdated content
   - Add cross-reference to philosophy
   - Update architecture description

### Low Priority

4. **Review tool documentation overlap:**
   - Check if `TOOL_INVENTORY.md` and `TOOL_CATEGORIES.md` can be merged
   - Keep template separate

---

## 6. Enforceable Rule for Cursor: Document Creation

### Proposed Rule

```markdown
# DOCUMENTATION CREATION POLICY

**CRITICAL RULE:** Do not create new documentation files without explicit authorization from the user.

## When Documentation is Needed

If you need to document something, use these options in order of preference:

1. **Update the Change Log** (`docs/PROJECT_CHANGE_LOG.md`)
   - For: Historical changes, completed work, project evolution
   - When: Recording what was done, not creating new reference material

2. **Update the Document Index** (`docs/DOCUMENTATION_INDEX.md` or equivalent)
   - For: Adding new documents to the index
   - When: A new document has been explicitly authorized

3. **Update Existing Documents**
   - For: New information that belongs in an existing document
   - When: The information fits the scope of an existing document
   - Action: Update the document and increment version number

4. **Update Individual Document Headers**
   - For: Metadata changes (version, revision date, status)
   - When: Document has been substantively revised

5. **Ask the User**
   - For: Any situation where none of the above options are sufficient
   - When: New documentation is genuinely needed
   - Action: Explain why a new document is needed and request authorization

## What NOT to Do

❌ **DO NOT** create new documents "just in case"
❌ **DO NOT** create meta-documents about documentation
❌ **DO NOT** create temporary reports or summaries unless explicitly requested
❌ **DO NOT** create indexes or catalogs unless the user asks
❌ **DO NOT** create "analysis reports" or "review summaries" unless requested

## Exceptions

The only exception is when the user explicitly requests a new document:
- "Create a document about X"
- "Write documentation for Y"
- "Document this feature"

Even then, confirm the document name, location, and scope before creating.

## Rationale

The codebase already has:
- Versioned documents with revision tracking
- A change log for history
- An index for finding documents
- Standardized headers for metadata

Creating additional meta-documents, reports, or summaries adds unnecessary complexity and violates the principle of maintaining a "slim, accurate, less confusing library of active documentation."
```

### Implementation

This rule should be:
1. **Added to workspace rules** (`.cursorrules` or equivalent)
2. **Referenced in agent instructions** when working with documentation
3. **Enforced by the agent** - if tempted to create a document, follow the 5-step process above

---

## Summary

1. ✅ **Archive CONFLICTS_RESOLUTION_SUMMARY.md** - Done
2. 🔄 **Update GoodCounsel README** - Remove outdated content, add cross-reference
3. 🔄 **Keep GoodCounsel Philosophy separate** - Add cross-reference
4. 🔄 **Archive duplicate engine READMEs** - They're redundant with source READMEs
5. 🔄 **Archive TODO-only READMEs** - No value in keeping empty docs
6. 📝 **Implement document creation rule** - Add to workspace rules

---

**Next Steps:**
- User reviews and approves proposals
- Implement approved changes
- Add rule to workspace configuration

