import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import type { ModeContext, ShuffleItem, ShuffleMode, ShuffleResult, Viewport } from '../../engine/types'
import type { AppShell } from '../../shell/types'

type Card = {
  data: ShuffleItem & { symbol: string }
  object: THREE.Group
  target: THREE.Vector3
  homeRotation: THREE.Euler
  floatSeed: number
  settledAt: number
  animation?: {
    curve: THREE.CatmullRomCurve3
    startedAt: number
    delay: number
    duration: number
    turns: number
    startRotation: THREE.Euler
  }
}

const palette: Array<ShuffleItem & { symbol: string }> = [
  { id: 'yellow', label: 'Yellow', symbol: '△', color: '#ffd84f' },
  { id: 'purple', label: 'Purple', symbol: '□', color: '#a974ff' },
  { id: 'blue', label: 'Blue', symbol: '×', color: '#38a0ff' },
  { id: 'red', label: 'Red', symbol: '○', color: '#ff625b' },
]

export class TeamMode implements ShuffleMode {
  readonly id = 'teams'
  private context!: ModeContext
  private root = new THREE.Group()
  private cards: Card[] = []
  private order = [...palette]
  private viewport!: Viewport
  private slots: THREE.Vector3[] = []
  private scale = 1
  private elapsed = 0
  private shuffleResolve: ((result: ShuffleResult) => void) | null = null
  private halo!: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>
  private haloEnergy = 0
  private baseCameraZ = 10
  private resources: Array<{ dispose: () => void }> = []

  constructor(_shell: AppShell) {}

  async mount(context: ModeContext) {
    this.context = context
    context.scene.add(this.root)
    context.scene.add(new THREE.HemisphereLight(0xe5edff, 0x100b1e, 2.5))

    const key = new THREE.DirectionalLight(0xffffff, 4.2)
    key.position.set(-1, 5, 6)
    key.castShadow = true
    context.scene.add(key)

    const violet = new THREE.PointLight(0x9b5cff, 35, 16, 2)
    violet.position.set(-5, 1, 4)
    context.scene.add(violet)
    const cyan = new THREE.PointLight(0x40b8ff, 30, 15, 2)
    cyan.position.set(5, 1, 4)
    context.scene.add(cyan)

    this.createBackdrop()
    this.cards = palette.map((data, index) => this.createCard(data, index))
    this.createHalo()
    this.resize(context.viewport)

    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
  }

  resize(viewport: Viewport) {
    this.viewport = viewport
    const verticalFov = THREE.MathUtils.degToRad(this.context.camera.fov)
    this.baseCameraZ = viewport.compact ? 10.8 : 10
    this.context.camera.position.z = this.baseCameraZ
    const worldHeight = 2 * Math.tan(verticalFov / 2) * this.baseCameraZ
    const worldWidth = worldHeight * this.context.camera.aspect

    if (viewport.compact) {
      const zoneHeightPx = (viewport.height - 100) / 2
      const cardHeightPx = Math.min(zoneHeightPx - 66, 198)
      this.scale = THREE.MathUtils.clamp((cardHeightPx / viewport.height * worldHeight) / 3.05, 0.42, 0.54)
      const x = Math.min(worldWidth * 0.22, 1.42)
      // Keep the resting teams tied to the visible stage, not the taller
      // bleed canvas used for foreground animation.
      const y = (Math.min(viewport.width * 0.42, 176) / viewport.height) * worldHeight
      this.setSlots([[-x, y], [x, y], [-x, -y], [x, -y]])
    } else {
      const teamWidthPx = (viewport.width - 118) / 2
      const cardWidthPx = Math.min((teamWidthPx - 66) / 2, 190)
      this.scale = THREE.MathUtils.clamp((cardWidthPx / viewport.width * worldWidth) / 2.17, 0.56, 0.92)
      const outerX = worldWidth * 0.355
      const innerX = worldWidth * 0.135
      this.setSlots([[-outerX, -0.72], [-innerX, -0.86], [innerX, -0.86], [outerX, -0.72]])
    }

    this.cards.forEach((card) => {
      if (!card.animation) {
        card.object.position.copy(card.target)
        card.object.scale.setScalar(this.scale)
      }
    })
  }

  shuffle(): Promise<ShuffleResult> {
    if (this.shuffleResolve) return Promise.reject(new Error('Shuffle already running'))
    this.order = this.nextOrder()
    const targetById = new Map(this.order.map((item, index) => [item.id, this.slots[index].clone()]))

    this.cards.forEach((card, index) => {
      card.target.copy(targetById.get(card.data.id)!)
      const side = index % 2 === 0 ? -1 : 1
      const lane = index < 2 ? 1 : -1
      const start = card.object.position.clone()
      const gather = new THREE.Vector3(side * 0.32, 0.28, 1)
      const orbit = new THREE.Vector3(
        -side * ((this.viewport.compact ? 1.55 : 2.15) + index * 0.1),
        lane * (this.viewport.compact ? 1.65 : 1.6),
        1.35,
      )
      const apex = new THREE.Vector3(side * 0.75, 1.75 - index * 0.1, 1.55)
      const settle = card.target.clone().lerp(new THREE.Vector3(0, 0.28, 0.7), 0.16)
      card.animation = {
        curve: new THREE.CatmullRomCurve3([start, gather, orbit, apex, settle, card.target.clone()], false, 'centripetal'),
        startedAt: this.elapsed,
        delay: index * 0.075,
        duration: 2.15,
        turns: index % 2 === 0 ? 1 : 2,
        startRotation: card.object.rotation.clone(),
      }
    })

    return new Promise<ShuffleResult>((resolve) => { this.shuffleResolve = resolve })
  }

  update(elapsed: number) {
    this.elapsed = elapsed
    let active = 0
    let energy = 0

    this.cards.forEach((card) => {
      const animation = card.animation
      if (animation) {
        const raw = (elapsed - animation.startedAt - animation.delay) / animation.duration
        if (raw < 0) {
          active += 1
          return
        }
        if (raw < 1) {
          active += 1
          const linear = THREE.MathUtils.clamp(raw, 0, 1)
          const progress = this.easeInOutQuint(linear)
          const lift = Math.sin(linear * Math.PI) ** 2
          energy = Math.max(energy, lift)
          card.object.position.copy(animation.curve.getPoint(progress))
          card.object.position.z += lift * 1.35
          card.object.rotation.x = THREE.MathUtils.lerp(animation.startRotation.x, card.homeRotation.x, progress)
            + Math.sin(linear * Math.PI * 2) * lift * 0.34
          card.object.rotation.y = THREE.MathUtils.lerp(animation.startRotation.y, 0, progress)
            + this.easeOutCubic(linear) * Math.PI * 2 * animation.turns
          card.object.rotation.z = THREE.MathUtils.lerp(animation.startRotation.z, card.homeRotation.z, progress)
            + Math.sin(linear * Math.PI * 3) * lift * 0.24
          card.object.scale.setScalar(this.scale * (1 + lift * 0.06))
          return
        }
        card.object.position.copy(card.target)
        card.object.rotation.copy(card.homeRotation)
        card.object.scale.setScalar(this.scale)
        card.animation = undefined
        card.settledAt = elapsed
      }

      const idle = this.smoothstep((elapsed - card.settledAt) / 0.65)
      card.object.position.y = card.target.y + Math.sin(elapsed * 0.72 + card.floatSeed) * 0.045 * idle
      card.object.rotation.x = card.homeRotation.x + Math.sin(elapsed * 0.5 + card.floatSeed) * 0.014 * idle
      card.object.rotation.z = card.homeRotation.z + Math.cos(elapsed * 0.42 + card.floatSeed) * 0.009 * idle
    })

    this.haloEnergy += (energy - this.haloEnergy) * 0.13
    this.context.camera.position.z = this.baseCameraZ - this.haloEnergy * 0.35
    this.context.camera.position.y = this.haloEnergy * 0.1
    this.context.camera.lookAt(0, this.haloEnergy * 0.07, 0)
    this.root.rotation.z = Math.sin(elapsed * 5) * this.haloEnergy * 0.018
    this.halo.material.opacity = this.haloEnergy * 0.4
    this.halo.rotation.z = elapsed * 0.55
    this.halo.scale.setScalar(0.8 + this.haloEnergy * 1.3)

    if (active === 0 && this.shuffleResolve) {
      const resolve = this.shuffleResolve
      this.shuffleResolve = null
      resolve(this.result())
    }
  }

  reset() {
    this.order = [...palette]
    this.resize(this.viewport)
  }

  dispose() {
    this.context.scene.remove(this.root)
    this.resources.forEach((resource) => resource.dispose())
    this.resources = []
  }

  private createCard(data: ShuffleItem & { symbol: string }, index: number): Card {
    const object = new THREE.Group()
    const geometry = new RoundedBoxGeometry(2.05, 3.05, 0.18, 8, 0.15)
    const material = new THREE.MeshPhysicalMaterial({
      color: data.color,
      roughness: 0.13,
      metalness: 0.03,
      transmission: 0.48,
      thickness: 1.15,
      ior: 1.42,
      transparent: true,
      opacity: 0.93,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      iridescence: 0.22,
      iridescenceIOR: 1.6,
    })
    const body = new THREE.Mesh(geometry, material)
    body.castShadow = true
    body.receiveShadow = true
    object.add(body)

    const faceGeometry = new THREE.PlaneGeometry(1.82, 2.82)
    const faceMaterial = new THREE.MeshBasicMaterial({
      map: this.makeTexture(data), transparent: true, opacity: 0.86, depthWrite: false,
    })
    const face = new THREE.Mesh(faceGeometry, faceMaterial)
    face.position.z = 0.098
    object.add(face)

    const edgeGeometry = new THREE.EdgesGeometry(geometry, 24)
    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.34 })
    object.add(new THREE.LineSegments(edgeGeometry, edgeMaterial))

    const glow = new THREE.PointLight(data.color, 1.5, 4.8, 2.2)
    glow.position.z = -0.4
    object.add(glow)

    object.rotation.set(index % 2 ? -0.025 : 0.025, 0, (index - 1.5) * 0.04)
    this.root.add(object)
    this.resources.push(geometry, material, faceGeometry, faceMaterial, edgeGeometry, edgeMaterial)

    return {
      data,
      object,
      target: new THREE.Vector3(),
      homeRotation: object.rotation.clone(),
      floatSeed: index * 1.37,
      settledAt: 0,
    }
  }

  private makeTexture(data: ShuffleItem & { symbol: string }) {
    const surface = document.createElement('canvas')
    surface.width = 512
    surface.height = 768
    const ctx = surface.getContext('2d')!
    const sheen = ctx.createLinearGradient(0, 0, 512, 768)
    sheen.addColorStop(0, 'rgba(255,255,255,.66)')
    sheen.addColorStop(0.26, 'rgba(255,255,255,.06)')
    sheen.addColorStop(0.72, 'rgba(255,255,255,.15)')
    sheen.addColorStop(1, 'rgba(255,255,255,.46)')
    ctx.fillStyle = sheen
    ctx.fillRect(0, 0, 512, 768)
    ctx.strokeStyle = 'rgba(255,255,255,.56)'
    ctx.lineWidth = 4
    ctx.strokeRect(34, 34, 444, 700)
    ctx.fillStyle = 'rgba(255,255,255,.92)'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = '300 225px Arial'
    ctx.fillText(data.symbol, 256, 330)
    ctx.font = '600 27px Arial'
    ctx.fillText(data.label.toUpperCase(), 256, 646)
    ctx.font = '500 17px Arial'
    ctx.fillStyle = 'rgba(255,255,255,.68)'
    ctx.fillText('SHUFFLEWORKS / SPECTRUM 01', 256, 690)
    const texture = new THREE.CanvasTexture(surface)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = Math.min(this.context.renderer.capabilities.getMaxAnisotropy(), 8)
    this.resources.push(texture)
    return texture
  }

  private createBackdrop() {
    const count = this.context.viewport.compact ? 72 : 130
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    palette.forEach(() => undefined)
    for (let index = 0; index < count; index += 1) {
      positions[index * 3] = (Math.random() - 0.5) * 17
      positions[index * 3 + 1] = (Math.random() - 0.5) * 10
      positions[index * 3 + 2] = -1 - Math.random() * 5
      const color = new THREE.Color(palette[index % palette.length].color)
      colors[index * 3] = color.r
      colors[index * 3 + 1] = color.g
      colors[index * 3 + 2] = color.b
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    const material = new THREE.PointsMaterial({ size: 0.03, vertexColors: true, transparent: true, opacity: 0.5 })
    this.root.add(new THREE.Points(geometry, material))
    this.resources.push(geometry, material)
  }

  private createHalo() {
    const geometry = new THREE.RingGeometry(0.9, 0.98, 96)
    const material = new THREE.MeshBasicMaterial({
      color: 0xded7ff, transparent: true, opacity: 0, depthWrite: false,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    })
    this.halo = new THREE.Mesh(geometry, material)
    this.halo.position.z = -0.4
    this.context.scene.add(this.halo)
    this.resources.push(geometry, material)
  }

  private setSlots(coords: number[][]) {
    this.slots = coords.map((coord, index) => new THREE.Vector3(
      coord[0], coord[1], index % 3 === 0 ? -0.08 : 0.08,
    ))
    this.order.forEach((item, index) => {
      const card = this.cards.find((candidate) => candidate.data.id === item.id)
      if (card) card.target.copy(this.slots[index])
    })
  }

  private nextOrder() {
    const next = [...this.order]
    for (let index = next.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(Math.random() * (index + 1))
      ;[next[index], next[swap]] = [next[swap], next[index]]
    }
    if (next.every((item, index) => item.id === this.order[index].id)) next.push(next.shift()!)
    return next
  }

  private result(): ShuffleResult {
    const groups = [
      { label: 'Team one', items: this.order.slice(0, 2) },
      { label: 'Team two', items: this.order.slice(2, 4) },
    ]
    return {
      groups,
      announcement: groups.map((group) => `${group.label}: ${group.items.map((item) => item.label).join(' and ')}`).join('. '),
    }
  }

  private easeInOutQuint(value: number) {
    return value < 0.5 ? 16 * value ** 5 : 1 - (-2 * value + 2) ** 5 / 2
  }

  private easeOutCubic(value: number) {
    return 1 - (1 - value) ** 3
  }

  private smoothstep(value: number) {
    const clamped = THREE.MathUtils.clamp(value, 0, 1)
    return clamped * clamped * (3 - 2 * clamped)
  }
}
