import { MappingResult } from '@/lib/autoMappingRoarLayer';
import { SalesOrder } from '@/lib/unleashedClient';

export function buildSalesOrderPayload(payload: SalesOrder, mappings: MappingResult[]) {
  return {
    tax_rate: mappings.find((mapping) => mapping.objectType === 'tax')?.id,
    warehouse: mappings.find((mapping) => mapping.objectType === 'warehouse')?.id,
    delivery_method: mappings.find((mapping) => mapping.objectType === 'delivery')?.id,
    customer_id: mappings.find((mapping) => mapping.objectType === 'customer')?.id,
    CustomerRef: payload.CustomerRef,
    discount: payload.DiscountRate,
    delivery_instruction: payload.DeliveryInstruction,
    delivery_contact: mappings.find((mapping) => mapping.objectType === 'deliveryContact')?.id,
    address_line_1: payload.Warehouse.AddressLine1,
    address_line_2: payload.Warehouse.AddressLine2,
    suburb: payload.Warehouse.Suburb,
    city: payload.Warehouse.City,
    state: payload.Warehouse.Region,
    pin_code: payload.Warehouse.PostCode,
    country: payload.Warehouse.Country,
    order_date: parseUnleashedDate(payload.OrderDate),
    required_date: parseUnleashedDate(payload.RequiredDate),
    comment: payload.Comments,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseUnleashedDate(msDateString: any) {
  // msDateString is like "/Date(1759536000000)/"
  const match = msDateString.match(/\/Date\((\d+)\)\//);
  if (match) {
    return new Date(parseInt(match[1], 10));
  }
  return null;
}
