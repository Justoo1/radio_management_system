'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, BarChart3, Users } from 'lucide-react';

interface ListenersLayoutProps {
  children: React.ReactNode;
  title: string;
  description: string;
  actions?: React.ReactNode;
}

const navItems = [
  { href: '/listeners', label: 'Overview', icon: Activity },
  { href: '/listeners/sessions', label: 'Sessions', icon: Users },
  { href: '/listeners/metrics', label: 'Metrics', icon: BarChart3 },
];

export function ListenersLayout({ children, title, description, actions }: ListenersLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-pink-500/10 to-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 p-4 sm:p-6 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl shadow-lg">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                {title}
              </h1>
              <p className="text-slate-400 mt-1">{description}</p>
            </div>
          </div>
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white/5 backdrop-blur-xl rounded-xl p-1.5 border border-white/10 inline-flex gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  );
}
