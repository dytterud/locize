import { startMouseTracking, stopMouseTracking } from './mouseDistance.js'

// Minimum slice of the popup that must stay on-screen on each axis so the
// user can always grab it back. We keep the full header row visible on top
// and a small grabbable strip on the sides / bottom.
const MIN_VISIBLE = 40

function clampTop (top) {
  const max = Math.max(0, window.innerHeight - MIN_VISIBLE)
  return Math.max(0, Math.min(top, max))
}

function clampLeft (left, el) {
  const width = el.offsetWidth || 0
  const min = Math.min(0, MIN_VISIBLE - width)
  const max = Math.max(0, window.innerWidth - MIN_VISIBLE)
  return Math.max(min, Math.min(left, max))
}

export function initDragElement () {
  let pos1 = 0
  let pos2 = 0
  let pos3 = 0
  let pos4 = 0
  const popups = document.getElementsByClassName('i18next-editor-popup')
  let elmnt = null
  let overlay = null
  // ponytail: there is only ever one popup; re-raising z-index on every
  // mousedown only competed with itself (and grew unboundedly)

  for (let i = 0; i < popups.length; i++) {
    const popup = popups[i]
    const header = getHeader(popup)

    if (header) {
      header.parentPopup = popup
      // pointer events unify mouse + touch/pen (tablet support);
      // touch-action none stops the browser from scrolling instead
      header.style.touchAction = 'none'
      header.onpointerdown = dragMouseDown
    }
  }

  function dragMouseDown (e) {
    if (!overlay) { overlay = document.getElementById('i18next-editor-popup-overlay') }
    if (overlay) overlay.style.display = 'block'
    stopMouseTracking()

    elmnt = this.parentPopup

    e = e || window.event
    // get the pointer position at startup:
    pos3 = e.clientX
    pos4 = e.clientY
    document.onpointerup = closeDragElement
    // call a function whenever the pointer moves:
    document.onpointermove = elementDrag
  }

  function elementDrag (e) {
    if (!elmnt) {
      return
    }

    e = e || window.event
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX
    pos2 = pos4 - e.clientY
    pos3 = e.clientX
    pos4 = e.clientY
    // set the element's new position, clamped to the viewport so the popup
    // cannot be dragged off-screen (title bar must stay reachable).
    elmnt.style.top = clampTop(elmnt.offsetTop - pos2) + 'px'
    elmnt.style.left = clampLeft(elmnt.offsetLeft - pos1, elmnt) + 'px'
  }

  function closeDragElement () {
    startMouseTracking()
    if (overlay) overlay.style.display = 'none'

    const ele = document.getElementById('i18next-editor-popup')
    window.localStorage.setItem(
      'locize_popup_pos',
      JSON.stringify({
        top: parseInt(document.defaultView.getComputedStyle(ele).top, 10),
        left: parseInt(document.defaultView.getComputedStyle(ele).left, 10)
      })
    )

    /* stop moving when the pointer is released: */
    document.onpointerup = null
    document.onpointermove = null
  }

  function getHeader (element) {
    const headerItems = element.getElementsByClassName(
      'i18next-editor-popup-header'
    )

    if (headerItems.length === 1) {
      return headerItems[0]
    }

    return null
  }
}

export function initResizeElement () {
  const popups = document.getElementsByClassName('i18next-editor-popup')
  let element = null
  let overlay = null
  let startX, startY, startWidth, startHeight

  for (let i = 0; i < popups.length; i++) {
    const p = popups[i]

    const right = document.createElement('div')
    right.className = 'resizer-right'
    right.style.touchAction = 'none'
    p.appendChild(right)
    right.addEventListener('pointerdown', initDrag, false)
    right.parentPopup = p

    const bottom = document.createElement('div')
    bottom.className = 'resizer-bottom'
    bottom.style.touchAction = 'none'
    p.appendChild(bottom)
    bottom.addEventListener('pointerdown', initDrag, false)
    bottom.parentPopup = p

    const both = document.createElement('div')
    both.className = 'resizer-both'
    both.style.touchAction = 'none'
    p.appendChild(both)
    both.addEventListener('pointerdown', initDrag, false)
    both.parentPopup = p
  }

  function initDrag (e) {
    stopMouseTracking()
    if (!overlay) { overlay = document.getElementById('i18next-editor-popup-overlay') }
    if (overlay) overlay.style.display = 'block'

    element = this.parentPopup

    startX = e.clientX
    startY = e.clientY
    startWidth = parseInt(
      document.defaultView.getComputedStyle(element).width,
      10
    )
    startHeight = parseInt(
      document.defaultView.getComputedStyle(element).height,
      10
    )
    document.documentElement.addEventListener('pointermove', doDrag, false)
    document.documentElement.addEventListener('pointerup', stopDrag, false)
  }

  function doDrag (e) {
    element.style.width = startWidth + e.clientX - startX + 'px'
    element.style.height = startHeight + e.clientY - startY + 'px'
  }

  function stopDrag () {
    startMouseTracking()
    if (overlay) overlay.style.display = 'none'

    const ele = document.getElementById('i18next-editor-popup')
    window.localStorage.setItem(
      'locize_popup_size',
      JSON.stringify({
        width: parseInt(document.defaultView.getComputedStyle(ele).width, 10),
        height: parseInt(document.defaultView.getComputedStyle(ele).height, 10)
      })
    )

    document.documentElement.removeEventListener('pointermove', doDrag, false)
    document.documentElement.removeEventListener('pointerup', stopDrag, false)
  }
}
