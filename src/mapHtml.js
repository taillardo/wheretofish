export default function getMapHtml(lat, lng, zoom, wmsConfig) {
  const wmsUrl = wmsConfig.baseUrl;

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

    /* Layer control styling */
    .leaflet-control-layers {
      background: rgba(26, 26, 46, 0.95) !important;
      border: 1px solid #2a2a4a !important;
      border-radius: 8px !important;
      color: #e0e6f0 !important;
      padding: 8px 12px !important;
      max-height: 70vh;
      overflow-y: auto;
    }
    .leaflet-control-layers-toggle {
      width: 36px !important;
      height: 36px !important;
      background-color: rgba(26, 26, 46, 0.95) !important;
      border: 1px solid #2a2a4a !important;
      border-radius: 8px !important;
      background-size: 20px 20px !important;
    }
    .leaflet-control-layers label {
      color: #e0e6f0 !important;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 13px;
      padding: 3px 0;
      display: flex !important;
      align-items: center;
      gap: 6px;
    }
    .leaflet-control-layers-separator {
      border-top-color: #2a2a4a !important;
      margin: 6px 0 !important;
    }
    .leaflet-control-layers-group-name {
      font-weight: 700;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #6e7891;
      padding: 4px 0 2px;
    }

    /* Attribution styling */
    .leaflet-control-attribution {
      background: rgba(26, 26, 46, 0.8) !important;
      color: #6e7891 !important;
      font-size: 10px !important;
    }
    .leaflet-control-attribution a {
      color: #2196F3 !important;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var wmsUrl = ${JSON.stringify(wmsUrl)};
    var wmsVersion = ${JSON.stringify(wmsConfig.version)};
    var wmsSrs = ${JSON.stringify(wmsConfig.srs)};
    var wmsFormat = ${JSON.stringify(wmsConfig.format)};

    var map = L.map('map', {
      zoomControl: false,
      attributionControl: true,
    }).setView([${lat}, ${lng}], ${zoom});

    // --- Base Layers ---

    var osmBase = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap'
    });

    // Esri Ocean base (bathymetry tint + reference labels)
    var esriOceanBase = L.layerGroup([
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 13,
        attribution: 'Tiles &copy; Esri &mdash; GEBCO, NOAA, National Geographic'
      }),
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Reference/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 13,
        opacity: 0.95,
        attribution: 'Labels &copy; Esri'
      })
    ]);

    function wmsLayer(layers, options) {
      var params = {
        layers: layers,
        format: wmsFormat,
        transparent: true,
        version: wmsVersion,
        srs: wmsSrs,
        attribution: '&copy; ChartWorld / SevenCs'
      };
      if (options) {
        for (var k in options) params[k] = options[k];
      }
      return L.tileLayer.wms(wmsUrl, params);
    }

    // Full ENC chart (opaque base)
    var encBase = wmsLayer('ENC', { transparent: false, format: 'image/jpg' });

    // --- GIS Overlay Layers (transparent) ---

    var depthsLayer = wmsLayer('GIS-ENC-DEPTHS');
    var navAidsLayer = wmsLayer('GIS-ENC-NAVAIDS');
    var navAreasLayer = wmsLayer('GIS-ENC-NAVAREAS');
    var topoLayer = wmsLayer('GIS-ENC-TOPO');
    var hazardsLayer = wmsLayer('GIS-ENC-UDWHAZ');
    var cablesLayer = wmsLayer('GIS-ENC-CBLPIP');

    // OpenSeaMap overlay
    var openSeaMap = L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', {
      maxZoom: 18,
      opacity: 0.9,
      attribution: '&copy; OpenSeaMap'
    });

    // --- Default active layers ---
    encBase.addTo(map);

    // --- Layer Control ---

    var baseLayers = {
      'ChartWorld ENC': encBase,
      'Esri Ocean': esriOceanBase,
      'OpenStreetMap': osmBase
    };

    var overlays = {
      'Depths & Soundings': depthsLayer,
      'Navigational Aids': navAidsLayer,
      'Navigational Areas': navAreasLayer,
      'Underwater Hazards': hazardsLayer,
      'Topography': topoLayer,
      'Pipes & Cables': cablesLayer,
      'OpenSeaMap': openSeaMap
    };

    L.control.layers(baseLayers, overlays, {
      position: 'topright',
      collapsed: true
    }).addTo(map);

    // --- GPS Position Marker ---

    var gpsCircle = L.circleMarker([${lat}, ${lng}], {
      radius: 8,
      color: '#ffffff',
      weight: 3,
      fillColor: '#2196F3',
      fillOpacity: 1
    }).addTo(map);

    var accuracyCircle = L.circle([${lat}, ${lng}], {
      radius: 50,
      color: '#2196F3',
      fillColor: '#2196F3',
      fillOpacity: 0.1,
      weight: 1
    }).addTo(map);

    // Heading indicator
    var headingMarker = null;

    function createHeadingIcon(heading) {
      return L.divIcon({
        className: '',
        html: '<div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-bottom:18px solid #1565C0;transform:rotate(' + heading + 'deg);transform-origin:center center;"></div>',
        iconSize: [12, 18],
        iconAnchor: [6, 9]
      });
    }

    // --- GetFeatureInfo on tap ---

    map.on('click', function(e) {
      // Query active WMS layers for feature info
      var activeLayers = [];
      if (map.hasLayer(encBase)) activeLayers.push('ENC');
      if (map.hasLayer(depthsLayer)) activeLayers.push('GIS-ENC-DEPTHS');
      if (map.hasLayer(hazardsLayer)) activeLayers.push('GIS-ENC-UDWHAZ');
      if (map.hasLayer(navAidsLayer)) activeLayers.push('GIS-ENC-NAVAIDS');

      if (activeLayers.length === 0) return;

      var size = map.getSize();
      var bounds = map.getBounds();
      var sw = bounds.getSouthWest();
      var ne = bounds.getNorthEast();
      var point = map.latLngToContainerPoint(e.latlng);

      var bbox = sw.lng + ',' + sw.lat + ',' + ne.lng + ',' + ne.lat;

      var url = wmsUrl + '?SERVICE=WMS&VERSION=' + wmsVersion +
        '&REQUEST=GetFeatureInfo' +
        '&LAYERS=' + activeLayers.join(',') +
        '&QUERY_LAYERS=' + activeLayers.join(',') +
        '&SRS=' + wmsSrs +
        '&BBOX=' + bbox +
        '&WIDTH=' + size.x +
        '&HEIGHT=' + size.y +
        '&X=' + Math.round(point.x) +
        '&Y=' + Math.round(point.y) +
        '&INFO_FORMAT=text/html' +
        '&FEATURE_COUNT=10';

      var popup = L.popup({ maxWidth: 300, maxHeight: 250 })
        .setLatLng(e.latlng)
        .setContent('<div style="color:#333;font-size:12px;">Loading...</div>')
        .openOn(map);

      fetch(url)
        .then(function(r) { return r.text(); })
        .then(function(html) {
          if (html && html.trim().length > 10) {
            popup.setContent('<div style="font-size:12px;max-height:200px;overflow:auto;">' + html + '</div>');
          } else {
            popup.setContent('<div style="color:#999;font-size:12px;">No chart info at this location</div>');
          }
        })
        .catch(function() {
          popup.setContent('<div style="color:#c33;font-size:12px;">Could not query chart</div>');
        });
    });

    // --- Follow mode & messaging ---

    var followMode = true;

    map.on('dragstart', function() {
      followMode = false;
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'followMode', value: false }));
    });

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
