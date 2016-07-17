;(function (global, factory) {
  'use strict'

  var library = 'objectPropertyChange'

  // Export library
  if (typeof global['module'] === 'object' && global['module']['exports']) { // CommonJS
    global.module.exports = factory()
  } else if (typeof global['define'] === 'function' && global['define']['amd']) { // AMD
    global.define(function () {
      return factory()
    })
  } else { // Browser global
    global[library] = factory()
  }
})(typeof global !== 'undefined' ? global : this.window || this.global, function () {
  'use strict'

  var cacheHash = '123456789$$__object_Property_Change_Cache__$$123456789'

  return function objectPropertyChange (obj, property, callback) {
    if (typeof obj !== 'object' ||
      typeof property !== 'string' ||
      typeof callback !== 'function'
    ) {
      throw new TypeError('Invalid Argument')
    }

    if (!obj.hasOwnProperty(cacheHash)) {
      Object.defineProperty(obj, cacheHash, {
        value: {}
      })
    }

    var cache = obj[cacheHash]

    Object.defineProperty(obj, property, {
      set: function (value) {
        callback(cache[property] = value)
        return true
      },

      get: function () {
        return cache[property]
      }
    })
  }
})
