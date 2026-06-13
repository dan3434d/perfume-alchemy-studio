import { Toaster } from "sonner";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <Toaster position="top-center" richColors />
    </div>
  );
}
