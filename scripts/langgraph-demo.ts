/**
 * Dummy LangGraph-style script (no external dependency).
 *
 * This file illustrates how you might wire a simple policy Q&A flow
 * with a planner → retriever → responder pipeline, using plain TS
 * to mimic LangGraph concepts (nodes, edges, and state).
 *
 * This is NOT a working LangGraph runtime — it is a sketch you can
 * replace with real LangGraph APIs when you add the library.
 */

type Message = { role: "user" | "assistant" | "system"; content: string };

interface GraphState {
  query: string;
  plan?: string[];
  retrievedDocs?: string[];
  answer?: string;
  traces: string[];
}

// --- Mock nodes ---
const plannerNode = (state: GraphState): GraphState => {
  const plan = [
    "Clarify user intent",
    "Retrieve 3 relevant policy docs",
    "Draft structured answer with citations",
  ];
  return { ...state, plan, traces: [...state.traces, "planner: generated plan"] };
};

const retrieverNode = (state: GraphState): GraphState => {
  const retrievedDocs = [
    "doc://policy/ayushman-bharat-overview",
    "doc://policy/pmjay-eligibility",
    "doc://policy/health-wellness-centers",
  ];
  return { ...state, retrievedDocs, traces: [...state.traces, "retriever: fetched 3 docs"] };
};

const responderNode = (state: GraphState): GraphState => {
  const answer = `Answer (mock):
- Scheme: Ayushman Bharat (PM-JAY + HWCs)
- Coverage: up to ₹5 lakh per family/year for secondary & tertiary care
- Eligibility: SECC/PM-JAY beneficiary lists; state-specific add-ons vary
- Primary care: Health & Wellness Centres for preventive/primary services
Sources: ${state.retrievedDocs?.join(", ")}`;

  return { ...state, answer, traces: [...state.traces, "responder: drafted answer"] };
};

// --- Graph runner ---
const runGraph = (messages: Message[]): GraphState => {
  const userMsg = messages.find((m) => m.role === "user");
  const initial: GraphState = {
    query: userMsg?.content ?? "",
    traces: ["graph: start"],
  };

  const afterPlan = plannerNode(initial);
  const afterRetrieve = retrieverNode(afterPlan);
  const afterRespond = responderNode(afterRetrieve);
  return { ...afterRespond, traces: [...afterRespond.traces, "graph: done"] };
};

// --- Example invocation (would be removed/rewritten when integrating LangGraph) ---
const demo = runGraph([
  { role: "system", content: "You are a helpful policy assistant." },
  { role: "user", content: "Explain Ayushman Bharat eligibility in brief." },
]);

console.log("Plan:", demo.plan);
console.log("Answer:\n", demo.answer);
console.log("Traces:", demo.traces);
