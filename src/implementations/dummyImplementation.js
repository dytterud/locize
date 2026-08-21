export function getImplementation () {
  const impl = {
    getResource: (lng, ns, key) => {
      return {}
    },
    setResource: (lng, ns, key, value) => {

    },
    getResourceBundle: (lng, ns, cb) => {
      cb({})
    },
    getDefaultNS: () => {

    },
    getLng: () => {

    },
    getSourceLng: () => {

    },
    getLocizeDetails: () => {
      return {}
    },
    bindLanguageChange: cb => {},
    bindMissingKeyHandler: cb => {},
    triggerRerender: () => {}
  }
  return impl
}
