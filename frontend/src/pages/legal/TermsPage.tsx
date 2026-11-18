import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-3xl border border-border bg-card/80 p-6 shadow-sm sm:p-8"
        >
          <div className="mb-6 flex items-center justify-between gap-4">
            <Link to="/register" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline underline-offset-4">
              <ArrowLeft size={16} />
              Back to sign up
            </Link>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
              <ShieldCheck size={12} />
              Terms
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
              <p className="text-sm text-muted-foreground">
                These Terms govern your use of IntellMeet and set out the expectations for account access, collaboration, and meeting workflows.
              </p>
            </div>

            <div className="space-y-4">
              <section className="rounded-2xl border border-border/80 bg-background/60 p-4">
                <h2 className="text-base font-semibold">1. Account responsibility</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  You are responsible for keeping your sign-in credentials confidential and for all activity associated with your account.
                </p>
              </section>

              <section className="rounded-2xl border border-border/80 bg-background/60 p-4">
                <h2 className="text-base font-semibold">2. Acceptable use</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  The platform must be used for legitimate collaboration and meeting workflows. You may not misuse, disrupt, or compromise the service or another user’s experience.
                </p>
              </section>

              <section className="rounded-2xl border border-border/80 bg-background/60 p-4">
                <h2 className="text-base font-semibold">3. Data and content</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Content you create, share, or upload remains your responsibility. You warrant that you have the right to use and share that information within the platform.
                </p>
              </section>

              <section className="rounded-2xl border border-border/80 bg-background/60 p-4">
                <h2 className="text-base font-semibold">4. Service availability</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  IntellMeet aims to provide reliable access, but availability may vary due to maintenance, outages, or external dependency downtime.
                </p>
              </section>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
