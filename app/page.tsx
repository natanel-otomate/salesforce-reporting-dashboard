import Link from "next/link";

const features = [
  {
    title: "Cross-Workspace Aggregation",
    description:
      "Connect multiple Monday.com workspaces and pull live board data into a single unified view — no manual exports required.",
    icon: (
      <svg
        className="w-7 h-7 text-indigo-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v2.25A2.25 2.25 0 006 10.5zm0 9.75h2.25A2.25 2.25 0 0010.5 18v-2.25a2.25 2.25 0 00-2.25-2.25H6a2.25 2.25 0 00-2.25 2.25V18A2.25 2.25 0 006 20.25zm9.75-9.75H18a2.25 2.25 0 002.25-2.25V6A2.25 2.25 0 0018 3.75h-2.25A2.25 2.25 0 0013.5 6v2.25a2.25 2.25 0 002.25 2.25z"
        />
      </svg>
    ),
  },
  {
    title: "Automated Report Scheduling",
    description:
      "Set daily, weekly, or monthly delivery cadences. WorkPulse runs in the background and sends polished reports exactly when your stakeholders need them.",
    icon: (
      <svg
        className="w-7 h-7 text-indigo-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    title: "Executive-Ready Formatting",
    description:
      "Reports are structured, clean, and readable by anyone — including stakeholders who don't have a Monday.com license or ever log in.",
    icon: (
      <svg
        className="w-7 h-7 text-indigo-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
        />
      </svg>
    ),
  },
  {
    title: "Email Delivery to Anyone",
    description:
      "Deliver reports to any email address on a configurable recipient list. No Monday.com seat required for your clients, executives, or board members.",
    icon: (
      <svg
        className="w-7 h-7 text-indigo-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
        />
      </svg>
    ),
  },
  {
    title: "Live Board Snapshots",
    description:
      "Every report captures a point-in-time snapshot of board status, item counts, deadlines, and assignees — so there's always a historical record.",
    icon: (
      <svg
        className="w-7 h-7 text-indigo-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
        />
      </svg>
    ),
  },
  {
    title: "Multi-Workspace Management",
    description:
      "Manage API connections to multiple Monday.com workspaces from one dashboard. Add, remove, or reconfigure connections without touching any code.",
    icon: (
      <svg
        className="w-7 h-7 text-indigo-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
        />
      </svg>
    ),
  },
];

const steps = [
  {
    number: "01",
    title: "Connect Your Workspaces",
    description:
      "Paste your Monday.com API token and WorkPulse will discover all boards across your workspaces automatically.",
  },
  {
    number: "02",
    title: "Configure Your Report",
    description:
      "Select the boards you want included, choose a schedule cadence, and add any recipient email addresses.",
  },
  {
    number: "03",
    title: "Reports Delivered Automatically",
    description:
      "WorkPulse handles everything from there — pulling live data, formatting the report, and sending it on schedule.",
  },
];

const testimonials: {
  quote: string;
  name: string;
  role: string;
  initials: string;
  color: string;
}[] = [
  {
    quote:
      "Our board has no idea what Monday.com even is. WorkPulse sends them a clean status report every Monday morning and they love it.",
    name: "Sarah Chen",
    role: "Director of Operations, Aldgate Partners",
    initials: "SC",
    color: "bg-indigo-500",
  },
  {
    quote:
      "We run 4 client workspaces from one account. Before WorkPulse, reporting took 3 hours every Friday. Now it's zero.",
    name: "Marcus Webb",
    role: "PMO Lead, Clearfield Consulting",
    initials: "MW",
    color: "bg-violet-500",
  },
  {
    quote:
      "The snapshot history alone is worth it. Clients used to dispute project timelines — now we just share the archived report.",
    name: "Priya Nair",
    role: "Head of Delivery, Nexus Studio",
    initials: "PN",
    color: "bg-sky-500",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased">
      {/* ── Navigation ── */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-sm">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
              <svg
                className="h-4 w-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                />
              </svg>
            </span>
            <span className="text-lg font-bold tracking-tight text-gray-900">
              WorkPulse
            </span>
          </div>

          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              How it works
            </a>
            <a
              href="#testimonials"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              Testimonials
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Get started free
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* ── Hero ── */}
        <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50 via-white to-white px-6 pb-24 pt-20">
          {/* Background decoration */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
          >
            <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-indigo-300 to-violet-300 opacity-25 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
          </div>

          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              <span className="text-xs font-semibold uppercase tracking-widest text-indigo-700">
                Monday.com Reporting — Automated
              </span>
            </div>

            <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
              Cross-Workspace Reports,{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                Delivered Automatically
              </span>
            </h1>

            <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-gray-600 sm:text-xl">
              WorkPulse aggregates live data from multiple Monday.com workspaces,
              generates formatted executive reports on a configurable schedule,
              and delivers them by email to anyone — no Monday.com license
              required.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/sign-up"
                className="w-full rounded-xl bg-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
              >
                Start for free — no credit card
              </Link>
              <Link
                href="/sign-in"
                className="w-full rounded-xl border border-gray-200 bg-white px-8 py-4 text-base font-semibold text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 sm:w-auto"
              >
                Sign in to your account
              </Link>
            </div>

            <p className="mt-5 text-sm text-gray-400">
              14-day free trial · No credit card required · Cancel anytime
            </p>
          </div>

          {/* Hero illustration / mock UI */}
          <div className="mx-auto mt-20 max-w-5xl">
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-gray-200">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-red-400" />
                <span className="h-3 w-3 rounded-full bg-yellow-400" />
                <span className="h-3 w-3 rounded-full bg-green-400" />
                <div className="mx-auto flex w-64 items-center justify-center rounded-md border border-gray-200 bg-white px-3 py-1">
                  <span className="text-xs text-gray-400">
                    app.workpulse.io/dashboard
                  </span>
                </div>
              </div>

              {/* Mock dashboard */}
              <div className="grid grid-cols-4 divide-x divide-gray-100">
                {/* Sidebar */}
                <div className="hidden bg-gray-50 p-4 sm:block">
                  <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">
                    Workspaces
                  </div>
                  {["Engineering", "Marketing", "Client A", "Client B"].map(
                    (ws) => (
                      <div
                        key={ws}
                        className="mb-1 rounded-lg px-3 py-2 text-sm text-gray-600 first:bg-indigo-50 first:font-semibold first:text-indigo-700"
                      >
                        {ws}
                      </div>
                    )
                  )}
                  <div className="mt-6 text-xs font-semibold uppercase tracking-widest text-gray-400">
                    Reports
                  </div>
                  {["Weekly Status", "Sprint Review", "Exec Summary"].map(
                    (r) => (
                      <div
                        key={r}
                        className="mb-1 rounded-lg px-3 py-2 text-sm text-gray-600"
                      >
                        {r}
                      </div>
                    )
                  )}
                </div>

                {/* Main content */}
                <div className="col-span-4 p-6 sm:col-span-3">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <div className="text-lg font-bold text-gray-900">
                        Weekly Status Report
                      </div>
                      <div className="text-sm text-gray-400">
                        Next delivery: Monday 9:00 AM · 5 recipients
                      </div>
                    </div>
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                      Active
                    </span>
                  </div>

                  {/* Stat cards */}
                  <div className="mb-6 grid grid-cols-3 gap-4">
                    {[
                      {
                        label: "Boards Monitored",
                        value: "12",
                        delta: "+2 this week",
                      },
                      {
                        label: "Items Tracked",
                        value: "384",
                        delta: "across 3 workspaces",
                      },
                      {
                        label: "Reports Sent",
                        value: "47",
                        delta: "last 30 days",
                      },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="rounded-xl border border-gray-100 bg-gray-50 p-4"
                      >
                        <div className="text-2xl font-extrabold text-gray-900">
                          {stat.value}
                        </div>
                        <div className="text-xs font-medium text-gray-500">
                          {stat.label}
                        </div>
                        <div className="mt-1 text-xs text-indigo-500">
                          {stat.delta}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Board list mock */}
                  <div className="rounded-xl border border-gray-100">
                    <div className="border-b border-gray-100 px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
                      Included Boards
                    </div>
                    {[
                      {
                        name: "Q3 Roadmap",
                        workspace: "Engineering",
                        items: 48,
                        status: "On track",
                        color: "text-green-600",
                      },
                      {
                        name: "Campaign Launch",
                        workspace: "Marketing",
                        items: 31,
                        status: "At risk",
                        color: "text-amber-600",
                      },
                      {
                        name: "Client Deliverables",
                        workspace: "Client A",
                        items: 19,
                        status: "On track",
                        color: "text-green-600",
                      },
                    ].map((board) => (
                      <div
                        key={board.name}
                        className="flex items-center justify-between border-b border-gray-50 px-4 py-3 last:border-0"
                      >
                        <div>
                          <div className="text-sm font-semibold text-gray-800">
                            {board.name}
                          </div>
                          <div className="text-xs text-gray-400">
                            {board.workspace} · {board.items} items
                          </div>
                        </div>
                        <span
                          className={`text-xs font-semibold ${board.color}`}
                        >
                          {board.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" className="bg-white px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 text-center">
              <div className="mb-3 text-sm font-semibold uppercase tracking-widest text-indigo-600">
                Everything you need
              </div>
              <h2 className="mb-4 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
                Built for reporting at scale
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-gray-500">
                WorkPulse handles the entire reporting pipeline — from data
                collection to formatted delivery — so your team can focus on
                the work itself.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group rounded-2xl border border-gray-100 bg-gray-50 p-6 transition-all hover:border-indigo-100 hover:bg-indigo-50/30 hover:shadow-md"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-gray-100 transition-all group-hover:ring-indigo-200">
                    {feature.icon}
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-500">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section
          id="how-it-works"
          className="bg-gradient-to-b from-indigo-50 to-white px-6 py-24"
        >
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 text-center">
              <div className="mb-3 text-sm font-semibold uppercase tracking-widest text-indigo-600">
                Simple setup
              </div>
              <h2 className="mb-4 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
                Up and running in minutes
              </h2>
              <p className="mx-auto max-w-xl text-lg text-gray-500">
                No engineering work. No integrations to maintain. Just three
                steps between you and automated reporting.
              </p>
            </div>

            <div className="relative">
              {/* Connecting line — desktop only */}
              <div
                aria-hidden="true"
                className="absolute left-0 right-0 top-16 hidden h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent lg:block"
              />

              <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
                {steps.map((step) => (
                  <div key={step.number} className="relative text-center">
                    <div className="relative mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-xl font-extrabold text-white shadow-lg shadow-indigo-200">
                      {step.number}
                    </div>
                    <h3 className="mb-3 text-xl font-bold text-gray-900">
                      {step.title}
                    </h3>
                    <p className="mx-auto max-w-xs text-sm leading-relaxed text-gray-500">
                      {step.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Testimonials ── */}
        <section id="testimonials" className="bg-white px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 text-center">
              <div className="mb-3 text-sm font-semibold uppercase tracking-widest text-indigo-600">
                Trusted by teams
              </div>
              <h2 className="mb-4 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
                What our users say
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {testimonials.map((t) => (
                <div
                  key={t.name}
                  className="flex flex-col rounded-2xl border border-gray-100 bg-gray-50 p-6"
                >
                  {/* Stars */}
                  <div className="mb-4 flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className="h-4 w-4 text-amber-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>

                  <blockquote className="mb-6 flex-1 text-sm leading-relaxed text-gray-600">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>

                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white ${t.color}`}
                    >
                      {t.initials}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {t.name}
                      </div>
                      <div className="text-xs text-gray-400">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Banner ── */}
        <section