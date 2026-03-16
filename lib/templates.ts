import { CustomField, FieldUIType } from '../types';
import { LayoutField, FieldSize } from '../contexts/LayoutContext';

export interface IndustryTemplate {
    id: string;
    name: string;
    description: string;
    icon: string;
    customFields: Omit<CustomField, 'id' | 'order'>[];
    layoutFields: Omit<LayoutField, 'id'> & { _tempId: string }[];
}

export const PREDEFINED_TEMPLATES: IndustryTemplate[] = [
    {
        id: 'store-abbigliamento',
        name: 'Abbigliamento',
        description: 'Taglie, colori, brand e materiali per capi d\'abbigliamento.',
        icon: 'checkroom',
        customFields: [
            {
                name: 'Brand',
                type: 'text_short',
                uiType: 'text',
                required: true,
                icon: 'sell'
            },
            {
                name: 'Taglia',
                type: 'single_choice',
                uiType: 'grid',
                dataset: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'TU'],
                required: true,
                icon: 'straighten',
                options: [
                    { id: 'xs', label: 'XS' },
                    { id: 's', label: 'S' },
                    { id: 'm', label: 'M' },
                    { id: 'l', label: 'L' },
                    { id: 'xl', label: 'XL' },
                    { id: 'xxl', label: 'XXL' },
                    { id: 'tu', label: 'TU' }
                ]
            },
            {
                name: 'Colore',
                type: 'text_short',
                uiType: 'text',
                required: false,
                icon: 'palette'
            },
            {
                name: 'Materiale Principale',
                type: 'text_short',
                uiType: 'text',
                required: false,
                icon: 'texture'
            },
            {
                name: 'Stagione',
                type: 'single_choice',
                uiType: 'segmented',
                dataset: ['PE', 'AI', 'Continuativo'],
                required: false,
                icon: 'event',
                options: [
                    { id: 'pe', label: 'PE' },
                    { id: 'ai', label: 'AI' },
                    { id: 'cont', label: 'Continuativo' }
                ]
            }
        ],
        layoutFields: [
            // Sections mapped conceptually
        ] as any // Implemented at runtime to map base fields and new custom fields
    },
    {
        id: 'store-elettronica',
        name: 'Elettronica & Tech',
        description: 'Numeri di serie, garanzia e condizioni per prodotti tech.',
        icon: 'devices',
        customFields: [
            {
                name: 'Brand/Produttore',
                type: 'text_short',
                uiType: 'text',
                required: true,
                icon: 'business'
            },
            {
                name: 'Modello',
                type: 'text_short',
                uiType: 'text',
                required: true,
                icon: 'device-hub'
            },
            {
                name: 'Numero di Serie (S/N)',
                type: 'text_short',
                uiType: 'text',
                required: true,
                icon: 'qr-code-scanner'
            },
            {
                name: 'Condizione',
                type: 'single_choice',
                uiType: 'grid',
                dataset: ['Nuovo', 'Ricondizionato', 'Usato'],
                required: true,
                icon: 'verified',
                options: [
                    { id: 'nuovo', label: 'Nuovo' },
                    { id: 'refurb', label: 'Ricondizionato' },
                    { id: 'usato', label: 'Usato' }
                ]
            },
            {
                name: 'Scadenza Garanzia',
                type: 'date',
                uiType: 'date',
                required: false,
                icon: 'event-available'
            }
        ],
        layoutFields: [] as any
    }
];
