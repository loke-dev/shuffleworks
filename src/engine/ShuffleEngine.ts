import * as THREE from 'three'
import type { ShuffleMode, ShuffleResult, Viewport } from './types'

export class ShuffleEngine {
  private readonly scene = new THREE.Scene()
  private readonly camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100)
  private readonly renderer: THREE.WebGLRenderer
  private mode: ShuffleMode | null = null
  private previousTime = 0
  private resizeObserver: ResizeObserver
  private visible = true

  private readonly canvas: HTMLCanvasElement

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: window.devicePixelRatio < 2.25,
      powerPreference: 'high-performance',
    })
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.15
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFShadowMap
    this.camera.position.set(0, 0, 10)

    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(canvas.parentElement ?? canvas)
    document.addEventListener('visibilitychange', this.handleVisibility)
  }

  async start(mode: ShuffleMode) {
    this.mode?.dispose()
    this.mode = null
    this.resize()
    await mode.mount({
      scene: this.scene,
      camera: this.camera,
      renderer: this.renderer,
      viewport: this.viewport(),
      invalidate: () => this.render(),
    })
    this.mode = mode
    mode.resize(this.viewport())
    this.previousTime = performance.now()
    requestAnimationFrame(this.animate)
  }

  shuffle(): Promise<ShuffleResult> {
    if (!this.mode) throw new Error('No shuffle mode mounted')
    return this.mode.shuffle()
  }

  private viewport(): Viewport {
    const bounds = (this.canvas.parentElement ?? this.canvas).getBoundingClientRect()
    return {
      width: Math.max(bounds.width, 1),
      height: Math.max(bounds.height, 1),
      pixelRatio: Math.min(window.devicePixelRatio, 1.75),
      compact: bounds.width < 760,
    }
  }

  private resize() {
    const viewport = this.viewport()
    this.renderer.setPixelRatio(viewport.pixelRatio)
    this.renderer.setSize(viewport.width, viewport.height, false)
    this.camera.aspect = viewport.width / viewport.height
    this.camera.updateProjectionMatrix()
    this.mode?.resize(viewport)
    this.render()
  }

  private animate = (now: number) => {
    requestAnimationFrame(this.animate)
    if (!this.visible) return
    const delta = Math.min((now - this.previousTime) / 1000, 0.05)
    this.previousTime = now
    this.mode?.update(now / 1000, delta)
    this.render()
  }

  private render() {
    this.renderer.render(this.scene, this.camera)
  }

  private handleVisibility = () => {
    this.visible = !document.hidden
    this.previousTime = performance.now()
  }
}
