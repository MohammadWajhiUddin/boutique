import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

/**
 * Escapes characters for CSV formatting.
 * @param {any} val - Value to escape
 * @returns {string} CSV safe string
 */
function escapeCSV(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  // If string contains commas, quotes, or newlines, wrap in quotes and escape internal quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generates and shares a CSV file of the inventory.
 * @param {object[]} items - List of inventory items
 */
export async function exportInventoryToCSV(items) {
  try {
    const headers = [
      'ID',
      'Item Name',
      'Category',
      'Description',
      'Condition',
      'Purchase Price ($)',
      'Listed Selling Price ($)',
      'Booth Location',
      'Date Added',
      'Status',
      'Sale Date',
      'Final Selling Price ($)',
      'Profit ($)',
      'Notes'
    ];

    const rows = items.map(item => {
      const profit = item.isSold 
        ? (item.finalSellingPrice || 0) - (item.purchasePrice || 0)
        : (item.sellingPrice || 0) - (item.purchasePrice || 0);
        
      return [
        item.id,
        item.name,
        item.category || '',
        item.description || '',
        item.condition || 'Good',
        item.purchasePrice || 0,
        item.sellingPrice || 0,
        item.location || '',
        item.dateAdded ? new Date(item.dateAdded).toLocaleDateString() : '',
        item.isSold ? 'Sold' : 'Active',
        item.saleDate ? new Date(item.saleDate).toLocaleDateString() : '',
        item.isSold ? (item.finalSellingPrice || 0) : '',
        profit.toFixed(2),
        item.notes || ''
      ].map(escapeCSV).join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    
    // Create folder in cache if it doesn't exist, and write file
    const filename = `Antique_Inventory_Export_${new Date().toISOString().slice(0, 10)}.csv`;
    const fileUri = `${FileSystem.cacheDirectory}${filename}`;
    
    await FileSystem.writeAsStringAsync(fileUri, csvContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // Share the file
    const sharingAvailable = await Sharing.isAvailableAsync();
    if (sharingAvailable) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Inventory CSV',
        UTI: 'public.comma-separated-values-text', // iOS file identification type
      });
    } else {
      Alert.alert('Error', 'Sharing is not available on this device');
    }
  } catch (error) {
    console.error('Failed to export CSV:', error);
    Alert.alert('Error', 'Failed to generate and share CSV export: ' + error.message);
  }
}
