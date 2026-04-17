import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { generateGeminiJson } from "@/lib/gemini";
import {
  MessageSquareWarning,
  Loader2,
  Filter,
  MapPin,
  FileText,
  Copy,
  CheckCircle,
  ExternalLink,
  AlertTriangle,
  Clock,
} from "lucide-react";

interface GrievanceResult {
  triage: {
    domain: string;
    urgency: "low" | "medium" | "high" | "critical";
    jurisdiction: "central" | "state" | "local";
    summary: string;
  };
  routing: {
    primaryPortal: { name: string; url: string; helpline: string };
    alternateChannels: Array<{ name: string; url: string }>;
    responsibleDepartment: string;
    escalationAuthority: string;
  };
  complaint: {
    subjectLine: string;
    draftText: string;
    attachmentsNeeded: string[];
    escalationTimeline: Array<{ day: number; action: string; authority: string }>;
  };
  tips: string[];
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

const urgencyConfig: Record<string, { label: string; className: string }> = {
  low: { label: "Low", className: "bg-green-100 text-green-700 border-green-200" },
  medium: { label: "Medium", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  high: { label: "High", className: "bg-orange-100 text-orange-700 border-orange-200" },
  critical: { label: "Critical", className: "bg-red-100 text-red-700 border-red-200" },
};

const jurisdictionLabel: Record<string, string> = {
  central: "Central Government",
  state: "State Government",
  local: "Local Body / Municipality",
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

const GrievanceRouter = () => {
  const [grievance, setGrievance] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GrievanceResult | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const generate = async () => {
    if (!grievance.trim() || !state) {
      toast({
        title: "Missing information",
        description: "Please describe your grievance and select a state.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    const prompt = `You are a system of 3 collaborating AI agents that help Indian citizens file civic grievances and complaints through the correct government channels.

AGENTS:
1. Triage Agent — Classify the grievance by domain (water, electricity, pension, land, roads, sanitation, etc.), assess urgency, and determine jurisdiction (central/state/local).
2. Routing Agent — Identify the correct grievance portal (CPGRAMS for central, state IGRS, Municipal Corporation portal, etc.) with URLs and helpline numbers. Also identify the responsible department and escalation authority.
3. Drafting Agent — Write a formal complaint letter and create a step-by-step escalation timeline with specific days and authorities.

USER'S GRIEVANCE:
"""
${grievance}
"""

State: ${state}
${district ? `District: ${district}` : ""}

Return JSON ONLY matching this exact schema:
{
  "triage": {
    "domain": string (e.g. "Water Supply", "Electricity", "Roads", "Pension", "Land Records"),
    "urgency": "low" | "medium" | "high" | "critical",
    "jurisdiction": "central" | "state" | "local",
    "summary": string (1-2 sentence triage summary)
  },
  "routing": {
    "primaryPortal": {
      "name": string (portal name, e.g. "CPGRAMS", "IGRS ${state}"),
      "url": string (real portal URL),
      "helpline": string (helpline number)
    },
    "alternateChannels": [{ "name": string, "url": string }] (2-3 alternate portals/channels),
    "responsibleDepartment": string (full department name),
    "escalationAuthority": string (who to escalate to if no response)
  },
  "complaint": {
    "subjectLine": string (formal complaint subject line),
    "draftText": string (complete formal complaint letter with placeholder [YOUR NAME], [YOUR ADDRESS], [DATE], ready to submit),
    "attachmentsNeeded": string[] (documents the citizen should attach),
    "escalationTimeline": [
      { "day": number, "action": string, "authority": string }
    ] (4-6 escalation steps, e.g. day 0: file complaint, day 30: first reminder, day 60: escalate to higher authority, etc.)
  },
  "tips": string[] (4-6 practical tips for effective grievance redressal)
}

Instructions:
- Use real portal URLs for ${state} (pgportal.gov.in for CPGRAMS, state-specific IGRS portals, etc.)
- Use real helpline numbers where known (e.g., 1800-11-00-31 for CPGRAMS)
- The complaint draft should be formal, complete, and ready to submit
- Escalation timeline should be realistic with specific day numbers
- Be specific to ${state}'s administrative structure`;

    try {
      const data = await generateGeminiJson<GrievanceResult>(prompt);
      setResult(data);
    } catch (err) {
      toast({
        title: "Generation failed",
        description: err instanceof Error ? err.message : "Unexpected error.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyComplaint = () => {
    if (!result) return;
    const text = `Subject: ${result.complaint.subjectLine}\n\n${result.complaint.draftText}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: "Complaint draft copied to clipboard!" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="py-20 px-4 bg-background">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <Badge className="bg-destructive/10 text-destructive border-destructive/20 mb-4">
            3-Agent Grievance Pipeline
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Grievance Redressal Router
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Describe your civic complaint and our 3 AI agents will triage it, route it to the
            correct portal, and draft a formal complaint with an escalation timeline.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Panel */}
          <Card className="p-6 border-border shadow-soft space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                <MessageSquareWarning className="w-5 h-5 text-destructive" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Describe Your Grievance</h3>
            </div>

            <Textarea
              placeholder={`Describe your civic complaint...\n\nExample: "Water supply in our colony has been irregular for 3 months. Despite multiple calls to the municipal office, no action has been taken. We are a colony of 200 families."`}
              className="min-h-[180px] resize-none"
              value={grievance}
              onChange={(e) => setGrievance(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-4">
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
                <label className="text-sm font-medium text-foreground mb-1.5 block">District (optional)</label>
                <Input
                  placeholder="e.g. Pune, Lucknow"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                />
              </div>
            </div>

            <Button
              onClick={generate}
              disabled={isLoading}
              className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Routing & Drafting...
                </>
              ) : (
                <>
                  <MessageSquareWarning className="w-4 h-4 mr-2" />
                  Route & Draft Complaint
                </>
              )}
            </Button>

            <div className="p-3 bg-muted/40 rounded-lg border border-border">
              <p className="text-xs text-muted-foreground font-medium mb-1">Try these examples:</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                <li>"Water supply has been irregular for 3 months in our colony"</li>
                <li>"Street lights in our area have not been working for 6 months"</li>
                <li>"My pension has been delayed for 4 months despite submitting all documents"</li>
              </ul>
            </div>
          </Card>

          {/* Output Panel */}
          <Card className="p-6 border-border shadow-soft overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-foreground">Agent Output</h3>
              {isLoading && (
                <span className="text-xs text-muted-foreground flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  3 agents processing...
                </span>
              )}
            </div>

            {!result && !isLoading && (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                <div className="text-center max-w-sm space-y-2">
                  <MessageSquareWarning className="w-12 h-12 mx-auto opacity-30" />
                  <p className="text-sm">
                    Describe a civic complaint to get it triaged, routed to the right portal, and a formal complaint drafted.
                  </p>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="flex items-center justify-center h-[250px]">
                <div className="text-center space-y-3">
                  <Loader2 className="w-10 h-10 mx-auto animate-spin text-destructive" />
                  <p className="text-sm text-muted-foreground">Running triage, routing, and drafting agents...</p>
                </div>
              </div>
            )}

            {result && (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {/* Agent 1: Triage */}
                <Card className="p-4 border-border bg-card space-y-3">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-blue-500" />
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200">Agent 1: Triage</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{result.triage.domain}</Badge>
                    <Badge className={urgencyConfig[result.triage.urgency]?.className ?? "bg-muted"}>
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {urgencyConfig[result.triage.urgency]?.label ?? result.triage.urgency}
                    </Badge>
                    <Badge variant="outline">{jurisdictionLabel[result.triage.jurisdiction] ?? result.triage.jurisdiction}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{result.triage.summary}</p>
                </Card>

                {/* Agent 2: Routing */}
                <Card className="p-4 border-border bg-card space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-green-600" />
                    <Badge className="bg-green-100 text-green-700 border-green-200">Agent 2: Routing</Badge>
                  </div>
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">{result.routing.primaryPortal.name}</p>
                      <a
                        href={result.routing.primaryPortal.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary underline flex items-center gap-1 hover:text-primary/80"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Visit Portal
                      </a>
                    </div>
                    <p className="text-xs text-muted-foreground">Helpline: {result.routing.primaryPortal.helpline}</p>
                  </div>
                  <div className="text-sm space-y-1">
                    <p><span className="font-medium text-foreground">Department:</span> <span className="text-muted-foreground">{result.routing.responsibleDepartment}</span></p>
                    <p><span className="font-medium text-foreground">Escalation Authority:</span> <span className="text-muted-foreground">{result.routing.escalationAuthority}</span></p>
                  </div>
                  {result.routing.alternateChannels?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1">Alternate Channels</p>
                      <div className="space-y-1">
                        {result.routing.alternateChannels.map((ch, i) => (
                          <a
                            key={i}
                            href={ch.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block text-xs text-primary underline hover:text-primary/80"
                          >
                            {ch.name}: {ch.url}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>

                {/* Agent 3: Drafting */}
                <Card className="p-4 border-border bg-card space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-orange-500" />
                    <Badge className="bg-orange-100 text-orange-700 border-orange-200">Agent 3: Complaint Drafter</Badge>
                  </div>
                  <div className="text-sm">
                    <p><span className="font-medium text-foreground">Subject:</span> <span className="text-muted-foreground">{result.complaint.subjectLine}</span></p>
                  </div>
                  <div className="bg-muted/40 rounded-lg p-4 border border-border">
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed font-mono">
                      {result.complaint.draftText}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyComplaint}
                    className="w-full"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 mr-1.5 text-green-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 mr-1.5" />
                        Copy Complaint
                      </>
                    )}
                  </Button>
                  <SectionList title="Attachments Needed" items={result.complaint.attachmentsNeeded} />
                </Card>

                {/* Escalation Timeline */}
                {result.complaint.escalationTimeline?.length > 0 && (
                  <Card className="p-4 border-border bg-card space-y-3">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      Escalation Timeline
                    </h4>
                    <div className="relative pl-6 space-y-4">
                      {result.complaint.escalationTimeline.map((step, i) => (
                        <div key={i} className="relative">
                          <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          </div>
                          {i < result.complaint.escalationTimeline.length - 1 && (
                            <div className="absolute -left-4 top-4 w-0.5 h-full bg-primary/20" />
                          )}
                          <div>
                            <p className="text-xs font-bold text-primary">Day {step.day}</p>
                            <p className="text-sm font-medium text-foreground">{step.action}</p>
                            <p className="text-xs text-muted-foreground">{step.authority}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Tips */}
                <Card className="p-4 border-border bg-card space-y-3">
                  <SectionList title="Tips for Effective Grievance Redressal" items={result.tips} />
                </Card>
              </div>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
};

export default GrievanceRouter;
