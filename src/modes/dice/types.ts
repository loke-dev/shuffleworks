export const dieTypes = [4, 6, 8, 10, 12, 20] as const
export type DieSides = typeof dieTypes[number]

export type DiceOptions = {
  count: number
  sides: DieSides
}
