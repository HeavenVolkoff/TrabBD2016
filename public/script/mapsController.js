(function (window) {
  'use strict'

  var maps = new window.google.maps.Map(document.getElementById('map'), {
    center: {lat: -34.397, lng: 150.644},
    zoom: 10
  })
})(typeof window === 'object' ? window : this)
