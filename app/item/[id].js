import React, { useState, useCallback } from 'react';
import { ScrollView, StyleSheet, View, Alert } from 'react-native';
import { Text, Button, Surface, Card, IconButton, Portal, Dialog, TextInput, Divider, ActivityIndicator } from 'react-native-paper';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { getItemById, deleteItem, markItemAsSold } from '../../database/db';
import { useAppTheme } from '../../context/ThemeContext';
import PhotoGallery from '../../components/PhotoGallery';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ItemDetailsScreen() {
  const { id } = useLocalSearchParams();
  const db = useSQLiteContext();
  const router = useRouter();
  const { theme } = useAppTheme();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Mark as sold modal state
  const [soldModalVisible, setSoldModalVisible] = useState(false);
  const [salePrice, setSalePrice] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchItemDetails = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getItemById(db, parseInt(id, 10));
      if (data) {
        setItem(data);
        setSalePrice(String(data.sellingPrice)); // pre-populate with listed price
      } else {
        Alert.alert('Error', 'Item not found in ledger');
        router.back();
      }
    } catch (error) {
      console.error('Error fetching item details:', error);
    } finally {
      setLoading(false);
    }
  }, [db, id]);

  useFocusEffect(
    useCallback(() => {
      fetchItemDetails();
    }, [fetchItemDetails])
  );

  const handleDelete = () => {
    Alert.alert(
      'Delete Artifact',
      'Are you sure you want to remove this item permanently from your inventory and delete its photos?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteItem(db, parseInt(id, 10));
              router.back();
            } catch (error) {
              console.error('Error deleting item:', error);
              Alert.alert('Error', 'Failed to delete item.');
            }
          }
        }
      ]
    );
  };

  const handleMarkAsSold = async () => {
    const finalPrice = parseFloat(salePrice);
    if (isNaN(finalPrice) || finalPrice < 0) {
      Alert.alert('Invalid Price', 'Please enter a valid selling price.');
      return;
    }

    try {
      const formattedSaleDate = new Date(saleDate).toISOString();
      await markItemAsSold(db, parseInt(id, 10), formattedSaleDate, finalPrice);
      setSoldModalVisible(false);
      fetchItemDetails(); // Refresh detail screen data
    } catch (error) {
      console.error('Error marking item as sold:', error);
      Alert.alert('Error', 'Failed to update item status.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 12, fontStyle: 'italic' }}>Loading item ledger...</Text>
      </View>
    );
  }

  if (!item) return null;

  const profit = item.isSold
    ? (item.finalSellingPrice || 0) - (item.purchasePrice || 0)
    : (item.sellingPrice || 0) - (item.purchasePrice || 0);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val);
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Photo Gallery component */}
        <PhotoGallery photos={item.photos} />

        {/* Sold overlay / status banner */}
        {item.isSold ? (
          <Surface style={[styles.soldBanner, { backgroundColor: theme.colors.primary }]} elevation={1}>
            <MaterialCommunityIcons name="tag-check" size={24} color="#fff" />
            <Text style={styles.soldBannerText}>
              Sold for {formatCurrency(item.finalSellingPrice)} on {formatDate(item.saleDate)}
            </Text>
          </Surface>
        ) : null}

        {/* Main Details Panel */}
        <View style={styles.detailsContent}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onSurface, fontFamily: 'serif' }]}>
                {item.name}
              </Text>
              {item.category ? (
                <Text variant="titleMedium" style={{ color: theme.colors.secondary, fontStyle: 'italic' }}>
                  {item.category}
                </Text>
              ) : null}
            </View>
            
            {/* Action buttons (Edit/Delete) */}
            <View style={styles.actionHeaderBtns}>
              <IconButton
                icon="pencil"
                iconColor={theme.colors.primary}
                size={22}
                onPress={() => router.push({ pathname: '/item/edit', params: { id: item.id } })}
              />
              <IconButton
                icon="trash-can-outline"
                iconColor={theme.colors.error}
                size={22}
                onPress={handleDelete}
              />
            </View>
          </View>

          {/* Quick Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>Condition</Text>
              <Text variant="titleMedium" style={[styles.statValue, { color: theme.colors.onSurface }]}>{item.condition}</Text>
            </View>
            <View style={styles.statBox}>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>Location</Text>
              <Text variant="titleMedium" style={[styles.statValue, { color: theme.colors.onSurface }]}>{item.location || 'Not Set'}</Text>
            </View>
            <View style={styles.statBox}>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>Date Cataloged</Text>
              <Text variant="titleMedium" style={[styles.statValue, { color: theme.colors.onSurface }]}>{formatDate(item.dateAdded)}</Text>
            </View>
          </View>

          {/* Financial summary card */}
          <Card style={[styles.financialCard, { backgroundColor: theme.colors.surface }]} mode="outlined">
            <Card.Content>
              <Text variant="titleMedium" style={[styles.cardTitle, { color: theme.colors.onSurface, fontFamily: 'serif' }]}>
                Ledger Breakdown
              </Text>
              
              <View style={styles.ledgerRow}>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Acquisition Cost</Text>
                <Text variant="bodyLarge" style={{ color: theme.colors.onSurface, fontWeight: '500' }}>
                  {formatCurrency(item.purchasePrice)}
                </Text>
              </View>
              
              <View style={styles.ledgerRow}>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  {item.isSold ? 'Final Sales Price' : 'Listed Retail Price'}
                </Text>
                <Text variant="bodyLarge" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                  {formatCurrency(item.isSold ? item.finalSellingPrice : item.sellingPrice)}
                </Text>
              </View>

              <Divider style={styles.divider} />

              <View style={styles.ledgerRow}>
                <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>
                  {item.isSold ? 'Realized Profit' : 'Expected Profit'}
                </Text>
                <Text 
                  variant="titleLarge" 
                  style={{ 
                    color: profit >= 0 ? theme.colors.success : theme.colors.error, 
                    fontWeight: 'bold',
                    fontFamily: 'serif'
                  }}
                >
                  {formatCurrency(profit)}
                </Text>
              </View>
            </Card.Content>
          </Card>

          {/* Item Description */}
          {item.description ? (
            <View style={styles.memoSection}>
              <Text variant="titleMedium" style={[styles.memoTitle, { color: theme.colors.onSurface, fontFamily: 'serif' }]}>
                Description
              </Text>
              <Text variant="bodyMedium" style={[styles.memoBody, { color: theme.colors.onSurfaceVariant }]}>
                {item.description}
              </Text>
            </View>
          ) : null}

          {/* Item Notes */}
          {item.notes ? (
            <View style={styles.memoSection}>
              <Text variant="titleMedium" style={[styles.memoTitle, { color: theme.colors.onSurface, fontFamily: 'serif' }]}>
                Curator Notes
              </Text>
              <Text variant="bodyMedium" style={[styles.memoBody, { color: theme.colors.onSurfaceVariant }]}>
                {item.notes}
              </Text>
            </View>
          ) : null}

        </View>
      </ScrollView>

      {/* Mark As Sold Action Button at the bottom if item is active */}
      {!item.isSold && (
        <Surface style={[styles.bottomActionBar, { backgroundColor: theme.colors.surface }]} elevation={3}>
          <Button 
            mode="contained" 
            icon="tag" 
            style={styles.soldActionBtn}
            buttonColor={theme.colors.primary}
            textColor="#fff"
            labelStyle={{ fontWeight: 'bold', fontSize: 16 }}
            onPress={() => {
              setSalePrice(String(item.sellingPrice));
              setSoldModalVisible(true);
            }}
          >
            Mark as Sold
          </Button>
        </Surface>
      )}

      {/* Mark As Sold Dialog */}
      <Portal>
        <Dialog 
          visible={soldModalVisible} 
          onDismiss={() => setSoldModalVisible(false)}
          style={{ backgroundColor: theme.colors.surface }}
        >
          <Dialog.Title style={{ fontFamily: 'serif', color: theme.colors.primary }}>Record Sale</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ marginBottom: 16, color: theme.colors.onSurfaceVariant }}>
              Enter the final selling price and date of sale for this item.
            </Text>
            
            <TextInput
              label="Final Selling Price ($)"
              value={salePrice}
              onChangeText={setSalePrice}
              keyboardType="numeric"
              mode="outlined"
              activeOutlineColor={theme.colors.primary}
              style={{ marginBottom: 12 }}
            />

            <TextInput
              label="Sale Date (YYYY-MM-DD)"
              value={saleDate}
              onChangeText={setSaleDate}
              placeholder="YYYY-MM-DD"
              mode="outlined"
              activeOutlineColor={theme.colors.primary}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setSoldModalVisible(false)}>Cancel</Button>
            <Button 
              mode="contained" 
              onPress={handleMarkAsSold} 
              buttonColor={theme.colors.primary}
              textColor="#fff"
            >
              Record
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  soldBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  soldBannerText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 8,
  },
  detailsContent: {
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
  },
  actionHeaderBtns: {
    flexDirection: 'row',
    marginTop: -8,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    paddingRight: 8,
  },
  statValue: {
    fontWeight: 'bold',
    marginTop: 2,
  },
  financialCard: {
    borderRadius: 12,
    marginBottom: 24,
  },
  cardTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  ledgerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  divider: {
    marginVertical: 12,
  },
  memoSection: {
    marginBottom: 20,
  },
  memoTitle: {
    fontWeight: 'bold',
    marginBottom: 6,
  },
  memoBody: {
    lineHeight: 20,
  },
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  soldActionBtn: {
    borderRadius: 8,
    paddingVertical: 4,
  },
});
