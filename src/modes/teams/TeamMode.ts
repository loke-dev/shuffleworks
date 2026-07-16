import * as THREE from 'three'
import { ResourceStore } from '../../engine/resources'
import type { ModeContext, ShuffleMode, ShuffleResult, Viewport } from '../../engine/types'
import type { AppShell } from '../../shell/types'
import { CardFactory, type TeamCard } from './cardFactory'
import { createCardAnimation, easeOutCubic, smoothstep } from './choreography'
import { teamPalette } from './data'
import { createTeamLayout } from './layout'

export class TeamMode implements ShuffleMode {
  readonly id = 'teams'
  private context!: ModeContext
  private root = new THREE.Group()
  private cards: TeamCard[] = []
  private order = [...teamPalette]
  private viewport!: Viewport
  private slots: THREE.Vector3[] = []
  private scale = 1
  private elapsed = 0
  private shuffleResolve: ((result: ShuffleResult) => void) | null = null
  private halo!: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>
  private haloEnergy = 0
  private baseCameraZ = 10
  private resources = new ResourceStore()

  constructor(_shell: AppShell) {}

  async mount(context: ModeContext) {
    this.context = context
    context.scene.add(this.root)
    this.addLighting()
    this.createBackdrop()

    const cardFactory = new CardFactory(context.renderer, this.resources)
    this.cards = teamPalette.map((data, index) => cardFactory.create(data, index))
    this.cards.forEach((card) => this.root.add(card.object))
    this.createHalo()
    this.resize(context.viewport)

    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
  }

  resize(viewport: Viewport) {
    this.viewport = viewport
    const layout = createTeamLayout(viewport, THREE.MathUtils.degToRad(this.context.camera.fov))
    this.baseCameraZ = layout.cameraZ
    this.scale = layout.scale
    this.slots = layout.slots
    this.context.camera.position.z = this.baseCameraZ

    this.order.forEach((item, index) => {
      this.cards.find((card) => card.data.id === item.id)?.target.copy(this.slots[index])
    })
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
      card.animation = createCardAnimation(
        card.object.position.clone(), card.target, card.object.rotation, index, this.cards.length, this.elapsed,
      )
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
          const progress = smoothstep(linear)
          const lift = Math.sin(linear * Math.PI) ** 2
          energy = Math.max(energy, lift)
          card.object.position.copy(animation.curve.getPoint(progress))
          card.object.position.z += lift * 0.82
          card.object.rotation.x = THREE.MathUtils.lerp(animation.startRotation.x, card.homeRotation.x, progress)
            + Math.sin(linear * Math.PI * 2) * lift * 0.34
          card.object.rotation.y = THREE.MathUtils.lerp(animation.startRotation.y, 0, progress)
            + easeOutCubic(linear) * Math.PI * 2 * animation.turns
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

      const idle = smoothstep((elapsed - card.settledAt) / 0.65)
      card.object.position.y = card.target.y + Math.sin(elapsed * 0.72 + card.floatSeed) * 0.045 * idle
      card.object.rotation.x = card.homeRotation.x + Math.sin(elapsed * 0.5 + card.floatSeed) * 0.014 * idle
      card.object.rotation.z = card.homeRotation.z + Math.cos(elapsed * 0.42 + card.floatSeed) * 0.009 * idle
    })

    this.updateStage(elapsed, energy)
    if (active === 0 && this.shuffleResolve) {
      const resolve = this.shuffleResolve
      this.shuffleResolve = null
      resolve(this.result())
    }
  }

  reset() {
    this.order = [...teamPalette]
    this.resize(this.viewport)
  }

  dispose() {
    this.context.scene.remove(this.root)
    this.resources.dispose()
  }

  private addLighting() {
    this.root.add(new THREE.HemisphereLight(0xe5edff, 0x100b1e, 2.25))
    const key = new THREE.DirectionalLight(0xffffff, 3.6)
    key.position.set(-1, 5, 6)
    this.root.add(key)
    const violet = new THREE.PointLight(0x9b5cff, 31, 16, 2)
    violet.position.set(-5, 1, 4)
    const cyan = new THREE.PointLight(0x40b8ff, 28, 15, 2)
    cyan.position.set(5, 1, 4)
    this.root.add(violet, cyan)
  }

  private updateStage(elapsed: number, energy: number) {
    this.haloEnergy += (energy - this.haloEnergy) * 0.13
    this.context.camera.position.z = this.baseCameraZ - this.haloEnergy * 0.2
    this.context.camera.position.y = this.haloEnergy * 0.05
    this.context.camera.lookAt(0, this.haloEnergy * 0.035, 0)
    this.root.rotation.z = Math.sin(elapsed * 5) * this.haloEnergy * 0.018
    this.halo.material.opacity = this.haloEnergy * 0.4
    this.halo.rotation.z = elapsed * 0.55
    this.halo.scale.setScalar(0.8 + this.haloEnergy * 1.3)
  }

  private createBackdrop() {
    const count = this.context.viewport.compact ? 56 : 96
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    for (let index = 0; index < count; index += 1) {
      positions[index * 3] = (Math.random() - 0.5) * 17
      positions[index * 3 + 1] = (Math.random() - 0.5) * 10
      positions[index * 3 + 2] = -1 - Math.random() * 5
      const color = new THREE.Color(teamPalette[index % teamPalette.length].color)
      colors[index * 3] = color.r
      colors[index * 3 + 1] = color.g
      colors[index * 3 + 2] = color.b
    }
    const geometry = this.resources.add(new THREE.BufferGeometry())
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    const material = this.resources.add(new THREE.PointsMaterial({
      size: 0.03, vertexColors: true, transparent: true, opacity: 0.45,
    }))
    this.root.add(new THREE.Points(geometry, material))
  }

  private createHalo() {
    const geometry = this.resources.add(new THREE.RingGeometry(0.9, 0.98, 72))
    const material = this.resources.add(new THREE.MeshBasicMaterial({
      color: 0xded7ff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    }))
    this.halo = new THREE.Mesh(geometry, material)
    this.halo.position.z = -0.4
    this.root.add(this.halo)
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
}
