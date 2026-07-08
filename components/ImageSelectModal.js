import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Portal, Modal, Text, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';

export default function ImageSelectModal({ visible, onDismiss, onImagesSelected }) {
  const { theme } = useAppTheme();
  const router = useRouter();

  const handlePickImage = async () => {
    onDismiss();
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access photo library is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const uris = result.assets.map(asset => asset.uri);
        onImagesSelected(uris);
      }
    } catch (error) {
      console.error('Error picking images:', error);
      alert('Failed to select photos.');
    }
  };

  const handleOpenCamera = () => {
    onDismiss();
    // Navigate to custom camera screen
    router.push({
      pathname: '/custom-camera',
    });
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <Surface style={[styles.content, { backgroundColor: theme.colors.surface }]} elevation={3}>
          <Text variant="titleMedium" style={[styles.title, { color: theme.colors.onSurface, fontFamily: 'serif' }]}>
            Add Item Photos
          </Text>
          
          <View style={styles.optionsRow}>
            {/* Camera Option */}
            <Pressable 
              style={({ pressed }) => [
                styles.optionButton, 
                pressed && { opacity: 0.7 }
              ]} 
              onPress={handleOpenCamera}
            >
              <Surface style={[styles.iconWrapper, { backgroundColor: theme.colors.primaryContainer }]} elevation={1}>
                <MaterialCommunityIcons name="camera" size={32} color={theme.colors.primary} />
              </Surface>
              <Text variant="labelLarge" style={[styles.optionLabel, { color: theme.colors.onSurface }]}>
                Take Photo
              </Text>
            </Pressable>

            {/* Gallery Option */}
            <Pressable 
              style={({ pressed }) => [
                styles.optionButton, 
                pressed && { opacity: 0.7 }
              ]} 
              onPress={handlePickImage}
            >
              <Surface style={[styles.iconWrapper, { backgroundColor: theme.colors.secondaryContainer }]} elevation={1}>
                <MaterialCommunityIcons name="image-multiple" size={32} color={theme.colors.secondary} />
              </Surface>
              <Text variant="labelLarge" style={[styles.optionLabel, { color: theme.colors.onSurface }]}>
                Photo Library
              </Text>
            </Pressable>
          </View>
        </Surface>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  content: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 24,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
  },
  optionButton: {
    alignItems: 'center',
    width: 120,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionLabel: {
    fontWeight: '500',
  },
});
