(() => {
  const meta = document.querySelector('meta[name="wasm-early-fetch"]')
  if (!meta) return
  const nativeFetch = window.fetch
  const key = (url) => new URL(url, location.href).href
  const started = new Map()
  for (const url of meta.content.split(' ')) {
    const response = nativeFetch(url)
    response.catch(() => {})
    started.set(key(url), response)
  }
  window.fetch = function (input, init) {
    const url = typeof input === 'string' && init === undefined ? key(input) : ''
    const response = started.get(url)
    if (!response) return nativeFetch.apply(this, arguments)
    started.delete(url)
    if (!started.size) window.fetch = nativeFetch
    return response.catch(() => nativeFetch(input))
  }
})()
