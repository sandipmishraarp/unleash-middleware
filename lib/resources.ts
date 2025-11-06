import type { UnleashedResource } from './unleashedClient';

export const UNLEASHED_RESOURCES: UnleashedResource[] = [
  'Products',
  'SalesOrders',
  'PurchaseOrders',
  'StockOnHand',
];

export const RESOURCE_LABELS: Record<UnleashedResource, string> = {
  Products: 'Products',
  SalesOrders: 'Sales Orders',
  PurchaseOrders: 'Purchase Orders',
  StockOnHand: 'Stock On Hand',
};

export const RESOURCE_KEYS: Record<UnleashedResource, string> = {
  Products: 'products',
  SalesOrders: 'sales-orders',
  PurchaseOrders: 'purchase-orders',
  StockOnHand: 'stock-on-hand',
};
