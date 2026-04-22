import { motion } from "framer-motion";

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

export function StaggerGroup({ children, className = "", as: Tag = "div" }) {
  const MotionTag = motion[Tag] ?? motion.div;
  return (
    <MotionTag
      variants={containerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      className={className}
    >
      {children}
    </MotionTag>
  );
}

export function StaggerItem({ children, className = "", as: Tag = "div" }) {
  const MotionTag = motion[Tag] ?? motion.div;
  return (
    <MotionTag variants={itemVariants} className={className}>
      {children}
    </MotionTag>
  );
}

export default StaggerGroup;
