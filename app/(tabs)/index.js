import React, { useState, useCallback } from 'react';
import { ScrollView, StyleSheet, View, RefreshControl } from 'react-native';
import { Text, Button, Surface, IconButton, ActivityIndicator, FAB } from 'react-native-paper';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect, useRouter } from 'expo-router';
import { getDashboardStats, getItems } from '../../database/db';
import { exportInventoryToCSV } from '../../utils/csv';
import { useAppTheme } from '../../context/ThemeContext';
import DashboardStats from '../../components/DashboardStats';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { isDarkMode, toggleTheme, theme } = useAppTheme();
  
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const data = await getDashboardStats(db);
      setStats(data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [fetchStats])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const allItems = await getItems(db, { status: 'all' });
      await exportInventoryToCSV(allItems);
    } catch (error) {
      console.error('CSV Export error:', error);
    } finally {
      setExporting(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 12, fontStyle: 'italic' }}>Curating your collection...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header Appbar replacement */}
      <Surface style={[styles.customHeader, { backgroundColor: theme.colors.surface }]} elevation={1}>
        <View style={styles.headerTitleContainer}>
          <Text variant="headlineSmall" style={[styles.headerTitle, { color: theme.colors.primary }]}>
            Antique Booth
          </Text>
          <Text variant="labelMedium" style={{ color: theme.colors.secondary, fontStyle: 'italic' }}>
            Inventory Ledger
          </Text>
        </View>
        <View style={styles.headerActions}>
          <IconButton
            icon={isDarkMode ? 'weather-sunny' : 'weather-night'}
            iconColor={theme.colors.primary}
            size={24}
            onPress={toggleTheme}
            accessibilityLabel="Toggle Dark/Light Mode"
          />
          <IconButton
            icon="file-export-outline"
            iconColor={theme.colors.primary}
            size={24}
            onPress={handleExportCSV}
            disabled={exporting}
            accessibilityLabel="Export Inventory as CSV"
          />
        </View>
      </Surface>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
        }
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text variant="headlineMedium" style={[styles.titleText, { color: theme.colors.onSurface }]}>
            Welcome back, Curator
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Here is the current state of your booth inventory.
          </Text>
        </View>

        {/* Dashboard statistics components */}
        {stats && <DashboardStats stats={stats} />}

        {/* Quick actions panel */}
        <View style={styles.quickActionsContainer}>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Booth Ledger Actions
          </Text>
          <View style={styles.actionButtonsRow}>
            {/* Add New Item */}
            <Button
              mode="contained"
              icon="plus"
              style={styles.actionButton}
              buttonColor={theme.colors.primary}
              textColor="#fff"
              onPress={() => router.push('/item/add')}
            >
              Add Item
            </Button>
            {/* Go to Inventory list */}
            <Button
              mode="outlined"
              icon="format-list-bulleted"
              style={styles.actionButton}
              textColor={theme.colors.primary}
              onPress={() => router.push('/inventory')}
            >
              View List
            </Button>
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color="#fff"
        onPress={() => router.push('/item/add')}
        label="New Item"
      />
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
  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerTitleContainer: {
    justifyContent: 'center',
  },
  headerTitle: {
    fontWeight: 'bold',
    fontFamily: 'serif',
    lineHeight: 28,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 100, // accommodate FAB
  },
  welcomeSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  titleText: {
    fontFamily: 'serif',
    fontWeight: 'bold',
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  sectionTitle: {
    fontFamily: 'serif',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
});
