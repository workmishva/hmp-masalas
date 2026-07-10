'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion, useTransform, useScroll } from 'framer-motion'
import { ArrowRight, Star, Sparkles, MessageCircle } from 'lucide-react'

/* ─── Product image paths (public/images/product) ─── */
const ALL = [
  '/images/product/chilli-brand.jpg',
  '/images/product/kashmiri-brand.jpg',
  '/images/product/turmeric-brand.jpg',
  '/images/product/bateta-bhungala.png',
  '/images/product/undhiyu-packet.png',
  '/images/product/biriyani-pauch.png',
  '/images/product/chhole-pauch.png',
  '/images/product/hing-pauch.png',
  '/images/product/kitchenking-pauch.png',
  '/images/product/dabeli-pauch.png',
  '/images/product/manchuriyan-pauch.png',
  '/images/product/panipuri-pauch.png',
  '/images/product/panjabi-grevy-pauch.png',
  '/images/product/pasta-pauch.png',
  '/images/product/jaljira-pauch.png',
  '/images/product/pavbhaji-pauch.png',
  '/images/product/pizza-pauch.png',
  '/images/product/chhash-bottle-bg.png',
]

const ROW_1 = [ALL[0],  ALL[1],  ALL[2],  ALL[3],  ALL[4],  ALL[5],  ALL[6],  ALL[7]]
const ROW_2 = [ALL[8],  ALL[9],  ALL[10], ALL[11], ALL[12], ALL[13], ALL[14], ALL[15]]
const ROW_3 = [ALL[16], ALL[17], ALL[0],  ALL[2],  ALL[4],  ALL[6],  ALL[8],  ALL[10]]
const ROW_4 = [ALL[1],  ALL[3],  ALL[5],  ALL[7],  ALL[9],  ALL[11], ALL[13], ALL[15]]

/* ─── Static particles (no Math.random — avoids hydration mismatch) ─── */
const PARTICLES = [
  { delay: 0,   size: 8,  left: '8%',  duration: 12, xDrift:  40 },
  { delay: 1.5, size: 5,  left: '18%', duration: 9,  xDrift: -30 },
  { delay: 3,   size: 9,  left: '30%', duration: 14, xDrift:  25 },
  { delay: 0.8, size: 4,  left: '45%', duration: 10, xDrift: -45 },
  { delay: 2.2, size: 11, left: '55%', duration: 13, xDrift:  35 },
  { delay: 1,   size: 6,  left: '68%', duration: 11, xDrift: -20 },
  { delay: 3.5, size: 9,  left: '78%', duration: 15, xDrift:  50 },
  { delay: 0.4, size: 4,  left: '88%', duration: 8,  xDrift: -35 },
  { delay: 4,   size: 7,  left: '22%', duration: 12, xDrift:  15 },
  { delay: 2.8, size: 5,  left: '60%', duration: 10, xDrift: -40 },
  { delay: 1.8, size: 8,  left: '92%', duration: 13, xDrift:  30 },
  { delay: 3.2, size: 4,  left: '3%',  duration: 9,  xDrift: -25 },
  { delay: 0.6, size: 6,  left: '35%', duration: 11, xDrift:  45 },
  { delay: 2,   size: 8,  left: '50%', duration: 14, xDrift: -50 },
  { delay: 4.5, size: 5,  left: '75%', duration: 10, xDrift:  20 },
  { delay: 1.2, size: 9,  left: '25%', duration: 13, xDrift: -15 },
  { delay: 3.8, size: 4,  left: '42%', duration: 9,  xDrift:  40 },
  { delay: 0.2, size: 7,  left: '95%', duration: 12, xDrift: -30 },
]

/* ─── Infinite-scroll image strip (pure CSS animation — zero JS overhead) ─── */
function ScrollStrip({
  images,
  direction = 'left',
  speed = 35,
  prioritizeFirst = false,
}: {
  images: string[]
  direction?: 'left' | 'right'
  speed?: number
  prioritizeFirst?: boolean
}) {
  // Duplicate so the loop joins seamlessly at the -50% boundary
  const duped = [...images, ...images]
  return (
    <div className="relative flex overflow-hidden">
      <div
        className="flex gap-4 shrink-0 will-change-transform"
        style={{ animation: `hero-scroll-${direction} ${speed}s linear infinite` }}
      >
        {duped.map((src, i) => (
          <div
            key={`${src}-${i}`}
            className="relative shrink-0 w-70 h-50 md:w-85 md:h-60 rounded-2xl overflow-hidden"
          >
            <Image
              src={src}
              alt=""
              fill
              sizes="(max-width: 768px) 280px, 340px"
              className="object-cover"
              priority={prioritizeFirst && i < 3}
              loading="eager"
            />
            {/* Per-card bottom vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Floating spice particle ─── */
function FloatingParticle({
  delay, size, left, duration, xDrift,
}: {
  delay: number; size: number; left: string; duration: number; xDrift: number
}) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        left,
        bottom: '-10%',
        background:
          size > 6
            ? 'radial-gradient(circle, rgba(233,162,28,0.6) 0%, rgba(178,34,34,0.3) 100%)'
            : 'rgba(233,162,28,0.4)',
        filter: 'blur(1px)',
      }}
      animate={{ y: [0, -1200], opacity: [0, 0.8, 0.6, 0], x: [0, xDrift], rotate: [0, 360] }}
      transition={{ duration, delay, repeat: Infinity, ease: 'easeOut' }}
    />
  )
}

/* ─── Main hero content ─── */
export function HeroContent({ whatsappUrl }: { whatsappUrl: string }) {
  const { scrollY } = useScroll()
  const parallaxY = useTransform(scrollY, [0, 600], [0, 150])

  return (
    <>
      {/* ── ANIMATED IMAGE GRID ── */}
      <motion.div
        className="absolute inset-0 z-0 flex flex-col justify-center gap-4 py-8"
        style={{ y: parallaxY, backgroundColor: '#3a211a' }}
        aria-hidden="true"
      >
        <div
          className="space-y-4"
          style={{ transform: 'rotate(-6deg) scale(1.3)', transformOrigin: 'center center' }}
        >
          <ScrollStrip images={ROW_1} direction="left"  speed={40} prioritizeFirst />
          <ScrollStrip images={ROW_2} direction="right" speed={35} prioritizeFirst />
          <ScrollStrip images={ROW_3} direction="left"  speed={45} />
          <ScrollStrip images={ROW_4} direction="right" speed={38} />
        </div>
      </motion.div>

      {/* ── OVERLAYS ── */}
      {/* Soft dark gradient — light enough to keep images visible */}
      <div className="absolute inset-0 z-1 bg-gradient-to-b from-[rgba(58,33,26,0.55)] via-[rgba(58,33,26,0.38)] to-[rgba(58,33,26,0.60)]" />
      {/* Warm radial spotlight */}
      <div className="absolute inset-0 z-1 bg-[radial-gradient(ellipse_at_center,rgba(233,162,28,0.10)_0%,transparent_65%)]" />
      {/* Film grain */}
      <div
        className="absolute inset-0 z-1 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: '128px 128px',
        }}
      />

      {/* ── FLOATING PARTICLES ── */}
      <div className="absolute inset-0 z-2 pointer-events-none overflow-hidden">
        {PARTICLES.map((p, i) => <FloatingParticle key={i} {...p} />)}
      </div>

      {/* ── EDGE FADES (blend strips into section bg) ── */}
      <div className="absolute top-0 left-0 right-0 h-32 z-2 bg-gradient-to-b from-[rgba(58,33,26,1)] to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-40 z-2 bg-gradient-to-t from-[rgba(58,33,26,1)] to-transparent" />

      {/* ── CONTENT ── */}
      <div className="relative z-10 container mx-auto px-6 md:px-12 flex flex-col items-center text-center pt-28 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] }}
          className="max-w-5xl flex flex-col items-center"
        >

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="relative inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/8 border border-white/12 text-yellow-200 font-semibold text-sm mb-10 backdrop-blur-xl overflow-hidden"
          >
            {/* Shimmer sweep */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -skew-x-12"
              animate={{ x: ['-200%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
            />
            <Sparkles size={16} className="text-yellow-200 relative z-10" />
            <span className="relative z-10">Since 2015 — Trusted by 10,000+ Families</span>
            <Star size={14} fill="currentColor" className="text-yellow-200 relative z-10" />
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.9, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] }}
            className="font-brand text-5xl md:text-7xl lg:text-[5.5rem] font-black text-white leading-[1.05] tracking-tight mb-7"
          >
            Pure Spices.
            <br />
            <span className="relative inline-block">
              {/* Animated saffron gradient text */}
              <motion.span
                style={{
                  backgroundSize:        '200% auto',
                  backgroundImage:       'linear-gradient(90deg, #b22222, #e9a21c, #f0b840, #e9a21c, #b22222)',
                  WebkitBackgroundClip:  'text',
                  WebkitTextFillColor:   'transparent',
                  backgroundClip:        'text',
                  color:                 'transparent',
                  display:               'inline-block',
                }}
                animate={{ backgroundPosition: ['0% center', '200% center'] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              >
                Family Recipe.
              </motion.span>

              {/* Wavy gradient underline */}
              <motion.svg
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 320 12"
                fill="none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.3, ease: 'easeOut' }}
              >
                <motion.path
                  d="M2 8 C60 2, 120 12, 160 6 C200 0, 260 10, 318 4"
                  stroke="url(#hero-underline-grad)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.8, duration: 1.2, ease: 'easeOut' }}
                />
                <defs>
                  <linearGradient id="hero-underline-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%"   stopColor="#b22222" />
                    <stop offset="50%"  stopColor="#e9a21c" />
                    <stop offset="100%" stopColor="#b22222" />
                  </linearGradient>
                </defs>
              </motion.svg>
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-lg md:text-xl text-white/70 max-w-2xl mb-12 font-medium leading-relaxed"
          >
            Handcrafted masalas made with love by the HMP family.{' '}
            <span className="text-yellow-200 font-semibold">Fresh ground, no preservatives,</span>{' '}
            shipped straight from our kitchen to yours.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
          >
            <Link
              href="/products"
              className="group relative w-full sm:w-auto px-9 py-4 bg-gradient-to-r from-chili-600 to-chili-500 hover:from-chili-700 hover:to-chili-600 text-white rounded-full font-bold text-lg transition-all shadow-2xl shadow-chili-600/30 flex items-center justify-center gap-2.5 overflow-hidden"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-full"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              />
              <span className="relative z-10">Shop Our Collection</span>
              <ArrowRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-9 py-4 bg-white/6 hover:bg-white/12 text-white border border-white/15 hover:border-white/25 rounded-full font-bold text-lg transition-all backdrop-blur-xl flex items-center justify-center gap-2.5"
            >
              <MessageCircle size={20} />
              WhatsApp Us
            </a>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 1 }}
            className="mt-14 flex items-center gap-6 text-white/40 text-sm font-medium flex-wrap justify-center"
          >
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-cardamom-600 animate-pulse" />
              <span>100% Natural</span>
            </div>
            <div className="w-px h-4 bg-white/20" />
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              <span>No Preservatives</span>
            </div>
            <div className="w-px h-4 bg-white/20" />
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-chili-500 animate-pulse" />
              <span>Family Recipe</span>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </>
  )
}
