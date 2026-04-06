import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { IOrderModuleService } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";

// GET /store/checkout/status?order_id={id}
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const orderId = req.query?.order_id as string | undefined;

  if (!orderId) {
    return res.status(400).json({ error: "order_id query param is required" });
  }

  try {
    const orderService = req.scope.resolve<IOrderModuleService>(Modules.ORDER);

    const order = await orderService.retrieveOrder(orderId, {
      relations: ["payment_collections", "payment_collections.payments"],
    });

    const orderWithPayments = order as any;
    const payments = orderWithPayments.payment_collections?.flatMap((pc: any) => pc.payments ?? []) ?? [];

    // Determine payment status from payments
    let status: "pending" | "paid" | "failed" = "pending";

    if (payments.some((p) => p.captured_at)) {
      status = "paid";
    } else if (payments.some((p) => p.canceled_at)) {
      status = "failed";
    }

    const paymentMethod =
      payments[0]?.provider_id?.replace("pp_", "").replace("_asaas", "") ?? "unknown";

    return res.status(200).json({ status, payment_method: paymentMethod });
  } catch (error: any) {
    console.error("[CheckoutStatus] Error:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
