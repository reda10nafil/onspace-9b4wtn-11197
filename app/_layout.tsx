// FurInventory Pro - Root Layout
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { InventoryProvider } from '../contexts/InventoryContext';
import { LocationsProvider } from '../contexts/LocationsContext';
import { CustomFieldsProvider } from '../contexts/CustomFieldsContext';
import { LayoutProvider } from '../contexts/LayoutContext';
import { AutomationsProvider } from '../contexts/AutomationsContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AutomationsProvider>
        <LocationsProvider>
          <CustomFieldsProvider>
            <LayoutProvider>
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
                  <Stack.Screen
                    name="settings/layout-builder"
                    options={{
                      headerShown: true,
                      headerStyle: { backgroundColor: '#0A0A0A' },
                      headerTintColor: '#D4AF37',
                      headerTitle: 'Configura Layout Aggiungi',
                    }}
                  />
                  <Stack.Screen
                    name="settings/automation-builder"
                    options={{
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="automations/automation-flow"
                    options={{
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="automations/custom-runner"
                    options={{
                      headerShown: false,
                    }}
                  />
                </Stack>
              </InventoryProvider>
            </LayoutProvider>
          </CustomFieldsProvider>
        </LocationsProvider>
      </AutomationsProvider>
    </SafeAreaProvider>
  );
}

