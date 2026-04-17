# PolisBridge AI Studio — Complete AI Features Documentation

## Table of Contents

- [Core AI Infrastructure](#core-ai-infrastructure)
- [Feature 1: Scheme Eligibility Checker](#feature-1-scheme-eligibility-checker)
- [Feature 2: Policy Simulator](#feature-2-policy-simulator)
- [Feature 3: Policy Chatbot](#feature-3-policy-chatbot)
- [Feature 4: Communication Generator](#feature-4-communication-generator)
- [Feature 5: Fact-Checker](#feature-5-fact-checker-misinformation-detector)
- [Feature 6: RTI Draft Generator](#feature-6-rti-draft-generator)
- [Feature 7: Budget Allocation Analyzer](#feature-7-budget-allocation-analyzer)
- [Feature 8: Grievance Redressal Router](#feature-8-grievance-redressal-router)
- [Feature 9: Agent System Showcase](#feature-9-agent-system-showcase)
- [Cross-Cutting Patterns](#cross-cutting-patterns)
- [Navigation](#navigation-10-tabs)

---

## Core AI Infrastructure

### Gemini API Integration

**File:** `src/lib/gemini.ts`

| Property | Value |
|----------|-------|
| Model | Gemini 2.5 Flash |
| Endpoint | `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent` |
| Temperature | 0.35 (low creativity for factual accuracy) |
| topK | 32 |
| topP | 0.95 |

**Resilience:** Primary API key from `VITE_GEMINI_API_KEY` environment variable + 3 hardcoded backup keys with automatic failover. If one key returns an error, the next key is tried automatically.

**Two core functions:**

| Function | Return Type | Usage |
|----------|-------------|-------|
| `generateGeminiContent(prompt, config?)` | `string` | Plain text responses (PolicyChatbot fallback) |
| `generateGeminiJson<T>(prompt, config?)` | `T` | Typed, parsed JSON responses (all other features) |

```typescript
interface GeminiConfig {
  temperature?: number;
  topK?: number;
  topP?: number;
  responseMimeType?: string;
}
```

---

## Feature 1: Scheme Eligibility Checker

**File:** `src/components/SchemeEligibilityChecker.tsx`
**Tab:** Scheme Eligibility | **Icon:** `ListChecks`

### Description

AI agent that matches Indian citizens to eligible government schemes by searching a real scraped dataset of 1,000+ schemes from myschemes.gov.in. The agent analyzes the citizen's profile against scheme eligibility criteria and returns ranked matches with application steps.

### User Inputs

| Field | Type | Options |
|-------|------|---------|
| State / UT | Dropdown | 35 Indian states and Union Territories |
| Age | Dropdown | Under 18, 18-25, 26-35, 36-55, 56-65, Above 65 |
| Gender | Dropdown | Male, Female, Transgender |
| Annual Household Income | Dropdown | Below 50K, 50K-1L, 1L-2L, 2L-5L, Above 5L |
| Occupation Category | Dropdown | Farmer, Student, Senior Citizen, BPL, Differently Abled, Entrepreneur, Woman/Homemaker, Fisherman, Artisan, Labourer |
| Caste Category | Dropdown | General, OBC, SC, ST, EWS |

### AI Pipeline

1. Dynamically loads `myschemes_scraped_progress.json` (real scraped dataset)
2. Extracts top 150 schemes with name, details, and links
3. Sends citizen profile + scheme context to Gemini
4. AI role: "Indian government scheme eligibility expert"

### Output Interface

```typescript
interface EligibilityResult {
  matchedSchemes: Array<{
    name: string;              // Exact scheme name
    benefit: string;           // What the citizen gets
    eligibilityReason: string; // Why this citizen qualifies
    matchScore: number;        // 0-100
    applicationSteps: string[];// 3-5 actionable steps
    officialLink: string;      // Real gov.in URL
  }>;
  totalMatches: number;
  topRecommendation: string;
}
```

### Output Display

- Summary banner with total matches and top recommendation
- Per-scheme cards with:
  - Match score badge (green >= 80%, yellow >= 60%, orange < 60%)
  - Benefit description
  - Eligibility reasoning specific to the user's profile
  - Expandable "How to Apply" accordion with step-by-step instructions
  - Official scheme page link

### API Call

```typescript
generateGeminiJson<EligibilityResult>(prompt)
```

---

## Feature 2: Policy Simulator

**File:** `src/components/PolicySimulator.tsx`
**Tab:** Policy Simulator | **Icon:** `BarChart2`

### Description

A 7-agent ensemble that stress-tests Indian policy proposals. Each agent analyzes a different dimension of the policy, producing impact scores, risk assessments, implementation plans, and explainability reports. Supports batch scenario analysis and historical comparison.

### User Inputs

| Field | Type | Description |
|-------|------|-------------|
| Policy Title | Text | Name of the policy |
| Scenario Label | Text | Label for comparison tracking |
| Policy Description | Textarea | Detailed policy overview |
| Additional Context | Textarea | Implementation constraints, datasets, regional focus |
| Scenario Variants | Textarea | One variant per line for batch analysis |

### 7-Agent Architecture

| # | Agent | Responsibility |
|---|-------|---------------|
| 1 | Central Orchestrator | Objectives, priority signals, success criteria |
| 2 | Societal Impact Agent | Positive/negative outcomes, vulnerable groups, equity |
| 3 | Simulation/Data Module | Required datasets, scenario projections |
| 4 | Feedback/Adaptation Agent | Risks, mitigations, monitoring signals |
| 5 | Learning Engine / AutoML | Metrics, retraining triggers, update cadence |
| 6 | Policy Generation Agent | Draft policy narrative, implementation steps, stakeholders |
| 7 | Explainability Agent | Reasoning highlights, transparency notes, unresolved questions |

### Output Interface

```typescript
interface SimulationResult {
  policy: { title: string; summary: string; primaryGoal: string };
  centralOrchestrator: {
    objectives: string[];
    prioritySignals: string[];
    successCriteria: string[];
  };
  societalImpactAgent: {
    positiveOutcomes: string[];
    negativeOutcomes: string[];
    vulnerableGroups: string[];
    equityConsiderations: string[];
  };
  simulationModule: {
    requiredDataSets: string[];
    scenarioSummary: string;
    projectedOutcomes: Array<{ scenario: string; impact: string }>;
  };
  feedbackAdaptationAgent: {
    keyRisks: string[];
    mitigationStrategies: string[];
    monitoringSignals: string[];
  };
  learningEngine: {
    metrics: string[];
    updateCadence: string;
    adaptationTriggers: string[];
  };
  policyGenerationAgent: {
    policyDraft: string;
    implementationSteps: string[];
    stakeholderNotes: string[];
  };
  explainabilityAgent: {
    reasoningHighlights: string[];
    transparencyNotes: string[];
    unresolvedQuestions: string[];
  };
  aggregatedMetrics: {
    economicImpactScore: number;         // 0-100
    employmentImpactScore: number;       // 0-100
    fiscalImpactScore: number;           // 0-100
    implementationRiskScore: number;     // 0-100
    publicSupportScore: number;          // 0-100
  };
  recommendations: string[];
  dataGaps: string[];
  assumptions: string[];
  sources: Array<{ title: string; url: string; note?: string }>;
}
```

### Output Display

- 5 animated score bars (Economic, Employment, Fiscal, Implementation Risk, Public Support)
- 7 agent-specific cards with section lists and color-coded badges
- Projected outcome cards with scenario/impact pairs
- Actionable insights: recommendations, data gaps, assumptions
- Source links (real gov.in domains only)

### Advanced Features

| Feature | Description |
|---------|-------------|
| Batch Scenario Analysis | Runs multiple scenario variants sequentially |
| Scenario History | Saved to `localStorage`, load/replay any past scenario |
| Side-by-Side Comparison | Select 2 saved scenarios, view delta metrics (B - A) in a table |

### API Call

Direct `fetch()` to Gemini API with `responseMimeType: "application/json"`

---

## Feature 3: Policy Chatbot

**File:** `src/components/PolicyChatbot.tsx`
**Tab:** Policy Chatbot | **Icon:** `MessageSquare`

### Description

Multi-turn conversational AI assistant specialized in Indian government policies. Supports 11 Indian languages for output and maintains conversation context across messages.

### User Inputs

| Field | Type | Options |
|-------|------|---------|
| Chat message | Text input | Free-form question |
| Answer language | Dropdown | English, Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Punjabi, Kannada, Malayalam, Odia |

### Knowledge Domains

- Central and State government schemes (PM-KISAN, Ayushman Bharat, MGNREGA, etc.)
- Indian Constitution, laws, and regulations
- Social welfare programs
- Economic policies and reforms
- Agricultural policies
- Healthcare and education initiatives
- Digital governance (DigiLocker, UMANG, etc.)
- Infrastructure programs
- Financial inclusion
- Environmental policies

### Output Display

- Chat bubble interface with user/assistant message styling
- Markdown rendering for assistant responses
- Real-time loading indicator while generating
- Language selector persists across the conversation

### API Integration (Dual Backend)

| Priority | Backend | Method |
|----------|---------|--------|
| Primary | Supabase Edge Function (`policy-chat`) | SSE streaming |
| Fallback | Direct Gemini API | `generateGeminiContent()` |

---

## Feature 4: Communication Generator

**File:** `src/components/CommunicationGenerator.tsx`
**Tab:** Communication | **Icon:** `Globe`

### Description

Creates targeted, culturally-aware policy communications for diverse audiences. Generates a base message with quality metrics and produces multilingual translations with per-language readability analysis and risk flagging.

### User Inputs

| Field | Type | Options |
|-------|------|---------|
| Target Audience | Dropdown | General Public, Business, Youth, Seniors, Rural Communities |
| Base Language | Dropdown | English, Spanish, French, Chinese, Arabic, Hindi |
| Topic / Scheme | Textarea | Policy update description |
| Target Translations | Checkboxes | Select from 11 Indian languages |

### Output Interface

```typescript
interface CommunicationResult {
  base: {
    message: string;
    clarityScore: number;      // 0-100
    accessibility: string;
    engagementLevel: string;
    headline: string;
    sources: Array<{ title: string; url: string }>;
  };
  translations: Array<{
    language: string;
    label: string;
    translation: string;
    clarityScore: number;      // 0-100
    readability: string;
    riskFlags: string[];       // Problematic terms flagged
  }>;
}
```

### Output Display

- Generated headline and message (under 180 words)
- 3 metric cards: Clarity Score, Accessibility rating, Engagement Level
- Sources with real URLs
- Multilingual QA grid (2-column layout) showing:
  - Translated text per language
  - Per-translation clarity score and readability assessment
  - Risk flags for culturally or linguistically problematic terms

### API Call

```typescript
generateGeminiJson<CommunicationResult>(prompt)
```

---

## Feature 5: Fact-Checker (Misinformation Detector)

**File:** `src/components/MisinformationDetector.tsx`
**Tab:** Fact-Checker | **Icon:** `ShieldAlert`

### Description

AI fact-checker that verifies claims about Indian government schemes from WhatsApp forwards or social media posts. Extracts individual claims, verifies each one, and generates shareable multilingual corrections.

### User Inputs

| Field | Type | Options |
|-------|------|---------|
| Message to fact-check | Textarea | WhatsApp/social media text |
| Input Language | Dropdown | 11 Indian languages |
| Counter-Narrative Language | Dropdown | 11 Indian languages |

### Output Interface

```typescript
interface MisinformationReport {
  overallTruthScore: number;   // 0-100
  classification: "accurate" | "partially_false" | "misleading" | "false";
  claims: Array<{
    claim: string;             // Extracted claim text
    verdict: "true" | "partially_true" | "false";
    correction: string;        // What the fact actually is
    source: string;            // Real gov.in URL or official source
  }>;
  counterNarrative: string;    // Detailed corrective explanation
  shareableCorrection: string; // WhatsApp-ready, max 2 sentences
  officialLinks: string[];     // Real official URLs only
}
```

### Output Display

- Large truth score (0-100%) with color-coded progress bar:
  - Green >= 75% | Yellow >= 40% | Red < 40%
- Classification badge (Accurate / Partially False / Misleading / False)
- Per-claim breakdown cards with verdict badges:
  - Green "Fact" | Yellow "Partial" | Red "False"
  - Correction text and source link
- Corrective explanation in selected output language
- WhatsApp-ready correction with **Copy Text** button
- Official source links (pib.gov.in, india.gov.in, pfms.nic.in, etc.)

### API Call

```typescript
generateGeminiJson<MisinformationReport>(prompt)
```

---

## Feature 6: RTI Draft Generator

**File:** `src/components/RTIDraftGenerator.tsx`
**Tab:** RTI Generator | **Icon:** `FileText`

### Description

A 4-agent pipeline that takes a governance problem described in plain language and produces a legally valid, ready-to-file RTI (Right to Information) application under the RTI Act 2005, Section 6. Includes authority routing and filing strategy.

### User Inputs

| Field | Type | Options |
|-------|------|---------|
| Problem description | Textarea | Free-text governance issue |
| State / UT | Dropdown | 35 Indian states and Union Territories |
| Language | Dropdown | 11 Indian languages |

### 4-Agent Pipeline

| # | Agent | Responsibility |
|---|-------|---------------|
| 1 | Intent Classifier | Parses the problem, identifies governance domain, ministry/department, specific information to seek |
| 2 | Legal Drafter | Constructs complete RTI application following Section 6 format with all legally required elements |
| 3 | Authority Router | Determines correct Public Information Officer (PIO) and First Appellate Authority for the state/department |
| 4 | Strategy Advisor | Provides 30-day response timeline, appeal process, practical tips, and common pitfalls |

### Output Interface

```typescript
interface RTIResult {
  intentAnalysis: {
    domain: string;              // e.g. "Public Health", "Infrastructure"
    department: string;          // Relevant ministry/department
    informationSought: string[]; // Specific pieces of information to request
    summary: string;             // 1-2 sentence summary
  };
  draftApplication: {
    to: string;                  // PIO designation and department
    subject: string;             // Formal subject line
    body: string;                // Complete RTI application in selected language
    feeNote: string;             // Fee amount and payment method (Rs. 10)
  };
  authorityRouting: {
    pio: string;                 // PIO designation
    department: string;          // Full department name
    address: string;             // Office address
    appellateAuthority: string;  // First Appellate Authority
    onlinePortalUrl: string;     // rtionline.gov.in or state portal
  };
  strategyAdvice: {
    expectedTimeline: string;    // e.g. "30 days response, 30 days appeal"
    tips: string[];              // 3-5 practical filing tips
    appealProcess: string[];     // Step-by-step appeal instructions
    commonPitfalls: string[];    // Mistakes to avoid
  };
}
```

### Output Display

| Agent Card | Badge Color | Content |
|------------|-------------|---------|
| Agent 1: Intent Classifier | Blue | Domain, department, information sought list, summary |
| Agent 2: Legal Drafter | Green | Full RTI letter in monospace block + **Copy RTI Application** button |
| Agent 3: Authority Router | Orange | PIO details, department address, appellate authority, online portal link |
| Agent 4: Strategy Advisor | Yellow | Expected timeline, filing tips, appeal process steps, common pitfalls |

### API Call

```typescript
generateGeminiJson<RTIResult>(prompt)
```

---

## Feature 7: Budget Allocation Analyzer

**File:** `src/components/BudgetAnalyzer.tsx`
**Tab:** Budget Analyzer | **Icon:** `IndianRupee`

### Description

A 3-agent ensemble that analyzes whether a government budget allocation is adequate for its stated goal, equitable across demographics, and competitive versus peer states. Produces health scores and actionable recommendations.

### User Inputs

| Field | Type | Description |
|-------|------|-------------|
| State / UT | Dropdown | 35 Indian states and Union Territories |
| Department / Scheme | Text | e.g. PM-KISAN, Education Department, MGNREGA |
| Budget Allocation | Number | Amount in Crores (INR) |

### 3-Agent Ensemble

| # | Agent | Responsibility |
|---|-------|---------------|
| 1 | Fiscal Analyst | Adequacy assessment, per-capita estimate, absorption capacity, fiscal gaps |
| 2 | Equity Auditor | Demographic fairness, gender impact, rural/urban split, affected groups, recommendations |
| 3 | Comparative Benchmarker | Peer state comparisons (3-4 states), national average, ranking, insights |

### Output Interface

```typescript
interface BudgetAnalysis {
  summary: string;              // 2-3 sentence overall assessment
  scores: {
    adequacy: number;           // 0-100
    equity: number;             // 0-100
    efficiency: number;         // 0-100
    transparency: number;       // 0-100
  };
  fiscalAnalyst: {
    adequacyAssessment: string;
    perCapitaEstimate: string;
    absorptionCapacity: string;
    gaps: string[];             // 3-5 fiscal gaps
  };
  equityAuditor: {
    equityAssessment: string;
    affectedGroups: string[];
    genderImpact: string;
    ruralUrbanSplit: string;
    recommendations: string[];  // 3-5 equity improvements
  };
  benchmarker: {
    peerComparisons: Array<{ state: string; allocation: string; outcome: string }>;
    nationalAverage: string;
    ranking: string;
    insights: string[];         // 3-5 comparative insights
  };
  recommendations: string[];    // 5-7 actionable recommendations
  sources: Array<{ title: string; url: string }>;
}
```

### Output Display

- Summary assessment paragraph
- 4 animated score bars with gradient fill (Adequacy, Equity, Efficiency, Transparency)
- **Agent 1** (blue badge): Adequacy assessment, per-capita and absorption capacity side-by-side, fiscal gaps list
- **Agent 2** (green badge): Equity assessment, affected groups, gender impact and rural/urban split side-by-side, equity recommendations
- **Agent 3** (orange badge): Peer comparison table (state / allocation / outcome columns), national average, ranking, comparative insights
- Actionable recommendations card
- Sources with real URLs (budget.gov.in, finance.gov.in, rbi.org.in)

### API Call

```typescript
generateGeminiJson<BudgetAnalysis>(prompt)
```

---

## Feature 8: Grievance Redressal Router

**File:** `src/components/GrievanceRouter.tsx`
**Tab:** Grievance Router | **Icon:** `MessageSquareWarning`

### Description

A 3-agent pipeline that takes a civic complaint in plain language, triages it by domain and urgency, routes it to the correct government grievance portal with contact details, and drafts a formal complaint letter with a step-by-step escalation timeline.

### User Inputs

| Field | Type | Description |
|-------|------|-------------|
| Grievance | Textarea | Free-text civic complaint |
| State / UT | Dropdown | 35 Indian states and Union Territories |
| District | Text (optional) | e.g. Pune, Lucknow |

### 3-Agent Pipeline

| # | Agent | Responsibility |
|---|-------|---------------|
| 1 | Triage Agent | Classifies domain (water, electricity, pension, land, roads, sanitation), urgency level, jurisdiction (central/state/local) |
| 2 | Routing Agent | Identifies correct portal (CPGRAMS, state IGRS, Municipal Corp) with URLs and helpline numbers, responsible department, escalation authority |
| 3 | Drafting Agent | Writes formal complaint letter with placeholders, lists attachments needed, creates day-by-day escalation timeline |

### Output Interface

```typescript
interface GrievanceResult {
  triage: {
    domain: string;                      // e.g. "Water Supply", "Electricity"
    urgency: "low" | "medium" | "high" | "critical";
    jurisdiction: "central" | "state" | "local";
    summary: string;
  };
  routing: {
    primaryPortal: {
      name: string;                      // e.g. "CPGRAMS", "IGRS Maharashtra"
      url: string;                       // Real portal URL
      helpline: string;                  // e.g. "1800-11-00-31"
    };
    alternateChannels: Array<{ name: string; url: string }>;
    responsibleDepartment: string;
    escalationAuthority: string;
  };
  complaint: {
    subjectLine: string;
    draftText: string;                   // Formal complaint with [YOUR NAME], [ADDRESS], [DATE]
    attachmentsNeeded: string[];
    escalationTimeline: Array<{
      day: number;                       // e.g. 0, 15, 30, 60, 90
      action: string;                    // What to do at this stage
      authority: string;                 // Who to contact
    }>;
  };
  tips: string[];                        // 4-6 practical tips
}
```

### Output Display

| Agent Card | Badge Color | Content |
|------------|-------------|---------|
| Agent 1: Triage | Blue | Domain badge, urgency badge (color-coded), jurisdiction badge, summary |
| Agent 2: Routing | Green | Primary portal card with visit link + helpline, department, escalation authority, alternate channel links |
| Agent 3: Complaint Drafter | Orange | Subject line, formal complaint in monospace block + **Copy Complaint** button, attachments needed list |

**Urgency Badge Colors:**

| Level | Color |
|-------|-------|
| Low | Green |
| Medium | Yellow |
| High | Orange |
| Critical | Red |

**Escalation Timeline:** Visual vertical timeline with connected dots and lines showing day-by-day progression (e.g., Day 0: File complaint -> Day 30: Send reminder -> Day 60: Escalate to higher authority -> Day 90: Approach ombudsman).

### API Call

```typescript
generateGeminiJson<GrievanceResult>(prompt)
```

---

## Feature 9: Agent System Showcase

**File:** `src/components/MultiAgentSystem.tsx`
**Tab:** Agent System | **Icon:** `Brain`

### Description

Static showcase page displaying all 9 specialized AI agents used across the platform. Includes a visual multi-agent network image and descriptive cards for each agent.

### 9 Agents Displayed

| # | Agent Name | Icon | Description |
|---|------------|------|-------------|
| 1 | Communication Agent | MessageSquare | Crafts personalized, culturally-aware messages for diverse audiences |
| 2 | Prediction Agent | BarChart3 | Simulates community responses and identifies potential challenges |
| 3 | Translation Agent | Globe | Ensures accurate multilingual communication across 11 Indian languages |
| 4 | Analysis Agent | Brain | Provides actionable insights with trusted sources and data |
| 5 | Security Agent | Shield | Maintains privacy protections and ethical AI standards |
| 6 | Misinformation Agent | Zap | Detects and addresses potential misinformation risks |
| 7 | RTI Draft Agent | FileText | 4-agent pipeline that generates legally valid RTI applications under RTI Act 2005 |
| 8 | Budget Analysis Agent | IndianRupee | 3-agent ensemble analyzing budget adequacy, equity, and comparative benchmarks |
| 9 | Grievance Routing Agent | MessageSquareWarning | 3-agent pipeline for triaging, routing, and drafting civic grievance complaints |

### Visual Elements

- Multi-agent network hero image with gradient overlay
- 3-column responsive grid of agent cards
- Hover effects with shadow and translate animation
- Color-coded icon backgrounds per agent

---

## Cross-Cutting Patterns

### UI Framework and Components

| Layer | Technology |
|-------|-----------|
| Component Library | shadcn/ui (Card, Button, Badge, Select, Textarea, Input, Accordion) |
| Icons | lucide-react |
| Styling | Tailwind CSS with custom design tokens |
| Layout | 2-column grid (input left, output right) on all feature pages |

### Shared UI Patterns

| Pattern | Usage |
|---------|-------|
| `ScoreBar` | Gradient-filled progress bar with percentage label (PolicySimulator, BudgetAnalyzer) |
| `SectionList` | Uppercase title + bulleted list items (PolicySimulator, RTIDraftGenerator, BudgetAnalyzer, GrievanceRouter) |
| `useToast()` | Error notifications with destructive variant across all features |
| `Loader2` spinner | Loading indicators with `animate-spin` class on all features |
| Badge headers | Color-coded agent/section badges on all output cards |
| Copy buttons | Clipboard copy for RTI drafts, grievance complaints, WhatsApp corrections |

### Multilingual Support

11 Indian languages available across features:

| Code | Language |
|------|----------|
| en | English |
| hi | Hindi |
| bn | Bengali |
| ta | Tamil |
| te | Telugu |
| mr | Marathi |
| gu | Gujarati |
| pa | Punjabi |
| kn | Kannada |
| ml | Malayalam |
| or | Odia |

**Used in:** RTI Generator, Policy Chatbot, Fact-Checker, Communication Generator

### Data Sources

| Source | Usage |
|--------|-------|
| `myschemes_scraped_progress.json` | 1,000+ real government schemes from myschemes.gov.in (SchemeEligibilityChecker) |
| `localStorage` | Scenario history persistence (PolicySimulator) |
| Supabase Edge Function | SSE streaming for PolicyChatbot |
| Gemini 2.5 Flash API | All AI features |

### URL Policy

All prompts explicitly instruct the AI to use only real government URLs:
- `gov.in`, `nic.in` domains for official links
- `pib.gov.in` for press releases
- `india.gov.in` for national portal
- `rtionline.gov.in` for RTI filings
- `pgportal.gov.in` for CPGRAMS grievances
- `budget.gov.in`, `finance.gov.in`, `rbi.org.in` for budget sources

---

## Navigation (10 Tabs)

```
Home > Scheme Eligibility > Policy Simulator > Policy Chatbot > Communication >
Fact-Checker > RTI Generator > Budget Analyzer > Grievance Router > Agent System
```

| Tab | ID | Icon | Component |
|-----|----|------|-----------|
| Home | `home` | Home | Hero + TrustSecurity |
| Scheme Eligibility | `eligibility` | ListChecks | SchemeEligibilityChecker |
| Policy Simulator | `simulator` | BarChart2 | PolicySimulator |
| Policy Chatbot | `chatbot` | MessageSquare | PolicyChatbot |
| Communication | `comms` | Globe | CommunicationGenerator |
| Fact-Checker | `factcheck` | ShieldAlert | MisinformationDetector |
| RTI Generator | `rti` | FileText | RTIDraftGenerator |
| Budget Analyzer | `budget` | IndianRupee | BudgetAnalyzer |
| Grievance Router | `grievance` | MessageSquareWarning | GrievanceRouter |
| Agent System | `agents` | Brain | MultiAgentSystem |

All tabs are rendered in a fixed horizontal scrollable navigation bar at the top of the page with active tab highlighting in the primary color.
