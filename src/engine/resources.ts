export type Disposable = { dispose: () => void }

export class ResourceStore {
  private items = new Set<Disposable>()

  add<T extends Disposable>(...items: T[]) {
    items.forEach((item) => this.items.add(item))
    return items[0]
  }

  dispose() {
    this.items.forEach((item) => item.dispose())
    this.items.clear()
  }
}
