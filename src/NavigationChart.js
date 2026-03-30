import React, { useRef, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import getMapHtml from './mapHtml';
import WMS_CONFIG from './wmsConfig';

export default function NavigationChart({ location, heading, initialRegion, onFollowModeChange }) {
  const webViewRef = useRef(null);
  const lastUpdate = useRef(0);

  const sendLocationUpdate = useCallback((loc, hdg) => {
    const now = Date.now();
    if (now - lastUpdate.current < 500) return; // Throttle updates
    lastUpdate.current = now;

    if (webViewRef.current && loc) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'locationUpdate',
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        accuracy: loc.coords.accuracy,
        heading: hdg,
      }));
    }
  }, []);

  React.useEffect(() => {
    if (location) {
      sendLocationUpdate(location, heading);
    }
  }, [location, heading, sendLocationUpdate]);

  const handleMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'followMode' && onFollowModeChange) {
        onFollowModeChange(data.value);
      }
    } catch (e) {}
  }, [onFollowModeChange]);

  const centerOnUser = useCallback(() => {
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({ type: 'centerOnUser' }));
    }
  }, []);

  // Expose centerOnUser via ref callback
  React.useEffect(() => {
    if (NavigationChart._centerRef) {
      NavigationChart._centerRef.current = centerOnUser;
    }
  }, [centerOnUser]);

  const html = getMapHtml(
    initialRegion.latitude,
    initialRegion.longitude,
    initialRegion.zoom || 13,
    WMS_CONFIG
  );

  return (
    <WebView
      ref={webViewRef}
      source={{ html }}
      style={styles.map}
      originWhitelist={['*']}
      javaScriptEnabled
      onMessage={handleMessage}
      scrollEnabled={false}
      bounces={false}
      overScrollMode="never"
    />
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
