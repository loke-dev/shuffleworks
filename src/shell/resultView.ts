import type { ShuffleResult } from '../engine/types'

export function renderResultMarkup(result: ShuffleResult) {
  return result.groups.map((group, index) => `
    <article>
      <header><span>0${index + 1}</span><p>${group.label}</p></header>
      <ul>${group.items.map((item) => `
        <li><i style="--item-color:${item.color}"></i><b>${item.label}</b></li>`).join('')}
      </ul>
    </article>`).join('')
}
