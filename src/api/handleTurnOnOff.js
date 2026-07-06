import { api } from './postMessage.js'
import { store } from '../store.js'
import { uninstrumentedStore } from '../uninstrumentedStore.js'
import { startMouseTracking, stopMouseTracking } from '../ui/mouseDistance.js'
import { resetHighlight } from '../ui/highlightNode.js'

// Navigate-vs-edit mode. While OFF the page behaves like a normal website:
// no hover highlighting, no click interception (highlight boxes are the only
// click surface we add, so clearing them restores native behavior). Content
// parsing keeps running so the editor's on-page list stays fresh while the
// user navigates. Toggled by the editor via the turnOn/turnOff messages.
api.editingEnabled = true

api.turnOn = () => {
  if (api.editingEnabled) return
  api.editingEnabled = true
  startMouseTracking()
}

api.turnOff = () => {
  if (!api.editingEnabled) return
  api.editingEnabled = false
  stopMouseTracking()
  Object.values(store.data).forEach(item => {
    resetHighlight(item, item.node, item.keys, false)
  })
  Object.values(uninstrumentedStore.data).forEach(item => {
    resetHighlight(item, item.node, item.keys, false)
  })
}

api.addHandler('turnOn', () => api.turnOn())
api.addHandler('turnOff', () => api.turnOff())
