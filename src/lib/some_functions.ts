import config from '../../config'
import i18n from './i18n'

import { Manga } from '../models/manga.model'
import { Doujin, LightDoujin } from './nhentai'
import { Favorite, User } from '../models/user.model'
import { InlineKeyboardButton } from 'typegram'

export function getMangaMessage(
	manga: Doujin | Manga | Favorite,
	telegraphLink?: string
): string {
	const title = getTitle(manga),
		tags = tagString(manga),
		pages_word = i18n.t('pages'),
		pages = Array.isArray(manga.pages) ? manga.pages.length : manga.pages,
		id = 'id' in manga ? manga.id : manga._id,
		mangaUrl = `https://nhentai.net/g/${id}/`
	
	let link: string | undefined = telegraphLink
	if (!link) {
		if ('telegraph_fixed_url' in manga && manga.telegraph_fixed_url) {
			link = manga.telegraph_fixed_url
		} else if ('telegraph_url' in manga && manga.telegraph_url) {
			link = manga.telegraph_url
		}
	}
	return `
<a href="${link}">${title}</a> (${pages} ${pages_word})
${tags}\n<a href="${mangaUrl}">nhentai.net</a> | <code>${id}</code>`
}

export function tagString(
	manga: Doujin | Manga | Favorite
): string {
	let tags = i18n.t('tags')
	let tagsArray: string[] = []
	if ('tags' in manga && manga.tags) {
		tagsArray = manga.tags
	} else if ('details' in manga) {
		manga.details.tags?.forEach((tag) => {
			tagsArray.push(tag.name)
		})
	}
	tagsArray.forEach((tag, index) => {
		if (index !== tagsArray.length - 1) {
			tags += '#' + tag.replace(/\s/g, '_').replace(/-/g, '_')
		}
		if (index < tagsArray.length - 2) {
			tags += ', '
		}
	})
	return tags
}
export function sliceByHalf(s: string): string {
	let middle = Math.floor(s.length / 2)
	const before = s.lastIndexOf(' ', middle)
	const after = s.indexOf(' ', middle + 1)

	if (before == -1 || (after != -1 && middle - before >= after - middle)) {
		middle = after
	} else {
		middle = before
	}
	return s.substr(middle + 1)
}
export function getMessageInline(manga: LightDoujin): string {
	const link = 'https://nhentai.net/g/' + manga.id + '/',
		title = manga.title ? manga.title
			.replace(/</g, ']')
			.replace(/>/g, '[')
			.trim() : 'Some manga'
	return `<a href="${link}">${title}</a>`
}
export function getTitle(manga: Doujin | Manga | Favorite): string {
	let title
	if (typeof manga.title === 'string') {
		title = manga.title
	} else {
		if (manga.title.translated && manga.title.translated.pretty) {
			title = manga.title.translated.pretty
		} else if (manga.title.original && manga.title.original.pretty) {
			title = manga.title.original.pretty
		}
	}
	if (!title) {
		return ''
	}
	return title
		.replace(/>/g, ']')
		.replace(/</g, '[')
}
export function isFullColor(manga: Doujin | Manga): boolean {
	let result = false
	if ('tags' in manga && manga.tags) {
		result = manga.tags.includes('full color') || manga.tags.includes('full_color')
	} else if ('details' in manga && manga.details.tags) {
		manga.details.tags.forEach((tag) => {
			if (tag.name.includes('full color') || tag.name.includes('full_color')) {
				result = true
			}
		})
	}
	return result
}
export function assembleKeyboard(
	user: User,
	manga: Manga,
	telegraphUrl: string | undefined,
	inline = false
): InlineKeyboardButton[][] {
	const heart = user.favorites.find(item => { return item._id === String(manga.id) }) ? config.like_button_true : config.like_button_false
	const inlineKeyboard: InlineKeyboardButton[][] = [
		[
			{
				text: 'Telegra.ph',
				url:  String(telegraphUrl)
			},
			{
				text:          heart,
				callback_data: 'like_' + manga.id
			},
		],
		[
			{
				text:                             i18n.t('search_button'),
				switch_inline_query_current_chat: '',
			},
		],
	]
	if (!inline) {
		inlineKeyboard.push([
			{
				text:          i18n.t('next_button'),
				callback_data: 'r'
			}
		])
	}
	const numberOfPages = manga.pages
	/* if the manga is too big, the telegram might refuse to create an instant view,
		 so here is a button that can magically fix that */
	if (!manga.telegraph_fixed_url
		&& (numberOfPages > config.pages_to_show_fix_button
			|| isFullColor(manga))) {
		inlineKeyboard[0].unshift({
			text:          i18n.t('fix_button'),
			callback_data: 'fix_' + manga.id,
		})
	}
	return inlineKeyboard
}
