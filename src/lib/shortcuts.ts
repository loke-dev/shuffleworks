const INTERACTIVE_SELECTOR='input, textarea, select, button, a, [contenteditable="true"]'

export function isSpaceShortcut(event: KeyboardEvent) {
  if (event.code !== 'Space' || event.repeat || event.metaKey || event.ctrlKey || event.altKey) return false
  return !(event.target instanceof Element) || !event.target.closest(INTERACTIVE_SELECTOR)
}

export function bindSpaceShortcut(action: () => void) {
  window.addEventListener('keydown', (event) => {
    if (!isSpaceShortcut(event)) return
    event.preventDefault()
    action()
  })
}
