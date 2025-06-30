"use client"

// NEW: Import the background component
import AnimatedBackground from "@/components/AnimatedBackground"

interface HeroSectionProps {
  hasEntered: boolean
  isTransitioning: boolean
  handleEnterExperience: () => void
}

export default function HeroSection({
  hasEntered,
  isTransitioning,
  handleEnterExperience,
}: HeroSectionProps) {
  return (
    <div
      className={`absolute inset-0 flex items-center justify-center transition-opacity duration-1000 ${
        hasEntered ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{
        background:
          "radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%)",
      }}
    >
      {/* NEW: Add the animated background here */}
      <AnimatedBackground />

      <div className="relative z-10 text-center space-y-12">
        {" "}
        {/* Add relative and z-10 to ensure content is on top */}
        {/* Main Hero Content */}
        <div className="space-y-6">
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-thin tracking-wider text-white/90 select-none">
            TONIC
          </h1>
          <div className="flex items-center justify-center space-x-4">
            <div className="h-px w-16 bg-white/30"></div>
            <p className="text-lg md:text-xl font-light text-white/70 tracking-[0.2em] uppercase">
              Your foundational piano.
            </p>
            <div className="h-px w-16 bg-white/30"></div>
          </div>
        </div>
        {/* Entry Button Section */}
        <div
          className={`space-y-12 mt-16 transition-all duration-1000 ease-out pointer-events-auto ${
            isTransitioning
              ? "opacity-0 scale-50 translate-y-12"
              : "opacity-100 scale-100 translate-y-0"
          }`}
        >
          <button
            onClick={handleEnterExperience}
            disabled={isTransitioning}
            className="group relative px-12 py-4"
          >
            <div className="absolute inset-0 rounded-full backdrop-blur-xl bg-white/15 border border-white/30 transition-all duration-500 group-hover:bg-white/25 group-hover:border-white/40 group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-white/20" />
            <div className="absolute inset-0 rounded-full bg-white/10 blur-xl transition-all duration-500 group-hover:bg-white/20 group-hover:blur-2xl" />
            <div className="absolute inset-0 rounded-full bg-white/5 blur-2xl transition-all duration-700 group-hover:bg-white/15" />
            <span className="relative text-lg font-light text-white tracking-wider transition-all duration-300 group-hover:text-white/90 group-hover:tracking-widest">
              Begin
            </span>
            <div className="absolute inset-0 rounded-full border border-white/20 animate-pulse opacity-60" />
            <div
              className="absolute inset-0 rounded-full border border-white/10 animate-ping opacity-40"
              style={{ animationDuration: "3s" }}
            />
            <div
              className="absolute inset-0 rounded-full border border-white/5 animate-ping opacity-20"
              style={{ animationDuration: "4s", animationDelay: "1s" }}
            />
          </button>
        </div>
      </div>
    </div>
  )
}