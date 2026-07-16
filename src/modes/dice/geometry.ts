import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import type { DieSides } from './types'

export function createDieGeometry(sides: DieSides): THREE.BufferGeometry {
  if (sides === 4) return new THREE.TetrahedronGeometry(1.2, 0)
  if (sides === 6) return new RoundedBoxGeometry(1.55, 1.55, 1.55, 4, 0.18)
  if (sides === 8) return new THREE.OctahedronGeometry(1.28, 0)
  if (sides === 10) {
    const geometry = new THREE.CylinderGeometry(0.86, 0.86, 1.7, 10, 1, false)
    geometry.rotateZ(Math.PI / 2)
    return geometry
  }
  if (sides === 12) return new THREE.DodecahedronGeometry(1.18, 0)
  return new THREE.IcosahedronGeometry(1.22, 0)
}
