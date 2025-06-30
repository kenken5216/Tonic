"use client"

import { X } from "lucide-react"

interface NavigationProps {
  isMenuOpen: boolean
  setIsMenuOpen: (open: boolean) => void
}

export default function Navigation({
  isMenuOpen,
  setIsMenuOpen,
}: NavigationProps) {
  return (
    <>
      {/* Menu Overlay */}
      <div
        className={`fixed inset-0 z-40 backdrop-blur-xl bg-black/50 transition-all duration-500 ${
          isMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={() => setIsMenuOpen(false)} // Click background to close
      >
        <div
          className="flex items-center justify-center h-full"
          // Prevent click inside from closing the menu
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative text-center space-y-6 max-w-md px-8">
            {/* Explicit Close Button */}
            <button
              onClick={() => setIsMenuOpen(false)}
              className="absolute -top-16 right-0 z-50 p-3 rounded-full backdrop-blur-md bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-300"
            >
              <X size={20} />
            </button>

            <div
              className={`transform transition-all duration-700 ${
                isMenuOpen
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              }`}
              style={{ transitionDelay: "0ms" }}
            >
              <h2 className="text-3xl md:text-4xl font-thin text-white/90 tracking-wider mb-4">
                TONIC
              </h2>
              <div className="h-px w-24 bg-white/30 mx-auto mb-6"></div>
            </div>

            <div
              className={`transform transition-all duration-700 text-justify ${
                isMenuOpen
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              }`}
              style={{ transitionDelay: "200ms" }}
            >
              <p className="text-base md:text-sm font-light text-white/70 leading-relaxed">
                As a beginner learning to compose, I constantly found myself pausing my workflow to look up the major and minor scale formulas for different notes. I needed a tool that was fast, visual, and always available.
                <br />
                I built TONIC to be that tool:  where I could instantly visualize scale structures and keep my creative momentum going. It's my handy reference.
              </p>
            </div>

            <div
              className={`transform transition-all duration-700   ${
                isMenuOpen
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              }`}
              style={{ transitionDelay: "400ms" }}
            >
              <p className="text-sm md:text-sm font-light text-white/40 leading-relaxed text-justify">
                Built With:
                <br />
                - Core: Next.js, React, TypeScript
                <br />
                - Audio Engine: Tone.js
                <br />
                - MIDI: WebMidi.js
                <br />
                - UI: Tailwind CSS, shadcn/ui, Lucide React
                <br />
                Maybe I will update more features, when i have time :D
              </p>
            </div>

            <div
              className={`transform transition-all duration-700 ${
                isMenuOpen
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              }`}
              style={{ transitionDelay: "600ms" }}
            >
              <div className="h-px w-16 bg-white/20 mx-auto my-4"></div>
              <a
                href="https://github.com/kenken5216/Tonic"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-white/40 font-light tracking-wider uppercase hover:text-white/60 transition"
              >
                Github
              </a>
              <p className="mt-2 text-xs text-white/40 font-light tracking-wider uppercase">
                last update: 01/07/2025
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}