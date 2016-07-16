(function (window) {
  'use strict'

  //create map
  var maps = new window.google.maps.Map(document.getElementById('map'), {
    center: {lat:  -14.433247, lng: -54.3050727},
    zoom: 4,
    disableDefaultUI: true,
    zoomControl: true,
    scaleControl: true,
    rotateControl: true,
    maxZoom: 6,
    minZoom: 3
  })

  //states geolocation
  var stateGeoLoc;
  (new window.Ajax({url: 'data/stateGeoLocations.json', responseType: 'json'}, true)).then(function(data) {
    stateGeoLoc = data.response;
    //request locations
    window.socketConnection.emit('get_ufs');
  }).catch(function (err) {
    console.log(err);
  })

  //data
  var markers = {
    states: {}
  }

  //icons
  var icons = {
    l1: 'libs/maps/markerwithlabel/images/m1.png',
    l2: 'libs/maps/markerwithlabel/images/m2.png',
    l3: 'libs/maps/markerwithlabel/images/m3.png',
    l4: 'libs/maps/markerwithlabel/images/m4.png',
    l5: 'libs/maps/markerwithlabel/images/m5.png',
  };

  //get icon by data size
  function getRightIcon(value){
    if(value <= 1000){
      return icons.l1;
    }else if(value > 1000 && value <= 10000){
      return icons.l2;
    }else if(value > 10000 && value <= 20000){
      return icons.l3;
    }else if(value > 20000 && value <= 50000){
      return icons.l4;
    }else {
      return icons.l5;
    }
  }

  //get icon pos by data size
  function getRightLabelPos(value){
    if(value <= 1000){
      return new window.google.maps.Point(20, 27);
    }else if(value > 1000 && value <= 10000){
      return new window.google.maps.Point(20, 32);
    }else if(value > 10000 && value <= 20000){
      return new window.google.maps.Point(20, 37);
    }else if(value > 20000 && value <= 50000){
      return new window.google.maps.Point(20, 42);
    }else {
      return new window.google.maps.Point(20, 48);
    }
  }

  //on receive locations for a given UF
  function placeStateMarker(data){
    markers.states[data[0]] = {
      marker: new MarkerWithLabel({
        position: new window.google.maps.LatLng(stateGeoLoc[data[0]].lat, stateGeoLoc[data[0]].long),
        map: maps,
        draggable: false,
        raiseOnDrag: false,
        labelContent: data[1],
        labelAnchor: getRightLabelPos(data[1]),
        labelClass: "labels", // the CSS class for the label
        labelInBackground: false,
        icon: getRightIcon(data[1]),
      }),
      count: data[1],
      infoWindow: null
    };
    window.socketConnection.emit('get_state_floating_info', data[0]);
    return markers.states[data[0]]
  }

  //create hover info window
  function createInfoWindow(content){
     return new google.maps.InfoWindow({
       content: content
     });
  }

  //on aditional floating info response
  window.socketConnection.on('get_state_floating_info_answer', function(data){
    console.log(data);
    //Create info window
    markers.states[data[0]].infoWindow = createInfoWindow(
      '<h3>Estado: '+data[0]+'<h3/>' +
      '<h5>Numero de unidades de saúde: '+markers.states[data[0]].count+'</h5>'
    )
    //Adiciona eventos para controle da janela de informações
    window.google.maps.event.addListener(markers.states[data[0]].marker, "mouseover", function(e){
      markers.states[data[0]].infoWindow.open(maps, this);
    });
    window.google.maps.event.addListener(markers.states[data[0]].marker, "mouseout", function(e){
      markers.states[data[0]].infoWindow.close(maps, this);
    });
  })

  //highlight Brasil
  var layer = new window.google.maps.FusionTablesLayer({
    query: {
      select: 'geometry',
      from: '1N2LBk4JHwWpOY4d9fobIn27lfnZ5MDy-NoqqRpk',
      where: "ISO_2DIGIT IN ('BR')"
    },
    styles: [
      {
        polygonOptions: {
          strokeColor: "#FF0000",
          fillOpacity: "0"
        }
      }
    ]
  });
  layer.setMap(maps);

  //on receive uf names
  window.socketConnection.on('get_ufs_answer', function (data) {
    data[0].forEach(function (item) {
      window.socketConnection.emit('get_uf_locations_count', item[0]);
    });
  })

  //add marker with state data
  window.socketConnection.on('get_uf_locations_count_answer', function (data) {
    placeStateMarker(data[0][0])
  });

})(typeof window === 'object' ? window : this)


// google.maps.event.addListener(marker1, "click", function (e) { iw1.open(map, this); });

// google.maps.event.addListener(marker, "click", function (e) { log("Click"); });
// google.maps.event.addListener(marker, "dblclick", function (e) { log("Double Click"); });
// google.maps.event.addListener(marker, "mouseover", function (e) { log("Mouse Over"); });
// google.maps.event.addListener(marker, "mouseout", function (e) { log("Mouse Out"); });
// google.maps.event.addListener(marker, "mouseup", function (e) { log("Mouse Up"); });
// google.maps.event.addListener(marker, "mousedown", function (e) { log("Mouse Down"); });
// google.maps.event.addListener(marker, "dragstart", function (mEvent) { log("Drag Start: " + mEvent.latLng.toString()); });
// google.maps.event.addListener(marker, "drag", function (mEvent) { log("Drag: " + mEvent.latLng.toString()); });
// google.maps.event.addListener(marker, "dragend", function (mEvent) { log("Drag End: " + mEvent.latLng.toString()); });