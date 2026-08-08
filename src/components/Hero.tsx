export default function Hero({ onStart }: { onStart: () => void }) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-waves grain">
      <svg
        className="absolute -top-1/3 right-[-10%] w-[70vw] max-w-[900px] opacity-[0.14] text-vermilion"
        viewBox="0 0 200 200"
        aria-hidden
      >
        <circle cx="100" cy="100" r="70" fill="currentColor" />
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i / 24) * Math.PI * 2
          const x2 = 100 + Math.cos(angle) * 140
          const y2 = 100 + Math.sin(angle) * 140
          return <line key={i} x1="100" y1="100" x2={x2} y2={y2} stroke="currentColor" strokeWidth="1.5" />
        })}
      </svg>

      <div className="absolute left-6 top-24 bottom-24 hidden md:flex flex-col items-center gap-4 text-stone">
        <span className="writing-vertical font-display text-sm tracking-[0.3em]" style={{ writingMode: 'vertical-rl' }}>
          日本を、あなたの日数で。
        </span>
      </div>

      <div className="relative z-10 max-w-4xl px-6 text-center">
        <p className="font-display tracking-[0.4em] text-sm text-vermilion mb-6 uppercase">Nihon Planner</p>
        <h1 className="font-display text-6xl sm:text-7xl md:text-8xl leading-[0.95] mb-8">
          How far can
          <br />
          your days take you?
        </h1>
        <p className="text-lg sm:text-xl text-stone max-w-xl mx-auto mb-10">
          Tell us how long you have and what you love. We'll route a real itinerary —
          trains, flights, and honest costs — that actually fits.
        </p>
        <button
          onClick={onStart}
          className="group relative inline-flex items-center gap-3 border-2 border-sumi px-8 py-4 font-display text-lg overflow-hidden transition-colors hover:text-washi"
        >
          <span className="absolute inset-0 bg-sumi -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
          <span className="relative">Start Planning</span>
          <span className="relative">→</span>
        </button>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs tracking-[0.3em] text-stone uppercase animate-bounce">
        Scroll
      </div>
    </section>
  )
}
