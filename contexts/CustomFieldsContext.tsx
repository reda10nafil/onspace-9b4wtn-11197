// FurInventory Pro - Custom Fields Context with AsyncStorage persistence
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CustomField, FieldUIType } from '../types';

const STORAGE_KEY = 'furinventory_custom_fields';

export type FieldType = 'number' | 'currency' | 'date' | 'text_short' | 'text_long' | 'images' | 'single_choice' | 'multi_choice' | 'document';

export interface CustomFieldOption {
    id: string;
    label: string;
}

export const SYSTEM_FIELDS: CustomField[] = [
    { id: 'images', name: 'Foto Prodotto', type: 'images', uiType: 'images', required: false, order: 0, isSystem: true, icon: 'add-photo-alternate' },
    { id: 'sku', name: 'SKU / Codice', type: 'text_short', uiType: 'text', required: true, order: 1, isSystem: true, icon: 'qr-code' },
    { id: 'furType', name: 'Tipo Pelle', type: 'text_short', uiType: 'text', required: true, order: 2, isSystem: true, icon: 'category' },
    { id: 'location', name: 'Posizione', type: 'text_short', uiType: 'text', required: true, order: 3, isSystem: true, icon: 'place' },
    { id: 'folder', name: 'Cartella', type: 'text_short', uiType: 'text', required: false, order: 4, isSystem: true, icon: 'folder' },
    { id: 'purchasePrice', name: 'Prezzo Acquisto', type: 'currency', uiType: 'text', required: false, order: 5, isSystem: true, icon: 'shopping-cart' },
    { id: 'sellPrice', name: 'Prezzo Vendita', type: 'currency', uiType: 'text', required: false, order: 6, isSystem: true, icon: 'sell' },
    { id: 'length', name: 'Lunghezza', type: 'number', uiType: 'text', required: false, order: 7, isSystem: true, icon: 'straighten', unit: 'cm' },
    { id: 'width', name: 'Larghezza', type: 'number', uiType: 'text', required: false, order: 8, isSystem: true, icon: 'straighten', unit: 'cm' },
    { id: 'weight', name: 'Peso', type: 'number', uiType: 'text', required: false, order: 9, isSystem: true, icon: 'fitness-center', unit: 'kg' },
    { id: 'technicalNotes', name: 'Note Tecniche', type: 'text_long', uiType: 'text', required: false, order: 10, isSystem: true, icon: 'notes' },
];

// Default custom fields
const DEFAULT_CUSTOM_FIELDS: CustomField[] = [...SYSTEM_FIELDS];

interface CustomFieldsContextType {
    customFields: CustomField[];
    allFieldsIncludingDeleted: CustomField[];
    loading: boolean;
    addField: (field: Omit<CustomField, 'id' | 'order'>) => Promise<void>;
    updateField: (id: string, updates: Partial<CustomField>) => Promise<void>;
    deleteField: (id: string) => Promise<void>;
    restoreField: (id: string) => Promise<void>;
    permanentlyDeleteField: (id: string) => Promise<void>;
    getDeletedFields: () => CustomField[];
    reorderFields: (orderedIds: string[]) => Promise<void>;
    getField: (id: string) => CustomField | undefined;
    resetToDefaults: () => Promise<void>;
    reloadFields: () => Promise<void>;
}

const CustomFieldsContext = createContext<CustomFieldsContextType | undefined>(undefined);

export function CustomFieldsProvider({ children }: { children: ReactNode }) {
    const [allFields, setAllFields] = useState<CustomField[]>(DEFAULT_CUSTOM_FIELDS);
    const [loading, setLoading] = useState(true);

    // Active (non-deleted) fields
    const customFields = useMemo(() =>
        allFields.filter(f => !f.deletedAt).sort((a, b) => a.order - b.order),
        [allFields]
    );

    // Load custom fields from AsyncStorage on mount
    useEffect(() => {
        loadFields();
    }, []);

    const loadFields = async () => {
        try {
            setLoading(true);
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    // Merge system fields that might be missing (e.g., if we add new system fields in updates)
                    const existingIds = parsed.map((p: any) => p.id);
                    const missingSystemFields = SYSTEM_FIELDS.filter(sf => !existingIds.includes(sf.id));

                    const merged = [...parsed, ...missingSystemFields];

                    // Sort by order
                    setAllFields(merged.sort((a: CustomField, b: CustomField) => a.order - b.order));
                } else {
                    setAllFields(DEFAULT_CUSTOM_FIELDS);
                    saveFields(DEFAULT_CUSTOM_FIELDS);
                }
            } else {
                setAllFields(DEFAULT_CUSTOM_FIELDS);
                saveFields(DEFAULT_CUSTOM_FIELDS);
            }
        } catch (error) {
            console.error('Error loading custom fields:', error);
        } finally {
            setLoading(false);
        }
    };

    // Save custom fields to AsyncStorage
    const saveFields = async (fields: CustomField[]) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fields));
        } catch (error) {
            console.error('Error saving custom fields:', error);
        }
    };

    // Generate unique ID
    const generateId = () => `field_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Add a new field
    const addField = useCallback(async (field: Omit<CustomField, 'id' | 'order'>) => {
        const activeFields = allFields.filter(f => !f.deletedAt);
        const newField: CustomField = {
            ...field,
            id: generateId(),
            order: activeFields.length,
            isSystem: false,
        };
        const newFields = [...allFields, newField];
        setAllFields(newFields);
        await saveFields(newFields);
    }, [allFields]);

    // Update an existing field
    const updateField = useCallback(async (id: string, updates: Partial<CustomField>) => {
        const newFields = allFields.map((f) =>
            f.id === id ? { ...f, ...updates } : f
        );
        setAllFields(newFields);
        await saveFields(newFields);
    }, [allFields]);

    // Soft-delete a field (move to trash)
    const deleteField = useCallback(async (id: string) => {
        const newFields = allFields.map((f) =>
            f.id === id ? { ...f, deletedAt: new Date().toISOString() } : f
        );
        setAllFields(newFields);
        await saveFields(newFields);
    }, [allFields]);

    // Restore a soft-deleted field
    const restoreField = useCallback(async (id: string) => {
        const newFields = allFields.map((f) =>
            f.id === id ? { ...f, deletedAt: undefined } : f
        );
        setAllFields(newFields);
        await saveFields(newFields);
    }, [allFields]);

    // Permanently delete a field
    const permanentlyDeleteField = useCallback(async (id: string) => {
        const newFields = allFields.filter((f) => f.id !== id);
        setAllFields(newFields);
        await saveFields(newFields);
    }, [allFields]);

    // Get deleted fields
    const getDeletedFields = useCallback(() => {
        return allFields.filter(f => f.deletedAt && !f.isSystem);
    }, [allFields]);

    // Reorder fields
    const reorderFields = useCallback(async (orderedIds: string[]) => {
        const reordered = orderedIds.map((id, index) => {
            const field = allFields.find((f) => f.id === id);
            return field ? { ...field, order: index } : null;
        }).filter(Boolean) as CustomField[];

        // Keep deleted fields as-is
        const deletedFields = allFields.filter(f => f.deletedAt && !orderedIds.includes(f.id));
        const combined = [...reordered, ...deletedFields];

        setAllFields(combined);
        await saveFields(combined);
    }, [allFields]);

    // Get field by ID
    const getField = useCallback((id: string) => {
        return allFields.find((f) => f.id === id);
    }, [allFields]);

    // Reset to defaults
    const resetToDefaults = useCallback(async () => {
        setAllFields(DEFAULT_CUSTOM_FIELDS);
        await saveFields(DEFAULT_CUSTOM_FIELDS);
    }, []);

    return (
        <CustomFieldsContext.Provider
            value={{
                customFields,
                allFieldsIncludingDeleted: allFields,
                loading,
                addField,
                updateField,
                deleteField,
                restoreField,
                permanentlyDeleteField,
                getDeletedFields,
                reorderFields,
                getField,
                resetToDefaults,
                reloadFields: loadFields,
            }}
        >
            {children}
        </CustomFieldsContext.Provider>
    );
}

export function useCustomFields() {
    const context = useContext(CustomFieldsContext);
    if (context === undefined) {
        throw new Error('useCustomFields must be used within a CustomFieldsProvider');
    }
    return context;
}

// Helper function to get field type info
export const FIELD_TYPE_INFO: Record<FieldType, { label: string; icon: string; description: string }> = {
    number: { label: 'Numero/Decimale', icon: 'pin', description: 'Con unità di misura personalizzabile' },
    currency: { label: 'Valuta', icon: 'euro', description: 'Per prezzi e costi' },
    date: { label: 'Data', icon: 'calendar-today', description: 'Con calendario picker' },
    text_short: { label: 'Testo Breve', icon: 'short-text', description: 'Max 100 caratteri' },
    text_long: { label: 'Testo Lungo', icon: 'notes', description: 'Note espandibili' },
    images: { label: 'Immagini Multiple', icon: 'collections', description: 'Fino a 10 foto' },
    single_choice: { label: 'Scelta Singola', icon: 'radio-button-checked', description: 'Dropdown menu' },
    multi_choice: { label: 'Scelta Multipla', icon: 'check-box', description: 'Checkbox multipli' },
    document: { label: 'Documento / File', icon: 'description', description: 'Allega PDF, Excel o altri file' },
};

// Re-export CustomField type from types for backward compatibility
export type { CustomField } from '../types';
