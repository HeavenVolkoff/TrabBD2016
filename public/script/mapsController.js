(function (window) {
  'use strict'

  var maps = new window.google.maps.Map(document.getElementById('map'), {
    center: {lat: -34.397, lng: 150.644},
    zoom: 10
  })

  var marker = new Marker({
    map: maps,
    position: new window.google.maps.LatLng(-34.397, 150.644),
    icon: {
      path: MAP_PIN,
      fillColor: '#642BB1',
      fillOpacity: 1,
      strokeColor: '',
      strokeWeight: 0
    },
    map_icon_label: '<span class="map-icon map-icon-point-of-interest"></span>'
  });
})(typeof window === 'object' ? window : this)
