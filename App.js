import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import HomeScreen from './src/HomeScreen';
import CameraScreen from './src/CameraScreen';
import ResultScreen from './src/ResultScreen';
import LanguageScreen from './src/LanguageScreen';
import { runDetection } from './src/detector';

function normalizeDetections(result, fallbackWidth, fallbackHeight) {
  if (Array.isArray(result?.detections)) {
    return {
      detections: result.detections,
      imageWidth: result.imageWidth || fallbackWidth,
      imageHeight: result.imageHeight || fallbackHeight,
      objectWord: result.detections?.[0]?.label || '',
      englishSpeechBase64: result.speech || '',
    };
  }

  if (!result?.word || !Array.isArray(result?.box) || result.box.length !== 4) {
    return {
      detections: [],
      imageWidth: fallbackWidth,
      imageHeight: fallbackHeight,
      objectWord: '',
      englishSpeechBase64: '',
    };
  }

  const imageWidth = result.imageWidth || fallbackWidth;
  const imageHeight = result.imageHeight || fallbackHeight;
  const [rawX1, rawY1, rawX2, rawY2] = result.box.map((value) => Number(value));

  const isNormalized = [rawX1, rawY1, rawX2, rawY2].every((value) => value >= 0 && value <= 1.01);
  const x1 = isNormalized ? rawX1 * imageWidth : rawX1;
  const y1 = isNormalized ? rawY1 * imageHeight : rawY1;
  const x2 = isNormalized ? rawX2 * imageWidth : rawX2;
  const y2 = isNormalized ? rawY2 * imageHeight : rawY2;

  const detections = result.word === 'nothing detected'
    ? []
    : [{
      x1,
      y1,
      x2,
      y2,
      confidence: Number(result.confidence || 0),
      classIndex: 0,
      label: String(result.word),
    }];

  return {
    detections,
    imageWidth,
    imageHeight,
    objectWord: result.word || '',
    englishSpeechBase64: result.speech || '',
  };
}

export default function App() {
  const [screen, setScreen] = useState('home');
  const [photoUri, setPhotoUri] = useState(null);
  const [photoSize, setPhotoSize] = useState({ width: 0, height: 0 });
  const [detections, setDetections] = useState([]);
  const [objectWord, setObjectWord] = useState('');
  const [englishSpeechBase64, setEnglishSpeechBase64] = useState('');

  const handlePhotoCaptured = useCallback(async (uri, width, height) => {
    setPhotoUri(uri);
    setPhotoSize({ width, height });
    setScreen('loading');

    try {
      const result = await runDetection(uri);
      const normalized = normalizeDetections(result, width, height);
      setDetections(normalized.detections);
      setPhotoSize({ width: normalized.imageWidth, height: normalized.imageHeight });
      setObjectWord(normalized.objectWord);
      setEnglishSpeechBase64(normalized.englishSpeechBase64);
      setScreen('results');
    } catch (err) {
      console.error('Detection failed:', err);
      Alert.alert('Detection Error', err.message || 'Something went wrong');
      setScreen('camera');
    }
  }, []);

  const handleUploadPhoto = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission Required', 'Please allow photo library access to upload an image.');
      return;
    }

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.9,
    });

    if (picked.canceled || !picked.assets?.length) {
      return;
    }

    const asset = picked.assets[0];
    handlePhotoCaptured(asset.uri, asset.width || 0, asset.height || 0);
  }, [handlePhotoCaptured]);

  const handleBackToHome = useCallback(() => {
    setPhotoUri(null);
    setDetections([]);
    setPhotoSize({ width: 0, height: 0 });
    setObjectWord('');
    setEnglishSpeechBase64('');
    setScreen('home');
  }, []);

  const handleOpenLanguage = useCallback(() => {
    if (!Array.isArray(detections) || detections.length === 0) {
      Alert.alert('No Objects Detected', 'Language screen is available after detecting at least one object.');
      return;
    }
    setScreen('language');
  }, [detections]);

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
          onNext={handleOpenLanguage}
          onBack={handleBackToHome}
        />
      </>
    );
  }

  if (screen === 'language') {
    return (
      <>
        <StatusBar style="light" />
        <LanguageScreen
          objectWord={objectWord}
          englishSpeechBase64={englishSpeechBase64}
          onBack={() => setScreen('results')}
        />
      </>
    );
  }

  if (screen === 'camera') {
    return (
      <>
        <StatusBar style="light" />
        <CameraScreen
          onPhotoCaptured={handlePhotoCaptured}
          onBack={handleBackToHome}
        />
      </>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <HomeScreen
        onOpenCamera={() => setScreen('camera')}
        onUploadPhoto={handleUploadPhoto}
      />
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
