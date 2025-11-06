
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Unleashed Middleware',
  description: 'ROar + Unleashed integration middleware',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-slate-800 bg-slate-950/70 backdrop-blur-sm">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
              <Link href="/" className="text-lg font-semibold tracking-wide">
                Unleashed Middleware
              </Link>
              <nav className="space-x-4 text-sm text-slate-300">
                <a className="hover:text-white" href="/dashboard">
                  Dashboard
                </a>
                <a className="hover:text-white" href="/pipeline">
                  Pipeline
                </a>
                <a className="hover:text-white" href="/settings">
                  Settings
                </a>
              </nav>
            </div>
          </header>
          <main className="flex-1">
            <div className="mx-auto max-w-6xl p-6">{children}</div>
          </main>
          <footer className="border-t border-slate-800 bg-slate-950/70 py-6 text-center text-xs text-slate-500">
            &copy; {new Date().getFullYear()} Unleashed Middleware
          </footer>

        </div>
      </body>
    </html>
  );
}
