// FurInventory Pro - Inventory Context
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product, TimelineEvent, Alert } from '../types';
import { mockProducts, mockTimeline, isDormant, needsPromotion } from '../services/mockData';

interface InventoryContextType {
  products: Product[];
  timeline: TimelineEvent[];
  alerts: Alert[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  moveProduct: (id: string, newLocation: string) => void;
  sellProduct: (id: string, finalPrice?: number) => void;
  scanProduct: (id: string) => void;
  dismissAlert: (alertId: string) => void;
  getProductById: (id: string) => Product | undefined;
  getTimelineForProduct: (productId: string) => TimelineEvent[];
  filterProducts: (filter: 'all' | 'available' | 'sold' | 'alert') => Product[];
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

  // Generate alerts for dormant products and promotion suggestions
  useEffect(() => {
    generateAlerts();
  }, [products]);

  const loadData = async () => {
    try {
      const productsData = await AsyncStorage.getItem('products');
      const timelineData = await AsyncStorage.getItem('timeline');
      const alertsData = await AsyncStorage.getItem('alerts');

      setProducts(productsData ? JSON.parse(productsData) : mockProducts);
      setTimeline(timelineData ? JSON.parse(timelineData) : mockTimeline);
      setAlerts(alertsData ? JSON.parse(alertsData) : []);
    } catch (error) {
      console.error('Error loading data:', error);
      setProducts(mockProducts);
      setTimeline(mockTimeline);
    }
  };

  const generateAlerts = () => {
    const newAlerts: Alert[] = [];

    products.forEach((product) => {
      if (product.status === 'available') {
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
      id: Date.now().toString(),
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
      id: Date.now().toString(),
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

  const getTimelineForProduct = (productId: string) => {
    return timeline.filter((t) => t.productId === productId);
  };

  const filterProducts = (filter: 'all' | 'available' | 'sold' | 'alert') => {
    switch (filter) {
      case 'all':
        return products;
      case 'available':
        return products.filter((p) => p.status === 'available');
      case 'sold':
        return products.filter((p) => p.status === 'sold');
      case 'alert':
        return products.filter((p) => {
          return alerts.some((a) => a.productId === p.id && !a.dismissed);
        });
      default:
        return products;
    }
  };

  return (
    <InventoryContext.Provider
      value={{
        products,
        timeline,
        alerts,
        addProduct,
        updateProduct,
        deleteProduct,
        moveProduct,
        sellProduct,
        scanProduct,
        dismissAlert,
        getProductById,
        getTimelineForProduct,
        filterProducts,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};
