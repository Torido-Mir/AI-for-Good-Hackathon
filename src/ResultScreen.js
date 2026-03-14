import React from 'react';
import {
  StyleSheet, View, Text, Image, TouchableOpacity, FlatList,
  SafeAreaView, useWindowDimensions,
} from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';

const BOX_COLORS = [
  '#e94560', '#0f3460', '#16c79a', '#f5a623', '#bd10e0',
  '#4a90d9', '#50e3c2', '#b8e986', '#f8e71c', '#d0021b',
];

function getColor(classIndex) {
  return BOX_COLORS[classIndex % BOX_COLORS.length];
}

export default function ResultScreen({ photoUri, photoSize, detections, onBack }) {
  const { width: screenWidth } = useWindowDimensions();
  const imageDisplayWidth = screenWidth;
  const imageDisplayHeight = (photoSize.height / photoSize.width) * screenWidth;

  const scaleX = imageDisplayWidth / photoSize.width;
  const scaleY = imageDisplayHeight / photoSize.height;

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.imageContainer, { height: imageDisplayHeight }]}>
        <Image
          source={{ uri: photoUri }}
          style={{ width: imageDisplayWidth, height: imageDisplayHeight }}
          resizeMode="contain"
        />
        <Svg
          style={StyleSheet.absoluteFill}
          width={imageDisplayWidth}
          height={imageDisplayHeight}
        >
          {detections.map((det, i) => {
            const color = getColor(det.classIndex);
            const x = det.x1 * scaleX;
            const y = det.y1 * scaleY;
            const w = (det.x2 - det.x1) * scaleX;
            const h = (det.y2 - det.y1) * scaleY;

            return (
              <React.Fragment key={i}>
                <Rect
                  x={x} y={y} width={w} height={h}
                  stroke={color} strokeWidth={2.5} fill="none"
                />
                <Rect
                  x={x} y={y - 20}
                  width={det.label.length * 8 + 40} height={20}
                  fill={color} opacity={0.85}
                />
                <SvgText
                  x={x + 4} y={y - 5}
                  fill="#ffffff" fontSize={13} fontWeight="bold"
                >
                  {det.label} {Math.round(det.confidence * 100)}%
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      </View>

      <View style={styles.detailsContainer}>
        <Text style={styles.summaryText}>
          {detections.length} object{detections.length !== 1 ? 's' : ''} detected
        </Text>
        <FlatList
          data={detections}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => (
            <View style={styles.detectionRow}>
              <View style={[styles.colorDot, { backgroundColor: getColor(item.classIndex) }]} />
              <Text style={styles.detectionLabel}>{item.label}</Text>
              <Text style={styles.detectionConf}>
                {Math.round(item.confidence * 100)}%
              </Text>
            </View>
          )}
        />
      </View>

      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>Back to Camera</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  imageContainer: { width: '100%', position: 'relative' },
  detailsContainer: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  summaryText: {
    color: '#ffffff', fontSize: 18, fontWeight: 'bold', marginBottom: 8,
  },
  detectionRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 6,
  },
  colorDot: {
    width: 12, height: 12, borderRadius: 6, marginRight: 10,
  },
  detectionLabel: {
    color: '#e0e0e0', fontSize: 16, flex: 1,
  },
  detectionConf: {
    color: '#aaaaaa', fontSize: 16, fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#e94560', marginHorizontal: 16, marginBottom: 16,
    paddingVertical: 16, borderRadius: 12, alignItems: 'center',
  },
  backButtonText: {
    color: '#ffffff', fontSize: 18, fontWeight: 'bold',
  },
});
