import { motion } from 'framer-motion';

const variants = {
  primary: 'bg-white text-background hover:bg-white/90',
  ghost: 'bg-elevated text-textPrimary hover:bg-elevated/80',
  danger: 'bg-danger/15 text-danger hover:bg-danger/25',
};

export function Button({ variant = 'primary', className = '', children, ...rest }) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      className={
        'rounded-full px-5 py-3 text-sm font-medium transition-colors ' +
        variants[variant] +
        ' ' +
        className
      }
      {...rest}
    >
      {children}
    </motion.button>
  );
}
