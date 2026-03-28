import { AbstractPaymentProvider, BigNumber } from "@medusajs/framework/utils";
import {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  Logger,
  ProviderWebhookPayload,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  WebhookActionResult,
} from "@medusajs/framework/types";
import { AsaasClient } from "asaas";

type AsaasOptions = {
  apiKey: string;
  sandbox?: boolean;
};

type InjectedDependencies = {
  logger: Logger;
};

class AsaasPaymentService extends AbstractPaymentProvider<AsaasOptions> {
  static identifier = "asaas";

  private client: AsaasClient;
  private logger_: Logger;

  static validateOptions(options: Record<string, unknown>) {
    if (!options.apiKey) {
      // Warn in dev — production should always have the key set
      console.warn("[Asaas] Warning: ASAAS_API_KEY is not set. Payment provider will not process real payments.");
    }
  }

  constructor(container: InjectedDependencies, options: AsaasOptions) {
    super(container as any, options);
    this.logger_ = container.logger;
    this.client = new AsaasClient(options.apiKey, {
      sandbox: options.sandbox ?? true,
    });
  }

  // ---- Helpers ----

  private toCentavos(amount: number): number {
    // Medusa stores amounts in the smallest currency unit (centavos for BRL)
    return amount / 100;
  }

  private toBillingType(context: Record<string, unknown>): "PIX" | "BOLETO" | "CREDIT_CARD" {
    const billing = context?.billing_type as string;
    if (billing === "BOLETO") return "BOLETO";
    if (billing === "CREDIT_CARD") return "CREDIT_CARD";
    return "PIX"; // default
  }

  private dueDateTomorrow(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }

  private mapStatus(asaasStatus: string): "pending" | "authorized" | "captured" | "canceled" | "requires_more" | "error" {
    switch (asaasStatus) {
      case "CONFIRMED":
      case "RECEIVED":
        return "captured";
      case "PENDING":
        return "pending";
      case "CANCELLED":
        return "canceled";
      case "REFUNDED":
      case "CHARGEBACK":
        return "canceled";
      default:
        return "pending";
    }
  }

  // ---- AbstractPaymentProvider implementation ----

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const { amount, currency_code, context } = input;
    const customer = (context?.customer as Record<string, unknown>) ?? {};
    const billingType = this.toBillingType(context ?? {});

    try {
      // 1. Create or find Asaas customer
      let asaasCustomerId: string;
      const cpfCnpj = (customer.cpf_cnpj || customer.tax_id || "00000000000") as string;

      const existingList = await this.client.customers.list({ cpfCnpj });
      if (existingList.data && existingList.data.length > 0) {
        asaasCustomerId = existingList.data[0].id!;
      } else {
        const created = await this.client.customers.new({
          name: ((customer.first_name || "") + " " + (customer.last_name || "")).trim() || "Cliente",
          email: (customer.email as string) || "sem-email@exemplo.com",
          cpfCnpj,
        });
        asaasCustomerId = created.id!;
      }

      // 2. Build payment payload
      const paymentPayload: Record<string, unknown> = {
        customer: asaasCustomerId,
        billingType,
        value: this.toCentavos(Number(amount)),
        dueDate: new Date(this.dueDateTomorrow()),
        description: `Pedido - ${context?.cart_id ?? "ecommerce"}`,
        externalReference: context?.cart_id as string,
      };

      // Credit card extras
      if (billingType === "CREDIT_CARD" && context?.credit_card) {
        const cc = context.credit_card as Record<string, string>;
        const customerAddr = (context?.billing_address as Record<string, string>) ?? {};
        paymentPayload.creditCard = {
          holderName: cc.holder_name,
          number: cc.number,
          expiryMonth: cc.expiry_month,
          expiryYear: cc.expiry_year,
          ccv: cc.ccv,
        };
        paymentPayload.creditCardHolderInfo = {
          name: cc.holder_name,
          email: (customer.email as string) || "sem-email@exemplo.com",
          cpfCnpj,
          phone: (customer.phone as string) || "",
          address: customerAddr.address_1 || "",
          addressNumber: customerAddr.address_number || "S/N",
          province: customerAddr.province || "",
          city: customerAddr.city || "",
          state: customerAddr.province || "",
          postalCode: customerAddr.postal_code || "",
        };
      }

      const payment = await this.client.payments.new(paymentPayload as any);

      // 3. Fetch PIX QR code if PIX
      let pixData: Record<string, string> = {};
      if (billingType === "PIX" && payment.id) {
        try {
          const pix = await this.client.payments.getPixQrCode(payment.id);
          pixData = {
            pixQrCode: pix.encodedImage || "",
            pixCopyPaste: pix.payload || "",
            pixExpirationDate: pix.expirationDate?.toString() || "",
          };
        } catch {
          // QR code may not be ready immediately
        }
      }

      // 4. Fetch boleto info if BOLETO
      let boletoData: Record<string, string> = {};
      if (billingType === "BOLETO" && payment.id) {
        try {
          const boleto = await this.client.payments.getIdentificationField(payment.id);
          boletoData = {
            boletoUrl: boleto.bankSlipUrl || "",
            boletoBarCode: boleto.identificationField || "",
          };
        } catch {
          // boleto may not be ready immediately
        }
      }

      return {
        id: payment.id!,
        data: {
          id: payment.id,
          asaasCustomerId,
          billingType,
          status: payment.status,
          value: payment.value,
          dueDate: payment.dueDate?.toString(),
          ...pixData,
          ...boletoData,
        },
      };
    } catch (error: any) {
      this.logger_.error(`[Asaas] initiatePayment error: ${error.message}`);
      throw error;
    }
  }

  async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    const data = input.data as Record<string, unknown>;
    const id = data?.id as string;

    try {
      const payment = await this.client.payments.getById(id);
      const status = this.mapStatus(payment.status || "PENDING");

      if (status === "captured") {
        return { status: "authorized", data: { ...data, status: payment.status } };
      }
      if (status === "canceled") {
        return { status: "canceled", data: { ...data, status: payment.status } };
      }
      return { status: "pending", data: { ...data, status: payment.status } };
    } catch (error: any) {
      this.logger_.error(`[Asaas] authorizePayment error: ${error.message}`);
      return { status: "error", data: { ...data, error: error.message } };
    }
  }

  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    const data = input.data as Record<string, unknown>;
    const id = data?.id as string;

    try {
      const payment = await this.client.payments.getById(id);
      return { data: { ...data, status: payment.status, capturedAt: new Date().toISOString() } };
    } catch (error: any) {
      this.logger_.error(`[Asaas] capturePayment error: ${error.message}`);
      throw error;
    }
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    const data = input.data as Record<string, unknown>;
    const id = data?.id as string;

    try {
      await this.client.payments.delete(id);
      return { data: { ...data, status: "CANCELLED" } };
    } catch (error: any) {
      this.logger_.error(`[Asaas] cancelPayment error: ${error.message}`);
      throw error;
    }
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return this.cancelPayment(input as any);
  }

  async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    const data = input.data as Record<string, unknown>;
    const id = data?.id as string;

    try {
      const payment = await this.client.payments.getById(id);
      return { status: this.mapStatus(payment.status || "PENDING") };
    } catch {
      return { status: "error" };
    }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    const data = input.data as Record<string, unknown>;
    const id = data?.id as string;

    try {
      await this.client.payments.refund(id, {
        value: this.toCentavos(Number(input.amount)),
        description: "Reembolso",
      });
      return { data: { ...data, refunded: true, refundAmount: input.amount } };
    } catch (error: any) {
      this.logger_.error(`[Asaas] refundPayment error: ${error.message}`);
      throw error;
    }
  }

  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    const data = input.data as Record<string, unknown>;
    const id = data?.id as string;

    try {
      const payment = await this.client.payments.getById(id);
      return { data: { ...data, ...payment } };
    } catch (error: any) {
      this.logger_.error(`[Asaas] retrievePayment error: ${error.message}`);
      throw error;
    }
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    const data = input.data as Record<string, unknown>;
    const id = data?.id as string;

    try {
      const updated = await this.client.payments.updateById(id, {
        value: this.toCentavos(Number(input.amount)),
        customer: data.asaasCustomerId as string,
        billingType: data.billingType as string,
        dueDate: new Date(this.dueDateTomorrow()),
      });
      return { data: { ...data, ...updated } };
    } catch (error: any) {
      this.logger_.error(`[Asaas] updatePayment error: ${error.message}`);
      throw error;
    }
  }

  async getWebhookActionAndData(
    payload: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    const body = payload.data as Record<string, unknown>;
    const event = body.event as string;
    const paymentData = body.data as Record<string, unknown>;

    const sessionId = (paymentData?.externalReference as string) || "";
    const amount = new BigNumber(Number(paymentData?.value ?? 0) * 100);

    switch (event) {
      case "PAYMENT_RECEIVED":
      case "PAYMENT_CONFIRMED":
        return {
          action: "captured",
          data: { session_id: sessionId, amount },
        };
      case "PAYMENT_CREATED":
        return {
          action: "authorized",
          data: { session_id: sessionId, amount },
        };
      case "PAYMENT_DELETED":
      case "PAYMENT_OVERDUE":
        return {
          action: "failed",
          data: { session_id: sessionId, amount },
        };
      default:
        return {
          action: "not_supported",
          data: { session_id: sessionId, amount },
        };
    }
  }
}

export default AsaasPaymentService;
