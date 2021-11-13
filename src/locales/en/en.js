export default {
	language_name: 'English',
	greeting:      'Hello, {{name}}\n<b>This bot have R-18 content, click this button only if you mature enough</b>',

	// buttons:
	random_button:         'Random manga',
	search_button:         'Search',
	next_button:           'Next',
	previous_button:       'Prev',
	back_button:           'Back',
	fix_button:            'Fix',
	waitabit_button:       'Wait a bit',
	search_tips_button:    'Search tips',
	settings_button:       'settings',
	next_page_button:      'Next page',
	tap_to_open_favorites: 'Tap to open favorites',
	tap_to_open_history:   'Tap to open history',
	open:                  'Open',

	// manga related text:
	pages:           'pages',
	tags:            'Tags: ',
	too_many_pages:  'Too many pages, sorry :(',
	try_again_later: 'Try again later :(',
	pages_fixed:     ' pages fixed',

	// just text
	yes:                      'yes',
	enabled:                  'enabled',
	no:                       'no',
	disabled:                 'disabled',
	date:                     'date',
	popular:                  'popularity',
	nothing_is_found:         'Nothing is found ¯_(ツ)_/¯',
	manga_does_not_exist:     'This manga doesn\'t exist!',
	failed_to_get:            'Failed to get doujin!',
	zip_tip:                  'You have to specify a code: `/zip 234638`',
	something_went_wrong:     'Something went wrong :(',
	file_is_too_big:          'Sorry, I can\'t send files larger than 50 MB due to telegram\'s restrictions.',
	size_of_your_file:        'Size of your file: ',
	just_send_me_a_code:      'Just send me a code',
	will_be_implemented_soon: 'This feature will be implemented soon',

	// inline search
	history_tip_title:       'History!',
	history_tip_description: 'This is your history:',
	history_is_empty:        'Your history is empty..',

	next_page_tip_title:   'Next page',
	next_page_tip_message: 'To view specific page you can <b>add /p</b><code>n</code> to the search query, where <code>n</code> is page number',
	next_page_tip: 'TAP HERE or Just add "/p{{pageNumber}}" to search query: ',

	sorting_by_popularity_tip_title: 'To sort results by popularity',
	sorting_by_new_tip_title:        'To sort results by new',

	favorites:                 'Favorites!',
	favorites_tip_description: 'This is your favorites:',
	favorites_is_empty:        'You haven\'t liked anything yet',

	sorting_tip_slim: 'TAP HERE or add "/s{{reverseSortingParameter}}" to search query: ',
	sorting_tip:
	`To sort search results by {{reverseSortingWord}}
	you can add <b>/s{{reverseSortingParameter}}</b> to your search query.`,

	// settings:
	settings:               '<b>Settings:</b>',
	search_appearance:      'Search appearance:  ',
	search_sorting:         'Search sorting by: ',
	random_locally:         'Random Locally:  ',
	allow_repeat_in_random: 'Allow repeat in random:  ',
	safe_mode:              'Safe mode is ',
	about_settings:         'About settings',
	about_settings_url:     '',

	current_language:  'Lang: 🇺🇸',
	choose_a_language: 'Choose a language',

	article: 'article',
	gallery: 'gallery',

	// help
	help:
	`• To open a specific doujin just send me nhentais link or nuclear code
	• Also you can download images in .zip file with /zip command. For example: <code>/zip 234638</code>,

	<a href="https://github.com/iamdowner/nhentai-telegram-bot">GitHub</a>`,
	donation_message: 'Support this instance:',
	search_tips:
	`<b>Search</b>
	• You can change search sorting by adding <code>/s</code><I>p</i> before the search query, where <i>p</i> - means by <b>p</b>opular or <i>n</i> - by <b>n</b>ew, for example: <code>/sp sex toys</code>
	• You can specify page number by adding <code>/p</code>[<i>n</i>] before the search query, where <i>n</i> - page number, for example: <code>/p5 sex toys</code>
	• You can search for multiple terms at the same time, and this will return only galleries that contain both terms. For example, <code>anal tanlines</code> finds all galleries that contain both anal and tanlines.
	• You can exclude terms by prefixing them with <code>-</code>. For example, anal tanlines -yaoi matches all galleries matching anal and tanlines but not yaoi.
	• Exact searches can be performed by wrapping terms in double quotes. For example, <code>"big breasts"</code> only matches galleries with <i>"big breasts"</i> somewhere in the title or in tags.
	• These can be combined with tag namespaces for finer control over the query: <code>parodies:railgun -tag:"big breast"</code>.
	• You can search for galleries with a specific number of pages with pages:20, or with a page range: <code>pages:&gt;20 pages:&lt;=30.</code>
	• You can search for galleries uploaded within some timeframe with <code>uploaded:20d</code>. Valid units are h, d, w, m, y.
	• You can use ranges as well: <code>uploaded:>20d uploaded:&lt;30d.</code>`
}