window.define(['util', 'Ajax', 'Leaflet'], function (_, Ajax, Leaflet) {
  'use strict'

  var $ = document
  var UI = {
    id: {
      map: 'map'
    },

    map: function (app) {
      var mapElement, layer, map, statesPos, marker
      mapElement = $.querySelector('#' + UI.id.map)

      layer = {
        tile: Leaflet.tileLayer(app.config.leaflet.provider, app.config.leaflet.options),
        shape: {}
      }

      marker = {
        healthUnitsPerState: {}
      }

      map = Leaflet.map(mapElement, {
        layers: layer.tile
      })

      Ajax.get('data/GeoJSON/Br.json', 'json')
        .then(function (brasilGeoInfo) {
          // Load Brasil shape into map
          layer.shape.brasil = Leaflet.geoJson(brasilGeoInfo,
            { style: function (feature) { /* return feature.properties.style */ } }
          ).addTo(map)

          // Adjust map options to centralize Brasil and limite drag and zoom
          map.setView(brasilGeoInfo.properties.position, 5, { animate: true })
          map.setMaxBounds(map.getBounds())
          map.options.minZoom = brasilGeoInfo.properties.zoom.min
          map.options.maxZoom = brasilGeoInfo.properties.zoom.max
        })
        .catch(function (error) {
          console.error(error.message)
        })

      statesPos = Ajax.get('data/coordenadasEstados.json', 'json')
        .catch(function (error) {
          console.error(error.message)
        })

      app.socket.on('healthUnitsPerState', function (results) {
        statesPos.then(function (_statesPos) {
          var result
          statesPos = _statesPos

          for (var i = 0; i < results.length; i++) {
            result = results[i]
            marker.healthUnitsPerState[result.stateName] = Leaflet.marker(statesPos[result.stateName], {
              icon: Leaflet.divIcon({
                className: 'healthUnitsPerStateCounter',
                html: _.format('<p>{0}</p>', result.healthUnitQuantity)
              })
            }).addTo(map)
          }
        }).catch(function (e) { console.error(e) })
      })

      return {
        leaflet: map,
        markers: marker,
        layers: layer
      }
    }
  }

  return UI
})
