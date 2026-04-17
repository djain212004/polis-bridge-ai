import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Code2, Database, Layers, Lock, Globe } from "lucide-react";

const stack = [
  {
    icon: Brain,
    title: "Google Gemini 2.5 Flash",
    description: "Powers all AI features — eligibility checks, policy simulation, fact-checking, and multi-agent communication"
  },
  {
    icon: Code2,
    title: "React + TypeScript + Vite",
    description: "Fast, type-safe frontend with modern tooling and hot module replacement"
  },
  {
    icon: Database,
    title: "Supabase",
    description: "Backend-as-a-service for authentication, database, and real-time data"
  },
  {
    icon: Globe,
    title: "myschemes.gov.in Dataset",
    description: "1,000+ government welfare schemes from the official Indian government schemes portal"
  },
  {
    icon: Layers,
    title: "shadcn/ui + Tailwind CSS",
    description: "Accessible component library and utility-first CSS for a consistent, responsive UI"
  },
  {
    icon: Lock,
    title: "Privacy by Design",
    description: "No personal data is stored or transmitted — all AI processing happens per-request without retention"
  }
];

const TrustSecurity = () => {
  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <Badge className="bg-accent/10 text-accent border-accent/20 mb-4">
            Built With
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Open & Transparent Tech Stack
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            PolisBridge AI Studio is an open demo project. Here's exactly what powers it.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stack.map((item, index) => {
            const Icon = item.icon;
            return (
              <Card
                key={index}
                className="p-6 border-border shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {item.description}
                </p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TrustSecurity;
