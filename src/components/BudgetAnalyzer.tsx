import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { generateGeminiJson } from "@/lib/gemini";
import {
  IndianRupee,
  Loader2,
  TrendingUp,
  Users,
  BarChart3,
  Lightbulb,
  ExternalLink,
} from "lucide-react";

interface BudgetAnalysis {
  summary: string;
  scores: {
    adequacy: number;
    equity: number;
    efficiency: number;
    transparency: number;
  };
  fiscalAnalyst: {
    adequacyAssessment: string;
    perCapitaEstimate: string;
    absorptionCapacity: string;
    gaps: string[];
  };
  equityAuditor: {
    equityAssessment: string;
    affectedGroups: string[];
    genderImpact: string;
    ruralUrbanSplit: string;
    recommendations: string[];
  };
  benchmarker: {
    peerComparisons: Array<{ state: string; allocation: string; outcome: string }>;
    nationalAverage: string;
    ranking: string;
    insights: string[];
  };
  recommendations: string[];
  sources: Array<{ title: string; url: string }>;
}

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Delhi", "Jammu and Kashmir",
  "Ladakh", "Lakshadweep", "Puducherry",
];

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

const BudgetAnalyzer = () => {
  const [state, setState] = useState("");
  const [scheme, setScheme] = useState("");
  const [budget, setBudget] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<BudgetAnalysis | null>(null);
  const { toast } = useToast();

  const analyze = async () => {
    if (!state || !scheme.trim() || !budget.trim()) {
      toast({
        title: "Missing information",
        description: "Please select a state, enter a scheme/department, and specify the budget.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    const prompt = `You are a system of 3 collaborating AI agents that analyze Indian government budget allocations.

AGENTS:
1. Fiscal Analyst — Assess whether the budget is adequate for the stated goal. Provide per-capita estimate, absorption capacity analysis, and identify fiscal gaps.
2. Equity Auditor — Evaluate whether this allocation fairly serves all demographics. Analyze gender impact, rural/urban split, SC/ST/OBC impact, and provide equity recommendations.
3. Comparative Benchmarker — Compare this allocation with peer states and the national average. Provide rankings and insights.

ANALYSIS REQUEST:
- State: ${state}
- Department/Scheme: ${scheme}
- Budget Allocation: ₹${budget} crores

Return JSON ONLY matching this exact schema:
{
  "summary": string (2-3 sentence overall assessment),
  "scores": {
    "adequacy": number (0-100, is the budget sufficient?),
    "equity": number (0-100, does it serve all groups fairly?),
    "efficiency": number (0-100, how well can this be utilized?),
    "transparency": number (0-100, how trackable is the spending?)
  },
  "fiscalAnalyst": {
    "adequacyAssessment": string (detailed assessment),
    "perCapitaEstimate": string (per-capita calculation),
    "absorptionCapacity": string (can the state actually spend this?),
    "gaps": string[] (3-5 fiscal gaps identified)
  },
  "equityAuditor": {
    "equityAssessment": string (overall equity assessment),
    "affectedGroups": string[] (groups impacted),
    "genderImpact": string (gender-specific analysis),
    "ruralUrbanSplit": string (rural vs urban distribution analysis),
    "recommendations": string[] (3-5 equity improvement suggestions)
  },
  "benchmarker": {
    "peerComparisons": [{ "state": string, "allocation": string, "outcome": string }] (3-4 peer states),
    "nationalAverage": string (national average for this sector),
    "ranking": string (where this state ranks),
    "insights": string[] (3-5 comparative insights)
  },
  "recommendations": string[] (5-7 actionable recommendations),
  "sources": [{ "title": string, "url": string }] (real gov.in/nic.in URLs only)
}

Instructions:
- Scores must be integers 0-100
- Use real data and estimates for ${state}
- Peer comparisons should use similar-sized or neighboring states
- All source URLs must be real domains (budget.gov.in, finance.gov.in, rbi.org.in, etc.)
- Be specific to the Indian fiscal context`;

    try {
      const data = await generateGeminiJson<BudgetAnalysis>(prompt);
      setResult(data);
    } catch (err) {
      toast({
        title: "Analysis failed",
        description: err instanceof Error ? err.message : "Unexpected error.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <Badge className="bg-secondary/10 text-secondary border-secondary/20 mb-4">
            3-Agent Budget Ensemble
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Budget Allocation Analyzer
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Pick a state, scheme, and budget amount. Three AI agents analyze adequacy, equity,
            and comparative benchmarks to assess the allocation.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Panel */}
          <Card className="p-6 border-border shadow-soft space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                <IndianRupee className="w-5 h-5 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Budget Inputs</h3>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">State / UT</label>
              <Select value={state} onValueChange={setState}>
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {INDIAN_STATES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Department / Scheme Name</label>
              <Input
                placeholder="e.g. PM-KISAN, Education Department, MGNREGA"
                value={scheme}
                onChange={(e) => setScheme(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Budget Allocation (in Crores ₹)</label>
              <Input
                type="number"
                placeholder="e.g. 5000"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </div>

            <Button
              onClick={analyze}
              disabled={isLoading}
              className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing Budget...
                </>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analyze Budget
                </>
              )}
            </Button>

            <div className="p-3 bg-muted/40 rounded-lg border border-border">
              <p className="text-xs text-muted-foreground font-medium mb-1">Try these examples:</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                <li>Maharashtra + Education Department + ₹15,000 crores</li>
                <li>Bihar + MGNREGA + ₹8,000 crores</li>
                <li>Kerala + Health Department + ₹6,500 crores</li>
              </ul>
            </div>
          </Card>

          {/* Output Panel */}
          <Card className="p-6 border-border shadow-soft overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-foreground">Analysis Output</h3>
              {isLoading && (
                <span className="text-xs text-muted-foreground flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  3 agents analyzing...
                </span>
              )}
            </div>

            {!result && !isLoading && (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                <div className="text-center max-w-sm space-y-2">
                  <IndianRupee className="w-12 h-12 mx-auto opacity-30" />
                  <p className="text-sm">
                    Enter budget details to get a multi-agent analysis of adequacy, equity, and benchmarks.
                  </p>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="flex items-center justify-center h-[250px]">
                <div className="text-center space-y-3">
                  <Loader2 className="w-10 h-10 mx-auto animate-spin text-secondary" />
                  <p className="text-sm text-muted-foreground">Running fiscal, equity, and benchmark analysis...</p>
                </div>
              </div>
            )}

            {result && (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {/* Summary */}
                <Card className="p-4 border-border bg-card">
                  <p className="text-sm text-muted-foreground">{result.summary}</p>
                </Card>

                {/* Score Bars */}
                <Card className="p-4 border-border bg-card">
                  <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Budget Health Scores
                  </h4>
                  <div className="space-y-3">
                    <ScoreBar label="Adequacy" score={result.scores.adequacy} />
                    <ScoreBar label="Equity" score={result.scores.equity} />
                    <ScoreBar label="Efficiency" score={result.scores.efficiency} />
                    <ScoreBar label="Transparency" score={result.scores.transparency} />
                  </div>
                </Card>

                {/* Fiscal Analyst */}
                <Card className="p-4 border-border bg-card space-y-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200">Agent 1: Fiscal Analyst</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{result.fiscalAnalyst.adequacyAssessment}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-xs text-muted-foreground">Per-Capita Estimate</span>
                      <p className="font-medium text-foreground">{result.fiscalAnalyst.perCapitaEstimate}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Absorption Capacity</span>
                      <p className="font-medium text-foreground">{result.fiscalAnalyst.absorptionCapacity}</p>
                    </div>
                  </div>
                  <SectionList title="Fiscal Gaps" items={result.fiscalAnalyst.gaps} />
                </Card>

                {/* Equity Auditor */}
                <Card className="p-4 border-border bg-card space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-green-600" />
                    <Badge className="bg-green-100 text-green-700 border-green-200">Agent 2: Equity Auditor</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{result.equityAuditor.equityAssessment}</p>
                  <SectionList title="Affected Groups" items={result.equityAuditor.affectedGroups} />
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-xs text-muted-foreground">Gender Impact</span>
                      <p className="text-muted-foreground">{result.equityAuditor.genderImpact}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Rural/Urban Split</span>
                      <p className="text-muted-foreground">{result.equityAuditor.ruralUrbanSplit}</p>
                    </div>
                  </div>
                  <SectionList title="Equity Recommendations" items={result.equityAuditor.recommendations} />
                </Card>

                {/* Benchmarker */}
                <Card className="p-4 border-border bg-card space-y-3">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-orange-500" />
                    <Badge className="bg-orange-100 text-orange-700 border-orange-200">Agent 3: Comparative Benchmarker</Badge>
                  </div>
                  <div className="text-sm space-y-1">
                    <p><span className="font-medium text-foreground">National Average:</span> <span className="text-muted-foreground">{result.benchmarker.nationalAverage}</span></p>
                    <p><span className="font-medium text-foreground">Ranking:</span> <span className="text-muted-foreground">{result.benchmarker.ranking}</span></p>
                  </div>
                  {result.benchmarker.peerComparisons?.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-muted-foreground">
                            <th className="py-1.5 pr-2">State</th>
                            <th className="py-1.5 pr-2">Allocation</th>
                            <th className="py-1.5">Outcome</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.benchmarker.peerComparisons.map((p, i) => (
                            <tr key={i} className="border-t border-border">
                              <td className="py-1.5 pr-2 font-medium text-foreground">{p.state}</td>
                              <td className="py-1.5 pr-2 text-muted-foreground">{p.allocation}</td>
                              <td className="py-1.5 text-muted-foreground">{p.outcome}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <SectionList title="Insights" items={result.benchmarker.insights} />
                </Card>

                {/* Recommendations */}
                <Card className="p-4 border-border bg-card space-y-3">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                    Actionable Recommendations
                  </h4>
                  <SectionList title="Recommendations" items={result.recommendations} />
                </Card>

                {/* Sources */}
                {result.sources?.length > 0 && (
                  <Card className="p-4 border-border bg-card space-y-2">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <ExternalLink className="w-4 h-4" />
                      Sources
                    </h4>
                    <ul className="space-y-1">
                      {result.sources.map((s, i) => (
                        <li key={i} className="text-xs">
                          <span className="font-medium text-foreground">{s.title}: </span>
                          <a href={s.url} target="_blank" rel="noreferrer" className="text-primary underline hover:text-primary/80">
                            {s.url}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
};

export default BudgetAnalyzer;
