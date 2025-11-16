/**
 * Footer Component
 * Footer for public/marketing pages
 */

import Link from 'next/link'
import { Facebook, Twitter, Linkedin } from 'lucide-react'

export default function Footer() {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
      <div className="grid md:grid-cols-4 gap-12 mb-8">
        {/* Company Info */}
        <div>
          <h3 className="text-lg font-bold mb-4">RadioMgmt</h3>
          <p className="text-sm text-slate-300">
            Professional platform for radio stations to manage clients, programs, and campaigns.
          </p>
        </div>

        {/* Product Links */}
        <div>
          <h4 className="text-sm font-semibold mb-4 uppercase">Product</h4>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>
              <Link href="/features" className="hover:text-white transition">
                Features
              </Link>
            </li>
            <li>
              <Link href="/pricing" className="hover:text-white transition">
                Pricing
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-white transition">
                FAQ
              </Link>
            </li>
          </ul>
        </div>

        {/* Company Links */}
        <div>
          <h4 className="text-sm font-semibold mb-4 uppercase">Company</h4>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>
              <Link href="/about" className="hover:text-white transition">
                About
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-white transition">
                Blog
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-white transition">
                Contact
              </Link>
            </li>
          </ul>
        </div>

        {/* Legal Links */}
        <div>
          <h4 className="text-sm font-semibold mb-4 uppercase">Legal</h4>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>
              <Link href="#" className="hover:text-white transition">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-white transition">
                Terms of Service
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-700 pt-8">
        {/* Social Links */}
        <div className="flex items-center justify-between flex-col md:flex-row gap-4">
          <p className="text-sm text-slate-400">
            © 2024 RadioMgmt. All rights reserved.
          </p>
          <div className="flex gap-4">
            <a
              href="#"
              className="text-slate-400 hover:text-white transition"
              aria-label="Facebook"
            >
              <Facebook size={18} />
            </a>
            <a
              href="#"
              className="text-slate-400 hover:text-white transition"
              aria-label="Twitter"
            >
              <Twitter size={18} />
            </a>
            <a
              href="#"
              className="text-slate-400 hover:text-white transition"
              aria-label="LinkedIn"
            >
              <Linkedin size={18} />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
