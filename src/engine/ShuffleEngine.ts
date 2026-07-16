import * as THREE from 'three'
import { createViewport, preferredFrameInterval } from './quality'
import type { ShuffleMode, ShuffleResult, Viewport } from './types'

export class ShuffleEngine {
  private readonly scene = new THREE.Scene()
  private readonly camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100)
  private readonly renderer: THREE.WebGLRenderer
  private mode: ShuffleMode | null = null
  private previousTime = 0
  private previousFrame = 0
  private frameInterval = 1000 / 60
  private resizeObserver: ResizeObserver
  private intersectionObserver: IntersectionObserver
  private visible = true
  private intersecting = true

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
    this.camera.position.set(0, 0, 10)

    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(canvas.parentElement ?? canvas)
    this.intersectionObserver = new IntersectionObserver(([entry]) => {
      this.intersecting = entry.isIntersecting
      this.previousTime = performance.now()
    }, { rootMargin: '160px' })
    this.intersectionObserver.observe(canvas)
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
    return createViewport(this.canvas)
  }

  private resize() {
    const viewport = this.viewport()
    this.renderer.setPixelRatio(viewport.pixelRatio)
    this.renderer.setSize(viewport.width, viewport.height, false)
    this.frameInterval = preferredFrameInterval(viewport)
    this.camera.aspect = viewport.width / viewport.height
    this.camera.updateProjectionMatrix()
    this.mode?.resize(viewport)
    this.render()
  }

  private animate = (now: number) => {
    requestAnimationFrame(this.animate)
    if (!this.visible || !this.intersecting || now - this.previousFrame < this.frameInterval) return
    const delta = Math.min((now - this.previousTime) / 1000, 0.05)
    this.previousTime = now
    this.previousFrame = now
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
