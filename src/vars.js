export const validAttributes = ['placeholder', 'title', 'alt']
export const ignoreElements = ['SCRIPT']
export const colors = {
  highlight: '#1976d2',
  warning: '#e67a00',
  gray: '#ccc'
}

const resolveEnv = () => {
  let p
  if (typeof process !== 'undefined') p = process
  if (!p && typeof window !== 'undefined') p = window.process
  const prc = p || {}
  return prc.env?.locizeIncontext || 'production'
}

export const getIframeUrl = () => {
  const env = resolveEnv()
  return env === 'development'
    ? 'http://localhost:3003/'
    : env === 'staging'
      ? 'https://incontext-dev.locize.app'
      : 'https://incontext.locize.app'
}

// Every origin a legitimate locize editor can message this page from:
// the popup editor iframe (mode A, = getIframeUrl) AND the main locize app
// hosting the InContext view that embeds this page as an iframe (mode B).
// Must stay a fixed allowlist - see GHSA-w937-fg2h-xhq2.
export const getEditorOrigins = () => {
  const env = resolveEnv()
  return env === 'development'
    ? ['http://localhost:3003', 'http://localhost:3000']
    : env === 'staging'
      ? ['https://incontext-dev.locize.app', 'https://dev.locize.app']
      : ['https://incontext.locize.app', 'https://www.locize.app', 'https://locize.app']
}
