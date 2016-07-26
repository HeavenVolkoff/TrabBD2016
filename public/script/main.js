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
  var elementName, app, getStates

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

  getStates = new Promise(function(resolve){
    app.socket.once('getStates', function (states) {
      var obj, i
      obj = {}

      for (i = 0; i < states.length; i++) {
        obj[states[i].uf] = states[i].nome
      }

      resolve(obj)
    })
  })

  Promise.props({
    data: Ajax.get('data/data.json', 'json'),
    states: getStates
  }).then(function (result) {
    app.config = result.data.config
    app.ready = true
    app.ui = UI

    result.data.states = result.states

    // Exec each UI element set-up function
    for (elementName in UI) {
      if (UI.hasOwnProperty(elementName) && typeof UI[elementName] === 'function') {
        UI[elementName] = UI[elementName](app, result.data)
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
