
# Cyrano Engines & Modules – User Guide

**Version:** v1 (draft)  
**Audience:** Attorneys, staff, and power users of LexFiat / Arkiver

This guide explains, in user‑facing terms, what the major Cyrano engines and modules do, how they show up in LexFiat / Arkiver, and when you should use them.

---

## 1. GoodCounsel – Ethics & Wellness

**What it is:**  
GoodCounsel is your ethics and wellness companion. It surfaces gentle checks about your workload, client relationships, and professional obligations, and it encourages healthy habits.

**Where you see it:**
- LexFiat dashboard “GoodCounsel” widget and expanded panel
- Future journaling and ethics tools (GoodCounsel engine in Cyrano)

**What you use it for:**
- Quick wellness check‑ins (“Have I taken a break?”, “Is this caseload sustainable?”)
- Ethics reflection around difficult client or case decisions
- Gentle reminders about neglected matters or clients

**Typical workflows:**
- From the LexFiat dashboard, click the **GoodCounsel** tile to see current prompts and suggestions.
- Ask Cyrano Pathfinder in execute mode:  
  “Run an ethics review on this situation…” or  
  “Help me think through wellness impacts of my current caseload.”

---

## 2. Chronometric – Time & Workflow Archaeology

**What it is:**  
Chronometric is the time‑reconstruction engine. It looks at email, calendar, documents and other artifacts to infer how you actually spent your time, especially when you’ve fallen behind on billing.

**Where you see it:**
- LexFiat onboarding – **Time Tracking Setup** step
- LexFiat dashboard – **Chronometric** widget (bottom row)
- Future “workflow archaeology” views in time‑tracking pages

**What you use it for:**
- Setting a baseline of expected weekly/daily hours
- Reconstructing days or weeks where you didn’t track time live
- Identifying gaps between “what happened” and “what was billed”

**Typical workflows:**
- In LexFiat onboarding, configure:
  - Minimum hours per week
  - Optional minimum hours per day
  - Whether to use a baseline until enough history is available
- In the dashboard, click the **Chronometric** widget to review time‑tracking insights and, in future iterations, launch archaeology runs on specific days.

---

## 3. MAE – Multi‑Agent Engine

**What it is:**  
MAE (Multi‑Agent Engine) coordinates multiple AI tools to work together on multi‑step workflows (e.g., analyze → draft → critique → compare).

**Where you see it:**
- LexFiat **MAE Workflows** page
- LexFiat dashboard – **MAE (Multi‑Agent Engine)** widget (bottom row)
- In Pathfinder responses when workflows are being orchestrated

**What you use it for:**
- Running complex, multi‑step workflows from a single command
- Orchestrating document comparison, critique, and collaborative drafting
- Automating multi‑stage review pipelines over time

**Typical workflows:**
- From the MAE Workflows page, pick a workflow type (e.g., compare, critique, collaborate).
- Provide the requested inputs (documents, matter ID, objectives).
- Let MAE run the sub‑steps; review its outputs and suggested next actions.

---

## 4. Potemkin – Integrity & Drift Monitoring

**What it is:**  
Potemkin is focused on **AI integrity**: detecting drift, bias, and quality regressions in AI outputs over time.

**Where you see it:**
- Arkiver **AI Integrity** page
- Cyrano Potemkin engine and tools

**What you use it for:**
- Checking whether AI outputs are consistent with your expectations
- Detecting drift after model/provider changes
- Monitoring bias patterns in generated content

**Typical workflows:**
- In Arkiver, open **AI Integrity** and run tests against sample prompts or recent outputs.
- Review integrity reports and adjust providers, prompts, or workflows as needed.

---

## 5. Library & RAG Modules

**What they are:**  
The Library and RAG modules manage your jurisdiction‑specific documents (rules, orders, templates, playbooks) and feed them into retrieval‑augmented AI queries.

**Where you see them:**
- LexFiat **Library** page and filters
- LexFiat onboarding – **Storage Locations** step
- Pathfinder when it cites specific library items as sources

**What you use them for:**
- Saving and organizing legal documents by jurisdiction, county, court, practice area, and issue tags
- Running high‑quality RAG queries that cite your own materials
- Monitoring ingestion and health of the library

**Typical workflows:**
- Configure storage paths (local / OneDrive / Google Drive / S3) and run an initial scan.
- Use the Library page to filter by county, court, issue tags, or document type.
- Ask Pathfinder questions like “Find my current Michigan custody playbook” or “Summarize the latest standing orders for Wayne County family court.”

---

## 6. Cyrano Pathfinder – Unified Assistant

**What it is:**  
The Cyrano Pathfinder is the unified chat assistant for LexFiat and Arkiver. It supports:
- **Guide mode:** Q&A and navigation help
- **Execute mode:** Actually calling tools/engines on your behalf

**Where you see it:**
- Floating **C** chat button in LexFiat and Arkiver
- Chat drawer labeled **Cyrano Pathfinder**

**What you use it for:**
- Navigating features and workflows (“How do I run a MAE workflow?”)
- Running tools and engines (“Run a wellness check”, “Compare these two documents”)
- Getting help with errors or configuration issues

**Typical workflows:**
- Open the floating chat, choose model + mode, and ask plain‑language questions.
- When you want actions (not just explanations), enable **tool execution** and phrase your request as a task (e.g., “Search the library for all Wayne County custody templates and summarize the options.”).

---

## 7. How These Pieces Work Together

- **Onboarding** sets up your **practice profile**, **library storage**, **AI providers**, **Chronometric baseline**, and **integrations**.
- **Library + RAG** make your documents searchable and citable.
- **Chronometric** reconstructs your time and supports workflow archaeology.
- **MAE** orchestrates complex workflows across engines and tools.
- **GoodCounsel** keeps wellness and ethics in view as you work.
- **Potemkin** ensures your AI stack remains trustworthy over time.
- **Pathfinder** is the single conversational surface that can coordinate all of the above.  

If you’re unsure where to start, open Cyrano Pathfinder in **guide mode** and simply ask:  
“Given my role and practice, what should I set up next?”  
