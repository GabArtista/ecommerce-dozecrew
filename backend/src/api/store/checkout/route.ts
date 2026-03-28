import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ICartModuleService, IPaymentModuleService } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";

type CheckoutBody = {
  cart_id: string;
  billing_type: "PIX" | "BOLETO" | "CREDIT_CARD";
  customer: {
    name: string;
    email: string;
    cpf_cnpj: string;
    phone?: string;
  };
  credit_card?: {
    holder_name: string;
    number: string;
    expiry_month: string;
    expiry_year: string;
    ccv: string;
  };
  billing_address?: {
    address_1: string;
    address_number?: string;
    province?: string;
    city: string;
    postal_code: string;
  };
};

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = req.body as CheckoutBody;

  if (!body.cart_id || !body.billing_type || !body.customer) {
    return res.status(400).json({ error: "cart_id, billing_type and customer are required" });
  }

  const paymentService = req.scope.resolve<IPaymentModuleService>(Modules.PAYMENT);

  try {
    // Create a payment collection for the cart
    const paymentCollection = await paymentService.createPaymentCollections({
      region_id: "region_default",
      amount: 0, // will be overridden by cart total
      currency_code: "brl",
    });

    // Initiate payment session with Asaas provider
    const session = await paymentService.createPaymentSession(
      paymentCollection.id,
      {
        provider_id: "pp_asaas_asaas",
        amount: 0,
        currency_code: "brl",
        data: {},
        context: {
          cart_id: body.cart_id,
          billing_type: body.billing_type,
          customer: body.customer,
          credit_card: body.credit_card,
          billing_address: body.billing_address,
        },
      }
    );

    return res.status(200).json({
      payment_session: {
        id: session.id,
        provider_id: session.provider_id,
        data: session.data,
        status: session.status,
      },
    });
  } catch (error: any) {
    console.error("[Checkout] Error:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
