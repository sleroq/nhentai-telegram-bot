class Wrap extends Error {
	constructor(error: unknown, msg?: string) {
		if (error instanceof Error) {
			super(`${msg}: ${error.message}`)
		} else if (typeof error === 'string') {
			super(`${msg}: ${error}`)
		} else {
			throw new Error('error in Werror is not an instance of "Error"')
		}
	}
}

export default class Werror extends Wrap {
	cause?: Error
	constructor(error: unknown, msg?: string) {
		super(error, msg)

		if (error instanceof Error) {
			this.cause = error
		}
	}
}