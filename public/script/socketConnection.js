(function (window) {
  'use strict'

  var socket = window.io.connect('127.0.0.1')

  window.socketConnection = socket
})(typeof window === 'object' ? window : this)
