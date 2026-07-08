import { deletePhoto } from '../utils/file';

/**
 * Initializes the SQLite database tables.
 * @param {import('expo-sqlite').SQLiteDatabase} db
 */
export async function migrateDbIfNeeded(db) {
  try {
    // Enable foreign keys
    await db.execAsync('PRAGMA foreign_keys = ON;');
    
    // Create items table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT,
        description TEXT,
        purchasePrice REAL,
        sellingPrice REAL,
        condition TEXT,
        location TEXT,
        notes TEXT,
        dateAdded TEXT NOT NULL,
        isSold INTEGER NOT NULL DEFAULT 0,
        saleDate TEXT,
        finalSellingPrice REAL
      );
    `);

    // Create photos table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS photos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        itemId INTEGER NOT NULL,
        uri TEXT NOT NULL,
        FOREIGN KEY (itemId) REFERENCES items (id) ON DELETE CASCADE
      );
    `);
    
    console.log('Database initialized successfully.');
  } catch (error) {
    console.error('Database migration failed:', error);
  }
}

/**
 * Adds a new item to the inventory.
 * @param {import('expo-sqlite').SQLiteDatabase} db
 * @param {object} item
 * @param {string[]} photoUris
 * @returns {Promise<number>} Inserted item ID
 */
export async function addItem(db, item, photoUris) {
  const dateAdded = item.dateAdded || new Date().toISOString();
  
  const result = await db.runAsync(
    `INSERT INTO items (name, category, description, purchasePrice, sellingPrice, condition, location, notes, dateAdded, isSold)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      item.name,
      item.category || '',
      item.description || '',
      item.purchasePrice || 0,
      item.sellingPrice || 0,
      item.condition || 'Good',
      item.location || '',
      item.notes || '',
      dateAdded
    ]
  );
  
  const itemId = result.lastInsertRowId;
  
  for (const uri of photoUris) {
    await db.runAsync(
      `INSERT INTO photos (itemId, uri) VALUES (?, ?)`,
      [itemId, uri]
    );
  }
  
  return itemId;
}

/**
 * Updates an existing item in the inventory.
 * @param {import('expo-sqlite').SQLiteDatabase} db
 * @param {number} id
 * @param {object} item
 * @param {string[]} photoUris
 */
export async function updateItem(db, id, item, photoUris) {
  // Update item details
  await db.runAsync(
    `UPDATE items SET 
      name = ?, 
      category = ?, 
      description = ?, 
      purchasePrice = ?, 
      sellingPrice = ?, 
      condition = ?, 
      location = ?, 
      notes = ?,
      isSold = ?,
      saleDate = ?,
      finalSellingPrice = ?
     WHERE id = ?`,
    [
      item.name,
      item.category || '',
      item.description || '',
      item.purchasePrice || 0,
      item.sellingPrice || 0,
      item.condition || 'Good',
      item.location || '',
      item.notes || '',
      item.isSold ? 1 : 0,
      item.isSold ? item.saleDate : null,
      item.isSold ? item.finalSellingPrice : null,
      id
    ]
  );
  
  // Update photos database entries:
  // First, fetch the photos currently in db
  const oldPhotos = await db.getAllAsync(`SELECT uri FROM photos WHERE itemId = ?`, [id]);
  const oldUris = oldPhotos.map(p => p.uri);
  
  // Find which old photos are deleted, and physically delete them
  const toDelete = oldUris.filter(uri => !photoUris.includes(uri));
  for (const uri of toDelete) {
    await deletePhoto(uri);
  }
  
  // Re-write database photos: delete all entries and insert current list
  await db.runAsync(`DELETE FROM photos WHERE itemId = ?`, [id]);
  for (const uri of photoUris) {
    await db.runAsync(
      `INSERT INTO photos (itemId, uri) VALUES (?, ?)`,
      [id, uri]
    );
  }
}

/**
 * Deletes an item and its associated photo files from the inventory.
 * @param {import('expo-sqlite').SQLiteDatabase} db
 * @param {number} id
 */
export async function deleteItem(db, id) {
  // Fetch associated photo file paths to clean up physical storage
  const photos = await db.getAllAsync(`SELECT uri FROM photos WHERE itemId = ?`, [id]);
  
  // Delete database record (cascades to photos table)
  await db.runAsync(`DELETE FROM items WHERE id = ?`, [id]);
  
  // Delete physical files
  for (const photo of photos) {
    await deletePhoto(photo.uri);
  }
}

/**
 * Fetches items from inventory based on query filters and sorting.
 * @param {import('expo-sqlite').SQLiteDatabase} db
 * @param {object} params
 * @param {string} params.searchQuery
 * @param {string} params.category
 * @param {string} params.condition
 * @param {string} params.status - 'all' | 'active' | 'sold'
 * @param {string} params.sortBy - 'dateAdded' | 'name' | 'purchasePrice' | 'sellingPrice'
 * @param {string} params.sortOrder - 'ASC' | 'DESC'
 */
export async function getItems(db, {
  searchQuery = '',
  category = 'All',
  condition = 'All',
  status = 'all',
  sortBy = 'dateAdded',
  sortOrder = 'DESC'
} = {}) {
  let query = `
    SELECT i.*, 
      (SELECT uri FROM photos WHERE itemId = i.id LIMIT 1) as thumbnail 
    FROM items i 
    WHERE 1=1
  `;
  const params = [];
  
  // Search query (matches name, description, category, location)
  if (searchQuery.trim() !== '') {
    query += ` AND (i.name LIKE ? OR i.description LIKE ? OR i.category LIKE ? OR i.location LIKE ?)`;
    const wildcard = `%${searchQuery}%`;
    params.push(wildcard, wildcard, wildcard, wildcard);
  }
  
  // Category filter
  if (category !== 'All') {
    query += ` AND i.category = ?`;
    params.push(category);
  }
  
  // Condition filter
  if (condition !== 'All') {
    query += ` AND i.condition = ?`;
    params.push(condition);
  }
  
  // Status filter
  if (status === 'active') {
    query += ` AND i.isSold = 0`;
  } else if (status === 'sold') {
    query += ` AND i.isSold = 1`;
  }
  
  // Sorting (avoid SQL injection by validating fields)
  const allowedSortFields = ['dateAdded', 'name', 'purchasePrice', 'sellingPrice'];
  const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'dateAdded';
  const finalSortOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC';
  
  query += ` ORDER BY i.${finalSortBy} ${finalSortOrder}`;
  
  return await db.getAllAsync(query, params);
}

/**
 * Fetches detailed info for a single item including all photos.
 * @param {import('expo-sqlite').SQLiteDatabase} db
 * @param {number} id
 * @returns {Promise<object|null>} Item object or null if not found
 */
export async function getItemById(db, id) {
  const item = await db.getFirstAsync(`SELECT * FROM items WHERE id = ?`, [id]);
  if (!item) return null;
  
  const photos = await db.getAllAsync(`SELECT uri FROM photos WHERE itemId = ?`, [id]);
  item.photos = photos.map(p => p.uri);
  return item;
}

/**
 * Marks an item as sold.
 * @param {import('expo-sqlite').SQLiteDatabase} db
 * @param {number} id
 * @param {string} saleDate - ISO Date String
 * @param {number} finalSellingPrice
 */
export async function markItemAsSold(db, id, saleDate, finalSellingPrice) {
  await db.runAsync(
    `UPDATE items SET 
      isSold = 1, 
      saleDate = ?, 
      finalSellingPrice = ? 
     WHERE id = ?`,
    [saleDate, finalSellingPrice, id]
  );
}

/**
 * Fetches dashboard aggregation statistics.
 * @param {import('expo-sqlite').SQLiteDatabase} db
 */
export async function getDashboardStats(db) {
  // Total active items (isSold = 0) and their cost & potential revenue
  const activeStats = await db.getFirstAsync(`
    SELECT 
      COUNT(*) as count,
      SUM(purchasePrice) as costBasis,
      SUM(sellingPrice) as potentialRevenue
    FROM items 
    WHERE isSold = 0
  `);
  
  // Total sold items (isSold = 1) and their cost & actual revenue
  const soldStats = await db.getFirstAsync(`
    SELECT 
      COUNT(*) as count,
      SUM(purchasePrice) as costBasis,
      SUM(finalSellingPrice) as revenue
    FROM items 
    WHERE isSold = 1
  `);
  
  const activeCount = activeStats?.count || 0;
  const activeCostBasis = activeStats?.costBasis || 0;
  const activePotentialRevenue = activeStats?.potentialRevenue || 0;
  const activePotentialProfit = activePotentialRevenue - activeCostBasis;

  const soldCount = soldStats?.count || 0;
  const soldCostBasis = soldStats?.costBasis || 0;
  const soldRevenue = soldStats?.revenue || 0;
  const soldProfit = soldRevenue - soldCostBasis;

  return {
    active: {
      count: activeCount,
      costBasis: activeCostBasis,
      potentialRevenue: activePotentialRevenue,
      potentialProfit: activePotentialProfit,
    },
    sold: {
      count: soldCount,
      costBasis: soldCostBasis,
      revenue: soldRevenue,
      profit: soldProfit,
    },
    totalItems: activeCount + soldCount,
  };
}

/**
 * Fetches all categories currently used in the inventory, for filters.
 * @param {import('expo-sqlite').SQLiteDatabase} db
 */
export async function getCategories(db) {
  const rows = await db.getAllAsync(`SELECT DISTINCT category FROM items WHERE category IS NOT NULL AND category != '' ORDER BY category ASC`);
  return rows.map(r => r.category);
}
