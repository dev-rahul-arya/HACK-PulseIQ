import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '../../store/useStore';
import { BottomNav } from './BottomNav';
import { TodayTab } from '../dashboard/TodayTab';
import { TimelineTab } from '../timeline/TimelineTab';
import { InsightsTab } from '../insights/InsightsTab';
import { ProfileTab } from '../profile/ProfileTab';
import { AddDataModal } from '../manual/AddDataModal';

const TAB_COMPONENTS = {
  today: TodayTab,
  timeline: TimelineTab,
  insights: InsightsTab,
  profile: ProfileTab,
};

export function Shell() {
  const activeTab = useStore((s) => s.activeTab);
  const ActiveComponent = TAB_COMPONENTS[activeTab];

  return (
    <div className="min-h-svh bg-background text-textPrimary">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <main id="main-content" className="max-w-lg mx-auto pb-28" tabIndex={-1}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <ActiveComponent />
          </motion.div>
        </AnimatePresence>
      </main>
      <BottomNav />
      <AddDataModal />
    </div>
  );
}
