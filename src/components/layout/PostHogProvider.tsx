'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect } from 'react'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST
    if (!posthogKey || !posthogHost) return

    const init = () => {
      posthog.init(posthogKey, {
        api_host: posthogHost,
        person_profiles: 'identified_only',
        capture_pageview: false,
        capture_pageleave: true,
      })
    }

    // Defer so PWA first paint and hydration aren't blocked (reduces "recurring problem" on iOS)
    const useIdle = typeof window.requestIdleCallback === 'function'
    const id = useIdle
      ? requestIdleCallback(init, { timeout: 3000 })
      : window.setTimeout(init, 1500)
    return () => {
      if (useIdle && typeof window.cancelIdleCallback === 'function') {
        cancelIdleCallback(id)
      } else {
        clearTimeout(id)
      }
    }
  }, [])

  return <PHProvider client={posthog}>{children}</PHProvider>
}
