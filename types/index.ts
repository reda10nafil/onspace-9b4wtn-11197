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
  customData: ProductCustomData[];
  createdAt: string;
  updatedAt: string;
  lastScannedAt?: string;
  soldAt?: string;
  deletedAt?: string;
  /** ID of the library/folder this product belongs to (slug format for Google Sheets) */
  libraryId?: string;
}

export interface ProductCustomData {
  value: any;
  fieldSnapshot: CustomField;
}

export type FieldUIType = 'grid' | 'stepper' | 'segmented' | 'text' | 'gps-link' | 'date' | 'images' | 'picker' | 'modal_list' | 'document';

export interface TimelineEvent {
  id: string;
  productId: string;
  type: 'created' | 'moved' | 'modified' | 'sold' | 'scanned' | 'photo_added' | 'deleted' | 'restored';
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
  name: string;
  type: 'number' | 'currency' | 'date' | 'text_short' | 'text_long' | 'images' | 'single_choice' | 'multi_choice' | 'document';
  uiType: FieldUIType;
  dataset?: any;
  unit?: string;
  icon?: string;
  options?: any[];
  required: boolean;
  order: number;
  isSystem?: boolean;
  deletedAt?: string;

  // Advanced Inteligence Features
  isBarcode?: boolean; // If true, show barcode scanner button
  linkTo?: 'locations' | 'libraries' | 'furType'; // Dynamically link options to app libraries
}

export interface Alert {
  id: string;
  productId: string;
  type: 'dormant' | 'promotion_suggestion';
  message: string;
  createdAt: string;
  dismissed: boolean;
}
