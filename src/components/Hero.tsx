import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Globe, Shield, Brain } from "lucide-react";
import heroImage from "@/assets/hero-ai-governance.jpg";
import { useTranslation } from "react-i18next";

interface HeroProps {
  onExplore?: () => void;
  onViewAgents?: () => void;
}

const Hero = ({ onExplore, onViewAgents }: HeroProps) => {
  const { t } = useTranslation();
  const featureLabels = t("hero.features", { returnObjects: true }) as string[];
  const stats = t("hero.stats", { returnObjects: true }) as Array<{ value: string; label: string }>;

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="AI Governance Network"
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-primary/10" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="animate-fade-in">
            <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-2 text-sm font-medium">
              <Brain className="w-4 h-4 mr-2 inline" />
              {t("hero.badge")}
            </Badge>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold text-foreground leading-tight animate-fade-in-up">
            {t("hero.title.primary")}
            <span className="block bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mt-2">
              {t("hero.title.highlight")}
            </span>
          </h1>

          {/* Description */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-fade-in-up animation-delay-200">
            {t("hero.description")}
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap gap-4 justify-center animate-fade-in-up animation-delay-300">
            <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-full border border-border shadow-soft">
              <Globe className="w-4 h-4 text-secondary" />
              <span className="text-sm font-medium">{featureLabels?.[0]}</span>
            </div>
            <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-full border border-border shadow-soft">
              <Shield className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">{featureLabels?.[1]}</span>
            </div>
            <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-full border border-border shadow-soft">
              <Brain className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">{featureLabels?.[2]}</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up animation-delay-400">
            <Button
              size="lg"
              onClick={onExplore}
              className="bg-primary hover:bg-primary-glow text-primary-foreground px-8 py-6 text-lg shadow-medium hover:shadow-glow transition-all duration-300"
            >
              Explore Platform
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={onViewAgents}
              className="border-2 border-primary text-primary hover:bg-primary/5 px-8 py-6 text-lg"
            >
              View Agent System
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-8 animate-fade-in-up animation-delay-500">
            {stats?.map((stat, index) => (
              <div key={stat.label} className="text-center">
                <div
                  className={`text-3xl md:text-4xl font-bold ${
                    index === 0 ? "text-primary" : index === 1 ? "text-secondary" : "text-accent"
                  }`}
                >
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Animated Background Elements */}
      <div className="absolute top-1/4 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse animation-delay-1000" />
    </section>
  );
};

export default Hero;
