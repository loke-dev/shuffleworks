import * as THREE from 'three'
import { ResourceStore } from '../../engine/resources'
import type { ModeContext, ShuffleMode, ShuffleResult, Viewport } from '../../engine/types'
import { smoothstep } from '../teams/choreography'
import { createDieGeometry } from './geometry'
import { dieTypes, type DiceOptions, type DieSides } from './types'

type Die = {
  group: THREE.Group
  mesh: THREE.Mesh
  label: THREE.Sprite
  labelTexture: THREE.CanvasTexture
  target: THREE.Vector3
  start: THREE.Vector3
  startRotation: THREE.Euler
  endRotation: THREE.Euler
  delay: number
  value: number
}

const colors = [0xa974ff, 0x38a0ff, 0xff625b, 0xffd84f, 0x67e8c3, 0xff8ed4]

export class DiceMode implements ShuffleMode {
  readonly id = 'dice'
  private context!: ModeContext
  private root = new THREE.Group()
  private resources = new ResourceStore()
  private geometries = new Map<DieSides, THREE.BufferGeometry>()
  private dice: Die[] = []
  private viewport!: Viewport
  private options: DiceOptions
  private elapsed = 0
  private rollingAt = -1
  private duration = 1.95
  private resolveRoll: ((result: ShuffleResult) => void) | null = null

  constructor(options: DiceOptions) {
    this.options = options
  }

  async mount(context: ModeContext) {
    this.context = context
    context.scene.add(this.root)
    this.root.add(new THREE.HemisphereLight(0xf1edff, 0x110b25, 2.7))
    const key = new THREE.DirectionalLight(0xffffff, 4.5)
    key.position.set(-3, 6, 7)
    const violet = new THREE.PointLight(0x9b5cff, 34, 18, 2)
    violet.position.set(-4, 1, 4)
    const blue = new THREE.PointLight(0x38a0ff, 28, 18, 2)
    blue.position.set(4, -1, 4)
    this.root.add(key, violet, blue)

    dieTypes.forEach((sides) => this.geometries.set(sides, this.resources.add(createDieGeometry(sides))))
    this.dice = Array.from({ length: 6 }, (_, index) => this.createDie(index))
    this.resize(context.viewport)
    this.applyOptions()
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
  }

  setOptions(options: DiceOptions) {
    this.options = options
    if (this.context) this.applyOptions()
  }

  resize(viewport: Viewport) {
    this.viewport = viewport
    this.context.camera.position.set(0, viewport.compact ? 0.25 : 0.1, viewport.compact ? 11.5 : 10.8)
    this.layoutDice()
  }

  shuffle(): Promise<ShuffleResult> {
    if (this.resolveRoll) return Promise.reject(new Error('Dice already rolling'))
    this.rollingAt = this.elapsed
    this.dice.slice(0, this.options.count).forEach((die, index) => {
      die.start.copy(die.group.position)
      die.startRotation.copy(die.group.rotation)
      die.endRotation.set(
        (3 + index % 3) * Math.PI + Math.random() * Math.PI,
        (4 + index % 2) * Math.PI + Math.random() * Math.PI,
        (2 + index % 4) * Math.PI + Math.random() * Math.PI,
      )
      die.delay = index * 0.055
      die.value = 1 + Math.floor(Math.random() * this.options.sides)
      die.label.visible = false
    })
    return new Promise((resolve) => { this.resolveRoll = resolve })
  }

  update(elapsed: number) {
    this.elapsed = elapsed
    if (!this.resolveRoll) {
      this.dice.slice(0, this.options.count).forEach((die, index) => {
        die.group.position.y = die.target.y + Math.sin(elapsed * 0.8 + index) * 0.035
        die.group.rotation.z += 0.0007 * (index % 2 ? 1 : -1)
      })
      return
    }

    let active = 0
    this.dice.slice(0, this.options.count).forEach((die, index) => {
      const linear = (elapsed - this.rollingAt - die.delay) / this.duration
      if (linear < 0) { active += 1; return }
      if (linear < 1) {
        active += 1
        const progress = smoothstep(linear)
        const arc = Math.sin(Math.PI * linear)
        const wobble = Math.sin(linear * Math.PI * 3) * (1 - linear)
        die.group.position.lerpVectors(die.start, die.target, progress)
        die.group.position.y += arc * (this.viewport.compact ? 1.45 : 1.8) + Math.abs(wobble) * 0.28
        die.group.position.z = arc * 1.65
        die.group.rotation.set(
          THREE.MathUtils.lerp(die.startRotation.x, die.endRotation.x, progress),
          THREE.MathUtils.lerp(die.startRotation.y, die.endRotation.y, progress),
          THREE.MathUtils.lerp(die.startRotation.z, die.endRotation.z, progress),
        )
        return
      }
      die.group.position.copy(die.target)
      die.group.position.z = 0
      die.group.rotation.set(-0.16, 0.24 * (index - (this.options.count - 1) / 2), 0.06 * (index % 2 ? 1 : -1))
      this.updateLabel(die)
      die.label.visible = true
    })

    if (active === 0) {
      const resolve = this.resolveRoll
      this.resolveRoll = null
      resolve?.(this.result())
    }
  }

  reset() {
    this.options = { count: 2, sides: 6 }
    this.applyOptions()
  }

  dispose() {
    this.context.scene.remove(this.root)
    this.resources.dispose()
  }

  private applyOptions() {
    const geometry = this.geometries.get(this.options.sides)!
    this.dice.forEach((die, index) => {
      die.group.visible = index < this.options.count
      die.mesh.geometry = geometry
      die.value = Math.min(die.value || index + 1, this.options.sides)
      this.updateLabel(die)
      die.label.visible = index < this.options.count
    })
    this.layoutDice()
  }

  private layoutDice() {
    const count = this.options.count
    const compact = this.viewport?.compact ?? false
    const columns = compact ? Math.min(count, 2) : Math.min(count, 3)
    const rows = Math.ceil(count / columns)
    const gapX = compact ? 1.62 : 2.55
    const gapY = compact ? count > 4 ? 0.88 : 2.05 : 2.35
    const scale = compact
      ? count === 1 ? 0.88 : count === 2 ? 0.68 : count <= 4 ? 0.6 : 0.38
      : count <= 2 ? 1.05 : count <= 4 ? 0.86 : 0.72
    this.dice.forEach((die, index) => {
      const row = Math.floor(index / columns)
      const inRow = Math.min(columns, count - row * columns)
      const column = index % columns
      die.target.set((column - (inRow - 1) / 2) * gapX, ((rows - 1) / 2 - row) * gapY - 0.05, 0)
      die.group.scale.setScalar(scale)
      if (!this.resolveRoll) die.group.position.copy(die.target)
    })
  }

  private createDie(index: number): Die {
    const group = new THREE.Group()
    const material = this.resources.add(new THREE.MeshPhysicalMaterial({
      color: colors[index],
      emissive: colors[index],
      emissiveIntensity: 0.08,
      roughness: 0.16,
      metalness: 0.05,
      transmission: 0.32,
      thickness: 1,
      transparent: true,
      opacity: 0.94,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      flatShading: true,
    }))
    const mesh = new THREE.Mesh(this.geometries.get(this.options.sides)!, material)
    const labelTexture = this.resources.add(new THREE.CanvasTexture(document.createElement('canvas')))
    const labelMaterial = this.resources.add(new THREE.SpriteMaterial({ map: labelTexture, transparent: true, depthTest: false }))
    const label = new THREE.Sprite(labelMaterial)
    label.position.set(0, 0, 1.45)
    label.scale.set(0.78, 0.78, 1)
    label.renderOrder = 4
    group.add(mesh, label)
    this.root.add(group)
    return {
      group, mesh, label, labelTexture, target: new THREE.Vector3(), start: new THREE.Vector3(),
      startRotation: new THREE.Euler(), endRotation: new THREE.Euler(), delay: 0, value: index + 1,
    }
  }

  private updateLabel(die: Die) {
    const canvas = die.labelTexture.image as HTMLCanvasElement
    canvas.width = 128
    canvas.height = 128
    const context = canvas.getContext('2d')!
    context.clearRect(0, 0, 128, 128)
    context.fillStyle = 'rgba(5,6,10,.48)'
    context.beginPath()
    context.arc(64, 64, 44, 0, Math.PI * 2)
    context.fill()
    context.strokeStyle = 'rgba(255,255,255,.65)'
    context.lineWidth = 2
    context.stroke()
    context.fillStyle = '#fff'
    context.font = '500 46px Arial'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillText(String(die.value), 64, 66)
    die.labelTexture.needsUpdate = true
  }

  private result(): ShuffleResult {
    const items = this.dice.slice(0, this.options.count).map((die, index) => ({
      id: `die-${index + 1}`,
      label: String(die.value),
      color: `#${colors[index].toString(16).padStart(6, '0')}`,
    }))
    const total = items.reduce((sum, item) => sum + Number(item.label), 0)
    return { groups: [{ label: `D${this.options.sides} roll · total ${total}`, items }], announcement: `Rolled ${items.map((item) => item.label).join(', ')}. Total ${total}.` }
  }
}
