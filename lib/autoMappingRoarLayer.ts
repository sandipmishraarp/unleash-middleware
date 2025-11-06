import { log } from 'console';
import { ROAR_BASE_URL } from './env';
import { auth, getCredentials } from './roarClient';
import { CustomerContacts, fetchCustomer, SalesOrder } from './unleashedClient';

export interface MappingResult {
  id: string;
  objectType: string;
}

class AutoMappingRoarLayer {
  private creds!: { username: string; secret: string };
  private endpoints = {
    tax: 'tax',
    currency: 'save-currency',
    warehouse: 'save-warehouse',
    deliveryContact: 'delivery-contact',
    deliveryName: 'delivery-name',
    customer: 'save-customer',
    salesPerson: 'sales-person',
    salesOrderGroup: 'sales-group',
  };

  constructor() {}

  async init() {
    const creds = await getCredentials();
    if (!creds.username || !creds.secret) {
      throw new Error('Missing ROar credentials');
    }
    this.creds = creds as { username: string; secret: string };
    return this;
  }

  async createAutoMapping(payload: SalesOrder): Promise<MappingResult[]> {
    try {
      const mappingPromises: Promise<MappingResult>[] = [];
      if (payload.Customer) {
        const customer = await fetchCustomer(payload.Customer.Guid);
        const customerContacts = await CustomerContacts(payload.Customer.Guid);
        let salesPerson = null;
        let warehouse = null;
        let tax = null;
        if (payload.SalesPerson) {
          const result = await this.mapObject('salesPerson', payload.SalesPerson);
          salesPerson = result.id;
        }
        if (payload.Warehouse) {
          const result = await this.mapObject('warehouse', payload.Warehouse);
          warehouse = result.id;
        }
        if (payload.Tax) {
          const result = await this.mapObject('tax', payload.Tax);
          tax = result.id;
        }

        mappingPromises.push(
          this.mapObject('customer', {
            ...customer,
            SalesPerson: salesPerson,
            DefaultWarehouse: warehouse,
            TaxRate: tax,
            TaxCode: '',
            contacts: customerContacts.Items,
          })
        );
      }
      if (payload.Tax) {
        mappingPromises.push(
          this.mapObject('tax', {
            ...payload.Tax,
            description: payload.Tax.TaxCode,
          })
        );
      }

      if (payload.Currency) {
        mappingPromises.push(this.mapObject('currency', payload.Currency));
      }

      if (payload.Warehouse) {
        mappingPromises.push(this.mapObject('warehouse', payload.Warehouse));
      }

      if (payload.DeliveryContact && payload.Customer) {
        mappingPromises.push(
          this.mapObject('deliveryContact', {
            customer_code: payload.Customer.CustomerCode,
            first_name: payload.DeliveryContact.FirstName,
            last_name: payload.DeliveryContact.LastName,
            email: payload.DeliveryContact.EmailAddress,
            default: true,
          })
        );
      }
      if (payload.SalesPerson) {
        mappingPromises.push(this.mapObject('salesPerson', payload.SalesPerson));
      }
      if (payload.SalesOrderGroup) {
        mappingPromises.push(this.mapObject('salesOrderGroup', payload.SalesOrderGroup));
      }

      const mappingResults = await Promise.all(mappingPromises);

      log({
        module: 'autoMappingRoarLayer',
        action: 'createAutoMapping',
        ok: true,
        results: mappingResults.length,
        concurrent: true,
      });

      return mappingResults;
    } catch (error) {
      log({
        module: 'autoMappingRoarLayer',
        action: 'createAutoMapping',
        ok: false,
        err: error,
      });
      throw error;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async mapObject(objectType: string, data: any): Promise<MappingResult> {
    try {
      const endpoint = this.endpoints[objectType as keyof typeof this.endpoints];
      if (!endpoint) {
        throw new Error(`Unknown object type: ${objectType}`);
      }

      const response = await this.callApi(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          clientid: this.creds.username,
          clientsecret: this.creds.secret,
        }),
      });
      if (!response.success) {
        throw new Error(response.message);
      }
      return {
        id: response.data.id,
        objectType: objectType,
      };
    } catch (error) {
      log({
        module: 'autoMappingRoarLayer',
        action: 'mapObject',
        ok: false,
        objectType,
        err: error,
      });
      throw error;
    }
  }

  private async callApi(endpoint: string, init?: RequestInit) {
    try {
      const login = await auth();
      const response = await fetch(`${ROAR_BASE_URL}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          clientid: this.creds.username,
          clientsecret: this.creds.secret,
          ...init?.headers,
          Authorization: `Bearer ${login.token}`,
        },
        ...init,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch ${endpoint} with status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      log({
        module: 'autoMappingRoarLayer',
        action: 'callApi',
        ok: false,
        endpoint,
        err: error,
      });
      throw error;
    }
  }
}

export const autoMappingRoarLayer = new AutoMappingRoarLayer();
