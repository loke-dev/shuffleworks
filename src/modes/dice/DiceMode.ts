import * as THREE from 'three'
import { ResourceStore } from '../../engine/resources'
import type { ModeContext, ShuffleMode, ShuffleResult, Viewport } from '../../engine/types'
import { easeOutCubic, smoothstep } from '../teams/choreography'
import { getDieFaces, type DieFace } from './faces'
import { createDieGeometry } from './geometry'
import { dieTypes, type DiceOptions, type DieSides } from './types'

type Die = {
  group: THREE.Group
  body: THREE.Group
  mesh: THREE.Mesh
  pips: THREE.Group
  d4Dots: THREE.Group
  numberedFaces: Map<DieSides, THREE.Group>
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
  private numberGeometry!: THREE.PlaneGeometry
  private numberMaterials = new Map<string, THREE.MeshBasicMaterial>()
  private faceDefinitions = new Map<DieSides, DieFace[]>()

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

    dieTypes.forEach((sides) => {
      const geometry = this.resources.add(createDieGeometry(sides))
      this.geometries.set(sides, geometry)
      this.faceDefinitions.set(sides, getDieFaces(geometry, sides))
    })
    this.createPipResources()
    this.createNumberResources()
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
        return
      }
      die.group.position.copy(die.target)
      die.group.position.z = 0
      die.body.rotation.copy(die.landingRotation)
    })

    if (active === 0) {
      const resolve = this.resolveRoll
      this.resolveRoll = null
      resolve?.(this.result())
    }
  }

  reset() {
    this.options = { count: 2, sides: 6, faceStyle: this.options.faceStyle }
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
      die.pips.visible = this.options.sides === 6 && this.options.faceStyle === 'classic'
      die.d4Dots.visible = this.options.sides === 4 && this.options.faceStyle === 'classic'
      die.numberedFaces.forEach((faces, sides) => {
        faces.visible = sides === this.options.sides && (this.options.faceStyle === 'numbers' || (sides !== 4 && sides !== 6))
      })
      die.value = Math.min(die.value || index + 1, this.options.sides)
      if (!this.resolveRoll) die.body.rotation.copy(this.getLandingRotation(die.value, index))
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
      const markScale = count >= 4 ? 1.34 : count === 3 ? 1.14 : 1
      die.numberedFaces.forEach((faces) => faces.children.forEach((mark) => mark.scale.setScalar(Number(mark.userData.markSize) * markScale)))
      die.d4Dots.children.forEach((mark) => mark.scale.setScalar(Number(mark.userData.markSize) * markScale))
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
    const pips = this.createPipFaces()
    const d4Dots = this.createD4DotFaces()
    const numberedFaces = new Map<DieSides, THREE.Group>()
    dieTypes.forEach((sides) => {
      const faces = this.createNumberedFaces(sides)
      numberedFaces.set(sides, faces)
      body.add(faces)
    })
    body.add(mesh, pips, d4Dots)
    group.add(body)
    this.root.add(group)
    return {
      group, body, mesh, pips, d4Dots, numberedFaces, target: new THREE.Vector3(), start: new THREE.Vector3(),
      startRotation: new THREE.Euler(), endRotation: new THREE.Euler(), landingRotation: new THREE.Euler(), delay: 0, value: index + 1,
    }
  }

  private getLandingRotation(value: number, index: number) {
    if (this.options.sides !== 6) {
      const face = this.faceDefinitions.get(this.options.sides)?.[value - 1]
      if (!face) return new THREE.Euler()
      const upright = face.orientation.clone().invert()
      const tilt = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), 0.055 * (index % 2 ? 1 : -1))
      return new THREE.Euler().setFromQuaternion(tilt.multiply(upright))
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
      positions[value].forEach(([x, y]) => {
        drawEngravedDot(context, 96 + x * 49, 96 + y * 49, 14)
      })
      const texture = this.resources.add(new THREE.CanvasTexture(canvas))
      texture.colorSpace = THREE.SRGBColorSpace
      this.pipMaterials.set(value, this.resources.add(new THREE.MeshBasicMaterial({
        map: texture, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2,
      })))
    }
  }

  private createNumberResources() {
    this.numberGeometry = this.resources.add(new THREE.PlaneGeometry(1, 1))
    dieTypes.forEach((sides) => {
      for (let value = 1; value <= sides; value += 1) {
        const canvas = document.createElement('canvas')
        canvas.width = 192
        canvas.height = 192
        const context = canvas.getContext('2d')!
        context.font = `600 ${value > 9 ? 92 : 112}px Arial`
        context.textAlign = 'center'
        context.textBaseline = 'middle'
        drawEngravedText(context, String(value), 96, 101)
        if (value === 6 || value === 9) {
          drawEngravedLine(context, 63, 164, 66)
        }
        const texture = this.resources.add(new THREE.CanvasTexture(canvas))
        texture.colorSpace = THREE.SRGBColorSpace
        this.numberMaterials.set(`${sides}:${value}`, this.resources.add(new THREE.MeshBasicMaterial({
          map: texture, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2,
        })))
      }
    })
  }

  private createNumberedFaces(sides: DieSides) {
    const group = new THREE.Group()
    const size = sides === 4 ? 0.54 : sides === 6 ? 0.62 : sides === 8 ? 0.46 : sides === 10 ? 0.42 : sides === 12 ? 0.38 : 0.32
    const faces = sides === 6 ? cubeFaces() : this.faceDefinitions.get(sides) ?? []
    faces.forEach((face, index) => {
      const number = new THREE.Mesh(this.numberGeometry, this.numberMaterials.get(`${sides}:${index + 1}`))
      number.position.copy(face.center).addScaledVector(face.normal, 0.018)
      number.quaternion.copy(face.orientation)
      number.scale.setScalar(size)
      number.userData.markSize = size
      number.renderOrder = 3
      group.add(number)
    })
    group.visible = false
    return group
  }

  private createD4DotFaces() {
    const group = new THREE.Group()
    const size = 0.7
    this.faceDefinitions.get(4)?.forEach((face, index) => {
      const dots = new THREE.Mesh(this.numberGeometry, this.pipMaterials.get(index + 1))
      dots.position.copy(face.center).addScaledVector(face.normal, 0.018)
      dots.quaternion.copy(face.orientation)
      dots.scale.setScalar(size)
      dots.userData.markSize = size
      dots.renderOrder = 3
      group.add(dots)
    })
    group.visible = false
    return group
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

function cubeFaces(): DieFace[] {
  const definitions: Array<[THREE.Vector3, THREE.Vector3]> = [
    [new THREE.Vector3(0, 0, 0.786), new THREE.Vector3(0, 0, 1)],
    [new THREE.Vector3(0, 0.786, 0), new THREE.Vector3(0, 1, 0)],
    [new THREE.Vector3(0.786, 0, 0), new THREE.Vector3(1, 0, 0)],
    [new THREE.Vector3(-0.786, 0, 0), new THREE.Vector3(-1, 0, 0)],
    [new THREE.Vector3(0, -0.786, 0), new THREE.Vector3(0, -1, 0)],
    [new THREE.Vector3(0, 0, -0.786), new THREE.Vector3(0, 0, -1)],
  ]
  return definitions.map(([center, normal]) => ({
    center,
    normal,
    orientation: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal),
  }))
}

function drawEngravedText(context: CanvasRenderingContext2D, text: string, x: number, y: number) {
  context.save()
  context.filter = 'blur(.35px)'
  context.fillStyle = 'rgba(255,255,255,.16)'
  context.fillText(text, x, y + 2)
  context.shadowColor = 'rgba(0,0,0,.28)'
  context.shadowBlur = 4
  context.shadowOffsetY = 1.5
  context.fillStyle = 'rgba(10,13,21,.43)'
  context.fillText(text, x, y)
  context.shadowColor = 'transparent'
  context.restore()
}

function drawEngravedDot(context: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  context.save()
  context.shadowColor = 'rgba(0,0,0,.27)'
  context.shadowBlur = 4
  context.shadowOffsetY = 1.5
  context.beginPath()
  context.arc(x, y, radius, 0, Math.PI * 2)
  const inset = context.createRadialGradient(x, y - 2, radius * 0.15, x, y, radius)
  inset.addColorStop(0, 'rgba(10,13,21,.39)')
  inset.addColorStop(0.68, 'rgba(10,13,21,.43)')
  inset.addColorStop(1, 'rgba(10,13,21,.22)')
  context.fillStyle = inset
  context.fill()
  context.shadowColor = 'transparent'
  context.beginPath()
  context.arc(x, y, radius - 0.75, 0.15 * Math.PI, 0.85 * Math.PI)
  context.lineWidth = 1.5
  context.strokeStyle = 'rgba(255,255,255,.17)'
  context.stroke()
  context.restore()
}

function drawEngravedLine(context: CanvasRenderingContext2D, x: number, y: number, width: number) {
  context.save()
  context.fillStyle = 'rgba(255,255,255,.16)'
  context.fillRect(x, y + 2, width, 3)
  context.shadowColor = 'rgba(0,0,0,.28)'
  context.shadowBlur = 4
  context.shadowOffsetY = 1.5
  context.fillStyle = 'rgba(10,13,21,.43)'
  context.fillRect(x, y, width, 3)
  context.restore()
}
