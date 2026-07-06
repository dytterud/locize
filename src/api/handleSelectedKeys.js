import { api } from './postMessage.js'
import { store } from '../store.js'

import { selectedHighlight, resetHighlight } from '../ui/highlightNode.js'
import { isInViewport } from '../ui/utils.js'

let previousMatches = []
function handler (payload) {
  const { keys } = payload

  const matchingItems = []
  Object.values(store.data).forEach(item => {
    const matches = Object.values(item.keys).filter(k => keys.includes(k.qualifiedKey))

    if (matches.length) {
      matchingItems.push(item)
    }
  })

  // deselect
  previousMatches.forEach(item => {
    resetHighlight(item, item.node, item.keys, false)
  })

  // select
  matchingItems.forEach(item => {
    selectedHighlight(item, item.node, item.keys)
  })

  // bring the selection into view: selecting a key in the editor scrolls
  // the page to the (first) matching element when it is off-screen
  if (matchingItems.length && !isInViewport(matchingItems[0].node)) {
    try {
      matchingItems[0].node.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } catch (e) {
      // older browsers without options support
      matchingItems[0].node.scrollIntoView()
    }
  }

  previousMatches = matchingItems
}

api.addHandler('selectedKeys', handler)
