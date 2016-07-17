;(function (window) {
  'use strict'

  // === Globals ===
  var $ = document
  var gMap = window.google.maps
  var Ajax = window.Ajax
  var socket = window.socketConnection
  var MarkerWithLabel = window.MarkerWithLabel

  // Local variables
  var maps, stateGeoLoc, markers, icons, layer

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
   * Place Markers on each received state location
   * @param data {Object}
   * @param data.state {string}
   * @param data.quantity {number}
   * @returns {*}
   */
  function placeStateMarker (data) {
    var state = data.state
    var quantity = data.quantity
    var icon = getIconInfoByQuantity(quantity)

    markers.states[state] = {
      marker: new MarkerWithLabel({
        position: new gMap.LatLng(stateGeoLoc[state].lat, stateGeoLoc[state].long),
        map: maps,
        draggable: false,
        raiseOnDrag: false,
        labelContent: quantity,
        labelAnchor: icon.position,
        labelClass: 'labels', // the CSS class for the label
        labelInBackground: false,
        icon: icon.url
      }),
      count: quantity,
      infoWindow: null
    }

    socket.emit('get_state_floating_info', state)
  }

  // on additional floating info response
  socket.on('get_state_floating_info_answer', function (data) {
    // Create info window
    markers.states[data.uf].infoWindow = new gMap.InfoWindow({
      content: '<h3>Estado: ' + data.uf + '<h3/>' +
      '<h5>Numero de unidades de saúde: ' + markers.states[data.uf].count + '</h5>'
    })

    // Adiciona eventos para controle da janela de informações
    gMap.event.addListener(markers.states[data.uf].marker, 'mouseover', function (e) {
      markers.states[data.uf].infoWindow.open(maps, this)
    })
    gMap.event.addListener(markers.states[data.uf].marker, 'mouseout', function (e) {
      markers.states[data.uf].infoWindow.close(maps, this)
    })
  })

  // on receive uf names
  socket.on('get_ufs_answer', function (data) {
    data.forEach(function (item) {
      socket.emit('get_uf_locations_count', item)
    })
  })

  // add marker with state data
  socket.on('get_uf_locations_count_answer', placeStateMarker)

  // create map
  maps = new gMap.Map($.querySelector('#map'), {
    center: {lat: -14.433247, lng: -54.3050727},
    zoom: 5,
    disableDefaultUI: true,
    zoomControl: true,
    scaleControl: true,
    rotateControl: true,
    maxZoom: 6,
    minZoom: 3
  })

  // data
  markers = {
    states: {}
  }

  // icons
  icons = {
    l1: 'libs/maps/markerwithlabel/images/m1.png',
    l2: 'libs/maps/markerwithlabel/images/m2.png',
    l3: 'libs/maps/markerwithlabel/images/m3.png',
    l4: 'libs/maps/markerwithlabel/images/m4.png',
    l5: 'libs/maps/markerwithlabel/images/m5.png'
  }

  // highlight Brasil
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

  layer.setMap(maps)

  // Get states geographic location
  new Ajax({url: 'data/stateGeoLocations.json', responseType: 'json'}, true).then(function (data) {
    stateGeoLoc = data.response

    // request locations
    socket.emit('get_ufs')
  }).catch(function (err) {
    console.log(err)
  })
})(typeof window === 'object' ? window : this)

// gMap.event.addListener(marker1, "click", function (e) { iw1.open(map, this); })

// gMap.event.addListener(marker, "click", function (e) { log("Click"); })
// gMap.event.addListener(marker, "dblclick", function (e) { log("Double Click"); })
// gMap.event.addListener(marker, "mouseover", function (e) { log("Mouse Over"); })
// gMap.event.addListener(marker, "mouseout", function (e) { log("Mouse Out"); })
// gMap.event.addListener(marker, "mouseup", function (e) { log("Mouse Up"); })
// gMap.event.addListener(marker, "mousedown", function (e) { log("Mouse Down"); })
// gMap.event.addListener(marker, "dragstart", function (mEvent) { log("Drag Start: " + mEvent.latLng.toString()); })
// gMap.event.addListener(marker, "drag", function (mEvent) { log("Drag: " + mEvent.latLng.toString()); })
// gMap.event.addListener(marker, "dragend", function (mEvent) { log("Drag End: " + mEvent.latLng.toString()); })
