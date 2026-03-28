import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { IPaymentModuleService } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const paymentService = req.scope.resolve<IPaymentModuleService>(
    Modules.PAYMENT
  );

  const body = req.body as Record<string, unknown>;
  const event = body.event as string;

  if (!event) {
    return res.status(400).json({ error: "Missing event" });
  }

  try {
    await paymentService.processEvent({
      provider: "pp_asaas_asaas",
      payload: {
        data: body,
        rawData: JSON.stringify(body),
        headers: req.headers as Record<string, string>,
      },
    });

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error("[Asaas Webhook] Error:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
