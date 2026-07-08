import React, { useState, useRef } from 'react';
import { View, StyleSheet, FlatList, Image, Dimensions, Pressable } from 'react-native';
import { Surface, Text, Portal, Modal, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');
const GALLERY_HEIGHT = 280;

export default function PhotoGallery({ photos = [] }) {
  const { theme } = useAppTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const [fullscreenVisible, setFullscreenVisible] = useState(false);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);
  
  const onViewRef = useRef(({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index || 0);
    }
  });
  
  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });

  if (!photos || photos.length === 0) {
    return (
      <Surface style={[styles.fallbackContainer, { backgroundColor: theme.colors.surfaceVariant }]} elevation={0}>
        <MaterialCommunityIcons name="image-multiple-outline" size={48} color={theme.colors.onSurfaceVariant} />
        <Text style={{ marginTop: 8, color: theme.colors.onSurfaceVariant }}>No photos captured for this item</Text>
      </Surface>
    );
  }

  const renderItem = ({ item, index }) => (
    <Pressable onPress={() => {
      setFullscreenIndex(index);
      setFullscreenVisible(true);
    }}>
      <Image source={{ uri: item }} style={styles.image} />
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={photos}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewRef.current}
        viewabilityConfig={viewConfigRef.current}
        keyExtractor={(item, index) => `${item}_${index}`}
      />
      
      {/* Pagination dots */}
      {photos.length > 1 && (
        <View style={styles.pagination}>
          {photos.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                {
                  backgroundColor: idx === activeIndex ? theme.colors.primary : theme.colors.outline,
                  width: idx === activeIndex ? 16 : 8,
                },
              ]}
            />
          ))}
        </View>
      )}

      {/* Fullscreen Photo Modal */}
      <Portal>
        <Modal
          visible={fullscreenVisible}
          onDismiss={() => setFullscreenVisible(false)}
          contentContainerStyle={[styles.modalContent, { backgroundColor: '#000' }]}
        >
          <View style={styles.fullscreenWrapper}>
            <Image
              source={{ uri: photos[fullscreenIndex] }}
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
            
            <IconButton
              icon="close"
              iconColor="#fff"
              size={30}
              style={styles.closeButton}
              onPress={() => setFullscreenVisible(false)}
            />
            
            {photos.length > 1 && (
              <View style={styles.navigationButtons}>
                <IconButton
                  icon="chevron-left"
                  iconColor="#fff"
                  size={36}
                  disabled={fullscreenIndex === 0}
                  onPress={() => setFullscreenIndex(prev => prev - 1)}
                />
                <IconButton
                  icon="chevron-right"
                  iconColor="#fff"
                  size={36}
                  disabled={fullscreenIndex === photos.length - 1}
                  onPress={() => setFullscreenIndex(prev => prev + 1)}
                />
              </View>
            )}
            
            <Text style={styles.indexIndicator}>
              {fullscreenIndex + 1} / {photos.length}
            </Text>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: GALLERY_HEIGHT,
    position: 'relative',
  },
  image: {
    width: width,
    height: GALLERY_HEIGHT,
    resizeMode: 'cover',
  },
  fallbackContainer: {
    height: GALLERY_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pagination: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  modalContent: {
    flex: 1,
    margin: 0,
    justifyContent: 'center',
  },
  fullscreenWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  navigationButtons: {
    position: 'absolute',
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    pointerEvents: 'box-none',
  },
  indexIndicator: {
    position: 'absolute',
    bottom: 40,
    color: '#fff',
    fontWeight: '500',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
});
