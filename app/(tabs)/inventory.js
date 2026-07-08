import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, FlatList, Pressable } from 'react-native';
import { Text, Searchbar, IconButton, Surface, Chip, SegmentedButtons, ActivityIndicator, Portal, Modal, Button } from 'react-native-paper';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from 'expo-router';
import { getItems, getCategories } from '../../database/db';
import { useAppTheme } from '../../context/ThemeContext';
import ItemCard from '../../components/ItemCard';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function InventoryScreen() {
  const db = useSQLiteContext();
  const { theme } = useAppTheme();
  
  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | active | sold
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [conditionFilter, setConditionFilter] = useState('All');
  
  // Sorting State
  const [sortBy, setSortBy] = useState('dateAdded'); // dateAdded | name | purchasePrice | sellingPrice
  const [sortOrder, setSortOrder] = useState('DESC'); // ASC | DESC
  
  // Data State
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Load items
  const fetchItems = useCallback(async () => {
    try {
      const data = await getItems(db, {
        searchQuery,
        category: categoryFilter,
        condition: conditionFilter,
        status: statusFilter,
        sortBy,
        sortOrder
      });
      setItems(data);
      
      const cats = await getCategories(db);
      setCategories(['All', ...cats]);
    } catch (error) {
      console.error('Error fetching inventory items:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [db, searchQuery, categoryFilter, conditionFilter, statusFilter, sortBy, sortOrder]);

  useFocusEffect(
    useCallback(() => {
      fetchItems();
    }, [fetchItems])
  );

  // Trigger search on query change (with small debounce if needed, but simple trigger is fine)
  useEffect(() => {
    fetchItems();
  }, [searchQuery, statusFilter, categoryFilter, conditionFilter, sortBy, sortOrder]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchItems();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCategoryFilter('All');
    setConditionFilter('All');
    setSortBy('dateAdded');
    setSortOrder('DESC');
  };

  const getSortIcon = (field) => {
    if (sortBy === field) {
      return sortOrder === 'ASC' ? 'arrow-up' : 'arrow-down';
    }
    return null;
  };

  const handleSortPress = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === 'ASC' ? 'DESC' : 'ASC'));
    } else {
      setSortBy(field);
      setSortOrder('DESC');
    }
  };

  const activeFiltersCount = 
    (statusFilter !== 'all' ? 1 : 0) + 
    (categoryFilter !== 'All' ? 1 : 0) + 
    (conditionFilter !== 'All' ? 1 : 0);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Top Search bar area */}
      <Surface style={[styles.topBar, { backgroundColor: theme.colors.surface }]} elevation={1}>
        <View style={styles.searchRow}>
          <Searchbar
            placeholder="Search inventory..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={[styles.searchBar, { backgroundColor: theme.colors.surfaceVariant }]}
            iconColor={theme.colors.primary}
            inputStyle={{ color: theme.colors.onSurface }}
          />
          <IconButton
            icon="filter-variant"
            selected={activeFiltersCount > 0}
            iconColor={activeFiltersCount > 0 ? theme.colors.primary : theme.colors.onSurfaceVariant}
            containerColor={activeFiltersCount > 0 ? theme.colors.primaryContainer : 'transparent'}
            size={24}
            onPress={() => setFilterModalVisible(true)}
          />
        </View>
        
        {/* Active Filters Indicators */}
        {activeFiltersCount > 0 && (
          <View style={styles.activeFiltersRow}>
            {statusFilter !== 'all' && (
              <Chip 
                onClose={() => setStatusFilter('all')} 
                style={styles.chip}
                textStyle={{ fontSize: 11 }}
              >
                Status: {statusFilter}
              </Chip>
            )}
            {categoryFilter !== 'All' && (
              <Chip 
                onClose={() => setCategoryFilter('All')} 
                style={styles.chip}
                textStyle={{ fontSize: 11 }}
              >
                Cat: {categoryFilter}
              </Chip>
            )}
            {conditionFilter !== 'All' && (
              <Chip 
                onClose={() => setConditionFilter('All')} 
                style={styles.chip}
                textStyle={{ fontSize: 11 }}
              >
                Cond: {conditionFilter}
              </Chip>
            )}
            <Button compact mode="text" onPress={clearFilters} labelStyle={{ fontSize: 11 }}>
              Clear
            </Button>
          </View>
        )}
      </Surface>

      {/* Main List */}
      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ marginTop: 12, fontStyle: 'italic' }}>Fetching catalog...</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={({ item }) => <ItemCard item={item} />}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          onRefresh={onRefresh}
          refreshing={refreshing}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="treasure-chest" size={80} color={theme.colors.outline} />
              <Text variant="headlineSmall" style={[styles.emptyTitle, { color: theme.colors.onSurfaceVariant, fontFamily: 'serif' }]}>
                No Artifacts Found
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginHorizontal: 32 }}>
                Try modifying your search query or filters, or add your first booth item.
              </Text>
              {activeFiltersCount > 0 && (
                <Button mode="outlined" style={styles.clearBtn} onPress={clearFilters}>
                  Clear All Filters
                </Button>
              )}
            </View>
          }
        />
      )}

      {/* Filter / Sort Portal Modal */}
      <Portal>
        <Modal
          visible={filterModalVisible}
          onDismiss={() => setFilterModalVisible(false)}
          contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.surface }]}
        >
          <View style={styles.modalHeader}>
            <Text variant="titleLarge" style={[styles.modalTitle, { color: theme.colors.primary, fontFamily: 'serif' }]}>
              Filter & Sort Ledger
            </Text>
            <IconButton icon="close" onPress={() => setFilterModalVisible(false)} />
          </View>
          
          <FlatList
            data={[1]} // Dummy data for scrolling body
            renderItem={() => (
              <View style={styles.modalBody}>
                {/* Status Segmented Buttons */}
                <Text variant="titleSmall" style={[styles.fieldLabel, { color: theme.colors.onSurface }]}>Status</Text>
                <SegmentedButtons
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                  buttons={[
                    { value: 'all', label: 'All' },
                    { value: 'active', label: 'Active' },
                    { value: 'sold', label: 'Sold' },
                  ]}
                  style={styles.segmentedBtn}
                />

                {/* Categories */}
                <Text variant="titleSmall" style={[styles.fieldLabel, { color: theme.colors.onSurface }]}>Category</Text>
                <View style={styles.categoriesRow}>
                  {categories.length > 0 ? (
                    categories.map((cat, i) => (
                      <Chip
                        key={i}
                        selected={categoryFilter === cat}
                        onPress={() => setCategoryFilter(cat)}
                        style={styles.filterChip}
                        showSelectedCheck={false}
                      >
                        {cat}
                      </Chip>
                    ))
                  ) : (
                    <Text variant="bodySmall" style={{ fontStyle: 'italic' }}>No categories created yet</Text>
                  )}
                </View>

                {/* Condition */}
                <Text variant="titleSmall" style={[styles.fieldLabel, { color: theme.colors.onSurface }]}>Condition</Text>
                <View style={styles.categoriesRow}>
                  {['All', 'Mint', 'Excellent', 'Good', 'Fair', 'Poor'].map((cond, i) => (
                    <Chip
                      key={i}
                      selected={conditionFilter === cond}
                      onPress={() => setConditionFilter(cond)}
                      style={styles.filterChip}
                      showSelectedCheck={false}
                    >
                      {cond}
                    </Chip>
                  ))}
                </View>

                {/* Sorting Field Buttons */}
                <Text variant="titleSmall" style={[styles.fieldLabel, { color: theme.colors.onSurface }]}>Sort By</Text>
                <View style={styles.sortRow}>
                  {[
                    { field: 'dateAdded', label: 'Date Added' },
                    { field: 'name', label: 'Item Name' },
                    { field: 'purchasePrice', label: 'Cost Price' },
                    { field: 'sellingPrice', label: 'Retail Price' },
                  ].map((sOption, idx) => (
                    <Button
                      key={idx}
                      mode={sortBy === sOption.field ? 'contained' : 'outlined'}
                      onPress={() => handleSortPress(sOption.field)}
                      style={styles.sortButton}
                      labelStyle={{ fontSize: 12 }}
                      icon={getSortIcon(sOption.field)}
                      contentStyle={{ flexDirection: 'row-reverse' }}
                    >
                      {sOption.label}
                    </Button>
                  ))}
                </View>
              </View>
            )}
            keyExtractor={(_, i) => String(i)}
            showsVerticalScrollIndicator={false}
          />

          <View style={styles.modalFooter}>
            <Button onPress={clearFilters} style={{ marginRight: 8 }}>
              Reset All
            </Button>
            <Button mode="contained" onPress={() => setFilterModalVisible(false)} buttonColor={theme.colors.primary} textColor="#fff">
              Apply Filters
            </Button>
          </View>
        </Modal>
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
  topBar: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    elevation: 0,
  },
  activeFiltersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    alignItems: 'center',
  },
  chip: {
    marginRight: 6,
    marginVertical: 2,
    height: 30,
    justifyContent: 'center',
  },
  listContent: {
    paddingTop: 12,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 4,
  },
  clearBtn: {
    marginTop: 16,
    borderRadius: 8,
  },
  modalContent: {
    margin: 20,
    borderRadius: 16,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  modalTitle: {
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
  },
  fieldLabel: {
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
  },
  segmentedBtn: {
    marginBottom: 8,
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  filterChip: {
    marginRight: 6,
    marginBottom: 6,
  },
  sortRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  sortButton: {
    width: '48%',
    marginBottom: 10,
    borderRadius: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
});
