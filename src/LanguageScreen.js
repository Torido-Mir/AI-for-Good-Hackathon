import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Image,
} from 'react-native';
import * as Audio from 'expo-audio';
import {
  englishSpeechBase64ToUri,
  getRohingyaSentenceAudio,
} from './detector';

async function playUri(uri, soundRef) {
  if (!uri) {
    throw new Error('🔇 No audio available.');
  }

  if (!soundRef.current) {
    soundRef.current = Audio.createAudioPlayer({ uri });
  } else {
    soundRef.current.replace({ uri });
  }

  soundRef.current.play();
}

export default function LanguageScreen({
  photoUri,
  objectWord,
  englishSpeechBase64,
  exampleSentence,
  exampleSentenceSpeechBase64,
  onBack,
}) {
  const soundRef = useRef(null);
  const [loadingRohingyaWord, setLoadingRohingyaWord] = useState(false);
  const [rohingyaWordAudioUri, setRohingyaWordAudioUri] = useState(null);
  const [loadingRohingya, setLoadingRohingya] = useState(false);
  const [rohingyaText, setRohingyaText] = useState('');
  const [rohingyaAudioUri, setRohingyaAudioUri] = useState(null);

  const englishWord = objectWord || 'object';

  const learningSentence = useMemo(
    () => (exampleSentence || '').trim() || `This is a ${englishWord}. In English, this is a ${englishWord}.`,
    [englishWord, exampleSentence],
  );

  useEffect(() => {
    setRohingyaText('');
    setRohingyaAudioUri(null);
  }, [learningSentence]);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.remove();
        soundRef.current = null;
      }
    };
  }, []);

  const handlePlayEnglish = useCallback(async () => {
    try {
      const englishAudioUri = englishSpeechBase64ToUri(
        exampleSentenceSpeechBase64 || englishSpeechBase64,
      );
      await playUri(englishAudioUri, soundRef);
    } catch (err) {
      Alert.alert('🔊 Audio Error', err.message || 'Could not play English sentence audio.');
    }
  }, [englishSpeechBase64, exampleSentenceSpeechBase64]);

  const handlePlayEnglishWord = useCallback(async () => {
    try {
      const englishWordAudioUri = englishSpeechBase64ToUri(englishSpeechBase64);
      await playUri(englishWordAudioUri, soundRef);
    } catch (err) {
      Alert.alert('🔊 Audio Error', err.message || 'Could not play English word audio.');
    }
  }, [englishSpeechBase64]);

  const handlePlayRohingyaWord = useCallback(async () => {
    try {
      setLoadingRohingyaWord(true);

      let audioUri = rohingyaWordAudioUri;
      if (!audioUri) {
        const result = await getRohingyaSentenceAudio(englishWord);
        audioUri = result.audioUri;
        setRohingyaWordAudioUri(result.audioUri);
      }

      await playUri(audioUri, soundRef);
    } catch (err) {
      Alert.alert('🔊 Audio Error', err.message || 'Could not play Rohingya word audio.');
    } finally {
      setLoadingRohingyaWord(false);
    }
  }, [englishWord, rohingyaWordAudioUri]);

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
      Alert.alert('🔊 Audio Error', err.message || 'Could not play Rohingya audio.');
    } finally {
      setLoadingRohingya(false);
    }
  }, [learningSentence, rohingyaAudioUri]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {photoUri ? (
          <View style={styles.thumbnailContainer}>
            <Image source={{ uri: photoUri }} style={styles.thumbnail} resizeMode="cover" />
          </View>
        ) : null}
        <Text style={styles.heading}>🎯 Detected Object</Text>
        <Text style={styles.objectWord}>{englishWord}</Text>

        <View style={styles.infoCard}>
          <Text style={styles.label}>🇨🇦 English word</Text>
          <Text style={styles.value}>{englishWord}</Text>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={handlePlayEnglishWord}>
          <Text style={styles.buttonText}>🔊 Play English Word</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handlePlayRohingyaWord}
          disabled={loadingRohingyaWord}
        >
          <Text style={styles.buttonText}>
            {loadingRohingyaWord ? '⏳ Preparing Rohingya Word...' : '🗣️ Say Word in Rohingya'}
          </Text>
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <Text style={styles.label}>📝 Example sentence</Text>
          <Text style={styles.value}>{learningSentence}</Text>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={handlePlayEnglish}>
          <Text style={styles.buttonText}>🔊 Play English Sentence</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handlePlayRohingyaSentence}
          disabled={loadingRohingya}
        >
          <Text style={styles.buttonText}>
            {loadingRohingya ? '⏳ Preparing Rohingya Audio...' : '🗣️ Say Sentence in Rohingya'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>⬅️ Back to Results</Text>
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
  thumbnailContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  thumbnail: {
    width: 88,
    height: 88,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#0f3460',
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
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 6,
    marginBottom: 4,
  },
  rhgFlag: {
    width: 20,
    height: 14,
    borderRadius: 2,
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