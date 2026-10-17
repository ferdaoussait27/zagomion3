import { useEffect, useState } from 'react';
import { Check, ChevronDown, ChevronUp, Orbit, RotateCcw } from 'lucide-react';

type Choice = { id: string; title: string; detail?: string };
type MatchRow = { id: string; label: string; options: { id: string; label: string }[] };
type Step = {
  title: string;
  situation: string;
  nova: string;
  activity: string;
  mode: 'multi' | 'single' | 'matching' | 'ordering';
  choices?: Choice[];
  correct?: string[];
  rows?: MatchRow[];
  order?: { id: string; label: string }[];
  explanation: string;
};
type SavedState = { current: number; completed: number[]; started: boolean; finished: boolean };
type AnswerState = Record<string, string[] | string>;

const STORAGE_KEY = 'life-space-mission-v1';

const steps: Step[] = [
  {
    title: 'Welcome aboard, Commander',
    situation: 'Nova is checking the station before the next crew arrives. First, she needs to know where she is and what people need to stay alive.',
    nova: 'Can you spot our home in orbit and the basic things that keep a crew healthy?',
    activity: 'Select the space station and every basic survival resource.',
    mode: 'multi',
    choices: [
      { id: 'station', title: 'Space station', detail: 'A home and science lab orbiting Earth' },
      { id: 'air', title: 'Clean, breathable air', detail: 'Oxygen and safe cabin air' },
      { id: 'water', title: 'Water', detail: 'For drinking and daily needs' },
      { id: 'food', title: 'Nutritious food', detail: 'Energy for the crew' },
      { id: 'comet', title: 'A passing comet', detail: 'A space object, not a station resource' },
      { id: 'moon', title: 'The Moon', detail: 'A world, not a crew supply' },
    ],
    correct: ['station', 'air', 'water', 'food'],
    explanation: 'A space station is a crew’s home and workplace. People need safe air, water, and food there just as they do on Earth.',
  },
  {
    title: 'Pack a float-friendly lunch',
    situation: 'It is lunchtime, but things do not fall down in microgravity. Loose crumbs and floating drops can become a problem around equipment.',
    nova: 'Help me choose a tidy meal, a drink that stays contained, and food that is prepared to eat safely.',
    activity: 'Choose all the suitable meal items. Leave loose crumbs and free-floating liquid behind.',
    mode: 'multi',
    choices: [
      { id: 'pouch', title: 'Sealed meal pouch', detail: 'A ready-to-eat meal that stays together' },
      { id: 'drink', title: 'Drink pouch with a straw', detail: 'The drink is contained until needed' },
      { id: 'fruit', title: 'Prepared bite-size fruit', detail: 'Washed pieces, secured for the meal' },
      { id: 'bread', title: 'A crusty loaf to tear apart', detail: 'Loose crumbs can float into vents' },
      { id: 'glass', title: 'An open cup of water', detail: 'Free droplets can drift around' },
      { id: 'soda', title: 'Fizzy drink poured in a bowl', detail: 'Open liquid is hard to control' },
    ],
    correct: ['pouch', 'drink', 'fruit'],
    explanation: 'Astronaut meals are designed for microgravity. Contained drinks and food that does not shed crumbs help protect eyes, equipment, and air filters.',
  },
  {
    title: 'Make every drop count',
    situation: 'The water stores are precious. Nova wants to keep clean, stay hydrated, and avoid wasting water.',
    nova: 'Which choices help the crew use water thoughtfully?',
    activity: 'Select every responsible water-use action.',
    mode: 'multi',
    choices: [
      { id: 'drink', title: 'Drink the amount planned for the day', detail: 'Staying hydrated matters' },
      { id: 'wipe', title: 'Use a damp cloth for a quick clean', detail: 'Use only what the task needs' },
      { id: 'report', title: 'Tell the crew if a water line leaks', detail: 'A small leak can waste a lot' },
      { id: 'run', title: 'Let a tap run while brushing', detail: 'Water would drift or be wasted' },
      { id: 'extra', title: 'Use extra water just in case', detail: 'Unneeded water is still a resource' },
    ],
    correct: ['drink', 'wipe', 'report'],
    explanation: 'Water is limited on a spacecraft. Crew members plan their use, prevent leaks, and recover water when possible.',
  },
  {
    title: 'Give the air team its jobs',
    situation: 'The station continually manages cabin air. A sensor reading says the air needs attention before the crew can rely on it.',
    nova: 'Match each life-support job with what it does. Cabin air must be treated and checked—not simply assumed safe.',
    activity: 'Choose the correct job for each system.',
    mode: 'matching',
    rows: [
      { id: 'oxygen', label: 'Oxygen supply', options: [{ id: 'oxygen', label: 'Adds oxygen to cabin air' }, { id: 'co2', label: 'Removes carbon dioxide' }, { id: 'monitor', label: 'Checks air readings' }] },
      { id: 'removal', label: 'Carbon-dioxide removal', options: [{ id: 'oxygen', label: 'Adds oxygen to cabin air' }, { id: 'co2', label: 'Removes carbon dioxide' }, { id: 'monitor', label: 'Checks air readings' }] },
      { id: 'monitoring', label: 'Cabin-air monitoring', options: [{ id: 'oxygen', label: 'Adds oxygen to cabin air' }, { id: 'co2', label: 'Removes carbon dioxide' }, { id: 'monitor', label: 'Checks air readings' }] },
    ],
    explanation: 'Life-support equipment supplies oxygen, removes carbon dioxide, and monitors cabin conditions. These systems work together to maintain safe air.',
  },
  {
    title: 'Follow a water drop home',
    situation: 'A drop of used water is headed for the station’s recovery equipment. The real water-recovery system has many careful treatment and checking stages.',
    nova: 'Put this simplified model in order. It is only a learning model: real ECLSS water treatment is more complex.',
    activity: 'Move the stages into the right order using the up and down controls.',
    mode: 'ordering',
    order: [
      { id: 'collect', label: 'Collect used water for processing' },
      { id: 'filter', label: 'Filter out particles and impurities' },
      { id: 'treat', label: 'Treat the water and check its quality' },
      { id: 'reuse', label: 'Store approved water for reuse' },
    ],
    explanation: 'Station systems recover water from several sources, then process and check it. This simplified sequence leaves out many real treatment steps.',
  },
  {
    title: 'Freshen up with less water',
    situation: 'After a busy day, Nova needs to freshen up. A shower with a stream of water is not practical in microgravity.',
    nova: 'Choose supplies that work in a small amount of water and keep the station tidy.',
    activity: 'Select the suitable hygiene choices.',
    mode: 'multi',
    choices: [
      { id: 'cloth', title: 'A damp washcloth', detail: 'A small amount of water goes a long way' },
      { id: 'soap', title: 'No-rinse soap', detail: 'Made for washing without a shower' },
      { id: 'towel', title: 'A towel secured after use', detail: 'Keeps it from floating away' },
      { id: 'shower', title: 'A long running shower', detail: 'Uses lots of water and is hard to contain' },
      { id: 'loose', title: 'Loose wet wipes left floating', detail: 'Used supplies must be managed' },
    ],
    correct: ['cloth', 'soap', 'towel'],
    explanation: 'Astronauts use special no-rinse products and small amounts of water. Securing and disposing of used items keeps the cabin safe and clean.',
  },
  {
    title: 'Keep muscles mission-ready',
    situation: 'In microgravity, the body does not work against gravity in the same way it does on Earth. Without regular activity, muscles and bones can become weaker.',
    nova: 'Help me plan exercise that gives my body useful work while I float.',
    activity: 'Select the exercise plan that helps support muscles and bones.',
    mode: 'single',
    choices: [
      { id: 'plan', title: 'Use the station exercise equipment regularly', detail: 'A planned mix of resistance and aerobic exercise' },
      { id: 'rest', title: 'Skip exercise and float all day', detail: 'The body would get less useful activity' },
      { id: 'arms', title: 'Only wave my arms once a week', detail: 'Not a regular full exercise plan' },
    ],
    correct: ['plan'],
    explanation: 'Astronauts follow regular exercise plans using special equipment. Exercise helps reduce muscle and bone loss during long stays in microgravity.',
  },
  {
    title: 'Settle in for space sleep',
    situation: 'Night is coming to the station. In microgravity, Nova could float into equipment if she is not secured.',
    nova: 'Choose a safe sleep setup and a routine that helps the body rest.',
    activity: 'Select all the parts of a safe space-sleep routine.',
    mode: 'multi',
    choices: [
      { id: 'bag', title: 'Secure a sleeping bag to a safe spot', detail: 'It keeps the sleeper from drifting' },
      { id: 'routine', title: 'Keep a regular sleep and wake time', detail: 'A routine helps the body rest' },
      { id: 'quiet', title: 'Make time for a calm wind-down', detail: 'A quieter routine can help prepare for sleep' },
      { id: 'float', title: 'Sleep loose beside the control panel', detail: 'Drifting could cause a bump or block access' },
      { id: 'skip', title: 'Stay awake whenever work is interesting', detail: 'The crew needs enough rest' },
    ],
    correct: ['bag', 'routine', 'quiet'],
    explanation: 'Astronauts sleep in secured sleeping bags and follow schedules. Good rest supports health, attention, and safe teamwork.',
  },
  {
    title: 'Grow, sort, and reuse',
    situation: 'Nova is checking a small plant experiment and sorting the day’s supplies. Plants are useful research partners, but they cannot do every life-support job.',
    nova: 'Help care for the experiment and keep useful materials in the right place.',
    activity: 'Select the helpful plant-care and waste-management actions.',
    mode: 'multi',
    choices: [
      { id: 'care', title: 'Give the plant planned light and water', detail: 'Follow the experiment instructions' },
      { id: 'observe', title: 'Record how the plant grows', detail: 'Observations help researchers learn' },
      { id: 'sort', title: 'Sort and store waste as instructed', detail: 'Some materials can be reused or recycled' },
      { id: 'replace', title: 'Ask the plant to replace all air systems', detail: 'Plants do not replace all life support' },
      { id: 'discard', title: 'Throw every useful material away', detail: 'This misses chances to reuse resources' },
    ],
    correct: ['care', 'observe', 'sort'],
    explanation: 'Plant experiments help researchers learn about growing food and supporting crews. Plants are valuable, but stations still need dedicated air, water, and waste systems.',
  },
  {
    title: 'Bring the lesson back to Earth',
    situation: 'The mission is nearly complete. Nova has cared for her crew and station. Now she is thinking about the one home we all share: Earth.',
    nova: 'Connect our space-care lessons to choices that protect ecosystems at home.',
    activity: 'Choose the ideas that help care for Earth and life in space.',
    mode: 'multi',
    choices: [
      { id: 'water', title: 'Use water carefully and prevent leaks', detail: 'Clean water matters in both places' },
      { id: 'reuse', title: 'Reuse and recycle useful materials', detail: 'Less waste protects resources' },
      { id: 'habitats', title: 'Protect habitats and the living things in them', detail: 'Healthy ecosystems support life' },
      { id: 'waste', title: 'Waste resources because they seem endless', detail: 'Resources and ecosystems have limits' },
      { id: 'pollute', title: 'Let pollution spread into air and water', detail: 'Pollution can harm living things' },
    ],
    correct: ['water', 'reuse', 'habitats'],
    explanation: 'Space stations make resource limits easy to see. Caring for water, reducing waste, and protecting habitats also help keep Earth’s ecosystems healthy.',
  },
];

function getStartingOrder(step: Step) {
  return [...(step.order ?? [])].reverse();
}

const blankState: SavedState = { current: -1, completed: [], started: false, finished: false };

function loadProgress(): SavedState {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Partial<SavedState> | null;
    if (!parsed || !Array.isArray(parsed.completed)) return blankState;
    const completed = parsed.completed.filter((step) => Number.isInteger(step) && step >= 0 && step < steps.length);
    const current = typeof parsed.current === 'number' ? Math.min(Math.max(parsed.current, -1), steps.length) : -1;
    return { current, completed, started: Boolean(parsed.started), finished: Boolean(parsed.finished && completed.length === steps.length) };
  } catch {
    return blankState;
  }
}

function App() {
  const [saved, setSaved] = useState<SavedState>(loadProgress);
  const [answers, setAnswers] = useState<AnswerState>({});
  const [feedback, setFeedback] = useState<'error' | 'success' | null>(() => {
    const progress = loadProgress();
    return progress.completed.includes(progress.current) ? 'success' : null;
  });
  const [notice, setNotice] = useState('');
  const [confirmRestart, setConfirmRestart] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  }, [saved]);

  useEffect(() => {
    if (!confirmRestart) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setConfirmRestart(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [confirmRestart]);

  const step = steps[saved.current];
  const completedCount = saved.completed.length;
  const clearFeedback = () => {
    if (feedback === 'success' && saved.current >= 0) {
      setSaved((previous) => ({ ...previous, completed: previous.completed.filter((index) => index !== previous.current) }));
    }
    setFeedback(null);
    setNotice('');
  };

  function toggle(id: string) {
    const existing = answers.selected;
    const selected = Array.isArray(existing) ? existing : [];
    setAnswers({ ...answers, selected: selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id] });
    clearFeedback();
  }

  function choose(id: string) {
    setAnswers({ ...answers, selected: id });
    clearFeedback();
  }

  function setMatch(rowId: string, value: string) {
    setAnswers({ ...answers, [rowId]: value });
    clearFeedback();
  }

  function moveOrder(id: string, direction: -1 | 1) {
    if (!step?.order) return;
    const current = Array.isArray(answers.order) ? answers.order as string[] : getStartingOrder(step).map((item) => item.id);
    const index = current.indexOf(id);
    const target = index + direction;
    if (target < 0 || target >= current.length) return;
    const next = [...current];
    [next[index], next[target]] = [next[target], next[index]];
    setAnswers({ ...answers, order: next });
    clearFeedback();
  }

  function validate() {
    if (!step) return;
    let correct = false;
    if (step.mode === 'multi' || step.mode === 'single') {
      const selected = step.mode === 'single'
        ? (typeof answers.selected === 'string' ? [answers.selected] : [])
        : (Array.isArray(answers.selected) ? answers.selected : []);
      const expected = step.correct ?? [];
      const enough = selected.length === expected.length;
      correct = enough && expected.every((id) => selected.includes(id));
      if (!selected.length) {
        setFeedback('error');
        setNotice('Choose an answer first. Take your time, Commander.');
        return;
      }
    } else if (step.mode === 'matching') {
      const rows = step.rows ?? [];
      const allFilled = rows.every((row) => typeof answers[row.id] === 'string');
      if (!allFilled) {
        setFeedback('error');
        setNotice('A couple of jobs still need a match. You can do it.');
        return;
      }
      correct = rows.every((row) => answers[row.id] === row.id);
    } else {
      const expected = step.order?.map((item) => item.id) ?? [];
      const order = Array.isArray(answers.order) ? answers.order as string[] : getStartingOrder(step).map((item) => item.id);
      correct = expected.every((id, index) => order[index] === id);
    }
    setFeedback(correct ? 'success' : 'error');
    setNotice(correct
      ? 'Mission action confirmed. Read Nova’s science note, then choose when you are ready to move on.'
      : step.mode === 'single'
        ? 'That plan is not quite safe for Nova yet. Try another choice.'
        : 'Not quite yet. Check each choice and try again—there is no rush.');
    if (correct) {
      setSaved((previous) => ({
        ...previous,
        completed: previous.completed.includes(previous.current) ? previous.completed : [...previous.completed, previous.current].sort((a, b) => a - b),
      }));
    }
  }

  function continueStep() {
    if (feedback !== 'success') return;
    const next = saved.current + 1;
    setSaved((previous) => ({ ...previous, current: next, finished: next >= steps.length }));
    setAnswers({});
    setFeedback(null);
    setNotice('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function startMission() {
    setSaved((previous) => ({ ...previous, current: 0, started: true, finished: false }));
    setAnswers({});
    setFeedback(null);
    setNotice('');
  }

  function restartMission() {
    setSaved({ current: -1, completed: [], started: false, finished: false });
    setAnswers({});
    setFeedback(null);
    setNotice('');
    setConfirmRestart(false);
  }

  const progressPercent = Math.round(completedCount / steps.length * 100);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand" data-testid="text-product-name"><span className="brand-mark"><Orbit size={22} strokeWidth={2.4} /></span><span>Galakidd</span></div>
        <div className="top-actions">
          <span className="mission-tag">Nova’s station mission</span>
          {(saved.started || completedCount > 0) && <button className="restart" type="button" data-testid="button-restart-mission" onClick={() => setConfirmRestart(true)}><RotateCcw size={14} /> Restart mission</button>}
        </div>
      </header>
      <main className="main-wrap">
        <section className="hero" aria-label="Mission introduction">
          <div className="hero-copy">
            <div className="eyebrow">A hands-on space adventure</div>
            <h1>Keep Nova’s station healthy.</h1>
            <p>You’re mission commander. Make smart choices, explore real science, and help Nova care for life far from Earth.</p>
          </div>
          <div className="nova-scene" aria-hidden="true">
            <span className="planet" /><i className="star star-a" /><i className="star star-b" /><i className="star star-c" />
            <div className="astronaut"><span className="astro-head"><i className="astro-glass" /></span><span className="astro-body"><i className="astro-patch" /></span><i className="astro-arm left" /><i className="astro-arm right" /></div>
          </div>
        </section>

        <section className="progress-card" aria-label="Mission progress" data-testid="status-mission-progress">
          <span className="progress-label">Mission progress</span>
          <div className="progress-track" role="progressbar" aria-label="Completed mission steps" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={completedCount}><div className="progress-fill" style={{ width: `${progressPercent}%` }} /></div>
          <span className="progress-count">{completedCount} / {steps.length} steps</span>
        </section>

        {!saved.started ? (
          <section className="welcome-card" aria-labelledby="welcome-title">
            <div className="eyebrow">Your mission starts here</div>
            <h2 id="welcome-title">Ready to take command?</h2>
            <p>Life on a space station takes teamwork and clever systems. Across ten short mission steps, you’ll help Nova make choices about air, water, food, movement, rest, and the living things around us.</p>
            <ul className="welcome-list">
              <li><span>01</span> Explore one station challenge at a time.</li>
              <li><span>02</span> Try again whenever a choice needs a rethink.</li>
              <li><span>03</span> Your progress is saved on this device.</li>
            </ul>
            <button className="primary-btn" type="button" onClick={startMission} data-testid="button-launch-mission">Launch the mission</button>
          </section>
        ) : saved.finished ? (
          <section className="complete-card" aria-labelledby="complete-title" data-testid="status-mission-complete">
            <div className="complete-mark" aria-hidden="true"><Check size={36} /></div>
            <div className="eyebrow" style={{ justifyContent: 'center' }}>Mission complete</div>
            <h2 id="complete-title">Nova’s station is in good hands.</h2>
            <p>You helped protect a crew by caring for air, water, food, exercise, rest, plants, and resources. Those same careful choices help protect the connected ecosystems we all depend on here on Earth.</p>
            <p><strong>Commander’s final note:</strong> Life in space depends on teamwork—and so does life on our planet.</p>
            <button className="primary-btn" type="button" onClick={() => setConfirmRestart(true)} data-testid="button-restart-complete">Start the mission again</button>
          </section>
        ) : step ? (
          <div className="mission-grid">
            <section className="step-card" aria-labelledby="step-title" data-testid={`card-mission-step-${saved.current + 1}`}>
              <div className="step-kicker">
                <span className="step-num">Mission step {String(saved.current + 1).padStart(2, '0')} / {steps.length}</span>
                <span className="activity-type">{step.mode === 'multi' ? 'Select all that fit' : step.mode === 'single' ? 'Choose one plan' : step.mode === 'matching' ? 'Match the jobs' : 'Put in order'}</span>
              </div>
              <h2 id="step-title">{step.title}</h2>
              <p className="step-intro">{step.situation}</p>
              <div className="nova-note"><span className="nova-dot" aria-hidden="true">N</span><span><strong>Nova says:</strong> {step.nova}</span></div>
              <p className="activity-heading">{step.activity}</p>

              {(step.mode === 'multi' || step.mode === 'single') && (
                <div className="option-grid" role={step.mode === 'single' ? 'radiogroup' : 'group'} aria-label={step.mode === 'single' ? 'Choose one answer' : 'Choose all answers'}>
                  {step.choices?.map((choice, index) => {
                    const selected = step.mode === 'single'
                      ? answers.selected === choice.id
                      : Array.isArray(answers.selected) && answers.selected.includes(choice.id);
                    return <button
                      key={choice.id}
                      type="button"
                      className={`option${selected ? ' selected' : ''}`}
                      aria-pressed={Boolean(selected)}
                      data-testid={`option-step-${saved.current + 1}-${choice.id}`}
                      onClick={() => step.mode === 'single' ? choose(choice.id) : toggle(choice.id)}
                    ><span className="option-symbol">{selected ? <Check size={15} /> : String.fromCharCode(65 + index)}</span><span className="option-copy">{choice.title}{choice.detail && <span className="option-sub">{choice.detail}</span>}</span></button>;
                  })}
                </div>
              )}

              {step.mode === 'matching' && (
                <div className="pair-list">
                  {step.rows?.map((row) => <div className="pair-row" key={row.id}>
                    <label className="pair-term" htmlFor={`match-${row.id}`}>{row.label}</label>
                    <select className="pair-select" id={`match-${row.id}`} data-testid={`select-match-${row.id}`} value={typeof answers[row.id] === 'string' ? answers[row.id] as string : ''} onChange={(event) => setMatch(row.id, event.target.value)}>
                      <option value="">Choose a job...</option>
                      {row.options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                    </select>
                  </div>)}
                </div>
              )}

              {step.mode === 'ordering' && (
                <div className="order-list" aria-label="Water recovery process order">
                  {(Array.isArray(answers.order) ? (answers.order as string[]).map((id) => step.order?.find((item) => item.id === id)).filter((item): item is { id: string; label: string } => Boolean(item)) : getStartingOrder(step)).map((item, index, list) => <div className="order-item" key={item.id} data-testid={`order-stage-${item.id}`}>
                    <span className="order-index">{String(index + 1).padStart(2, '0')}</span><span className="order-text">{item.label}</span>
                    <span className="move-buttons">
                      <button type="button" className="move-btn" aria-label={`Move ${item.label} up`} data-testid={`button-move-${item.id}-up`} disabled={index === 0} onClick={() => moveOrder(item.id, -1)}><ChevronUp size={17} /></button>
                      <button type="button" className="move-btn" aria-label={`Move ${item.label} down`} data-testid={`button-move-${item.id}-down`} disabled={index === list.length - 1} onClick={() => moveOrder(item.id, 1)}><ChevronDown size={17} /></button>
                    </span>
                  </div>)}
                </div>
              )}

              {feedback && <div className={`feedback ${feedback}`} role="status" aria-live="polite" data-testid={`status-step-${feedback}`}>
                {feedback === 'success' ? <><strong>Step complete, Commander.</strong>{step.explanation}</> : <><strong>Let’s think it through together.</strong>{notice}</>}
              </div>}
              <div className="step-actions">
                {feedback === 'success'
                  ? <button className="primary-btn" type="button" onClick={continueStep} data-testid="button-continue-next-step">Continue to Next Step</button>
                  : <button className="primary-btn" type="button" onClick={validate} data-testid="button-validate-step">Validate Step</button>}
              </div>
            </section>
            <aside className="side-panel" aria-label="Mission step navigation and status">
              <h3 className="side-title">Flight plan</h3>
              <div className="mission-steps" aria-label={`${completedCount} of ${steps.length} steps complete`}>
                {steps.map((item, index) => {
                  const done = saved.completed.includes(index);
                  return <div key={item.title} className={`mission-step${saved.current === index ? ' current' : ''}${done ? ' done' : ''}`} aria-current={saved.current === index ? 'step' : undefined} data-testid={`status-flight-step-${index + 1}`}>
                    <span className="step-bullet">{done ? <Check size={13} /> : String(index + 1).padStart(2, '0')}</span><span className="step-name">{item.title}</span>
                  </div>;
                })}
              </div>
              <div className="side-tip"><strong>Commander’s tip</strong>There is no timer. Read Nova’s note, make a choice, and try again if you need to.</div>
            </aside>
          </div>
        ) : null}
        <footer className="tiny-footer">Galakidd · One crew, one careful choice at a time</footer>
      </main>

      {confirmRestart && <div className="restart-modal" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setConfirmRestart(false); }}>
        <section className="modal-box" role="dialog" aria-modal="true" aria-labelledby="restart-title" data-testid="dialog-restart-confirmation">
          <h2 id="restart-title">Restart the mission?</h2>
          <p>Your completed steps and current place will be cleared from this device. Are you sure you want to begin again?</p>
          <div className="modal-actions">
            <button type="button" className="secondary-btn" onClick={() => setConfirmRestart(false)} data-testid="button-cancel-restart">Keep my progress</button>
            <button type="button" className="primary-btn" onClick={restartMission} data-testid="button-confirm-restart">Clear and restart</button>
          </div>
        </section>
      </div>}
    </div>
  );
}

export default App;
