import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { generateGeminiJson } from "@/lib/gemini";
import { ShieldAlert, CheckCircle, XCircle, AlertTriangle, Loader2, Share2, ExternalLink } from "lucide-react";

interface MisinformationReport {
  overallTruthScore: number;
  classification: "accurate" | "partially_false" | "misleading" | "false";
  claims: Array<{
    claim: string;
    verdict: "true" | "partially_true" | "false";
    correction: string;
    source: string;
  }>;
  counterNarrative: string;
  shareableCorrection: string;
  officialLinks: string[];
}

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

const VerdictBadge = ({ verdict }: { verdict: string }) => {
  if (verdict === "true")
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200 shrink-0">
        <CheckCircle className="w-3 h-3 mr-1" />
        Fact
      </Badge>
    );
  if (verdict === "partially_true")
    return (
      <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 shrink-0">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Partial
      </Badge>
    );
  return (
    <Badge className="bg-red-100 text-red-700 border-red-200 shrink-0">
      <XCircle className="w-3 h-3 mr-1" />
      False
    </Badge>
  );
};

const classificationMeta = (c: string) => {
  const map: Record<string, { label: string; className: string }> = {
    accurate: { label: "Accurate", className: "bg-green-100 text-green-700 border-green-200" },
    partially_false: { label: "Partially False", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
    misleading: { label: "Misleading", className: "bg-orange-100 text-orange-700 border-orange-200" },
    false: { label: "False", className: "bg-red-100 text-red-700 border-red-200" },
  };
  return map[c] ?? { label: c, className: "bg-muted text-muted-foreground border-border" };
};

const scoreBarColor = (score: number) => {
  if (score >= 75) return "bg-green-500";
  if (score >= 40) return "bg-yellow-500";
  return "bg-red-500";
};

const scoreTextColor = (score: number) => {
  if (score >= 75) return "text-green-600";
  if (score >= 40) return "text-yellow-600";
  return "text-red-600";
};

const MisinformationDetector = () => {
  const [message, setMessage] = useState("");
  const [inputLang, setInputLang] = useState("en");
  const [outputLang, setOutputLang] = useState("en");
  const [report, setReport] = useState<MisinformationReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const analyze = async () => {
    if (!message.trim()) {
      toast({ title: "Message required", description: "Paste a message to fact-check.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setReport(null);

    const prompt = `You are an Indian government policy fact-checker with expert knowledge of all central and state schemes.

Analyze the following message for factual accuracy about Indian government schemes and policies.

Input message language: ${inputLang}
Counter-narrative output language: ${outputLang}

Message to analyze:
"""
${message}
"""

Return JSON ONLY matching this exact schema:
{
  "overallTruthScore": number (0-100, higher = more accurate),
  "classification": "accurate" | "partially_false" | "misleading" | "false",
  "claims": [
    {
      "claim": string (exact claim extracted from message),
      "verdict": "true" | "partially_true" | "false",
      "correction": string (what the fact actually is),
      "source": string (real gov.in/nic.in URL or official source name)
    }
  ],
  "counterNarrative": string (clear corrective explanation in ${outputLang} language),
  "shareableCorrection": string (WhatsApp-ready correction, max 2 sentences, in ${outputLang} language),
  "officialLinks": string[] (real official URLs only — pib.gov.in, india.gov.in, pfms.nic.in etc.)
}

Instructions:
- Extract each distinct factual claim from the message separately
- Use accurate Indian policy knowledge (PM-KISAN, Ayushman Bharat, PM Ujjwala, MGNREGS, etc.)
- Only cite real URLs — never fabricate links
- Write counterNarrative and shareableCorrection in the specified output language
- Be precise: e.g., PM-KISAN gives ₹6,000/year (not ₹10,000), in 3 installments`;

    try {
      const result = await generateGeminiJson<MisinformationReport>(prompt);
      setReport(result);
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
    <section id="misinformation-detector" className="py-20 px-4 bg-background">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <Badge className="bg-destructive/10 text-destructive border-destructive/20 mb-4">
            Misinformation Agent
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Fact-Check Policy Claims
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Paste a WhatsApp message or social media post about any Indian government scheme. Our AI agent verifies
            each claim and generates a shareable multilingual correction.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Panel */}
          <Card className="p-6 border-border shadow-soft space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-destructive" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Message to Fact-Check</h3>
            </div>

            <Textarea
              placeholder={`Paste a WhatsApp message or claim here…\n\nExample: "PM KISAN gives ₹10,000 per year and any farmer can apply regardless of land size"`}
              className="min-h-[180px] resize-none"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Input Language</label>
                <Select value={inputLang} onValueChange={setInputLang}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((l) => (
                      <SelectItem key={l.code} value={l.code}>
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Counter-Narrative Language</label>
                <Select value={outputLang} onValueChange={setOutputLang}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((l) => (
                      <SelectItem key={l.code} value={l.code}>
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={analyze}
              disabled={isLoading || !message.trim()}
              className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing claims…
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4 mr-2" />
                  Fact-Check This Message
                </>
              )}
            </Button>

            <div className="p-3 bg-muted/40 rounded-lg border border-border">
              <p className="text-xs text-muted-foreground font-medium mb-1">Try these examples:</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                <li>"PM Ujjwala Yojana gives free gas cylinders forever to everyone"</li>
                <li>"PM KISAN gives ₹10,000/year to any farmer regardless of land size"</li>
                <li>"Ayushman Bharat covers ₹10 lakh per family per year"</li>
              </ul>
            </div>
          </Card>

          {/* Results Panel */}
          <Card className="p-6 border-border shadow-soft">
            {!report && !isLoading && (
              <div className="flex items-center justify-center h-full min-h-[350px] text-muted-foreground">
                <div className="text-center space-y-3">
                  <ShieldAlert className="w-14 h-14 mx-auto opacity-20" />
                  <p className="text-sm">Paste a message and click Fact-Check to see the analysis.</p>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="flex items-center justify-center h-full min-h-[350px]">
                <div className="text-center space-y-3">
                  <Loader2 className="w-10 h-10 mx-auto animate-spin text-destructive" />
                  <p className="text-sm text-muted-foreground">Verifying claims against policy database…</p>
                </div>
              </div>
            )}

            {report && (
              <div className="space-y-5 animate-fade-in">
                {/* Truth Score */}
                <div className="flex items-center gap-4 p-4 rounded-lg border border-border bg-muted/30">
                  <div className={`text-5xl font-bold tabular-nums ${scoreTextColor(report.overallTruthScore)}`}>
                    {Math.round(report.overallTruthScore)}%
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Truth Score</p>
                    <Badge className={classificationMeta(report.classification).className}>
                      {classificationMeta(report.classification).label}
                    </Badge>
                    <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${scoreBarColor(report.overallTruthScore)}`}
                        style={{ width: `${report.overallTruthScore}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Claims Breakdown */}
                {report.claims?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-foreground">Claims Analysis</h4>
                    {report.claims.map((c, i) => (
                      <div key={i} className="p-3 border border-border rounded-lg bg-card space-y-1">
                        <div className="flex items-start gap-2 justify-between">
                          <p className="text-sm font-medium text-foreground flex-1">{c.claim}</p>
                          <VerdictBadge verdict={c.verdict} />
                        </div>
                        {c.correction && (
                          <p className="text-xs text-muted-foreground leading-relaxed">{c.correction}</p>
                        )}
                        {c.source && (
                          <p className="text-xs text-primary">Source: {c.source}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Counter Narrative */}
                {report.counterNarrative && (
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <h4 className="text-sm font-semibold text-foreground mb-2">Corrective Explanation</h4>
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                      {report.counterNarrative}
                    </p>
                  </div>
                )}

                {/* Shareable Correction */}
                {report.shareableCorrection && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Share2 className="w-4 h-4 text-green-700" />
                      <h4 className="text-sm font-semibold text-green-700">WhatsApp-Ready Correction</h4>
                    </div>
                    <p className="text-sm text-green-800 whitespace-pre-wrap leading-relaxed mb-3">
                      {report.shareableCorrection}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-green-300 text-green-700 hover:bg-green-100"
                      onClick={() => {
                        navigator.clipboard.writeText(report.shareableCorrection);
                        toast({ title: "Copied to clipboard!" });
                      }}
                    >
                      Copy Text
                    </Button>
                  </div>
                )}

                {/* Official Links */}
                {report.officialLinks?.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <ExternalLink className="w-4 h-4" />
                      Official Sources
                    </h4>
                    {report.officialLinks.map((link, i) => (
                      <a
                        key={i}
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                        className="block text-xs text-primary underline truncate hover:text-primary/80"
                      >
                        {link}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
};

export default MisinformationDetector;
