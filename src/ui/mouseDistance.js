import { store } from '../store.js'
import { uninstrumentedStore } from '../uninstrumentedStore.js'
import { isInViewport, mouseDistanceFromElement } from './utils.js'
import { debounce } from '../utils.js'
import {
  highlight,
  highlightUninstrumented,
  resetHighlight
} from './highlightNode.js'

// our own overlays: they sit on top of the very node they belong to, so they
// must never count as something covering it
const ownOverlaySelector =
  '.i18next-editor-highlight, .i18next-editor-button-container, .i18next-editor-button'

// Check if a node is visually covered by another element (e.g. modal backdrop)
function isOccluded (node) {
  const rect = node.getBoundingClientRect()
  if (!rect.width || !rect.height) return true

  // Check the center point of the element
  const x = rect.left + rect.width / 2
  const y = rect.top + rect.height / 2
  const topEl = document.elementFromPoint(x, y)
  if (!topEl) return true

  // `data-i18next-editor-element` marks two very different things: our own
  // hover overlays (above), and the editor chrome - popup, its iframe, its drag
  // overlay - which really does cover the page. Treating both as "not
  // occluding" is why keys behind the editor popup stayed highlightable.
  if (topEl.closest && topEl.closest(ownOverlaySelector)) return false
  if (topEl.dataset && topEl.dataset.i18nextEditorElement === 'true') return true

  // The element at point should be the node itself or a descendant/ancestor
  return !node.contains(topEl) && !topEl.contains(node)
}

// A highlight box is positioned in page coordinates when it is created, so an
// item that is off-screen with a box still owns a visible overlay somewhere in
// the document. The viewport check below therefore skips the *highlighting*
// work for such items, but never the reset. A selected key's box is deliberately
// left alone (resetHighlight's default ignoreSelected guard): the selection
// outlives scrolling, only hover highlights are cleared here.
function hasOverlay (item) {
  return !!(item.highlightBox || item.ribbonBox)
}

const debouncedUpdateDistance = debounce(function (e, observer) {
  Object.values(store.data).forEach(item => {
    // if not visible do not calculate distance of mouse - but do clear a
    // highlight it may still be holding, it cannot be under the mouse
    if (!isInViewport(item.node)) {
      if (hasOverlay(item)) resetHighlight(item, item.node, item.keys)
      return
    }
    // if covered by modal/overlay do not highlight
    if (isOccluded(item.node)) { resetHighlight(item, item.node, item.keys); return }

    const distance = mouseDistanceFromElement(e, item.node)
    if (distance < 5) {
      highlight(item, item.node, item.keys)
    } else if (distance > 5) {
      // check if we are over the ribbonbox
      const boxDistance = item.ribbonBox
        ? mouseDistanceFromElement(e, item.ribbonBox)
        : 1000
      if (boxDistance > 10) resetHighlight(item, item.node, item.keys)
    }
  })

  Object.values(uninstrumentedStore.data).forEach(item => {
    // if not visible do not calculate distance of mouse - but do clear a
    // highlight it may still be holding, it cannot be under the mouse
    if (!isInViewport(item.node)) {
      if (hasOverlay(item)) resetHighlight(item, item.node, item.keys)
      return
    }
    // if covered by modal/overlay do not highlight
    if (isOccluded(item.node)) { resetHighlight(item, item.node, item.keys); return }

    const distance = mouseDistanceFromElement(e, item.node)
    if (distance < 10) {
      highlightUninstrumented(item, item.node, item.keys)
    } else if (distance > 10) {
      resetHighlight(item, item.node, item.keys)
    }
  })
}, 50)

let currentFC
let scrollFC
// last known mouse position, in viewport coordinates
let lastClientX = 0
let lastClientY = 0
let hasLastMouse = false

export function startMouseTracking (observer) {
  currentFC = function handle (e) {
    lastClientX = e.clientX
    lastClientY = e.clientY
    hasLastMouse = true

    debouncedUpdateDistance(e, observer)
  }
  document.addEventListener('mousemove', currentFC)

  // Highlights used to be recomputed on mousemove only, so scrolling with the
  // mouse held still left them behind: a highlight box is positioned in page
  // coordinates, it scrolls away together with the content and nothing ever
  // cleared it. Run the same distance check on scroll, rebuilding the mouse
  // page position from its last viewport position plus the current scroll
  // offset - the mouse did not move, the content under it did.
  scrollFC = function handleScroll () {
    if (!hasLastMouse) return

    const scrollX = window.scrollX || 0
    const scrollY = window.scrollY || 0

    // mouseDistanceFromElement reads pageX/pageY only
    debouncedUpdateDistance({
      pageX: lastClientX + scrollX,
      pageY: lastClientY + scrollY
    }, observer)
  }
  // Capture phase: `scroll` does not bubble, and the page may well scroll in a
  // container instead of the document itself.
  window.addEventListener('scroll', scrollFC, true)
}

export function stopMouseTracking () {
  document.removeEventListener('mousemove', currentFC)
  if (scrollFC) window.removeEventListener('scroll', scrollFC, true)
}
