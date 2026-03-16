// FurInventory Pro - Locations Hook with AsyncStorage persistence
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'furinventory_locations';

export interface Location {
    id: string;
    label: string;
    color: string;
}

// Default locations (used as fallback)
const DEFAULT_LOCATIONS: Location[] = [
    { id: 'magazzino', label: 'Magazzino', color: '#3B82F6' },
    { id: 'vetrina', label: 'Vetrina', color: '#D4AF37' },
    { id: 'stand_a', label: 'Stand A', color: '#10B981' },
    { id: 'stand_b', label: 'Stand B', color: '#10B981' },
    { id: 'stand_c', label: 'Stand C', color: '#10B981' },
    { id: 'sartoria', label: 'Sartoria', color: '#8B5CF6' },
];

export function useLocations() {
    const [locations, setLocations] = useState<Location[]>(DEFAULT_LOCATIONS);
    const [loading, setLoading] = useState(true);

    // Load locations from AsyncStorage on mount
    useEffect(() => {
        loadLocations();
    }, []);

    const loadLocations = async () => {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setLocations(parsed);
                }
            }
        } catch (error) {
            console.error('Error loading locations:', error);
        } finally {
            setLoading(false);
        }
    };

    // Save locations to AsyncStorage
    const saveLocations = async (newLocations: Location[]) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newLocations));
        } catch (error) {
            console.error('Error saving locations:', error);
        }
    };

    // Add a new location
    const addLocation = useCallback(async (location: Location) => {
        const newLocations = [...locations, location];
        setLocations(newLocations);
        await saveLocations(newLocations);
    }, [locations]);

    // Update an existing location
    const updateLocation = useCallback(async (id: string, updates: Partial<Location>) => {
        const newLocations = locations.map((loc) =>
            loc.id === id ? { ...loc, ...updates } : loc
        );
        setLocations(newLocations);
        await saveLocations(newLocations);
    }, [locations]);

    // Delete a location
    const deleteLocation = useCallback(async (id: string) => {
        const newLocations = locations.filter((loc) => loc.id !== id);
        setLocations(newLocations);
        await saveLocations(newLocations);
    }, [locations]);

    // Reset to defaults
    const resetToDefaults = useCallback(async () => {
        setLocations(DEFAULT_LOCATIONS);
        await saveLocations(DEFAULT_LOCATIONS);
    }, []);

    // Get location by ID
    const getLocation = useCallback((id: string) => {
        return locations.find((loc) => loc.id === id);
    }, [locations]);

    return {
        locations,
        loading,
        addLocation,
        updateLocation,
        deleteLocation,
        resetToDefaults,
        getLocation,
        reloadLocations: loadLocations,
    };
}
