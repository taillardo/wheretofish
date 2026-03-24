import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

function formatCoord(value, posLabel, negLabel) {
  if (value == null) return '--';
  const abs = Math.abs(value);
  const deg = Math.floor(abs);
  const min = ((abs - deg) * 60).toFixed(3);
  const dir = value >= 0 ? posLabel : negLabel;
  return `${deg}\u00B0${min}'${dir}`;
}

function formatSpeed(mps) {
  if (mps == null || mps < 0) return '-- kn';
  const knots = mps * 1.94384;
  return `${knots.toFixed(1)} kn`;
}

function formatHeading(deg) {
  if (deg == null || deg < 0) return '---\u00B0';
  return `${Math.round(deg)}\u00B0`;
}

export default function InfoPanel({ location, heading }) {
  const coords = location?.coords;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.cell}>
          <Text style={styles.label}>LAT</Text>
          <Text style={styles.value}>{formatCoord(coords?.latitude, 'N', 'S')}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.label}>LON</Text>
          <Text style={styles.value}>{formatCoord(coords?.longitude, 'E', 'W')}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.label}>SPD</Text>
          <Text style={styles.value}>{formatSpeed(coords?.speed)}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.label}>HDG</Text>
          <Text style={styles.value}>{formatHeading(heading)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a2e',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a4a',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  cell: {
    alignItems: 'center',
    flex: 1,
  },
  label: {
    color: '#6e7891',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
  },
  value: {
    color: '#e0e6f0',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'monospace',
    marginTop: 2,
  },
});
