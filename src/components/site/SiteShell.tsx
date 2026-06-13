import { Toaster } from "sonner";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { ShoppingAssistant } from "./ShoppingAssistant";
import { SpinWheel } from "./SpinWheel";
import { PromoBanner } from "./PromoBanner";
import { PromoPopup } from "./PromoPopup";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <PromoBanner />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <ShoppingAssistant />
      <SpinWheel />
      <PromoPopup />
      <Toaster position="top-center" richColors />
    </div>
  );
}

