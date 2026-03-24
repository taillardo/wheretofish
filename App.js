import React, { useState, useRef, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import NavigationChart from './src/NavigationChart';
import InfoPanel from './src/InfoPanel';
import useLocation from './src/LocationProvider';

// Default to a coastal area (San Francisco Bay)
const DEFAULT_REGION = {
  latitude: 37.8083,
  longitude: -122.4156,
  zoom: 13,
};

export default function App() {
  const { location, heading, errorMsg } = useLocation();
  const [followMode, setFollowMode] = useState(true);
  const centerRef = useRef(null);

  // Store centerOnUser callback
  NavigationChart._centerRef = centerRef;

  const handleCenterPress = useCallback(() => {
    if (centerRef.current) {
      centerRef.current();
    }
    setFollowMode(true);
  }, []);

  const initialRegion = location
    ? {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        zoom: 14,
      }
    : DEFAULT_REGION;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>WhereToFish</Text>
        <Text style={styles.subtitle}>Marine Navigation</Text>
      </View>

      {/* Error banner */}
      {errorMsg && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}

      {/* Map */}
      <View style={styles.mapContainer}>
        <NavigationChart
          location={location}
          heading={heading}
          initialRegion={initialRegion}
          onFollowModeChange={setFollowMode}
        />

        {/* Center on user button */}
        {!followMode && (
          <TouchableOpacity style={styles.centerButton} onPress={handleCenterPress}>
            <Text style={styles.centerButtonText}>◎</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Navigation info panel */}
      <InfoPanel location={location} heading={heading} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4a',
  },
  title: {
    color: '#e0e6f0',
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    color: '#6e7891',
    fontSize: 12,
    fontWeight: '500',
  },
  errorBanner: {
    backgroundColor: '#cc3333',
    padding: 8,
    alignItems: 'center',
  },
  errorText: {
    color: '#fff',
    fontSize: 12,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  centerButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#2a2a4a',
  },
  centerButtonText: {
    color: '#2196F3',
    fontSize: 24,
  },
});
