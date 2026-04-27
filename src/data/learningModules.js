// Bite-sized educational modules surfaced on the Today tab.
// Content is intentionally non-prescriptive — describes mechanisms, not diagnoses.

export const LEARNING_MODULES = [
  {
    id: 'hrv-explained',
    category: 'Recovery',
    accent: '#64D2FF',
    readMinutes: 3,
    title: 'What HRV is actually measuring',
    blurb:
      'A higher number is not always better — context, baseline, and your own trend matter more.',
    body: [
      "Heart-rate variability (HRV) is the tiny difference in milliseconds between consecutive heartbeats. A relaxed nervous system produces variable spacing; a stressed one tightens up and beats more like a metronome.",
      "Wearables typically report HRV using RMSSD (root mean square of successive differences) over a window of overnight readings. That's why morning HRV from your watch is the most stable number to track.",
      "There is no universal 'good' HRV — values vary 2-3x between healthy adults the same age. What matters is your personal baseline. A drop of 10-20% from your 14-day average for several days in a row is more meaningful than any single reading.",
      "Things that pull HRV down: under-recovered training, alcohol the night before, sleep loss, illness onset, and high mental load. Things that bring it up: consistent sleep timing, easy aerobic work, and unplugged time.",
      "Treat HRV like a context signal, not a verdict. If it's low and you feel fine, an easier day is still rarely a bad call.",
    ],
  },
  {
    id: 'sleep-debt',
    category: 'Sleep',
    accent: '#5E5CE6',
    readMinutes: 4,
    title: 'The math behind sleep debt',
    blurb:
      "You don't fully repay last week's lost sleep over the weekend. Here's what the research actually shows.",
    body: [
      "Sleep debt is the running shortfall between the sleep you needed and the sleep you got. For most adults that target sits between 7 and 9 hours, with the genuine 'short sleeper' phenotype being rare — under 1% of the population.",
      "A 2019 study from the University of Colorado tracked weekend recovery sleep in adults restricted to 5 hours per night. Even with unlimited Saturday and Sunday catch-up, daytime metabolic markers and insulin sensitivity didn't fully return to baseline by Monday morning.",
      "What the body recovers fastest is reaction-time sharpness and mood. What lingers: glucose regulation, inflammation markers, and the kind of subtle judgement errors you don't notice in yourself.",
      "Practical implication: chronic 6-hour weeknights followed by 10-hour weekends is structurally different from a steady 7.5 every night, even when the weekly total looks the same. Bedtime consistency is its own variable.",
      "If you're carrying multi-day debt, the fastest way out is two consecutive nights of full unrestricted sleep — not one heroic 12-hour weekend.",
    ],
  },
  {
    id: 'rhr-baseline',
    category: 'Cardio',
    accent: '#FF375F',
    readMinutes: 3,
    title: 'Why resting heart rate drifts',
    blurb:
      'A 5 bpm rise that holds for several days often shows up before you consciously feel anything.',
    body: [
      "Resting heart rate (RHR) is what your heart does when nothing is asking anything of it — typically measured during your deepest sleep block. It's a coarse-grained but stubbornly honest readout of cardiovascular load.",
      "Daily noise of plus or minus 2-3 bpm is normal. A multi-day drift of 5+ bpm above your 14-day baseline tends to map onto one of: an illness brewing (often 1-2 days before symptoms), poor sleep, alcohol, dehydration, an intense training block you haven't recovered from, or lingering stress.",
      "Aerobic conditioning slowly lowers your floor. Detraining quietly raises it. Endurance athletes typically run 40-55 bpm; sedentary adults sit closer to 70-80.",
      "The signal is most useful when read with HRV: low HRV plus elevated RHR is a classic 'systemic load' pattern. Normal HRV with a slight RHR bump is more often a one-off — caffeine late, a poor night, a warm room.",
      "Watch the trend, not the single number.",
    ],
  },
  {
    id: 'steps-vs-active',
    category: 'Movement',
    accent: '#FF9F0A',
    readMinutes: 2,
    title: 'Steps vs. active minutes',
    blurb:
      'They count different things. Step count is volume; active minutes is intensity.',
    body: [
      "A 10,000-step day spread across slow walking has very different cardiovascular impact than a 6,000-step day with 30 minutes of brisk movement. Both matter. They are not interchangeable.",
      "Public-health guidelines have shifted toward minutes of moderate-to-vigorous activity (MVPA) — 150 minutes per week is the standard floor. That's roughly 22 minutes a day where your heart rate sits at 64-76% of max.",
      "Step counts capture sedentary-time displacement: every 1,000-step increase from a low base is associated with measurable mortality benefit, with diminishing returns after about 7,500-10,000 daily steps in older adults.",
      "If your day is mostly low-intensity, the highest-leverage change is usually adding 15-20 minutes of something that makes you breathe harder — not pushing your step total higher.",
    ],
  },
  {
    id: 'mood-vital',
    category: 'Mental',
    accent: '#30D158',
    readMinutes: 3,
    title: 'Mood as a vital sign',
    blurb:
      'Subjective signals correlate surprisingly tightly with the objective ones, and they lead, not lag.',
    body: [
      "Self-reported mood and energy aren't soft data. In studies of athletes and shift workers, simple 1-5 mood ratings predicted next-day performance changes earlier and more reliably than any single biometric.",
      "The mechanism: your brain integrates a much wider set of signals than any wearable can — gut state, social context, anticipatory stress, micro-symptoms. The output is the feeling.",
      "Logging mood once a day takes about 4 seconds and turns a single number into a time series. After 3-4 weeks you can usually see one or two reliable upstream factors — for many people, sleep duration the night before sits at the top.",
      "Be honest in the moment. Smoothing toward the middle ('I guess I'm a 3') is the failure mode that erases the signal you wanted.",
    ],
  },
  {
    id: 'circadian',
    category: 'Rhythm',
    accent: '#BF5AF2',
    readMinutes: 3,
    title: 'Reading your circadian rhythm',
    blurb:
      'The body runs on a roughly 24-hour clock that hates surprises. Most fatigue is rhythm misalignment, not effort.',
    body: [
      "Core body temperature, cortisol, melatonin, and digestive function all run on overlapping circadian cycles anchored mostly by morning light and meal timing. Disrupt any of these for several days and the others drift.",
      "Light is the master cue. 10-15 minutes of bright outdoor light within an hour of waking is the highest-leverage circadian intervention available. It's roughly 100x stronger than indoor lighting, regardless of how bright a room feels.",
      "Late-evening light — especially blue-rich screens within an hour of bed — pushes melatonin onset later and shortens deep sleep. The effect is real but small for most people; the larger lever is bedtime consistency.",
      "Jet lag, shift work, and even social jetlag (sleeping in 2+ hours later on weekends) produce measurably different cardiovascular and mood profiles than living on a steady schedule, even with the same total sleep.",
      "Consistency beats optimization.",
    ],
  },
];

export function pickRelevantModules(snapshot) {
  // snapshot: { restingHR, restingHRBaseline, hrv, hrvBaseline, sleepHours, steps, mood }
  // Returns all modules ordered by relevance (most relevant first).
  const scored = LEARNING_MODULES.map((m) => ({ module: m, score: 0 }));

  const find = (id) => scored.find((s) => s.module.id === id);

  if (snapshot) {
    const { restingHR, restingHRBaseline, hrv, hrvBaseline, sleepHours, steps, activeMinutes } = snapshot;

    if (restingHRBaseline && restingHR && restingHR - restingHRBaseline >= 4) {
      const t = find('rhr-baseline');
      if (t) t.score += 5;
    }
    if (hrvBaseline && hrv && hrvBaseline - hrv >= 6) {
      const t = find('hrv-explained');
      if (t) t.score += 5;
    }
    if (sleepHours != null && sleepHours < 6.5) {
      const t = find('sleep-debt');
      if (t) t.score += 5;
      const c = find('circadian');
      if (c) c.score += 2;
    }
    if (steps != null && steps < 5000) {
      const t = find('steps-vs-active');
      if (t) t.score += 4;
    }
    if (activeMinutes != null && activeMinutes < 15) {
      const t = find('steps-vs-active');
      if (t) t.score += 2;
    }
    if (snapshot.mood == null) {
      const t = find('mood-vital');
      if (t) t.score += 1;
    }
  }

  // Stable secondary sort by index so order is deterministic when scores tie.
  return scored
    .map((s, i) => ({ ...s, idx: i }))
    .sort((a, b) => b.score - a.score || a.idx - b.idx)
    .map((s) => s.module);
}
