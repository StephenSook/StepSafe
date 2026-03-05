import { motion } from "framer-motion"
import clsx from "clsx"

const COLOR_VARIANTS = {
  medical: {
    border: [
      "border-teal-500/60",
      "border-emerald-400/50",
      "border-slate-600/30",
    ],
    gradient: "from-teal-500/30",
  },
}

const AnimatedGrid = () => (
  <motion.div
    className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,transparent_30%,black)]"
    animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
    transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
  >
    <div className="h-full w-full [background-image:repeating-linear-gradient(100deg,#94A3B8_0%,#94A3B8_1px,transparent_1px,transparent_4%)] opacity-10" />
  </motion.div>
)

export function BackgroundCircles({ children, className }) {
  const variantStyles = COLOR_VARIANTS.medical

  return (
    <div
      className={clsx(
        "relative flex w-full items-center justify-center overflow-hidden bg-white",
        className
      )}
    >
      <AnimatedGrid />

      {/* Animated circles */}
      <motion.div className="absolute h-[480px] w-[480px]">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={clsx(
              "absolute inset-0 rounded-full",
              "border-2 bg-gradient-to-br to-transparent",
              variantStyles.border[i],
              variantStyles.gradient
            )}
            animate={{
              rotate: 360,
              scale: [1, 1.05 + i * 0.05, 1],
              opacity: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <div className="absolute inset-0 rounded-full mix-blend-screen bg-[radial-gradient(ellipse_at_center,rgba(13,148,136,0.1),transparent_70%)]" />
          </motion.div>
        ))}
      </motion.div>

      {/* Teal/emerald glow effects */}
      <div className="absolute inset-0 [mask-image:radial-gradient(90%_60%_at_50%_50%,#000_40%,transparent)]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(13,148,136,0.15),transparent_70%)] blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.08),transparent)] blur-[80px]" />
      </div>

      {/* Content on top */}
      <div className="relative z-10 w-full">
        {children}
      </div>
    </div>
  )
}
