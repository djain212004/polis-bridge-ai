import { useState } from "react";
import Hero from "@/components/Hero";
import MultiAgentSystem from "@/components/MultiAgentSystem";
import PolicySimulator from "@/components/PolicySimulator";
import PolicyChatbot from "@/components/PolicyChatbot";
import CommunicationGenerator from "@/components/CommunicationGenerator";
import TrustSecurity from "@/components/TrustSecurity";
import SchemeEligibilityChecker from "@/components/SchemeEligibilityChecker";
import MisinformationDetector from "@/components/MisinformationDetector";
import RTIDraftGenerator from "@/components/RTIDraftGenerator";
import BudgetAnalyzer from "@/components/BudgetAnalyzer";
import GrievanceRouter from "@/components/GrievanceRouter";
import {
  Home,
  MessageSquare,
  BarChart2,
  Globe,
  ShieldAlert,
  ListChecks,
  Brain,
  FileText,
  IndianRupee,
  MessageSquareWarning,
} from "lucide-react";

const TABS = [
  { id: "home",        label: "Home",              icon: Home },
  { id: "eligibility", label: "Scheme Eligibility", icon: ListChecks },
  { id: "simulator",   label: "Policy Simulator",   icon: BarChart2 },
  { id: "chatbot",     label: "Policy Chatbot",      icon: MessageSquare },
  { id: "comms",       label: "Communication",       icon: Globe },
  { id: "factcheck",   label: "Fact-Checker",        icon: ShieldAlert },
  { id: "rti",         label: "RTI Generator",       icon: FileText },
  { id: "budget",      label: "Budget Analyzer",     icon: IndianRupee },
  { id: "grievance",   label: "Grievance Router",    icon: MessageSquareWarning },
  { id: "agents",      label: "Agent System",        icon: Brain },
] as const;

type TabId = typeof TABS[number]["id"];

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabId>("home");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Fixed top header */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        {/* Brand */}
        <div className="flex items-center px-6 py-2 border-b border-border/50">
          <button
            onClick={() => setActiveTab("home")}
            className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors"
          >
            <Brain className="w-4 h-4 text-primary" />
            PolisBridge AI Studio
          </button>
        </div>

        {/* Tab navigation */}
        <div className="overflow-x-auto scrollbar-none">
          <nav className="flex items-center gap-0.5 px-4 py-1.5 min-w-max">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab content — padded to clear fixed header (~88px) */}
      <main className="flex-1 pt-[88px]">
        {activeTab === "home" && (
          <div>
            <Hero
              onExplore={() => setActiveTab("eligibility")}
              onViewAgents={() => setActiveTab("agents")}
            />
            <TrustSecurity />
          </div>
        )}
        {activeTab === "eligibility" && <SchemeEligibilityChecker />}
        {activeTab === "simulator"   && <PolicySimulator />}
        {activeTab === "chatbot"     && <PolicyChatbot />}
        {activeTab === "comms"       && <CommunicationGenerator />}
        {activeTab === "factcheck"   && <MisinformationDetector />}
        {activeTab === "rti"         && <RTIDraftGenerator />}
        {activeTab === "budget"      && <BudgetAnalyzer />}
        {activeTab === "grievance"   && <GrievanceRouter />}
        {activeTab === "agents"      && <MultiAgentSystem />}
      </main>
    </div>
  );
};

export default Index;
