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
        stateLayerHoverStyle, stateLayerDefaultStyle, stateLayerHoverStyleNegative,
        popUpInfoRequest, focus, focusEnum

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

      focusEnum = {COUNTRY: 'country'}
      focus = focusEnum.COUNTRY

      // === Event functions listeners ===
      listeners = {
        /**
         * Listener to click event on state layer
         * Change view to clicked state and request state health unit data from server
         * @param event {MouseEvent}
         */
        stateLayerClick: function zoomToFeature (event, layer) {
          layer = layer || event.target

          if (focus !== focusEnum.COUNTRY && focus !== layer.feature.properties.sigla) {
            focus = focusEnum.COUNTRY
            map.options.minZoom = 0
            map.options.maxZoom = 18
            map.setMaxBounds(null)

            map.once('moveend zoomend', function () {
              map.options.minZoom = data.brasilInfo.zoom.min
              map.options.maxZoom = data.brasilInfo.zoom.max
              map.setMaxBounds(map.getBounds())
            })

            map.setView(data.brasilInfo.center, data.brasilInfo.zoom.min)
            return
          }

          focus = layer.feature.properties.sigla
          app.socket.emit('getHealthUnitPosition', focus)

          map.options.minZoom = 0
          map.options.maxZoom = 18
          map.setMaxBounds(null)

          layer.popUp.removeFrom(map)

          map.once('moveend zoomend', function () {
            map.setMaxBounds(layer.getBounds())
            map.options.minZoom = map.getZoom()
          })

          map.fitBounds(layer.getBounds())
        // TODO: request state health unit markers
        },

        /**
         * Listener to mouseout event on state layer
         * Reset state layer hover style (set generated undo-style)
         * @param event {MouseEvent}
         */
        stateLayerMouseOut: function resetHighlight (event, layer) {
          layer = layer || event.target
          layer.setStyle(stateLayerHoverStyleNegative)
          layer.popUp.removeFrom(map)
        },

        /**
         * Listener to mouseover event on state layer
         * Change state layer to hover style
         * @param event {MouseEvent}
         */
        stateLayerMouseOver: function highlightFeature (event, layer) {
          layer = layer || event.target
          if (focus !== focusEnum.COUNTRY || layer.popUp.isOpen()) return

          layer.setStyle(stateLayerHoverStyle)

          if (!(Leaflet.Browser.ie || Leaflet.Browser.opera)) {
            layer.bringToFront()
          }

          layer.popUp.openOn(map)
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

          popUpInfoRequest.then(function (popUps) {
            layer.popUp = popUps[feature.properties.sigla].setLatLng(layer.getCenter())
          })
        },

        /**
         * Listener to healthUnitsPerState marker data
         * Generate marker and add it to stateMarker layerGroup
         *
         * @param stateName {String}
         * @param healthUnitQuantity {Number}
         * @param iconSizeCssClass {Number}
         */
        stateMarkerDataListener: function (stateName, healthUnitQuantity, iconSizeCssClass) {
          var style, stateGeometry, marker
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

          layers.stateMarkers.addLayer(marker = Leaflet.marker(
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

          marker.on({
            // mouseover: _.bind(listeners.stateLayerMouseOver, null, stateGeometry), TODO: FIX
            // mouseout: _.bind(listeners.stateLayerMouseOut, null, stateGeometry), TODO: FIX
            click: _.bind(listeners.stateLayerClick, null, stateGeometry)
          })
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

      popUpInfoRequest = Promise.props({
        popUpTitle: Ajax.get('import/popupTitle.html', 'text'),
        popUpItemTitle: Ajax.get('import/popupItemTitle.html', 'text'),
        popUpItem: Ajax.get('import/popupItem.html', 'text')
      }).then(function (popUpHTML) {
        var popUp, stateAcronym
        popUp = {}
        for (stateAcronym in data.states) {
          popUp[stateAcronym] = Leaflet
            .popup({className: 'popup'})
            .setContent(_.elementFromString(_.format(
              popUpHTML.popUpTitle,
              data.states[stateAcronym]
            )))
        }

        popUp.html = popUpHTML

        return popUp
      }).catch(promiseErrorListener)

      console.log('popUp html request ok')

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
          app.socket.emit('getStatePopupData')
        }
      )

      app.socket.once('countHealthUnitPerType', function (countHealthUnitPerType) {
        popUpInfoRequest.then(function (popUps) {
          var types, quantities, quantitiesByCategories, i, j, popUp

          for (i = 0; i < countHealthUnitPerType.length; i++) {
            popUp = popUps[countHealthUnitPerType[i].acronym].getContent()
            popUp.appendChild(_.elementFromString(_.format(
              popUps.html.popUpItemTitle,
              'UBS Por Tipo de Gestão:',
              ''
            )))
            quantities = ('' + countHealthUnitPerType[i].quantity).split('$$')
            types = ('' + countHealthUnitPerType[i].type).split('$$')
            quantitiesByCategories = new Array(types.length)

            for (j = 0; j < types.length; j++) {
              quantitiesByCategories[j] = {
                quantity: quantities[j] >>> 0,
                type: '' + types[j]
              }
            }

            quantitiesByCategories.sort(function (left, right) {
              left = left.category
              right = right.category
              return left === right ? 0 : left < right ? -1 : 1
            })

            for (j = 0; j < quantitiesByCategories.length; j++) {
              popUp.appendChild(_.elementFromString(_.format(
                popUps.html.popUpItem,
                quantitiesByCategories[j].type,
                quantitiesByCategories[j].quantity
              )))
            }
          }
        })
      })

      app.socket.once('stateUnitsScoreAvg', function (stateUnitsScoreAvg) {
        popUpInfoRequest.then(function (popUps) {
          var categories, scores, average, scoresByCategories, i, j, popUp
          for (i = 0; i < stateUnitsScoreAvg.length; i++) {
            popUp = popUps[stateUnitsScoreAvg[i].acronyms].getContent()
            scores = ('' + stateUnitsScoreAvg[i].score).split('$$')
            categories = ('' + stateUnitsScoreAvg[i].category).split('$$')
            scoresByCategories = new Array(categories.length)

            for (j = 0, average = 0; j < categories.length; j++) {
              scoresByCategories[j] = {
                score: +(+scores[j]).toFixed(2),
                category: '' + categories[j]
              }

              average += +scores[j]
            }

            scoresByCategories.sort(function (left, right) {
              left = left.categories
              right = right.categories
              return left === right ? 0 : left < right ? -1 : 1
            })

            popUp.appendChild(_.elementFromString(_.format(
              popUps.html.popUpItemTitle,
              'Avaliação Media das UBS:',
              (average / scores.length).toFixed(2) + '/ 10'
            )))

            for (j = 0; j < scoresByCategories.length; j++) {
              popUp.appendChild(_.elementFromString(_.format(
                popUps.html.popUpItem,
                scoresByCategories[j].category,
                scoresByCategories[j].score
              )))
            }
          }
        })
      })

      app.socket.on('getHealthUnitPosition_answer', function (results) {
        var healthUnitPositions, i, healthUnit, marker
        if (focus !== results.uf) return
        healthUnitPositions = results.rows
        console.log('YEY')

        for (i = 0; i < healthUnitPositions.length; i++) {
          healthUnit = healthUnitPositions[i]

          layers.stateMarkers.addLayer(marker = Leaflet.marker(
            healthUnit,
            {
              icon: Leaflet.divIcon({
                className: 'mapMarker',
                html: _.format(data.leaflet.layers.makers.healthUnitPerStateHTML,
                  '-', ''
                )
              })
            })
          )
        }
      })

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
