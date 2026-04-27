import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { TABS } from '../../store/useStore';

const ICONS = {
  today: (
    <path
      d="M4 12a8 8 0 1 1 16 0 8 8 0 0 1-16 0Zm8-5v5l3 2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  timeline: (
    <path
      d="M3 17l5-6 4 4 4-7 5 9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  insights: (
    <path
      d="M9 21h6m-3-4v4m-6-7a6 6 0 1 1 12 0c0 2.5-2 3.5-2 6H8c0-2.5-2-3.5-2-6Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  profile: (
    <path
      d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
};

const LABELS = {
  today: 'Today',
  timeline: 'Timeline',
  insights: 'Insights',
  profile: 'Profile',
};

export function BottomNav({ activeTab }) {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-30 safe-bottom bg-surface/95 backdrop-blur-xl border-t border-white/5"
      role="navigation"
    >
      <ul className="max-w-lg mx-auto flex items-stretch justify-around px-2 pt-2">
        {TABS.map((tab) => {
          const active = activeTab === tab;
          return (
            <li key={tab} className="flex-1">
              <Link
                to={`/app/${tab}`}
                aria-label={LABELS[tab]}
                aria-current={active ? 'page' : undefined}
                className="relative w-full flex flex-col items-center gap-1 py-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-accent-mental/60"
              >
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={active ? '#FFFFFF' : '#7A7A82'}
                  strokeWidth="1.8"
                  className="transition-colors"
                  aria-hidden="true"
                >
                  {ICONS[tab]}
                </svg>
                <span
                  className={
                    'text-[10px] font-medium tracking-wide transition-colors ' +
                    (active ? 'text-textPrimary' : 'text-textSecondary/60')
                  }
                >
                  {LABELS[tab]}
                </span>
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    aria-hidden="true"
                    className="absolute -top-[9px] left-1/2 -translate-x-1/2 h-[2px] w-8 bg-white rounded-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
