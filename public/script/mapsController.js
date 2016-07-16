(function (window) {
  'use strict'

  var markers = {
    states: {}
  }

  var icons = {
    l1: 'libs/maps/markerwithlabel/images/m1.png',
    l2: 'libs/maps/markerwithlabel/images/m2.png',
    l3: 'libs/maps/markerwithlabel/images/m3.png',
    l4: 'libs/maps/markerwithlabel/images/m4.png',
    l5: 'libs/maps/markerwithlabel/images/m5.png',
  };

  function getRightIcon(value){
    if(value <= 100){
      return icons.l1;
    }else if(value > 100 && value <= 1000){
      return icons.l2;
    }else if(value > 1000 && value <= 10000){
      return icons.l3;
    }else if(value > 10000 && value <= 20000){
      return icons.l4;
    }else {
      return icons.l5;
    }
  }

  function getRightLabelPos(value){
    if(value <= 100){
      return new google.maps.Point(20, 27);
    }else if(value > 100 && value <= 1000){
      return new google.maps.Point(20, 32);
    }else if(value > 1000 && value <= 10000){
      return new google.maps.Point(20, 37);
    }else if(value > 10000 && value <= 20000){
      return new google.maps.Point(20, 42);
    }else {
      return new google.maps.Point(20, 48);
    }
  }

  //create map
  var maps = new window.google.maps.Map(document.getElementById('map'), {
    center: {lat:  -14.433247, lng: -54.3050727},
    zoom: 4
  })

  //geocoder
  var geocoder = new window.google.maps.Geocoder();

  //request locations
  window.socketConnection.emit('get_ufs');

  //on receive uf names
  window.socketConnection.on('get_ufs_answer', function (data) {
    data[0].forEach(function (item) {
      window.socketConnection.emit('get_uf_locations_count', item[0]);
    });
  })

  //on receive locations for a given UF
  function placeStateMarker(data){
    geocoder.geocode({'address': 'brasil, '+data[0]}, function(results, status) {
      if (status == window.google.maps.GeocoderStatus.OK)
      {
        markers.states[data[0]] = new MarkerWithLabel({
          position: new google.maps.LatLng(results[0].geometry.location.lat(),results[0].geometry.location.lng()),
          map: maps,
          draggable: false,
          raiseOnDrag: false,
          labelContent: data[1],
          labelAnchor: getRightLabelPos(data[1]),
          labelClass: "labels", // the CSS class for the label
          labelInBackground: false,
          icon: getRightIcon(data[1]),
        });
      }else{
        window.socketConnection.emit('get_uf_locations_count', data[0]);
      }
    });
  }
  window.socketConnection.on('get_uf_locations_count_answer', function (data) {
    placeStateMarker(data[0][0]);
  });

})(typeof window === 'object' ? window : this)
