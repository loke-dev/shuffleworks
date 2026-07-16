import * as THREE from 'three'
import type { DieSides } from './types'

export type DieFace = {
  center: THREE.Vector3
  normal: THREE.Vector3
  orientation: THREE.Quaternion
}

type FaceAccumulator = {
  center: THREE.Vector3
  normal: THREE.Vector3
  plane: number
  weight: number
}

const forward = new THREE.Vector3(0, 0, 1)

export function getDieFaces(geometry: THREE.BufferGeometry, sides: DieSides): DieFace[] {
  if (sides === 6) return []
  const position = geometry.getAttribute('position')
  const index = geometry.getIndex()
  const faces: FaceAccumulator[] = []

  for (let offset = 0; offset < (index?.count ?? position.count); offset += 3) {
    const a = vertexAt(position, index?.getX(offset) ?? offset)
    const b = vertexAt(position, index?.getX(offset + 1) ?? offset + 1)
    const c = vertexAt(position, index?.getX(offset + 2) ?? offset + 2)
    const cross = new THREE.Vector3().crossVectors(b.clone().sub(a), c.clone().sub(a))
    const area = cross.length() * 0.5
    if (area < 0.00001) continue
    const normal = cross.normalize()
    const center = a.clone().add(b).add(c).multiplyScalar(1 / 3)
    if (normal.dot(center) < 0) normal.negate()
    const plane = normal.dot(center)
    const existing = faces.find((face) => face.normal.dot(normal) > 0.9999 && Math.abs(face.plane - plane) < 0.002)
    if (existing) {
      existing.center.addScaledVector(center, area)
      existing.weight += area
    } else {
      faces.push({ center: center.multiplyScalar(area), normal, plane, weight: area })
    }
  }

  return faces
    .map((face) => {
      const normal = face.normal.clone()
      return {
        center: face.center.multiplyScalar(1 / face.weight),
        normal,
        orientation: new THREE.Quaternion().setFromUnitVectors(forward, normal),
      }
    })
    .sort((a, b) => b.normal.y - a.normal.y || b.normal.z - a.normal.z || b.normal.x - a.normal.x)
    .slice(0, sides)
}

function vertexAt(position: THREE.BufferAttribute | THREE.InterleavedBufferAttribute, index: number) {
  return new THREE.Vector3(position.getX(index), position.getY(index), position.getZ(index))
}
