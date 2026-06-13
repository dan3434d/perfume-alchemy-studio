import { Toaster } from "sonner";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { ShoppingAssistant } from "./ShoppingAssistant";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <ShoppingAssistant />
      <Toaster position="top-center" richColors />
    </div>
  );
}
