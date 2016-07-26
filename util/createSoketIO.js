/**
 * Client socket.io communication
 */
'use strict'

const Server = require('socket.io')

module.exports = function createSocketIO (server, listeners) {
  const io = new Server(server)

  if (typeof listeners !== 'object') {
    throw new TypeError('Listeners should be a object')
  }

  let listenerArray = Object.keys(listeners)

  // Reject non function properties on listeners
  for (let listener of listenerArray) {
    if (typeof listeners[listener] !== 'function') {
      throw new TypeError('Listener must be a function')
    }
  }

  io.on('connection', (socket) => {
    for (let listener of listenerArray) {
      socket.on(listener, listeners[listener].bind(null, socket))
    }
  })

  return io
}
