import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import sw from './locales/sw.json';
import fr from './locales/fr.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            sw: { translation: sw },
            fr: { translation: fr },
        },
        fallbackLng: 'en',
        supportedLngs: ['en', 'sw', 'fr'],
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
            lookupLocalStorage: 'app_language',
        },
        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;
