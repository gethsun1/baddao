import { Variants } from "framer-motion";

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.5 } }
};

export const slideUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const hoverLift: Variants = {
  whileHover: { 
    y: -4,
    boxShadow: "0 12px 24px -10px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 60, 0, 0.1)",
    transition: { duration: 0.2, ease: "easeOut" }
  }
};

export const buttonHover = {
  whileHover: { 
    scale: 1.02,
    boxShadow: "0 0 15px rgba(255, 60, 0, 0.3)",
    transition: { duration: 0.2 }
  },
  whileTap: { scale: 0.98 }
};
