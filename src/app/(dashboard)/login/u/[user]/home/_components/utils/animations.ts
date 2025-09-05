// Animation variants for dashboard components
export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

export const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20
    }
  }
};

export const cardHoverVariants = {
  hover: { 
    scale: 1.02, 
    y: -2,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  },
  tap: { 
    scale: 0.98,
    transition: {
      type: "spring",
      stiffness: 600,
      damping: 30
    }
  }
};

export const buttonVariants = {
  hover: { 
    scale: 1.1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  },
  tap: { 
    scale: 0.9,
    transition: {
      type: "spring",
      stiffness: 600,
      damping: 30
    }
  }
};

// Optimized animation variants for performance
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: "easeOut" } // Reduced from 0.6s
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05, // Reduced from 0.1s
      delayChildren: 0.1
    }
  }
};

export const scaleOnHover = {
  whileHover: { scale: 1.02 }, // Reduced from 1.05
  whileTap: { scale: 0.98 },
  transition: { duration: 0.15, ease: "easeOut" } // Faster transitions
};

export const slideInLeft = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.3, ease: "easeOut" }
};

export const slideInRight = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.3, ease: "easeOut" }
};

// Optimized chart animations
export const chartAnimation = {
  initial: { pathLength: 0, opacity: 0 },
  animate: { pathLength: 1, opacity: 1 },
  transition: { duration: 1, ease: "easeInOut" }
};

// Reduced complexity pulse animation
export const pulseAnimation = {
  animate: {
    scale: [1, 1.02, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
}; 