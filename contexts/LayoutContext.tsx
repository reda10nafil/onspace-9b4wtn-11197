// FurInventory Pro - Layout Context
// Manages the configurable layout for Add Product screen
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export type FieldSize = 'small' | 'medium' | 'full'; // 33%, 50%, 100%

export interface LayoutField {
    id: string;           // e.g. 'sku', 'furType', 'field_xxx' (custom), 'section_xxx'
    type: 'base' | 'custom' | 'section';
    size: FieldSize;
    visible: boolean;
    label?: string; // For section headers or overriding base labels
    icon?: string; // Custom icon override
}

export interface LayoutConfig {
    fields: LayoutField[];
    version: number;
}

// Layout fields rely on CustomFieldsContext for their base definitions (name, icon).

// Default layout configuration with predefined sections
const DEFAULT_LAYOUT: LayoutConfig = {
    fields: [
        // Foto prima di tutto
        { id: 'images', type: 'base', size: 'full', visible: true },

        // Sezione Dati Prodotto
        { id: 'section_prodotto', type: 'section', size: 'full', visible: true, label: 'DATI PRODOTTO' },
        { id: 'sku', type: 'base', size: 'medium', visible: true },
        { id: 'furType', type: 'base', size: 'full', visible: true },
        { id: 'location', type: 'base', size: 'medium', visible: true },
        { id: 'folder', type: 'base', size: 'medium', visible: true },

        // Sezione Dati Economici
        { id: 'section_economici', type: 'section', size: 'full', visible: true, label: 'DATI ECONOMICI' },
        { id: 'purchasePrice', type: 'base', size: 'medium', visible: true },
        { id: 'sellPrice', type: 'base', size: 'medium', visible: true },

        // Sezione Misure
        { id: 'section_misure', type: 'section', size: 'full', visible: true, label: 'MISURE' },
        { id: 'length', type: 'base', size: 'small', visible: true },
        { id: 'width', type: 'base', size: 'small', visible: true },
        { id: 'weight', type: 'base', size: 'small', visible: true },

        // Sezione Note
        { id: 'section_note', type: 'section', size: 'full', visible: true, label: 'NOTE' },
        { id: 'technicalNotes', type: 'base', size: 'full', visible: true },
    ],
    version: 3, // Incrementata versione per forzare update
};

const STORAGE_KEY = 'furinventory_layout_config';

// Context Interface
interface LayoutContextType {
    layout: LayoutConfig;
    loading: boolean;

    // CRUD operations
    updateFieldOrder: (fields: LayoutField[]) => void;
    updateFieldSize: (fieldId: string, size: FieldSize) => void;
    toggleFieldVisibility: (fieldId: string) => void;
    addFieldToLayout: (field: LayoutField) => void;
    removeFieldFromLayout: (fieldId: string) => void;
    applyTemplate: (templateFields: LayoutField[]) => void;

    // Section headers
    addSectionHeader: (label: string) => void;
    removeSectionHeader: (sectionId: string) => void;
    updateSectionLabel: (sectionId: string, label: string) => void;
    updateFieldIcon: (fieldId: string, icon: string) => void;

    resetToDefault: () => void;
    saveLayout: () => Promise<void>;

    // Helpers
    getVisibleFields: () => LayoutField[];
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: ReactNode }) {
    const [layout, setLayout] = useState<LayoutConfig>(DEFAULT_LAYOUT);
    const [loading, setLoading] = useState(true);

    // Load saved layout on mount
    useEffect(() => {
        loadLayout();
    }, []);

    const loadLayout = async () => {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Migrate to new layout if version is outdated
                if (!parsed.version || parsed.version < DEFAULT_LAYOUT.version) {
                    console.log('Migrating to new layout version...');
                    setLayout(DEFAULT_LAYOUT);
                    // Auto-save the new default
                    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_LAYOUT));
                } else {
                    setLayout(parsed);
                }
            }
        } catch (error) {
            console.error('Error loading layout:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveLayout = async () => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
        } catch (error) {
            console.error('Error saving layout:', error);
            throw error;
        }
    };

    const updateFieldOrder = (fields: LayoutField[]) => {
        setLayout(prev => ({ ...prev, fields }));
    };

    const updateFieldSize = (fieldId: string, size: FieldSize) => {
        setLayout(prev => ({
            ...prev,
            fields: prev.fields.map(f =>
                f.id === fieldId ? { ...f, size } : f
            ),
        }));
    };

    const toggleFieldVisibility = (fieldId: string) => {
        setLayout(prev => ({
            ...prev,
            fields: prev.fields.map(f =>
                f.id === fieldId ? { ...f, visible: !f.visible } : f
            ),
        }));
    };

    const addFieldToLayout = (field: LayoutField) => {
        // Check if already exists
        if (layout.fields.some(f => f.id === field.id)) return;

        setLayout(prev => ({
            ...prev,
            fields: [
                ...prev.fields,
                field,
            ],
        }));
    };

    const removeFieldFromLayout = (fieldId: string) => {
        setLayout(prev => ({
            ...prev,
            fields: prev.fields.filter(f => f.id !== fieldId),
        }));
    };

    const applyTemplate = (templateFields: LayoutField[]) => {
        setLayout(prev => ({
            ...prev,
            fields: templateFields
        }));
    };

    const addSectionHeader = (label: string) => {
        const newSection: LayoutField = {
            id: `section_${Date.now()}`,
            type: 'section',
            size: 'full',
            visible: true,
            label: label,
            icon: 'menu' // Default icon for sections in builder? Or unwanted?
        };
        setLayout(prev => ({
            ...prev,
            fields: [newSection, ...prev.fields] // Add to top by default? Or bottom?
        }));
    };

    const removeSectionHeader = (sectionId: string) => {
        setLayout(prev => ({
            ...prev,
            fields: prev.fields.filter(f => f.id !== sectionId),
        }));
    };

    const updateSectionLabel = (sectionId: string, label: string) => {
        setLayout(prev => ({
            ...prev,
            fields: prev.fields.map(f =>
                f.id === sectionId ? { ...f, label } : f
            )
        }));
    };

    const updateFieldIcon = (fieldId: string, icon: string) => {
        setLayout(prev => ({
            ...prev,
            fields: prev.fields.map(f =>
                f.id === fieldId ? { ...f, icon } : f
            )
        }));
    };

    const resetToDefault = () => {
        setLayout(DEFAULT_LAYOUT);
    };

    const getVisibleFields = (): LayoutField[] => {
        return layout.fields.filter(f => f.visible);
    };

    return (
        <LayoutContext.Provider
            value={{
                layout,
                loading,
                updateFieldOrder,
                updateFieldSize,
                toggleFieldVisibility,
                addFieldToLayout,
                removeFieldFromLayout,
                applyTemplate,
                addSectionHeader,
                removeSectionHeader,
                updateSectionLabel,
                updateFieldIcon,
                resetToDefault,
                saveLayout,
                getVisibleFields,
            }}
        >
            {children}
        </LayoutContext.Provider>
    );
}

export function useLayout() {
    const context = useContext(LayoutContext);
    if (context === undefined) {
        throw new Error('useLayout must be used within a LayoutProvider');
    }
    return context;
}
