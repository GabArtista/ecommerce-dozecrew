"use server";

import { cookies } from "next/headers";

export type PaymentMethod = "PIX" | "BOLETO" | "CREDIT_CARD";

export type PaymentData = {
  pixQrCode?: string;    // base64 image
  pixCode?: string;      // copia-e-cola
  pixExpiresAt?: string; // ISO date string
  boletoCode?: string;
  boletoUrl?: string;
  boletoDueDate?: string;
  cardStatus?: "approved" | "declined";
};

export type CompleteCheckoutResult = {
  orderId: string;
  paymentData: PaymentData;
  error?: string;
};

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000";
const PUBLISHABLE_KEY = process.env.MEDUSA_PUBLISHABLE_KEY || "";

function mapBillingType(method: string): PaymentMethod {
  if (method === "boleto") return "BOLETO";
  if (method === "cartao") return "CREDIT_CARD";
  return "PIX";
}

export async function completeCheckoutAction(
  formData: FormData
): Promise<CompleteCheckoutResult> {
  const jar = await cookies();
  const cartId = jar.get("cartId")?.value;

  if (!cartId) {
    return { orderId: "", paymentData: {}, error: "Carrinho não encontrado." };
  }

  const paymentMethod = formData.get("paymentMethod") as string ?? "pix";
  const billingType = mapBillingType(paymentMethod);

  const customer = {
    name: formData.get("fullName") as string,
    email: formData.get("email") as string,
    cpf_cnpj: (formData.get("cpf") as string ?? "").replace(/\D/g, ""),
    phone: formData.get("phone") as string,
  };

  const billingAddress = {
    address_1: formData.get("street") as string,
    address_number: formData.get("number") as string,
    province: formData.get("state") as string,
    city: formData.get("city") as string,
    postal_code: (formData.get("cep") as string ?? "").replace(/\D/g, ""),
  };

  // 1. Complete cart → create order
  let orderId = "";
  try {
    const completeRes = await fetch(`${BACKEND_URL}/store/carts/${cartId}/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": PUBLISHABLE_KEY,
      },
    });

    if (!completeRes.ok) {
      const err = await completeRes.text();
      return { orderId: "", paymentData: {}, error: `Erro ao finalizar carrinho: ${err}` };
    }

    const completeData = await completeRes.json();
    orderId = completeData.order?.id ?? completeData.cart?.id ?? "";
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { orderId: "", paymentData: {}, error: `Erro de rede: ${msg}` };
  }

  // 2. POST /store/checkout with payment details
  let paymentData: PaymentData = {};
  try {
    const body: Record<string, unknown> = {
      cart_id: cartId,
      billing_type: billingType,
      customer,
      billing_address: billingAddress,
    };

    if (billingType === "CREDIT_CARD") {
      const [month, year] = ((formData.get("cardExpiry") as string) ?? "").split("/");
      body.credit_card = {
        holder_name: formData.get("cardName") as string,
        number: (formData.get("cardNumber") as string ?? "").replace(/\s/g, ""),
        expiry_month: month ?? "",
        expiry_year: year ? `20${year}` : "",
        ccv: formData.get("cardCvv") as string,
      };
    }

    const checkoutRes = await fetch(`${BACKEND_URL}/store/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": PUBLISHABLE_KEY,
      },
      body: JSON.stringify(body),
    });

    if (checkoutRes.ok) {
      const checkoutData = await checkoutRes.json();
      const session = checkoutData.payment_session;

      if (billingType === "PIX") {
        paymentData = {
          pixQrCode: session?.data?.pixQrCode ?? session?.data?.encodedImage ?? "",
          pixCode: session?.data?.payload ?? session?.data?.pixCopyPaste ?? "",
          pixExpiresAt: session?.data?.expirationDate ?? new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        };
      } else if (billingType === "BOLETO") {
        paymentData = {
          boletoCode: session?.data?.identificationField ?? session?.data?.barCode ?? "",
          boletoUrl: session?.data?.bankSlipUrl ?? "",
          boletoDueDate: session?.data?.dueDate ?? "",
        };
      } else {
        paymentData = {
          cardStatus: session?.data?.status === "CONFIRMED" ? "approved" : "declined",
        };
      }
    }
  } catch {
    // Non-fatal: payment data may not be available; order is still created
  }

  // 3. Save payment data to cookie (httpOnly to prevent XSS access to QR code / boleto data)
  jar.set("paymentData", JSON.stringify(paymentData), {
    path: "/",
    maxAge: 60 * 30, // 30 minutes
    httpOnly: true,
    sameSite: "lax",
  });

  // Clear cart cookie
  jar.delete("cartId");

  return { orderId, paymentData };
}

/**
 * Server Action: lê e remove o cookie httpOnly `paymentData`, retornando seu conteúdo.
 * Use no lugar de document.cookie nos Server Components ou Client Components via action.
 */
export async function getPaymentData(): Promise<PaymentData> {
  const jar = await cookies();
  const raw = jar.get("paymentData")?.value;
  jar.delete("paymentData");
  if (!raw) return {};
  try {
    return JSON.parse(raw) as PaymentData;
  } catch {
    return {};
  }
}
