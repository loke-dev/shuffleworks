import * as THREE from 'three'
import { ResourceStore } from '../../engine/resources'
import type { ModeContext, ShuffleMode, ShuffleResult, Viewport } from '../../engine/types'
import { easeOutCubic, smoothstep } from '../teams/choreography'
import { createDieGeometry } from './geometry'
import { dieTypes, type DiceOptions, type DieSides } from './types'

type Die = {
  group: THREE.Group
  body: THREE.Group
  mesh: THREE.Mesh
  label: THREE.Sprite
  labelTexture: THREE.CanvasTexture
  labelMaterial: THREE.SpriteMaterial
  pips: THREE.Group
  target: THREE.Vector3
  start: THREE.Vector3
  startRotation: THREE.Euler
  endRotation: THREE.Euler
  landingRotation: THREE.Euler
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
  private duration = 2.45
  private resolveRoll: ((result: ShuffleResult) => void) | null = null
  private pipGeometry!: THREE.PlaneGeometry
  private pipMaterials = new Map<number, THREE.MeshBasicMaterial>()

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
    this.createPipResources()
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
      die.startRotation.copy(die.body.rotation)
      die.value = 1 + Math.floor(Math.random() * this.options.sides)
      die.landingRotation.copy(this.getLandingRotation(die.value, index))
      die.endRotation.set(
        die.landingRotation.x + (3 + index % 3) * Math.PI * 2,
        die.landingRotation.y + (4 + index % 2) * Math.PI * 2,
        die.landingRotation.z + (2 + index % 3) * Math.PI * 2,
      )
      die.delay = index * 0.055
      die.label.visible = false
      die.labelMaterial.opacity = 0
    })
    return new Promise((resolve) => { this.resolveRoll = resolve })
  }

  update(elapsed: number) {
    this.elapsed = elapsed
    if (!this.resolveRoll) {
      this.dice.slice(0, this.options.count).forEach((die, index) => {
        die.group.position.y = die.target.y + Math.sin(elapsed * 0.8 + index) * 0.035
        die.body.rotation.z += 0.0007 * (index % 2 ? 1 : -1)
      })
      return
    }

    let active = 0
    this.dice.slice(0, this.options.count).forEach((die) => {
      const linear = (elapsed - this.rollingAt - die.delay) / this.duration
      if (linear < 0) { active += 1; return }
      if (linear < 1) {
        active += 1
        const progress = smoothstep(linear)
        const rotationProgress = easeOutCubic(linear)
        const arc = Math.sin(Math.PI * linear) ** 2
        const wobble = Math.sin(linear * Math.PI * 3) * (1 - linear)
        const settleProgress = THREE.MathUtils.clamp((linear - 0.72) / 0.28, 0, 1)
        const settleHop = Math.sin(Math.PI * settleProgress) ** 2 * (1 - settleProgress)
        die.group.position.lerpVectors(die.start, die.target, progress)
        die.group.position.y += arc * (this.viewport.compact ? 1.45 : 1.8) + Math.abs(wobble) * 0.16 + settleHop * 0.2
        die.group.position.z = arc * 1.65 + settleHop * 0.12
        die.body.rotation.set(
          THREE.MathUtils.lerp(die.startRotation.x, die.endRotation.x, rotationProgress),
          THREE.MathUtils.lerp(die.startRotation.y, die.endRotation.y, rotationProgress),
          THREE.MathUtils.lerp(die.startRotation.z, die.endRotation.z, rotationProgress),
        )
        const labelProgress = smoothstep((linear - 0.82) / 0.18)
        die.label.visible = labelProgress > 0
        die.labelMaterial.opacity = labelProgress
        return
      }
      die.group.position.copy(die.target)
      die.group.position.z = 0
      die.body.rotation.copy(die.landingRotation)
      this.updateLabel(die)
      die.label.visible = true
      die.labelMaterial.opacity = 1
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
      die.pips.visible = this.options.sides === 6
      die.value = Math.min(die.value || index + 1, this.options.sides)
      if (!this.resolveRoll) die.body.rotation.copy(this.getLandingRotation(die.value, index))
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
    const crowded = count >= 4
    const gapX = compact ? 1.52 : crowded ? 2.15 : 2.55
    const gapY = compact ? count > 4 ? 0.82 : crowded ? 1.58 : 2.05 : crowded ? 1.8 : 2.35
    const scale = compact
      ? count === 1 ? 0.88 : count === 2 ? 0.68 : count <= 3 ? 0.58 : count === 4 ? 0.5 : 0.36
      : count <= 2 ? 1.05 : count === 3 ? 0.82 : count === 4 ? 0.68 : 0.58
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
    const body = new THREE.Group()
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
      flatShading: false,
    }))
    const mesh = new THREE.Mesh(this.geometries.get(this.options.sides)!, material)
    const labelTexture = this.resources.add(new THREE.CanvasTexture(document.createElement('canvas')))
    const labelMaterial = this.resources.add(new THREE.SpriteMaterial({ map: labelTexture, transparent: true, depthTest: false }))
    const label = new THREE.Sprite(labelMaterial)
    label.position.set(0.48, -0.48, 1.45)
    label.scale.set(0.5, 0.5, 1)
    label.renderOrder = 4
    const pips = this.createPipFaces()
    body.add(mesh, pips)
    group.add(body, label)
    this.root.add(group)
    return {
      group, body, mesh, label, labelTexture, labelMaterial, pips, target: new THREE.Vector3(), start: new THREE.Vector3(),
      startRotation: new THREE.Euler(), endRotation: new THREE.Euler(), landingRotation: new THREE.Euler(), delay: 0, value: index + 1,
    }
  }

  private getLandingRotation(value: number, index: number) {
    if (this.options.sides !== 6) {
      return new THREE.Euler(-0.16, 0.24 * (index - (this.options.count - 1) / 2), 0.06 * (index % 2 ? 1 : -1))
    }

    const rotations: Record<number, [number, number, number]> = {
      1: [0, 0, 0],
      2: [Math.PI / 2, 0, 0],
      3: [0, -Math.PI / 2, 0],
      4: [0, Math.PI / 2, 0],
      5: [-Math.PI / 2, 0, 0],
      6: [0, Math.PI, 0],
    }
    const [x, y, z] = rotations[value]
    return new THREE.Euler(x, y, z + 0.045 * (index % 2 ? 1 : -1))
  }

  private createPipResources() {
    this.pipGeometry = this.resources.add(new THREE.PlaneGeometry(1.16, 1.16))
    for (let value = 1; value <= 6; value += 1) {
      const canvas = document.createElement('canvas')
      canvas.width = 192
      canvas.height = 192
      const context = canvas.getContext('2d')!
      const positions: Record<number, number[][]> = {
        1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]],
        4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
        5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
        6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
      }
      context.fillStyle = 'rgba(255,255,255,.92)'
      positions[value].forEach(([x, y]) => {
        context.beginPath()
        context.arc(96 + x * 49, 96 + y * 49, 13, 0, Math.PI * 2)
        context.fill()
      })
      const texture = this.resources.add(new THREE.CanvasTexture(canvas))
      texture.colorSpace = THREE.SRGBColorSpace
      this.pipMaterials.set(value, this.resources.add(new THREE.MeshBasicMaterial({
        map: texture, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2,
      })))
    }
  }

  private createPipFaces() {
    const group = new THREE.Group()
    const definitions = [
      { value: 1, position: [0, 0, 0.786], rotation: [0, 0, 0] },
      { value: 6, position: [0, 0, -0.786], rotation: [0, Math.PI, 0] },
      { value: 3, position: [0.786, 0, 0], rotation: [0, Math.PI / 2, 0] },
      { value: 4, position: [-0.786, 0, 0], rotation: [0, -Math.PI / 2, 0] },
      { value: 2, position: [0, 0.786, 0], rotation: [-Math.PI / 2, 0, 0] },
      { value: 5, position: [0, -0.786, 0], rotation: [Math.PI / 2, 0, 0] },
    ]
    definitions.forEach(({ value, position, rotation }) => {
      const face = new THREE.Mesh(this.pipGeometry, this.pipMaterials.get(value))
      face.position.set(position[0], position[1], position[2])
      face.rotation.set(rotation[0], rotation[1], rotation[2])
      face.renderOrder = 3
      group.add(face)
    })
    return group
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
