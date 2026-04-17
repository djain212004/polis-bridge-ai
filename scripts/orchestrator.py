"""
Orchestrator module for the policy workflow.

What this file does
- Validates user input and prepares the initial state (query, target language, agent catalog).
- Invokes the state graph and returns the final state.

Where to customize
- Input validation: add domain-specific checks before invoking the graph.
- Initial state: include user/session metadata if you want to track provenance.
- Post-processing: inspect/transform the returned state before surfacing to a UI/API.
"""

from typing import Any, Dict

from agent_config import AGENTS
from state_graph import run_graph


def orchestrate(query: str, target_language: str = "en") -> Dict[str, Any]:
    """Execute the graph with user input and return the final state."""
    if not query.strip():
        raise ValueError("Query is required.")

    initial_state = {
        "query": query,
        "target_language": target_language,
        "agent_catalog": list(AGENTS.keys()),
    }
    return run_graph(initial_state)


if __name__ == "__main__":
    result = orchestrate(
        "Summarize Ayushman Bharat eligibility and rollout considerations.",
        target_language="hi",
    )
    print("Plan:", result.get("plan"))
    print("Retrieved:", result.get("retrieved"))
    print("Simulation:", result.get("simulation"))
    print("Comms:", result.get("comms"))
    print("Explain:", result.get("explain"))
    print("Traces:", result.get("traces"))
