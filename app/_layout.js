import React from 'react';
import { SQLiteProvider } from 'expo-sqlite';
import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { AppThemeProvider, useAppTheme } from '../context/ThemeContext';
import { migrateDbIfNeeded } from '../database/db';
import { StatusBar } from 'expo-status-bar';

function AppContent() {
  const { theme, isDarkMode } = useAppTheme();

  return (
    <PaperProvider theme={theme}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.surface,
          },
          headerTintColor: theme.colors.primary,
          headerTitleStyle: {
            fontWeight: 'bold',
            fontFamily: 'serif',
          },
          contentStyle: {
            backgroundColor: theme.colors.background,
          },
          headerShadowVisible: false,
        }}
      >
        {/* Tab routes */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* Detailed screens */}
        <Stack.Screen name="item/[id]" options={{ title: 'Item Details', headerTitleAlign: 'center' }} />
        <Stack.Screen name="item/add" options={{ title: 'Add Inventory Item', headerTitleAlign: 'center' }} />
        <Stack.Screen name="item/edit" options={{ title: 'Edit Item', headerTitleAlign: 'center' }} />
        <Stack.Screen name="custom-camera" options={{ title: 'Camera', headerShown: false }} />
      </Stack>
    </PaperProvider>
  );
}

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="inventory.db" onInit={migrateDbIfNeeded}>
      <AppThemeProvider>
        <AppContent />
      </AppThemeProvider>
    </SQLiteProvider>
  );
}
