import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, Pressable, Alert } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons, Surface, IconButton, Divider, HelperText } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { addItem } from '../../database/db';
import { useAppTheme } from '../../context/ThemeContext';
import { savePhoto } from '../../utils/file';
import ImageSelectModal from '../../components/ImageSelectModal';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const CONDITIONS = [
  { value: 'Mint', label: 'Mint' },
  { value: 'Excellent', label: 'Exc' },
  { value: 'Good', label: 'Good' },
  { value: 'Fair', label: 'Fair' },
  { value: 'Poor', label: 'Poor' },
];

export default function AddItemScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { theme, tempPhotos, setTempPhotos } = useAppTheme();

  // Form Fields State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [condition, setCondition] = useState('Good');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [dateAdded, setDateAdded] = useState(new Date().toISOString().split('T')[0]);

  // Form Verification
  const [nameTouched, setNameTouched] = useState(false);

  // Photos state (stores temp URIs initially)
  const [photos, setPhotos] = useState([]);
  const [selectModalVisible, setSelectModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  // Read from Context Bridge when camera returns photos
  useEffect(() => {
    if (tempPhotos && tempPhotos.length > 0) {
      setPhotos(prev => [...prev, ...tempPhotos]);
      setTempPhotos([]); // Reset bridge
    }
  }, [tempPhotos]);

  const handleImagesSelected = (uris) => {
    setPhotos(prev => [...prev, ...uris]);
  };

  const removePhoto = (indexToRemove) => {
    setPhotos(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSave = async () => {
    setNameTouched(true);
    if (!name.trim()) {
      Alert.alert('Required Field', 'Item name is required.');
      return;
    }

    try {
      setSaving(true);
      
      // 1. Save all temporary photos to persistent document directory
      const savedPhotoPaths = [];
      for (const tempUri of photos) {
        // If it's already a persistent uri (e.g. from some other edit, though this is add, so all are temp), we don't copy.
        // But here all are new/temp, so copy them
        const persistentUri = await savePhoto(tempUri);
        savedPhotoPaths.push(persistentUri);
      }

      // 2. Insert item details to SQLite database
      const itemData = {
        name: name.trim(),
        category: category.trim(),
        description: description.trim(),
        purchasePrice: parseFloat(purchasePrice) || 0,
        sellingPrice: parseFloat(sellingPrice) || 0,
        condition,
        location: location.trim(),
        notes: notes.trim(),
        dateAdded: new Date(dateAdded).toISOString(),
      };

      await addItem(db, itemData, savedPhotoPaths);
      
      Alert.alert('Success', 'Inventory item added successfully.');
      router.back();
    } catch (error) {
      console.error('Error saving item:', error);
      Alert.alert('Save Error', 'Failed to save item: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        {/* Photo Upload Section */}
        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface, fontFamily: 'serif' }]}>
          Item Photos ({photos.length})
        </Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoContainer}>
          {photos.map((uri, idx) => (
            <View key={idx} style={styles.photoWrapper}>
              <Image source={{ uri }} style={styles.image} />
              <IconButton
                icon="close-circle"
                iconColor={theme.colors.error}
                size={22}
                style={styles.deleteBtn}
                onPress={() => removePhoto(idx)}
              />
            </View>
          ))}
          
          <Pressable 
            style={[styles.addPhotoCard, { borderColor: theme.colors.outline }]}
            onPress={() => setSelectModalVisible(true)}
          >
            <MaterialCommunityIcons name="camera-plus" size={32} color={theme.colors.primary} />
            <Text variant="labelMedium" style={{ color: theme.colors.primary, marginTop: 4 }}>Add Photos</Text>
          </Pressable>
        </ScrollView>

        <Divider style={styles.divider} />

        {/* Basic Information */}
        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface, fontFamily: 'serif' }]}>
          Core Details
        </Text>

        <TextInput
          label="Item Name *"
          value={name}
          onChangeText={setName}
          onBlur={() => setNameTouched(true)}
          error={nameTouched && !name.trim()}
          mode="outlined"
          activeOutlineColor={theme.colors.primary}
          style={styles.input}
        />
        {nameTouched && !name.trim() && (
          <HelperText type="error" visible={true} style={styles.helper}>
            Item name is required.
          </HelperText>
        )}

        <TextInput
          label="Category (e.g., Ceramic, Clock, Jewelry)"
          value={category}
          onChangeText={setCategory}
          mode="outlined"
          activeOutlineColor={theme.colors.primary}
          style={styles.input}
        />

        {/* Condition Picker */}
        <Text variant="bodyMedium" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
          Condition
        </Text>
        <SegmentedButtons
          value={condition}
          onValueChange={setCondition}
          buttons={CONDITIONS}
          style={styles.input}
        />

        <TextInput
          label="Booth / Shelf Location"
          value={location}
          onChangeText={setLocation}
          placeholder="e.g. Booth A, Shelf 2"
          mode="outlined"
          activeOutlineColor={theme.colors.primary}
          style={styles.input}
        />

        <Divider style={styles.divider} />

        {/* Financial Information */}
        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface, fontFamily: 'serif' }]}>
          Financial Ledger
        </Text>
        
        <View style={styles.row}>
          <TextInput
            label="Purchase Price ($)"
            value={purchasePrice}
            onChangeText={setPurchasePrice}
            keyboardType="numeric"
            mode="outlined"
            activeOutlineColor={theme.colors.primary}
            style={[styles.input, styles.halfInput]}
          />
          <TextInput
            label="Listed Selling Price ($)"
            value={sellingPrice}
            onChangeText={setSellingPrice}
            keyboardType="numeric"
            mode="outlined"
            activeOutlineColor={theme.colors.primary}
            style={[styles.input, styles.halfInput]}
          />
        </View>

        <TextInput
          label="Date Added (YYYY-MM-DD)"
          value={dateAdded}
          onChangeText={setDateAdded}
          placeholder="YYYY-MM-DD"
          mode="outlined"
          activeOutlineColor={theme.colors.primary}
          style={styles.input}
        />

        <Divider style={styles.divider} />

        {/* Descriptions & Notes */}
        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface, fontFamily: 'serif' }]}>
          Descriptions & Memos
        </Text>

        <TextInput
          label="Description"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          mode="outlined"
          activeOutlineColor={theme.colors.primary}
          style={styles.input}
        />

        <TextInput
          label="Curator Private Notes"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={2}
          mode="outlined"
          activeOutlineColor={theme.colors.primary}
          style={styles.input}
        />

        {/* Save Button */}
        <Button
          mode="contained"
          style={styles.saveBtn}
          loading={saving}
          disabled={saving}
          buttonColor={theme.colors.primary}
          textColor="#fff"
          labelStyle={{ fontWeight: 'bold', fontSize: 16 }}
          onPress={handleSave}
        >
          Add Item to Catalog
        </Button>
      </ScrollView>

      {/* Photo Picker Modal */}
      <ImageSelectModal
        visible={selectModalVisible}
        onDismiss={() => setSelectModalVisible(false)}
        onImagesSelected={handleImagesSelected}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  photoContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  photoWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  image: {
    width: 90,
    height: 90,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  deleteBtn: {
    position: 'absolute',
    top: -12,
    right: -12,
    margin: 0,
  },
  addPhotoCard: {
    width: 90,
    height: 90,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  label: {
    marginBottom: 6,
    fontWeight: '500',
  },
  divider: {
    marginVertical: 18,
  },
  helper: {
    marginTop: -10,
    marginBottom: 10,
  },
  saveBtn: {
    marginTop: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
});
