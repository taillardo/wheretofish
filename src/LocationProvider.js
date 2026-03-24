import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';

export default function useLocation() {
  const [location, setLocation] = useState(null);
  const [heading, setHeading] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const requestPermission = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setErrorMsg('Location permission is required to show your position on the chart.');
      return false;
    }
    setPermissionGranted(true);
    setErrorMsg(null);
    return true;
  }, []);

  useEffect(() => {
    let locationSub = null;
    let headingSub = null;

    (async () => {
      const granted = await requestPermission();
      if (!granted) return;

      // Get initial position
      try {
        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setLocation(current);
      } catch (e) {
        // Will get location from watch instead
      }

      // Watch position
      locationSub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 1,
          timeInterval: 1000,
        },
        (loc) => {
          setLocation(loc);
        }
      );

      // Watch heading
      headingSub = await Location.watchHeadingAsync((h) => {
        setHeading(h.trueHeading >= 0 ? h.trueHeading : h.magHeading);
      });
    })();

    return () => {
      if (locationSub) locationSub.remove();
      if (headingSub) headingSub.remove();
    };
  }, [requestPermission]);

  return { location, heading, errorMsg, permissionGranted };
}
