import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import fr from './locales/fr.json'
import en from './locales/en.json'

import { browserLanguage } from './lib/language'

// Bundled resources work without a network request. The browser’s ordered preferences determine the language.
void i18n.use(initReactI18next).init({
  resources: { fr: { translation: fr }, en: { translation: en } },
  lng: browserLanguage(navigator.languages?.length ? navigator.languages : [navigator.language]),
  fallbackLng: 'fr',
  supportedLngs: ['fr', 'en'],
  interpolation: { escapeValue: false },
})

window.addEventListener('languagechange', () => {
  void i18n.changeLanguage(browserLanguage(navigator.languages?.length ? navigator.languages : [navigator.language]))
})

export default i18n
