import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { generateGeminiJson } from "@/lib/gemini";
import { MessageSquare, Globe, Users, Wand2, Loader2, LinkIcon, Languages } from "lucide-react";

interface SourceLink {
  title: string;
  url: string;
  note?: string;
}

interface CommunicationResult {
  base: {
    message: string;
    clarityScore: number;
    accessibility: string;
    engagementLevel: string;
    headline: string;
    sources: SourceLink[];
  };
  translations: Array<{
    language: string;
    label: string;
    translation: string;
    clarityScore: number;
    readability: string;
    riskFlags: string[];
  }>;
}

const CommunicationGenerator = () => {
  const [audience, setAudience] = useState("");
  const [language, setLanguage] = useState("");
  const [topic, setTopic] = useState("Ayushman Bharat");
  const [generated, setGenerated] = useState<CommunicationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [targetLanguages, setTargetLanguages] = useState<string[]>(["hi", "bn", "ta"]);
  const { toast } = useToast();

  const languageOptions = useMemo(
    () => [
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
      { code: "en", label: "English" },
    ],
    [],
  );

  const buildPrompt = () => `You are a policy communication expert.

Generate a concise, culturally-aware public communication for a government policy update, plus multilingual QA.
Audience: ${audience || "general public"}
Base language: ${language || "en"}
Topic: ${topic}
Target translations (ISO codes): ${targetLanguages.join(", ") || "none"}

Return JSON ONLY:
{
  "base": {
    "headline": string,
    "message": string,
    "clarityScore": number,           // 0-100
    "accessibility": string,          // short label
    "engagementLevel": string,        // short label
    "sources": [
      { "title": string, "url": string, "note"?: string }
    ]
  },
  "translations": [
    {
      "language": string,             // ISO code
      "label": string,                // human readable language
      "translation": string,          // message in that language
      "clarityScore": number,         // 0-100
      "readability": string,          // e.g., Easy / Moderate
      "riskFlags": string[]           // list risky terms/ambiguities to fix
    }
  ]
}

Requirements:
- Keep the base message under 180 words and actionable.
- Only include real sources/URLs (gov.in, nic.in, org). No fabricated links.
- For translations, return only the requested target languages (skip others).
- If a language is unsupported, omit it and note in riskFlags for that language.`;

  const generateMessage = () => {
    if (!audience || !language) {
      toast({
        title: "Select audience and language",
        description: "Please choose both fields before generating.",
        variant: "destructive",
      });
      return;
    }

    if (targetLanguages.length === 0) {
      toast({
        title: "Select target languages",
        description: "Pick at least one language for QA/translation.",
        variant: "destructive",
      });
      return;
    }

    const prompt = buildPrompt();
    setIsLoading(true);
    setGenerated(null);

    generateGeminiJson<CommunicationResult>(prompt, { responseMimeType: "application/json" })
      .then((result) => {
        setGenerated(result);
      })
      .catch((error) => {
        console.error("Communication generation failed:", error);
        toast({
          title: "Generation failed",
          description: error instanceof Error ? error.message : "Unexpected error. Try again.",
          variant: "destructive",
        });
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <Badge className="bg-secondary/10 text-secondary border-secondary/20 mb-4">
            AI Communication
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Generate Targeted Messages
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Create personalized, culturally-aware communications for diverse communities
          </p>
        </div>

        <Card className="p-8 border-border shadow-medium max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Audience Selection */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                <Users className="w-4 h-4" />
                Target Audience
              </label>
              <Select onValueChange={setAudience} value={audience}>
                <SelectTrigger>
                  <SelectValue placeholder="Select audience type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Public</SelectItem>
                  <SelectItem value="business">Business Community</SelectItem>
                  <SelectItem value="youth">Youth & Students</SelectItem>
                  <SelectItem value="seniors">Senior Citizens</SelectItem>
                  <SelectItem value="rural">Rural Communities</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Language Selection */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                <Globe className="w-4 h-4" />
                Base Language
              </label>
              <Select onValueChange={setLanguage} value={language}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="zh">Chinese</SelectItem>
                  <SelectItem value="ar">Arabic</SelectItem>
                  <SelectItem value="hi">Hindi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Topic */}
          <div className="mb-4">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <MessageSquare className="w-4 h-4" />
              Topic / Scheme
            </label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Ayushman Bharat update for urban slums"
            />
          </div>

          {/* Target languages */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <Languages className="w-4 h-4" />
              Target Translations (multilingual QA)
            </label>
            <div className="flex flex-wrap gap-2">
              {languageOptions.map((opt) => {
                const checked = targetLanguages.includes(opt.code);
                return (
                  <button
                    key={opt.code}
                    type="button"
                    onClick={() => {
                      setTargetLanguages((prev) =>
                        checked ? prev.filter((c) => c !== opt.code) : [...prev, opt.code],
                      );
                    }}
                    className={`px-3 py-1 rounded-full border text-sm ${
                      checked ? "bg-primary text-primary-foreground border-primary" : "border-border"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              We will translate and score clarity/readability for selected languages.
            </p>
          </div>

          <Button
            onClick={generateMessage}
            disabled={!audience || !language || isLoading}
            className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground mb-6"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Generate Communication
              </>
            )}
          </Button>

          {/* Generated Message */}
          {generated && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-6 bg-card border border-border rounded-lg">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  <div>
                    <h4 className="font-semibold text-foreground">Generated Message</h4>
                    <p className="text-xs text-muted-foreground">{generated.base.headline}</p>
                  </div>
                </div>
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">{generated.base.message}</p>
              </div>

              {/* Message Analysis */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-accent/5 border border-accent/20 rounded-lg">
                  <div className="text-2xl font-bold text-accent mb-1">
                    {Math.round(generated.base.clarityScore ?? 0)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Clarity Score</div>
                </div>
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="text-2xl font-bold text-primary mb-1">{generated.base.accessibility}</div>
                  <div className="text-sm text-muted-foreground">Accessibility</div>
                </div>
                <div className="p-4 bg-secondary/5 border border-secondary/20 rounded-lg">
                  <div className="text-2xl font-bold text-secondary mb-1">{generated.base.engagementLevel}</div>
                  <div className="text-sm text-muted-foreground">Engagement</div>
                </div>
              </div>

              {generated.base.sources?.length ? (
                <div className="p-4 bg-muted/40 border border-border rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <LinkIcon className="w-4 h-4" />
                    Sources
                  </div>
                  <ul className="list-disc pl-5 space-y-1">
                    {generated.base.sources.map((source, idx) => (
                      <li key={`${source.url}-${idx}`} className="text-sm text-muted-foreground">
                        {source.title ? <span className="font-medium text-foreground">{source.title}: </span> : null}
                        {source.url ? (
                          <a href={source.url} target="_blank" rel="noreferrer" className="text-primary underline">
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
              ) : null}

              {generated.translations?.length ? (
                <div className="space-y-3">
                  <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Languages className="w-4 h-4" />
                    Multilingual QA
                  </h4>
                  <div className="grid md:grid-cols-2 gap-3">
                    {generated.translations.map((t) => (
                      <div key={t.language} className="p-4 border border-border rounded-lg bg-muted/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-foreground">{t.label}</span>
                          <span className="text-xs text-muted-foreground">{t.language}</span>
                        </div>
                        <p className="text-sm text-foreground whitespace-pre-wrap mb-2">{t.translation}</p>
                        <div className="flex gap-3 text-xs text-muted-foreground">
                          <span>Clarity: {Math.round(t.clarityScore ?? 0)}%</span>
                          <span>Readability: {t.readability}</span>
                        </div>
                        {t.riskFlags?.length ? (
                          <ul className="list-disc pl-4 text-xs text-destructive mt-1 space-y-1">
                            {t.riskFlags.map((r, idx) => (
                              <li key={idx}>{r}</li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </Card>
      </div>
    </section>
  );
};

export default CommunicationGenerator;
