/* eslint-disable @typescript-eslint/no-explicit-any */

import crypto from 'crypto';
import { UNLEASHED_API_ID, UNLEASHED_API_KEY, UNLEASHED_BASE_URL } from './env';
import { log } from './logger';
import { ICustomer, ICustomerContact, ICustomerDeliveryAddress } from '@/types/unleash';
const DEFAULT_BASE_URL = 'https://api.unleashedsoftware.com';

export type UnleashedResource = 'Products' | 'SalesOrders' | 'PurchaseOrders' | 'StockOnHand';

function buildHeaders(query: string = '') {
  const hmacPayload = `${query}`;
  const signature = crypto
    .createHmac('sha256', UNLEASHED_API_KEY)
    .update(hmacPayload, 'utf8')
    .digest('base64');
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'api-auth-id': UNLEASHED_API_ID,
    'api-auth-signature': signature,
  };
}

async function fetchWithRetry(path: string, query: string = ''): Promise<Response> {
  const baseUrl = UNLEASHED_BASE_URL || DEFAULT_BASE_URL;
  const url = `${baseUrl}${path}`;
  let attempt = 0;
  let lastError: unknown;
  while (attempt < 8) {
    try {
      const response = await fetch(url, {
        headers: buildHeaders(query),
      });
      if (response.status === 429 || response.status >= 500) {
        throw new Error(`Unleashed transient error: ${response.status}`);
      }
      return response;
    } catch (error) {
      lastError = error;
      attempt += 1;
      const backoff = Math.min(2000 * attempt, 5000) + Math.random() * 500;
      await new Promise((resolve) => setTimeout(resolve, backoff));
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Unleashed request failed');
}

export interface SalesOrder {
  Tax?: any;
  Currency?: any;
  Warehouse?: any;
  Delivery?: any;
  DeliveryContact?: any;
  Guid: string;
  OrderNumber?: string;
  Customer?: any;
  OrderStatus?: string;
  [key: string]: unknown;
}
export interface SalesOrderResponse {
  SalesOrder?: SalesOrder;
}

export interface CustomerContactsResponse {
  Items?: ICustomerContact[];
}
export interface CustomerDeliveryAddressesResponse {
  Items?: ICustomerDeliveryAddress[];
}
export async function fetchSalesOrder(guid: string): Promise<SalesOrderResponse['SalesOrder']> {
  if (!UNLEASHED_API_ID || !UNLEASHED_API_KEY) {
    throw new Error('Unleashed credentials missing');
  }
  const path = `/SalesOrders/${guid}`;
  const response = await fetchWithRetry(path);
  if (!response.ok) {
    log({ module: 'unleashed', action: 'fetchSalesOrder', ok: false, code: response.status });
    throw new Error(`Failed to fetch Sales Order ${guid}`);
  }
  const data = await response.json();
  return data;
}

export async function fetchUnleashedResource(resource: UnleashedResource): Promise<any> {
  if (!UNLEASHED_API_ID || !UNLEASHED_API_KEY) {
    return {
      ok: false,
      status: 401,
      data: null,
      message: 'Unleashed credentials missing',
    };
  }
  const path = `/${resource.toLowerCase()}`;
  const response = await fetchWithRetry(path);
  if (!response.ok) {
    log({
      module: 'unleashed',
      action: 'fetchUnleashedResource',
      ok: false,
      code: response.status,
    });
    return {
      ok: false,
      status: response.status,
      data: null,
      message: `Failed to fetch Unleashed Resource ${resource}`,
    };
  }
  const data = (await response.json()) as SalesOrderResponse;
  return {
    ok: true,
    status: response.status,
    data: data,
    message: `Fetched Unleashed Resource ${resource}`,
  };
}

export async function fetchCustomer(guid: string): Promise<ICustomer> {
  const path = `/Customers/${guid}`;
  const response = await fetchWithRetry(path);
  if (!response.ok) {
    throw new Error(`Failed to fetch Customer ${guid}`);
  }
  const data = (await response.json()) as ICustomer;
  return data;
}
export async function CustomerContacts(customerGuid: string): Promise<CustomerContactsResponse> {
  const path = `/Customers/${customerGuid}/Contacts`;
  const response = await fetchWithRetry(path);
  if (!response.ok) {
    throw new Error(`Failed to fetch Customer Contacts`);
  }
  const data = await response.json();
  return data;
}
export async function fetchCustomerDeliveryAdresses(
  query: string = ''
): Promise<CustomerDeliveryAddressesResponse> {
  const path = `/CustomerDeliveryAddresses`;
  const response = await fetchWithRetry(path, query);
  if (!response.ok) {
    throw new Error(`Failed to fetch Customer Delivery Addresses`);
  }
  const data = await response.json();
  return data;
}
