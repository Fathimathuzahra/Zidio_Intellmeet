import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowLeft, LockKeyhole } from 'lucide-react'

export default function PrivacyPage() {
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
              <LockKeyhole size={12} />
              Privacy
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
              <p className="text-sm text-muted-foreground">
                IntellMeet uses data strictly to provide meeting, collaboration, and account management features.
              </p>
            </div>

            <div className="space-y-4">
              <section className="rounded-2xl border border-border/80 bg-background/60 p-4">
                <h2 className="text-base font-semibold">1. Information we collect</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  We collect profile, authentication, and usage data necessary to create, secure, and support your workspace experience.
                </p>
              </section>

              <section className="rounded-2xl border border-border/80 bg-background/60 p-4">
                <h2 className="text-base font-semibold">2. How we use information</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Data is used to authenticate users, manage roles, preserve meeting content, and improve the quality of collaboration features.
                </p>
              </section>

              <section className="rounded-2xl border border-border/80 bg-background/60 p-4">
                <h2 className="text-base font-semibold">3. Security</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Access to your workspace is protected with secure authentication practices, and we apply reasonable controls to safeguard account and meeting data.
                </p>
              </section>

              <section className="rounded-2xl border border-border/80 bg-background/60 p-4">
                <h2 className="text-base font-semibold">4. Changes to this policy</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  We may update this policy from time to time to reflect product changes, legal requirements, or operational improvements.
                </p>
              </section>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
