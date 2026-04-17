import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PolicySimulationRequest {
  policyTitle?: string;
  policyDescription?: string;
  additionalContext?: string;
}

const buildPrompt = ({
  policyTitle,
  policyDescription,
  additionalContext,
}: Required<PolicySimulationRequest>) => {
  return `You are an ensemble of collaborating AI policy agents modelling the architecture below.

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
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = (await req.json()) as PolicySimulationRequest;
    const policyTitle = requestBody.policyTitle?.trim() || "Untitled Policy";
    const policyDescription = requestBody.policyDescription?.trim();
    const additionalContext = requestBody.additionalContext?.trim() || "No additional context provided.";

    if (!policyDescription) {
      return new Response(
        JSON.stringify({ error: "policyDescription is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const prompt = buildPrompt({
      policyTitle,
      policyDescription,
      additionalContext,
    });

    const geminiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent" +
        `?key=${GEMINI_API_KEY}`,
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

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Gemini API error:", geminiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate simulation insights." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const geminiData = await geminiResponse.json();
    const contentText: string | undefined =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ??
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.data;

    if (!contentText) {
      return new Response(
        JSON.stringify({ error: "No content returned from Gemini." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let simulationResult;
    try {
      simulationResult = JSON.parse(contentText);
    } catch (parseError) {
      console.error("Failed to parse Gemini JSON:", parseError, contentText);
      return new Response(
        JSON.stringify({ error: "Gemini returned invalid JSON." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ data: simulationResult }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in policy-simulation function:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
