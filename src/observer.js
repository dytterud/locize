import { debounce, debugLog } from './utils.js'
import { validAttributes } from './vars.js'

const defaultObserverConfig = {
  attributes: true,
  childList: true,
  characterData: true,
  subtree: true
}

const mutationTriggeringElements = {}

function ignoreMutation (ele) {
  if (ele.uniqueID) {
    const info = mutationTriggeringElements[ele.uniqueID]

    if (
      info &&
      info.triggered > 10 &&
      info.lastTriggerDate + 500 < Date.now()
    ) {
      if (!info.warned && console) {
        console.warn(
          'locize ::: ignoring element change - an element is rerendering too often in short interval',
          '\n',
          'consider adding the "data-locize-editor-ignore:" attribute to the element:',
          ele
        )

        info.warned = true
      }

      return true
    }
  }

  const ret =
    ele.dataset &&
    (ele.dataset.i18nextEditorElement === 'true' ||
      ele.dataset.locizeEditorIgnore === 'true')

  if (!ret && ele.parentElement) return ignoreMutation(ele.parentElement)

  return ret
}

export function createObserver (ele, handle) {
  // enable some skip for internal mutations
  let internalChange
  let lastToggleTimeout
  const toggleInternal = () => {
    if (lastToggleTimeout) clearTimeout(lastToggleTimeout)

    lastToggleTimeout = setTimeout(() => {
      if (internalChange) internalChange = false
    }, 200)
  }

  // hold elements with mutations
  let targetEles = []
  // ponytail: crude global backoff - on high-churn pages (animations,
  // tickers) that keep triggering across DIFFERENT elements (the
  // per-element suppression above doesn't catch that), hold parsing to
  // ~1/second once more than 10 parses happened within 10 seconds
  let windowStart = 0
  let runsInWindow = 0
  let lastRun = 0
  const debouncedHandler = debounce(function h () {
    const now = Date.now()
    if (now - windowStart > 10000) {
      windowStart = now
      runsInWindow = 0
    }
    if (runsInWindow > 10 && now - lastRun < 1000) {
      debouncedHandler() // re-defer; targetEles keeps accumulating
      return
    }
    runsInWindow = runsInWindow + 1
    lastRun = now
    handle(targetEles)
    targetEles = []
  }, 100)

  // eslint-disable-next-line no-undef
  const observer = new MutationObserver(mutations => {
    if (internalChange) {
      toggleInternal()
      return
    }

    // check if mutation is relevant
    let triggerMutation = false

    // store most outer element for mutation
    mutations.forEach(function (mutation) {
      // ignore, eg. we're not interested in style changes
      if (
        mutation.type === 'attributes' &&
        !validAttributes.includes(mutation.attributeName)
      ) {
        return
      }

      // For characterData mutations (e.g. Angular text interpolation),
      // the target is a text node — resolve to parent element so the
      // parser can scan its childNodes for subliminal markers.
      const target = mutation.target.nodeType === 3
        ? mutation.target.parentElement
        : mutation.target
      if (!target) return

      // cleanup mutation triggers after some time of non triggering
      Object.keys(mutationTriggeringElements).forEach(k => {
        const info = mutationTriggeringElements[k]

        if (info.lastTriggerDate + 60000 < Date.now()) {
          delete mutationTriggeringElements[k]
        }
      })

      // ignore mutation done by our elements
      if (mutation.type === 'childList') {
        let notOurs = 0

        if (!ignoreMutation(target)) {
          mutation.addedNodes.forEach(n => {
            if (ignoreMutation(n)) return
            notOurs = notOurs + 1
          }, 0)

          mutation.removedNodes.forEach(n => {
            if (ignoreMutation(n)) return
            notOurs = notOurs + 1
          }, 0)
        }

        if (notOurs === 0) return
      }

      // eventual text relevant mutation
      triggerMutation = true

      // add to mutationTriggers to check for spamming elements
      if (target.uniqueID) {
        const info = mutationTriggeringElements[target.uniqueID] || {
          triggered: 0
        }

        info.triggered = info.triggered + 1
        info.lastTriggerDate = Date.now()

        mutationTriggeringElements[target.uniqueID] = info
      }

      // test if mutated element is already part of another mutation
      const includedAlready = targetEles.reduce((mem, element) => {
        if (
          mem ||
          element.contains(target) ||
          !target.parentElement
        ) {
          return true
        }
        return false
      }, false)

      // if not remove elements contained in this mutation element
      // and add it
      if (!includedAlready) {
        targetEles = targetEles.filter(
          element => !target.contains(element)
        )
        targetEles.push(target)
      }

      // console.log('MUTATION', mutation.type, mutation)
    })

    // trigger handle
    if (triggerMutation) debouncedHandler()
  })

  // remember the config `start` was called with, so additional roots
  // (shadow roots) can be observed with the very same settings
  let activeConfig = defaultObserverConfig

  return {
    start: (observerConfig = defaultObserverConfig) => {
      activeConfig = observerConfig
      handle([ele]) // handle initial content - might be we're not using i18next that triggers mutations on translation (think of static content)
      observer.observe(ele, observerConfig)
    },
    // Observe an additional root with the same MutationObserver and parse it
    // right away. Used for shadow roots: a shadow boundary stops both DOM
    // traversal and mutation records, so the `document.body` observer never
    // learns about anything happening inside one.
    observeRoot (root) {
      if (!root) return

      try {
        handle([root])
      } catch (err) {
        debugLog('failed to parse additional root', root, err)
      }

      observer.observe(root, activeConfig)
    },
    skipNext () {
      internalChange = true
    }
  }
}
