import { I18n } from 'i18n'
// import path from 'path'

const i18n = new I18n()
i18n.configure({
  locales:       ['en', 'es', 'ru'],
  defaultLocale: 'en',
  staticCatalog: {
    en: require('./locales/en'),
    ru: require('./locales/ru'),
    es: require('./locales/es'),
  }
  // directory:     path.join(__dirname, 'locales'),
})
// console.log(i18n.__('greeting', 'ru'))
// console.log(path.join(__dirname, 'locales'))
export default i18n