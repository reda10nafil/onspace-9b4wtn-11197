// FurInventory Pro - Inventory Context
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product, TimelineEvent, Alert } from '../types';
import { mockProducts, mockTimeline, isDormant, needsPromotion } from '../services/mockData';

/** Library/Folder structure - ID uses slug format for Google Sheets compatibility */
export interface Library {
  id: string; // slug format, e.g., 'pellicce', 'accessori'
  name: string;
  icon: string;
  createdAt: string;
  barcode?: string;
  nfcTag?: string;
}

const DEFAULT_LIBRARIES: Library[] = [
  { id: 'pellicce', name: 'Pellicce', icon: 'inventory', createdAt: new Date().toISOString() },
];

interface InventoryContextType {
  products: Product[];
  timeline: TimelineEvent[];
  alerts: Alert[];
  libraries: Library[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  restoreProduct: (id: string) => void;
  permanentlyDeleteProduct: (id: string) => void;
  moveProduct: (id: string, newLocation: string) => void;
  sellProduct: (id: string, finalPrice?: number) => void;
  scanProduct: (id: string) => void;
  dismissAlert: (alertId: string) => void;
  getProductById: (id: string) => Product | undefined;
  getTimelineForProduct: (productId: string) => TimelineEvent[];
  filterProducts: (filter: 'all' | 'available' | 'sold' | 'alert' | 'trash') => Product[];
  getTrashProducts: () => Product[];
  addLibrary: (name: string, icon: string) => void;
  updateLibrary: (id: string, updates: Partial<Library>) => void;
  deleteLibrary: (id: string) => boolean;
  getProductBySku: (sku: string) => Product | undefined;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within InventoryProvider');
  }
  return context;
};

export const InventoryProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [libraries, setLibraries] = useState<Library[]>(DEFAULT_LIBRARIES);

  // Load data from AsyncStorage
  useEffect(() => {
    loadData();
  }, []);

  // Save data to AsyncStorage
  useEffect(() => {
    if (products.length > 0) {
      AsyncStorage.setItem('products', JSON.stringify(products));
    }
  }, [products]);

  useEffect(() => {
    if (timeline.length > 0) {
      AsyncStorage.setItem('timeline', JSON.stringify(timeline));
    }
  }, [timeline]);

  useEffect(() => {
    if (alerts.length > 0) {
      AsyncStorage.setItem('alerts', JSON.stringify(alerts));
    }
  }, [alerts]);

  useEffect(() => {
    AsyncStorage.setItem('libraries', JSON.stringify(libraries));
  }, [libraries]);

  // Generate alerts for dormant products and promotion suggestions
  useEffect(() => {
    generateAlerts();
  }, [products]);

  const loadData = async () => {
    try {
      const productsData = await AsyncStorage.getItem('products');
      const timelineData = await AsyncStorage.getItem('timeline');
      const alertsData = await AsyncStorage.getItem('alerts');
      const librariesData = await AsyncStorage.getItem('libraries');

      setProducts(productsData ? JSON.parse(productsData) : mockProducts);
      setTimeline(timelineData ? JSON.parse(timelineData) : mockTimeline);
      setAlerts(alertsData ? JSON.parse(alertsData) : []);
      setLibraries(librariesData ? JSON.parse(librariesData) : DEFAULT_LIBRARIES);
    } catch (error) {
      console.error('Error loading data:', error);
      setProducts(mockProducts);
      setTimeline(mockTimeline);
      setLibraries(DEFAULT_LIBRARIES);
    }
  };

  const generateAlerts = () => {
    const newAlerts: Alert[] = [];

    products.forEach((product) => {
      if (product.status === 'available' && !product.deletedAt) {
        // Check for dormant products
        if (isDormant(product)) {
          newAlerts.push({
            id: `alert-dormant-${product.id}`,
            productId: product.id,
            type: 'dormant',
            message: `${product.sku} non viene mosso da oltre 6 mesi`,
            createdAt: new Date().toISOString(),
            dismissed: false,
          });
        }

        // Check for promotion suggestions
        if (needsPromotion(product)) {
          newAlerts.push({
            id: `alert-promo-${product.id}`,
            productId: product.id,
            type: 'promotion_suggestion',
            message: `${product.sku} in magazzino da 3+ mesi. Considera di spostarlo in vetrina`,
            createdAt: new Date().toISOString(),
            dismissed: false,
          });
        }
      }
    });

    // Merge with existing non-dismissed alerts
    const existingAlertIds = new Set(alerts.filter((a) => a.dismissed).map((a) => a.id));
    const mergedAlerts = [
      ...newAlerts,
      ...alerts.filter((a) => existingAlertIds.has(a.id)),
    ];

    setAlerts(mergedAlerts);
  };

  const generateSKU = (): string => {
    const year = new Date().getFullYear();
    const existingSKUs = products
      .filter((p) => !p.deletedAt)
      .map((p) => p.sku)
      .filter((sku) => sku.startsWith(`FUR-${year}-`));

    let nextNumber = 1;
    if (existingSKUs.length > 0) {
      const numbers = existingSKUs.map((sku) => {
        const match = sku.match(/FUR-\d{4}-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      });
      nextNumber = Math.max(...numbers) + 1;
    }

    return `FUR-${year}-${String(nextNumber).padStart(3, '0')}`;
  };

  const addProduct = (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const sku = productData.sku || generateSKU();

    const newProduct: Product = {
      ...productData,
      sku,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setProducts((prev) => [newProduct, ...prev]);

    // Add timeline event
    addTimelineEvent({
      productId: newProduct.id,
      type: 'created',
      timestamp: new Date().toISOString(),
      details: {},
    });
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;

    const changes: string[] = [];

    // Track specific changes
    if (updates.location && updates.location !== product.location) {
      changes.push(`Posizione: ${product.location} → ${updates.location}`);
    }
    if (updates.sellPrice && updates.sellPrice !== product.sellPrice) {
      changes.push(`Prezzo vendita: €${product.sellPrice || 0} → €${updates.sellPrice}`);
    }
    if (updates.purchasePrice && updates.purchasePrice !== product.purchasePrice) {
      changes.push(`Prezzo acquisto: €${product.purchasePrice || 0} → €${updates.purchasePrice}`);
    }
    if (updates.technicalNotes && updates.technicalNotes !== product.technicalNotes) {
      changes.push('Note aggiornate');
    }
    if (updates.images && updates.images.length > product.images.length) {
      const newPhotos = updates.images.length - product.images.length;
      changes.push(`${newPhotos} foto aggiunte`);

      // Add photo timeline event
      addTimelineEvent({
        productId: id,
        type: 'photo_added',
        timestamp: new Date().toISOString(),
        details: { photoCount: newPhotos },
      });
    }

    setProducts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, ...updates, updatedAt: new Date().toISOString() }
          : p
      )
    );

    // Add timeline event with details
    if (changes.length > 0) {
      addTimelineEvent({
        productId: id,
        type: 'modified',
        timestamp: new Date().toISOString(),
        details: { changes },
      });
    }
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, deletedAt: new Date().toISOString() }
          : p
      )
    );

    addTimelineEvent({
      productId: id,
      type: 'deleted',
      timestamp: new Date().toISOString(),
      details: {},
    });
  };

  const restoreProduct = (id: string) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, deletedAt: undefined }
          : p
      )
    );

    addTimelineEvent({
      productId: id,
      type: 'restored',
      timestamp: new Date().toISOString(),
      details: {},
    });
  };

  const permanentlyDeleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const moveProduct = (id: string, newLocation: string) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;

    const oldLocation = product.location;

    setProducts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
            ...p,
            location: newLocation,
            updatedAt: new Date().toISOString(),
            lastScannedAt: new Date().toISOString(),
          }
          : p
      )
    );

    // Add timeline event
    addTimelineEvent({
      productId: id,
      type: 'moved',
      timestamp: new Date().toISOString(),
      details: { from: oldLocation, to: newLocation },
    });
  };

  const sellProduct = (id: string, finalPrice?: number) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
            ...p,
            status: 'sold',
            soldAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastScannedAt: new Date().toISOString(),
            ...(finalPrice && { sellPrice: finalPrice }),
          }
          : p
      )
    );

    // Add timeline event
    addTimelineEvent({
      productId: id,
      type: 'sold',
      timestamp: new Date().toISOString(),
      details: { finalPrice },
    });
  };

  const scanProduct = (id: string) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, lastScannedAt: new Date().toISOString() }
          : p
      )
    );

    // Add timeline event
    addTimelineEvent({
      productId: id,
      type: 'scanned',
      timestamp: new Date().toISOString(),
      details: {},
    });
  };

  const addTimelineEvent = (event: Omit<TimelineEvent, 'id'>) => {
    const newEvent: TimelineEvent = {
      ...event,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    setTimeline((prev) => [newEvent, ...prev]);
  };

  const dismissAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, dismissed: true } : a))
    );
  };

  const getProductById = (id: string) => {
    return products.find((p) => p.id === id);
  };

  const getProductBySku = (sku: string) => {
    return products.find((p) => p.sku === sku);
  };

  const getTimelineForProduct = (productId: string) => {
    return timeline.filter((t) => t.productId === productId);
  };

  const filterProducts = (filter: 'all' | 'available' | 'sold' | 'alert' | 'trash') => {
    if (filter === 'trash') {
      return products.filter((p) => p.deletedAt);
    }

    const activeProducts = products.filter((p) => !p.deletedAt);

    switch (filter) {
      case 'all':
        return activeProducts;
      case 'available':
        return activeProducts.filter((p) => p.status === 'available');
      case 'sold':
        return activeProducts.filter((p) => p.status === 'sold');
      case 'alert':
        return activeProducts.filter((p) => {
          return alerts.some((a) => a.productId === p.id && !a.dismissed);
        });
      default:
        return activeProducts;
    }
  };

  const getTrashProducts = () => {
    return products.filter((p) => p.deletedAt);
  };

  /** Generate a slug from name (lowercase, no spaces, no special chars) */
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with dash
      .replace(/^-+|-+$/g, ''); // Trim leading/trailing dashes
  };

  const addLibrary = (name: string, icon: string) => {
    const slug = generateSlug(name);
    // Ensure unique ID
    let uniqueSlug = slug;
    let counter = 1;
    while (libraries.some((l) => l.id === uniqueSlug)) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    const newLibrary: Library = {
      id: uniqueSlug,
      name,
      icon,
      createdAt: new Date().toISOString(),
    };
    setLibraries((prev) => [...prev, newLibrary]);
  };

  const updateLibrary = (id: string, updates: Partial<Library>) => {
    setLibraries((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updates } : l))
    );
  };

  const deleteLibrary = (id: string): boolean => {
    // Check if any products are assigned to this library
    const productsInLibrary = products.filter((p) => p.libraryId === id && !p.deletedAt);
    if (productsInLibrary.length > 0) {
      return false; // Cannot delete, has products
    }
    setLibraries((prev) => prev.filter((l) => l.id !== id));
    return true;
  };

  return (
    <InventoryContext.Provider
      value={{
        products,
        timeline,
        alerts,
        libraries,
        addProduct,
        updateProduct,
        deleteProduct,
        moveProduct,
        sellProduct,
        scanProduct,
        dismissAlert,
        getProductById,
        getProductBySku,
        getTimelineForProduct,
        filterProducts,
        restoreProduct,
        permanentlyDeleteProduct,
        getTrashProducts,
        addLibrary,
        updateLibrary,
        deleteLibrary,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};
