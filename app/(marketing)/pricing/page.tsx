/**
 * Pricing Page
 * Display pricing plans and tiers
 */

export default function PricingPage() {
  return (
    <div className="space-y-20 py-12">
      {/* Header */}
      <section className="px-4 md:px-8 lg:px-16 py-20 text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 dark:text-white">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            Start free with a 7-day trial. Scale as your station grows.
          </p>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="px-4 md:px-8 lg:px-16 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Starter Plan */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-8">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Starter</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">Perfect for small radio stations</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900 dark:text-white">GH₵ 500</span>
                <span className="text-slate-600 dark:text-slate-400">/month</span>
              </div>
              <ul className="space-y-3 text-slate-600 dark:text-slate-400 mb-8">
                <li>✓ Client Management</li>
                <li>✓ Program Scheduling</li>
                <li>✓ Live On-Air Dashboard</li>
                <li>✓ Invoices & Contracts</li>
                <li>✓ Basic Reports</li>
                <li>✓ Up to 5 Users</li>
                <li className="text-slate-400">✗ SMS Campaigns</li>
                <li className="text-slate-400">✗ Advertisement Management</li>
                <li className="text-slate-400">✗ Media Library</li>
              </ul>
              <button className="w-full bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white px-6 py-2 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition">
                Get Started
              </button>
            </div>

            {/* Professional Plan */}
            <div className="border-2 border-slate-900 dark:border-white rounded-lg p-8 relative">
              <div className="absolute -top-4 left-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Professional</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">For growing radio stations</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900 dark:text-white">GH₵ 1,200</span>
                <span className="text-slate-600 dark:text-slate-400">/month</span>
              </div>
              <ul className="space-y-3 text-slate-600 dark:text-slate-400 mb-8">
                <li>✓ Everything in Starter</li>
                <li>✓ SMS Campaigns</li>
                <li>✓ Advertisement Management</li>
                <li>✓ Media Library</li>
                <li>✓ WhatsApp Integration</li>
                <li>✓ Expense Tracking</li>
                <li>✓ Up to 15 Users</li>
                <li className="text-slate-400">✗ Advanced Analytics</li>
              </ul>
              <button className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition font-medium">
                Start 7-Day Trial
              </button>
            </div>

            {/* Enterprise Plan */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-8">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Enterprise</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">For large networks</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900 dark:text-white">Custom</span>
              </div>
              <ul className="space-y-3 text-slate-600 dark:text-slate-400 mb-8">
                <li>✓ Unlimited everything</li>
                <li>✓ Custom integrations</li>
                <li>✓ Dedicated support</li>
                <li>✓ SLA guarantee</li>
                <li>✓ On-premise option</li>
              </ul>
              <button className="w-full border-2 border-slate-900 dark:border-white text-slate-900 dark:text-white px-6 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 md:px-8 lg:px-16 py-20 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-slate-900 dark:text-white">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <details className="border border-slate-200 dark:border-slate-800 rounded-lg p-6">
              <summary className="cursor-pointer font-semibold text-slate-900 dark:text-white flex justify-between">
                Can I upgrade or downgrade my plan?
                <span>+</span>
              </summary>
              <p className="mt-4 text-slate-600 dark:text-slate-400">
                Yes, you can change your plan at any time. Changes take effect immediately.
              </p>
            </details>

            <details className="border border-slate-200 dark:border-slate-800 rounded-lg p-6">
              <summary className="cursor-pointer font-semibold text-slate-900 dark:text-white flex justify-between">
                What payment methods do you accept?
                <span>+</span>
              </summary>
              <p className="mt-4 text-slate-600 dark:text-slate-400">
                We accept all major credit cards, bank transfers, and digital payment methods.
              </p>
            </details>

            <details className="border border-slate-200 dark:border-slate-800 rounded-lg p-6">
              <summary className="cursor-pointer font-semibold text-slate-900 dark:text-white flex justify-between">
                Is there a contract or commitment?
                <span>+</span>
              </summary>
              <p className="mt-4 text-slate-600 dark:text-slate-400">
                No, all plans are month-to-month. Cancel anytime without penalties.
              </p>
            </details>
          </div>
        </div>
      </section>
    </div>
  )
}
