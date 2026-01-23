// FurInventory Pro - Type Definitions

export interface Product {
  id: string;
  sku: string;
  furType: string;
  location: string;
  status: 'available' | 'sold' | 'archived';
  images: string[];
  purchasePrice?: number;
  sellPrice?: number;
  length?: number;
  width?: number;
  weight?: number;
  productionDate?: string;
  technicalNotes?: string;
  customFields: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  lastScannedAt?: string;
  soldAt?: string;
}

export interface TimelineEvent {
  id: string;
  productId: string;
  type: 'created' | 'moved' | 'modified' | 'sold' | 'scanned' | 'photo_added';
  timestamp: string;
  details: {
    from?: string;
    to?: string;
    field?: string;
    oldValue?: any;
    newValue?: any;
    finalPrice?: number;
    photoCount?: number;
    changes?: string[];
  };
}

export interface Library {
  id: string;
  name: string;
  icon: string;
  fields: CustomField[];
  createdAt: string;
}

export interface CustomField {
  id: string;
  type: 'number' | 'currency' | 'date' | 'text_short' | 'text_long' | 'images' | 'single_choice' | 'multi_choice';
  label: string;
  unit?: string;
  options?: string[];
  required: boolean;
  order: number;
}

export interface Alert {
  id: string;
  productId: string;
  type: 'dormant' | 'promotion_suggestion';
  message: string;
  createdAt: string;
  dismissed: boolean;
}
