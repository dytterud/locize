import { resetHighlight } from './ui/highlightNode.js'

const data = {}

function clean () {
  Object.values(data).forEach(item => {
    if (!document.body.contains(item.node)) {
      // see store.js: `resetHighlight` reads the overlay elements off the item,
      // so passing `item.id` orphaned them in the DOM
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

function remove (id, node) {
  // same as in `clean`: the highlight is tracked on the item, not reachable
  // from the id. `id` can also be undefined here (the caller in parser.js
  // derives it from `node.parentElement`, which is null for a node without an
  // element parent) - that used to throw while destructuring in resetHighlight
  // and aborted the whole parse run.
  const item = get(id)
  if (item) resetHighlight(item, item.node, item.keys, false)

  delete data[id]
}

function removeKey (id, key, node) {
  const item = get(id)
  if (!item) return

  delete item.keys[`${key}`]

  if (!Object.keys(item.keys).length) remove(id, node)
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
