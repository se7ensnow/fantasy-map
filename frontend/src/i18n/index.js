import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import ru from "./locales/ru/common.json";
import en from "./locales/en/common.json";

function getSavedLanguage() {
    try {
        return localStorage.getItem("language") || "en";
    } catch {
        return "en";
    }
}

const savedLanguage = getSavedLanguage();

i18n.use(initReactI18next).init({
    resources: {
        ru: { translation: ru },
        en: { translation: en },
    },
    lng: savedLanguage,
    fallbackLng: "en",
    interpolation: {
        escapeValue: false,
    },
});

i18n.on("languageChanged", (language) => {
    document.documentElement.lang = language;

    try {
        localStorage.setItem("language", language);
    } catch {
        // Ignore unavailable storage.
    }
});

document.documentElement.lang = savedLanguage;

export default i18n;
