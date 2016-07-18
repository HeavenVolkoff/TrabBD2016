;(function (window) {
  'use strict'

  // === Globals ===
  var $ = document
  var gMap = window.google.maps // Will be initialized later
  var Ajax = window.Ajax
  var format = window.formatString
  var socket = window.socketConnection
  var MarkerWithLabel = window.MarkerWithLabel
  var GeoLocationMarker = window.GeolocationMarker

  // Local variables
  var maps, stateGeoLoc, states, healthUnits, icons, layer, geoMarker, geoCoder, zoomControl

  /**
   * Get icon by quantity
   * @param value {number}
   * @returns {{url: string, position: Point}}
   */
  function getIconInfoByQuantity (value) {
    var iconInfo = {url: '', position: null}

    if (value <= 1000) {
      iconInfo.url = icons.l1
      iconInfo.position = new gMap.Point(20, 30)
    } else if (value > 1000 && value <= 10000) {
      iconInfo.url = icons.l2
      iconInfo.position = new gMap.Point(20, 32)
    } else if (value > 10000 && value <= 20000) {
      iconInfo.url = icons.l3
      iconInfo.position = new gMap.Point(20, 37)
    } else if (value > 20000 && value <= 50000) {
      iconInfo.url = icons.l4
      iconInfo.position = new gMap.Point(20, 42)
    } else {
      iconInfo.url = icons.l5
      iconInfo.position = new gMap.Point(20, 48)
    }

    return iconInfo
  }

  /**
   * Hide marker array from the map
   * @param markerList {Array}
   */
  function hideMarkers (markerList) {
    for (var i = 0; i < markerList.length; i++) {
      markerList[i].marker.setMap(null)
    }
  }

  /**
   * Hide all state markers
   */
  function hideAllStatesMarkers () {
    for (var stateName in states) {
      if (states.hasOwnProperty(stateName)) {
        states[stateName].marker.setMap(null)
      }
    }
  }

  /**
   * Show marker array in the map
   * @param markerList {Array}
   */
  function showMarkers (markerList) {
    for (var i = 0; i < markerList.length; i++) {
      markerList[i].marker.setMap(maps)
    }
  }

  /**
   * Show markers of all states
   */
  function showAllStatesMarkers () {
    for (var stateName in states) {
      if (states.hasOwnProperty(stateName)) {
        states[stateName].marker.setMap(maps)
      }
    }
  }

  /**
   * Activate state mode view
   * @param state {string}
   */
  function prepareStateMap (state) {
    hideAllStatesMarkers()

    if (healthUnits.hasOwnProperty(state)) {
      showMarkers(healthUnits[state])
    } else {
      socket.emit('getHealthUnitPosition', state)
    }

    zoomControl.max = 10
    geoCoder.geocode({'address': 'brasil' + state}, function (results, status) {
      if (status === gMap.GeocoderStatus.OK) {
        maps.setCenter(results[0].geometry.location)
        maps.fitBounds(results[0].geometry.viewport)
      }
    })
  }

  /**
   * Place Markers on each received state location
   * @param data {Object}
   * @param data.state {string}
   * @param data.quantity {number}
   */
  function placeStateMarker (stateName, quantity, icon) {
    var stateMarker = new MarkerWithLabel({
      position: new gMap.LatLng(stateGeoLoc[stateName].lat, stateGeoLoc[stateName].long),
      map: maps,
      draggable: false,
      raiseOnDrag: false,
      labelContent: quantity,
      labelAnchor: icon.position,
      labelClass: 'labels', // the CSS class for the label
      labelInBackground: false,
      icon: icon.url
    })

    states[stateName] = {
      marker: stateMarker,
      quantity: quantity,
      infoWindow: null
    }

    // Adiciona eventos para controle do click em cada estado
    gMap.event.addListener(stateMarker, 'click', function () {
      prepareStateMap(stateName)
    })
  }

  function placeInnerStateMarker (stateName, quantity, icon) {
    var healthUnitsMarker = new MarkerWithLabel({
      position: new gMap.LatLng(stateGeoLoc[stateName].lat, stateGeoLoc[stateName].long),
      map: maps,
      draggable: false,
      raiseOnDrag: false,
      labelContent: quantity,
      labelAnchor: icon.position,
      labelClass: 'labels', // the CSS class for the label
      labelInBackground: false,
      icon: icon.url
    })

    healthUnits[stateName] = {
      marker: healthUnitsMarker,
      quantity: quantity,
      infoWindow: null
    }

    // Adiciona eventos para controle do click em cada estado
    gMap.event.addListener(healthUnitsMarker, 'click', function () {
      prepareStateMap(stateName)
    })
  }

  function placeMarkerFloatingBubble (uf, healthUnitInfoArray) {
    var typeInfo = ''
    var state = states[uf]
    var sum = 0

    healthUnitInfoArray.forEach(function (healthUnitInfo) {
      typeInfo += format(
        '<h5 style="margin: 0 auto; line-height: 1.25em;">Unidades de Saúde {0}: {1}%</h5>',
        healthUnitInfo.type,
        ((healthUnitInfo.quantity / state.quantity) * 100).toFixed(2)
      )

      sum += healthUnitInfo.quantity
    })

    if (state.quantity - sum !== 0) {
      typeInfo += format(
        '<h5 style="margin: 0 auto; line-height: 1.25em;">Unidades de Saúde Tipo Desconhecido: {0}%</h5>',
        (((state.quantity - sum) / state.quantity) * 100).toFixed(2)
      )
    }

    // Create info window
    state.infoWindow = new gMap.InfoWindow({
      content: format(
        '<h3>Estado: {0}<h3/>' +
        '<h5 style="margin: 0 auto; line-height: 1.25em;">Numero de unidades de saúde: {1}</h5>' +
        '{2}',
        uf, state.quantity, typeInfo
      )
    })

    // Adiciona eventos para controle da janela de informações
    gMap.event.addListener(state.marker, 'mouseover', function (e) {
      state.infoWindow.open(maps, this)
    })
    gMap.event.addListener(state.marker, 'mouseout', function (e) {
      state.infoWindow.close(maps, this)
    })
  }

  ;(function setUp () {
    // Cache Map's minimum and maximum permitted zoom level
    zoomControl = {
      max: 6,
      min: 3
    }

    // States info cache
    states = {}

    // Health units info cache
    healthUnits = {}

    // Icons Cache
    icons = {
      l1: '/image/mapMarkerIcons/m1.png',
      l2: '/image/mapMarkerIcons/m2.png',
      l3: '/image/mapMarkerIcons/m3.png',
      l4: '/image/mapMarkerIcons/m4.png',
      l5: '/image/mapMarkerIcons/m5.png'
    }

    // Brasil's Highlight Layer
    layer = new gMap.FusionTablesLayer({
      query: {
        select: 'geometry',
        from: '1N2LBk4JHwWpOY4d9fobIn27lfnZ5MDy-NoqqRpk',
        where: "ISO_2DIGIT IN ('BR')"
      },
      styles: [
        {
          polygonOptions: {
            strokeColor: '#FF0000',
            fillOpacity: '0'
          }
        }
      ]
    })

    // Initialize Map
    maps = new gMap.Map($.querySelector('#map'), {
      center: {lat: -14.433247, lng: -54.3050727},
      zoom: 4,
      disableDefaultUI: true,
      zoomControl: true,
      scaleControl: true,
      rotateControl: true
    })

    // Control map zoom level
    gMap.event.addListener(maps, 'zoom_changed', function () {
      if (maps.getZoom() > zoomControl.max) {
        maps.setZoom(zoomControl.max)
      } else if (maps.getZoom() < zoomControl.min) {
        maps.setZoom(zoomControl.min)
      }
    })

    // === Initialize Map Extras ===
    geoCoder = new gMap.Geocoder(maps)
    geoMarker = new GeoLocationMarker(maps)
    layer.setMap(maps)

    // === Socket.IO Listeners ===
    socket.on('countHealthUnitPerType_answer', function countHealthUnitPerTypeListener (data) {
      placeMarkerFloatingBubble(data.uf, data.rows)
    })
    socket.on('getStates_answer', function getStatesListener (data) {
      data.forEach(function (item) {
        socket.emit('countLocalizationsPerState', item)
      })
    })
    socket.on('countLocalizationsPerState_answer', function countLocalizationsPerStateListener (data) {
      placeStateMarker(data.state, data.quantity, getIconInfoByQuantity(data.quantity))
      socket.emit('countHealthUnitPerType', data.state)
    })
    socket.on('getHealthUnitPosition_answer', function getHealthUnitPositionListener (data) {
      console.log(data)
    // placeInnerStateMarker()
    })

    // Get states geographic location
    new Ajax({url: 'data/stateGeoLocations.json', responseType: 'json'}, true)
      .then(function (data) {
        stateGeoLoc = data.response

        // request locations
        socket.emit('getStates')
      })
      .catch(function (err) {
        // TODO: Display Server 500 Error
        console.log(err)
      })
  })()
})(typeof window === 'object' ? window : this)
