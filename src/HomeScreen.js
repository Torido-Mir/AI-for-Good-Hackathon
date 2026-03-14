import React from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, SafeAreaView,
} from 'react-native';

export default function HomeScreen({ onOpenCamera, onUploadPhoto }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Object Detector</Text>
        <Text style={styles.subtitle}>Choose how you want to start</Text>

        <TouchableOpacity style={styles.primaryButton} onPress={onOpenCamera}>
          <Text style={styles.primaryButtonText}>Use Camera</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={onUploadPhoto}>
          <Text style={styles.secondaryButtonText}>Upload a Photo</Text>
        </TouchableOpacity>
      </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    color: '#c9c9d6',
    fontSize: 16,
    marginBottom: 34,
    textAlign: 'center',
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#e94560',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: '#0f3460',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
});