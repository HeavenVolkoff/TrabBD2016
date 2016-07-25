window.define(function () {
  'use strict'
  var formatStringRegexp = /\{([0-9]+)}/gm
  var divElement = document.createElement('div')

  var util = {
    format: function formatString () {
      var s = arguments[0] + ''
      var arg = arguments

      return s.replace(formatStringRegexp, function (match, number) {
        return arg[parseInt(number) + 1] + ''
      })
    },

    try: function tryWrapper (canThrow, onError) {
      try {
        canThrow()
      } catch (error) {
        tryWrapper.lastError = error
        return typeof onError === 'function' ? !!onError(error) : false
      }
      return true
    },

    apply: function applyNoContext (subject, args) {
      switch (args.length) {
        case 0:
          return subject()
        case 1:
          return subject(args[0])
        case 2:
          return subject(args[0], args[1])
        case 3:
          return subject(args[0], args[1], args[2])
        case 4:
          return subject(args[0], args[1], args[2], args[3])
        case 5:
          return subject(args[0], args[1], args[2], args[3], args[4])
        case 6:
          return subject(args[0], args[1], args[2], args[3], args[4], args[5])
        case 7:
          return subject(args[0], args[1], args[2], args[3], args[4], args[5], args[6])
        case 8:
          return subject(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7])
        default:
          return subject.apply(undefined, args)
      }
    },

    bind: function fastBind (fn) {
      var boundLength, boundArgs, i
      boundLength = arguments.length - 1

      if (boundLength > 0) {
        boundArgs = new Array(boundLength)

        for (i = 0; i < boundLength; i++) {
          boundArgs[i] = arguments[i + 2]
        }

        return function () {
          var length, args
          length = arguments.length
          args = new Array(boundLength + length)

          for (i = 0; i < boundLength; i++) {
            args[i] = boundArgs[i]
          }

          for (i = 0; i < length; i++) {
            args[boundLength + i] = arguments[i]
          }

          return util.apply(fn, args)
        }
      }

      return function () {
        fn()
      }
    },

    assign: function fastAssign (target) {
      var totalArgs, source, i, totalKeys, keys, key, j
      totalArgs = arguments.length

      for (i = 1; i < totalArgs; i++) {
        source = arguments[i]
        keys = Object.keys(source)
        totalKeys = keys.length
        for (j = 0; j < totalKeys; j++) {
          key = keys[j]
          target[key] = source[key]
        }
      }
      return target
    }
  }

  return util
})
