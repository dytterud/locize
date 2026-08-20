import { resetHighlight } from './ui/highlightNode.js'

const data = {}

function clean () {
  Object.values(data).forEach(item => {
    if (!document.body.contains(item.node)) {
      // resetHighlight needs the item (it holds the overlay elements), not the id;
      // ignoreSelected false: the node is gone, a selection highlight must not outlive it
      resetHighlight(item, item.node, item.keys, false)
      delete data[item.id]
    }
  })
}

function save (id, subliminal, type, meta, node, children) {
  if (!id || !type || !meta || !node) return

  if (!data[id]) {
    data[id] = {
      id,
      node,
      subliminal
    }
  }

  if (subliminal) data[id].subliminal = subliminal

  data[id].keys = {
    ...data[id].keys,
    [`${type}`]: meta
  }

  if (children) {
    data[id].children = {
      ...data[id].children,
      [`${type}-${children.map(c => c.childIndex).join(',')}`]: children
    }
  }
}

function get (id) {
  return data[id]
}

export const store = {
  save,
  clean,
  get,
  data
}
