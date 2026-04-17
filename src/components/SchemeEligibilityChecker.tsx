import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { generateGeminiJson } from "@/lib/gemini";
import { User, Search, ExternalLink, Loader2, CheckCircle, Trophy, ListChecks } from "lucide-react";

interface MatchedScheme {
  name: string;
  benefit: string;
  eligibilityReason: string;
  matchScore: number;
  applicationSteps: string[];
  officialLink: string;
}

interface EligibilityResult {
  matchedSchemes: MatchedScheme[];
  totalMatches: number;
  topRecommendation: string;
}

interface RawScheme {
  sr_no: string;
  scheme_name: string;
  scheme_link: string;
  tags: string[];
  details: string;
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

const INCOME_RANGES = [
  { value: "below_50k", label: "Below ₹50,000/year" },
  { value: "50k_1l", label: "₹50,000 – ₹1,00,000/year" },
  { value: "1l_2l", label: "₹1,00,000 – ₹2,00,000/year" },
  { value: "2l_5l", label: "₹2,00,000 – ₹5,00,000/year" },
  { value: "above_5l", label: "Above ₹5,00,000/year" },
];

const scoreColor = (score: number) => {
  if (score >= 80) return "text-green-600 bg-green-50 border-green-200";
  if (score >= 60) return "text-yellow-600 bg-yellow-50 border-yellow-200";
  return "text-orange-600 bg-orange-50 border-orange-200";
};

const buildSchemesContext = (schemes: RawScheme[]): string => {
  return schemes
    .slice(0, 150)
    .map(
      (s) =>
        `SCHEME: ${s.scheme_name}\nINFO: ${s.details.slice(0, 400)}\nLINK: ${s.scheme_link}`
    )
    .join("\n---\n");
};

const SchemeEligibilityChecker = () => {
  const [state, setState] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [income, setIncome] = useState("");
  const [occupation, setOccupation] = useState("");
  const [caste, setCaste] = useState("");
  const [result, setResult] = useState<EligibilityResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const findSchemes = async () => {
    if (!state || !age || !gender || !income || !occupation || !caste) {
      toast({
        title: "Complete your profile",
        description: "Please fill in all fields to find matching schemes.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      // Dynamically import the scraped dataset — loads as a separate chunk
      const schemesModule = await import(
        /* @vite-ignore */
        "../../myschemes_scraped_progress.json"
      );
      const rawSchemes = (schemesModule.default ?? schemesModule) as RawScheme[];
      const schemesContext = buildSchemesContext(rawSchemes);

      const incomeLabel = INCOME_RANGES.find((r) => r.value === income)?.label ?? income;

      const prompt = `You are an Indian government scheme eligibility expert. Based on the citizen profile below and the scheme database provided, identify all government schemes this citizen qualifies for.

CITIZEN PROFILE:
- State: ${state}
- Age: ${age} years
- Gender: ${gender}
- Annual Income: ${incomeLabel}
- Occupation Category: ${occupation}
- Caste Category: ${caste}

SCHEME DATABASE (real schemes from myschemes.gov.in):
${schemesContext}

Return JSON ONLY matching this exact schema:
{
  "matchedSchemes": [
    {
      "name": string (exact scheme name),
      "benefit": string (what the citizen gets — amount, service, etc.),
      "eligibilityReason": string (why this citizen qualifies — be specific to their profile),
      "matchScore": number (0-100, how well they match eligibility criteria),
      "applicationSteps": string[] (3-5 clear steps to apply),
      "officialLink": string (use the scheme_link from the database, or a real gov.in URL)
    }
  ],
  "totalMatches": number,
  "topRecommendation": string (name of single best scheme with brief reason why)
}

Instructions:
- Return 6-12 of the best matching schemes, sorted by matchScore descending
- Only include schemes the citizen genuinely qualifies for based on their profile
- Use real scheme names and links from the database above
- Include both central government and ${state} state-specific schemes
- Be specific about WHY they qualify (age limit, income bracket, occupation category, etc.)
- Application steps should be actionable and India-specific (e.g., visit CSC, apply on scheme portal, etc.)`;

      const data = await generateGeminiJson<EligibilityResult>(prompt);
      setResult(data);
    } catch (err) {
      toast({
        title: "Search failed",
        description: err instanceof Error ? err.message : "Unexpected error.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="scheme-eligibility" className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <Badge className="bg-secondary/10 text-secondary border-secondary/20 mb-4">
            Eligibility Agent
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Scheme Eligibility Checker
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Enter your profile and our AI agent searches the real myschemes.gov.in database to find every government
            scheme you qualify for — with eligibility reasoning and application steps.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Profile Form */}
          <Card className="p-6 border-border shadow-soft space-y-4 lg:col-span-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Your Profile</h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">State / UT</label>
                <Select value={state} onValueChange={setState}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {INDIAN_STATES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Age (years)</label>
                <Select value={age} onValueChange={setAge}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select age range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">Under 18</SelectItem>
                    <SelectItem value="22">18–25</SelectItem>
                    <SelectItem value="30">26–35</SelectItem>
                    <SelectItem value="45">36–55</SelectItem>
                    <SelectItem value="62">56–65</SelectItem>
                    <SelectItem value="70">Above 65</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Gender</label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Transgender">Transgender</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Annual Household Income</label>
                <Select value={income} onValueChange={setIncome}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select income range" />
                  </SelectTrigger>
                  <SelectContent>
                    {INCOME_RANGES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Occupation Category</label>
                <Select value={occupation} onValueChange={setOccupation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select occupation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Farmer">Farmer / Agricultural Worker</SelectItem>
                    <SelectItem value="Student">Student</SelectItem>
                    <SelectItem value="Senior Citizen">Senior Citizen (Retired)</SelectItem>
                    <SelectItem value="BPL">BPL / Below Poverty Line</SelectItem>
                    <SelectItem value="Differently Abled">Differently Abled / Disabled</SelectItem>
                    <SelectItem value="Entrepreneur">Entrepreneur / Self-Employed</SelectItem>
                    <SelectItem value="Woman">Woman / Homemaker</SelectItem>
                    <SelectItem value="Fisherman">Fisherman</SelectItem>
                    <SelectItem value="Artisan">Artisan / Craftsperson</SelectItem>
                    <SelectItem value="Labourer">Labourer / Migrant Worker</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Caste Category</label>
                <Select value={caste} onValueChange={setCaste}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="OBC">OBC (Other Backward Class)</SelectItem>
                    <SelectItem value="SC">SC (Scheduled Caste)</SelectItem>
                    <SelectItem value="ST">ST (Scheduled Tribe)</SelectItem>
                    <SelectItem value="EWS">EWS (Economically Weaker Section)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={findSchemes}
              disabled={isLoading}
              className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Searching schemes…
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Find My Schemes
                </>
              )}
            </Button>
          </Card>

          {/* Results */}
          <div className="lg:col-span-3 space-y-4">
            {!result && !isLoading && (
              <Card className="p-8 border-border shadow-soft flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-3 text-muted-foreground">
                  <ListChecks className="w-14 h-14 mx-auto opacity-20" />
                  <p className="text-sm max-w-xs">
                    Fill in your profile and click "Find My Schemes" to discover all government schemes you qualify for.
                  </p>
                </div>
              </Card>
            )}

            {isLoading && (
              <Card className="p-8 border-border shadow-soft flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-4">
                  <Loader2 className="w-10 h-10 mx-auto animate-spin text-secondary" />
                  <div>
                    <p className="font-medium text-foreground">Searching scheme database…</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Matching your profile against 1,000+ schemes from myschemes.gov.in
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {result && (
              <div className="space-y-4 animate-fade-in">
                {/* Summary banner */}
                <Card className="p-4 border-secondary/30 bg-secondary/5">
                  <div className="flex items-start gap-3">
                    <Trophy className="w-6 h-6 text-secondary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground">
                        {result.totalMatches} schemes found for your profile
                      </p>
                      {result.topRecommendation && (
                        <p className="text-sm text-muted-foreground mt-1">
                          <span className="font-medium text-foreground">Top pick:</span>{" "}
                          {result.topRecommendation}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Scheme Cards */}
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {result.matchedSchemes?.map((scheme, idx) => (
                    <Card key={idx} className="border-border shadow-soft overflow-hidden">
                      <div className="p-4">
                        <div className="flex items-start gap-3 justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h4 className="font-semibold text-foreground text-sm leading-snug">
                                {scheme.name}
                              </h4>
                              {idx === 0 && (
                                <Badge className="bg-secondary/10 text-secondary border-secondary/20 text-xs">
                                  Top Match
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-secondary font-medium">{scheme.benefit}</p>
                          </div>
                          <div
                            className={`shrink-0 px-2 py-1 rounded-md border text-xs font-bold ${scoreColor(scheme.matchScore)}`}
                          >
                            {Math.round(scheme.matchScore)}% match
                          </div>
                        </div>

                        <div className="flex items-start gap-2 mb-3 text-xs text-muted-foreground bg-muted/30 rounded p-2">
                          <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                          <span>{scheme.eligibilityReason}</span>
                        </div>

                        <Accordion type="single" collapsible>
                          <AccordionItem value="steps" className="border-none">
                            <AccordionTrigger className="py-1 text-xs font-medium text-primary hover:no-underline">
                              How to Apply ({scheme.applicationSteps?.length ?? 0} steps)
                            </AccordionTrigger>
                            <AccordionContent>
                              <ol className="list-decimal pl-4 space-y-1 text-xs text-muted-foreground">
                                {scheme.applicationSteps?.map((step, i) => (
                                  <li key={i} className="leading-relaxed">
                                    {step}
                                  </li>
                                ))}
                              </ol>
                              {scheme.officialLink && (
                                <a
                                  href={scheme.officialLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 mt-2 text-xs text-primary underline hover:text-primary/80"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Official page
                                </a>
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SchemeEligibilityChecker;
