import * as THREE from 'three'
import type { Viewport } from '../../engine/types'

export type TeamLayout = {
  cameraZ: number
  scale: number
  slots: THREE.Vector3[]
}

export function createTeamLayout(viewport: Viewport, verticalFov: number): TeamLayout {
  const cameraZ = viewport.compact ? 10.8 : 10
  const worldHeight = 2 * Math.tan(verticalFov / 2) * cameraZ
  const worldWidth = worldHeight * (viewport.width / viewport.height)

  if (viewport.compact) {
    const visibleStageHeight = Math.max(viewport.height - 520, 500)
    const cardHeightPx = Math.min(visibleStageHeight * 0.34, 188)
    const scale = THREE.MathUtils.clamp((cardHeightPx / viewport.height * worldHeight) / 3.05, 0.42, 0.56)
    const x = Math.min(worldWidth * 0.22, 1.35)
    const spread = (Math.min(viewport.width * 0.38, 158) / viewport.height) * worldHeight
    const centerY = 0
    return { cameraZ, scale, slots: createSlots([[-x, spread + centerY], [x, spread + centerY], [-x, -spread + centerY], [x, -spread + centerY]]) }
  }

  const teamWidthPx = (viewport.width - 118) / 2
  const cardWidthPx = Math.min((teamWidthPx - 66) / 2, 190)
  const scale = THREE.MathUtils.clamp((cardWidthPx / viewport.width * worldWidth) / 2.17, 0.56, 0.9)
  const outerX = worldWidth * 0.355
  const innerX = worldWidth * 0.135
  return { cameraZ, scale, slots: createSlots([[-outerX, 0.18], [-innerX, 0.04], [innerX, 0.04], [outerX, 0.18]]) }
}

function createSlots(coords: number[][]) {
  return coords.map((coord, index) => new THREE.Vector3(coord[0], coord[1], index % 3 === 0 ? -0.08 : 0.08))
}
