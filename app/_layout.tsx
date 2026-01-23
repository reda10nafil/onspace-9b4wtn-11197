// FurInventory Pro - Root Layout
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { InventoryProvider } from '../contexts/InventoryContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <InventoryProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen 
            name="product/[id]" 
            options={{ 
              headerShown: false,
            }} 
          />
          <Stack.Screen 
            name="product/edit/[id]" 
            options={{ 
              headerShown: false,
            }} 
          />
          <Stack.Screen 
            name="scanner-action" 
            options={{ 
              presentation: 'modal',
              headerShown: true,
              headerStyle: { backgroundColor: '#1A1A1A' },
              headerTintColor: '#D4AF37',
              headerTitle: 'Azione Rapida',
            }} 
          />
          <Stack.Screen 
            name="settings/locations" 
            options={{ 
              headerShown: true,
              headerStyle: { backgroundColor: '#0A0A0A' },
              headerTintColor: '#D4AF37',
              headerTitle: 'Gestisci Posizioni',
            }} 
          />
          <Stack.Screen 
            name="settings/fields" 
            options={{ 
              headerShown: true,
              headerStyle: { backgroundColor: '#0A0A0A' },
              headerTintColor: '#D4AF37',
              headerTitle: 'Campi Personalizzati',
            }} 
          />
          <Stack.Screen 
            name="settings/folders" 
            options={{ 
              headerShown: true,
              headerStyle: { backgroundColor: '#0A0A0A' },
              headerTintColor: '#D4AF37',
              headerTitle: 'Gestisci Cartelle',
            }} 
          />
        </Stack>
      </InventoryProvider>
    </SafeAreaProvider>
  );
}
