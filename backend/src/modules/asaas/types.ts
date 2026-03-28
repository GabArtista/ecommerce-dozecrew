export type AsaasPaymentInput = {
  cartId: string;
  orderId?: string;
  amount: number; // in cents
  currency: string;
  billingType: "PIX" | "BOLETO" | "CREDIT_CARD";
  customer: {
    name: string;
    email: string;
    cpfCnpj: string;
    phone?: string;
    address?: string;
    addressNumber?: string;
    complement?: string;
    province?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };
  creditCard?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  description?: string;
  externalReference?: string;
};

export type AsaasPaymentData = {
  id: string;
  status: AsaasPaymentStatus;
  billingType: string;
  value: number;
  netValue?: number;
  pixQrCode?: string;
  pixCopyPaste?: string;
  pixExpirationDate?: string;
  boletoUrl?: string;
  boletoBarCode?: string;
  dueDate?: string;
  confirmedDate?: string;
  asaasCustomerId: string;
};

export type AsaasPaymentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "RECEIVED"
  | "OVERDUE"
  | "CANCELLED"
  | "DUNNING_REQUESTED"
  | "DUNNING_RECEIVED"
  | "REFUNDED"
  | "PARTIALLY_RECEIVED"
  | "CHARGEBACK";

export type AsaasWebhookPayload = {
  event: string;
  createdAt: string;
  data: {
    id: string;
    status: AsaasPaymentStatus;
    value: number;
    netValue?: number;
    description?: string;
    billingType: string;
    pixQrCode?: string;
    pixCopyPaste?: string;
    customer?: { id: string; name: string; email: string };
    dueDate?: string;
    confirmedDate?: string;
  };
};
