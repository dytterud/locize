/* global Element */
import { debugLog } from './utils.js'

// A shadow root is a boundary for DOM traversal AND for mutation records: the
// MutationObserver on `document.body` never reports anything that happens
// inside one, not even with `subtree: true`. To support pages whose content
// lives in a shadow root, every shadow root has to be observed explicitly -
// the ones that exist when the editor starts, plus the ones created later,
// which is the common case: the editor script usually runs before the
// content is rendered into its shadow root.
//
// All of this is opt-in via the `shadowDOM` option: it widens what the editor
// touches (it walks into shadow roots and hooks `Element.prototype.attachShadow`),
// which is unnecessary for the vast majority of pages. With the option off,
// every code path guarded by `isShadowDOMEnabled()` behaves exactly as before.
const HOOK_FLAG = '__locizeAttachShadowHooked'

// every observer that asked to be notified about new shadow roots - normally
// exactly one, but `start()` may run more than once on a page
const observers = []

let enabled = false

export function setShadowDOMEnabled (value) {
  enabled = !!value
}

export function isShadowDOMEnabled () {
  return enabled
}

// A node inside a shadow root is not reachable via `document.body.contains()`,
// so with shadow DOM support on, connectivity has to be checked with
// `isConnected` - which also holds across a shadow boundary. Kept as-is when
// the option is off, to not change eviction behaviour for existing setups.
export function isNodeStillInDocument (node) {
  if (!node) return false
  return enabled ? !!node.isConnected : document.body.contains(node)
}

function eachShadowRoot (root, fn) {
  let elements

  try {
    elements = root.querySelectorAll('*')
  } catch (err) {
    debugLog('could not query for shadow roots in', root, err)
    return
  }

  for (let i = 0; i < elements.length; i++) {
    const shadowRoot = elements[i].shadowRoot
    if (!shadowRoot) continue

    fn(shadowRoot)
    eachShadowRoot(shadowRoot, fn) // shadow roots can be nested
  }
}

function notify (shadowRoot) {
  observers.forEach(observer => {
    try {
      observer.observeRoot(shadowRoot)
    } catch (err) {
      debugLog('failed to observe shadow root', shadowRoot, err)
    }
  })
}

function hookAttachShadow () {
  if (typeof Element === 'undefined') return
  if (!Element.prototype || !Element.prototype.attachShadow) return
  if (Element.prototype[HOOK_FLAG]) return

  const nativeAttachShadow = Element.prototype.attachShadow

  Element.prototype.attachShadow = function attachShadow () {
    const shadowRoot = nativeAttachShadow.apply(this, arguments)
    notify(shadowRoot)
    return shadowRoot
  }

  Object.defineProperty(Element.prototype, HOOK_FLAG, {
    value: true,
    enumerable: false,
    configurable: true
  })
}

export function observeShadowRoots (observer) {
  if (!enabled) return
  if (typeof document === 'undefined') return
  if (observers.indexOf(observer) < 0) observers.push(observer)

  eachShadowRoot(document, notify)
  hookAttachShadow()
}
