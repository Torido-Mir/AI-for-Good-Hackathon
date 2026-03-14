import React, { useRef } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, SafeAreaView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function CameraScreen({ onPhotoCaptured, onBack }) {
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            📷 Camera access is needed to detect objects.
          </Text>
          <TouchableOpacity style={styles.grantButton} onPress={requestPermission}>
            <Text style={styles.grantButtonText}>✅ Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleSnap = async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({
      quality: 0.8,
      skipProcessing: false,
    });
    onPhotoCaptured(photo.uri, photo.width, photo.height);
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
      >
        <SafeAreaView style={styles.overlay}>
          <View style={styles.topBar}>
            {onBack ? (
              <TouchableOpacity style={styles.backButton} onPress={onBack}>
                <Text style={styles.backButtonText}>⬅️ Back</Text>
              </TouchableOpacity>
            ) : null}
            <Text style={styles.title}>🔎 Object Detector</Text>
            {onBack ? <View style={styles.backButtonSpacer} /> : null}
          </View>
          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.snapButton} onPress={handleSnap}>
              <View style={styles.snapButtonInner} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'space-between' },
  topBar: {
    paddingTop: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: '#fff', fontSize: 20, fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  backButton: {
    backgroundColor: 'rgba(15, 52, 96, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  backButtonSpacer: {
    width: 58,
  },
  bottomBar: {
    paddingBottom: 40, alignItems: 'center',
  },
  snapButton: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 4, borderColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
  },
  snapButtonInner: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#e94560',
  },
  permissionContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40,
  },
  permissionText: {
    color: '#fff', fontSize: 18, textAlign: 'center', marginBottom: 20,
  },
  grantButton: {
    backgroundColor: '#e94560', paddingHorizontal: 32, paddingVertical: 14,
    borderRadius: 8,
  },
  grantButtonText: {
    color: '#fff', fontSize: 16, fontWeight: 'bold',
  },
});
