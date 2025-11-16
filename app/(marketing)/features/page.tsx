/**
 * Features Page
 * Display detailed product features
 */

import { Radio, BarChart3, MessageSquare, Shield, Users, Zap } from 'lucide-react'

export default function FeaturesPage() {
  return (
    <div className="space-y-20 py-12">
      {/* Header */}
      <section className="px-4 md:px-8 lg:px-16 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 dark:text-white mb-4">
            Powerful Features
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            Everything you need to manage your radio station efficiently
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-4 md:px-8 lg:px-16 py-20">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Program Management */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-8">
            <Radio className="w-12 h-12 text-slate-900 dark:text-white mb-4" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Program Management
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Create, schedule, and manage radio programs with an intuitive interface. Set up recurring schedules and manage program hosts.
            </p>
          </div>

          {/* SMS Campaigns */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-8">
            <MessageSquare className="w-12 h-12 text-slate-900 dark:text-white mb-4" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              SMS Campaigns
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Send bulk SMS messages to listeners and clients. Create templates, schedule campaigns, and track delivery rates.
            </p>
          </div>

          {/* Analytics */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-8">
            <BarChart3 className="w-12 h-12 text-slate-900 dark:text-white mb-4" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Advanced Analytics
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Get detailed insights into your station's performance. Track listener engagement, campaign metrics, and revenue.
            </p>
          </div>

          {/* Security */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-8">
            <Shield className="w-12 h-12 text-slate-900 dark:text-white mb-4" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Enterprise Security
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Multi-tenant architecture with complete data isolation. Enterprise-grade encryption and compliance certifications.
            </p>
          </div>

          {/* Team Collaboration */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-8">
            <Users className="w-12 h-12 text-slate-900 dark:text-white mb-4" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Team Collaboration
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Manage team members with role-based access control. Assign permissions and track user activities.
            </p>
          </div>

          {/* API Integration */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-8">
            <Zap className="w-12 h-12 text-slate-900 dark:text-white mb-4" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              API Integration
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Integrate with your existing tools via our REST API. Webhooks, OAuth, and custom integrations supported.
            </p>
          </div>
        </div>
      </section>

      {/* Detailed Feature Breakdown */}
      <section className="px-4 md:px-8 lg:px-16 py-20 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-slate-900 dark:text-white">
            Feature Highlights
          </h2>

          {/* Feature 1 */}
          <div className="grid md:grid-cols-2 gap-12 mb-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                Complete Client Management
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Organize client information, contact details, and communication history in one central location.
              </p>
              <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                <li>✓ Client profiles and contact management</li>
                <li>✓ Communication history</li>
                <li>✓ Custom fields and tags</li>
                <li>✓ Bulk operations</li>
              </ul>
            </div>
            <div className="bg-slate-200 dark:bg-slate-800 rounded-lg h-64 flex items-center justify-center">
              <span className="text-slate-500">Feature Preview</span>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="bg-slate-200 dark:bg-slate-800 rounded-lg h-64 flex items-center justify-center md:order-2">
              <span className="text-slate-500">Feature Preview</span>
            </div>
            <div className="md:order-1">
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                Smart Program Scheduling
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Schedule programs with recurring patterns, manage time slots, and avoid conflicts automatically.
              </p>
              <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                <li>✓ Recurring schedule patterns</li>
                <li>✓ Conflict detection</li>
                <li>✓ Calendar view</li>
                <li>✓ Export to common formats</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
