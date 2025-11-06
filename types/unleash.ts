export interface ICustomer {
    Guid: string;
    Addresses: ICustomerAddress[];
    CustomerCode: string;
    CustomerName: string;
    Currency: ICustomerCurrency;
    Taxable: boolean;
    DiscountRate: number;
    PrintPackingSlipInsteadOfInvoice: boolean;
    PrintInvoice: boolean;
    StopCredit: boolean;
    Obsolete: boolean;
    CustomerType: string;
    CustomerTypeGuid: string;
    PaymentTerm: string;
    SalesPerson: ISalesPerson;
  }

  export interface ISalesPerson {
    FullName: string;
    Email: string;
    Obsolete: boolean;
    Guid: string;
    LastModifiedOn: string;
  }
  
  export interface ICustomerAddress {
    AddressType: string; // e.g., "Shipping" or "Billing"
    AddressName: string;
    StreetAddress: string;
    StreetAddress2?: string;
    Suburb?: string;
    City?: string;
    Region?: string;
    Country?: string;
    PostalCode?: string;
    IsDefault: boolean;
    DeliveryInstruction?: string;
  }
  
  export interface ICustomerCurrency {
    CurrencyCode: string; // e.g., "NZD"
    Description: string; // e.g., "New Zealand, Dollars"
    Guid: string;
  }
  
  export interface ICustomerContact {
    ForInvoicing: boolean;
    ForShipping: boolean;
    ForOrdering: boolean;
    IsDefault: boolean;
    DDINumber?: string | null;
    EmailAddress?: string | null;
    FaxNumber?: string | null;
    FirstName: string;
    LastName: string;
    MobilePhone?: string | null;
    Notes?: string | null;
    OfficePhone?: string | null;
    PhoneNumber?: string | null;
    TollFreeNumber?: string | null;
    Website?: string | null;
    Guid: string;
    DeliveryAddress?: string | null;
  }
  


export interface ICustomerDeliveryAddress {
    CustomerCode:string,
    CustomerId:string,
    Addresses:ICustomerAddress[],
}

export enum Source {
  UNLEASH = "unleashed",
  ROAR = "roar",
}