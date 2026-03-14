import React, { useState, useCallback, useRef } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import CameraScreen from './src/CameraScreen';
import ResultScreen from './src/ResultScreen';
import { loadModel, runDetection } from './src/detector';

export default function App() {
  const [screen, setScreen] = useState('camera');
  const [photoUri, setPhotoUri] = useState(null);
  const [photoSize, setPhotoSize] = useState({ width: 0, height: 0 });
  const [detections, setDetections] = useState([]);
  const sessionRef = useRef(null);

  const handlePhotoCaptured = useCallback(async (uri, width, height) => {
    setPhotoUri(uri);
    setPhotoSize({ width, height });
    setScreen('loading');

    try {
      if (!sessionRef.current) {
        sessionRef.current = await loadModel();
      }

      const dets = await runDetection(sessionRef.current, uri, width, height);
      setDetections(dets);
      setScreen('results');
    } catch (err) {
      console.error('Detection failed:', err);
      Alert.alert('Detection Error', err.message || 'Something went wrong');
      setScreen('camera');
    }
  }, []);

  const handleBackToCamera = useCallback(() => {
    setPhotoUri(null);
    setDetections([]);
    setScreen('camera');
  }, []);

  if (screen === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#e94560" />
        <Text style={styles.loadingText}>Detecting objects...</Text>
      </View>
    );
  }

  if (screen === 'results') {
    return (
      <>
        <StatusBar style="light" />
        <ResultScreen
          photoUri={photoUri}
          photoSize={photoSize}
          detections={detections}
          onBack={handleBackToCamera}
        />
      </>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <CameraScreen onPhotoCaptured={handlePhotoCaptured} />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 18,
    marginTop: 16,
    fontWeight: '600',
  },
});
