import React from 'react';
import { View, StyleSheet, Image, Pressable } from 'react-native';
import { Card, Text, Badge, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';

export default function ItemCard({ item }) {
  const { theme } = useAppTheme();

  const profit = item.isSold
    ? (item.finalSellingPrice || 0) - (item.purchasePrice || 0)
    : (item.sellingPrice || 0) - (item.purchasePrice || 0);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val);
  };

  return (
    <Link href={`/item/${item.id}`} asChild>
      <Pressable style={styles.cardPressable}>
        <Card 
          style={[
            styles.card, 
            { backgroundColor: theme.colors.surface },
            item.isSold && { borderColor: theme.colors.primary, borderWidth: 1 }
          ]} 
          mode="outlined"
        >
          <View style={styles.contentRow}>
            {/* Thumbnail Image */}
            <View style={styles.imageContainer}>
              {item.thumbnail ? (
                <Image source={{ uri: item.thumbnail }} style={styles.image} />
              ) : (
                <Surface style={[styles.fallbackContainer, { backgroundColor: theme.colors.surfaceVariant }]} elevation={0}>
                  <MaterialCommunityIcons name="image-off-outline" size={32} color={theme.colors.onSurfaceVariant} />
                </Surface>
              )}
              {item.isSold && (
                <View style={[styles.soldOverlay, { backgroundColor: theme.colors.soldOverlay }]}>
                  <Badge style={[styles.soldBadge, { backgroundColor: theme.colors.primary }]}>SOLD</Badge>
                </View>
              )}
            </View>

            {/* Details Section */}
            <View style={styles.detailsContainer}>
              <View style={styles.titleRow}>
                <Text variant="titleMedium" numberOfLines={1} style={[styles.title, { color: theme.colors.onSurface }]}>
                  {item.name}
                </Text>
              </View>

              {item.category ? (
                <Text variant="bodySmall" style={[styles.category, { color: theme.colors.secondary }]}>
                  {item.category}
                </Text>
              ) : null}

              {/* Price Details */}
              <View style={styles.pricesRow}>
                <View style={styles.priceCol}>
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>Cost</Text>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontWeight: '500' }}>
                    {formatCurrency(item.purchasePrice)}
                  </Text>
                </View>
                <View style={styles.priceCol}>
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {item.isSold ? 'Sold Price' : 'List Price'}
                  </Text>
                  <Text 
                    variant="bodyMedium" 
                    style={{ 
                      color: item.isSold ? theme.colors.primary : theme.colors.primary, 
                      fontWeight: 'bold' 
                    }}
                  >
                    {formatCurrency(item.isSold ? item.finalSellingPrice : item.sellingPrice)}
                  </Text>
                </View>
                <View style={styles.priceCol}>
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {item.isSold ? 'Profit' : 'Est. Profit'}
                  </Text>
                  <Text 
                    variant="bodyMedium" 
                    style={{ 
                      color: profit >= 0 ? theme.colors.success : theme.colors.error, 
                      fontWeight: 'bold' 
                    }}
                  >
                    {formatCurrency(profit)}
                  </Text>
                </View>
              </View>

              {/* Location & Condition Footer */}
              <View style={styles.cardFooter}>
                {item.location ? (
                  <View style={styles.footerItem}>
                    <MaterialCommunityIcons name="map-marker-outline" size={14} color={theme.colors.onSurfaceVariant} />
                    <Text variant="bodySmall" style={[styles.footerText, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>
                      {item.location}
                    </Text>
                  </View>
                ) : null}
                <View style={[styles.conditionContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {item.condition}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Card>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  cardPressable: {
    marginBottom: 12,
    marginHorizontal: 16,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  contentRow: {
    flexDirection: 'row',
    height: 110,
  },
  imageContainer: {
    position: 'relative',
    width: 110,
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  fallbackContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldBadge: {
    fontSize: 11,
    paddingHorizontal: 8,
    fontWeight: 'bold',
  },
  detailsContainer: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    fontFamily: 'serif',
    flex: 1,
  },
  category: {
    marginTop: -2,
    fontStyle: 'italic',
  },
  pricesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  priceCol: {
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  footerText: {
    marginLeft: 2,
    fontSize: 11,
  },
  conditionContainer: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 8,
  },
});
