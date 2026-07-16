import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import type { DieSides } from './types'

export function createDieGeometry(sides: DieSides): THREE.BufferGeometry {
  if (sides === 4) return smooth(new THREE.TetrahedronGeometry(1.2, 2))
  if (sides === 6) return new RoundedBoxGeometry(1.55, 1.55, 1.55, 4, 0.18)
  if (sides === 8) return smooth(new THREE.OctahedronGeometry(1.28, 2))
  if (sides === 10) {
    const profile = [
      new THREE.Vector2(0.04, -0.9),
      new THREE.Vector2(0.68, -0.78),
      new THREE.Vector2(0.88, -0.53),
      new THREE.Vector2(0.88, 0.53),
      new THREE.Vector2(0.68, 0.78),
      new THREE.Vector2(0.04, 0.9),
    ]
    const geometry = new THREE.LatheGeometry(profile, 10)
    geometry.rotateZ(Math.PI / 2)
    return smooth(geometry)
  }
  if (sides === 12) return smooth(new THREE.DodecahedronGeometry(1.18, 2))
  return smooth(new THREE.IcosahedronGeometry(1.22, 2))
}

function smooth<T extends THREE.BufferGeometry>(geometry: T) {
  geometry.computeVertexNormals()
  return geometry
}
