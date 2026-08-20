import { resetHighlight } from './ui/highlightNode.js'

const data = {}

function clean () {
  Object.values(data).forEach(item => {
    if (!document.body.contains(item.node)) {
      // resetHighlight needs the item (it holds the overlay elements), not the id
      resetHighlight(item, item.node, item.keys, false)
      delete data[item.id]
    }
  })
}

function save (id, type, node, txt) {
  if (!id || !type || !node) return

  if (!data[id]) {
    data[id] = {
      id,
      node
    }
  }

  data[id].keys = {
    ...data[id].keys,
    [`${type}`]: { value: txt, eleUniqueID: id, textType: type }
  }
}

function remove (id) {
  // id can be undefined (parser.js derives it from node.parentElement)
  const item = get(id)
  if (item) resetHighlight(item, item.node, item.keys, false)

  delete data[id]
}

function removeKey (id, key) {
  const item = get(id)
  if (!item) return

  delete item.keys[`${key}`]

  if (!Object.keys(item.keys).length) remove(id)
}

function get (id) {
  return data[id]
}

export const uninstrumentedStore = {
  save,
  remove,
  removeKey,
  clean,
  get,
  data
}
