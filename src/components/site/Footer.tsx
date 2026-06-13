import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="border-t border-border mt-24 bg-[var(--cream)]/40">
      <div className="container-px max-w-7xl mx-auto py-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h3 className="font-display text-lg">Abdulrahman Perfumes</h3>
          <p className="text-sm text-muted-foreground mt-3 max-w-xs">
            Signature scents crafted with oud, amber and modern sensibilities. Shipped across Australia.
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Shop</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/shop" className="hover:text-[var(--amber-deep)]">All Perfumes</Link></li>
            <li><Link to="/scent-discovery" className="hover:text-[var(--amber-deep)]">Scent Discovery Quiz</Link></li>
            <li><Link to="/shop" search={{ category: "oud-perfumes" }} className="hover:text-[var(--amber-deep)]">Oud Collection</Link></li>
            <li><Link to="/shop" search={{ category: "smoky-scents" }} className="hover:text-[var(--amber-deep)]">Smoky Scents</Link></li>
            <li><Link to="/shop" search={{ category: "fresh-scents" }} className="hover:text-[var(--amber-deep)]">Fresh Scents</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Help</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/contact" className="hover:text-[var(--amber-deep)]">Contact</Link></li>
            <li><Link to="/wholesale" className="hover:text-[var(--amber-deep)]">Wholesale enquiries</Link></li>
            <li><Link to="/shipping" className="hover:text-[var(--amber-deep)]">Shipping</Link></li>
            <li><Link to="/returns" className="hover:text-[var(--amber-deep)]">Returns</Link></li>
            <li><Link to="/privacy" className="hover:text-[var(--amber-deep)]">Privacy</Link></li>
            <li><Link to="/terms" className="hover:text-[var(--amber-deep)]">Terms</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Get in touch</h4>
          <p className="mt-3 text-sm">support@abdulrahman.store</p>
          <p className="text-sm text-muted-foreground mt-1">Australia · AUD</p>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container-px max-w-7xl mx-auto py-5 text-xs text-muted-foreground flex flex-col sm:flex-row justify-between gap-2">
          <span>© {new Date().getFullYear()} Abdulrahman Perfumes. All rights reserved.</span>
          <span>Secure checkout · Fast Australian shipping</span>
        </div>
      </div>
    </footer>
  );
}
