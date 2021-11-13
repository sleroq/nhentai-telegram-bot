export default class Werror extends Error {
	constructor(error: unknown, msg?: string) {
		if (error instanceof Error) {
			super(`${msg}: ${error.message}`)
		} else {
			console.error('error in Werror is not an instance of "Error"')
			console.error(error)
		}
	}
}