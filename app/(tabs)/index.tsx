import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  Image, FlatList, ActivityIndicator
} from 'react-native';
import { CameraView, CameraType, FlashMode, Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';

export default function App() {
  const cameraRef = useRef<CameraView>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [type, setType] = useState<CameraType>('back');
  const [zoom, setZoom] = useState(0);
  const [flash, setFlash] = useState<FlashMode>('off');
  const [galleryItems, setGalleryItems] = useState<MediaLibrary.Asset[]>([]);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync();
      const granted = status === 'granted' && mediaStatus === 'granted';
      setHasPermission(granted);
      if (granted) {
        loadGallery();
      }
    })();
  }, []);

  const loadGallery = async () => {
    const { assets } = await MediaLibrary.getAssetsAsync({
      mediaType: ['photo', 'video'],
      first: 20,
      sortBy: ['creationTime'],
    });
    setGalleryItems(assets);
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      await MediaLibrary.saveToLibraryAsync(photo.uri);
      alert('📸 Foto salva!');
      loadGallery();
    }
  };

const recordVideo = async () => {
  if (cameraRef.current) {
    if (!isRecording) {
      setIsRecording(true);
      try {
        const video = await cameraRef.current.recordAsync();
        if (video && video.uri) {
          await MediaLibrary.saveToLibraryAsync(video.uri);
          alert('🎥 Vídeo salvo!');
          loadGallery();
        } else {
          alert('⚠️ Falha ao gravar vídeo.');
        }
      } catch (error) {
        console.error('Erro na gravação de vídeo:', error);
        alert('❌ Erro ao gravar vídeo.');
      } finally {
        setIsRecording(false);
      }
    } else {
      cameraRef.current.stopRecording();
      setIsRecording(false);
    }
  }
};


  const toggleCameraType = () => {
    setType(current => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlashMode = () => {
    setFlash(current => (current === 'off' ? 'on' : 'off'));
  };

  const handleZoomOut = () => {
    setZoom(current => Math.max(current - 0.1, 0));
  };

  const handleZoomIn = () => {
    setZoom(current => Math.min(current + 0.1, 1));
  };

  if (hasPermission === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Solicitando permissões...</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>
          Permissão para acessar a câmera e a galeria foi negada.
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={type}
        flash={flash}
        zoom={zoom}
      />

      <View style={styles.controls}>
        <TouchableOpacity onPress={takePicture} style={styles.button}>
          <Text style={styles.text}>📷 Foto</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={recordVideo}
          style={[styles.button, isRecording && styles.recording]}
        >
          <Text style={styles.text}>
            {isRecording ? '🛑 Parar' : '🎬 Gravar'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={toggleCameraType} style={styles.button}>
          <Text style={styles.text}>🔄 Câmera</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={toggleFlashMode} style={styles.button}>
          <Text style={styles.text}>
            ⚡ Flash {flash === 'on' ? 'On' : 'Off'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.zoomControls}>
        <TouchableOpacity onPress={handleZoomOut}>
          <Text style={styles.text}>➖ Zoom -</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleZoomIn}>
          <Text style={styles.text}>➕ Zoom +</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.gallery}>
        <Text style={styles.galleryTitle}>🖼️ Galeria</Text>
        <FlatList
          horizontal
          data={galleryItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Image source={{ uri: item.uri }} style={styles.galleryImage} />
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#111',
    paddingVertical: 10,
  },
  zoomControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 5,
    backgroundColor: '#111',
  },
  button: {
    padding: 10,
    backgroundColor: '#222',
    borderRadius: 10,
  },
  recording: {
    backgroundColor: 'red',
  },
  text: {
    color: '#fff',
    fontWeight: 'bold',
  },
  gallery: {
    backgroundColor: '#111',
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  galleryTitle: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 5,
    marginLeft: 5,
  },
  galleryImage: {
    width: 100,
    height: 100,
    marginRight: 10,
    borderRadius: 10,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
  },
  errorText: {
    color: '#ff4444',
    textAlign: 'center',
    fontSize: 16,
  },
});



