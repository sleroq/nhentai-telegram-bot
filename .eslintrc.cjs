module.exports = {
	root:    true,
	plugins: [
		'@typescript-eslint',
	],
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
	],
	env: {
		browser: true,
		es2021:  true,
	},
	parser:        '@typescript-eslint/parser',
	parserOptions: {
		ecmaVersion: 12,
		sourceType:  'module',
	},
	rules: {
		indent:            ['error', 'tab'],
		'linebreak-style': ['error', 'unix'],
		quotes:            ['error', 'single'],
		semi:              ['error', 'never'],
		'key-spacing':     ['off', {
			beforeColon: false,
			afterColon:  true,
			align:       'value'
		}],
	}
}
