import React, { useState, useRef } from 'react';
import { StyleSheet, View, Image, FlatList, Pressable, SafeAreaView } from 'react-native';
import { Text, Button, IconButton } from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function CustomCameraScreen() {
  const router = useRouter();
  const { theme, setTempPhotos } = useAppTheme();
  const cameraRef = useRef(null);
  
  const [permission, requestPermission] = useCameraPermissions();
  const [captured, setCaptured] = useState([]);
  const [facing, setFacing] = useState('back');
  const [isCameraReady, setIsCameraReady] = useState(false);

  if (!permission) {
    // Camera permissions are still loading
    return <View style={styles.loadingContainer}><Text>Loading permissions...</Text></View>;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <View style={[styles.permissionContainer, { backgroundColor: theme.colors.background }]}>
        <MaterialCommunityIcons name="camera-off" size={64} color={theme.colors.primary} />
        <Text variant="titleMedium" style={styles.permissionText}>
          We need your permission to show the camera
        </Text>
        <Button mode="contained" onPress={requestPermission} style={styles.permissionButton}>
          Grant Permission
        </Button>
        <Button mode="text" onPress={() => router.back()}>
          Cancel
        </Button>
      </View>
    );
  }

  const handleCapture = async () => {
    if (cameraRef.current && isCameraReady) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          skipProcessing: false,
        });
        if (photo && photo.uri) {
          setCaptured(prev => [...prev, photo.uri]);
        }
      } catch (error) {
        console.error('Error taking picture:', error);
      }
    }
  };

  const handleDeleteCaptured = (uriToDelete) => {
    setCaptured(prev => prev.filter(uri => uri !== uriToDelete));
  };

  const handleFinish = () => {
    if (captured.length > 0) {
      setTempPhotos(captured);
    }
    router.back();
  };

  const toggleCameraFacing = () => {
    setFacing(prev => (prev === 'back' ? 'front' : 'back'));
  };

  return (
    <SafeAreaView style={styles.container}>
      <CameraView 
        style={styles.camera} 
        facing={facing}
        ref={cameraRef}
        onCameraReady={() => setIsCameraReady(true)}
      >
        {/* Top Control Bar */}
        <View style={styles.topBar}>
          <IconButton
            icon="close"
            iconColor="#fff"
            size={28}
            style={styles.circleBg}
            onPress={() => router.back()}
          />
          <IconButton
            icon="camera-flip"
            iconColor="#fff"
            size={28}
            style={styles.circleBg}
            onPress={toggleCameraFacing}
          />
        </View>

        {/* Empty flex area */}
        <View style={styles.flexFiller} />

        {/* Bottom Captured Thumbnail List */}
        {captured.length > 0 && (
          <View style={styles.thumbnailListContainer}>
            <FlatList
              data={captured}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <View style={styles.thumbnailWrapper}>
                  <Image source={{ uri: item }} style={styles.thumbnail} />
                  <IconButton
                    icon="close-circle"
                    iconColor="#ff5252"
                    size={20}
                    style={styles.deleteThumbnailBtn}
                    onPress={() => handleDeleteCaptured(item)}
                  />
                </View>
              )}
            />
          </View>
        )}

        {/* Bottom Actions Bar */}
        <View style={styles.bottomBar}>
          <View style={styles.bottomBarLeft}>
            <Text style={styles.countText}>
              {captured.length} Photo{captured.length === 1 ? '' : 's'}
            </Text>
          </View>

          {/* Capture Trigger Button */}
          <Pressable 
            onPress={handleCapture}
            style={({ pressed }) => [
              styles.captureButtonOuter,
              pressed && { scale: 0.95 }
            ]}
          >
            <View style={styles.captureButtonInner} />
          </Pressable>

          <View style={styles.bottomBarRight}>
            {captured.length > 0 ? (
              <Button 
                mode="contained" 
                onPress={handleFinish} 
                buttonColor={theme.colors.accent}
                textColor="#fff"
                labelStyle={{ fontWeight: 'bold' }}
              >
                Done
              </Button>
            ) : (
              <View style={{ width: 70 }} />
            )}
          </View>
        </View>
      </CameraView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionText: {
    textAlign: 'center',
    marginVertical: 16,
  },
  permissionButton: {
    marginBottom: 8,
  },
  camera: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  circleBg: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  flexFiller: {
    flex: 1,
  },
  thumbnailListContainer: {
    height: 90,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  thumbnailWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  thumbnail: {
    width: 70,
    height: 70,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fff',
  },
  deleteThumbnailBtn: {
    position: 'absolute',
    top: -12,
    right: -12,
    margin: 0,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  bottomBarLeft: {
    width: 80,
  },
  bottomBarRight: {
    width: 80,
    alignItems: 'flex-end',
  },
  countText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  captureButtonOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
});
