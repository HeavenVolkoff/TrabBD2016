;(function (global, factory) {
  'use strict'

  var library = 'formatString'

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
})(typeof global !== 'undefined' ? global : this.window || this.global,
  /**
   * @link: https://stackoverflow.com/questions/1038746/equivalent-of-string-format-in-jquery/1038930#1038930
   * @returns {formatString}
   */
  function factory () {
    'use strict'

    var reg = /\{([0-9]+)}/gm

    return function formatString () {
      var s = arguments[0]
      var arg = arguments

      return s.replace(reg, function (match, number) {
        return arg[parseInt(number) + 1]
      })
    }
  })
