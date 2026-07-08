import * as FileSystem from 'expo-file-system';

const PHOTOS_DIR = `${FileSystem.documentDirectory}photos/`;

/**
 * Ensures that the photos directory exists in the document directory.
 */
export async function ensureDirExists() {
  try {
    const dirInfo = await FileSystem.getInfoAsync(PHOTOS_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(PHOTOS_DIR, { intermediates: true });
    }
  } catch (error) {
    console.error('Error ensuring directory exists:', error);
  }
}

/**
 * Copies a temporary photo URI to persistent storage.
 * @param {string} tempUri - Temporary path from camera or image picker
 * @returns {Promise<string>} Persistent file URI
 */
export async function savePhoto(tempUri) {
  await ensureDirExists();
  const filename = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.jpg`;
  const destUri = `${PHOTOS_DIR}${filename}`;
  await FileSystem.copyAsync({ from: tempUri, to: destUri });
  return destUri;
}

/**
 * Deletes a physical file from the local storage.
 * @param {string} uri - Absolute path/URI to delete
 */
export async function deletePhoto(uri) {
  try {
    // Only delete files that are stored in our photos directory to prevent accidental deletions
    if (uri && uri.startsWith(PHOTOS_DIR)) {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(uri);
      }
    }
  } catch (error) {
    console.error('Error deleting photo:', error);
  }
}

/**
 * Cleans up physically stored photos that are no longer used.
 * @param {string[]} oldUris - URIs previously saved for an item
 * @param {string[]} currentUris - URIs currently saved/kept for the item
 */
export async function cleanupPhotos(oldUris, currentUris) {
  const toDelete = oldUris.filter(uri => !currentUris.includes(uri));
  for (const uri of toDelete) {
    await deletePhoto(uri);
  }
}
