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
         * @param stateGeometry {Leaflet.ILayer}
         * @param healthUnitQuantity {Number}
         * @param iconSizeCssClass {Number}
         */
        stateMarkerDataListener: function (stateName, healthUnitQuantity, iconSizeCssClass) {
          var style, stateGeometry
          stateGeometry = layers.stateGeoJson[stateName]

          if (stateGeometry instanceof Promise) {
            stateGeometry.then(function () {
              listeners.stateMarkerDataListener(stateName, healthUnitQuantity, iconSizeCssClass)
            }).catch(promiseErrorListener)
            return
          }

          style = _.assign({}, stateLayerDefaultStyle)
          style.fillColor = data.leaflet.layers.style.colorsPerState[iconSizeCssClass]
          stateGeometry.setStyle(style)

          layers.stateMarkers.addLayer(Leaflet.marker(
            stateName === 'PE' ? data.brasilInfo.positionFix['PE'] : stateGeometry.getBounds().getCenter(),
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
      var container, listeners, htmlAjaxRequest
      htmlAjaxRequest = Promise.props({
        quickInfoItem: Ajax.get('import/quickInfoItemFragment.html', 'text'),
        quickInfoHeader: Ajax.get('import/quickInfoHeaderFragment.html', 'text'),
        quickInfoItemWithHover: Ajax.get('import/quickInfoItemFragmentWithHover.html', 'text')
      })

      container = $.querySelector('#' + UI.id.sidebarContent)

      listeners = {
        unitsPerRegion: function (quickInfoHeader, quickInfoItem, unitsPerRegion) {
          var elementHeader, totalUnits, i
          elementHeader = _.elementFromString(_.format(
            quickInfoHeader,
            'Unidades de Saúde por Região'
          ))

          for (totalUnits = 0, i = 0; i < unitsPerRegion.length; i++) {
            totalUnits += unitsPerRegion[i].quantity
          }

          for (i = 0; i < unitsPerRegion.length; i++) {
            elementHeader.appendChild(_.elementFromString(_.format(
              quickInfoItem,
              unitsPerRegion[i].regionName + ':',
              (unitsPerRegion[i].quantity / totalUnits * 100).toFixed(2) + '%'
            )))
          }

          container.appendChild(elementHeader)
        },

        regionScoreByCategory: function (quickInfoHeader, quickInfoItem, quickInfoItemWithHover, regionScoreByCategory) {
          var elementHeader, elementHoverItem, i, j, categories, scores, scoresByCategories, average
          elementHeader = _.elementFromString(_.format(
            quickInfoHeader,
            'Média das Notas por Região'
          ))

          for (i = 0; i < regionScoreByCategory.length; i++) {
            scores = ('' + regionScoreByCategory[i].score).split('$$')
            categories = ('' + regionScoreByCategory[i].categories).split('$$')
            scoresByCategories = new Array(categories.length)

            for (j = 0, average = 0; j < categories.length; j++) {
              scoresByCategories[j] = {
                score: +(+scores[j]).toFixed(2),
                categories: '' + categories[j]
              }

              average += +scores[j]
            }

            scoresByCategories.sort(function (left, right) {
              left = left.categories
              right = right.categories
              return left === right ? 0 : left < right ? -1 : 1
            })

            elementHoverItem = _.elementFromString(_.format(
              quickInfoItemWithHover,
              regionScoreByCategory[i].regionName,
              (average / scores.length).toFixed(2) + '/ 10'
            ))

            for (j = 0; j < scoresByCategories.length; j++) {
              elementHoverItem.appendChild(_.elementFromString(_.format(
                quickInfoItem,
                '• ' + scoresByCategories[j].categories + ':',
                scoresByCategories[j].score
              )))
            }

            elementHeader.appendChild(elementHoverItem)
          }

          container.appendChild(elementHeader)
        },

        governmentControlledUnits: function (quickInfoHeader, quickInfoItem, governmentControlledUnits) {
          var elementHeader
          elementHeader = _.elementFromString(_.format(
            quickInfoHeader,
            'Unidades de Saúde por Administrador'
          ))

          governmentControlledUnits.total = +governmentControlledUnits.total
          governmentControlledUnits.quantity = +governmentControlledUnits.quantity

          elementHeader.appendChild(_.elementFromString(_.format(
            quickInfoItem,
            'Governo:',
            (governmentControlledUnits.quantity / governmentControlledUnits.total * 100).toFixed(2) + '%'
          )))

          elementHeader.appendChild(_.elementFromString(_.format(
            quickInfoItem,
            'Não Governamental:',
            ((governmentControlledUnits.total - governmentControlledUnits.quantity) /
            governmentControlledUnits.total * 100).toFixed(2) + '%'
          )))

          container.appendChild(elementHeader)
        },

        unityQuantity: function (quickInfoHeader, quickInfoItem, unityQuantity) {
          var elementHeader
          elementHeader = _.elementFromString(_.format(
            quickInfoHeader,
            'Quantidade de Unidades de Saúde'
          ))

          elementHeader.appendChild(_.elementFromString(_.format(
            quickInfoItem,
            'Total:',
            unityQuantity.quantity + ' unidades'
          )))

          container.appendChild(elementHeader)
        }
      }

      app.socket.once('getUnitsPerRegion', function (unitsPerRegion) {
        htmlAjaxRequest.then(function (elementsPrototype) {
          listeners.unitsPerRegion(
            elementsPrototype.quickInfoHeader,
            elementsPrototype.quickInfoItem,
            unitsPerRegion
          )
        })
      })

      app.socket.once('getRegionScoreByCategory', function (regionScoreByCategory) {
        htmlAjaxRequest.then(function (elementsPrototype) {
          listeners.regionScoreByCategory(
            elementsPrototype.quickInfoHeader,
            elementsPrototype.quickInfoItem,
            elementsPrototype.quickInfoItemWithHover,
            regionScoreByCategory
          )
        })
      })

      app.socket.once('getGovernmentControlledUnits', function (governmentControlledUnits) {
        htmlAjaxRequest.then(function (elementsPrototype) {
          listeners.governmentControlledUnits(
            elementsPrototype.quickInfoHeader,
            elementsPrototype.quickInfoItem,
            governmentControlledUnits
          )
        })
      })

      app.socket.once('getUnitQuantity', function (unitQuantity) {
        htmlAjaxRequest.then(function (elementsPrototype) {
          listeners.unityQuantity(
            elementsPrototype.quickInfoHeader,
            elementsPrototype.quickInfoItem,
            unitQuantity
          )
        })
      })

      app.socket.emit('getCountryStatistics')

      return {}
    }
  }

  return UI
})
