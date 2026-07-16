export function randomInt(max: number) {
  if (max <= 1) return 0
  const limit = Math.floor(0x100000000 / max) * max
  const value = new Uint32Array(1)
  do crypto.getRandomValues(value); while (value[0] >= limit)
  return value[0] % max
}

export function shuffled<T>(items: T[]) {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = randomInt(index + 1)
    ;[copy[index], copy[swap]] = [copy[swap], copy[index]]
  }
  return copy
}

export function loadLocal<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? '') as T } catch { return fallback }
}

export function saveLocal(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* Keep working without persistence. */ }
}
