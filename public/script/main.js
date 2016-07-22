window.require.config({
  baseUrl: 'script',
  paths: {
    Ajax: [
      'lib/Ajax/Ajax.min',
      'lib/Ajax/Ajax'
    ],
    Leaflet: '//npmcdn.com/leaflet@1.0.0-rc.2/dist/leaflet',
    'socket.io': [
      '//cdnjs.cloudflare.com/ajax/libs/socket.io/1.4.8/socket.io.min',
      '/socket.io/socket.io'
    ]
  }
})

window.define(['userInterface', 'socket.io', 'Ajax'], function (UI, IO, Ajax) {
  'use strict'
  var elementName, elementSetup, app

  /**
   * App object
   *
   * @type {{
   * config: {leaflet: {provider: String, options: Object}},
   * socket: SocketIOClient.Socket,
   * ready: Boolean,
   * ui: {id: Object, map: (Function|Object)}
   * }}
   */
  app = {
    config: null,
    socket: IO.connect(window.location.host),
    ready: false,
    ui: null
  }

  Ajax.get('data/configuration.json', 'json')
    .then(function (config) {
      app.config = config
      app.ready = true
      app.ui = UI

      // Exec UI element set-up
      for (elementName in UI) {
        elementSetup = UI[elementName]
        if (UI.hasOwnProperty(elementName) && typeof elementSetup === 'function') {
          UI[elementName] = elementSetup(app)
        }
      }

      app.socket.emit('ready')
    })
    .catch(function (error) {
      console.error(error.message)
    })

  return app
})
