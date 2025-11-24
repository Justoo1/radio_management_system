'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useUIStore } from '@/store'
import Sidebar from './sidebar'

export default function MobileSidebarOverlay() {
  const { isSidebarOpen, setSidebarOpen } = useUIStore()

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const sidebar = document.getElementById('mobile-sidebar')
      const menuButton = document.getElementById('menu-button')

      if (
        isSidebarOpen &&
        sidebar &&
        !sidebar.contains(e.target as Node) &&
        menuButton &&
        !menuButton.contains(e.target as Node)
      ) {
        setSidebarOpen(false)
      }
    }

    if (isSidebarOpen) {
      document.addEventListener('click', handleClickOutside)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isSidebarOpen, setSidebarOpen])

  return (
    <>
      {/* Overlay Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-40 transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        id="mobile-sidebar"
        className={`fixed left-0 top-0 h-screen w-64 bg-slate-900 text-white z-50 flex-col lg:hidden transition-transform duration-300 ease-in-out transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Close Button */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h1 className="text-xl font-bold text-white">RadioMgmt</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 hover:bg-slate-700 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-hidden">
          <Sidebar hideLogoOnMobile={true} />
        </div>
      </aside>
    </>
  )
}
