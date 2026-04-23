import { useEffect } from 'react'

// Plaid's link-initialize.js injects a full-screen iframe via inline JavaScript styles.
// CSS !important is not reliable enough because Plaid re-applies styles after injection.
// MutationObserver + setProperty('...', 'important') is the only guaranteed override.

function applyIframeStyles(iframe: HTMLElement) {
  iframe.style.setProperty('position', 'relative', 'important')
  iframe.style.setProperty('top', 'auto', 'important')
  iframe.style.setProperty('left', 'auto', 'important')
  iframe.style.setProperty('width', 'min(460px, calc(100vw - 24px))', 'important')
  iframe.style.setProperty('height', 'min(720px, calc(100dvh - 48px))', 'important')
  iframe.style.setProperty('border-radius', '16px', 'important')
  iframe.style.setProperty('box-shadow', '0 24px 64px rgba(0,0,0,0.55)', 'important')
  iframe.style.setProperty('border', 'none', 'important')
}

function applyContainerStyles(container: HTMLElement) {
  container.style.setProperty('display', 'flex', 'important')
  container.style.setProperty('align-items', 'center', 'important')
  container.style.setProperty('justify-content', 'center', 'important')
  container.style.setProperty('background', 'rgba(0,0,0,0.6)', 'important')
  container.style.setProperty('backdrop-filter', 'blur(6px)', 'important')
  container.style.setProperty('-webkit-backdrop-filter', 'blur(6px)', 'important')
}

export function usePlaidModalConstraint() {
  useEffect(() => {
    // Watch body for Plaid's container being added
    const bodyObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement)) continue
          if (node.id !== 'plaid-link-iframe-container') continue

          applyContainerStyles(node)

          const existing = node.querySelector('iframe')
          if (existing instanceof HTMLElement) {
            applyIframeStyles(existing)
          } else {
            // Iframe added slightly after the container — watch for it
            const containerObserver = new MutationObserver(() => {
              const iframe = node.querySelector('iframe')
              if (iframe instanceof HTMLElement) {
                applyIframeStyles(iframe)
                containerObserver.disconnect()
              }
            })
            containerObserver.observe(node, { childList: true, subtree: true })
          }
        }
      }
    })

    bodyObserver.observe(document.body, { childList: true })
    return () => bodyObserver.disconnect()
  }, [])
}
