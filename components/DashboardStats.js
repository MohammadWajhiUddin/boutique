import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Card, Text, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');
const cardWidth = (width - 40) / 2; // Two columns with padding

export default function DashboardStats({ stats }) {
  const { theme } = useAppTheme();
  
  if (!stats) return null;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const statCards = [
    {
      title: 'Active Items',
      value: String(stats.active.count),
      icon: 'treasure-chest',
      color: theme.colors.primary,
      backgroundColor: theme.colors.primaryContainer,
      description: 'Items currently in booth',
    },
    {
      title: 'Inventory Cost',
      value: formatCurrency(stats.active.costBasis),
      icon: 'hand-coin',
      color: theme.colors.secondary,
      backgroundColor: theme.colors.secondaryContainer,
      description: 'Capital tied in inventory',
    },
    {
      title: 'Sold Items',
      value: String(stats.sold.count),
      icon: 'tag-check',
      color: '#4A8A55',
      backgroundColor: '#E2EFE3',
      description: 'Total items sold',
    },
    {
      title: 'Realized Profit',
      value: formatCurrency(stats.sold.profit),
      icon: 'trending-up',
      color: theme.colors.accent,
      backgroundColor: theme.colors.isDarkMode ? '#332F2B' : '#FFF9EE',
      description: 'Total revenue minus cost',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Hero card showing overall health */}
      <Surface style={[styles.heroCard, { backgroundColor: theme.colors.surfaceVariant }]} elevation={1}>
        <View style={styles.heroRow}>
          <View>
            <Text variant="titleSmall" style={{ color: theme.colors.onSurfaceVariant, fontFamily: 'serif' }}>
              TOTAL BOOTH VALUE
            </Text>
            <Text variant="headlineLarge" style={[styles.heroValue, { color: theme.colors.primary }]}>
              {formatCurrency(stats.active.potentialRevenue)}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Potential retail value of {stats.active.count} active items
            </Text>
          </View>
          <MaterialCommunityIcons name="storefront" size={56} color={theme.colors.primary} style={styles.heroIcon} />
        </View>
      </Surface>

      {/* Grid of stats */}
      <View style={styles.grid}>
        {statCards.map((card, index) => (
          <Card key={index} style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="outlined">
            <Card.Content style={styles.cardContent}>
              <View style={styles.headerRow}>
                <Surface style={[styles.iconContainer, { backgroundColor: card.backgroundColor }]} elevation={0}>
                  <MaterialCommunityIcons name={card.icon} size={22} color={card.color} />
                </Surface>
              </View>
              <Text variant="titleMedium" style={[styles.cardValue, { color: theme.colors.onSurface }]}>
                {card.value}
              </Text>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, fontWeight: 'bold' }}>
                {card.title}
              </Text>
              <Text variant="bodySmall" style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
                {card.description}
              </Text>
            </Card.Content>
          </Card>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  heroCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroValue: {
    fontWeight: 'bold',
    fontFamily: 'serif',
    marginVertical: 4,
  },
  heroIcon: {
    opacity: 0.85,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: cardWidth - 4,
    marginBottom: 16,
    borderRadius: 14,
  },
  cardContent: {
    padding: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardValue: {
    fontWeight: 'bold',
    fontSize: 20,
    fontFamily: 'serif',
  },
  description: {
    fontSize: 10,
    marginTop: 4,
  },
});
