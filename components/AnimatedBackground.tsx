"use client"

export default function AnimatedBackground() {
  return (
    <>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Subtle floating orbs */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={`orb-${i}`}
            className="absolute rounded-full animate-pulse"
            style={{
              width: `${8 + Math.random() * 16}px`,
              height: `${8 + Math.random() * 16}px`,
              background: `radial-gradient(circle, ${
                i % 3 === 0
                  ? "rgba(99, 102, 241, 0.4)"
                  : i % 3 === 1
                    ? "rgba(236, 72, 153, 0.3)"
                    : "rgba(14, 165, 233, 0.35)"
              } 0%, transparent 70%)`,
              top: `${10 + Math.random() * 80}%`,
              left: `${10 + Math.random() * 80}%`,
              animationDuration: `${4 + Math.random() * 6}s`,
              animationDelay: `${Math.random() * 3}s`,
              filter: "blur(1px)",
            }}
          />
        ))}

        {/* Gentle floating particles */}
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={`particle-${i}`}
            className="absolute w-1 h-1 rounded-full opacity-60"
            style={{
              backgroundColor:
                i % 4 === 0
                  ? "#6366f1"
                  : i % 4 === 1
                    ? "#ec4899"
                    : i % 4 === 2
                      ? "#14b8a6"
                      : "#8b5cf6",
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `gentleFloat ${
                8 + Math.random() * 12
              }s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
              filter: "blur(0.5px)",
            }}
          />
        ))}

        {/* Large ambient orbs */}
        <div
          className="absolute w-96 h-96 rounded-full opacity-8 animate-pulse"
          style={{
            top: "5%",
            right: "5%",
            background: "radial-gradient(circle, #6366f1 0%, transparent 60%)",
            filter: "blur(80px)",
            animationDuration: "12s",
          }}
        />
        <div
          className="absolute w-80 h-80 rounded-full opacity-6 animate-pulse"
          style={{
            bottom: "10%",
            left: "5%",
            background: "radial-gradient(circle, #ec4899 0%, transparent 46%)",
            filter: "blur(70px)",
            animationDuration: "15s",
            animationDelay: "3s",
          }}
        />
      </div>

      {/* Enhanced floating animation keyframes */}
      <style jsx>{`
        @keyframes gentleFloat {
          0%,
          100% {
            transform: translateY(0px) translateX(0px) scale(1);
            opacity: 0.6;
          }
          25% {
            transform: translateY(-20px) translateX(10px) scale(1.1);
            opacity: 0.8;
          }
          50% {
            transform: translateY(-10px) translateX(-8px) scale(0.9);
            opacity: 0.4;
          }
          75% {
            transform: translateY(-30px) translateX(5px) scale(1.05);
            opacity: 0.7;
          }
        }
      `}</style>
    </>
  )
}