// FurInventory Pro - Custom Automations Context
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Types ──────────────────────────────────────────────────

export type StepType =
    | 'scan_product'
    | 'scan_location'
    | 'move_to'
    | 'mark_sold'
    | 'add_tag'
    | 'set_field';

export interface AutomationStep {
    id: string;
    order: number;
    type: StepType;
    config: {
        locationId?: string;
        locationName?: string;
        tag?: string;
        fieldName?: string;
        fieldValue?: string;
        pricePrompt?: boolean;
        useLastScannedLocation?: boolean;
    };
    label: string;
}

export interface CustomAutomation {
    id: string;
    name: string;
    icon: string;
    color: string;
    description: string;
    qrValue: string;
    steps: AutomationStep[];
    createdAt: string;
    lastUsedAt?: string;
    usageCount: number;
}

// Label map for step types (for display)
export const STEP_TYPE_META: Record<StepType, { label: string; icon: string; color: string }> = {
    scan_product: { label: 'Scansiona Prodotto', icon: 'qr-code-scanner', color: '#3B82F6' },
    scan_location: { label: 'Scansiona Posizione', icon: 'location-on', color: '#10B981' },
    move_to: { label: 'Sposta Prodotto', icon: 'move-to-inbox', color: '#8B5CF6' },
    mark_sold: { label: 'Segna Venduto', icon: 'shopping-cart-checkout', color: '#EF4444' },
    add_tag: { label: 'Aggiungi Tag', icon: 'label', color: '#F59E0B' },
    set_field: { label: 'Imposta Campo', icon: 'edit', color: '#6366F1' },
};

// ── Context Interface ──────────────────────────────────────

interface AutomationsContextType {
    automations: CustomAutomation[];
    addAutomation: (auto: Omit<CustomAutomation, 'id' | 'qrValue' | 'createdAt' | 'usageCount'>) => CustomAutomation;
    updateAutomation: (id: string, updates: Partial<CustomAutomation>) => void;
    deleteAutomation: (id: string) => void;
    getAutomationByQR: (qrValue: string) => CustomAutomation | undefined;
    getAutomationById: (id: string) => CustomAutomation | undefined;
    recordUsage: (id: string) => void;
}

const AutomationsContext = createContext<AutomationsContextType | undefined>(undefined);

export function useAutomations() {
    const ctx = useContext(AutomationsContext);
    if (!ctx) throw new Error('useAutomations must be used within AutomationsProvider');
    return ctx;
}

// ── Storage Key ────────────────────────────────────────────

const STORAGE_KEY = '@furinventory_custom_automations';

// ── Provider ───────────────────────────────────────────────

export function AutomationsProvider({ children }: { children: ReactNode }) {
    const [automations, setAutomations] = useState<CustomAutomation[]>([]);

    // Load from storage on mount
    useEffect(() => {
        (async () => {
            try {
                const raw = await AsyncStorage.getItem(STORAGE_KEY);
                if (raw) setAutomations(JSON.parse(raw));
            } catch (e) {
                console.warn('Failed to load automations:', e);
            }
        })();
    }, []);

    // Persist whenever automations change
    useEffect(() => {
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(automations)).catch(console.warn);
    }, [automations]);

    // ── CRUD ─────────────────

    const addAutomation = (data: Omit<CustomAutomation, 'id' | 'qrValue' | 'createdAt' | 'usageCount'>) => {
        const id = `auto_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const newAuto: CustomAutomation = {
            ...data,
            id,
            qrValue: `AUTO:${id}`,
            createdAt: new Date().toISOString(),
            usageCount: 0,
        };
        setAutomations(prev => [...prev, newAuto]);
        return newAuto;
    };

    const updateAutomation = (id: string, updates: Partial<CustomAutomation>) => {
        setAutomations(prev => prev.map(a => (a.id === id ? { ...a, ...updates } : a)));
    };

    const deleteAutomation = (id: string) => {
        setAutomations(prev => prev.filter(a => a.id !== id));
    };

    const getAutomationByQR = (qrValue: string) => {
        return automations.find(a => a.qrValue === qrValue);
    };

    const getAutomationById = (id: string) => {
        return automations.find(a => a.id === id);
    };

    const recordUsage = (id: string) => {
        setAutomations(prev =>
            prev.map(a =>
                a.id === id
                    ? { ...a, usageCount: a.usageCount + 1, lastUsedAt: new Date().toISOString() }
                    : a
            )
        );
    };

    return (
        <AutomationsContext.Provider
            value={{
                automations,
                addAutomation,
                updateAutomation,
                deleteAutomation,
                getAutomationByQR,
                getAutomationById,
                recordUsage,
            }}
        >
            {children}
        </AutomationsContext.Provider>
    );
}
