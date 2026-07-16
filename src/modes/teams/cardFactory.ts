import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import type { ResourceStore } from '../../engine/resources'
import type { CardAnimation } from './choreography'
import type { TeamCardData } from './data'

export type TeamCard = {
  data: TeamCardData
  object: THREE.Group
  target: THREE.Vector3
  homeRotation: THREE.Euler
  floatSeed: number
  settledAt: number
  animation?: CardAnimation
}

export class CardFactory {
  private bodyGeometry: RoundedBoxGeometry
  private faceGeometry: THREE.PlaneGeometry
  private edgeGeometry: THREE.EdgesGeometry
  private edgeMaterial: THREE.LineBasicMaterial
  private renderer: THREE.WebGLRenderer
  private resources: ResourceStore

  constructor(renderer: THREE.WebGLRenderer, resources: ResourceStore) {
    this.renderer = renderer
    this.resources = resources
    this.bodyGeometry = resources.add(new RoundedBoxGeometry(2.05, 3.05, 0.18, 6, 0.15))
    this.faceGeometry = resources.add(new THREE.PlaneGeometry(1.82, 2.82))
    this.edgeGeometry = resources.add(new THREE.EdgesGeometry(this.bodyGeometry, 24))
    this.edgeMaterial = resources.add(new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.3,
    }))
  }

  create(data: TeamCardData, index: number): TeamCard {
    const object = new THREE.Group()
    const material = this.resources.add(new THREE.MeshPhysicalMaterial({
      color: data.color,
      roughness: 0.15,
      metalness: 0.03,
      transmission: 0.44,
      thickness: 1,
      ior: 1.42,
      transparent: true,
      opacity: 0.94,
      clearcoat: 1,
      clearcoatRoughness: 0.09,
      iridescence: 0.18,
      iridescenceIOR: 1.6,
    }))
    object.add(new THREE.Mesh(this.bodyGeometry, material))

    const faceMaterial = this.resources.add(new THREE.MeshBasicMaterial({
      map: this.makeTexture(data),
      transparent: true,
      opacity: 0.86,
      depthWrite: false,
    }))
    const face = new THREE.Mesh(this.faceGeometry, faceMaterial)
    face.position.z = 0.098
    object.add(face, new THREE.LineSegments(this.edgeGeometry, this.edgeMaterial))

    object.rotation.set(index % 2 ? -0.025 : 0.025, 0, (index - 1.5) * 0.04)
    return {
      data,
      object,
      target: new THREE.Vector3(),
      homeRotation: object.rotation.clone(),
      floatSeed: index * 1.37,
      settledAt: 0,
    }
  }

  private makeTexture(data: TeamCardData) {
    const surface = document.createElement('canvas')
    surface.width = 384
    surface.height = 576
    const context = surface.getContext('2d')!
    context.scale(0.75, 0.75)
    const sheen = context.createLinearGradient(0, 0, 512, 768)
    sheen.addColorStop(0, 'rgba(255,255,255,.66)')
    sheen.addColorStop(0.26, 'rgba(255,255,255,.06)')
    sheen.addColorStop(0.72, 'rgba(255,255,255,.15)')
    sheen.addColorStop(1, 'rgba(255,255,255,.46)')
    context.fillStyle = sheen
    context.fillRect(0, 0, 512, 768)
    context.strokeStyle = 'rgba(255,255,255,.56)'
    context.lineWidth = 4
    context.strokeRect(34, 34, 444, 700)
    context.fillStyle = 'rgba(255,255,255,.92)'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.font = '300 225px Arial'
    context.fillText(data.symbol, 256, 330)
    context.font = '600 27px Arial'
    context.fillText(data.label.toUpperCase(), 256, 646)
    context.font = '500 17px Arial'
    context.fillStyle = 'rgba(255,255,255,.68)'
    context.fillText('SHUFFLEWORKS / SPECTRUM 01', 256, 690)

    const texture = this.resources.add(new THREE.CanvasTexture(surface))
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = Math.min(this.renderer.capabilities.getMaxAnisotropy(), 4)
    return texture
  }
}
