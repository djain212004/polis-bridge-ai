import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { generateGeminiJson } from "@/lib/gemini";
import {
  FileText,
  Loader2,
  Brain,
  Scale,
  MapPin,
  Lightbulb,
  Copy,
  CheckCircle,
} from "lucide-react";

interface RTIResult {
  intentAnalysis: {
    domain: string;
    department: string;
    informationSought: string[];
    summary: string;
  };
  draftApplication: {
    to: string;
    subject: string;
    body: string;
    feeNote: string;
  };
  authorityRouting: {
    pio: string;
    department: string;
    address: string;
    appellateAuthority: string;
    onlinePortalUrl: string;
  };
  strategyAdvice: {
    expectedTimeline: string;
    tips: string[];
    appealProcess: string[];
    commonPitfalls: string[];
  };
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

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "bn", label: "Bengali" },
  { code: "ta", label: "Tamil" },
  { code: "te", label: "Telugu" },
  { code: "mr", label: "Marathi" },
  { code: "gu", label: "Gujarati" },
  { code: "pa", label: "Punjabi" },
  { code: "kn", label: "Kannada" },
  { code: "ml", label: "Malayalam" },
  { code: "or", label: "Odia" },
];

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

const RTIDraftGenerator = () => {
  const [problem, setProblem] = useState("");
  const [state, setState] = useState("");
  const [language, setLanguage] = useState("en");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RTIResult | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const generate = async () => {
    if (!problem.trim() || !state) {
      toast({
        title: "Missing information",
        description: "Please describe your problem and select a state.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    const langLabel = LANGUAGES.find((l) => l.code === language)?.label ?? "English";

    const prompt = `You are a system of 4 collaborating AI agents that help Indian citizens draft RTI (Right to Information) applications under the RTI Act 2005.

AGENTS:
1. Intent Classifier — Parse the user's problem, identify the governance domain, relevant ministry/department, and what specific information should be sought.
2. Legal Drafter — Construct a complete, legally valid RTI application following RTI Act 2005 (Section 6) format, ready to file.
3. Authority Router — Determine the correct Public Information Officer (PIO) and First Appellate Authority for the given state and department.
4. Strategy Advisor — Provide filing strategy: 30-day response timeline, appeal process, practical tips, and common pitfalls.

USER'S PROBLEM:
"""
${problem}
"""

State: ${state}
Output Language: ${langLabel}

Return JSON ONLY matching this exact schema:
{
  "intentAnalysis": {
    "domain": string (governance domain, e.g. "Public Health", "Infrastructure"),
    "department": string (relevant ministry/department),
    "informationSought": string[] (specific pieces of information to request),
    "summary": string (1-2 sentence summary of what the RTI seeks)
  },
  "draftApplication": {
    "to": string (addressee — PIO designation and department),
    "subject": string (formal subject line for the RTI application),
    "body": string (complete RTI application body text in ${langLabel}, following Section 6 format, including applicant placeholder [YOUR NAME], [YOUR ADDRESS], date, and all required elements),
    "feeNote": string (fee amount and payment method — typically Rs. 10 via IPO/DD/cash)
  },
  "authorityRouting": {
    "pio": string (designation of the Public Information Officer),
    "department": string (full department name),
    "address": string (office address to send the application),
    "appellateAuthority": string (First Appellate Authority designation),
    "onlinePortalUrl": string (RTI online portal URL — rtionline.gov.in for central, or state portal)
  },
  "strategyAdvice": {
    "expectedTimeline": string (e.g. "30 days for response, 30 days for first appeal"),
    "tips": string[] (3-5 practical tips for effective RTI filing),
    "appealProcess": string[] (step-by-step appeal process if no response),
    "commonPitfalls": string[] (common mistakes to avoid)
  }
}

Instructions:
- Write the RTI application body in ${langLabel} language
- Make the application legally valid and ready to file
- Use real department names and designations for ${state}
- Include real portal URLs (rtionline.gov.in for central departments, state-specific portals where applicable)
- The application body should be formal, complete, and include all legally required elements`;

    try {
      const data = await generateGeminiJson<RTIResult>(prompt);
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

  const copyDraft = () => {
    if (!result) return;
    const text = `To,\n${result.draftApplication.to}\n\nSubject: ${result.draftApplication.subject}\n\n${result.draftApplication.body}\n\nFee: ${result.draftApplication.feeNote}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: "RTI draft copied to clipboard!" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="py-20 px-4 bg-background">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <Badge className="bg-primary/10 text-primary border-primary/20 mb-4">
            4-Agent RTI Pipeline
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            RTI Draft Generator
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Describe your governance problem and our 4 AI agents will collaborate to produce a
            legally valid, ready-to-file RTI application under the RTI Act 2005.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Panel */}
          <Card className="p-6 border-border shadow-soft space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Describe Your Problem</h3>
            </div>

            <Textarea
              placeholder={`Describe the governance issue you want information about...\n\nExample: "Road construction in my area was sanctioned 2 years ago with ₹5 crore budget but work hasn't started. I want to know where the funds went."`}
              className="min-h-[180px] resize-none"
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
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
                <label className="text-sm font-medium text-foreground mb-1.5 block">Language</label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((l) => (
                      <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={generate}
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary-glow text-primary-foreground"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating RTI Draft...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Generate RTI Draft
                </>
              )}
            </Button>

            <div className="p-3 bg-muted/40 rounded-lg border border-border">
              <p className="text-xs text-muted-foreground font-medium mb-1">Try these examples:</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                <li>"Road construction sanctioned 2 years ago but work hasn't started"</li>
                <li>"Public hospital in my area has no doctors despite government appointments"</li>
                <li>"Mid-day meal scheme funds not reaching our village school"</li>
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
                  4 agents collaborating...
                </span>
              )}
            </div>

            {!result && !isLoading && (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                <div className="text-center max-w-sm space-y-2">
                  <FileText className="w-12 h-12 mx-auto opacity-30" />
                  <p className="text-sm">
                    Describe a governance problem to generate a legally valid RTI application with agent analysis.
                  </p>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="flex items-center justify-center h-[250px]">
                <div className="text-center space-y-3">
                  <Loader2 className="w-10 h-10 mx-auto animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Running 4-agent RTI pipeline...</p>
                </div>
              </div>
            )}

            {result && (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {/* Agent 1: Intent Classifier */}
                <Card className="p-4 border-border bg-card space-y-3">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-blue-500" />
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200">Agent 1: Intent Classifier</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-xs text-muted-foreground">Domain</span>
                      <p className="font-medium text-foreground">{result.intentAnalysis.domain}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Department</span>
                      <p className="font-medium text-foreground">{result.intentAnalysis.department}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{result.intentAnalysis.summary}</p>
                  <SectionList title="Information Sought" items={result.intentAnalysis.informationSought} />
                </Card>

                {/* Agent 2: Legal Drafter */}
                <Card className="p-4 border-border bg-card space-y-3">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-green-600" />
                    <Badge className="bg-green-100 text-green-700 border-green-200">Agent 2: Legal Drafter</Badge>
                  </div>
                  <div className="text-sm space-y-1">
                    <p><span className="font-medium text-foreground">To:</span> <span className="text-muted-foreground">{result.draftApplication.to}</span></p>
                    <p><span className="font-medium text-foreground">Subject:</span> <span className="text-muted-foreground">{result.draftApplication.subject}</span></p>
                  </div>
                  <div className="bg-muted/40 rounded-lg p-4 border border-border">
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed font-mono">
                      {result.draftApplication.body}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground italic">{result.draftApplication.feeNote}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyDraft}
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
                        Copy RTI Application
                      </>
                    )}
                  </Button>
                </Card>

                {/* Agent 3: Authority Router */}
                <Card className="p-4 border-border bg-card space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-orange-500" />
                    <Badge className="bg-orange-100 text-orange-700 border-orange-200">Agent 3: Authority Router</Badge>
                  </div>
                  <div className="text-sm space-y-2">
                    <div>
                      <span className="text-xs text-muted-foreground">Public Information Officer</span>
                      <p className="font-medium text-foreground">{result.authorityRouting.pio}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Department</span>
                      <p className="font-medium text-foreground">{result.authorityRouting.department}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Address</span>
                      <p className="text-muted-foreground">{result.authorityRouting.address}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Appellate Authority</span>
                      <p className="font-medium text-foreground">{result.authorityRouting.appellateAuthority}</p>
                    </div>
                    {result.authorityRouting.onlinePortalUrl && (
                      <a
                        href={result.authorityRouting.onlinePortalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary underline hover:text-primary/80"
                      >
                        File Online: {result.authorityRouting.onlinePortalUrl}
                      </a>
                    )}
                  </div>
                </Card>

                {/* Agent 4: Strategy Advisor */}
                <Card className="p-4 border-border bg-card space-y-3">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                    <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Agent 4: Strategy Advisor</Badge>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Expected Timeline</span>
                    <p className="text-sm font-medium text-foreground">{result.strategyAdvice.expectedTimeline}</p>
                  </div>
                  <SectionList title="Filing Tips" items={result.strategyAdvice.tips} />
                  <SectionList title="Appeal Process" items={result.strategyAdvice.appealProcess} />
                  <SectionList title="Common Pitfalls to Avoid" items={result.strategyAdvice.commonPitfalls} />
                </Card>
              </div>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
};

export default RTIDraftGenerator;
