export class KeyboardMangaer {
  public static KEY_PRESSED_MAP = new Map<string, boolean>()

  public static initialize() {
    window.addEventListener("keydown", (event) => {
      if (KeyboardMangaer.KEY_PRESSED_MAP.has(event.key)) {
        const currentValue = KeyboardMangaer.KEY_PRESSED_MAP.get(event.key)
        if (!currentValue) {
          KeyboardMangaer.KEY_PRESSED_MAP.set(event.key, true)
        }
      } else {
        KeyboardMangaer.KEY_PRESSED_MAP.set(event.key, true)
      }
    })

    window.addEventListener("keyup", (event) => {
      if (KeyboardMangaer.KEY_PRESSED_MAP.has(event.key)) {
        KeyboardMangaer.KEY_PRESSED_MAP.set(event.key, false)
      }
    })
  }
}

KeyboardMangaer.initialize()
