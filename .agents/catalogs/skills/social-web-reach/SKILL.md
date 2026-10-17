---
name: social-web-reach
description: High-density social web intelligence and community discourse extraction across Reddit, X (Twitter), YouTube, and GitHub. Activate when conducting market research, analyzing real-time developer sentiment on libraries/frameworks, auditing competitive feedback, or tracking breaking tech discussions without expensive API costs.
metadata:
  origin: Antigravity-Core
---

# 👁️ Social Web Reach & Community Intelligence

This skill provides direct access to high-density social information streams using **Agent Reach**. It bypasses paywalls, restrictive rate-limits, and server IP blocks to extract public technical debates, real user reviews, and developer sentiment.

---

## 🎯 When to Use

* **Technology Evaluation:** Investigating what developers are *really* experiencing with a library or tool on Reddit (`r/programming`, `r/node`, etc.) or X before adopting it.
* **Competitor Intelligence:** Auditing user complaints, feature requests, and satisfaction levels regarding competing products or open-source alternatives.
* **Bug & Issue Forensics:** Finding workaround threads and issue discussions across GitHub and developer communities for obscure edge cases.
* **Marketing & Positioning Signals:** Extracting real consumer vocabulary, pain points, and objections directly from organic public threads.

---

## 🛠️ Extraction & Synthesis Workflow

```
1. Target Platform Selection ──► 2. Discourse Extraction ──► 3. Privacy Sanitization ──► 4. Signal Synthesis
```

### Step 1: Query Formulation
* Translate high-level user questions into targeted search vectors:
  * *Prompt:* "Is library X stable in production on Windows?"
  * *Target Vector:* `platform="reddit"`, `query="library X windows production bug issue"`

### Step 2: Thread Extraction
* Retrieve full comment hierarchies to capture not just the original post, but the top-voted counter-arguments and consensus replies.

### Step 3: PII & Privacy Filter (Mandatory)
* **Zero PII Exposure:** Automatically strip personal handles, emails, or phone numbers found in raw social dumps before summarizing or saving into the workspace.

### Step 4: Executive Signal Synthesis
Synthesize extracted findings into a structured intelligence matrix:

```markdown
### 📊 Community Intelligence Brief: [Topic]
* **Consensus Overview:** (Positive / Mixed / Critical)
* **Top 3 Production Blockers / Bugs Identified:**
  1. ...
  2. ...
* **Recommended Workarounds / Best Practices:**
* **Direct Sources:** [Thread 1](url), [Discussion 2](url)
```

---

## 🔒 Security & Compliance Gate

* **Public Data Exclusively:** Never attempt to breach private accounts, closed groups, or paywalled walled-gardens.
* **No Credential Harvesting:** Never ask for or inject user session cookies into third-party scraping proxies.
