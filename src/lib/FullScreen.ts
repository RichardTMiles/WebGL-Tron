export namespace THREEx {
	export class FullScreen {
		private static _hasWebkitFullScreen = !!document['webkitCancelFullScreen'] ?? false;
		private static _hasMozFullScreen = !!document['mozCancelFullScreen'] ?? false;

		/**
		 * Test if it is possible to have fullscreen.
		 *
		 * @returns {boolean} True if fullscreen API is available, false otherwise.
		 */
		public static available(): boolean {
			return FullScreen._hasWebkitFullScreen || FullScreen._hasMozFullScreen || document.fullscreenEnabled;
		}

		/**
		 * Test if fullscreen is currently activated.
		 *
		 * @returns {boolean} True if fullscreen is currently activated, false otherwise.
		 */
		public static activated(): boolean {
			if (document.fullscreenElement) {
				return true;
			} else if (FullScreen._hasWebkitFullScreen) {
				// @ts-ignore
				return document.webkitIsFullScreen;
			} else if (FullScreen._hasMozFullScreen) {
				// @ts-ignore
				return document.mozFullScreen;
			} else {
				console.assert(false);
				return false;
			}
		}

		/**
		 * Request fullscreen on a given element.
		 *
		 * @param {HTMLElement} [element=document.body] Element to make fullscreen. Optional, defaults to document.body.
		 */
		public static request(element: HTMLElement = document.body): void {
			if (element.requestFullscreen) {
				element.requestFullscreen();
			} else if (FullScreen._hasWebkitFullScreen) {
				// @ts-ignore
				element.webkitRequestFullScreen();
			} else if (FullScreen._hasMozFullScreen) {
				// @ts-ignore
				element.mozRequestFullScreen();
			} else {
				console.assert(false);
			}
		}

		/**
		 * Cancel fullscreen.
		 */
		public static cancel(): void {
			if (document.exitFullscreen) {
				document.exitFullscreen();
			} else if (FullScreen._hasWebkitFullScreen) {
				// @ts-ignore
				document.webkitCancelFullScreen();
			} else if (FullScreen._hasMozFullScreen) {
				// @ts-ignore
				document.mozCancelFullScreen();
			} else {
				console.assert(false);
			}
		}

		/**
		 * Bind a key to toggle fullscreen.
		 *
		 * @param {Object} opts - Options for binding.
		 * @param {number} [opts.charCode='w'.charCodeAt(0)] - Character code for the key to toggle fullscreen.
		 * @param {boolean} [opts.dblclick=false] - Whether to toggle fullscreen on double-click.
		 * @param {HTMLElement} [opts.element] - Element to make fullscreen when toggling.
		 * @returns {Object} An object with an `unbind` method to remove the event listeners.
		 */
		public static bindKey(opts: { charCode?: number, dblclick?: boolean, element?: HTMLElement } = {}): { unbind: () => void } {
			const charCode = opts.charCode || 'w'.charCodeAt(0);
			const dblclick = opts.dblclick !== undefined ? opts.dblclick : false;
			const element = opts.element;

			const toggle = () => {
				if (FullScreen.activated()) {
					FullScreen.cancel();
				} else {
					FullScreen.request(element);
				}
			};

			const onKeyPress = (event: KeyboardEvent) => {
				if (event.which !== charCode) return;
				toggle();
			};

			document.addEventListener('keypress', onKeyPress);
			if (dblclick) {
				document.addEventListener('dblclick', toggle);
			}

			return {
				unbind: () => {
					document.removeEventListener('keypress', onKeyPress);
					if (dblclick) {
						document.removeEventListener('dblclick', toggle);
					}
				}
			};
		}
	}
}
