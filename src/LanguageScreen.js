import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Audio } from 'expo-av';
import {
  englishSpeechBase64ToUri,
  getRohingyaSentenceAudio,
} from './detector';

async function playUri(uri, soundRef) {
  if (!uri) {
    throw new Error('No audio available.');
  }

  if (soundRef.current) {
    await soundRef.current.unloadAsync();
    soundRef.current = null;
  }

  const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
  soundRef.current = sound;
}

export default function LanguageScreen({ objectWord, englishSpeechBase64, onBack }) {
  const soundRef = useRef(null);
  const [loadingRohingya, setLoadingRohingya] = useState(false);
  const [rohingyaText, setRohingyaText] = useState('');
  const [rohingyaAudioUri, setRohingyaAudioUri] = useState(null);

  const englishWord = objectWord || 'object';

  const learningSentence = useMemo(
    () => `This is a ${englishWord}. In English, this is a ${englishWord}.`,
    [englishWord],
  );

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const handlePlayEnglish = useCallback(async () => {
    try {
      const englishAudioUri = englishSpeechBase64ToUri(englishSpeechBase64);
      await playUri(englishAudioUri, soundRef);
    } catch (err) {
      Alert.alert('Audio Error', err.message || 'Could not play English audio.');
    }
  }, [englishSpeechBase64]);

  const handlePlayRohingyaSentence = useCallback(async () => {
    try {
      setLoadingRohingya(true);

      let audioUri = rohingyaAudioUri;
      if (!audioUri) {
        const result = await getRohingyaSentenceAudio(learningSentence);
        audioUri = result.audioUri;
        setRohingyaText(result.rohingyaText || '');
        setRohingyaAudioUri(result.audioUri);
      }

      await playUri(audioUri, soundRef);
    } catch (err) {
      Alert.alert('Audio Error', err.message || 'Could not play Rohingya audio.');
    } finally {
      setLoadingRohingya(false);
    }
  }, [learningSentence, rohingyaAudioUri]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.heading}>Detected Object</Text>
        <Text style={styles.objectWord}>{englishWord}</Text>

        <View style={styles.infoCard}>
          <Text style={styles.label}>English word</Text>
          <Text style={styles.value}>{englishWord}</Text>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={handlePlayEnglish}>
          <Text style={styles.buttonText}>Play English Sound</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handlePlayRohingyaSentence}
          disabled={loadingRohingya}
        >
          <Text style={styles.buttonText}>
            {loadingRohingya ? 'Preparing Rohingya Audio...' : 'Say Sentence in Rohingya'}
          </Text>
        </TouchableOpacity>

        {rohingyaText ? (
          <View style={styles.infoCard}>
            <Text style={styles.label}>Rohingya text</Text>
            <Text style={styles.value}>{rohingyaText}</Text>
          </View>
        ) : null}
      </View>

      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>Back to Results</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  heading: {
    color: '#c9c9d6',
    fontSize: 16,
    marginBottom: 6,
  },
  objectWord: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '800',
    marginBottom: 18,
  },
  infoCard: {
    backgroundColor: '#0f3460',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  label: {
    color: '#c9c9d6',
    fontSize: 14,
    marginBottom: 4,
  },
  value: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: '#e94560',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  secondaryButton: {
    backgroundColor: '#16c79a',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 14,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  backButton: {
    backgroundColor: '#e94560',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});