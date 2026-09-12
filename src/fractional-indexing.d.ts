declare module 'fractional-indexing' {
	export function generateKeyBetween(
		a: string | null | undefined,
		b: string | null | undefined,
		digits?: string,
		intDigits?: string,
	): string

	export function generateNKeysBetween(
		a: string | null | undefined,
		b: string | null | undefined,
		n: number,
		digits?: string,
		intDigits?: string,
	): string[]
}
