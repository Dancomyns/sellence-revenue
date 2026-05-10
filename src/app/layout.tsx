import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sellence Revenue Tracker",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${geist.className} bg-gray-50 h-full`}>
        <div className="flex h-full">
          <aside className="w-52 bg-white border-r flex flex-col py-6 px-4 gap-1 shrink-0">
            <div className="mb-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Sellence</p>
              <p className="text-sm font-bold text-gray-800">Revenue Tracker</p>
            </div>
            <NavLink href="/">Dashboard</NavLink>
            <NavLink href="/clients">Clients</NavLink>
            <NavLink href="/usage">Usage</NavLink>
            <NavLink href="/revenue">Revenue</NavLink>
            <NavLink href="/sms">SMS Costs</NavLink>
            <NavLink href="/settings">Settings</NavLink>
          </aside>
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded px-3 py-2 transition-colors"
    >
      {children}
    </Link>
  );
}
