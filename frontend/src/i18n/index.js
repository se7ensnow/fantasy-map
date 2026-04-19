import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import ru from "./locales/ru/common.json";
import en from "./locales/en/common.json";

const savedLanguage = localStorage.getItem("language") || "en";

i18n
    .use(initReactI18next)
    .init({
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

export default i18n;