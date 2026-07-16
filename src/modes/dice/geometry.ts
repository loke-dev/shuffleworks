import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import type { DieSides } from './types'

export function createDieGeometry(sides: DieSides): THREE.BufferGeometry {
  if (sides === 4) return new THREE.TetrahedronGeometry(1.2, 0)
  if (sides === 6) return new RoundedBoxGeometry(1.55, 1.55, 1.55, 4, 0.18)
  if (sides === 8) return new THREE.OctahedronGeometry(1.28, 0)
  if (sides === 10) return createD10Geometry()
  if (sides === 12) return new THREE.DodecahedronGeometry(1.18, 0)
  return new THREE.IcosahedronGeometry(1.22, 0)
}

function createD10Geometry() {
  const radius = 0.88
  const belt = 0.1
  const height = belt * (1 + Math.cos(Math.PI / 5)) / (1 - Math.cos(Math.PI / 5))
  const beltVertices = Array.from({ length: 10 }, (_, index) => {
    const angle = index * Math.PI / 5
    return new THREE.Vector3(Math.cos(angle) * radius, index % 2 ? belt : -belt, Math.sin(angle) * radius)
  })
  const top = new THREE.Vector3(0, height, 0)
  const bottom = new THREE.Vector3(0, -height, 0)
  const positions: number[] = []

  for (let index = 0; index < 10; index += 1) {
    const apex = index % 2 === 0 ? top : bottom
    const previous = beltVertices[(index + 9) % 10]
    const center = beltVertices[index]
    const next = beltVertices[(index + 1) % 10]
    addTriangle(positions, apex, previous, center)
    addTriangle(positions, apex, center, next)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.computeVertexNormals()
  return geometry
}

function addTriangle(positions: number[], a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) {
  const normal = new THREE.Vector3().crossVectors(b.clone().sub(a), c.clone().sub(a))
  const center = a.clone().add(b).add(c).multiplyScalar(1 / 3)
  const vertices = normal.dot(center) >= 0 ? [a, b, c] : [a, c, b]
  vertices.forEach((vertex) => positions.push(vertex.x, vertex.y, vertex.z))
}
