;(function (global, factory) {
  'use strict'

  var library = 'Ajax'
  var factoryArgs = []
  var missingComponent = ''

  // Validate components and generate factory arguments
  missingComponent = (function () {
    // The object comparison here is because of safari bug (-_-)
    if (!(typeof global['XMLHttpRequest'] === 'function' || typeof global['XMLHttpRequest'] === 'object')) {
      return 'XMLHttpRequest'
    } else {
      factoryArgs.push(global['XMLHttpRequest'])
    }
  })()

  if (missingComponent) {
    factoryArgs = null
    factory = function () {
      return function environmentValidationError () {
        throw new Error('Invalid environment: Missing ' + missingComponent + ' support')
      }
    }
  }

  // Export library
  if (typeof global['module'] === 'object' && global['module']['exports']) { // CommonJS
    global['module']['exports'] = factory.apply(null, factoryArgs)
  } else if (typeof global['define'] === 'function' && global['define']['amd']) { // AMD
    global['define'](function () {
      return factory.apply(null, factoryArgs)
    })
  } else { // Browser global
    global[library] = factory.apply(null, factoryArgs)
  }
})(typeof global !== 'undefined' ? global : this.window || this.global, function (XMLHttpRequest) {
  'use strict'

  var AjaxError = (function () {
    /**
     * Class representing ajax specific errors
     *
     * @param msg {string}
     * @param code {number}
     * @param [xhr] {XMLHttpRequest}
     * @constructor
     */
    function AjaxError (msg, code, xhr) {
      if (!(this instanceof AjaxError)) {
        throw new TypeError('Class constructor ' + AjaxError.name + " cannot be invoked without 'new'")
      }

      // Extends Error
      Error.call(this, msg)

      this.code = code
      this.xhr = xhr
    }

    // ===== Error prototype inheritance =====
    var ajaxErrorPrototype = Object.create(Error.prototype)
    ajaxErrorPrototype.name = AjaxError.name
    ajaxErrorPrototype.constructor = AjaxError

    // Freeze prototype and set-up inheritance chain
    AjaxError.prototype = Object.freeze(ajaxErrorPrototype)

    // ===== AjaxError Static Properties =====
    AjaxError.codes = Object.freeze({
      timeout: 0x1,
      abort: 0x2,
      fail: 0x3,
      invalidData: 0x4
    })

    return Object.freeze(AjaxError)
  })()

  /**
   * Parse Ajax constructor Options
   *
   * @param opts {object|string}
   * @param opts.url {string}
   * @param [opts.method] {string}
   * @param [opts.timeout] {number}
   * @param [opts.headers] {object}
   * @param [opts.auth] {object}
   * @param [opts.auth.username] {string}
   * @param [opts.auth.password] {string}
   * @param [opts.responseType] {string}
   * @param [opts.forceMimeType] {string}
   * @param [opts.withCredentials] {boolean}
   *
   * @returns {{url: string, method: string, timeout: number, headers: (null|object), username: (null|string), password: (null|string), responseType: string, forceMimeType: string, withCredentials: boolean}}
   */
  function parseOptions (opts) {
    opts = typeof opts === 'string' ? {url: opts} : typeof opts === 'object' && opts !== null ? opts : {}

    // Default Options
    var options = {
      url: String(opts.url), // Will Throw on open if not a valid url string
      method: 'GET', // Will Throw on open if not a valid method string
      timeout: 0,
      headers: null,
      username: null,
      password: null,
      responseType: '',
      forceMimeType: '',
      withCredentials: false
    }

    // Validate Method
    if (opts.method) {
      options.method = String(opts.method)
    }

    // Validate Auth parameters
    if (opts.auth) {
      if (typeof opts.auth === 'object') {
        if (typeof opts.auth.username === 'string' && opts.auth.username.length) {
          options.username = opts.auth.username
        } else {
          throw new TypeError('Invalid auth username')
        }

        if (typeof opts.auth.password === 'string' && opts.auth.password.length) {
          options.password = opts.auth.password
        } else {
          throw new TypeError('Invalid auth password')
        }
      } else {
        throw new TypeError('Invalid auth object')
      }
    }

    // Validate forceMimeType
    if (opts.forceMimeType) {
      if (typeof opts.forceMimeType === 'string') {
        options.forceMimeType = opts.forceMimeType
      } else {
        throw new TypeError('Invalid mime-type')
      }
    }

    // Validate timeout
    if (opts.timeout) {
      if (typeof opts.timeout === 'number' && opts.timeout >= 0) {
        options.timeout = opts.timeout + 0.5 >>> 0 // Only u_int, floats are rounded
      } else {
        throw new TypeError('Invalid timeout')
      }
    }

    // Validate Headers
    if (opts.headers) {
      if (typeof opts.headers === 'object') {
        options.headers = opts.headers
      } else {
        throw new TypeError('Invalid header')
      }
    }

    // Validate withCredentials
    if (opts.withCredentials) {
      if (typeof opts.withCredentials === 'boolean') {
        options.withCredentials = opts.withCredentials
      } else {
        throw new Error('Invalid withCredentials flag')
      }
    }

    // Validate Response Type
    if (opts.responseType) {
      if (typeof opts.responseType === 'string') {
        options.responseType = opts.responseType
      } else {
        throw new TypeError('Invalid response type')
      }
    }

    return options
  }

  /**
   * Safe guard function to replace resolve/reject calls after promise is settled
   */
  function settledPromise () {
    console.error(new Error('Promise already settled'))
  }

  /**
   * Class representing a XMLHttpRequest request resolved trough a Promise
   *
   * @param opts {object|string}
   * @param opts.url {string}
   * @param [opts.method] {string}
   * @param [opts.timeout] {number}
   * @param [opts.headers] {object}
   * @param [opts.auth] {object}
   * @param [opts.auth.username] {string}
   * @param [opts.auth.password] {string}
   * @param [opts.responseType] {string}
   * @param [opts.forceMimeType] {string}
   * @param [opts.withCredentials] {boolean}
   * @param [data] {*}
   * @constructor
   */
  function Ajax (opts, data) {
    var self = this
    var reject = settledPromise
    var options = null
    var resolve = settledPromise

    // Reject simple function call
    if (!(self instanceof Ajax)) {
      throw new TypeError('Class constructor ' + Ajax.name + " cannot be invoked without 'new'")
    }

    // Parse and validate opts
    options = parseOptions(opts)

    // Internal Promise object
    self._promise = new Promise(function (rslv, rjct) {
      resolve = function resolvePromise (result) {
        rslv(result)
        resolve = settledPromise
        reject = settledPromise
      }
      reject = function rejectPromise (error) {
        rjct(error)
        resolve = settledPromise
        reject = settledPromise
      }
    })

    // Internal XMLHttpRequest object
    self._request = new XMLHttpRequest()

    // Open async XMLHttpRequest with specified options
    self._request.open(options.method, options.url, true, options.username, options.password)

    // Register request timeout case required
    if (options.timeout) {
      self._request.timeout = options.timeout
      self._request.addEventListener('timeout', function onTimeout () {
        reject(new AjaxError('Request timed out', Ajax.Error.codes.timeout))
      })
    }

    // Override response mime-type case required
    if (options.forceMimeType) {
      self._request.overrideMimeType(options.forceMimeType)
    }

    // Define request headers values
    if (options.headers) {
      ;(function () {
        var headers = options.headers
        var header = null
        var value = null

        for (header in headers) {
          if (headers.hasOwnProperty(header)) {
            value = headers[header]
            value = value === undefined || value === null ? '' : value // Accept empty headers properties

            if (typeof value === 'string') {
              self._request.setRequestHeader(header, value)
            } else {
              throw new TypeError('Invalid header value')
            }
          }
        }
      })()
    }

    // Define response type case required
    if (options.responseType) {
      self._request.responseType = options.responseType
    }

    // Enable cross site request case required
    if (options.withCredentials) {
      self._request.withCredentials = options.withCredentials
    }

    // ===== Define internal Request listeners =====
    self._request.addEventListener('abort', function onRequestAbort () {
      reject(new AjaxError('Request was aborted', Ajax.Error.codes.abort))
    })

    self._request.addEventListener('error', function onRequestError () {
      reject(new AjaxError('Request failed', Ajax.Error.codes.fail))
    })

    self._request.addEventListener('load', function onRequestLoad () {
      if (self._request.status >= 300) {
        reject(new AjaxError(self._request.statusText, self._request.status, self._request))
        return
      }

      if (options.responseType && !self._request.response) {
        reject(new AjaxError('Server answered request with invalid data type', Ajax.Error.codes.invalidData, self._request))
      }

      resolve(self._request)
    })

    // Send request if upload data is already available, or in the (GET|HEAD) case if required
    if (data !== undefined) {
      self._request.send(data)
    }
  }

  // ===== Prototype inheritance ======
  Ajax.prototype = (function () {
    var ajaxPrototype = Object.create(Object.prototype)
    ajaxPrototype.name = Ajax.name
    ajaxPrototype.constructor = Ajax

    // ===== Ajax Methods =====
    ajaxPrototype.then = function ajaxPromiseThen (onFulfilled, onRejected) {
      return this._promise.then(onFulfilled, onRejected)
    }
    ajaxPrototype.catch = function ajaxPromiseCatch (onRejected) {
      return this._promise.then(undefined, onRejected)
    }
    ajaxPrototype.finally = function ajaxPromiseFinally (onTerminated) {
      return this._promise.then(onTerminated, onTerminated)
    }
    ajaxPrototype.abort = function abortAjaxRequest () {
      this._request.abort()
      return this
    }
    ajaxPrototype.send = function sendAjaxRequest () {
      this._request.send()
      return this
    }
    ajaxPrototype.addEventListener = function addAjaxEventListener (type, callback, options) {
      if (this._request.readyState !== XMLHttpRequest.OPENED) {
        throw new Error('InvalidStateError: The request is in an invalid state to perform this action')
      }

      this._request.addEventListener(type, callback, options)
      return this
    }
    ajaxPrototype.removeEventListener = function removeAjaxEventListener (type, callback, options) {
      if (this._request.readyState !== XMLHttpRequest.OPENED) {
        throw new Error('InvalidStateError: The request is in an invalid state to perform this action')
      }

      this._request.removeEventListener(type, callback, options)
      return this
    }

    // Freeze prototype
    return Object.freeze(ajaxPrototype)
  })()

  // ===== Ajax static properties =====
  Ajax.Error = AjaxError
  Ajax.get = function ajaxGet (url, timeout) {
    return new Ajax({url: url, timeout: timeout}, null)
  }
  Ajax.post = function ajaxPost (url, data, timeout) {
    data = data === undefined ? null : data
    return new Ajax({url: url, timeout: timeout, method: 'POST'}, data)
  }// TODO: Comment static properties functions

  // Return frozen class
  return Object.freeze(Ajax)
})
