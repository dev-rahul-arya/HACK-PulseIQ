import { motion } from 'framer-motion';

export function Card({ children, className = '', interactive = false, ...rest }) {
  const Comp = interactive ? motion.button : motion.div;
  const interactiveProps = interactive
    ? {
        whileTap: { scale: 0.98 },
        whileHover: { scale: 1.01 },
        transition: { type: 'spring', stiffness: 300, damping: 22 },
      }
    : {};
  return (
    <Comp
      {...interactiveProps}
      className={
        'block w-full text-left bg-surface rounded-2xl p-5 shadow-card border border-white/5 ' +
        className
      }
      {...rest}
    >
      {children}
    </Comp>
  );
}
