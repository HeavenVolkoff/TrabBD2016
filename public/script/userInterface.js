window.define(['util', 'Ajax', 'Leaflet'], function (_, Ajax, Leaflet) {
  'use strict'

  var $, errorListener, UI

  $ = document
  errorListener = function (e) { console.error(e) }

  UI = {
    id: {
      map: 'map'
    },

    map: function (app) {
      var map,
        layers,
        marker,
        mapElement,
        onStateClick,
        onStateMouseOut,
        onStateMouseOver,
        statesGeoJsonAndMarkerHtmlPromise

      mapElement = $.querySelector('#' + UI.id.map)

      layers = {
        tile: Leaflet.tileLayer(app.config.leaflet.provider, app.config.leaflet.options),
        shape: {
          brasil: {},
          estados: {}
        },
        geoJSON: {
          brasil: null,
          estados: null
        }
      }

      marker = {
        healthUnitsPerState: {}
      }

      map = Leaflet.map(mapElement, {
        layers: layers.tile
      })

      onStateMouseOver = function highlightFeature (e) {
        var layer = e.target

        layer.setStyle({
          weight: 5,
          color: '#666',
          dashArray: '',
          fillOpacity: 0.7
        })

        if (!(Leaflet.Browser.ie || Leaflet.Browser.opera)) {
          layer.bringToFront()
        }
      }

      onStateMouseOut = function resetHighlight (e) {
        layers.geoJSON.estados.resetStyle(e.target)
      }

      onStateClick = function zoomToFeature (e) {
        map.fitBounds(e.target.getBounds())
      // TODO requisitar informações do estado e pontos do estado
      }

      // Load Brasil GeoJson
      Ajax.get('data/GeoJSON/BR.json', 'json')
        .then(function (brasilGeoInfo) {
          // Load Brasil shape into map
          // layers.shape.brasil = Leaflet.geoJson(brasilGeoInfo)

          // Cache geoJson properties
          app.data.brasil = brasilGeoInfo.properties
          // TODO: implement Object.assign: app.data.brasil.bounds =

          // Adjust map options to centralize Brasil and limite drag and zoom
          map.setView(app.data.brasil.position, 5, { animate: true })
          map.setMaxBounds(map.getBounds())
          map.options.minZoom = app.data.brasil.zoom.min
          map.options.maxZoom = app.data.brasil.zoom.max
        })
        .catch(errorListener)

      // Load States GeoJson and markers HTML
      statesGeoJsonAndMarkerHtmlPromise = Promise.all(
        [
          Ajax.get('data/GeoJSON/Estados.json', 'json'),
          Ajax.get('import/healthUnitsPerStateCounterMarker.html', 'text')
        ])
        .then(function (results) {
          map.invalidateSize()
          // TODO: reset map zoom
          layers.geoJSON.estados = Leaflet.geoJson(results[0], {
            onEachFeature: function onEachFeature (feature, layer) {
              layers.shape.estados[feature.properties.sigla] = layer
              layer.on({
                mouseover: onStateMouseOver,
                mouseout: onStateMouseOut,
                click: onStateClick
              })
            }
          }).addTo(map)

          return results[1]
        })
        .catch(errorListener)

      // Wait server healthUnitsPerState query response
      app.socket.once('healthUnitsPerState',
        /**
         * Add state markers and shapes into map
         * @param results {{healthUnitQuantity: Number, stateName: String}[]}
         */
        function (results) {
          statesGeoJsonAndMarkerHtmlPromise
            .then(function (markerHtml) {
              var result, iconSizeCssClass, colorByState
              colorByState = app.data.colorByState

              for (var i = 0; i < results.length; i++) {
                result = results[i]

                iconSizeCssClass = ((Math.log10(result.healthUnitQuantity) >>> 0) - 2)
                iconSizeCssClass = iconSizeCssClass > 3 ? 3 : iconSizeCssClass

                switch (iconSizeCssClass) {
                  case 0:
                    colorByState[result.stateName] = '#72b1ff'
                    break
                  case 1:
                    colorByState[result.stateName] = '#3388ff'
                    break
                  case 2:
                    colorByState[result.stateName] = '#19447F'
                    break
                  case 3:
                    colorByState[result.stateName] = '#3388FF'
                    break
                }

                marker.healthUnitsPerState[result.stateName] = Leaflet.marker(layers.shape.estados[result.stateName].getBounds().getCenter(), {
                  icon: Leaflet.divIcon({
                    className: 'healthUnitsPerStateCounter',
                    html: _.format(markerHtml, result.healthUnitQuantity, iconSizeCssClass ? '_' + iconSizeCssClass : '')
                  })
                }).addTo(map)
              }

              layers.geoJSON.estados.setStyle(
                layers.geoJSON.estados.options.style = function (feature) {
                  return {
                    weight: 2,
                    opacity: 1,
                    color: 'white',
                    dashArray: '3',
                    fillOpacity: 0.7,
                    fillColor: app.data.colorByState[feature.properties.sigla]
                  }
                }
              )
            })
            .catch(errorListener)
        }
      )

      // Cache data into UI.map
      return {
        leaflet: map,
        markers: marker,
        layers: layers
      }
    }
  }

  return UI
})
