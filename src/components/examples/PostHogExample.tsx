// Exemple d'utilisation de PostHog dans vos composants

'use client'

import { usePostHog } from 'posthog-js/react'

export function ExampleComponent() {
  const posthog = usePostHog()

  const handleButtonClick = () => {
    // Capturer un événement personnalisé
    posthog?.capture('button_clicked', {
      button_name: 'example_button',
      page: 'home',
    })
  }

  const identifyUser = (userId: string, email: string) => {
    // Identifier un utilisateur
    posthog?.identify(userId, {
      email: email,
      // Ajoutez d'autres propriétés utilisateur ici
    })
  }

  const trackExperiment = () => {
    // Suivre une expérience
    posthog?.capture('experiment_started', {
      experiment_name: 'my_experiment',
      timestamp: new Date().toISOString(),
    })
  }

  return (
    <div>
      <button onClick={handleButtonClick}>
        Cliquez-moi (événement tracké)
      </button>
    </div>
  )
}

// Exemples d'autres cas d'usage:

// 1. Capturer un événement simple
// posthog.capture('event_name')

// 2. Capturer un événement avec des propriétés
// posthog.capture('experiment_completed', {
//   experiment_id: '123',
//   success: true,
//   duration: 1500
// })

// 3. Identifier un utilisateur
// posthog.identify('user_123', {
//   email: 'user@example.com',
//   name: 'John Doe'
// })

// 4. Feature flags
// const isFeatureEnabled = posthog.isFeatureEnabled('new_feature')

// 5. Reset (lors de la déconnexion)
// posthog.reset()
