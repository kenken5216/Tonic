"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import {
  Settings,
  Wifi,
  WifiOff,
  Volume2,
  ChevronLeft,
  ChevronRight,
  Info,
  KeyboardMusic
} from "lucide-react"
import { WebMidi } from "webmidi"
import * as Tone from "tone"
import Navigation from "@/components/Navigation"
import HeroSection from "@/components/HeroSection"
import AnimatedBackground from "@/components/AnimatedBackground"

interface KeyBase {
  note: string;
  octave: number;
  midiNote: number;
}

interface WhiteKey extends KeyBase {
  type: "white";
  position: number;
}

interface BlackKey extends KeyBase {
  type: "black";
  betweenKeys: [number, number];
}

type PianoKey = WhiteKey | BlackKey;

// Piano key configuration with correct black key positions
const KEYS: PianoKey[] = [
  { note: "C", octave: 2, midiNote: 36, type: "white", position: 0 },
  { note: "C#", octave: 2, midiNote: 37, type: "black", betweenKeys: [0, 1] },
  { note: "D", octave: 2, midiNote: 38, type: "white", position: 1 },
  { note: "D#", octave: 2, midiNote: 39, type: "black", betweenKeys: [1, 2] },
  { note: "E", octave: 2, midiNote: 40, type: "white", position: 2 },
  { note: "F", octave: 2, midiNote: 41, type: "white", position: 3 },
  { note: "F#", octave: 2, midiNote: 42, type: "black", betweenKeys: [3, 4] },
  { note: "G", octave: 2, midiNote: 43, type: "white", position: 4 },
  { note: "G#", octave: 2, midiNote: 44, type: "black", betweenKeys: [4, 5] },
  { note: "A", octave: 2, midiNote: 45, type: "white", position: 5 },
  { note: "A#", octave: 2, midiNote: 46, type: "black", betweenKeys: [5, 6] },
  { note: "B", octave: 2, midiNote: 47, type: "white", position: 6 },
]

// Generate different key sets for different screen sizes
const generateKeys = (
  octaves: number,
  startOctave: number = 2,
): PianoKey[] => {
  const allKeys: PianoKey[] = []
  for (let octave = startOctave; octave < startOctave + octaves; octave++) {
    const octaveKeys = KEYS.map((key) => {
      if (key.type === "white") {
        return {
          ...key,
          octave,
          midiNote: key.midiNote + (octave - 2) * 12,
          position: key.position + (octave - startOctave) * 7,
        }
      } else {
        const leftWhitePos = key.betweenKeys[0] + (octave - startOctave) * 7
        const rightWhitePos = key.betweenKeys[1] + (octave - startOctave) * 7
        return {
          ...key,
          octave,
          midiNote: key.midiNote + (octave - 2) * 12,
          betweenKeys: [leftWhitePos, rightWhitePos],
        }
      }
    })
    allKeys.push(...(octaveKeys as PianoKey[])) // Use type assertion here for safety
  }
  // Add final note
  if (octaves > 0) {
    allKeys.push({
      note: "C",
      octave: startOctave + octaves,
      midiNote: 36 + (startOctave + octaves - 2) * 12,
      type: "white",
      position: octaves * 7,
    })
  }
  return allKeys
}

const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
  melodicMinor: [0, 2, 3, 5, 7, 9, 11],
}

const NOTE_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
]

const isWhiteKey = (key: PianoKey): key is WhiteKey => {
  return key.type === "white"
}

const isBlackKey = (key: PianoKey): key is BlackKey => {
  return key.type === "black"
}

export default function VirtualPiano() {
  const [hasEntered, setHasEntered] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [connectedDevices, setConnectedDevices] = useState<string[]>([])
  const [pressedKeys, setPressedKeys] = useState<Set<number>>(new Set())
  const [currentScale, setCurrentScale] = useState<{
    root: number
    type: keyof typeof SCALES
  } | null>(null)
  const [scaleType, setScaleType] = useState<keyof typeof SCALES>("major")
  const [volume, setVolume] = useState([70])
  const [showSettings, setShowSettings] = useState(false)
  const [showLabels, setShowLabels] = useState(true)
  const [displayScaleType, setDisplayScaleType] = useState<"major" | "minor">(
    "major",
  )
  const [screenSize, setScreenSize] = useState<
    "mobile" | "tablet" | "laptop" | "large" | "desktop"
  >("desktop")
  const [octaveOffset, setOctaveOffset] = useState(0)
  const [pianoLoaded, setPianoLoaded] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
    // NEW: State to track if the user has interacted and audio is ready
  const [isAudioReady, setIsAudioReady] = useState(false)
  // Replace audio context refs with Tone.js piano ref
  const pianoRef = useRef<Tone.Sampler | null>(null)
  const volumeNodeRef = useRef<Tone.Volume | null>(null)

  const handleEnterExperience = useCallback(() => {
    if (isTransitioning || hasEntered) return

    // Start the audio context
    Tone.start().then(() => {
      console.log("Audio context started successfully!")
    })

    // Begin the transition
    setIsTransitioning(true)

    // After the hero section fades out, show the main app
    setTimeout(() => {
      setHasEntered(true)
    }, 1200) // Match this duration to your hero section's fade-out animation
  }, [isTransitioning, hasEntered])

  // Check screen size and set appropriate configuration
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth
      if (width < 640) {
        setScreenSize("mobile")
      } else if (width < 1024) {
        setScreenSize("tablet")
      } else if (width < 1280) {
        setScreenSize("laptop")
      } else if (width < 1600) {
        setScreenSize("large")
      } else {
        setScreenSize("desktop")
      }
    }

    checkScreenSize()
    window.addEventListener("resize", checkScreenSize)

    return () => window.removeEventListener("resize", checkScreenSize)
  }, [])

  // Get configuration based on screen size
  const getScreenConfig = () => {
    switch (screenSize) {
      case "mobile":
        return {
          octaves: 1,
          whiteKeyWidth: 42,
          blackKeyWidth: 28,
          whiteKeyHeight: 150,
          blackKeyHeight: 100,
          startOctave: 4,
          showOctaveControls: true,
        }
      case "tablet":
        return {
          octaves: 2,
          whiteKeyWidth: 36,
          blackKeyWidth: 24,
          whiteKeyHeight: 140,
          blackKeyHeight: 90,
          startOctave: 3,
          showOctaveControls: true,
        }
      case "laptop":
        return {
          octaves: 3,
          whiteKeyWidth: 40,
          blackKeyWidth: 26,
          whiteKeyHeight: 160,
          blackKeyHeight: 100,
          startOctave: 3,
          showOctaveControls: false,
        }
      case "large":
        return {
          octaves: 4,
          whiteKeyWidth: 44,
          blackKeyWidth: 28,
          whiteKeyHeight: 180,
          blackKeyHeight: 115,
          startOctave: 2,
          showOctaveControls: false,
        }
      case "desktop":
      default:
        return {
          octaves: 5,
          whiteKeyWidth: 48,
          blackKeyWidth: 32,
          whiteKeyHeight: 200,
          blackKeyHeight: 130,
          startOctave: 2,
          showOctaveControls: false,
        }
    }
  }

  const config = getScreenConfig()


  // Initialize Tone.js piano
  useEffect(() => {
    const initPiano = async () => {
      try {
        console.log("Initializing piano...")

        // Create volume control node first
        volumeNodeRef.current = new Tone.Volume(-10).toDestination()
        console.log("Volume node created")

        // Initialize Tone.js piano sampler with a smaller set of samples first
        pianoRef.current = new Tone.Sampler({
          urls: {
            C1: "C1.mp3",
            C2: "C2.mp3",
            C3: "C3.mp3",
            C4: "C4.mp3",
            C5: "C5.mp3",
            C6: "C6.mp3",
            C7: "C7.mp3",
          },
          release: 1,
          baseUrl: "https://tonejs.github.io/audio/salamander/",
          onload: () => {
            setPianoLoaded(true)
            console.log("Piano samples loaded successfully!")
          },
          onerror: (error) => {
            console.error("Error loading piano samples:", error)
            // Fallback to basic oscillator
            initFallbackAudio()
          },
        }).connect(volumeNodeRef.current)

        console.log("Piano sampler created")
      } catch (error) {
        console.error("Failed to initialize piano:", error)
        // Fallback to basic oscillator
        initFallbackAudio()
      }
    }

    // Fallback audio using basic oscillators
    const initFallbackAudio = () => {
      console.log("Using fallback audio...")
      setPianoLoaded(true) // Set as loaded so user can interact
    }

    initPiano()

    return () => {
      if (pianoRef.current) {
        pianoRef.current.dispose()
      }
      if (volumeNodeRef.current) {
        volumeNodeRef.current.dispose()
      }
    }
  }, [])

  // Update volume when slider changes
  useEffect(() => {
    if (volumeNodeRef.current) {
      // Convert 0-100 to decibels (-60 to 0)
      const dbValue = (volume[0] / 100) * 60 - 60
      volumeNodeRef.current.volume.value = dbValue
    }
  }, [volume])

    // NEW: A single function to start the audio context on user interaction
  const startAudio = useCallback(async () => {
    if (isAudioReady) return
    try {
      await Tone.start()
      setIsAudioReady(true)
      console.log("Audio context started successfully by user interaction.")
    } catch (e) {
      console.error("Could not start audio context:", e)
    }
  }, [isAudioReady])


  const playFallbackNote = (midiNote: number, velocity: number) => {
    try {
      const frequency = 440 * Math.pow(2, (midiNote - 69) / 12);
      
      // 1. Use 'new' to create an instance
      // 2. Do NOT connect it directly to the destination here
      const oscillator = new Tone.Oscillator(frequency, "sine");

      const envelope = new Tone.AmplitudeEnvelope({
        attack: 0.01,
        decay: 0.3,
        sustain: 0.7,
        release: 1.5,
      }).toDestination(); // The envelope is the only thing connected to the output

      // Connect the oscillator to the envelope, then start the oscillator
      oscillator.connect(envelope).start();

      // Trigger the envelope. It will automatically stop the note after the duration.
      // The 'setTimeout' is no longer needed.
      envelope.triggerAttackRelease("1n");

    } catch (error) {
      console.error("Fallback audio also failed:", error);
    }
  };

  // CORRECTED: Wrap playNote in useCallback and add pianoLoaded dependency
  const playNote = useCallback(
    async (midiNote: number, velocity: number) => {
      console.log(`Playing note: ${midiNote}, velocity: ${velocity}`)

      try {
        if (pianoRef.current && pianoLoaded) {
          const noteName = Tone.Frequency(midiNote, "midi").toNote()
          const normalizedVelocity = velocity / 127

          console.log(
            `Triggering note: ${noteName}, velocity: ${normalizedVelocity}`,
          )
          pianoRef.current.triggerAttack(
            noteName,
            undefined,
            normalizedVelocity,
          )
        } else {
          console.log("Using fallback oscillator")
          playFallbackNote(midiNote, velocity)
        }
      } catch (error) {
        console.error("Error playing note:", error)
        playFallbackNote(midiNote, velocity)
      }
    },
    [pianoLoaded], // Dependency ensures this function updates when piano is loaded
  )

  // CORRECTED: Wrap stopNote in useCallback
  const stopNote = useCallback((midiNote: number) => {
    if (!pianoRef.current) return

    try {
      const noteName = Tone.Frequency(midiNote, "midi").toNote()
      pianoRef.current.triggerRelease(noteName)
    } catch (error) {
      console.error("Error stopping note:", error)
    }
  }, []) // No dependencies needed as pianoRef is stable

  const handleNoteOn = useCallback(
    (midiNote: number, velocity = 100) => {
      // CHANGED: Removed the Tone.start() logic from here.
      // It's now handled by the global `startAudio` function.
      setPressedKeys((prev) => new Set(prev).add(midiNote))
      const noteIndex = midiNote % 12
      setCurrentScale({ root: noteIndex, type: scaleType })
      playNote(midiNote, velocity)
    },
    [scaleType, playNote],
  )

  // CORRECTED: Add stopNote to the dependency array
  const handleNoteOff = useCallback(
    (midiNote: number) => {
      console.log(`handleNoteOff called: ${midiNote}`)

      setPressedKeys((prev) => {
        const newSet = new Set(prev)
        newSet.delete(midiNote)
        return newSet
      })

      stopNote(midiNote)
    },
    [stopNote], // Add stopNote as a dependency
  )

  const setupMIDIInputs = useCallback(() => {
    const devices: string[] = []
    WebMidi.inputs.forEach((input) => {
      devices.push(input.name || "Unknown Device")
      input.removeListener()
      input.addListener("noteon", (e: any) => {
        // CHANGED: Scale down the raw MIDI velocity to reduce volume
        const scaledVelocity = Math.round(e.rawVelocity * 127 * 0.1)
        handleNoteOn(e.note.number, scaledVelocity)
      })
      input.addListener("noteoff", (e: any) => {
        handleNoteOff(e.note.number)
      })
    })
    setConnectedDevices(devices)
  }, [handleNoteOn, handleNoteOff])

  // Initialize Web MIDI API
  useEffect(() => {
    const initMidi = async () => {
      try {
        await WebMidi.enable()
        // This now calls the latest version of setupMIDIInputs
        setupMIDIInputs()

        WebMidi.addListener("connected", setupMIDIInputs)
        WebMidi.addListener("disconnected", setupMIDIInputs)
      } catch (error) {
        console.error("Failed to access MIDI devices:", error)
      }
    }

    initMidi()

    return () => {
      if (WebMidi.enabled) {
        WebMidi.removeListener("connected", setupMIDIInputs)
        WebMidi.removeListener("disconnected", setupMIDIInputs)
      }
    }
  }, [setupMIDIInputs]) // CORRECTED: Add setupMIDIInputs as a dependency

  const getScaleNotes = (root: number, scaleType: keyof typeof SCALES) => {
    return SCALES[scaleType].map((interval) => (root + interval) % 12)
  }

  const isKeyInCurrentScale = (midiNote: number) => {
    if (!currentScale) return false
    const noteIndex = midiNote % 12
    const scaleNotes = getScaleNotes(currentScale.root, displayScaleType)
    return scaleNotes.includes(noteIndex)
  }

  const isRootNote = (midiNote: number) => {
    if (!currentScale) return false
    return midiNote % 12 === currentScale.root
  }

  const getKeyClassName = (key: any) => {
    const isPressed = pressedKeys.has(key.midiNote)
    const inCurrentScale = isKeyInCurrentScale(key.midiNote)
    const isRoot = isRootNote(key.midiNote)

    let className =
      "absolute transition-all duration-200 ease-out cursor-pointer select-none "

    if (key.type === "white") {
      className += "border rounded-b-lg shadow-lg "

      if (isPressed) {
        className += "translate-y-1 shadow-inner "
        className += "bg-gray-100 border-gray-300 "
      } else if (isRoot) {
        className += "bg-purple-100 border-purple-300 "
      } else if (inCurrentScale) {
        className +=
          displayScaleType === "major"
            ? "bg-blue-50 border-blue-200 "
            : "bg-green-50 border-green-200 "
      } else {
        className += "bg-white border-gray-200 hover:bg-gray-50 "
      }
    } else {
      className += "border rounded-b-lg shadow-xl z-10 "

      if (isPressed) {
        className += "translate-y-1 shadow-inner "
        className += "bg-gray-700 border-gray-600 "
      } else if (isRoot) {
        className += "bg-purple-800 border-purple-600 "
      } else if (inCurrentScale) {
        className +=
          displayScaleType === "major"
            ? "bg-blue-800 border-blue-600 "
            : "bg-green-800 border-green-600 "
      } else {
        className += "bg-gray-900 border-gray-800 hover:bg-gray-800 "
      }
    }

    return className
  }

  const getBlackKeyPosition = (key: BlackKey) => {
    if (key.type !== "black" || !key.betweenKeys) return 0

    const leftWhiteKeyPos = key.betweenKeys[0] * config.whiteKeyWidth
    return leftWhiteKeyPos + config.whiteKeyWidth - config.blackKeyWidth / 2
  }

  // Get current keys based on screen size and octave offset
  const getCurrentKeys = () => {
    const baseKeys = generateKeys(config.octaves, config.startOctave)

    if (config.showOctaveControls) {
      return baseKeys.map((key) => ({
        ...key,
        midiNote: key.midiNote + octaveOffset * 12,
      }))
    }

    return baseKeys
  }

  const getKeyboardDimensions = () => {
    const whiteKeysCount = config.octaves * 7 + 1 // +1 for the final C
    return {
      width: whiteKeysCount * config.whiteKeyWidth,
      height: config.whiteKeyHeight,
    }
  }

  const currentKeys = getCurrentKeys()
  const keyboardDimensions = getKeyboardDimensions()

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* NEW: Render Hero Section */}
      <HeroSection
        hasEntered={hasEntered}
        isTransitioning={isTransitioning}
        handleEnterExperience={handleEnterExperience}
      />
      {/* NEW: Main app content is now wrapped and conditionally rendered */}
      <div
        className={`min-h-screen relative transition-opacity duration-1000 ease-in ${
          hasEntered ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{
          background: `
            radial-gradient(circle at 25% 25%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(236, 72, 153, 0.12) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(14, 165, 233, 0.08) 0%, transparent 50%),
            linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)
          `,
        }}
      >

      <Navigation isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

        {/* NEW: Use the reusable background component */}
        <AnimatedBackground />

      {/* Enhanced floating animation keyframes */}
        <style jsx>{`
        .glass-panel::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: inherit; /* This makes the glare follow the parent's border-radius */
          pointer-events: none;
          background: radial-gradient(
            circle at 50% 0%,
            rgba(255, 255, 255, 0.3),
            rgba(255, 255, 255, 0) 70%
          );
        }
      `}</style>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
          <div
          className="border-b" // Removed shadow-sm for a flatter look
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.45)", // More transparent
            backdropFilter: "blur(24px)", // Slightly more blur
            borderColor: "rgba(255, 255, 255, 0.2)", // Softer border
            boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)", // Add a subtle shadow
          }}
        >
          <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-4">
                <div
                  className="p-1.5 sm:p-2"
                >
                  <KeyboardMusic className="w-4 h-4 sm:w-6 sm:h-6 text-gray-600" />
                </div>
                <div>
                  <h1
                    className="text-lg sm:text-2xl text-gray-700"
                    style={{ fontWeight: "300" }}
                  >
                    TONIC
                  </h1>
                  <p
                    className="text-gray-500 text-xs sm:text-sm"
                    style={{ fontWeight: "300" }}
                  >
                    Your foundational piano. {!pianoLoaded && "• Loading piano..."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-4">
                {/* MIDI Status */}
                <div
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2"
                >
                  {connectedDevices.length > 0 ? (
                    <>
                      <Wifi className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                      <span
                        className="text-xs sm:text-sm text-gray-700"
                        style={{ fontWeight: "300" }}
                      >
                        {connectedDevices.length} MIDI
                      </span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                      <span
                        className="text-xs sm:text-sm text-gray-500 hidden sm:inline"
                        style={{ fontWeight: "300" }}
                      >
                        No MIDI
                      </span>
                    </>
                  )}
                </div>

                 <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMenuOpen(true)}
                  className="text-gray-600 hover:bg-white/50 h-8 w-8 sm:h-10 sm:w-10"
                >
                  <Info className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSettings(!showSettings)}
                  className="text-gray-600 hover:bg-white/50 h-8 w-8 sm:h-10 sm:w-10"
                >
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-3 sm:px-6 py-6 sm:py-12">
          {/* Major/Minor Toggle */}
          <div className="flex justify-center mb-6 sm:mb-12">
            <div
              // Add our glass-panel class for the glare effect
              className="relative glass-panel rounded-2xl p-1"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.35)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(255, 255, 255, 0.4)",
                boxShadow: "0 4px 12px 0 rgba(31, 38, 135, 0.1)",
              }}
            >
              <div className="flex items-center">
                <button
                  onClick={() => setDisplayScaleType("major")}
                  className={`px-4 sm:px-8 py-2 sm:py-3 rounded-xl transition-all duration-300 text-sm sm:text-base ${
                    displayScaleType === "major"
                      ? "bg-white text-blue-600 shadow-md" // Active state is a solid pill
                      : "text-grey/70 hover:text-white" // Inactive state is transparent text
                  }`}
                  style={{ fontWeight: "300" }}
                >
                  Major
                </button>
                <button
                  onClick={() => setDisplayScaleType("minor")}
                  className={`px-4 sm:px-8 py-2 sm:py-3 rounded-xl transition-all duration-300 text-sm sm:text-base ${
                    displayScaleType === "minor"
                      ? "bg-white text-green-600 shadow-md" // Active state is a solid pill
                      : "text-grey/70 hover:text-white" // Inactive state is transparent text
                  }`}
                  style={{ fontWeight: "300" }}
                >
                  Minor
                </button>
              </div>
            </div>
          </div>

{/* Settings Panel */}
{showSettings && (
  <div
    className="relative glass-panel mb-6 sm:mb-8 p-4 sm:p-6 rounded-2xl"
    style={{
      backgroundColor: "rgba(255, 255, 255, 0.35)",
      backdropFilter: "blur(30px)",
      border: "1px solid rgba(255, 255, 255, 0.4)",
      boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.1)",
    }}
  >
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {/* Scale Type */}
      <div className="flex flex-col">
        <label
          className="text-sm text-gray-700 mb-2 block"
          style={{ fontWeight: "300" }}
        >
          Scale Type
        </label>
        <Select
          value={scaleType}
          onValueChange={(value: keyof typeof SCALES) =>
            setScaleType(value)
          }
        >
          <SelectTrigger
            className="text-gray-700 h-10 w-full"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              backdropFilter: "blur(10px)",
              borderColor: "rgba(255, 255, 255, 0.7)",
              fontWeight: "300",
            }}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="major">Major</SelectItem>
            <SelectItem value="minor">Natural Minor</SelectItem>
            <SelectItem value="harmonicMinor">Harmonic Minor</SelectItem>
            <SelectItem value="melodicMinor">Melodic Minor</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Volume */}
      <div className="flex flex-col">
        <label
          className="text-sm text-gray-700 mb-2 block"
          style={{ fontWeight: "300" }}
        >
          Volume
        </label>
        <div className="flex items-center gap-3 h-10 px-3 py-2 rounded-lg border border-white/30 bg-white/20 backdrop-blur-sm">
          <Volume2 className="w-4 h-4 text-gray-600 flex-shrink-0" />
          <Slider
            value={volume}
            onValueChange={setVolume}
            max={100}
            step={1}
            className="flex-1 [&>span:first-child>span]:bg-gradient-to-r [&>span:first-child>span]:from-blue-500 [&>span:first-child>span]:to-purple-500 [&>span:last-child]:border-purple-500/50"
          />
          <span
            className="text-sm text-gray-600 w-8 text-right flex-shrink-0"
            style={{ fontWeight: "300" }}
          >
            {volume[0]}
          </span>
        </div>
      </div>

      {/* Show Labels */}
      <div className="flex flex-col justify-end">
        <div className="flex items-center justify-center gap-3 h-10 px-3 py-2 rounded-lg border border-white/30 bg-white/20 backdrop-blur-sm">
          <input
            type="checkbox"
            id="showLabels"
            checked={showLabels}
            onChange={(e) => setShowLabels(e.target.checked)}
            className="w-4 h-4 rounded accent-purple-500"
          />
          <label
            htmlFor="showLabels"
            className="text-sm text-gray-700 select-none cursor-pointer"
            style={{ fontWeight: "300" }}
          >
            Show Labels
          </label>
        </div>
      </div>
    </div>
  </div>
)}

          {/* Scale Information */}
          <div
            // Add position:relative and our new glass-panel class
            className="relative glass-panel mb-6 sm:mb-8 p-4 sm:p-6 rounded-2xl"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.35)", // More transparent
              backdropFilter: "blur(30px)", // Stronger blur
              border: "1px solid rgba(255, 255, 255, 0.4)", // Brighter border for definition
              boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.1)", // Softer, modern shadow
            }}
          >
            <div
              className="text-center transition-all duration-300 ease-in-out overflow-hidden"
              style={{ minHeight: screenSize === "mobile" ? "80px" : "120px" }}
            >
              <div
                className={`transition-opacity duration-300 ${
                  currentScale ? "opacity-100" : "opacity-60"
                }`}
              >
                <h3
                  className="text-lg sm:text-xl text-gray-700 mb-2 sm:mb-4"
                  style={{ fontWeight: "300" }}
                >
                  {currentScale
                    ? `${NOTE_NAMES[currentScale.root]} ${
                        displayScaleType.charAt(0).toUpperCase() +
                        displayScaleType.slice(1)
                      }`
                    : "Play a note to see scale information"}
                </h3>

                <div className="flex flex-wrap gap-1 sm:gap-2 mb-2 sm:mb-4 justify-center min-h-[24px] sm:min-h-[32px]">
                  {currentScale ? (
                    getScaleNotes(currentScale.root, displayScaleType).map(
                      (noteIndex, i) => (
                        <Badge
                          key={i}
                          className={`${
                            displayScaleType === "major"
                              ? "bg-blue-100 text-blue-700 border-blue-200"
                              : "bg-green-100 text-green-700 border-green-200"
                          } border transition-all duration-300 text-xs sm:text-sm shadow-sm`}
                          style={{
                            backdropFilter: "blur(10px)",
                            fontWeight: "300",
                          }}
                        >
                          {NOTE_NAMES[noteIndex]}
                        </Badge>
                      ),
                    )
                  ) : (
                    <div
                      className="text-gray-500 text-xs sm:text-sm"
                      style={{ fontWeight: "300" }}
                    >
                      
                    </div>
                  )}
                </div>

                <div
                  className="text-xs sm:text-sm text-gray-600"
                  style={{ fontWeight: "300" }}
                >
                  {currentScale
                    ? displayScaleType === "major"
                      ? "W-W-H-W-W-W-H"
                      : "W-H-W-W-H-W-W"
                    : ""}
                </div>
              </div>
            </div>
          </div>

          {/* Octave Controls for smaller screens */}
          {config.showOctaveControls && (
            <div className="flex justify-center mb-6">
              <div
                className="flex items-center gap-4 rounded-2xl p-2 shadow-lg"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.3",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setOctaveOffset(Math.max(-2, octaveOffset - 1))}
                  disabled={octaveOffset <= -2}
                  className="h-8 w-8 p-0 hover:bg-white/20 text-gray-600"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span
                  className="text-sm text-gray-700 min-w-[60px] text-center"
                  style={{ fontWeight: "300" }}
                >
                  Oct {config.startOctave + octaveOffset}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setOctaveOffset(Math.min(2, octaveOffset + 1))}
                  disabled={octaveOffset >= 2}
                  className="h-8 w-8 p-0 hover:bg-white/20 text-gray-600"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

      {/* Piano Keyboard */}
      <div className="w-full flex justify-center">
        <div
          // Add position:relative and our new glass-panel class
          className="relative glass-panel rounded-3xl p-4 sm:p-8"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.25)", // Even more transparent for the main element
            backdropFilter: "blur(35px)", // Max blur for the centerpiece
            border: "1px solid rgba(255, 255, 255, 0.5)", // A strong border to contain the keys
            boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.15)", // A slightly stronger shadow
          }}
        >
          <div
            className="relative mx-auto"
            style={{
              width: `${keyboardDimensions.width}px`,
              height: `${keyboardDimensions.height}px`,
            }}
          >
            {/* White keys */}
            {currentKeys.filter(isWhiteKey).map((key) => (
              <button
                key={`${key.note}${key.octave}-${octaveOffset}`}
                className={getKeyClassName(key)}
                style={{
                  // This will now work without error
                  left: `${key.position * config.whiteKeyWidth}px`,
                  width: `${config.whiteKeyWidth}px`,
                  height: `${config.whiteKeyHeight}px`,
                }}
                onMouseDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleNoteOn(key.midiNote, 100)
                }}
                onMouseUp={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleNoteOff(key.midiNote)
                }}
                onMouseLeave={(e) => {
                  e.preventDefault()
                  handleNoteOff(key.midiNote)
                }}
                onTouchStart={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleNoteOn(key.midiNote, 100)
                }}
                onTouchEnd={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleNoteOff(key.midiNote)
                }}
                onTouchCancel={(e) => {
                  e.preventDefault()
                  handleNoteOff(key.midiNote)
                }}
              >
                {showLabels && (
                  <div
                    className="absolute left-1/2 transform -translate-x-1/2 text-gray-600 text-xs pointer-events-none"
                    style={{
                      bottom: screenSize === "mobile" ? "4px" : "16px",
                      fontWeight: "300",
                    }}
                  >
                    {key.note}
                    <span className="text-xs">{key.octave}</span>
                  </div>
                )}
              </button>
            ))}

            {/* Black keys */}
            {currentKeys.filter(isBlackKey).map((key) => (
              <button
                key={`${key.note}${key.octave}-${octaveOffset}`}
                className={getKeyClassName(key)}
                style={{
                  // This now correctly uses the updated function
                  left: `${getBlackKeyPosition(key)}px`,
                  width: `${config.blackKeyWidth}px`,
                  height: `${config.blackKeyHeight}px`,
                }}
                onMouseDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleNoteOn(key.midiNote, 100)
                }}
                onMouseUp={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleNoteOff(key.midiNote)
                }}
                onMouseLeave={(e) => {
                  e.preventDefault()
                  handleNoteOff(key.midiNote)
                }}
                onTouchStart={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleNoteOn(key.midiNote, 100)
                }}
                onTouchEnd={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleNoteOff(key.midiNote)
                }}
                onTouchCancel={(e) => {
                  e.preventDefault()
                  handleNoteOff(key.midiNote)
                }}
              >
                {showLabels && (
                  <div
                    className="absolute left-1/2 transform -translate-x-1/2 text-white text-xs pointer-events-none"
                    style={{
                      bottom: screenSize === "mobile" ? "4px" : "12px",
                      fontWeight: "300",
                    }}
                  >
                    {key.note}
                    <span className="text-xs">{key.octave}</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

          {/* Instructions */}
          <div className="mt-6 sm:mt-8 text-center">
            <p
              className="text-gray-600 text-sm sm:text-base"
              style={{ fontWeight: "300" }}
            >
              {!pianoLoaded
                ? "Loading realistic piano sounds..."
                : config.showOctaveControls
                  ? "Tap the keys to play • Use octave controls to change range"
                  : "Connect a MIDI keyboard or click the keys to visualize scales"}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
  )
}