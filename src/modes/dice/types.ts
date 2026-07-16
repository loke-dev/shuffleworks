export const dieTypes = [4, 6, 8, 10, 12, 20] as const
export type DieSides = typeof dieTypes[number]
export type FaceStyle = 'classic' | 'numbers'

export type DiceOptions = {
  count: number
  sides: DieSides
  faceStyle: FaceStyle
}
