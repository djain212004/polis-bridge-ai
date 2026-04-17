import { useEffect, useState } from "react";
import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supportedLanguages } from "@/i18n";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const STORAGE_KEY = "app-language";

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();
  const [currentLang, setCurrentLang] = useState(i18n.language || "en");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && stored !== i18n.language) {
      void i18n.changeLanguage(stored);
      setCurrentLang(stored);
    }
  }, [i18n]);

  const handleChange = (value: string) => {
    setCurrentLang(value);
    void i18n.changeLanguage(value);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, value);
    }
  };

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1.5 backdrop-blur-md shadow-soft">
      <Badge variant="secondary" className="bg-transparent text-foreground px-2 py-1 gap-1">
        <Globe className="w-3 h-3" />
        <span className="text-xs font-medium">{t("languageSwitcher.label")}</span>
      </Badge>
      <Select value={currentLang} onValueChange={handleChange}>
        <SelectTrigger className="h-8 w-[120px] border-none bg-transparent text-sm font-medium focus:ring-0 focus:ring-offset-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end" className="max-h-60">
          {supportedLanguages.map((language) => (
            <SelectItem key={language.code} value={language.code} className="text-sm">
              {language.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default LanguageSwitcher;
