"""
Agent configuration for the policy workflow.

Purpose
- Centralizes agent identifiers, roles, and priorities so the orchestrator and graph use the same catalog.
- Avoids hard-coded strings scattered across modules.

How to extend
- Add a new Agent entry to AGENTS with: unique name, concise description, and priority (lower runs earlier).
- Keep descriptions action-oriented (what the agent does).
"""

from dataclasses import dataclass, field
from typing import Dict, List


@dataclass(frozen=True)
class Agent:
    name: str
    description: str
    priority: int
    responsibilities: List[str] = field(default_factory=list)
    inputs: List[str] = field(default_factory=list)
    outputs: List[str] = field(default_factory=list)


AGENTS: Dict[str, Agent] = {
    "orchestrator": Agent(
        name="orchestrator",
        description="Plans the workflow and routes to downstream agents.",
        priority=1,
        responsibilities=[
            "Interpret user goal and set target language.",
            "Produce a stepwise plan and call downstream agents.",
            "Merge downstream outputs into a coherent response.",
        ],
        inputs=["query", "target_language"],
        outputs=["plan", "routing_decisions"],
    ),
    "retrieval": Agent(
        name="retrieval",
        description="Fetches relevant policy documents and context.",
        priority=2,
        responsibilities=[
            "Retrieve authoritative policy documents and metadata.",
            "Return citations/URIs for traceability.",
        ],
        inputs=["query", "plan"],
        outputs=["retrieved_docs"],
    ),
    "simulation": Agent(
        name="simulation",
        description="Summarizes policy simulations and impact scores.",
        priority=3,
        responsibilities=[
            "Generate scenario outcomes and impact scores.",
            "Surface assumptions, risks, and data gaps.",
        ],
        inputs=["query", "retrieved_docs", "plan"],
        outputs=["simulation_summary", "impact_metrics", "assumptions"],
    ),
    "comms": Agent(
        name="comms",
        description="Drafts citizen-facing communications in the target language.",
        priority=3,
        responsibilities=[
            "Produce concise, audience-appropriate messaging.",
            "Localize to target_language with clarity/readability.",
        ],
        inputs=["query", "target_language", "simulation_summary"],
        outputs=["communication_draft"],
    ),
    "explain": Agent(
        name="explain",
        description="Adds transparency notes, assumptions, and risks.",
        priority=4,
        responsibilities=[
            "Summarize key signals used in decisions.",
            "Highlight unresolved risks and monitoring signals.",
        ],
        inputs=["plan", "simulation_summary", "impact_metrics", "retrieved_docs"],
        outputs=["explainability_notes"],
    ),
}


def agent_order() -> List[Agent]:
    """Return agents ordered by priority (ascending)."""
    return sorted(AGENTS.values(), key=lambda a: a.priority)
