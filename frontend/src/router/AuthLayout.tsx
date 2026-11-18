import { Outlet } from 'react-router-dom'
import { motion, type Variants } from 'framer-motion'
import { ThemeToggle } from '../components/ThemeToggle'

import { Video, Zap, Users, Brain } from 'lucide-react'

const features = [
  { icon: Brain,  title: 'AI Summaries',        desc: 'Instant meeting summaries after every session.' },
  { icon: Zap,    title: 'Action Item Extraction', desc: 'Tasks assigned and tracked automatically.' },
  { icon: Users,  title: 'Team Collaboration',   desc: 'Manage projects and tasks with your team.' },
]

const slide = (dir: 1 | -1): Variants => ({
  hidden: { opacity: 0, x: dir * 60 },
  visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 70, damping: 18, duration: 0.8 } },
})

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.25 } },
}

const item: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 14 } },
}

export default function AuthLayout() {
  return (
    <motion.div initial="hidden" animate="visible" className="min-h-screen bg-background flex">

      {/* ── Left Panel ── */}
      <motion.div
        variants={slide(-1)}
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(9,18,59,0.88), rgba(38,81,190,0.72)), url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        className="hidden lg:flex flex-col justify-between w-[52%] relative overflow-hidden px-16 py-14"
      >
        {/* Background circles */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-white/[0.02] pointer-events-none" />

        {/* Logo + theme */}
        <motion.div variants={item} className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
              <Video size={17} className="text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">IntellMeet</span>
          </div>
          <ThemeToggle />
        </motion.div>

        {/* Marketing */}
        <motion.div variants={stagger} className="relative z-10 space-y-10">
          <motion.div variants={item} className="space-y-5">
            <span className="inline-flex items-center gap-2 bg-white/15 text-white/90 text-sm font-medium px-3.5 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse" />
              AI-Powered Meetings
            </span>
            <h1 className="text-white text-4xl font-bold leading-tight tracking-tight">
              Meetings that<br />
              <span className="text-white/65">actually follow through.</span>
            </h1>
            <p className="text-white/55 text-base leading-relaxed max-w-xs">
              IntellMeet turns every meeting into action — with AI summaries, smart tasks, and real-time collaboration.
            </p>
          </motion.div>

          <motion.div variants={stagger} className="space-y-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <motion.div
                key={title}
                variants={item}
                whileHover={{ x: 8, transition: { type: 'spring', stiffness: 300 } }}
                className="flex items-start gap-4 cursor-default"
              >
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon size={17} className="text-white/80" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{title}</p>
                  <p className="text-white/50 text-sm mt-0.5">{desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Testimonial */}
        <motion.div variants={item} className="relative z-10 space-y-2">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill="rgba(255,255,255,0.65)">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ))}
          </div>
          <p className="text-white/55 text-sm italic leading-relaxed max-w-xs">
            "IntellMeet cut our post-meeting work from 2 hours to 5 minutes."
          </p>
          <p className="text-white/45 text-xs font-medium">— Sophie M., Product Director</p>
        </motion.div>
      </motion.div>

      {/* ── Right Panel ── */}
      <motion.div
        variants={slide(1)}
        className="flex-1 flex flex-col items-center justify-center p-8 lg:p-16 relative bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_transparent_44%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.0))]"
      >
        {/* Mobile logo */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex lg:hidden items-center gap-2 mb-10"
        >
          <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center glow-sm">
            <Video size={15} className="text-white" />
          </div>
          <span className="font-bold text-foreground">IntellMeet</span>
        </motion.div>

        {/* Theme toggle on mobile */}
        <div className="lg:hidden absolute top-4 right-4">
          <ThemeToggle />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="w-full max-w-[380px]"
        >
          <Outlet />
        </motion.div>

        <div className="mt-8 w-full max-w-[380px]">

        </div>
      </motion.div>
    </motion.div>
  )
}
