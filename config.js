export default {
	bot_username: 'nhentai_searchbot',
	// This will be used to sign telegra.ph pages,

	api_enabled: true,
	// show some stats as json on api/ page (details in: api.js, express.js),

	donation_wallets: [
		{
			name:		 'Monero',
			address: '85DLifC32dN3cYSBjF8ShgSYn6KD7WPAoSXEATyEVnQZW5mFxJDnMNacBvJ1qLHgVxjKQUXikb7cU4WXzp1Zc4gwMWDgMB8'}
	],
	// Add donation message to /help command with donation_wallets,

	express_get_slash:                 'Hello, love <3',
	text_at_the_end_of_telegraph_page: 'Thanks for reading this chapter!',

	pages_to_show_fix_button: 100,
	// the number of pages in the manga required to add \'fix\' button to message.,

	maximum_codes_from_one_message: 30,

	show_favorites_as_gallery: false,
	show_history_as_gallery:   false,
	search_sorting_by_default: 'date',
	// date / popular,

	search_appearance_by_default: 'photo',
	// article (same as gallery) / photo,

	random_locally_by_default: true,
	// about random locally https://telegra.ph/Settings-04-09,

	can_repeat_in_random_by_default: true,

	like_button_false: '🖤',
	like_button_true:  '♥️',
	check_mark:        '✅',

	favorites_icon_inline:       'https://i.imgur.com/TmxG1Qr.png',
	history_icon_inline:         'https://i.imgur.com/vQxvN28.jpeg',
	next_page_icon_inline:       'https://i.imgur.com/3AMTdoA.png',
	help_icon_inline:            'https://i.imgur.com/j2zt4j7.png',
	sort_by_new_icon_inline:     'https://i.imgur.com/j2zt4j7.png',
	sort_by_popular_icon_inline: 'https://i.imgur.com/j2zt4j7.png',
}
