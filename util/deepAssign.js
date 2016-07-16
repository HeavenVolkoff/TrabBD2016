'use strict'

/**
 * Modified Jquery's Plain Object check
 *
 * @link https://github.com/jquery/jquery/blob/master/src/core.js
 * @param obj {Object}
 * @returns {boolean}
 */
const isPlainObject = (obj) => {
  let _prototype, _constructor

  // Detect obvious negatives
  if (!obj || typeof obj !== 'object') {
    return false
  }

  _prototype = Object.getPrototypeOf(obj)

  // Objects with no prototype (e.g., `Object.create( null )`) are plain
  if (!_prototype) {
    return true
  }

  // Objects with prototype are plain if they were constructed by a global Object function
  _constructor = _prototype.hasOwnProperty('constructor') && _prototype.constructor
  return typeof _constructor === 'function' && _constructor === Object
}

/**
 * Recursive assign props between two objects
 *
 * @param to {Object}
 * @param from {Object}
 * @returns {Object}
 */
const assign = (to, from) => {
  if (!isPlainObject(from)) {
    throw new TypeError('Argument must be a plain object')
  }

  if (to === from) {
    return to
  }

  let propKeys = Reflect.ownKeys(from).filter((key) => {
    return from.propertyIsEnumerable(key)
  })

  for (let key of propKeys) {
    let value = from[key]

    if (isPlainObject(to[key]) && isPlainObject(value)) {
      assign(to[key], value)
    } else {
      to[key] = value
    }
  }

  return to
}

/**
 * Recursive Object.assign
 *
 * @param objects {Object[]}
 * @returns {Object}
 */
module.exports = (...objects) => {
  let initial = objects[0]

  if (!isPlainObject(initial)) {
    throw new TypeError('Argument must be a plain object')
  }

  for (let from of objects) {
    assign(initial, from)
  }

  return initial
}
