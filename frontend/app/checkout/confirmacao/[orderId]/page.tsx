import { cookies } from "next/headers";
import ConfirmationClient from "./confirmation-client";

type PageParams = { orderId: string };

export default async function ConfirmacaoPage({
  params,
  searchParams,
}: {
  params: Promise<PageParams>;
  searchParams: Promise<{ payment?: string }>;
}) {
  const { orderId } = await params;
  const { payment: paymentMethod = "pix" } = await searchParams;

  // Server Components can read cookies, but cookie mutation must stay in a
  // Server Action or Route Handler. Keep this page read-only to avoid runtime
  // errors during local checkout confirmation.
  const jar = await cookies();
  const raw = jar.get("paymentData")?.value ?? null;

  let paymentData: Record<string, unknown> = {};
  if (raw) {
    try {
      paymentData = JSON.parse(raw);
    } catch {
      // cookie corrompido — segue com objeto vazio
    }
  }

  return (
    <ConfirmationClient
      orderId={orderId}
      paymentMethod={paymentMethod}
      paymentData={paymentData}
    />
  );
}
