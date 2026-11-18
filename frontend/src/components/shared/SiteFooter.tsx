import { Link } from 'react-router-dom'
import { FileText, LockKeyhole, Mail, Quote } from 'lucide-react'

const footerLinks = [
  { label: 'Terms of Service', href: '/terms', icon: FileText },
  { label: 'Privacy Policy', href: '/privacy', icon: LockKeyhole },
  { label: 'Support', href: 'mailto:support@intellmeet.app', icon: Mail },
]

export default function SiteFooter() {
  return (
    <footer className="border-t border-border/70 bg-card/70 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 text-sm text-muted-foreground sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex flex-wrap items-center gap-2">
          {footerLinks.map(({ label, href, icon: Icon }) => {
            const isExternal = href.startsWith('mailto:')
            const sharedClassName = 'inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/70 px-3 py-1.5 transition-colors hover:border-primary/40 hover:text-primary'

            if (isExternal) {
              return (
                <a key={label} href={href} className={sharedClassName}>
                  <Icon size={14} />
                  <span>{label}</span>
                </a>
              )
            }

            return (
              <Link key={label} to={href} className={sharedClassName}>
                <Icon size={14} />
                <span>{label}</span>
              </Link>
            )
          })}
        </div>

        <div className="flex flex-col gap-2 lg:items-end">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
            <Quote size={12} />
            Quote
          </div>
          <p className="max-w-xl text-center text-xs leading-relaxed text-muted-foreground lg:text-right">
            “The best way to predict the future is to meet it.”
          </p>
        </div>
      </div>
    </footer>
  )
}
