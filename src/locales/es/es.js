export default {
	language_name: 'Español',
	greeting:      'Hola, {{name}}\n<b>Este bot tiene contenido +18, pulsa el botón solo si tienes la edad suficiente.</b>',

	// buttons:
	random_button:         'Manga aleatorio',
	search_button:         'Buscar',
	next_button:           'Siguiente',
	previous_button:       'Anterior',
	back_button:           'Regresar',
	fix_button:            'Arreglar',
	waitabit_button:       'Espera un poco',
	search_tips_button:    'Buscar consejos',
	settings_button:       'Ajustes',
	next_page_button:      'Siguiente página',
	tap_to_open_favorites: 'Toca para abrir favoritos',
	tap_to_open_history:   'Toca para abrir el historial',
	open:                  'Abierto',

	// manga related text:
	pages:           'páginas',
	tags:            'Etiquetas: ',
	too_many_pages:  'Muchas páginas, lo siento :(',
	try_again_later: 'Inténtalo más tarde :(',
	pages_fixed:     'páginas arregladas',

	// just text
	yes:                      'sí',
	enabled:                  'habilitado',
	no:                       'no',
	disabled:                 'deshabilitado',
	date:                     'fecha',
	popular:                  'popularidad',
	nothing_is_found:         'No se encuentra nada ¯_(ツ)_/¯',
	manga_does_not_exist:     'Este manga no existe',
	failed_to_get:            '¡No pude conseguir doujin!',
	zip_tip:                  'Tienes que especificar un código: `/zip 234638`',
	something_went_wrong:     'Algo salió mal :(',
	file_is_too_big:          'No puedo enviar archivos de más de 50 MB debido a restricciones.',
	size_of_your_file:        'Tamaño de su archivo: ',
	just_send_me_a_code:      'Solo envíame un código',
	will_be_implemented_soon: 'Esta función se implementará pronto',

	// inline search
	history_tip_title:       '¡Historia!',
	history_tip_description: 'Este es tu historial:',
	history_is_empty:        'Tu historial está vacío ...',

	next_page_tip_title:   'Página siguiente',
	next_page_tip_message: 'Para ver una página específica, puede <b>agregar /p</b><code>n</code> a la consulta de búsqueda, donde <code>n</code> es el número de página',
	next_page_tip: 'TOQUE AQUÍ o simplemente agregue "/p{{pageNumber}}" a la consulta de búsqueda: ',

	sorting_by_popularity_tip_title: 'Para ordenar los resultados por popularidad',
	sorting_by_new_tip_title:        'Para ordenar los resultados por nuevo',

	favorites:                 'Favoritos!',
	favorites_tip_description: 'Estos son tus favoritos:',
	favorites_is_empty:        'No te ha gustado nada todavía',

	sorting_tip_slim: 'Simplemente agregue "/s{{reverseSortingParameter}}" a la consulta de búsqueda: ',
	sorting_tip:
	`Para ordenar los resultados de la búsqueda por {{reverseSortingWord}},
	puede agregar <b>/s{{reverseSortingParameter}}</b> a la consulta de búsqueda.`,

	// settings:
	settings:               '<b>Ajustes:</b>',
	search_appearance:      'Buscar apariencia:  ',
	search_sorting:         'Buscar ordenando por ',
	random_locally:         'Localizacón aleatoria:  ',
	allow_repeat_in_random: 'Permitir la repetición en el modo aleatorio: ',
	safe_mode:              'Modo seguro está ',
	about_settings:         'acerca de la configuración',
	about_settings_url:     '', // TODO: translate https://telegra.ph/Settings-04-09

	current_language:  'Lang: 🇪🇸',
	choose_a_language: 'Elige un idioma',

	article: 'artículo',
	gallery: 'galería',

	// help
	help: 
	`• Para abrir un doujin en específico solo envíame el link de nhentai o el código nuclear
	• También puedes descargar imágenes en archivos .zip con el comando /zip. Por ejemplo: <code>/zip 234638</code>
	
	<a href="https://github.com/iamdowner/nhentai-telegram-bot">GitHub</a>`,
	donation_message: 'Apoya esta instancia::',
	search_tips: 
`  <b>Buscar</b>
	• Puedes cambiar la clasificación de la búsqueda añadiendo <code>/s</code><I>p</i> antes de lo que quieres buscar, dónde <i>p</i> - significa <b>p</b>opular o <i>n</i> - <b>n</b>ew, por ejemplo: <code>/sp sex toys</code>
	• Puedes especificar el número de páginas añadiendo <code>/p</code>[<i>n</i>] antes de lo que quieres buscar, dónde <i>n</i> - es el número de páginas, por ejemplo: <code>/p5 sex toys</code>
	• Puedes buscar varios términos al mismo tiempo, y solo aparecerán las galerías que contienen ambos términos. Por ejemplo, <code>anal tanlines</code> encuentra galerías que contienen ambos, anal y tanlines. 
	• Puedes excluir términos utilizando <code>-</code>. Por ejemplo, anal tanlines -yaoi encontrara todas las galerías que contengan anal y tanlines sin yaoi.
	• Búsquedas exactas pueden ser posibles utilizando términos de dos palabras. Por ejemplo, <code>"big breasts"</code> solo encontrará galerías con <i>"big breats"</i> ya sea en el título o en las etiquetas.
	• Pueden ser combinados con etiquetas para tener un mayor control sobre la búsqueda: <code>parodies:railgun -tag:"big breats"</code>.
	• Puedes buscar un número específico de páginas con  pages:20, o con un rango de páginas: <code>pages:&gt;20 pages:&lt;=30.</code>
	• Puedes buscar galerías dentro de un lapso de tiempo con <code>uploaded:20d</code>. Las unidades válidas son h, d, w, m, y.
	• Puedes usar rangos también: <code>uploaded:>20d uploaded:&lt;30d.</code>`
}
