# PolisBridge AI Studio — Agent & Module Documentation

## Platform Overview

PolisBridge AI Studio is an AI-powered civic technology platform designed to bridge the gap between Indian citizens and government. It brings together eight distinct modules — each backed by one or more specialized AI agents — to help citizens understand government schemes, simulate policy outcomes, draft formal applications, analyze public budgets, fact-check claims, and navigate grievance systems. The platform supports eleven Indian languages and runs on the Gemini 2.5 Flash model, making advanced civic intelligence accessible to a diverse population.

Every module follows the same core pattern: the citizen provides a plain-language input, the platform routes it through a team of purpose-built agents, and the citizen receives structured, actionable output — complete with sources, scores, or ready-to-file documents.

---

## Module-by-Module Breakdown

### 1. Scheme Eligibility Checker

**What it does:** Matches citizens to government welfare schemes they may be eligible for. The user answers a handful of demographic questions and the system returns a ranked list of schemes with match scores, eligibility reasons, and application steps.

**User provides:** State, age group, gender, income bracket, occupation, and caste category.

**Agents inside this module:**

- **Eligibility Matcher** — Takes the citizen's profile and compares it against a scraped dataset of government schemes. It scores each scheme on how well the citizen's demographics align with the scheme's criteria and explains why the citizen qualifies or falls short.

**What the user gets:** A ranked list of government schemes, each with a percentage match score, a plain-English eligibility reason, step-by-step application instructions, and direct links to official portals.

---

### 2. Policy Simulator

**What it does:** Simulates the likely outcomes of a proposed or existing government policy. The user describes a policy in plain language and the system runs it through a coordinated team of six agents that examine societal impact, risk, implementation feasibility, and more.

**User provides:** A policy title, a description of the policy, and optional additional context such as target population or budget.

**Agents inside this module:**

- **Central Orchestrator** — Defines the simulation objectives, identifies priority signals, and establishes success criteria for the policy.
- **Societal Impact Agent** — Projects positive and negative outcomes, identifies vulnerable groups, and raises equity considerations.
- **Simulation Module** — Identifies the datasets that would be needed for a rigorous analysis, summarizes scenarios, and projects outcomes under different conditions.
- **Feedback & Adaptation Agent** — Flags key risks, proposes mitigation strategies, and defines the monitoring signals that would trigger a course correction.
- **Learning Engine** — Specifies which metrics to track after implementation, how often they should be reviewed, and what thresholds should trigger policy adaptation.
- **Policy Generation Agent** — Drafts an implementation-ready version of the policy, with concrete steps and notes for each stakeholder group.
- **Explainability Agent** — Summarizes the reasoning behind the simulation's conclusions, flags transparency concerns, and lists questions that remain unresolved.

**What the user gets:** Score bars for economic impact, employment impact, fiscal impact, implementation risk, and public support. Seven agent-specific cards with detailed analysis. A list of recommendations, data gaps, assumptions, and cited sources. Users can also compare two simulation runs side by side.

---

### 3. Policy Chatbot

**What it does:** An interactive conversational agent that answers questions about Indian government policies, schemes, and initiatives in the citizen's preferred language.

**User provides:** A free-text question about any government scheme or policy, plus a preferred answer language.

**Agents inside this module:**

- **Policy Knowledge Agent** — Draws on knowledge of Indian government programs — PM-KISAN, Ayushman Bharat, MGNREGA, Digital India, and hundreds of others — to provide clear, accurate, and context-aware answers. It handles follow-up questions within the same conversation thread.

**What the user gets:** A conversational response in the selected language, rendered in rich markdown, with the full chat history preserved for follow-up.

---

### 4. Communication Generator

**What it does:** Crafts government-to-citizen communication messages that are clear, culturally appropriate, and accessible. The user specifies a topic, audience, and target languages, and the system generates a polished base message plus translations.

**User provides:** The communication topic or policy name, target audience description, and one or more target languages from the eleven supported Indian languages.

**Agents inside this module:**

- **Communication Agent** — Writes the base message with attention to clarity, accessibility, and engagement. It produces a headline, a full message body, and a clarity score.
- **Translation Agent** — Translates the base message into every selected language, preserving tone and cultural nuance, and assigns a per-language clarity score.

**What the user gets:** A base message with clarity and engagement scores, plus individual translations for each selected language — each with its own clarity rating. Linked official sources are included for reference.

---

### 5. Fact-Checker (Misinformation Detector)

**What it does:** Analyzes policy-related claims and flags misinformation. The user pastes a statement or news snippet, and the system breaks it into individual claims, verifies each one, and produces a shareable correction.

**User provides:** A text claim or statement to fact-check, an input language, and an output language for the analysis.

**Agents inside this module:**

- **Misinformation Agent** — Evaluates the text for factual accuracy. It assigns an overall truth score, classifies the statement as accurate, partially false, misleading, or false, and breaks the analysis into per-claim verdicts with specific corrections and cited sources.

**What the user gets:** An overall truth score from zero to one hundred, a classification badge, per-claim verdicts with corrections, a WhatsApp-ready shareable correction message that can be copied with one click, and links to official sources.

---

### 6. RTI Draft Generator

**What it does:** Helps citizens draft legally valid Right to Information applications under the RTI Act 2005. The user describes a governance problem in their own words, and four collaborating agents produce a complete, ready-to-file RTI application.

**User provides:** A free-text description of the governance issue, the state or union territory, and the preferred language for the application.

**Agents inside this module:**

- **Intent Classifier** — Parses the citizen's problem description, identifies the governance domain (public health, infrastructure, education, etc.), determines the relevant ministry or department, and lists the specific pieces of information that should be sought through the RTI.
- **Legal Drafter** — Constructs the full RTI application in the chosen language, following the format prescribed by Section 6 of the RTI Act 2005. The draft includes the addressee, a formal subject line, the complete body with placeholders for the applicant's details, and a note on the required fee.
- **Authority Router** — Determines the correct Public Information Officer for the given state and department, provides the office address, identifies the First Appellate Authority for escalation, and links to the appropriate online RTI portal.
- **Strategy Advisor** — Advises on the expected timeline (the thirty-day response window), provides practical filing tips, outlines the step-by-step appeal process if no response is received, and warns about common pitfalls.

**What the user gets:** Four sequential agent cards — Intent, Draft, Authority, Strategy — with the RTI letter displayed in a copyable block. The citizen can copy the entire application to their clipboard with one click.

---

### 7. Budget Allocation Analyzer

**What it does:** Evaluates whether a government budget allocation is adequate, equitable, and competitive relative to peer states. Three agents analyze the numbers from different angles and produce scores, comparisons, and actionable recommendations.

**User provides:** A state or union territory, a department or scheme name, and the budget allocation amount in crores of rupees.

**Agents inside this module:**

- **Fiscal Analyst** — Assesses whether the budget is sufficient for the stated goal. It calculates a per-capita estimate, evaluates the state's absorption capacity (whether the state can actually spend the allocated amount effectively), and identifies fiscal gaps.
- **Equity Auditor** — Examines whether the allocation fairly serves all demographic groups. It analyzes gender impact, rural versus urban distribution, effects on Scheduled Castes, Scheduled Tribes, and Other Backward Classes, and recommends equity improvements.
- **Comparative Benchmarker** — Compares the allocation against peer states and the national average. It ranks the state, provides a comparison table with allocations and outcomes from similar states, and draws comparative insights.

**What the user gets:** Four score bars (adequacy, equity, efficiency, transparency) rated from zero to one hundred. Three agent-specific cards with detailed analysis. A consolidated list of actionable recommendations and links to real government data sources.

---

### 8. Grievance Redressal Router

**What it does:** Helps citizens file civic complaints through the correct government channels. The user describes a grievance and three agents triage it, route it to the right portal, and draft a formal complaint with a realistic escalation timeline.

**User provides:** A free-text description of the civic complaint, the state or union territory, and an optional district.

**Agents inside this module:**

- **Triage Agent** — Classifies the grievance by domain (water supply, electricity, pension, land records, roads, sanitation, and so on), assesses urgency on a four-level scale (low, medium, high, critical), and determines jurisdiction — whether the matter falls under central government, state government, or local municipal authority.
- **Routing Agent** — Identifies the correct grievance portal (CPGRAMS for central departments, state IGRS portals, municipal corporation systems, etc.) with the real URL and helpline number. It also names alternate channels, the responsible department, and the escalation authority.
- **Drafting Agent** — Writes a formal complaint letter with placeholders for the citizen's details, lists the documents that should be attached, and creates a step-by-step escalation timeline with specific day numbers and the authority to contact at each stage.

**What the user gets:** Three sequential agent cards — Triage (with urgency and jurisdiction badges), Routing (with portal links and helplines), and Draft (with the complaint in a copyable block). Below the cards, a visual escalation timeline shows the day-by-day action plan. Practical tips for effective grievance redressal round out the output.

---

## Multi-Agent Architecture Highlight

### How Agents Collaborate

PolisBridge AI Studio does not rely on a single monolithic AI prompt. Instead, each module defines a team of agents with clearly separated responsibilities. When a citizen submits a request, the platform composes a structured prompt that instructs the AI to assume multiple agent roles simultaneously, each producing its own section of the output. The result is a single API call that returns a JSON object with one key per agent, so every agent's output is distinct and attributable.

### Pipeline vs. Ensemble

Modules use two collaboration patterns depending on the task:

**Pipeline** — Agents pass their output forward in a defined sequence. The RTI Generator is a pipeline: the Intent Classifier must identify the domain before the Legal Drafter can write the application, the Authority Router needs the department before it can name the PIO, and the Strategy Advisor wraps up with tactical advice informed by all prior steps. The Grievance Router follows the same pattern: triage feeds routing, which feeds drafting.

**Ensemble** — Agents work in parallel on the same input and their outputs are presented side by side. The Budget Analyzer is an ensemble: the Fiscal Analyst, Equity Auditor, and Comparative Benchmarker each analyze the same allocation from a different lens and their conclusions stand independently.

The Policy Simulator uses a hybrid approach: the Central Orchestrator sets the frame, then multiple agents (Societal Impact, Simulation Module, Feedback, Learning Engine, Policy Generation, Explainability) all operate within that frame, blending sequential orchestration with parallel analysis.

### Why Multi-Agent Matters

A single prompt answering "Is this budget fair?" would produce a generic paragraph. By splitting the question across a Fiscal Analyst, an Equity Auditor, and a Benchmarker, the platform forces the AI to think through three distinct analytical frameworks, producing richer and more actionable output. The same principle applies to every module: specialization yields depth, and structured collaboration yields breadth.

The multi-agent design also makes the output transparent. Instead of a wall of undifferentiated text, citizens see clearly labeled cards — one per agent — so they know exactly which perspective produced which conclusion. This builds trust and makes it easier to spot where the analysis might need human review.

---

## Agent System Showcase

The platform fields nine named agents across all modules:

1. **Communication Agent** — Crafts personalized, culturally-aware messages for diverse audiences. Powers the Communication Generator module, producing clear base messages with clarity and engagement scores.

2. **Prediction Agent** — Simulates community responses and identifies potential challenges. Operates within the Policy Simulator as the Societal Impact and Simulation agents, projecting outcomes under different scenarios.

3. **Translation Agent** — Ensures accurate multilingual communication across eleven Indian languages (Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Punjabi, Kannada, Malayalam, Odia, and English). Works in tandem with the Communication Agent to deliver translations with per-language quality scores.

4. **Analysis Agent** — Provides actionable insights with trusted sources and data. Underpins the Scheme Eligibility Checker and the Policy Simulator's analytical layers, matching citizens to schemes and scoring policy outcomes.

5. **Security Agent** — Maintains privacy protections and ethical AI standards. Operates as a cross-cutting concern, ensuring that prompts and outputs respect user privacy and that no personally identifiable information is stored or leaked.

6. **Misinformation Agent** — Detects and addresses potential misinformation risks. Powers the Fact-Checker module, breaking claims into per-claim verdicts and generating shareable corrections.

7. **RTI Draft Agent** — A four-agent pipeline (Intent Classifier, Legal Drafter, Authority Router, Strategy Advisor) that generates legally valid RTI applications under RTI Act 2005. Takes a plain-language problem description and produces a ready-to-file application with routing and strategic advice.

8. **Budget Analysis Agent** — A three-agent ensemble (Fiscal Analyst, Equity Auditor, Comparative Benchmarker) that analyzes government budget allocations for adequacy, equity, and competitive standing relative to peer states.

9. **Grievance Routing Agent** — A three-agent pipeline (Triage Agent, Routing Agent, Drafting Agent) for triaging civic complaints, routing them to the correct government portal, and drafting formal complaints with escalation timelines.

---

## Technology and AI Backbone

**Model:** All modules are powered by Gemini 2.5 Flash, accessed through the Gemini generative language API. The model is configured with a temperature of 0.35, which favors factual precision over creative variation — the right tradeoff for civic and legal content.

**Resilience:** The platform maintains multiple API keys with automatic failover. If one key hits a rate limit or fails, the system silently rotates to the next key and retries, so the citizen never sees an authentication error.

**Multilingual support:** Eleven Indian languages are supported across modules — English, Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Punjabi, Kannada, Malayalam, and Odia. The RTI Generator and Fact-Checker allow the user to choose both input and output languages, while the Communication Generator can produce simultaneous translations for all selected languages.

**Structured output:** Every module requests JSON-formatted responses from the model, parsed into typed structures on the client side. This ensures that agent outputs map cleanly to UI components — score bars, agent cards, copyable text blocks, comparison tables, and escalation timelines — without fragile string parsing.

**Client-side architecture:** The platform is built with React and TypeScript, using Shadcn/ui components and Tailwind CSS for styling. State is managed with React hooks, and the Policy Simulator persists run history in browser local storage so citizens can compare simulations over time.
