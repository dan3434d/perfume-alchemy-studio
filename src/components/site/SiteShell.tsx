import { Toaster } from "sonner";
import { useLocation } from "@tanstack/react-router";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { ShoppingAssistant } from "./ShoppingAssistant";
import { SpinWheel } from "./SpinWheel";
import { PromoBanner } from "./PromoBanner";
import { PromoPopup } from "./PromoPopup";
import { ExitIntentOffer } from "./ExitIntentOffer";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isCheckout = location.pathname.startsWith("/checkout");

  return (
    <div className="min-h-screen flex flex-col">
      <PromoBanner />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      {!isCheckout && <ShoppingAssistant />}
      {!isCheckout && <SpinWheel />}
      {!isCheckout && <PromoPopup />}
      {!isCheckout && <ExitIntentOffer />}
      <Toaster position="top-center" richColors />
    </div>
  );
}

