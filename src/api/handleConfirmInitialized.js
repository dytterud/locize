import { api } from './postMessage.js'

function handler (payload) {
  api.initialized = true
  clearInterval(api.initInterval)
  delete api.initInterval
  // late connect after the 15s watchdog already complained
  document.querySelector('.locize-incontext-error')?.remove()
  api.sendCurrentParsedContent()
  api.sendCurrentTargetLanguage()
}

api.addHandler('confirmInitialized', handler)
