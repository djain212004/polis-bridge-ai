import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enCommon from "./locales/en/common.json";
import hiCommon from "./locales/hi/common.json";
import mrCommon from "./locales/mr/common.json";
import guCommon from "./locales/gu/common.json";

const resources = {
  en: { common: enCommon },
  hi: { common: hiCommon },
  mr: { common: mrCommon },
  gu: { common: guCommon },
};

void i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en",
    fallbackLng: "en",
    defaultNS: "common",
    interpolation: {
      escapeValue: false,
    },
  });

export const supportedLanguages = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "mr", label: "मराठी" },
  { code: "gu", label: "ગુજરાતી" },
] as const;

export default i18n;
