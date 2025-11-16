/**
 * About Page
 * Company information and mission
 */

export default function AboutPage() {
  return (
    <div className="space-y-20 py-12">
      {/* Header */}
      <section className="px-4 md:px-8 lg:px-16 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 dark:text-white mb-4">
            About RadioNow
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            We're building the future of radio station management
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="px-4 md:px-8 lg:px-16 py-20 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-8">
            Our Mission
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-8">
            To empower radio stations across Africa with modern, affordable tools to manage their business efficiently and grow their audience.
          </p>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            We believe that technology shouldn't be a barrier to success. That's why we're building RadioNow—a comprehensive platform designed specifically for radio stations, whether you're just starting out or managing a network of stations.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="px-4 md:px-8 lg:px-16 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-8">
            Our Story
          </h2>
          <div className="space-y-6 text-slate-600 dark:text-slate-400">
            <p>
              RadioNow was founded in 2024 by a team of experienced software engineers and radio industry professionals who saw a gap in the market. Existing solutions were either too complex, too expensive, or simply didn't understand the unique challenges radio stations face.
            </p>
            <p>
              We started by talking to dozens of radio station managers across Ghana and West Africa. We listened to their pain points, understood their workflows, and built RadioNow from the ground up to solve their real problems.
            </p>
            <p>
              Today, RadioNow helps hundreds of radio stations manage their clients, programs, SMS campaigns, and advertising all in one place. We're proud of what we've built and excited about the future.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="px-4 md:px-8 lg:px-16 py-20 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-slate-900 dark:text-white">
            Our Values
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                User First
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                We design everything with our users in mind. Your success is our success.
              </p>
            </div>

            <div className="text-center">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                Transparency
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Honest pricing, clear communication, and no hidden fees. We believe in building trust.
              </p>
            </div>

            <div className="text-center">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                Innovation
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                We're constantly improving, learning, and building new features based on feedback.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="px-4 md:px-8 lg:px-16 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-slate-900 dark:text-white">
            Meet the Team
          </h2>

          <div className="grid md:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((member) => (
              <div key={member} className="text-center">
                <div className="w-32 h-32 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-slate-500">Team Member</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  Team Member {member}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Role & Title
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 md:px-8 lg:px-16 py-20 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-4xl font-bold">
            Join Our Community
          </h2>
          <p className="text-xl opacity-90">
            Become part of the growing community of radio stations using RadioNow.
          </p>
          <a
            href="/register"
            className="inline-flex items-center gap-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-8 py-3 rounded-lg hover:opacity-90 transition font-semibold"
          >
            Get Started Free
          </a>
        </div>
      </section>
    </div>
  )
}
