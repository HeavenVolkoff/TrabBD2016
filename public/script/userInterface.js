window.define(['util', 'Ajax', 'Leaflet'], function (_, Ajax, Leaflet) {
  'use strict'

  var $, promiseErrorListener, UI

  $ = document
  promiseErrorListener = function (e) { console.error(e) }

  UI = {
    id: {
      map: 'map'
    },

    map: function (app, data) {
      var map,
        temp,
        layers,
        counter,
        listeners,
        mapElement,
        statesAcronyms,
        stateLayerHover,
        stateLayerDefault,
        stateLayerHoverStyleNegative

      statesAcronyms = data.brasilInfo.statesAcronyms

      stateLayerHover = data.leaflet.layers.style.stateLayerHover
      stateLayerDefault = data.leaflet.layers.style.stateLayerDefault
      stateLayerHoverStyleNegative = {}
      for (temp in stateLayerHover) {
        if (stateLayerHover.hasOwnProperty(temp) &&
          stateLayerDefault.hasOwnProperty(temp)
        ) {
          stateLayerHoverStyleNegative[temp] = stateLayerDefault[temp]
        }
      }

      listeners = {
        stateLayerClick: function zoomToFeature (event) {
          map.options.minZoom = 0
          map.options.maxZoom = 18
          map.setMaxBounds(null)

          console.log(event)

          map.once("moveend zoomend", function () {
            map.setMaxBounds(event.target.getBounds())
            map.options.minZoom = map.getZoom()
          })

          map.fitBounds(event.target.getBounds())
          // TODO requisitar informações do estado e pontos do estado
        },
        stateLayerMouseOut: function resetHighlight (event) {
          event.target.setStyle(stateLayerHoverStyleNegative)
        },
        stateLayerMouseOver: function highlightFeature (event) {
          var layer = event.target
          layer.setStyle(stateLayerHover)
          if (!(Leaflet.Browser.ie || Leaflet.Browser.opera)) {
            layer.bringToFront()
          }
        },
        stateGeoJsonAjaxRequest: function (stateGeoJson) {
          layers.statesGeoJson.addData(stateGeoJson)
        },
        stateGeoJsonFeatureListener: function onEachFeature (feature, layer) {
          layers.stateGeoJson[feature.properties.sigla] = layer
          layer.on({
            mouseover: listeners.stateLayerMouseOver,
            mouseout: listeners.stateLayerMouseOut,
            click: listeners.stateLayerClick
          })
        },
        stateMarkerDataListener: function (stateName, stateGeometryLayer, healthUnitQuantity, iconSizeCssClass) {
          var style
          if (stateGeometryLayer instanceof Promise) {
            stateGeometryLayer.then(function () {
              listeners.stateMarkerDataListener(stateName, stateGeometryLayer, healthUnitQuantity, iconSizeCssClass)
            }).catch(promiseErrorListener)
          }

          style = _.assign({}, stateLayerDefault)
          style.fillColor = data.leaflet.layers.style.colorsPerState[iconSizeCssClass]
          stateGeometryLayer.setStyle(style)

          layers.stateMarkers.addLayer(Leaflet.marker(
            stateName === 'PE' ? data.brasilInfo.positionFix['PE'] : stateGeometryLayer.getBounds().getCenter(),
            {
              icon: Leaflet.divIcon({
                className: 'mapMarker',
                html: _.format(data.leaflet.layers.makers.healthUnitPerStateHTML,
                  healthUnitQuantity,
                  iconSizeCssClass ? '_' + iconSizeCssClass : ''
                )
              })
            })
          )
        }
      }

      console.log('listeners ok')

      layers = {
        tile: Leaflet.tileLayer(data.leaflet.provider, data.leaflet.options),
        perMarkers: {},
        stateMarkers: Leaflet.layerGroup(),
        statesGeoJson: Leaflet.geoJson(null, {
          style: stateLayerDefault,
          onEachFeature: listeners.stateGeoJsonFeatureListener
        }),
        stateGeoJson: {}
      }

      console.log('layers ok')

      mapElement = $.querySelector('#' + UI.id.map)
      map = Leaflet.map(mapElement, {
        layers: [
          layers.tile,
          layers.statesGeoJson,
          layers.stateMarkers
        ],
        center: data.brasilInfo.center,
        zoom: data.brasilInfo.zoom.min,
        minZoom: data.brasilInfo.zoom.min,
        maxZoom: data.brasilInfo.zoom.max
      })
      map.setMaxBounds(map.getBounds())

      console.log('maps ok')

      for (counter = 0; counter < statesAcronyms.length; counter++) {
        layers.stateGeoJson[statesAcronyms[counter]] =
            Ajax.get(_.format('data/GeoJson/states/{0}.json', statesAcronyms[counter]), 'json')
              .then(listeners.stateGeoJsonAjaxRequest)
              .catch(promiseErrorListener)
      }

      console.log('ajax ok')

      // Wait server healthUnitsPerState query response
      app.socket.once(
        'healthUnitsPerState',
        /**
         * Add state markers and shapes into map
         * @param results {{healthUnitQuantity: Number, stateName: String}[]}
         */
        function (results) {
          var result, iconSizeCssClass
          for (counter = 0; counter < results.length; counter++) {
            result = results[counter]
            iconSizeCssClass = ((Math.log10(result.healthUnitQuantity) >>> 0) - 2)
            iconSizeCssClass = iconSizeCssClass > 3 ? 3 : iconSizeCssClass

            listeners.stateMarkerDataListener(
              result.stateName,
              layers.stateGeoJson[result.stateName],
              result.healthUnitQuantity,
              iconSizeCssClass
            )
          }
        }
      )

      // Cache data into UI.map
      return {
        leaflet: map,
        layers: layers
      }
    }
  }

  return UI
})
