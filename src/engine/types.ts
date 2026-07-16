export type Viewport = {
  width: number
  height: number
  pixelRatio: number
  compact: boolean
}

export type ShuffleItem = {
  id: string
  label: string
  color: string
}

export type ShuffleGroup = {
  label: string
  items: ShuffleItem[]
}

export type ShuffleResult = {
  groups: ShuffleGroup[]
  announcement: string
}

export interface ShuffleMode {
  readonly id: string
  mount(context: ModeContext): Promise<void>
  shuffle(): Promise<ShuffleResult>
  resize(viewport: Viewport): void
  update(elapsed: number, delta: number): void
  reset(): void
  dispose(): void
}

export type ModeContext = {
  scene: import('three').Scene
  camera: import('three').PerspectiveCamera
  renderer: import('three').WebGLRenderer
  viewport: Viewport
  invalidate: () => void
}
