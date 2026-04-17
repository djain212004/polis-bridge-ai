"""
State graph definition for the policy workflow using langgraph primitives.

Flow
- START → orchestrator → retrieval → simulation → comms → explain → END

What to replace
- Node bodies: swap out stubbed logic with real LLM/tool calls (retrieval, simulation, NLG, explainability).
- State keys: keep the shape consistent (plan, retrieved, simulation, comms, explain, traces) or extend as needed.

Operational notes
- MemorySaver keeps the latest state; switch to a persistent checkpointer for production.
- The graph is linear; add conditional branches/guards if you want dynamic routing.
"""

from typing import Any, Dict, List

from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver


def orchestrator_node(state: Dict[str, Any]) -> Dict[str, Any]:
    plan: List[str] = [
        "Understand user intent",
        "Retrieve 3 relevant policy docs",
        "Generate scenario simulation summary",
        "Draft citizen-facing communication",
        "Add explainability notes",
    ]
    traces = state.get("traces", []) + ["orchestrator: plan created"]
    return {**state, "plan": plan, "traces": traces}


def retrieval_node(state: Dict[str, Any]) -> Dict[str, Any]:
    retrieved = [
        "doc://policy/ayushman-bharat-overview",
        "doc://policy/pmjay-eligibility",
        "doc://policy/health-wellness-centers",
    ]
    traces = state.get("traces", []) + ["retrieval: fetched 3 docs"]
    return {**state, "retrieved": retrieved, "traces": traces}


def simulation_node(state: Dict[str, Any]) -> Dict[str, Any]:
    simulation = {
        "summary": "Projected coverage improves by 12-18% with rural-first rollout; fiscal impact neutral under phased budget.",
        "metrics": {
            "economicImpactScore": 72,
            "employmentImpactScore": 65,
            "publicSupportScore": 80,
        },
    }
    traces = state.get("traces", []) + ["simulation: summary drafted"]
    return {**state, "simulation": simulation, "traces": traces}


def comms_node(state: Dict[str, Any]) -> Dict[str, Any]:
    lang = state.get("target_language", "en")
    comms = {
        "summary": f"Citizen update ({lang}): Clear eligibility, coverage up to ₹5L, phased rollout prioritized for rural districts."
    }
    traces = state.get("traces", []) + [f"comms: drafted message in {lang}"]
    return {**state, "comms": comms, "traces": traces}


def explain_node(state: Dict[str, Any]) -> Dict[str, Any]:
    explain = {
        "summary": "Signals weighted: public support > fiscal neutrality > coverage uplift. Assumes steady-state provider capacity.",
        "assumptions": ["Provider capacity stable", "Budget phased over 3 years"],
        "risks": ["Last-mile infra delays", "State-level adoption variance"],
    }
    traces = state.get("traces", []) + ["explain: added transparency notes"]
    return {**state, "explain": explain, "traces": traces}


def build_graph() -> StateGraph:
    graph = StateGraph(dict)
    graph.add_node("orchestrator", orchestrator_node)
    graph.add_node("retrieval", retrieval_node)
    graph.add_node("simulation", simulation_node)
    graph.add_node("comms", comms_node)
    graph.add_node("explain", explain_node)

    graph.add_edge(START, "orchestrator")
    graph.add_edge("orchestrator", "retrieval")
    graph.add_edge("retrieval", "simulation")
    graph.add_edge("simulation", "comms")
    graph.add_edge("comms", "explain")
    graph.add_edge("explain", END)
    return graph


def run_graph(initial_state: Dict[str, Any]) -> Dict[str, Any]:
    graph = build_graph()
    app = graph.compile(checkpointer=MemorySaver())
    result = app.invoke(initial_state)
    return result


if __name__ == "__main__":
    state = run_graph(
        {
            "query": "Summarize Ayushman Bharat eligibility and rollout considerations.",
            "target_language": "hi",
        }
    )
    print("Plan:", state.get("plan"))
    print("Retrieved:", state.get("retrieved"))
    print("Simulation:", state.get("simulation"))
    print("Comms:", state.get("comms"))
    print("Explain:", state.get("explain"))
    print("Traces:", state.get("traces"))
