import React from 'react';
import { motion, useTransform, useScroll } from 'motion/react';
import { ArrowRight, Star, Sparkles } from 'lucide-react';
import { getImage } from '../../assets/images';

/* ───────── image strip data ───────── */
const ROW_1 = [
  'hero_spice_1.png',
  'masala_bowls.jpg',
  'hero_spice_2.png',
  'tea-masala.jpg',
  'hero_spice_3.png',
  'spice.jpg',
  'hero_spice_4.png',
  'garam_masala.jpg',
];

const ROW_2 = [
  'hero_spice_5.png',
  'masala_spoon.jpg',
  'turmeric_flower.jpg',
  'hero_spice_1.png',
  'masala.jpg',
  'hero_spice_3.png',
  'chilli_upside.jpg',
  'hero_spice_2.png',
];

const ROW_3 = [
  'hero_spice_4.png',
  'biriyani.jpg',
  'hero_spice_5.png',
  'paneer_naan.jpg',
  'hero_spice_1.png',
  'dal-tadka.jpg',
  'hero_spice_3.png',
  'butter-chiken.jpg',
];

const ROW_4 = [
  'chole_rice.jpg',
  'hero_spice_2.png',
  'paneer_rice.jpg',
  'hero_spice_4.png',
  'fish-curry.jpg',
  'hero_spice_5.png',
  'pavbhaji.jpg',
  'hero_spice_1.png',
];

/* ── CSS keyframes injected once ── */
const styleId = 'hero-scroll-keyframes';
if (typeof document !== 'undefined' && !document.getElementById(styleId)) {
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    @keyframes hero-scroll-left {
      0%   { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    @keyframes hero-scroll-right {
      0%   { transform: translateX(-50%); }
      100% { transform: translateX(0); }
    }
  `;
  document.head.appendChild(style);
}

/* ───────── infinite scrolling strip (pure CSS) ───────── */
function ScrollStrip({
  images,
  direction = 'left',
  speed = 35,
}: {
  images: string[];
  direction?: 'left' | 'right';
  speed?: number;
}) {
  // Double the array so it loops seamlessly
  const duped = [...images, ...images];

  return (
    <div className="relative flex overflow-hidden">
      <div
        className="flex gap-4 shrink-0 will-change-transform"
        style={{
          animation: `hero-scroll-${direction} ${speed}s linear infinite`,
        }}
      >
        {duped.map((img, i) => (
          <div
            key={`${img}-${i}`}
            className="relative shrink-0 w-[280px] h-[200px] md:w-[340px] md:h-[240px] rounded-2xl overflow-hidden"
          >
            <img
              src={getImage(img)}
              alt=""
              loading="eager"
              decoding="async"
              className="w-full h-full object-cover"
            />
            {/* subtle vignette per card */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────── floating particle ───────── */
function FloatingParticle({
  delay,
  size,
  left,
  duration,
}: {
  delay: number;
  size: number;
  left: string;
  duration: number;
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
      animate={{
        y: [0, -1200],
        opacity: [0, 0.8, 0.6, 0],
        x: [0, Math.random() * 100 - 50],
        rotate: [0, 360],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeOut',
      }}
    />
  );
}

/* ───────── main hero ───────── */
export default function Hero() {
  const { scrollY } = useScroll();
  const parallaxY = useTransform(scrollY, [0, 600], [0, 150]);

  return (
    <section
      id="home"
      className="relative min-h-[100vh] flex items-center justify-center overflow-hidden bg-neutral"
    >
      {/* ── ANIMATED IMAGE GRID (background) ── */}
      <motion.div
        className="absolute inset-0 z-0 flex flex-col justify-center gap-4 py-8"
        style={{ y: parallaxY }}
      >
        {/* Diagonal tilt for that "crossword" feel */}
        <div className="space-y-4" style={{ transform: 'rotate(-6deg) scale(1.3)', transformOrigin: 'center center' }}>
          <ScrollStrip images={ROW_1} direction="left" speed={40} />
          <ScrollStrip images={ROW_2} direction="right" speed={35} />
          <ScrollStrip images={ROW_3} direction="left" speed={45} />
          <ScrollStrip images={ROW_4} direction="right" speed={38} />
        </div>
      </motion.div>

      {/* ── CINEMATIC OVERLAYS ── */}
      {/* Dark gradient overlay */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-[rgba(45,25,15,0.85)] via-[rgba(45,25,15,0.7)] to-[rgba(45,25,15,0.92)]" />

      {/* Radial spotlight */}
      <div className="absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,_rgba(233,162,28,0.12)_0%,_transparent_70%)]" />

      {/* Film grain texture */}
      <div
        className="absolute inset-0 z-[1] opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: '128px 128px',
        }}
      />

      {/* ── FLOATING SPICE PARTICLES ── */}
      <div className="absolute inset-0 z-[2] pointer-events-none overflow-hidden">
        {Array.from({ length: 18 }).map((_, i) => (
          <FloatingParticle
            key={i}
            delay={i * 0.8}
            size={Math.random() * 8 + 3}
            left={`${Math.random() * 100}%`}
            duration={Math.random() * 8 + 8}
          />
        ))}
      </div>

      {/* ── TOP EDGE GLOW ── */}
      <div className="absolute top-0 left-0 right-0 h-32 z-[2] bg-gradient-to-b from-[rgba(45,25,15,1)] to-transparent" />

      {/* ── BOTTOM EDGE GLOW ── */}
      <div className="absolute bottom-0 left-0 right-0 h-40 z-[2] bg-gradient-to-t from-[rgba(45,25,15,1)] to-transparent" />

      {/* ── CONTENT ── */}
      <div className="relative z-10 container mx-auto px-6 md:px-12 flex flex-col items-center text-center pt-28 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-5xl flex flex-col items-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="relative inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/[0.08] border border-white/[0.12] text-secondary font-semibold text-sm mb-10 backdrop-blur-xl overflow-hidden"
          >
            {/* Shimmer sweep */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.15] to-transparent -skew-x-12"
              animate={{ x: ['-200%', '200%'] }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatDelay: 4,
                ease: 'easeInOut',
              }}
            />
            <Sparkles size={16} className="text-secondary" />
            <span className="relative z-10">Since 2015 — Trusted by 10,000+ Families</span>
            <Star size={14} fill="currentColor" className="text-secondary" />
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl md:text-7xl lg:text-[5.5rem] font-black text-white leading-[1.05] tracking-tight mb-7"
          >
            The Soul of{' '}
            <br className="hidden md:block" />
            <span className="relative inline-block">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto]">
                <motion.span
                  className="inline-block"
                  style={{
                    backgroundSize: '200% auto',
                    backgroundImage: 'linear-gradient(90deg, #b22222, #e9a21c, #b22222)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                  animate={{
                    backgroundPosition: ['0% center', '200% center'],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                >
                  Indian Kitchen
                </motion.span>
              </span>
              {/* Underline accent */}
              <motion.svg
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 300 12"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ delay: 1, duration: 1.2, ease: 'easeOut' }}
              >
                <motion.path
                  d="M2 8 C50 2, 100 12, 150 6 C200 0, 250 10, 298 4"
                  stroke="url(#underline-grad)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 1, duration: 1.2, ease: 'easeOut' }}
                />
                <defs>
                  <linearGradient id="underline-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#b22222" />
                    <stop offset="50%" stopColor="#e9a21c" />
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
            Discover the secret to perfect home-cooked meals with{' '}
            <span className="text-secondary font-semibold">HMP Masala's</span>{' '}
            premium range of hand-pounded, authentic Indian spices.
            <br className="hidden sm:block" />
            No preservatives, just pure flavor.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
          >
            <a href="#products">
              <button className="group relative w-full sm:w-auto px-9 py-4 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white rounded-full font-bold text-lg transition-all shadow-2xl shadow-primary/40 flex items-center justify-center gap-2.5 overflow-hidden">
                {/* Button glow pulse */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-full"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                />
                <span className="relative z-10">Shop Our Collection</span>
                <ArrowRight
                  size={20}
                  className="relative z-10 group-hover:translate-x-1 transition-transform"
                />
              </button>
            </a>
            <a href="#about">
              <button className="w-full sm:w-auto px-9 py-4 bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/[0.15] hover:border-white/[0.25] rounded-full font-bold text-lg transition-all backdrop-blur-xl flex items-center justify-center gap-2.5">
                Our Story
              </button>
            </a>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 1 }}
            className="mt-14 flex items-center gap-6 text-white/40 text-sm font-medium"
          >
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span>100% Organic</span>
            </div>
            <div className="w-px h-4 bg-white/20" />
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              <span>No Preservatives</span>
            </div>
            <div className="w-px h-4 bg-white/20" />
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>Farm Fresh</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
