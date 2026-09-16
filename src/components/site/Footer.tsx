import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="border-t border-border mt-24 bg-[var(--sand)]">
      <div className="container-px max-w-7xl mx-auto py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="font-display text-2xl leading-none">Abdulrahman</div>
            <div className="eyebrow mt-2">Perfumes · Est. Sydney</div>
            <p className="text-sm text-muted-foreground mt-5 max-w-xs leading-relaxed">
              The name means <em>servant of the Most Merciful</em>. In our family, mercy arrived as
              hospitality — and hospitality always arrived as scent. We bottle that welcome.
            </p>
          </div>
          <div>
            <h4 className="eyebrow">Collection</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link to="/shop" className="link-underline">All fragrances</Link></li>
              <li><Link to="/scent-discovery" className="link-underline">Find your scent</Link></li>
              <li><Link to="/shop" search={{ category: "oud-perfumes" }} className="link-underline">Oud</Link></li>
              <li><Link to="/shop" search={{ category: "fresh-scents" }} className="link-underline">Fresh</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="eyebrow">House</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link to="/about" className="link-underline">Our story</Link></li>
              <li><Link to="/contact" className="link-underline">Contact</Link></li>
              <li><Link to="/wholesale" className="link-underline">Wholesale</Link></li>
              <li><Link to="/shipping" className="link-underline">Shipping</Link></li>
              <li><Link to="/returns" className="link-underline">Returns</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="eyebrow">Reach us</h4>
            <p className="mt-4 text-sm">support@abdulrahman.store</p>
            <p className="text-sm text-muted-foreground mt-1">Sydney, Australia · AUD</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link to="/privacy" className="link-underline">Privacy</Link></li>
              <li><Link to="/terms" className="link-underline">Terms</Link></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container-px max-w-7xl mx-auto py-5 text-xs text-muted-foreground flex flex-col sm:flex-row justify-between gap-2">
          <span>© {new Date().getFullYear()} Abdulrahman Perfumes</span>
          <span>Blended in the UAE · Bottled and sent from Sydney</span>
        </div>
      </div>
    </footer>
  );
}
