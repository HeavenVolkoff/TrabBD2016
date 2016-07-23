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
   *  socket: SocketIOClient.Socket,
   *  ready: Boolean,
   *  ui: {id: Object, map: (Function|Object)}
   *  }}
   */
  app = {
    socket: IO.connect(window.location.host),
    ready: false,
    ui: null
  }

  Ajax.get('data/data.json', 'json')
    .then(function (data) {
      app.config = data.config
      app.ready = true
      app.ui = UI

      // Exec each UI element set-up function
      for (elementName in UI) {
        elementSetup = UI[elementName]
        if (UI.hasOwnProperty(elementName) && typeof elementSetup === 'function') {
          UI[elementName] = elementSetup(app, data)
        }
      }

      // Inform server that we are ready to receive database data
      app.socket.emit('ready')
    })
    .catch(function (error) {
      console.error(error.message)
    })

  return app
})
