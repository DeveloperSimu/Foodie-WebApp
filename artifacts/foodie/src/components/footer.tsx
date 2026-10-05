import { Link } from "wouter";
import { ChefHat, Instagram, Twitter, Facebook, Youtube, Mail, Phone, MapPin, ArrowRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function Footer() {
  const [email, setEmail] = useState("");

  const handleSubscribe = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    toast.success("You're subscribed to Foodie updates!");
    setEmail("");
  };

  return (
    <footer className="bg-zinc-950 text-zinc-300 mt-auto">
      {/* Top gradient accent */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-60" />

      <div className="container mx-auto px-4 pt-16 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 mb-14">

          {/* Brand — wider column */}
          <div className="lg:col-span-4 space-y-5">
            <Link href="/" className="flex items-center gap-2.5 group w-fit">
              <div className="bg-primary text-white p-2 rounded-xl group-hover:scale-105 transition-transform shadow-lg shadow-primary/30">
                <ChefHat size={22} />
              </div>
              <span className="text-2xl font-bold font-serif text-white">Foodie</span>
            </Link>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-xs">
              Discover and order food from the best local cafes. Watch cooking shorts, share recipes, and be part of a vibrant culinary community.
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-3 pt-2">
              {[
                { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
                { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
                { icon: Facebook, href: "https://facebook.com", label: "Facebook" },
                { icon: Youtube, href: "https://youtube.com", label: "YouTube" },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="h-9 w-9 rounded-full bg-zinc-800 hover:bg-primary border border-zinc-700 hover:border-primary flex items-center justify-center text-zinc-400 hover:text-white transition-all duration-200"
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>

            {/* App store badges */}
            <div className="flex gap-3 pt-1">
              <a               href="https://apps.apple.com" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition-colors text-xs text-zinc-300 hover:text-white">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                App Store
              </a>
              <a href="https://play.google.com/store" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition-colors text-xs text-zinc-300 hover:text-white">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg"><path d="M3.18 23.76c.31.17.65.24 1 .21l11.76-11.76L12 8.27 3.18 23.76zm-1-22.02C2.07 2.01 2 2.3 2 2.63v18.74c0 .33.07.62.18.89L13.76 10.5 2.18 1.74zm19.28 8.45l-2.82-1.61L15.9 12l3.74 3.74 2.82-1.61c.8-.46.8-1.62 0-2.08zM4.18.03L15.94 11.8l-2.18 2.18L2 2.24C2.32.98 3.24.12 4.18.03z"/></svg>
                Google Play
              </a>
            </div>
          </div>

          {/* Explore */}
          <div className="lg:col-span-2 space-y-5">
            <h3 className="font-semibold text-white text-sm tracking-wider uppercase">Explore</h3>
            <ul className="space-y-3">
              {[
                { href: "/", label: "Home" },
                { href: "/menu", label: "Browse Menu" },
                { href: "/shorts", label: "Cooking Shorts" },
                { href: "/ideas", label: "Cooking Ideas" },
                { href: "/orders", label: "My Orders" },
                { href: "/wishlist", label: "Wishlist" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-zinc-400 hover:text-primary transition-colors flex items-center gap-1.5 group">
                    <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity -ml-3.5 group-hover:ml-0 duration-200" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Cafes */}
          <div className="lg:col-span-2 space-y-5">
            <h3 className="font-semibold text-white text-sm tracking-wider uppercase">For Cafes</h3>
            <ul className="space-y-3">
              {[
                { href: "/register", label: "Register Your Cafe" },
                { href: "/cafe/menu", label: "Manage Menu" },
                { href: "/orders", label: "Incoming Orders" },
                { href: "/shorts/new", label: "Upload Shorts" },
                { href: "/ideas/new", label: "Share Ideas" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-zinc-400 hover:text-primary transition-colors flex items-center gap-1.5 group">
                    <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity -ml-3.5 group-hover:ml-0 duration-200" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter + Contact */}
          <div className="lg:col-span-4 space-y-6">
            {/* Newsletter */}
            <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800">
              <h3 className="font-semibold text-white text-sm mb-1">Stay in the loop</h3>
              <p className="text-xs text-zinc-400 mb-4">Get weekly recipes, new cafe alerts, and food inspiration.</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 text-sm px-3 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-primary transition-colors"
                />
                <button type="button" onClick={handleSubscribe} className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap">
                  Subscribe
                </button>
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-3">
              <h3 className="font-semibold text-white text-sm tracking-wider uppercase">Contact</h3>
              <ul className="space-y-2.5">
                <li className="flex items-start gap-3 text-sm text-zinc-400">
                  <MapPin size={14} className="text-primary flex-shrink-0 mt-0.5" />
                  <span>123 Culinary Street, Food District, Mumbai 400001</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <Phone size={14} className="text-primary flex-shrink-0" />
                  <a href="tel:+911234567890" className="text-zinc-400 hover:text-primary transition-colors">+91 12345 67890</a>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <Mail size={14} className="text-primary flex-shrink-0" />
                  <a href="mailto:hello@foodie.app" className="text-zinc-400 hover:text-primary transition-colors">hello@foodie.app</a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-500">
            © {new Date().getFullYear()} Foodie Technologies Pvt. Ltd. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {["Privacy Policy", "Terms of Service", "Cookie Policy", "Sitemap"].map((label) => (
              <a key={label} href="#" className="text-xs text-zinc-500 hover:text-primary transition-colors">
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
