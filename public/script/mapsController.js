;(function (window) {
  'use strict'

  // === Globals ===
  var $ = document
  var gMap = window.google.maps
  var Ajax = window.Ajax
  var socket = window.socketConnection
  var MarkerWithLabel = window.MarkerWithLabel
  var geocoder = new google.maps.Geocoder();
  var maxZoom = 6;
  var minZoom = 3;

  // Local variables
  var maps, stateGeoLoc, markers, icons, layer, GeoMarker, stateBounds

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
  function hideMarkers(markerList){
    for (var i = 0; i < markerList.length; i++) {
      markerList[i].marker.setMap(null);
    }
  }

  /**
   * Hide markers of all states
   */
  function hideAllStatesMarkers(){
    for (var stateName in markers.states) {
      if (markers.states.hasOwnProperty(stateName)) {
        hideMarkers([markers.states[stateName]]);
      }
    }
  }

  /**
   * Show marker array in the map
   * @param markerList {Array}
   */
  function showMarkers(markerList){
    for (var i = 0; i < markerList.length; i++) {
      markerList[i].marker.setMap(maps);
    }
  }

  /**
   * Show markers of all states
   */
  function showAllStatesMarkers(){
    for (var stateName in markers.states) {
      if (markers.states.hasOwnProperty(stateName)) {
        showMarkers([markers.states[stateName]]);
      }
    }
  }

  /**
   * Activate state mode view
   * @param state {string}
   */
  function prepareStateMap(state){
    hideAllStatesMarkers();
    if(markers.healthUnits.hasOwnProperty(state)){
      showMarkers(markers.healthUnits[state])
    }else{
      socket.emit('get_state_health_units_pos', state);
    }
    maxZoom = 10;
    geocoder.geocode( { 'address': 'brasil'+state}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        maps.setCenter(results[0].geometry.location);
        maps.fitBounds(results[0].geometry.viewport);
      }
    });
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

    // Adiciona eventos para controle do click em cada estado
    gMap.event.addListener(markers.states[state].marker, 'click', function (e) {
      prepareStateMap(state);
    })

    socket.emit('get_state_floating_info', state)
  }

  /**
   * Place Markers on each received state location
   * @param data {Object}
   * @param data.state {string}
   * @param data.quantity {number}
   * @returns {*}
   */
  function placeInnerStateMarker (data) {
    console.log(data)
    // var state = data.state
    // var quantity = data.quantity
    // var icon = getIconInfoByQuantity(quantity) //getIconInfoByType
    //
    // markers.healthUnits[state] = {
    //   marker: new MarkerWithLabel({
    //     position: new gMap.LatLng(stateGeoLoc[state].lat, stateGeoLoc[state].long),
    //     map: maps,
    //     draggable: false,
    //     raiseOnDrag: false,
    //     labelContent: quantity,
    //     labelAnchor: icon.position,
    //     labelClass: 'labels', // the CSS class for the label
    //     labelInBackground: false,
    //     icon: icon.url
    //   }),
    //   count: quantity,
    //   infoWindow: null
    // }
    //
    // // Adiciona eventos para controle do click em cada estado
    // gMap.event.addListener(markers.states[state].marker, 'click', function (e) {
    //   prepareStateMap(state);
    // })
    //
    // socket.emit('get_state_floating_info', state)
  }

  // on additional floating info response
  socket.on('get_state_floating_info_answer', function (data) {
    var uf = data.uf;
    var rows = data.rows;

    //create type info string
    var typeInfo = ""
    var sum = 0;
    rows.forEach(function (item) {
      typeInfo += '<h5 style="margin: 0 auto; line-height: 1.25em;">Unidades de Saúde '+item.descricao+': ' + ((item.count/markers.states[uf].count)*100).toFixed(2) + '%</h5>'
      sum += item.count;
    })
    if(markers.states[uf].count - sum != 0){
      typeInfo += '<h5 style="margin: 0 auto; line-height: 1.25em;">Unidades de Saúde Tipo Desconhecido: ' + (((markers.states[uf].count - sum)/markers.states[uf].count)*100).toFixed(2) + '%</h5>'
    }

    // Create info window
    markers.states[uf].infoWindow = new gMap.InfoWindow({
      content: '<h3>Estado: ' + uf + '<h3/>' +
      '<h5 style="margin: 0 auto; line-height: 1.25em;">Numero de unidades de saúde: ' + markers.states[uf].count + '</h5>'+
      typeInfo
    })

    // Adiciona eventos para controle da janela de informações
    gMap.event.addListener(markers.states[uf].marker, 'mouseover', function (e) {
      markers.states[uf].infoWindow.open(maps, this)
    })
    gMap.event.addListener(markers.states[uf].marker, 'mouseout', function (e) {
      markers.states[uf].infoWindow.close(maps, this)
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

  // add inner state marker
  socket.on('get_state_health_units_pos_answer', placeInnerStateMarker)

  // create map
  maps = new gMap.Map($.querySelector('#map'), {
    center: {lat: -14.433247, lng: -54.3050727},
    zoom: 4,
    disableDefaultUI: true,
    zoomControl: true,
    scaleControl: true,
    rotateControl: true,
  })

  GeoMarker = new GeolocationMarker(maps);

  // data
  markers = {
    states: {},
    healthUnits: {}
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

  google.maps.event.addListener(maps, 'zoom_changed', function() {
    if (maps.getZoom() > maxZoom) {
      maps.setZoom(maxZoom)
    } else if(maps.getZoom() < minZoom){
      maps.setZoom(minZoom)
    }
  });
})(typeof window === 'object' ? window : this)