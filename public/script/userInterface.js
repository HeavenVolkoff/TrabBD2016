window.define(['util', 'Ajax', 'Leaflet'], function (_, Ajax, Leaflet) {
  'use strict'

  // UI global variables
  var $, promiseErrorListener, UI
  $ = document
  promiseErrorListener = function (e) { console.error(e) }

  /**
   * User Interface Object
   *
   * Guidelines:
   * - Each property must reference a html element and have a name derived from it
   * - Each property must be a function or object
   * - In case of a function it might receive two parameters (app, data),
   *   and should return an object to take it's place after execution
   * - Exception cases are for meta properties (e.g: id) which must be an object
   * @type {{id: {map: string}, map: UI.map}}
   */
  UI = {
    id: {
      map: 'map',
      sidebarContent: 'sidebar-content'
    },

    /**
     * Leaflet map element
     *
     * @type {{
     *  layers: {
     *    tile: TileLayer,
     *    perMarkers: Object,
     *    stateMarkers: LayerGroup<Leaflet.marker>,
     *    stateGeoJson: {}
     *    statesGeoJson: GeoJSON,
     *  }
     *  leaflet: Map,
     * }}
     */
    map: function (app, data) {
      var map, temp, layers, counter, listeners, mapElement, statesAcronyms,
        stateLayerHoverStyle, stateLayerDefaultStyle, stateLayerHoverStyleNegative

      // Cache states acronyms from data
      statesAcronyms = data.brasilInfo.statesAcronyms

      // === Cache layer style from data and generate undo-style for hover style modifications ===
      stateLayerHoverStyle = data.leaflet.layers.style.stateLayerHover
      stateLayerDefaultStyle = data.leaflet.layers.style.stateLayerDefault
      stateLayerHoverStyleNegative = {}
      for (temp in stateLayerHoverStyle) {
        if (stateLayerHoverStyle.hasOwnProperty(temp) &&
          stateLayerDefaultStyle.hasOwnProperty(temp)
        ) {
          stateLayerHoverStyleNegative[temp] = stateLayerDefaultStyle[temp]
        }
      }

      // === Event functions listeners ===
      listeners = {
        /**
         * Listener to click event on state layer
         * Change view to clicked state and request state health unit data from server
         * @param event {MouseEvent}
         */
        stateLayerClick: function zoomToFeature (event) {
          map.options.minZoom = 0
          map.options.maxZoom = 18
          map.setMaxBounds(null)

          map.once('moveend zoomend', function () {
            map.setMaxBounds(event.target.getBounds())
            map.options.minZoom = map.getZoom()
          })

          map.fitBounds(event.target.getBounds())
        // TODO: request state health unit markers
        },

        /**
         * Listener to mouseout event on state layer
         * Reset state layer hover style (set generated undo-style)
         * @param event {MouseEvent}
         */
        stateLayerMouseOut: function resetHighlight (event) {
          event.target.setStyle(stateLayerHoverStyleNegative)
        },

        /**
         * Listener to mouseover event on state layer
         * Change state layer to hover style
         * @param event {MouseEvent}
         */
        stateLayerMouseOver: function highlightFeature (event) {
          var layer = event.target
          layer.setStyle(stateLayerHoverStyle)
          if (!(Leaflet.Browser.ie || Leaflet.Browser.opera)) {
            layer.bringToFront()
          }
        },

        /**
         * Listener to state geometries ajax requests
         * Add state geometry to state GeoJson layer
         * (stateGeoJsonFeatureListener will be immediately called after addition with the generated layer)
         * @param stateGeoJson {Object}
         */
        stateGeoJsonAjaxRequest: function (stateGeoJson) {
          layers.statesGeoJson.addData(stateGeoJson)
        },

        /**
         * Listener to state GeoJson features (which are the properties of each geometry added to the layer)
         * Cache generated layer and assign event listeners to it
         * @param feature {Leaflet.GeoJSON}
         * @param layer {Leaflet.ILayer}
         */
        stateGeoJsonFeatureListener: function onEachFeature (feature, layer) {
          layers.stateGeoJson[feature.properties.sigla] = layer
          layer.on({
            mouseover: listeners.stateLayerMouseOver,
            mouseout: listeners.stateLayerMouseOut,
            click: listeners.stateLayerClick
          })
        },

        /**
         * Listener to healthUnitsPerState marker data
         * Generate marker and add it to stateMarker layerGroup
         *
         * @param stateName {String}
         * @param stateGeometryLayer {Leaflet.ILayer}
         * @param healthUnitQuantity {Number}
         * @param iconSizeCssClass {Number}
         */
        stateMarkerDataListener: function (stateName, stateGeometryLayer, healthUnitQuantity, iconSizeCssClass) {
          var style
          if (stateGeometryLayer instanceof Promise) {
            stateGeometryLayer.then(function () {
              listeners.stateMarkerDataListener(stateName, stateGeometryLayer, healthUnitQuantity, iconSizeCssClass)
            }).catch(promiseErrorListener)
            return
          }

          style = _.assign({}, stateLayerDefaultStyle)
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

      console.log('listeners declaration ok')

      // Cache map layer objects, for easy access
      layers = {
        tile: Leaflet.tileLayer(data.leaflet.provider, data.leaflet.options),
        perMarkers: {},
        stateMarkers: Leaflet.layerGroup(),
        statesGeoJson: Leaflet.geoJson(null, {
          style: stateLayerDefaultStyle,
          onEachFeature: listeners.stateGeoJsonFeatureListener
        }),
        stateGeoJson: {}
      }

      console.log('layers creation ok')

      // Construct Leaflet map and center to Brasil
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

      console.log('leaflet map creation ok')

      // Ajax requests of states geometries
      for (counter = 0; counter < statesAcronyms.length; counter++) {
        layers.stateGeoJson[statesAcronyms[counter]] =
          Ajax.get(_.format('data/GeoJson/states/{0}.json', statesAcronyms[counter]), 'json')
            .then(listeners.stateGeoJsonAjaxRequest)
            .catch(promiseErrorListener)
      }

      console.log('states geometries ajax request ok')

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
    },
    sideBar: function (app, data) {
      elements = {
        quickInfoHeader: null,
        quickInfoItem: null
      }

      container = $.querySelector('#' + UI.id.sidebarContent)

      Promise.all([
        Ajax.get('import/quickInfoHeaderFragment.html', 'text'),
        Ajax.get('import/quickInfoItemFragment.html', 'text'),
        Ajax.get('import/quickInfoItemFragmentWithHover.html', 'text')
      ]).then(function (htmlArray) {
        elements.quickInfoHeader = htmlArray[0]
        elements.quickInfoItem = htmlArray[1]
        elements.quickInfoItemWithHover = htmlArray[2]
      })

      app.socket.once('getRegionUnitsDistribution', function (data) {
        container.appendChild(_.elementFromString(_.format(elements.quickInfoHeader, 'sidebar-region-distribution-title', 'Unidades de Saúde por Região')))
        var regionDistributionTitle = $.querySelector('#sidebar-region-distribution-title')
        var totalUnits = 0
        var count
        for (count = 0; count < data.length; count++) {
          totalUnits += data[count].numero_unidades
        }
        for (count = 0; count < data.length; count++) {
          regionDistributionTitle.appendChild(_.elementFromString(_.format(
            elements.quickInfoItem,
            'sidebar-region-distribution-' + data[count].regiao,
            data[count].regiao + ':',
            (data[count].numero_unidades / totalUnits * 100).toFixed(2) + '%')))
        }
      })
      app.socket.once('getRegionScoreByCategory', function (data) {
        console.log(data)
        container.appendChild(_.elementFromString(_.format(elements.quickInfoHeader, 'sidebar-region-distribution-score-title', 'Notas por Região')))
        var regionDistributionTitle = $.querySelector('#sidebar-region-distribution-score-title')
        for (var count = 0; count < data.length; count++) {
          if (!$.querySelector('#sidebar-region-distribution-score-' + data[count].regiao)) {
            regionDistributionTitle.appendChild(_.elementFromString(_.format(
              elements.quickInfoItemWithHover,
              'sidebar-region-distribution-score-' + data[count].regiao,
              data[count].regiao,
              parseFloat(data[count].total).toFixed(2)+' / 10')))
          }
          $.querySelector('#sidebar-region-distribution-score-'+data[count].regiao).appendChild(_.elementFromString(_.format(
            elements.quickInfoItem,
            'sidebar-region-distribution-score-'+data[count].regiao+'-item-'+count,
            '• '+data[count].categorias+':',
            parseFloat(data[count].notas).toFixed(2))))
        }
      })
      app.socket.once('getRegionDistributionByType', function (data) {
        console.log(data)
      })
      app.socket.once('getGovernmentControlledUnits', function (data) {
        console.log(data)
      })
      app.socket.once('getAvgUnitCountByOwner', function (data) {
        console.log(data)
      })

      app.socket.emit('getCountryStatistics')
    }
  }

  return UI
})
