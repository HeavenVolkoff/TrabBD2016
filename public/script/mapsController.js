var markerCluster;

(function (window) {
  'use strict'

  //create map
  var maps = new window.google.maps.Map(document.getElementById('map'), {
    center: {lat:  -14.433247, lng: -54.3050727},
    zoom: 4
  })

  var options = {
    imagePath: 'libs/maps/marker-clusterer/images/m'
  };
  markerCluster = new MarkerClusterer(maps, [], options);

  //request locations
  window.socketConnection.emit('unidadesSaudeLocalizacoes');

  //on receive location chunck
  window.socketConnection.on('unidadesSaudeLocalizacoesAnswer', function (data) {
    data[0].forEach(function (item) {
      markerCluster.addMarker(new window.google.maps.Marker({
        position: new window.google.maps.LatLng(item[0], item[1])
      }));
    })
  });


})(typeof window === 'object' ? window : this)
