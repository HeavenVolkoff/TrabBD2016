'use strict'
const formatStringRegexp = /\{([0-9]+)}/gm

var util = {
  format: () => {
    var s, arg
    s = arguments[0] + ''
    arg = arguments

    return s.replace(formatStringRegexp, function (match, number) {
      return arg[parseInt(number) + 1] + ''
    })
  },

  try: (canThrow, onError) => {
    try {
      canThrow()
    } catch (error) {
      util.try.lastError = error
      return typeof onError === 'function' ? !!onError(error) : false
    }
    return true
  },

  apply: (subject, args) => {
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

  bind: (fn) => {
    var boundLength, boundArgs
    boundLength = arguments.length - 1

    if (boundLength > 0) {
      let i
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
  }
}

module.exports = util
