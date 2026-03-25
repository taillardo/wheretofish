export default function getMapHtml(lat, lng, zoom) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; }
    html, body, #map { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      zoomControl: false,
      attributionControl: true,
    }).setView([${lat}, ${lng}], ${zoom});

    // Esri marine base with bathymetry tint
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 13,
      attribution: 'Tiles &copy; Esri &mdash; GEBCO, NOAA, National Geographic, DeLorme, HERE'
    }).addTo(map);

    // Esri reference labels for ocean names and depth annotations
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Reference/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 13,
      opacity: 0.95,
      attribution: 'Labels &copy; Esri'
    }).addTo(map);

    // OpenSeaMap seamarks on top for buoys/charts symbols
    L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', {
      maxZoom: 18,
      opacity: 0.9,
      attribution: '&copy; OpenSeaMap'
    }).addTo(map);

    // GPS position marker
    var gpsCircle = L.circleMarker([${lat}, ${lng}], {
      radius: 8,
      color: '#ffffff',
      weight: 3,
      fillColor: '#2196F3',
      fillOpacity: 1
    }).addTo(map);

    // Accuracy circle
    var accuracyCircle = L.circle([${lat}, ${lng}], {
      radius: 50,
      color: '#2196F3',
      fillColor: '#2196F3',
      fillOpacity: 0.1,
      weight: 1
    }).addTo(map);

    // Heading indicator (triangle)
    var headingMarker = null;

    function createHeadingIcon(heading) {
      return L.divIcon({
        className: '',
        html: '<div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-bottom:18px solid #1565C0;transform:rotate(' + heading + 'deg);transform-origin:center center;"></div>',
        iconSize: [12, 18],
        iconAnchor: [6, 9]
      });
    }

    var followMode = true;

    map.on('dragstart', function() {
      followMode = false;
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'followMode', value: false }));
    });

    // Listen for messages from React Native
    window.addEventListener('message', handleMessage);
    document.addEventListener('message', handleMessage);

    function handleMessage(event) {
      try {
        var data = JSON.parse(event.data);

        if (data.type === 'locationUpdate') {
          var latlng = [data.latitude, data.longitude];
          gpsCircle.setLatLng(latlng);

          if (data.accuracy) {
            accuracyCircle.setLatLng(latlng);
            accuracyCircle.setRadius(data.accuracy);
          }

          if (data.heading != null && data.heading >= 0) {
            if (headingMarker) {
              headingMarker.setLatLng(latlng);
              headingMarker.setIcon(createHeadingIcon(data.heading));
            } else {
              headingMarker = L.marker(latlng, { icon: createHeadingIcon(data.heading) }).addTo(map);
            }
          }

          if (followMode) {
            map.setView(latlng, map.getZoom(), { animate: true });
          }
        }

        if (data.type === 'centerOnUser') {
          followMode = true;
          map.setView(gpsCircle.getLatLng(), Math.max(map.getZoom(), 14), { animate: true });
        }
      } catch(e) {}
    }
  </script>
</body>
</html>`;
}
