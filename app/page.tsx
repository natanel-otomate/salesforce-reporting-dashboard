import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navigation */}
      <nav className="w-full border-b border-gray-100 bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900">SyncBridge</span>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="#features"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors hidden md:block"
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors hidden md:block"
            >
              Pricing
            </Link>
            <Link
              href="/auth"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/auth?mode=signup"
              className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 pt-20 pb-24 text-center bg-gradient-to-b from-indigo-50 to-white">
        <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 uppercase tracking-wide">
          <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
          Built for Monday.com power users
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight max-w-4xl mb-6">
          One report.{" "}
          <span className="text-indigo-600">Every board.</span>{" "}
          Delivered automatically.
        </h1>

        <p className="text-xl text-gray-500 max-w-2xl mb-10 leading-relaxed">
          SyncBridge aggregates data across all your Monday.com boards into
          polished executive reports — scheduled, automated, and sent to your
          inbox without a single manual export.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <Link
            href="/auth?mode=signup"
            className="bg-indigo-600 text-white text-base font-semibold px-8 py-4 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 w-full sm:w-auto"
          >
            Start for free — no credit card
          </Link>
          <Link
            href="#features"
            className="text-gray-600 text-base font-medium px-8 py-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors w-full sm:w-auto"
          >
            See how it works
          </Link>
        </div>

        <p className="text-sm text-gray-400 mt-5">
          Setup in under 5 minutes · No developer required
        </p>
      </section>

      {/* Social Proof Strip */}
      <section className="bg-gray-50 border-y border-gray-100 py-10 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-sm text-gray-400 uppercase tracking-widest font-semibold mb-8">
            Solving the pain that Monday.com can't
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <p className="text-gray-700 text-sm leading-relaxed italic">
                "We pay $2,000/month for Monday.com and still can't automate a
                single cross-board report. Our ops team spends 4 hours every
                Friday doing it manually."
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm">
                  S
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-800">Sarah M.</p>
                  <p className="text-xs text-gray-400">VP Operations, Series B SaaS</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <p className="text-gray-700 text-sm leading-relaxed italic">
                "My executives want a single view across 12 project boards. I've
                been building that Google Sheet manually for 18 months. There
                has to be a better way."
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-sm">
                  D
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-800">David K.</p>
                  <p className="text-xs text-gray-400">PMO Director, Enterprise</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <p className="text-gray-700 text-sm leading-relaxed italic">
                "The native Monday.com dashboards only show one board at a time.
                We needed a rollup of KPIs across 8 boards and had to hire a
                contractor just for reporting."
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-sm">
                  A
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-800">Anika R.</p>
                  <p className="text-xs text-gray-400">Head of Strategy, Agency</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
              Everything executives need. Nothing they don't.
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              SyncBridge connects directly to Monday.com and handles the entire
              reporting workflow — from data aggregation to scheduled delivery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Feature 1 */}
            <div className="flex gap-5 p-6 rounded-2xl border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors group">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-200 transition-colors">
                <svg
                  className="w-6 h-6 text-indigo-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Cross-Board Aggregation
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Select up to 10 Monday.com boards and map columns to unified
                  metrics. SyncBridge rolls up totals, averages, and counts
                  across all boards instantly.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex gap-5 p-6 rounded-2xl border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors group">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200 transition-colors">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Scheduled Delivery
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Set reports to send daily, weekly, or monthly. SyncBridge
                  pulls fresh data on your schedule and emails polished reports
                  to any list of recipients — automatically.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex gap-5 p-6 rounded-2xl border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors group">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-green-200 transition-colors">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Snapshot History
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Every report delivery is stored as a point-in-time snapshot.
                  Browse the last 10 deliveries, view historical data, and track
                  trends across reporting periods.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="flex gap-5 p-6 rounded-2xl border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors group">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-orange-200 transition-colors">
                <svg
                  className="w-6 h-6 text-orange-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  No-Code Setup
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Connect your Monday.com account, select boards, map columns,
                  and configure your schedule in a guided multi-step form.
                  No developer, no API keys, no spreadsheet hacks.
                </p>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="flex gap-5 p-6 rounded-2xl border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors group">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-red-200 transition-colors">
                <svg
                  className="w-6 h-6 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Multi-Recipient Email
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Send reports to your entire leadership team in one click.
                  Add unlimited recipients per report configuration — every
                  stakeholder stays informed without extra effort.
                </p>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="flex gap-5 p-6 rounded-2xl border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors group">
              <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-sky-200 transition-colors">
                <svg
                  className="w-6 h-6 text-sky-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10 9l3 3-3 3m4 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Pause & Resume Anytime
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Need to pause a report during a freeze period? Toggle any
                  schedule on or off from your dashboard without deleting the
                  configuration. Resume with a single click.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 bg-gray-50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
            Up and running in minutes
          </h2>
          <p className="text-lg text-gray-500 mb-16 max-w-xl mx-auto">
            Three steps from sign-up to automated executive reporting.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-2xl font-extrabold mb-5 shadow-lg shadow-indigo-200">
                1
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Connect Monday.com
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Authenticate with your Monday.com account. SyncBridge uses
                read-only access — your data is never modified.
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-2xl font-extrabold mb-5 shadow-lg shadow-indigo-200">
                2
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Configure Your Report
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Select up to 10 boards, map columns to metrics, choose
                aggregation rules, and set your delivery schedule and recipients.
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-2xl font-extrabold mb-5 shadow-lg shadow-indigo-200">
                3
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Reports Deliver Themselves
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                SyncBridge pulls fresh cross-board data on your schedule and
                emails polished reports to every stakeholder. Automatically.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-gray-500 mb-16 max-w-xl mx-auto">
            Start free. Upgrade when you're ready to scale.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free Tier */}
            <div className="rounded-2xl border border-gray-200 p-8 text-left hover:border-gray-300 transition-colors">
              <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Starter
              </p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-5xl font-extrabold text-gray-900">$0</span>
                <span className="text-gray-400 mb-2">/month</span>
              </div>
              <p className="text-sm text-gray-500 mb-8">
                Perfect for trying SyncBridge and small teams.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "2 report configurations",
                  "Up to 3 boards per report",
                  "Weekly schedule only",
                  "3 recipients per report",
                  "30-day delivery history",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-gray-600">
                    <svg
                      className="w-4 h-4 text-green-500 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/auth?mode=signup"
                className="block w-full text-center bg-gray-100 text-gray-800 font-semibold py-3 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Get started free
              </Link>
            </div>

            {/* Pro Tier */}
            <div className="rounded-2xl border-2 border-indigo-600 p-8 text-left relative shadow-xl shadow-indigo-100">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wide">
                Most Popular
              </div>
              <p className="text-sm font-semibold text-indigo-500 uppercase tracking-wide mb-2">
                Pro
              </p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-5xl font-extrabold text-gray-900">$49</span>
                <span className="text-gray-400 mb-2">/month</span>
              </div>
              <p className="text-sm text-gray-500 mb-8">
                For ops teams and growing organizations.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Unlimited report configurations",
                  "Up to 10 boards per report",
                  "Daily, weekly, monthly schedules",
                  "Unlimited recipients",
                  "1-year delivery history",
                  "Priority email support",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-gray-600">
                    <svg
                      className="w-4 h-4 text-indigo-500 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/auth?mode=signup"
                className="block w-full text-center bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200"
              >
                Start free trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 bg-indigo-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-extrabold text-white mb-5 leading-tight">
            Stop spending Fridays building reports manually.
          </h2>
          <p className="text-indigo-200 text-lg mb-10 leading-relaxed">
            SyncBridge automates the entire cross-board reporting workflow so
            your team can focus on decisions, not data wrangling.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth?mode=signup"
              className="bg-white text-indigo-700 font-bold text-base px-8 py-4 rounded-xl hover:bg-indigo-50 transition-colors shadow-lg"
            >
              Get started free — no credit card
            </Link>
            <Link
              href="/auth"
              className="border border-indigo-400 text-white font-semibold text-base px-8 py-4 rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Already have an account? Log in
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-500 rounded-md flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <span className="text-white font-bold text-sm">SyncBridge</span>
          </div>
          <p className="text-xs text-gray-500 text-center">
            © {new Date().getFullYear()} SyncBridge. Built for Monday.com power users.
            Not affiliated with monday.com Ltd.
          </p>
          <div className="flex items-center gap-5 text-xs">
            <Link href="/auth" className="hover:text-white transition-colors">
              Log in
            </Link>
            <Link href="/auth?mode=signup" className="hover:text-white transition-colors">
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}