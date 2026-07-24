import type { RouteId } from '../router'

const ENDPOINT = 'https://loke.dev/api/events'

type AnalyticsEvent =
  | 'primary_cta_clicked'
  | 'share_completed'
  | 'shuffle_completed'
  | 'tool_completed'

export function trackAnalytics(
  event: AnalyticsEvent,
  placement: string,
  target: string
): void {
  const body = JSON.stringify({
    v: 1,
    event,
    path: window.location.pathname,
    placement,
    target,
  })

  void fetch(ENDPOINT, {
    method: 'POST',
    body,
    headers: { 'Content-Type': 'application/json' },
    keepalive: true,
  }).catch(() => undefined)
}

export function initializeAnalytics(route: RouteId): void {
  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return

    const action = event.target.closest<HTMLElement>(
      '[data-shuffle], [data-spin], [data-flip], [data-throw], [data-draw], [data-open], [data-start], [data-pick], [data-shuffle-names]'
    )
    if (!action || action.hasAttribute('disabled')) return

    trackAnalytics('primary_cta_clicked', 'tool_action', route)
  })
}
