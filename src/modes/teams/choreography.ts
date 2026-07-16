import * as THREE from 'three'

export type CardAnimation = {
  curve: THREE.CatmullRomCurve3
  startedAt: number
  delay: number
  duration: number
  turns: number
  startRotation: THREE.Euler
}

export function createCardAnimation(
  start: THREE.Vector3,
  target: THREE.Vector3,
  startRotation: THREE.Euler,
  index: number,
  count: number,
  startedAt: number,
): CardAnimation {
  const fan = index - (count - 1) / 2
  const gather = new THREE.Vector3(fan * 0.05, fan * 0.025, 0.72 + index * 0.045)
  const orbit = new THREE.Vector3(fan * 0.13, 0.28 + Math.abs(fan) * 0.025, 1 + index * 0.045)
  const apex = new THREE.Vector3(fan * 0.19, 0.58 - Math.abs(fan) * 0.03, 1.16 + index * 0.04)
  const settle = target.clone().lerp(new THREE.Vector3(0, 0.28, 0.7), 0.16)

  return {
    curve: new THREE.CatmullRomCurve3([start, gather, orbit, apex, settle, target.clone()], false, 'centripetal'),
    startedAt,
    delay: index * 0.025,
    duration: 2.3,
    turns: 1,
    startRotation: startRotation.clone(),
  }
}

export function smoothstep(value: number) {
  const clamped = THREE.MathUtils.clamp(value, 0, 1)
  return clamped * clamped * (3 - 2 * clamped)
}

export function easeOutCubic(value: number) {
  return 1 - (1 - value) ** 3
}
