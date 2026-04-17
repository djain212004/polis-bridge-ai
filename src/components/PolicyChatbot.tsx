import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ReactMarkdown from "react-markdown";
import { MessageCircle, Send, Bot, User, Loader2, Languages } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const PolicyChatbot = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Namaste! I'm your AI assistant for Indian government policies. Ask me anything about schemes like PM-KISAN, Ayushman Bharat, MGNREGA, Digital India, or any other government initiative. How can I help you today?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [answerLanguage, setAnswerLanguage] = useState<string>("en");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const languageOptions = [
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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const systemPrompt = `You are an expert AI assistant specializing in Indian government policies, schemes, and governance. You have comprehensive knowledge about:

- Central and State government schemes (PM-KISAN, Ayushman Bharat, MGNREGA, Digital India, etc.)
- Indian Constitution, laws, and regulations
- Social welfare programs and their implementation
- Economic policies and reforms
- Agricultural policies and rural development
- Healthcare and education initiatives
- Digital governance and e-governance initiatives
- Infrastructure and urban development programs
- Financial inclusion schemes
- Environmental and climate policies

Your role is to:
1. Provide accurate, detailed information about Indian policies
2. Explain policy impacts on different segments of society
3. Discuss implementation challenges and solutions
4. Compare policies across states when relevant
5. Cite official sources and government portals
6. Explain eligibility criteria and application processes
7. Discuss policy effectiveness and outcomes

Always be factual, balanced, and cite official government sources when possible. If you don't have specific information, acknowledge it and suggest where users can find official information (like gov.in portals).`;

  const formatForGemini = (history: Message[]) =>
    history.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const callGeminiDirect = async (chatMessages: Message[]) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Missing VITE_GEMINI_API_KEY for direct Gemini fallback.");
    }

    const contents = [
      { role: "user", parts: [{ text: systemPrompt }] },
      { role: "user", parts: [{ text: `Respond in ${answerLanguage} language (ISO code: ${answerLanguage}).` }] },
      ...formatForGemini(chatMessages),
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.3,
            topK: 32,
            topP: 0.95,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ??
      data?.candidates?.[0]?.content?.parts?.[0]?.data;

    if (!text) {
      throw new Error("Gemini returned no content.");
    }

    setMessages([...chatMessages, { role: "assistant", content: text }]);
  };

  const streamChat = async (userMessage: string) => {
    const newMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error("Supabase credentials missing, using Gemini fallback.");
      }

      const payloadMessages =
        answerLanguage && answerLanguage !== "en"
          ? [{ role: "user", content: `Please respond in ${answerLanguage}.` }, ...newMessages]
          : newMessages;

      const response = await fetch(`${supabaseUrl}/functions/v1/policy-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ messages: payloadMessages }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to get response");
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      setMessages([...newMessages, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantMessage += content;
                setMessages([
                  ...newMessages,
                  { role: "assistant", content: assistantMessage }
                ]);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error: any) {
      console.warn("Supabase chat failed, attempting Gemini fallback:", error);
      try {
        await callGeminiDirect(newMessages);
      } catch (fallbackError: any) {
        console.error("Chat error:", fallbackError);
        toast({
          title: "Error",
          description: fallbackError.message || "Failed to send message. Please try again.",
          variant: "destructive",
        });
        setMessages(newMessages);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    streamChat(userMessage);
  };

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <Badge className="bg-primary/10 text-primary border-primary/20 mb-4">
            AI Policy Assistant
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Ask About Indian Government Policies
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get instant answers about any government scheme, policy, or initiative across India
          </p>
        </div>

        <Card className="max-w-4xl mx-auto border-border shadow-medium">
          <div className="flex items-center gap-3 p-6 border-b border-border bg-gradient-to-r from-primary/5 to-secondary/5">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">Policy Expert Chat</h3>
              <p className="text-sm text-muted-foreground">Powered by AI • Real-time responses</p>
            </div>
          </div>

          <ScrollArea className="h-[500px] p-6" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-foreground border border-border"
                }`}
              >
                {message.role === "assistant" ? (
                  <ReactMarkdown className="prose prose-sm max-w-none text-foreground prose-p:mb-2 prose-headings:text-foreground prose-strong:text-foreground prose-li:marker:text-muted-foreground">
                    {message.content}
                  </ReactMarkdown>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                )}
              </div>
              {message.role === "user" && (
                <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-secondary" />
                </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 border border-border">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <form onSubmit={handleSubmit} className="p-6 border-t border-border bg-muted/20">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 flex gap-3">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about PM-KISAN, Ayushman Bharat, MGNREGA, or any policy..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <div className="min-w-[160px]">
                  <Select value={answerLanguage} onValueChange={setAnswerLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Answer language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languageOptions.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" disabled={!input.trim() || isLoading} className="bg-primary hover:bg-primary-glow self-stretch">
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Try asking: "What is PM-KISAN?" or "Tell me about Ayushman Bharat scheme" and choose your answer language.
            </p>
          </form>
        </Card>
      </div>
    </section>
  );
};

export default PolicyChatbot;
