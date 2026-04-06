import { ReactNode } from "react";

export const metadata = {
  title: "Finalizar Pedido",
  robots: { follow: false, index: false },
};

// Checkout has its own simplified navbar rendered inline in page.tsx.
// Root layout (with CartProvider + Navbar) still wraps this subtree,
// but the page hides the root navbar via its own full-page layout starting
// with a custom header element.
export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
