'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { X } from 'lucide-react'
import { useUIStore } from '@/store'
import { getOrganizationName } from '@/app/actions/features'
import Sidebar from './sidebar'

export default function MobileSidebarOverlay() {
  const { isSidebarOpen, setSidebarOpen } = useUIStore()
  const [orgName, setOrgName] = useState('Radio Management')

  // Load organization name
  useEffect(() => {
    async function loadOrgName() {
      try {
        const organizationName = await getOrganizationName()
        setOrgName(organizationName)
      } catch (error) {
        console.error('Failed to load organization name:', error)
      }
    }
    loadOrgName()
  }, [])

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
        {/* Header with Logo and Close Button */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <Link href="/dashboard" className="flex items-center gap-3 flex-1 min-w-0" onClick={() => setSidebarOpen(false)}>
            <Image
              src="/logo-white.svg"
              alt="RMS Logo"
              width={32}
              height={32}
              className="flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h1 className="text-base font-bold text-white truncate">
                {orgName}
              </h1>
              <p className="text-xs text-slate-400">RMS</p>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 hover:bg-slate-700 rounded-lg transition flex-shrink-0"
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
