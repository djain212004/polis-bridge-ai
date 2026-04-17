/**
 * LangGraph-based orchestration workflow for policy Q&A / simulation.
 *
 * This is a demonstrative graph showing how an orchestrator can route work
 * across agents (retrieval, simulation, comms, explainability). It uses
 * @langchain/langgraph primitives so you can swap in real model calls later.
 *
 * NOTE: replace the mock node bodies with actual LLM/tool calls and plug in
 * your retrieval / policy simulation logic as needed.
 */

import { StateGraph, START, END, Annotation, MemorySaver } from "@langchain/langgraph";
import type { RunnableConfig } from "@langchain/core/runnables";
import { HumanMessage, AIMessage } from "@langchain/core/messages";

// ---- State definition ----

type Trace = string;

type AgentOutput = {
  summary: string;
  details?: Record<string, unknown>;
};

interface OrchestratorState {
  query: string;
  targetLanguage: string;
  plan?: string[];
  retrieved?: string[];
  simulation?: AgentOutput;
  comms?: AgentOutput;
  explain?: AgentOutput;
  traces: Trace[];
}

const State = Annotation.Root({
  query: Annotation<string>(),
  targetLanguage: Annotation<string>(),
  plan: Annotation.optional<string[]>(),
  retrieved: Annotation.optional<string[]>(),
  simulation: Annotation.optional<AgentOutput>(),
  comms: Annotation.optional<AgentOutput>(),
  explain: Annotation.optional<AgentOutput>(),
  traces: Annotation<string[]>({ default: () => [] }),
});

// ---- Mock agent nodes (replace with real tools/LLMs) ----

const orchestratorNode = async (state: OrchestratorState) => {
  const plan = [
    "Understand user intent",
    "Retrieve 3 relevant policy docs",
    "Generate scenario simulation summary",
    "Draft citizen-facing communication in target language",
    "Add explainability notes",
  ];
  return {
    ...state,
    plan,
    traces: [...state.traces, "orchestrator: plan created"],
  };
};

const retrievalNode = async (state: OrchestratorState) => {
  const retrieved = [
    "doc://policy/ayushman-bharat-overview",
    "doc://policy/pmjay-eligibility",
    "doc://policy/health-wellness-centers",
  ];
  return {
    ...state,
    retrieved,
    traces: [...state.traces, "retrieval: fetched 3 docs"],
  };
};

const simulationNode = async (state: OrchestratorState) => {
  return {
    ...state,
    simulation: {
      summary:
        "Projected coverage improves by 12-18% with rural-first rollout; fiscal impact neutral under phased budget.",
      details: {
        economicImpactScore: 72,
        employmentImpactScore: 65,
        publicSupportScore: 80,
      },
    },
    traces: [...state.traces, "simulation: summary drafted"],
  };
};

const commsNode = async (state: OrchestratorState) => {
  const lang = state.targetLanguage || "en";
  return {
    ...state,
    comms: {
      summary: `Citizen update (${lang}): Clear eligibility, coverage up to ₹5L, phased rollout prioritized for rural districts.`,
    },
    traces: [...state.traces, `comms: drafted message in ${lang}`],
  };
};

const explainNode = async (state: OrchestratorState) => {
  return {
    ...state,
    explain: {
      summary:
        "Signals weighted: public support > fiscal neutrality > coverage uplift. Assumes steady-state provider capacity.",
      details: {
        assumptions: ["Provider capacity stable", "Budget phased over 3 years"],
        risks: ["Last-mile infra delays", "State-level adoption variance"],
      },
    },
    traces: [...state.traces, "explain: added transparency notes"],
  };
};

// ---- Graph assembly ----

const builder = new StateGraph(State)
  .addNode("orchestrator", orchestratorNode)
  .addNode("retrieval", retrievalNode)
  .addNode("simulation", simulationNode)
  .addNode("comms", commsNode)
  .addNode("explain", explainNode)
  .addEdge(START, "orchestrator")
  .addEdge("orchestrator", "retrieval")
  .addEdge("retrieval", "simulation")
  .addEdge("simulation", "comms")
  .addEdge("comms", "explain")
  .addEdge("explain", END);

const app = builder.compile({
  checkpointer: new MemorySaver(),
});

// ---- Public runner ----

export async function runPolicyWorkflow(input: { query: string; targetLanguage?: string }, config?: RunnableConfig) {
  const initial = {
    query: input.query,
    targetLanguage: input.targetLanguage ?? "en",
  };
  return app.invoke(initial, config);
}

// ---- Example CLI usage ----
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    const result = await runPolicyWorkflow({
      query: "Summarize Ayushman Bharat eligibility and rollout considerations.",
      targetLanguage: "hi",
    });

    console.log("Plan:", result.plan);
    console.log("Retrieved:", result.retrieved);
    console.log("Simulation:", result.simulation);
    console.log("Comms:", result.comms);
    console.log("Explain:", result.explain);
    console.log("Traces:", result.traces);
  })().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
