import i18next from 'i18next'

import en from '../locales/en/en'
import ru from '../locales/ru/ru'
import es from '../locales/es/es'

i18next
// .use(Backend)
  .init({
    fallbackLng: 'en',
    resources:   {
      en: {
        translation: en
      },
      ru: {
        translation: ru
      },
      es: {
        translation: es
      }
    },
    load: 'all',
  })

export default i18next