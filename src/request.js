export default {
  send: function (url, options) {
    options || (options = { })

    let method = options.method ? options.method.toUpperCase() : 'GET'
    let xhr = new XMLHttpRequest()

    /** @ignore */
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (options.onComplete && typeof options.onComplete === 'function') {
          options.onComplete(xhr.response)
        }
        if (xhr.status === 200) {
          if (options.success && typeof options.success === 'function') {
            options.success(xhr.response)
          }
        } else {
          if (options.error && typeof options.error === 'function') {
            options.error(new Error(xhr.statusText))
          }
        }
      }
    }

    xhr.open(method, url, true)

    if (method === 'POST' || method === 'PUT') {
      xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
    }

    xhr.send(options.body || '')
    return xhr
  }
}
