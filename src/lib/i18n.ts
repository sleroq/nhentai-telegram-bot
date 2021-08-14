import i18next from 'i18next'
import Backend from 'i18next-fs-backend'
import {join} from 'path'

i18next
  .use(Backend)
  .init({
    fallbackLng: 'en',
    load:        'all',
    backend:     {
      loadPath: join(__dirname, '../locales/{{lng}}/{{ns}}.js')
    }
  })
export default i18n
