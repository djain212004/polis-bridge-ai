import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Sparkles,
  Loader2,
  Target,
  TrendingUp,
  Users,
  ShieldAlert,
  Network,
  Lightbulb,
  BookOpen,
} from "lucide-react";

interface SimulationResult {
  policy: {
    title: string;
    summary: string;
    primaryGoal: string;
  };
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
    economicImpactScore: number;
    employmentImpactScore: number;
    fiscalImpactScore: number;
    implementationRiskScore: number;
    publicSupportScore: number;
  };
  recommendations: string[];
  dataGaps: string[];
  assumptions: string[];
  sources: SourceLink[];
}

interface SourceLink {
  title: string;
  url: string;
  note?: string;
}

interface SimulationRun {
  id: string;
  label: string;
  timestamp: number;
  inputs: {
    policyTitle: string;
    policyText: string;
    additionalContext: string;
  };
  results: SimulationResult;
}

const STORAGE_KEY = "policy-sim-history";

const ScoreBar = ({ label, score }: { label: string; score?: number | null }) => {
  const safeScore = typeof score === "number" && Number.isFinite(score) ? score : 0;
  const clamped = Math.min(Math.max(safeScore, 0), 100);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{label}</span>
        <span className="font-semibold text-foreground">{Math.round(clamped)}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};

const listOrFallback = (items?: string[]) =>
  Array.isArray(items) && items.length > 0 ? items : ["Not provided yet."];

const buildPrompt = ({
  policyTitle,
  policyDescription,
  additionalContext,
}: {
  policyTitle: string;
  policyDescription: string;
  additionalContext: string;
}) => `You are an ensemble of collaborating AI policy agents modelling the architecture below.

Architecture:
- Central Orchestrator Agent (coordination, priorities, success criteria)
- Societal Impact Agent (equity, beneficiaries, vulnerable groups, trade-offs)
- Simulation/Data Module (datasets, scenarios, quantified projections)
- Feedback/Adaptation Agent (risks, mitigations, monitoring signals)
- Learning Engine / AutoML (metrics to monitor, retraining triggers, cadence)
- Policy Generation Agent (action plan, stakeholders, implementation steps)
- Explainability Agent (reasoning highlights, transparency caveats, unanswered questions)

Simulate this request with Indian public policy context in mind.
Policy Title: ${policyTitle}
Policy Summary: ${policyDescription}
Additional Context: ${additionalContext}

Return JSON ONLY (no markdown) that exactly matches this schema and uses numbers where indicated:
{
  "policy": {
    "title": string,
    "summary": string,
    "primaryGoal": string
  },
  "centralOrchestrator": {
    "objectives": string[],
    "prioritySignals": string[],
    "successCriteria": string[]
  },
  "societalImpactAgent": {
    "positiveOutcomes": string[],
    "negativeOutcomes": string[],
    "vulnerableGroups": string[],
    "equityConsiderations": string[]
  },
  "simulationModule": {
    "requiredDataSets": string[],
    "scenarioSummary": string,
    "projectedOutcomes": [
      { "scenario": string, "impact": string }
    ]
  },
  "feedbackAdaptationAgent": {
    "keyRisks": string[],
    "mitigationStrategies": string[],
    "monitoringSignals": string[]
  },
  "learningEngine": {
    "metrics": string[],
    "updateCadence": string,
    "adaptationTriggers": string[]
  },
  "policyGenerationAgent": {
    "policyDraft": string,
    "implementationSteps": string[],
    "stakeholderNotes": string[]
  },
  "explainabilityAgent": {
    "reasoningHighlights": string[],
    "transparencyNotes": string[],
    "unresolvedQuestions": string[]
  },
  "aggregatedMetrics": {
    "economicImpactScore": number,
    "employmentImpactScore": number,
    "fiscalImpactScore": number,
    "implementationRiskScore": number,
    "publicSupportScore": number
  },
  "recommendations": string[],
  "dataGaps": string[],
  "assumptions": string[],
  "sources": [
    { "title": string, "url": string, "note"?: string }
  ]
}

Important instructions:
- Percentile/score values must be integers between 0 and 100.
- Keep arrays concise (3-5 items) but insightful.
- If specific data is unavailable, provide the best qualitative estimate and state assumptions.
- Every source URL must be a real domain (gov.in, nic.in, org, etc.). Do not invent URLs.
- Do not include explanations outside the JSON.`;

const PolicySimulator = () => {
  const [policyTitle, setPolicyTitle] = useState("");
  const [policyText, setPolicyText] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [scenarioLabel, setScenarioLabel] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<SimulationResult | null>(null);
  const [scenarioResults, setScenarioResults] = useState<SimulationRun[]>([]);
  const [variantText, setVariantText] = useState("");
  const [history, setHistory] = useState<SimulationRun[]>([]);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setHistory(JSON.parse(raw) as SimulationRun[]);
      }
    } catch (err) {
      console.warn("Failed to load sim history:", err);
    }
  }, []);

  const persistHistory = (runs: SimulationRun[]) => {
    setHistory(runs);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(runs));
    }
  };

  const runSimulation = async (title: string, description: string, context: string) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Missing VITE_GEMINI_API_KEY env variable.");
    }

    const prompt = buildPrompt({
      policyTitle: title || "Untitled Policy",
      policyDescription: description,
      additionalContext: context || "No additional context provided.",
    });

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent" +
        `?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.35,
            topK: 32,
            topP: 0.95,
            responseMimeType: "application/json",
          },
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(` error ${response.status}: ${errorText}`);
    }

    const geminiPayload = await response.json();
    const contentText: string | undefined =
      geminiPayload?.candidates?.[0]?.content?.parts?.[0]?.text ??
      geminiPayload?.candidates?.[0]?.content?.parts?.[0]?.data;

    if (!contentText) {
      throw new Error("Agent returned no content. Try refining the policy description.");
    }

    return JSON.parse(contentText) as SimulationResult;
  };

  const analyzePolicy = async () => {
    if (!policyText.trim()) {
      toast({
        title: "Policy description missing",
        description: "Please describe the policy you want to simulate.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setResults(null);
    setScenarioResults([]);

    try {
      const parsed = await runSimulation(
        policyTitle || "Untitled Policy",
        policyText,
        additionalContext || "No additional context provided.",
      );
      setResults(parsed);
    } catch (error) {
      console.error("Policy simulation error:", error);
      toast({
        title: "Simulation failed",
        description: error instanceof Error ? error.message : "Unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeVariants = async () => {
    if (!policyText.trim()) {
      toast({
        title: "Policy description missing",
        description: "Please describe the policy you want to simulate.",
        variant: "destructive",
      });
      return;
    }
    const variants = variantText
      .split("\n")
      .map((v) => v.trim())
      .filter(Boolean);
    if (variants.length === 0) {
      toast({
        title: "No variants provided",
        description: "Add one scenario per line in the variants box.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setResults(null);
    setScenarioResults([]);

    try {
      const scenarios = [
        {
          label: scenarioLabel || policyTitle || "Base scenario",
          desc: policyText,
          ctx: additionalContext || "No additional context provided.",
        },
        ...variants.map((v, idx) => ({
          label: v,
          desc: `${policyText}\n\nScenario variation: ${v}`,
          ctx: `${additionalContext || "No additional context provided."}\nScenario: ${v}`,
        })),
      ];

      const runs: SimulationRun[] = [];
      for (const scenario of scenarios) {
        const result = await runSimulation(scenario.label, scenario.desc, scenario.ctx);
        runs.push({
          id: crypto.randomUUID(),
          label: scenario.label,
          timestamp: Date.now(),
          inputs: {
            policyTitle: scenario.label,
            policyText: scenario.desc,
            additionalContext: scenario.ctx,
          },
          results: result,
        });
      }

      setScenarioResults(runs);
      setResults(runs[0]?.results ?? null);
      toast({
        title: "Scenarios completed",
        description: `Ran ${runs.length} scenario${runs.length > 1 ? "s" : ""}.`,
      });
    } catch (error) {
      console.error("Multi-scenario simulation error:", error);
      toast({
        title: "Simulation failed",
        description: error instanceof Error ? error.message : "Unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <section className="py-20 px-4 bg-background">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <Badge className="bg-primary/10 text-primary border-primary/20 mb-4">
            Policy Analysis
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Multi-Agent Policy Simulation
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Run orchestrator, impact, learning, and explainability agents to stress-test policy proposals
            for India using Agent intelligence.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="p-6 border-border shadow-soft space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Policy Inputs</h3>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Target className="w-4 h-4" />
                Policy Title / Scenario
              </label>
              <Input
                placeholder="Eg. Inclusive Rural Connectivity Mission"
                value={policyTitle}
                onChange={(e) => setPolicyTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Scenario Label (for comparisons)
              </label>
              <Input
                placeholder="Eg. High funding urban focus"
                value={scenarioLabel}
                onChange={(e) => setScenarioLabel(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Policy Description
              </label>
              <Textarea
                placeholder="Describe the policy, target population, funding model, and expected benefits..."
                className="min-h-[200px] resize-none"
                value={policyText}
                onChange={(e) => setPolicyText(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Additional Context (optional)
              </label>
              <Textarea
                placeholder="Add implementation constraints, existing programmes, regional focus, datasets..."
                className="min-h-[120px] resize-none"
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Scenario Variants (one per line)
              </label>
              <Textarea
                placeholder="Eg. High urban funding focus&#10;Low budget rural-first&#10;Digital-only delivery"
                className="min-h-[100px] resize-none"
                value={variantText}
                onChange={(e) => setVariantText(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Base scenario uses the main fields above. Variants will run sequentially and can be compared.
              </p>
            </div>

            <Button
              onClick={analyzePolicy}
              disabled={isAnalyzing}
              className="w-full bg-primary hover:bg-primary-glow text-primary-foreground"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Running multi-agent simulation...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analyze Policy
                </>
              )}
            </Button>

            <Button
              onClick={analyzeVariants}
              disabled={isAnalyzing || !variantText.trim()}
              variant="outline"
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Running multi-scenario batch...
                </>
              ) : (
                <>
                  <Network className="w-4 h-4 mr-2" />
                  Analyze variants batch
                </>
              )}
            </Button>
          </Card>

          <Card className="p-6 border-border shadow-soft overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-foreground">Simulation Output</h3>
              {isAnalyzing && (
                <span className="text-xs text-muted-foreground flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Aggregating agent signals...
                </span>
              )}
            </div>

            {!results ? (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                <div className="text-center max-w-sm space-y-2">
                  <Network className="w-12 h-12 mx-auto opacity-30" />
                  <p className="text-sm">
                    Submit a policy proposal to trigger the central orchestrator, simulation, feedback, and explainability agents.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
                <Card className="p-4 border-border bg-card space-y-3">
                  <Badge className="bg-primary/10 text-primary border-primary/20">Central Orchestrator</Badge>
                  <div>
                    <h4 className="text-lg font-semibold text-foreground">{results.policy.title}</h4>
                    <p className="text-sm text-muted-foreground">{results.policy.summary}</p>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <Target className="w-3 h-3" />
                    Primary goal:
                    <span className="font-medium text-foreground">{results.policy.primaryGoal}</span>
                  </div>
                  <SectionList title="Objectives" items={listOrFallback(results.centralOrchestrator.objectives)} />
                  <SectionList title="Priority signals" items={listOrFallback(results.centralOrchestrator.prioritySignals)} />
                  <SectionList title="Success criteria" items={listOrFallback(results.centralOrchestrator.successCriteria)} />
                </Card>

                <Card className="p-4 border-border bg-card">
                  <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Aggregated Impact Scores
                  </h4>
                  <div className="space-y-3">
                    <ScoreBar label="Economic Impact" score={results.aggregatedMetrics.economicImpactScore ?? 0} />
                    <ScoreBar label="Employment Impact" score={results.aggregatedMetrics.employmentImpactScore ?? 0} />
                    <ScoreBar label="Fiscal Impact" score={results.aggregatedMetrics.fiscalImpactScore ?? 0} />
                    <ScoreBar label="Implementation Risk" score={results.aggregatedMetrics.implementationRiskScore ?? 0} />
                    <ScoreBar label="Public Support" score={results.aggregatedMetrics.publicSupportScore ?? 0} />
                  </div>
                </Card>

                <Card className="p-4 border-border bg-card space-y-3">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Users className="w-4 h-4 text-secondary" />
                    Societal Impact Agent
                  </h4>
                  <SectionList title="Positive outcomes" items={listOrFallback(results.societalImpactAgent.positiveOutcomes)} />
                  <SectionList title="Negative outcomes" items={listOrFallback(results.societalImpactAgent.negativeOutcomes)} />
                  <SectionList title="Vulnerable groups" items={listOrFallback(results.societalImpactAgent.vulnerableGroups)} />
                  <SectionList title="Equity considerations" items={listOrFallback(results.societalImpactAgent.equityConsiderations)} />
                </Card>

                <Card className="p-4 border-border bg-card space-y-3">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Network className="w-4 h-4 text-accent" />
                    Simulation & Data Module
                  </h4>
                  <SectionList title="Required datasets" items={listOrFallback(results.simulationModule.requiredDataSets)} />
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-1">Scenario summary</p>
                    <p className="text-sm text-muted-foreground">{results.simulationModule.scenarioSummary}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-1">Projected outcomes</p>
                    <div className="space-y-2">
                      {results.simulationModule.projectedOutcomes?.map((item, index) => (
                        <div key={`${item.scenario}-${index}`} className="rounded-md border border-border bg-muted/30 p-3">
                          <p className="text-sm font-medium text-foreground">{item.scenario}</p>
                          <p className="text-xs text-muted-foreground">{item.impact}</p>
                        </div>
                      )) ?? (
                        <p className="text-xs text-muted-foreground">No projected outcomes provided.</p>
                      )}
                    </div>
                  </div>
                </Card>

                <Card className="p-4 border-border bg-card space-y-3">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-destructive" />
                    Feedback & Adaptation Agent
                  </h4>
                  <SectionList title="Key risks" items={listOrFallback(results.feedbackAdaptationAgent.keyRisks)} />
                  <SectionList title="Mitigation strategies" items={listOrFallback(results.feedbackAdaptationAgent.mitigationStrategies)} />
                  <SectionList title="Monitoring signals" items={listOrFallback(results.feedbackAdaptationAgent.monitoringSignals)} />
                </Card>

                <Card className="p-4 border-border bg-card space-y-3">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                    Learning Engine
                  </h4>
                  <SectionList title="Metrics" items={listOrFallback(results.learningEngine.metrics)} />
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-1">Update cadence</p>
                    <p className="text-sm text-muted-foreground">{results.learningEngine.updateCadence}</p>
                  </div>
                  <SectionList title="Adaptation triggers" items={listOrFallback(results.learningEngine.adaptationTriggers)} />
                </Card>

                <Card className="p-4 border-border bg-card space-y-3">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Policy Generation Agent
                  </h4>
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-1">Draft policy narrative</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {results.policyGenerationAgent.policyDraft}
                    </p>
                  </div>
                  <SectionList title="Implementation steps" items={listOrFallback(results.policyGenerationAgent.implementationSteps)} />
                  <SectionList title="Stakeholder notes" items={listOrFallback(results.policyGenerationAgent.stakeholderNotes)} />
                </Card>

                <Card className="p-4 border-border bg-card space-y-3">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-blue-500" />
                    Explainability Agent
                  </h4>
                  <SectionList title="Reasoning highlights" items={listOrFallback(results.explainabilityAgent.reasoningHighlights)} />
                  <SectionList title="Transparency notes" items={listOrFallback(results.explainabilityAgent.transparencyNotes)} />
                  <SectionList title="Unresolved questions" items={listOrFallback(results.explainabilityAgent.unresolvedQuestions)} />
                </Card>

                <Card className="p-4 border-border bg-card space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">
                    Actionable Insights
                  </h4>
                  <SectionList title="Recommendations" items={listOrFallback(results.recommendations)} />
                  <SectionList title="Data gaps" items={listOrFallback(results.dataGaps)} />
                  <SectionList title="Key assumptions" items={listOrFallback(results.assumptions)} />
                  <SourceList sources={results.sources} />
                </Card>
              </div>
            )}
          </Card>
        </div>

        {results && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (!results) return;
                const run: SimulationRun = {
                  id: crypto.randomUUID(),
                  label: scenarioLabel || results.policy.title || "Untitled scenario",
                  timestamp: Date.now(),
                  inputs: {
                    policyTitle,
                    policyText,
                    additionalContext,
                  },
                  results,
                };
                const next = [run, ...history].slice(0, 20);
                persistHistory(next);
                toast({
                  title: "Scenario saved",
                  description: "Find it in the history list for replay/compare.",
                });
              }}
            >
              Save this scenario
            </Button>
            {history.length > 0 && (
              <Button
                variant="outline"
                onClick={() => {
                  setCompareIds([]);
                  toast({ title: "Comparison cleared" });
                }}
              >
                Clear comparison
              </Button>
            )}
          </div>
        )}

        {history.length > 0 && (
          <div className="mt-8 grid lg:grid-cols-3 gap-4">
            <Card className="p-4 border-border shadow-soft lg:col-span-1">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-foreground">Saved Scenarios</h4>
                <span className="text-xs text-muted-foreground">{history.length}</span>
              </div>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {history.map((run) => (
                  <div key={run.id} className="border border-border rounded-lg p-3 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{run.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(run.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <label className="flex items-center gap-1 text-xs text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={compareIds.includes(run.id)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setCompareIds((prev) => {
                              if (checked) {
                                const next = [...prev, run.id].slice(-2);
                                return next;
                              }
                              return prev.filter((id) => id !== run.id);
                            });
                          }}
                        />
                        Compare
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setResults(run.results);
                          setPolicyTitle(run.inputs.policyTitle);
                          setPolicyText(run.inputs.policyText);
                          setAdditionalContext(run.inputs.additionalContext);
                          setScenarioLabel(run.label);
                        }}
                      >
                        Load
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {compareIds.length === 2 && (
              <Card className="p-4 border-border shadow-soft lg:col-span-2">
                <h4 className="text-sm font-semibold text-foreground mb-3">Comparison (Aggregated Metrics)</h4>
                <ComparisonTable runs={history.filter((r) => compareIds.includes(r.id))} />
              </Card>
            )}
          </div>
        )}

        {scenarioResults.length > 1 && (
          <div className="mt-8">
            <Card className="p-4 border-border shadow-soft">
              <h4 className="text-sm font-semibold text-foreground mb-3">Batch Scenario Comparison</h4>
              <div className="space-y-2">
                {scenarioResults.map((run) => (
                  <div key={run.id} className="flex items-center justify-between text-sm border border-border rounded px-3 py-2">
                    <span className="font-medium text-foreground">{run.label}</span>
                    <div className="flex gap-3 text-muted-foreground">
                      <span>Economic: {Math.round(run.results.aggregatedMetrics.economicImpactScore ?? 0)}%</span>
                      <span>Employment: {Math.round(run.results.aggregatedMetrics.employmentImpactScore ?? 0)}%</span>
                      <span>Public Support: {Math.round(run.results.aggregatedMetrics.publicSupportScore ?? 0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
              {scenarioResults.length >= 2 ? (
                <div className="mt-4">
                  <ComparisonTable runs={scenarioResults.slice(0, 2)} />
                </div>
              ) : null}
            </Card>
          </div>
        )}
      </div>
    </section>
  );
};

const SectionList = ({ title, items }: { title: string; items: string[] }) => (
  <div>
    <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-1">{title}</p>
    <ul className="list-disc pl-4 space-y-1">
      {items.map((item, index) => (
        <li key={`${title}-${index}`} className="text-sm text-muted-foreground">
          {item}
        </li>
      ))}
    </ul>
  </div>
);

const SourceList = ({ sources }: { sources?: SourceLink[] }) => {
  if (!sources || sources.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-1">Sources</p>
      <ul className="list-disc pl-4 space-y-1">
        {sources.map((source, index) => (
          <li key={`${source.url}-${index}`} className="text-sm text-muted-foreground">
            {source.title ? <span className="font-medium text-foreground">{source.title}: </span> : null}
            {source.url ? (
              <a
                href={source.url}
                className="text-primary underline"
                target="_blank"
                rel="noreferrer"
              >
                {source.url}
              </a>
            ) : (
              "No URL provided"
            )}
            {source.note ? <span className="text-xs text-muted-foreground"> — {source.note}</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
};

const ComparisonTable = ({ runs }: { runs: SimulationRun[] }) => {
  if (runs.length !== 2) return null;
  const [a, b] = runs;
  const metrics = [
    { key: "economicImpactScore", label: "Economic Impact" },
    { key: "employmentImpactScore", label: "Employment Impact" },
    { key: "fiscalImpactScore", label: "Fiscal Impact" },
    { key: "implementationRiskScore", label: "Implementation Risk" },
    { key: "publicSupportScore", label: "Public Support" },
  ] as const;

  const getScore = (run: SimulationRun, key: typeof metrics[number]["key"]) =>
    run.results.aggregatedMetrics[key] ?? 0;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-muted-foreground">
            <th className="py-2 pr-2">Metric</th>
            <th className="py-2 pr-2">{a.label}</th>
            <th className="py-2 pr-2">{b.label}</th>
            <th className="py-2 pr-2">Δ (B - A)</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((m) => {
            const aScore = getScore(a, m.key);
            const bScore = getScore(b, m.key);
            const delta = Math.round(bScore - aScore);
            const sign = delta > 0 ? "+" : "";
            return (
              <tr key={m.key} className="border-t border-border">
                <td className="py-2 pr-2 font-medium text-foreground">{m.label}</td>
                <td className="py-2 pr-2">{Math.round(aScore)}%</td>
                <td className="py-2 pr-2">{Math.round(bScore)}%</td>
                <td className={`py-2 pr-2 ${delta > 0 ? "text-green-600" : delta < 0 ? "text-red-600" : ""}`}>
                  {sign}
                  {delta}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default PolicySimulator;
