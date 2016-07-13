(function (window) {
  'use strict'

  var socket = window.io.connect('127.0.0.1')

  socket.on('unidadesSaudeAnswer', function (rows) {
    console.log(rows)
  })

  socket.emit('unidadesSaude', 300)

  window.socketConnection = socket
})(typeof window === 'object' ? window : this)
