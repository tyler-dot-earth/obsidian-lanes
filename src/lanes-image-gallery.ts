/** One image shown in the Lanes lightbox. */
export interface LanesGalleryImage {
	readonly src: string
	readonly label: string
}

/** Wraps an index into [0, length). */
export const lanesGalleryIndexAfterStep = (index: number, length: number, step: number): number => {
	if (length <= 0) {
		return 0
	}

	return (((index + step) % length) + length) % length
}

const appendLanesGalleryButton = (
	parentEl: HTMLElement,
	className: string,
	label: string,
	onClick: () => void,
): void => {
	const buttonEl = document.createElement('button')

	buttonEl.className = className
	buttonEl.type = 'button'
	buttonEl.textContent = label
	buttonEl.addEventListener('click', (event: MouseEvent) => {
		event.stopPropagation()
		onClick()
	})
	parentEl.appendChild(buttonEl)
}

/** Full-screen lightbox for card covers and screenshot properties. */
export class LanesImageGallery {
	private overlayEl: HTMLElement | null = null
	private imageEl: HTMLImageElement | null = null
	private captionEl: HTMLElement | null = null
	private images: readonly LanesGalleryImage[] = []
	private index = 0

	/** Opens the gallery at startIndex. Replaces an already-open gallery. */
	open(images: readonly LanesGalleryImage[], startIndex: number): void {
		this.close()

		if (images.length === 0) {
			return
		}

		this.images = images
		this.index = lanesGalleryIndexAfterStep(startIndex, images.length, 0)
		this.renderLanesImageGallery()
		window.addEventListener('keydown', this.onLanesGalleryKeydown)
	}

	/** Removes the overlay and key listener. */
	close(): void {
		window.removeEventListener('keydown', this.onLanesGalleryKeydown)
		this.overlayEl?.remove()
		this.overlayEl = null
		this.imageEl = null
		this.captionEl = null
		this.images = []
		this.index = 0
	}

	private readonly onLanesGalleryKeydown = (event: KeyboardEvent): void => {
		if (event.key === 'Escape') {
			event.preventDefault()
			this.close()

			return
		}

		if (event.key === 'ArrowLeft') {
			event.preventDefault()
			this.stepLanesGallery(-1)

			return
		}

		if (event.key === 'ArrowRight') {
			event.preventDefault()
			this.stepLanesGallery(1)
		}
	}

	private stepLanesGallery(step: number): void {
		this.index = lanesGalleryIndexAfterStep(this.index, this.images.length, step)
		this.paintLanesGalleryFrame()
	}

	private renderLanesImageGallery(): void {
		const overlayEl = document.createElement('div')

		overlayEl.className = 'lanes-image-gallery'
		overlayEl.addEventListener('click', (event: MouseEvent) => {
			if (event.target === overlayEl) {
				this.close()
			}
		})
		appendLanesGalleryButton(overlayEl, 'lanes-image-gallery-close', 'Close', () => {
			this.close()
		})

		if (this.images.length > 1) {
			appendLanesGalleryButton(overlayEl, 'lanes-image-gallery-prev', 'Previous', () => {
				this.stepLanesGallery(-1)
			})
			appendLanesGalleryButton(overlayEl, 'lanes-image-gallery-next', 'Next', () => {
				this.stepLanesGallery(1)
			})
		}

		const imageEl = document.createElement('img')

		imageEl.className = 'lanes-image-gallery-image'
		overlayEl.appendChild(imageEl)

		const captionEl = document.createElement('div')

		captionEl.className = 'lanes-image-gallery-caption'
		overlayEl.appendChild(captionEl)
		document.body.appendChild(overlayEl)
		this.overlayEl = overlayEl
		this.imageEl = imageEl
		this.captionEl = captionEl
		this.paintLanesGalleryFrame()
	}

	private paintLanesGalleryFrame(): void {
		const frame = this.images[this.index]
		const imageEl = this.imageEl
		const captionEl = this.captionEl

		if (frame === undefined || imageEl === null || captionEl === null) {
			return
		}

		imageEl.src = frame.src
		imageEl.alt = frame.label
		captionEl.textContent =
			this.images.length === 1
				? frame.label
				: `${frame.label}  ${String(this.index + 1)} / ${String(this.images.length)}`
	}
}
