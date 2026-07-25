import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlignCenter,
  AlignLeft,
  Bold,
  Calculator,
  Check,
  CheckCircle2,
  Clock3,
  ChevronLeft,
  ChevronRight,
  ClipboardPaste,
  Copy,
  ExternalLink,
  Expand,
  FileText,
  Flag,
  Gauge,
  Grid3X3,
  Home,
  Italic,
  Keyboard,
  List,
  ListOrdered,
  LockKeyhole,
  Menu,
  PenLine,
  Pause,
  Play,
  Redo2,
  RotateCcw,
  Ruler,
  Scissors,
  Square,
  Underline,
  Undo2,
  Volume2,
  VolumeX,
  X,
  XCircle,
  ZoomIn,
} from 'lucide-react';
import { loadPracticeTest, savePracticeSubmission, scorePracticeTest } from './questionBank.js';
import {
  clearActivePracticeSession,
  clearLivePracticeMistakes,
  notifyLiveMistakesChanged,
  practiceProgressKey,
  practiceSessionId,
  readActivePracticeSession,
  saveActivePracticeSession,
} from './practiceSession.js';
import { formatAudioTime, useMicrosoftTts } from './useMicrosoftTts.js';

const DOMAINS = {
  3: ['Writing', 'Reading', 'Conventions of language', 'Numeracy'],
  5: ['Writing', 'Reading', 'Conventions of language', 'Numeracy'],
  7: ['Writing', 'Reading', 'Conventions of language', 'Numeracy'],
  9: ['Writing', 'Reading', 'Conventions of language', 'Numeracy'],
};

const DOMAIN_ALTERNATIVES = {
  Reading: 'Visual alternative questions',
  'Conventions of language': 'Audio alternative questions',
  Numeracy: 'Visual alternative questions',
  Writing: 'Standard test',
};

function getInitialExamRoute() {
  const params = new URLSearchParams(window.location.search);
  const requestedYear = Number(params.get('year'));
  const requestedDomain = params.get('domain');
  const year = DOMAINS[requestedYear] ? requestedYear : 3;
  const domain = DOMAINS[year].includes(requestedDomain) ? requestedDomain : 'Reading';
  const hasDeepLink = params.has('year') || params.has('domain');

  return {
    year,
    domain,
    hasDeepLink,
    screen: hasDeepLink
      ? (domain === 'Writing' ? 'writing-task' : 'variant')
      : 'years',
  };
}

function useStageViewport() {
  const [viewport, setViewport] = useState(() => ({
    width: typeof window === 'undefined' ? 1024 : window.innerWidth,
    height: typeof window === 'undefined' ? 768 : window.innerHeight,
  }));

  useEffect(() => {
    const update = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return viewport;
}

function LogoHeader({ zoomOpen, setZoomOpen, onZoom }) {
  return (
    <header className="logo-header">
      <button
        className="zoom-button"
        aria-label="Change zoom level"
        onClick={() => setZoomOpen((open) => !open)}
      >
        <ZoomIn size={32} strokeWidth={2.8} />
      </button>
      <div className="brand-logo brand-logo-acara">
        <img src="/assets/lumora-learning-logo.png?v=2" alt="Lumora Learning Studio" />
      </div>
      <div className="brand-logo brand-logo-nap">
        <img src="/assets/skillspring-logo.png?v=2" alt="SkillSpring Practice Program" />
      </div>
      {zoomOpen && <ZoomMenu onZoom={onZoom} />}
    </header>
  );
}

function ZoomMenu({ onZoom, currentZoom = '100%' }) {
  return (
    <div className="zoom-menu" role="menu" aria-label="Zoom level">
      {['100%', '150%', '200%', '300%', 'Fit'].map((label) => (
        <button
          key={label}
          role="menuitem"
          className={currentZoom === label ? 'selected' : ''}
          aria-label={label === 'Fit' ? 'Fit test to screen' : `Zoom to ${label}`}
          onClick={() => onZoom(label)}
        >
          {label === 'Fit' ? <Expand size={25} /> : label}
        </button>
      ))}
    </div>
  );
}

function LogoFooter({ onRestart }) {
  return (
    <footer className="logo-footer">
      <div className="footer-left">
        <span>© Copyright</span>
        <img src="/assets/independent-learning-logo.png?v=2" alt="Independent Learning Project" />
      </div>
      <div className="footer-right">
        <img src="/assets/brightpath-tools-logo.png?v=2" alt="BrightPath Tools" />
        <button className="link-button">Use &amp; privacy</button>
        <button className="close-button" aria-label="Close application" onClick={() => window.location.assign('/')}>
          <X size={25} />
        </button>
      </div>
    </footer>
  );
}

function BrandShell({ children, onRestart, zoomOpen, setZoomOpen, onZoom, contentClass = '' }) {
  return (
    <div className="brand-shell">
      <LogoHeader zoomOpen={zoomOpen} setZoomOpen={setZoomOpen} onZoom={onZoom} />
      <main className={`brand-content ${contentClass}`}>{children}</main>
      <LogoFooter onRestart={onRestart} />
    </div>
  );
}

function MenuCard({ title, items, onSelect, backLabel, onBack, compact = false }) {
  return (
    <section className={`menu-card ${compact ? 'menu-card-compact' : ''}`}>
      <h1>{title}</h1>
      <div className="menu-card-rule" />
      <div className="menu-buttons">
        {items.map((item) => {
          const label = typeof item === 'string' ? item : item.label;
          const value = typeof item === 'string' ? item : item.value;
          return (
            <button key={label} onClick={() => onSelect(value)}>
              {label}
            </button>
          );
        })}
        {onBack && <button onClick={onBack}>{backLabel || 'Back'}</button>}
      </div>
    </section>
  );
}

function ThemeCard({ theme, setTheme, onBack }) {
  return (
    <section className="menu-card theme-card">
      <h1>Colour themes</h1>
      <div className="menu-card-rule" />
      <div className="theme-grid">
        {[
          ['standard', 'Black on white'],
          ['blue', 'Black on blue'],
          ['lilac', 'Black on lilac'],
          ['dark', 'White on black'],
        ].map(([value, label]) => (
          <button
            key={value}
            className={`theme-choice theme-choice-${value} ${theme === value ? 'selected' : ''}`}
            onClick={() => setTheme(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <button className="theme-back" onClick={onBack}>Back</button>
    </section>
  );
}

function Year3WritingNotice({ writingTask, onBack, onStart }) {
  return (
    <section className="year3-writing-notice">
      <span className="paper-badge"><FileText size={20} /> Year 3 paper writing</span>
      <h1>Year 3 writing is completed on paper</h1>
      <p className="notice-lead">
        This is a paper-writing practice flow for the {writingTask === 'Narrative Task' ? 'narrative' : 'persuasive'} task.
        It is not an online Year 3 writing test.
      </p>
      <div className="paper-flow-steps">
        <article>
          <span>1</span>
          <PenLine size={27} />
          <div><strong>Child writes on paper</strong><p>Open the prompt, use paper and pencil, and complete the response under the 40-minute practice timer.</p></div>
        </article>
        <article>
          <span>2</span>
          <Keyboard size={27} />
          <div><strong>Parent enters the original response</strong><p>This app does not use handwriting OCR. Type the work exactly as written, without correcting spelling, punctuation, paragraphs or wording.</p></div>
        </article>
      </div>
      <p className="official-paper-note">
        NAP explains that all Year 3 students complete the writing test on paper, so there is no official Year 3 online writing demonstration.
      </p>
      <div className="paper-notice-links">
        <a href="https://www.nap.edu.au/naplan/whats-in-the-tests" target="_blank" rel="noreferrer">
          Official writing information <ExternalLink size={15} />
        </a>
        <a href="https://www.nap.edu.au/naplan/public-demonstration-site" target="_blank" rel="noreferrer">
          Official demonstration-site note <ExternalLink size={15} />
        </a>
      </div>
      <footer>
        <button type="button" onClick={onBack}>Back</button>
        <button type="button" className="large-primary" onClick={onStart}>Open paper writing prompt</button>
      </footer>
    </section>
  );
}

function CodeBoxes({ value, grouping }) {
  const groups = [];
  let cursor = 0;
  grouping.forEach((size) => {
    groups.push(value.slice(cursor, cursor + size));
    cursor += size;
  });

  return (
    <div className="code-boxes" aria-label={value.split('').join(' ')}>
      {groups.map((group, groupIndex) => (
        <div className="code-group" key={`${group}-${groupIndex}`}>
          {group.split('').map((letter, index) => (
            <span key={`${letter}-${index}`}>{letter}</span>
          ))}
          {groupIndex < groups.length - 1 && <i />}
        </div>
      ))}
    </div>
  );
}

function LoginScreen({ type, onNext }) {
  const session = type === 'session';
  const title = 'National Assessment Program Example Test';
  return (
    <section className="login-screen">
      <h1>{title}</h1>
      <p>
        {session
          ? 'In NAP online tests, students enter the session code provided by their teacher. A practice code has been generated for this UI study. Select Next to continue.'
          : 'In NAP online tests, students enter a student code provided on a paper slip. A practice code has been generated for you. Select Next to continue.'}
      </p>
      <CodeBoxes value={session ? 'NAPUILAB' : 'STUDENT1'} grouping={session ? [3, 2, 3] : [2, 2, 2, 2]} />
      <button className="large-primary" onClick={onNext}>Next</button>
    </section>
  );
}

function IdentityScreen({ grade, domain, onYes, onNo }) {
  return (
    <section className="identity-card">
      <h1>{domain} Demonstration Test Year {grade}</h1>
      <p>In NAP online tests, students are shown their name and select Yes to confirm their identity.</p>
      <div className="identity-name">
        <span>Are You</span>
        <strong>Example Test Student?</strong>
      </div>
      <div className="two-buttons">
        <button onClick={onNo}>No</button>
        <button onClick={onYes}>Yes</button>
      </div>
    </section>
  );
}

function Dashboard({ grade, domain, onStart }) {
  return (
    <section className="dashboard-card">
      <h1>{domain} Demonstration Test Year {grade}</h1>
      <strong>Example Test Student</strong>
      <button onClick={onStart}>Test</button>
    </section>
  );
}

function AudioBar({ playback, compact = false }) {
  const playing = playback.status === 'playing';
  const loading = playback.status === 'loading';
  const progress = Math.round(Math.min(1, Math.max(0, playback.progress || 0)) * 100);
  return (
    <div className={`audio-bar ${compact ? 'audio-bar-compact' : ''}`}>
      <button
        aria-label={loading ? 'Preparing Microsoft voice' : playing ? 'Pause' : 'Play'}
        aria-busy={loading}
        disabled={loading}
        onClick={playback.toggle}
      >
        {playing
          ? <Pause size={compact ? 17 : 21} fill="currentColor" />
          : <Play size={compact ? 17 : 21} fill="currentColor" />}
      </button>
      <Volume2 size={compact ? 17 : 22} />
      <div
        className="audio-track"
        role="progressbar"
        aria-label="Question audio progress"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={progress}
      >
        <i style={{ width: `${progress}%` }} />
      </div>
      <span>
        {formatAudioTime(playback.currentTime, '0:00')}
        {' / '}
        {formatAudioTime(playback.duration)}
      </span>
      <span className="sr-status" aria-live="polite">
        {loading
          ? 'Preparing Microsoft Windows voice.'
          : playback.error || (playback.voiceName ? `Voice: ${playback.voiceName}.` : '')}
      </span>
    </div>
  );
}

function PlayerToolbar({
  question,
  total,
  showProgress,
  timeHidden,
  setTimeHidden,
  audioVisible,
  setAudioVisible,
  tools,
  toggleTool,
  toolAvailability,
  zoomOpen,
  setZoomOpen,
  onZoom,
  zoomLabel,
  remainingSeconds,
  progressOpen,
}) {
  const [quickOpen, setQuickOpen] = useState(false);
  const zoomed = !['100%', 'Fit'].includes(zoomLabel);
  const forcedTime = remainingSeconds <= 300;
  const displayTime = !timeHidden || forcedTime;
  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

  return (
    <>
      <header className={`player-toolbar ${zoomed ? 'zoomed' : ''}`}>
        {zoomed && (
          <div className="quick-access-wrap">
            <button
              className="quick-access-button"
              aria-label="Show / hide quick access flyout menu"
              aria-expanded={quickOpen}
              onClick={() => setQuickOpen((open) => !open)}
            >
              <Menu size={29} strokeWidth={3} />
            </button>
            {quickOpen && (
              <div className="quick-access-menu">
                <button onClick={() => { showProgress(); setQuickOpen(false); }}>
                  {progressOpen ? 'Return to question' : 'Progress summary'}
                </button>
                <button onClick={() => { setTimeHidden((hidden) => !hidden); setQuickOpen(false); }}>
                  {timeHidden ? 'Show time' : 'Hide time'}
                </button>
              </div>
            )}
          </div>
        )}
        <button
          className="player-zoom"
          aria-label="Change zoom level"
          aria-expanded={zoomOpen}
          onClick={() => setZoomOpen((open) => !open)}
        >
          <ZoomIn size={31} strokeWidth={2.8} />
        </button>
        <div className="timer">
          {displayTime ? (
            <>
              <div className="timer-digits">{formattedTime}</div>
              <div className="timer-labels"><span>Hours</span><span>Mins</span></div>
              <button
                aria-label={`Time remaining ${hours} Hours ${minutes} Minutes Hide time`}
                onClick={() => setTimeHidden(true)}
              >
                Hide<br />time
              </button>
            </>
          ) : (
            <button
              className="show-time-button"
              aria-label={`Time remaining ${hours} Hours ${minutes} Minutes Show time`}
              onClick={() => setTimeHidden(false)}
            >
              <Clock3 size={31} />
            </button>
          )}
        </div>
        <button
          className="question-progress"
          aria-label={`${total === 1 ? 'Task' : 'Question'} ${question} of ${total} ${progressOpen ? 'Hide' : 'Show'} Progress Summary`}
          onClick={showProgress}
        >
          <span>{total === 1 ? 'Task' : 'Question'}</span>
          <strong>{question} <small>of</small> {total}</strong>
          {total > 1 && <Grid3X3 size={32} />}
        </button>
        <div className="toolbar-spacer" />
        {setAudioVisible && (
          <button className="tool-button" aria-label={audioVisible ? 'Hide audio' : 'Show audio'} onClick={() => setAudioVisible((visible) => !visible)}>
            {audioVisible ? <VolumeX size={29} /> : <Volume2 size={29} />}
          </button>
        )}
        {toggleTool && (
          <>
            {toolAvailability.ruler && (
              <button className={`tool-button ${tools.ruler ? 'active' : ''}`} aria-label="Ruler" onClick={() => toggleTool('ruler')}>
                <Ruler size={30} />
              </button>
            )}
            {toolAvailability.protractor && (
              <button className={`tool-button ${tools.protractor ? 'active' : ''}`} aria-label="Protractor" onClick={() => toggleTool('protractor')}>
                <Gauge size={30} />
              </button>
            )}
            {toolAvailability.calculator && (
              <button className={`tool-button ${tools.calculator ? 'active' : ''}`} aria-label="Calculator" onClick={() => toggleTool('calculator')}>
                <Calculator size={29} />
              </button>
            )}
          </>
        )}
        {zoomOpen && <ZoomMenu onZoom={onZoom} currentZoom={zoomLabel} />}
      </header>
    </>
  );
}

function PlayerFooter({ showBack, onBack, onFlag, flagged, onNext, nextLabel = 'Next', backLabel = 'Back', hideFlag = false }) {
  return (
    <footer className="player-footer">
      <button className={`nav-button back-nav ${showBack ? '' : 'invisible'}`} onClick={onBack}>
        <ChevronLeft size={34} fill="currentColor" />
        <span>{backLabel}</span>
      </button>
      <div className="footer-fill" />
      {!hideFlag && (
        <button
          className={`flag-button ${flagged ? 'flagged' : ''}`}
          aria-label={flagged ? 'Unflag this question' : 'Flag this question'}
          onClick={onFlag}
        >
          <span>{flagged ? 'Unflag' : 'Flag'}</span>
          <Flag size={34} fill={flagged ? 'currentColor' : 'none'} />
        </button>
      )}
      <button className="nav-button next-nav" onClick={onNext}>
        <span>{nextLabel}</span>
        <ChevronRight size={34} fill="currentColor" />
      </button>
    </footer>
  );
}

function ChoiceList({ items, selected, onSelect }) {
  return (
    <div className="choice-list" role="radiogroup" aria-label="Answer choices">
      {items.map((item) => (
        <button
          key={item.id}
          role="radio"
          aria-checked={selected === item.id}
          className={`choice-row ${selected === item.id ? 'selected' : ''}`}
          onClick={() => onSelect(item.id)}
        >
          <i>{selected === item.id && <span />}</i>
          <span>{item.text}</span>
        </button>
      ))}
    </div>
  );
}

function MultipleSelectList({ items, selected, onSelect, maxSelections = 2 }) {
  const values = Array.isArray(selected) ? selected : [];
  const toggle = (id) => {
    if (values.includes(id)) {
      onSelect(values.filter((value) => value !== id));
      return;
    }
    if (values.length < maxSelections) onSelect([...values, id]);
  };
  return (
    <div className="choice-list multi-select-list" role="group" aria-label={`Choose ${maxSelections} answers`}>
      {items.map((item) => {
        const checked = values.includes(item.id);
        return (
          <button
            key={item.id}
            role="checkbox"
            aria-checked={checked}
            className={`choice-row ${checked ? 'selected' : ''}`}
            onClick={() => toggle(item.id)}
          >
            <i>{checked && <Check size={17} strokeWidth={4} />}</i>
            <span>{item.text}</span>
          </button>
        );
      })}
    </div>
  );
}

const COMPOSITE_PUZZLE_LAYOUTS = {
  rocket: [
    { points: '160,18 112,82 208,82', label: [160,58] },
    { points: '112,174 68,236 132,216', label: [105,211] },
    { points: '208,174 252,236 188,216', label: [215,211] },
    { points: '126,214 160,292 174,214', label: [151,245] },
    { points: '166,214 196,292 208,214', label: [190,245] },
    { points: '120,86 200,86 200,166 120,166', label: [160,131] },
    { points: '110,166 210,166 190,214 90,214', label: [151,194] },
  ],
  sailboat: [
    { points: '154,32 154,164 62,164', label: [125,126] },
    { points: '166,52 246,164 166,164', label: [190,129] },
    { points: '154,32 108,48 154,68', label: [139,51] },
    { points: '54,230 108,190 142,230', label: [102,217] },
    { points: '178,230 224,190 276,230', label: [226,217] },
    { points: '130,168 190,168 190,228 130,228', label: [160,203] },
    { points: '66,232 278,232 244,270 32,270', label: [158,255] },
  ],
  house: [
    { points: '40,128 160,26 160,128', label: [119,101] },
    { points: '160,26 280,128 160,128', label: [201,101] },
    { points: '38,248 86,188 124,248', label: [83,229] },
    { points: '196,248 234,188 282,248', label: [238,229] },
    { points: '126,250 194,250 160,302', label: [160,273] },
    { points: '100,130 220,130 220,248 100,248', label: [160,194] },
    { points: '204,66 242,66 224,122 186,122', label: [214,99] },
  ],
  bird: [
    { points: '62,148 14,112 78,164', label: [51,143] },
    { points: '62,190 10,226 82,206', label: [52,207] },
    { points: '112,138 192,146 144,204', label: [148,164] },
    { points: '264,88 304,101 264,114', label: [276,102] },
    { points: '132,210 170,210 150,270', label: [151,236] },
    { points: '214,74 264,74 264,124 214,124', label: [239,104] },
    { points: '98,128 222,128 180,210 56,210', label: [139,179] },
  ],
};

function CompositePuzzleResponse({ item, answer, setAnswer }) {
  const values = Array.isArray(answer) ? answer : [];
  const visual = item.stimulus.visual;
  const layout = COMPOSITE_PUZZLE_LAYOUTS[visual.parameters.layout] ?? COMPOSITE_PUZZLE_LAYOUTS.rocket;
  const palette = ['#ef7772', '#68c2d8', '#f5bf4e', '#7cc581', '#9a7cda', '#f09a54', '#4ca7b8'];
  const toggle = (optionId) => {
    if (values.includes(optionId)) {
      setAnswer(values.filter((value) => value !== optionId));
      return;
    }
    if (values.length < item.interaction.max_selections) setAnswer([...values, optionId]);
  };

  return (
    <div className="composite-puzzle-response">
      <p><strong>Seven pieces:</strong> 5 triangles · 1 square · 1 parallelogram</p>
      <svg viewBox="0 0 320 320" role="group" aria-label={visual.alt_text}>
        <rect x="5" y="5" width="310" height="310" rx="18" className="puzzle-board" />
        {visual.parameters.pieces.map((piece, index) => {
          const option = item.options.find((entry) => entry.text === piece.label);
          const selected = option && values.includes(option.id);
          const geometry = layout[index];
          return (
            <g
              key={piece.id}
              role="checkbox"
              aria-label={`${piece.label}, ${piece.shape}`}
              aria-checked={selected}
              tabIndex="0"
              className={`puzzle-piece ${selected ? 'selected' : ''}`}
              onClick={() => option && toggle(option.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  if (option) toggle(option.id);
                }
              }}
            >
              <polygon points={geometry.points} style={{ '--piece-colour': palette[(index + visual.parameters.palette_shift) % palette.length] }} />
              <text x={geometry.label[0]} y={geometry.label[1]}>{piece.id}</text>
            </g>
          );
        })}
      </svg>
      <small>{values.length} of {item.interaction.max_selections} pieces selected</small>
    </div>
  );
}

const DICE_PIPS = {
  1: [[2, 2]],
  2: [[1, 1], [3, 3]],
  3: [[1, 1], [2, 2], [3, 3]],
  4: [[1, 1], [1, 3], [3, 1], [3, 3]],
  5: [[1, 1], [1, 3], [2, 2], [3, 1], [3, 3]],
  6: [[1, 1], [1, 3], [2, 1], [2, 3], [3, 1], [3, 3]],
};

function DiceFace({ value, compact = false }) {
  return (
    <span className={`dice-face ${compact ? 'compact' : ''}`} aria-hidden="true">
      {DICE_PIPS[value].map(([row, column]) => (
        <i key={`${row}-${column}`} style={{ gridRow: row, gridColumn: column }} />
      ))}
    </span>
  );
}

function DicePairingResponse({ item, answer, setAnswer }) {
  const [activeOption, setActiveOption] = useState(null);
  const values = answer && typeof answer === 'object' && !Array.isArray(answer) ? answer : {};
  const placed = new Set(Object.values(values));
  const optionById = new Map(item.options.map((option) => [option.id, option]));
  const place = (targetId, optionId) => {
    const next = Object.fromEntries(Object.entries(values).filter(([, value]) => value !== optionId));
    next[targetId] = optionId;
    setAnswer(next);
    setActiveOption(null);
  };
  const activateTarget = (targetId) => {
    if (activeOption) {
      place(targetId, activeOption);
      return;
    }
    if (values[targetId]) {
      const next = { ...values };
      const optionId = next[targetId];
      delete next[targetId];
      setAnswer(next);
      setActiveOption(optionId);
    }
  };

  return (
    <div className="dice-pairing-response">
      <div className="dice-bank" aria-label="Draggable dice">
        {item.options.map((option) => (
          <button
            key={option.id}
            draggable
            aria-pressed={activeOption === option.id}
            className={`${activeOption === option.id ? 'selected' : ''} ${placed.has(option.id) ? 'placed' : ''}`}
            onClick={() => setActiveOption(activeOption === option.id ? null : option.id)}
            onDragStart={(event) => {
              event.dataTransfer.setData('text/plain', option.id);
              setActiveOption(option.id);
            }}
          >
            <DiceFace value={Number(option.text)} />
            <span className="sr-only">Die showing {option.text}</span>
          </button>
        ))}
      </div>
      <div className="dice-pair-rows">
        {[0, 1, 2].map((pairIndex) => {
          const leftTarget = item.answer.targets[pairIndex * 2];
          const rightTarget = item.answer.targets[pairIndex * 2 + 1];
          return (
            <div className="dice-pair-row" key={pairIndex}>
              {[leftTarget, rightTarget].map((target, targetIndex) => {
                const option = optionById.get(values[target.id]);
                return (
                  <Fragment key={target.id}>
                    <button
                      className={`dice-drop-slot ${option ? 'filled' : ''} ${activeOption ? 'ready' : ''}`}
                      aria-label={`${target.label}: ${option ? `die showing ${option.text}` : 'empty'}`}
                      onClick={() => activateTarget(target.id)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault();
                        const optionId = event.dataTransfer.getData('text/plain') || activeOption;
                        if (optionId) place(target.id, optionId);
                      }}
                    >
                      {option ? <DiceFace value={Number(option.text)} compact /> : <span>Drop a die here</span>}
                    </button>
                    {targetIndex === 0 && <b>+</b>}
                  </Fragment>
                );
              })}
              <strong>= 7</strong>
            </div>
          );
        })}
      </div>
      <small>Select or drag each die into a pair. Every row must total 7.</small>
    </div>
  );
}

function InlineChoice({ item, selected, onSelect }) {
  const targets = item.answer?.type === 'drag_drop' ? item.answer.targets ?? [] : [];
  const comparison = item.tags?.includes('Y3-08-compare-lengths-uniform-units');
  if (comparison) {
    const parameters = item.stimulus?.visual?.parameters ?? {};
    return (
      <label className="inline-choice-control comparison-inline-choice">
        <span className="comparison-sentence">
          <strong>{parameters.left_label ?? 'The first object'}</strong>
          <span>is</span>
          <select value={selected ?? ''} onChange={(event) => onSelect(event.target.value)} aria-label="Choose the length comparison">
            <option value="" disabled>Select…</option>
            {item.options.map((option) => <option key={option.id} value={option.id}>{option.text}</option>)}
          </select>
          <strong>{parameters.right_label ?? 'the second object'}.</strong>
        </span>
      </label>
    );
  }
  if (targets.length > 1) {
    const values = selected && typeof selected === 'object' && !Array.isArray(selected) ? selected : {};
    return (
      <div className="multi-inline-choice" aria-label="Complete both blanks">
        {targets.map((target) => (
          <label key={target.id} className="inline-choice-control">
            <span>{target.label}</span>
            <select
              value={values[target.id] ?? ''}
              onChange={(event) => onSelect({ ...values, [target.id]: event.target.value })}
            >
              <option value="" disabled>Select…</option>
              {item.options.map((option) => <option key={option.id} value={option.id}>{option.text}</option>)}
            </select>
          </label>
        ))}
      </div>
    );
  }
  return (
    <label className="inline-choice-control">
      <span>Choose the best answer</span>
      <select value={selected ?? ''} onChange={(event) => onSelect(event.target.value)}>
        <option value="" disabled>Select…</option>
        {item.options.map((option) => <option key={option.id} value={option.id}>{option.text}</option>)}
      </select>
    </label>
  );
}

function HotTextResponse({ item, answer, setAnswer }) {
  return (
    <div className="hot-text-response" role="radiogroup" aria-label="Select the answer text">
      <span>Select the text that best answers the question.</span>
      {item.options.map((option) => (
        <button
          key={option.id}
          role="radio"
          aria-checked={answer === option.id}
          className={answer === option.id ? 'selected' : ''}
          onClick={() => setAnswer(option.id)}
        >
          {option.text}
        </button>
      ))}
    </div>
  );
}

function DragDropResponse({ item, answer, setAnswer }) {
  const [activeOption, setActiveOption] = useState(null);
  const targets = item.answer.targets ?? [];
  const values = answer && typeof answer === 'object' && !Array.isArray(answer) ? answer : {};
  const placedOptions = new Set(Object.values(values));
  const place = (targetId, optionId) => {
    const next = Object.fromEntries(Object.entries(values).filter(([, value]) => value !== optionId));
    next[targetId] = optionId;
    setAnswer(next);
    setActiveOption(null);
  };
  const activateTarget = (targetId) => {
    if (activeOption) {
      place(targetId, activeOption);
      return;
    }
    if (values[targetId]) {
      const optionId = values[targetId];
      const next = { ...values };
      delete next[targetId];
      setAnswer(next);
      setActiveOption(optionId);
    }
  };
  return (
    <div className="drag-response">
      <p>Select or drag each card, then place it in the correct position.</p>
      <div className="word-tiles" aria-label="Draggable answer cards">
        {item.options.map((option) => (
          <button
            key={option.id}
            draggable
            onDragStart={(event) => event.dataTransfer.setData('text/plain', option.id)}
            onClick={() => setActiveOption((current) => current === option.id ? null : option.id)}
            className={activeOption === option.id ? 'selected' : placedOptions.has(option.id) ? 'placed' : ''}
            aria-pressed={activeOption === option.id}
          >
            <span>{option.text}</span>
            {placedOptions.has(option.id) && <small>Placed</small>}
          </button>
        ))}
      </div>
      <div className="drop-target-list">
        {targets.map((target) => {
          const selected = values[target.id];
          return (
            <div
              key={target.id}
              role="button"
              tabIndex={0}
              aria-label={`${target.label}: ${item.options.find((option) => option.id === selected)?.text ?? 'empty'}`}
              className={`drop-target ${selected ? 'filled' : ''} ${activeOption ? 'ready' : ''}`}
              onClick={() => activateTarget(target.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  activateTarget(target.id);
                }
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const optionId = event.dataTransfer.getData('text/plain');
                if (item.options.some((option) => option.id === optionId)) place(target.id, optionId);
              }}
            >
              <strong>{target.label}</strong>
              <span>{item.options.find((option) => option.id === selected)?.text ?? 'Drop or place a card here.'}</span>
            </div>
          );
        })}
      </div>
      {Object.keys(values).length > 0 && <button className="reset-drag-response" onClick={() => { setAnswer({}); setActiveOption(null); }}>Reset order</button>}
    </div>
  );
}

function MatrixResponse({ item, answer, setAnswer }) {
  const values = answer && typeof answer === 'object' && !Array.isArray(answer) ? answer : {};
  const rows = item.answer.rows ?? [];
  const columns = item.answer.columns ?? [];
  return (
    <div className="matrix-scroll">
      <table className="response-matrix">
        <thead>
          <tr>
            <th>Event</th>
            {columns.map((column) => <th key={column.id}>{column.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <th>{row.label}</th>
              {columns.map((column) => (
                <td key={column.id}>
                  <input
                    type="radio"
                    name={`${item.id}-${row.id}`}
                    aria-label={`${row.label}: ${column.label}`}
                    checked={values[row.id] === column.id}
                    onChange={() => setAnswer({ ...values, [row.id]: column.id })}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AngleHotspot({ item, answer, setAnswer }) {
  const visual = item.stimulus?.visual;
  if (visual?.kind !== 'angle_hotspot_set') return null;
  const { angles, labels } = visual.parameters;
  return (
    <div className="angle-hotspot-set" role="group" aria-label={visual.alt_text}>
      {angles.map((angle, index) => {
        const option = item.options.find((candidate) => candidate.text === `Angle ${labels[index]}`);
        const radians = (angle * Math.PI) / 180;
        const endX = 54 + Math.cos(-radians) * 42;
        const endY = 60 + Math.sin(-radians) * 42;
        return (
          <button
            key={labels[index]}
            className={answer === option?.id ? 'selected' : ''}
            aria-pressed={answer === option?.id}
            onClick={() => option && setAnswer(option.id)}
          >
            <svg viewBox="0 0 108 78" role="img" aria-label={`Angle ${labels[index]}`}>
              <path d="M54 60 H101" />
              <path d={`M54 60 L${endX.toFixed(2)} ${endY.toFixed(2)}`} />
              <circle cx="54" cy="60" r="3" />
              <text x="8" y="18">{labels[index]}</text>
            </svg>
          </button>
        );
      })}
    </div>
  );
}

function ShapeGlyph({ shape }) {
  if (shape === 'square') return <rect x="30" y="18" width="50" height="50" />;
  if (shape === 'rectangle') return <rect x="18" y="27" width="74" height="40" />;
  if (shape === 'triangle') return <polygon points="55,14 92,70 18,70" />;
  if (shape === 'scalene_triangle') return <polygon points="32,13 94,70 16,70" />;
  if (shape === 'pentagon') return <polygon points="55,11 94,39 79,76 31,76 16,39" />;
  if (shape === 'irregular_quadrilateral') return <polygon points="23,17 91,29 76,74 12,62" />;
  return <polygon points="14,31 58,31 58,14 98,44 58,75 58,58 14,58" />;
}

function ShapeHotspot({ item, answer, setAnswer }) {
  const visual = item.stimulus?.visual;
  if (visual?.kind !== 'shape_hotspot_set') return null;
  const { shapes, labels } = visual.parameters;
  return (
    <div className="angle-hotspot-set shape-hotspot-set" role="group" aria-label={visual.alt_text}>
      {shapes.map((shape, index) => {
        const option = item.options.find((candidate) => candidate.text === `Shape ${labels[index]}`);
        return (
          <button
            key={labels[index]}
            className={answer === option?.id ? 'selected' : ''}
            aria-pressed={answer === option?.id}
            onClick={() => option && setAnswer(option.id)}
          >
            <svg viewBox="0 0 110 90" role="img" aria-label={`Shape ${labels[index]}`}>
              <ShapeGlyph shape={shape} />
              <text x="8" y="18">{labels[index]}</text>
            </svg>
          </button>
        );
      })}
    </div>
  );
}

function HotspotResponse({ item, answer, setAnswer }) {
  if (item.stimulus?.visual?.kind === 'shape_hotspot_set') {
    return <ShapeHotspot item={item} answer={answer} setAnswer={setAnswer} />;
  }
  if (item.stimulus?.visual?.kind === 'angle_hotspot_set') {
    return <AngleHotspot item={item} answer={answer} setAnswer={setAnswer} />;
  }
  return (
    <div className="generic-hotspot-options" role="radiogroup" aria-label="Selectable visual regions">
      {(item.options ?? []).map((option) => (
        <button
          key={option.id}
          role="radio"
          aria-checked={answer === option.id}
          className={answer === option.id ? 'selected' : ''}
          onClick={() => setAnswer(option.id)}
        >
          {option.text}
        </button>
      ))}
    </div>
  );
}

function SceneDots({ count, crossed = 0, colour = '#27a9df' }) {
  return (
    <div className="scene-dots">
      {Array.from({ length: Math.min(60, Number(count) || 0) }, (_, index) => (
        <i
          key={index}
          className={index >= count - crossed ? 'crossed' : ''}
          style={{ '--scene-dot': colour }}
        />
      ))}
    </div>
  );
}

function ScenePictogram({ kind, colour }) {
  const common = { style: { '--pictogram-colour': colour }, 'aria-hidden': true };
  if (kind === 'butterfly') {
    return <svg {...common} className="scene-pictogram" viewBox="0 0 60 48"><ellipse cx="20" cy="17" rx="12" ry="13" /><ellipse cx="40" cy="17" rx="12" ry="13" /><ellipse cx="21" cy="34" rx="9" ry="10" /><ellipse cx="39" cy="34" rx="9" ry="10" /><rect x="27" y="8" width="6" height="33" rx="3" /></svg>;
  }
  if (kind === 'fish') {
    return <svg {...common} className="scene-pictogram" viewBox="0 0 60 48"><ellipse cx="31" cy="24" rx="20" ry="14" /><path d="M12 24 2 12v24z" /><circle className="pictogram-cutout" cx="42" cy="20" r="2.4" /></svg>;
  }
  if (kind === 'flower') {
    return <svg {...common} className="scene-pictogram" viewBox="0 0 60 48"><circle cx="30" cy="10" r="9" /><circle cx="19" cy="18" r="9" /><circle cx="41" cy="18" r="9" /><circle cx="23" cy="31" r="9" /><circle cx="37" cy="31" r="9" /><circle className="pictogram-accent" cx="30" cy="22" r="8" /></svg>;
  }
  if (kind === 'boat') {
    return <svg {...common} className="scene-pictogram" viewBox="0 0 60 48"><path d="M8 31h45l-9 12H18z" /><path d="M29 5v26H12z" /><path className="pictogram-accent" d="M33 8v21h18z" /></svg>;
  }
  if (kind === 'kite') {
    return <svg {...common} className="scene-pictogram" viewBox="0 0 60 48"><path d="M30 3 49 19 30 36 11 19z" /><path className="pictogram-line" d="M30 36q12 4 4 10" /><path className="pictogram-line" d="M28 40l8 3" /></svg>;
  }
  if (kind === 'apple') {
    return <svg {...common} className="scene-pictogram" viewBox="0 0 60 48"><path d="M30 15c-11-10-24 0-21 14 4 19 18 17 21 12 4 5 18 7 22-12 3-14-10-24-22-14z" /><path className="pictogram-line" d="M30 15c0-7 3-10 7-13" /><ellipse className="pictogram-accent" cx="40" cy="7" rx="7" ry="4" transform="rotate(-24 40 7)" /></svg>;
  }
  if (kind === 'ladybird') {
    return <svg {...common} className="scene-pictogram" viewBox="0 0 60 48"><ellipse cx="31" cy="27" rx="19" ry="17" /><circle className="pictogram-dark" cx="31" cy="9" r="8" /><path className="pictogram-line" d="M31 11v32" /><circle className="pictogram-cutout" cx="23" cy="23" r="3" /><circle className="pictogram-cutout" cx="39" cy="23" r="3" /><circle className="pictogram-cutout" cx="23" cy="34" r="3" /><circle className="pictogram-cutout" cx="39" cy="34" r="3" /></svg>;
  }
  return <svg {...common} className="scene-pictogram" viewBox="0 0 60 48"><ellipse cx="30" cy="25" rx="19" ry="14" /><circle cx="51" cy="22" r="7" /><circle cx="14" cy="39" r="5" /><circle cx="27" cy="41" r="5" /><circle cx="40" cy="40" r="5" /><path className="pictogram-accent" d="M18 25q12-16 24 0-12 15-24 0z" /></svg>;
}

function GeneratedNumeracyScene({ visual }) {
  if (visual?.kind !== 'generated_numeracy_scene') return null;
  const p = visual.parameters ?? {};
  const type = p.scene;

  if (type === 'partitioned_shapes') {
    return (
      <div className="generated-numeracy-scene partition-scene" role="img" aria-label={visual.alt_text}>
        {p.option_visuals.map((shape, index) => {
          const split = shape.parts[0];
          const clipId = `${visual.asset_id}-${index}`;
          return (
            <figure key={shape.label}>
              <svg viewBox="0 0 100 100">
                <defs><clipPath id={clipId}><circle cx="50" cy="50" r="40" /></clipPath></defs>
                <circle cx="50" cy="50" r="40" className="scene-shape-base" />
                <rect x="10" y="10" width={80 * split / 100} height="80" clipPath={`url(#${clipId})`} className="scene-shape-fill" />
                <path d={`M${10 + 80 * split / 100} 11 V89`} className="scene-shape-line" />
              </svg>
              <figcaption>{shape.label}</figcaption>
            </figure>
          );
        })}
      </div>
    );
  }

  if (['collection', 'part_whole', 'group_motif', 'full_containers', 'collection_rows', 'option_collections', 'shelves'].includes(type)) {
    let rows = [];
    if (type === 'collection_rows') rows = p.counts.map((count, index) => ({ label: `Collection ${'ABCD'[index]}`, count }));
    if (type === 'option_collections') rows = p.option_visuals;
    if (type === 'shelves') rows = Array.from({ length: p.shelves }, (_, index) => ({ label: `Shelf ${index + 1}`, count: p.each }));
    return (
      <div className={`generated-numeracy-scene collection-scene ${type}`} role="img" aria-label={visual.alt_text}>
        {type === 'full_containers' ? (
          <div className="scene-container-row">
            {Array.from({ length: p.groups }, (_, index) => <span key={index}><strong>{p.capacity}</strong><small>full</small></span>)}
            <span className="loose"><strong>+{p.leftover}</strong><small>loose</small></span>
          </div>
        ) : rows.length ? rows.map((row, index) => (
          <figure key={row.label}>
            <figcaption>{row.label}</figcaption>
            {type === 'collection_rows' && p.row_objects?.[index] ? (
              <div className="scene-pictogram-row">
                {Array.from({ length: row.count }, (_, pictureIndex) => (
                  <ScenePictogram
                    key={pictureIndex}
                    kind={p.row_objects[index]}
                    colour={['#2e9fca', '#e36f5d', '#6cbf72', '#8a70d6'][index % 4]}
                  />
                ))}
              </div>
            ) : (
              <SceneDots count={row.count} colour={['#1fb98a', '#6676ea', '#f39a20', '#ef685a'][index % 4]} />
            )}
          </figure>
        )) : (
          <SceneDots count={p.total ?? p.start ?? p.groupSize} crossed={p.crossed_out ?? 0} />
        )}
        {type === 'part_whole' && <div className="part-whole-strip"><span>{p.start}</span><span>?</span><strong>{p.total}</strong></div>}
        {type === 'group_motif' && <strong>One group: {p.groupSize} · Available: {p.total}</strong>}
      </div>
    );
  }

  if (type === 'length_cards' || type === 'informal_units') {
    const rows = type === 'length_cards'
      ? p.cards.map((card) => ({ label: card.label, length: card.length }))
      : [
        { label: p.left_label ?? 'Object A', units: p.a },
        { label: p.right_label ?? 'Object B', units: p.b },
      ];
    return (
      <div className={`generated-numeracy-scene length-scene ${type === 'informal_units' ? 'informal-units-scene' : ''}`} role="img" aria-label={visual.alt_text}>
        {rows.map((row, index) => (
          <figure key={row.label}>
            {type === 'informal_units' ? (
              <>
                <figcaption>{row.label}</figcaption>
                <div className="informal-measure-track" style={{ '--unit-count': row.units }}>
                  <svg viewBox="0 0 360 44" preserveAspectRatio="none" aria-hidden="true">
                    <path className={`measured-object-line measured-object-${index}`} d="M8 24 C70 8 116 37 176 20 S286 10 352 23" />
                  </svg>
                  <div className={`scene-unit-strip unit-${p.unit}`}>
                    {Array.from({ length: row.units }, (_, unit) => <i key={unit} />)}
                  </div>
                </div>
                <small>{row.units} equal {p.unit}</small>
              </>
            ) : (
              <>
                <div className={`scene-length-object object-${index}`} style={{ width: `${Math.min(96, row.length)}%` }} />
                <figcaption>{row.label}</figcaption>
              </>
            )}
          </figure>
        ))}
      </div>
    );
  }

  if (type === 'equation_story' || type === 'equation_blanks') {
    return (
      <div className="generated-numeracy-scene equation-scene" role="img" aria-label={visual.alt_text}>
        {type === 'equation_story'
          ? <><SceneDots count={p.left} /><b>+</b><SceneDots count={p.right} /><b>=</b><em>?</em></>
          : <><em>?</em><b>{p.operator}</b><strong>{p.fixed}</strong><b>=</b><em>?</em></>}
      </div>
    );
  }

  if (type === 'composite_polygon' || type === 'polygon_logos') {
    const shapes = type === 'polygon_logos'
      ? p.polygons
      : p.regions.map((shape, index) => ({ label: `Region ${'ABCDE'[index]}`, points: shape === 'triangle' ? 3 : shape === 'quadrilateral' ? 4 : 5 }));
    const pointSets = { 3: '50,8 92,80 8,80', 4: '10,20 90,10 68,82 38,48', 5: '50,7 94,38 77,84 23,84 6,38' };
    return (
      <div className="generated-numeracy-scene polygon-scene" role="img" aria-label={visual.alt_text}>
        {shapes.map((shape, index) => (
          <figure key={shape.label}>
            <svg viewBox="0 0 100 90"><polygon points={pointSets[shape.points]} className={`polygon-fill polygon-${index}`} /></svg>
            <figcaption>{shape.label}</figcaption>
          </figure>
        ))}
      </div>
    );
  }

  if (type === 'angle_fans') {
    return (
      <div className="generated-numeracy-scene angle-scene" role="img" aria-label={visual.alt_text}>
        {p.cards.map((card) => {
          const radians = card.angle * Math.PI / 180;
          const x = 50 + Math.cos(-radians) * 40;
          const y = 62 + Math.sin(-radians) * 40;
          return (
            <figure key={card.label}>
              <svg viewBox="0 0 100 78"><path d="M50 62 H94" /><path d={`M50 62 L${x} ${y}`} /><circle cx="50" cy="62" r="3" /></svg>
              <figcaption>{card.label}</figcaption>
            </figure>
          );
        })}
      </div>
    );
  }

  if (type === 'fraction_strips' || type === 'proportion_grid') {
    const denominator = p.denominator;
    const numerator = p.numerator ?? p.largeNumerator;
    return (
      <div className="generated-numeracy-scene fraction-scene" role="img" aria-label={visual.alt_text}>
        <div className="scene-fraction-strip">
          {Array.from({ length: Math.min(100, denominator) }, (_, index) => <i key={index} className={index < numerator ? 'filled' : ''} />)}
        </div>
        <strong>{numerator}/{denominator}</strong>
        {type === 'fraction_strips' && <span>− {p.smallNumerator}/{p.smallDenominator}</span>}
      </div>
    );
  }

  if (type === 'practice_banknotes') {
    return (
      <div className="generated-numeracy-scene banknote-scene" role="img" aria-label={visual.alt_text}>
        {p.denominations.map((value, index) => (
          <div key={value} className={`practice-note practice-note-${index}`}>
            <small>PRACTICE</small><strong>${value}</strong><span>Not legal tender</span>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'grid_floorplan') {
    return (
      <div className="generated-numeracy-scene floorplan-scene" role="img" aria-label={visual.alt_text}>
        {p.rooms.map((room, index) => (
          <div key={room.label} style={{ gridColumn: `span ${1 + index % 2}`, minHeight: `${48 + room.area * 2}px` }}>
            <strong>{room.label}</strong><small>{room.area} square units</small>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'grid_shapes') {
    return (
      <div className="generated-numeracy-scene grid-shape-scene" role="img" aria-label={visual.alt_text}>
        <figure><div className="cell-shape" style={{ '--cell-count': p.reference_area }} /><figcaption>Reference</figcaption></figure>
        {p.shapes.map((shape) => <figure key={shape.label}><div className="cell-shape" style={{ '--cell-count': shape.area }} /><figcaption>{shape.label}</figcaption></figure>)}
      </div>
    );
  }

  if (type === 'calendar') {
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className="generated-numeracy-scene calendar-scene" role="img" aria-label={visual.alt_text}>
        {weekdays.map((day) => <strong key={day}>{day}</strong>)}
        {Array.from({ length: p.first_weekday }, (_, index) => <span key={`empty-${index}`} />)}
        {Array.from({ length: p.days }, (_, index) => <span key={index} className={index + 1 === p.target ? 'target' : ''}>{index + 1}</span>)}
      </div>
    );
  }

  if (type === 'dial_scales') {
    return (
      <div className="generated-numeracy-scene scale-scene" role="img" aria-label={visual.alt_text}>
        {p.scales.map((scale) => {
          const angle = -125 + scale.value / scale.maximum * 250;
          return (
            <figure key={scale.label}>
              <div className="scene-dial"><i style={{ transform: `rotate(${angle}deg)` }} /></div>
              <figcaption>{scale.label}</figcaption>
            </figure>
          );
        })}
      </div>
    );
  }

  if (type === 'dot_pattern') {
    return (
      <div className="generated-numeracy-scene pattern-scene" role="img" aria-label={visual.alt_text}>
        {p.sequence.map((count, index) => (
          <figure key={index}>
            {p.missing.includes(index) ? <em>?</em> : <SceneDots count={count} />}
            <figcaption>Term {index + 1}</figcaption>
          </figure>
        ))}
      </div>
    );
  }

  if (type === 'venn') {
    return (
      <div className="generated-numeracy-scene venn-scene" role="img" aria-label={visual.alt_text}>
        <div className="venn-circle venn-a"><strong>Set A</strong><span>?</span></div>
        <div className="venn-circle venn-b"><strong>Set B</strong><span>?</span></div>
        <em className="venn-overlap">?</em><small>Neither: ?</small>
      </div>
    );
  }

  if (type === 'nets_and_solids') {
    return (
      <div className="generated-numeracy-scene nets-scene" role="img" aria-label={visual.alt_text}>
        <div>{p.nets.map((value) => <span key={value}>{value.replaceAll('_', ' ')}</span>)}</div>
        <strong>fold →</strong>
        <div>{p.solids.map((value) => <span key={value}>{value}</span>)}</div>
      </div>
    );
  }

  const values = p.values
    ?? p.option_visuals?.map((entry) => `${entry.label}: ${entry.count}`)
    ?? p.categories?.map((value, index) => `${p.labels[index]}: ${value}`)
    ?? p.rows?.map((row) => `${row.label}: ${row.value}`)
    ?? Object.entries(p)
      .filter(([key, value]) => !['scene', 'variant'].includes(key) && ['string', 'number'].includes(typeof value))
      .map(([key, value]) => `${key.replaceAll('_', ' ')}: ${value}`);
  return (
    <div className="generated-numeracy-scene scene-card-grid" role="img" aria-label={visual.alt_text}>
      {values.map((value, index) => <span key={`${value}-${index}`}>{value}</span>)}
    </div>
  );
}

function MeasurementVisual({ stimulus }) {
  const visual = stimulus?.visual;
  if (visual?.kind === 'generated_numeracy_scene') return <GeneratedNumeracyScene visual={visual} />;
  if (!visual || !['ruler_measurement', 'protractor_measurement', 'analog_clock', 'direction_map'].includes(visual.kind)) return null;
  if (visual.kind === 'analog_clock') {
    const { hour, minute } = visual.parameters;
    const minuteAngle = (minute * 6 * Math.PI) / 180;
    const hourAngle = (((hour % 12) * 30 + minute * 0.5) * Math.PI) / 180;
    const centre = { x: 180, y: 108 };
    const minuteEnd = { x: centre.x + Math.sin(minuteAngle) * 65, y: centre.y - Math.cos(minuteAngle) * 65 };
    const hourEnd = { x: centre.x + Math.sin(hourAngle) * 45, y: centre.y - Math.cos(hourAngle) * 45 };
    return (
      <svg className="measurement-visual clock-visual" viewBox="0 0 360 220" role="img" aria-label={visual.alt_text}>
        <rect x="18" y="12" width="324" height="196" rx="16" className="measurement-scene" />
        <circle cx={centre.x} cy={centre.y} r="82" className="clock-face" />
        {Array.from({ length: 12 }, (_, index) => {
          const angle = (index * 30 * Math.PI) / 180;
          const outer = { x: centre.x + Math.sin(angle) * 75, y: centre.y - Math.cos(angle) * 75 };
          const inner = { x: centre.x + Math.sin(angle) * 66, y: centre.y - Math.cos(angle) * 66 };
          return <path key={index} d={`M${inner.x} ${inner.y} L${outer.x} ${outer.y}`} className="clock-tick" />;
        })}
        <path d={`M${centre.x} ${centre.y} L${hourEnd.x} ${hourEnd.y}`} className="clock-hour-hand" />
        <path d={`M${centre.x} ${centre.y} L${minuteEnd.x} ${minuteEnd.y}`} className="clock-minute-hand" />
        <circle cx={centre.x} cy={centre.y} r="6" />
      </svg>
    );
  }
  if (visual.kind === 'direction_map') {
    const { place_a: placeA, place_b: placeB, relation } = visual.parameters;
    const positions = {
      north: [{ x: 300, y: 72 }, { x: 300, y: 190 }],
      south: [{ x: 300, y: 190 }, { x: 300, y: 72 }],
      east: [{ x: 430, y: 132 }, { x: 170, y: 132 }],
      west: [{ x: 170, y: 132 }, { x: 430, y: 132 }],
    };
    const [pointA, pointB] = positions[relation];
    return (
      <svg className="measurement-visual direction-map-visual" viewBox="0 0 600 270" role="img" aria-label={visual.alt_text}>
        <rect x="18" y="14" width="564" height="242" rx="16" className="measurement-scene" />
        <path d="M70 75 V35 M70 35 L60 49 M70 35 L80 49" className="map-north-arrow" />
        <text x="63" y="96" className="map-cardinal">N</text>
        <path d={`M${pointA.x} ${pointA.y} L${pointB.x} ${pointB.y}`} className="map-route" />
        <circle cx={pointA.x} cy={pointA.y} r="14" className="map-point map-point-a" />
        <circle cx={pointB.x} cy={pointB.y} r="14" className="map-point map-point-b" />
        <text x={pointA.x} y={pointA.y - 24} textAnchor="middle" className="map-label">{placeA}</text>
        <text x={pointB.x} y={pointB.y + 39} textAnchor="middle" className="map-label">{placeB}</text>
      </svg>
    );
  }
  if (visual.kind === 'ruler_measurement') {
    const pixelsPerCentimetre = 33.87;
    const startX = 46;
    const endX = startX + visual.parameters.length_cm * pixelsPerCentimetre;
    return (
      <svg className="measurement-visual" viewBox="0 0 720 190" role="img" aria-label={visual.alt_text}>
        <rect x="20" y="24" width="680" height="132" rx="18" className="measurement-scene" />
        <path d={`M${startX} 96 H${endX}`} className="measurement-object" />
        <path d={`M${startX} 79 V113 M${endX} 79 V113`} className="measurement-endpoints" />
      </svg>
    );
  }
  const angle = visual.parameters.angle_degrees;
  const rotation = visual.parameters.orientation_degrees ?? 0;
  const radians = ((angle + rotation) * Math.PI) / 180;
  const baseRadians = (rotation * Math.PI) / 180;
  const start = { x: 330, y: 142 };
  const rayLength = 125;
  const baseEnd = {
    x: start.x + Math.cos(-baseRadians) * rayLength,
    y: start.y + Math.sin(-baseRadians) * rayLength,
  };
  const angleEnd = {
    x: start.x + Math.cos(-radians) * rayLength,
    y: start.y + Math.sin(-radians) * rayLength,
  };
  return (
    <svg className="measurement-visual" viewBox="0 0 660 210" role="img" aria-label={visual.alt_text}>
      <rect x="18" y="18" width="624" height="174" rx="16" className="measurement-scene" />
      <path d={`M${start.x} ${start.y} L${baseEnd.x} ${baseEnd.y}`} className="angle-ray" />
      <path d={`M${start.x} ${start.y} L${angleEnd.x} ${angleEnd.y}`} className="angle-ray" />
      <circle cx={start.x} cy={start.y} r="5" />
    </svg>
  );
}

function ResponseControl({ item, answer, setAnswer }) {
  if (item.item_type === 'hot_text') {
    return <HotTextResponse item={item} answer={answer} setAnswer={setAnswer} />;
  }
  if (item.item_type === 'multiple_select') {
    return <MultipleSelectList items={item.options} selected={answer} onSelect={setAnswer} maxSelections={item.interaction.max_selections} />;
  }
  if (item.item_type === 'inline_choice') {
    return <InlineChoice item={item} selected={answer} onSelect={setAnswer} />;
  }
  if (item.item_type === 'drag_and_drop') {
    return <DragDropResponse key={item.id} item={item} answer={answer} setAnswer={setAnswer} />;
  }
  if (item.item_type === 'matrix') {
    return <MatrixResponse item={item} answer={answer} setAnswer={setAnswer} />;
  }
  if (item.item_type === 'hotspot') {
    return <HotspotResponse item={item} answer={answer} setAnswer={setAnswer} />;
  }
  if (item.item_type === 'text_entry') {
    return (
      <input
        className="spelling-input response-text-entry"
        aria-label="Answer"
        value={typeof answer === 'string' || typeof answer === 'number' ? answer : ''}
        onChange={(event) => setAnswer(event.target.value)}
      />
    );
  }
  return <ChoiceList items={item.options ?? []} selected={answer} onSelect={setAnswer} />;
}

function hasResponse(value) {
  if (value === null || value === undefined || value === '') return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return String(value).trim() !== '';
}

function ReadingQuestion({ item, answer, setAnswer, audioPlaying, toggleAudio }) {
  const paragraphs = item.stimulus?.text?.split(/\n\n+/) ?? [];
  const [stimulusOnly, setStimulusOnly] = useState(false);

  useEffect(() => {
    setStimulusOnly(false);
  }, [item.id]);

  return (
    <div className={`reading-layout ${stimulusOnly ? 'stimulus-only' : ''}`}>
      <aside className="reading-stimulus">
        <article>
          <h1>{item.stimulus?.title}</h1>
          {paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </article>
      </aside>
      <button
        className="collapse-stimulus"
        aria-label={stimulusOnly ? 'Expand stimulus' : 'Collapse stimulus'}
        onClick={() => setStimulusOnly((only) => !only)}
      >
        {stimulusOnly
          ? <ChevronLeft size={34} fill="#1da3eb" />
          : <ChevronRight size={34} fill="#1da3eb" />}
      </button>
      <section className="question-pane" aria-hidden={stimulusOnly}>
        <button className="speak-question" aria-label="Read question aloud" onClick={toggleAudio}>
          <Volume2 size={20} />
        </button>
        <p className="question-text">{item.prompt}</p>
        <ResponseControl item={item} answer={answer} setAnswer={setAnswer} />
        {audioPlaying && <span className="sr-status">Question audio is playing.</span>}
      </section>
    </div>
  );
}

function StimulusTable({ stimulus }) {
  if (stimulus?.type !== 'table') return null;
  return (
    <table className="bank-table">
      <caption>{stimulus.title}</caption>
      <thead><tr>{stimulus.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
      <tbody>
        {stimulus.rows.map((row, index) => (
          <tr key={`${row.join('-')}-${index}`}>{row.map((cell, cellIndex) => <td key={`${cell}-${cellIndex}`}>{cell}</td>)}</tr>
        ))}
      </tbody>
    </table>
  );
}

function NumeracyQuestion({ item, answer, setAnswer, audioPlayback }) {
  const pictureCountMatching = item.tags?.includes('Y3-06-match-collections-to-numbers');
  const compositePuzzle = item.tags?.includes('Y3-10-identify-shapes-in-composite');
  const dicePairing = item.tags?.includes('Y3-11-pair-complements-to-target');
  return (
    <section className={`single-question numeracy-question ${pictureCountMatching ? 'pictogram-matching-question' : ''}`}>
      <button className="speak-question" aria-label="Read question aloud" onClick={audioPlayback.toggle}><Volume2 size={20} /></button>
      <StimulusTable stimulus={item.stimulus} />
      {!compositePuzzle && !dicePairing && <MeasurementVisual stimulus={item.stimulus} />}
      <p className="question-text">{item.prompt}</p>
      {compositePuzzle
        ? <CompositePuzzleResponse item={item} answer={answer} setAnswer={setAnswer} />
        : dicePairing
          ? <DicePairingResponse item={item} answer={answer} setAnswer={setAnswer} />
          : <ResponseControl item={item} answer={answer} setAnswer={setAnswer} />}
    </section>
  );
}

function ConventionsQuestion({ item, answer, setAnswer, audioPlayback }) {
  const spelling = item.item_type === 'text_entry';
  const displayText = item.stimulus?.display_text ?? item.stimulus?.text;
  return (
    <section className="single-question conventions-question">
      {spelling ? (
        <>
          <p><strong dangerouslySetInnerHTML={{ __html: displayText }} /></p>
          {item.skill === 'audio_dictation' && (
            <>
              <p>Click on the play button to hear the missing word.</p>
              <AudioBar playback={audioPlayback} compact />
            </>
          )}
          <p>{item.prompt}</p>
          <input
            className="spelling-input"
            aria-label="Spelling answer"
            value={typeof answer === 'string' ? answer : ''}
            onChange={(event) => setAnswer(event.target.value)}
          />
        </>
      ) : (
        <>
          <p className="question-text">{item.prompt}</p>
          <ResponseControl item={item} answer={answer} setAnswer={setAnswer} />
        </>
      )}
    </section>
  );
}

function WritingPrompt({ item, audioVisible, audioPlayback, onStart, paperMode = false }) {
  const narrative = item.subdomain === 'narrative';
  const ideaStarters = item.stimulus?.idea_starters ?? [
    narrative ? 'the characters and setting' : 'your position and intended audience',
    narrative ? 'the problem or complication' : 'reasons, examples and evidence',
    narrative ? 'how the story will develop and end' : 'how to organise and conclude the argument',
  ];
  const reminders = item.stimulus?.remember ?? [
    'plan before you start',
    'choose your words carefully',
    'check spelling, punctuation and paragraphs',
  ];
  const stimulusImage = item.stimulus?.image;
  return (
    <div className="writing-prompt-screen">
      {audioVisible && <AudioBar playback={audioPlayback} />}
      <div className="writing-prompt-body">
        <div className="writing-copy">
          {paperMode && (
            <aside className="paper-mode-inline">
              <FileText size={20} />
              <span><strong>Year 3 paper task · 40 minutes</strong><small>Read the prompt on screen, then write the response on paper.</small></span>
            </aside>
          )}
          <span className={`writing-genre-badge ${narrative ? 'narrative' : 'persuasive'}`}>
            {narrative ? 'Narrative writing' : 'Persuasive writing'}
          </span>
          <h1>{item.stimulus.title}</h1>
          <p className="writing-task">{item.prompt}</p>
          {item.stimulus?.context && <p className="writing-context">{item.stimulus.context}</p>}
          <p className="writing-instructions">{item.stimulus.instructions}</p>
          <p className="writing-choice-note">You can use an idea on this page or develop your own idea.</p>
          <div className="writing-guidance">
            <section>
              <strong>Think about:</strong>
              <ul>
                {ideaStarters.map((starter) => <li key={starter}>{starter}</li>)}
              </ul>
            </section>
            <section>
              <strong>Remember to:</strong>
              <ul>
                {reminders.map((reminder) => <li key={reminder}>{reminder}</li>)}
              </ul>
            </section>
          </div>
        </div>
        <figure className={`writing-stimulus-art ${narrative ? 'narrative' : 'persuasive'}`}>
          <img
            src={stimulusImage?.src ?? '/assets/reading-garden.png'}
            alt={stimulusImage?.alt_text ?? 'Open-ended visual stimulus for the writing task'}
          />
          <figcaption>
            Image stimulus · Use any detail that helps your response, or create your own direction.
          </figcaption>
        </figure>
      </div>
      <PlayerFooter
        showBack={false}
        hideFlag
        onNext={onStart}
        nextLabel={paperMode ? 'Start paper writing' : 'Start writing'}
      />
    </div>
  );
}

function PaperWritingStage({ item, onPrompt, onComplete }) {
  return (
    <div className="paper-writing-stage">
      <div className="paper-writing-sheet">
        <span className="paper-badge"><PenLine size={19} /> Student paper-writing time</span>
        <h1>{item.stimulus.title}</h1>
        <p>{item.prompt}</p>
        {item.stimulus?.context && <p>{item.stimulus.context}</p>}
        <div className="paper-writing-reminders">
          <strong>Write the response on paper now.</strong>
          <span>The 40-minute practice timer continues at the top of the screen.</span>
          <span>Plan, write and check the response before the parent-entry step.</span>
        </div>
      </div>
      <PlayerFooter
        showBack
        hideFlag
        onBack={onPrompt}
        backLabel="Prompt"
        onNext={onComplete}
        nextLabel="Paper writing finished"
      />
    </div>
  );
}

function EditorButton({ label, children, command, value }) {
  return (
    <button
      aria-label={label}
      onMouseDown={(event) => {
        event.preventDefault();
        document.execCommand(command, false, value);
      }}
    >
      {children}
    </button>
  );
}

function WritingEditor({ item, response, setResponse, onPrompt, onFinish, paperEntry = false }) {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerText !== response) {
      editorRef.current.innerText = response;
    }
  }, [response]);

  return (
    <div className={`writing-editor ${paperEntry ? 'paper-entry-editor' : ''}`}>
      <div className="editor-prompt">
        {item.prompt}
      </div>
      {paperEntry && (
        <aside className="parent-entry-banner">
          <Keyboard size={23} />
          <span>
            <strong>Parent entry of the handwritten response</strong>
            <small>Type exactly what the child wrote. Do not fix spelling, punctuation, paragraphing or wording—the AI report needs the original response.</small>
          </span>
        </aside>
      )}
      <div className={`editor-shell ${paperEntry ? 'paper-entry-shell' : ''}`}>
        {!paperEntry && <div className="editor-toolbar" role="toolbar" aria-label="Writing tools">
          <EditorButton label="Undo" command="undo"><Undo2 size={18} /></EditorButton>
          <EditorButton label="Redo" command="redo"><Redo2 size={18} /></EditorButton>
          <EditorButton label="Cut" command="cut"><Scissors size={18} /></EditorButton>
          <EditorButton label="Copy" command="copy"><Copy size={18} /></EditorButton>
          <EditorButton label="Paste" command="paste"><ClipboardPaste size={18} /></EditorButton>
          <label>
            <span className="sr-only">Font size</span>
            <select onChange={(event) => document.execCommand('fontSize', false, event.target.value)} defaultValue="3">
              <option value="2">10pt</option>
              <option value="3">11pt</option>
              <option value="4">14pt</option>
              <option value="5">18pt</option>
            </select>
          </label>
          <EditorButton label="Bold" command="bold"><Bold size={19} /></EditorButton>
          <EditorButton label="Italic" command="italic"><Italic size={19} /></EditorButton>
          <EditorButton label="Underline" command="underline"><Underline size={19} /></EditorButton>
          <EditorButton label="Align left" command="justifyLeft"><AlignLeft size={19} /></EditorButton>
          <EditorButton label="Align center" command="justifyCenter"><AlignCenter size={19} /></EditorButton>
          <EditorButton label="Bullet list" command="insertUnorderedList"><List size={19} /></EditorButton>
          <EditorButton label="Numbered list" command="insertOrderedList"><ListOrdered size={19} /></EditorButton>
        </div>}
        <div
          ref={editorRef}
          className="editor-area"
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label={paperEntry ? 'Parent transcription of handwritten response' : 'Writing response'}
          data-placeholder={paperEntry ? 'Type the handwritten response exactly as it appears on the paper…' : ''}
          onInput={(event) => setResponse(event.currentTarget.innerText)}
        />
      </div>
      <PlayerFooter
        showBack
        hideFlag
        onBack={onPrompt}
        backLabel="Prompt"
        onNext={onFinish}
        nextLabel="Finish"
      />
    </div>
  );
}

function SectionTransition({ type, unanswered, onCheck, onContinue }) {
  const nonCalculator = type === 'non-calculator';
  return (
    <section className="section-transition">
      <LockKeyhole size={47} />
      <h1>You have finished the {nonCalculator ? 'non-calculator ' : ''}section of the test.</h1>
      <p>You have {unanswered} unanswered questions.</p>
      <div className="stop-sign"><span>Stop</span></div>
      <p>After you click <strong>Yes, I want to start the next section</strong>, you will <strong>NOT</strong> be able to see or change your answers.</p>
      <strong>Are you ready to start the next section?</strong>
      <button onClick={onCheck}>No, I want to check my answers.</button>
      <button onClick={onContinue}>Yes, I want to start the next section.</button>
    </section>
  );
}

function ProgressSummary({ total, answers, resultRows, flagged, visited, onQuestion, end = false }) {
  const [filter, setFilter] = useState('all');
  const hasAnswer = (number) => resultRows?.[number - 1]?.complete ?? hasResponse(answers[number]);
  const answeredNumbers = Array.from({ length: total }, (_, index) => index + 1)
    .filter((number) => hasAnswer(number));
  const visitedNumbers = end
    ? Array.from({ length: total }, (_, index) => index + 1)
    : [...visited];
  const answered = answeredNumbers.length;
  const notAnswered = visitedNumbers.filter((number) => !hasAnswer(number)).length;
  const notRead = Math.max(0, total - visitedNumbers.length);
  const filterMatches = (number) => {
    if (filter === 'answered') return hasAnswer(number);
    if (filter === 'not-answered') return visitedNumbers.includes(number) && !hasAnswer(number);
    if (filter === 'not-read') return !visitedNumbers.includes(number);
    if (filter === 'flagged') return flagged.has(number);
    return true;
  };

  return (
    <section className="progress-summary">
      {end && (
        <div className="end-message">
          <h2>You have reached the end of the test.</h2>
          <p>To check your answers, click a question number below.</p>
          <p>If you are ready to finish the test, click <em>Finish</em>.</p>
        </div>
      )}
      <h1>Progress summary</h1>
      <div className="summary-filters" role="group" aria-label="Filter question list">
        <button className={filter === 'all' ? 'selected' : ''} aria-pressed={filter === 'all'} onClick={() => setFilter('all')}><Grid3X3 size={26} /> Show all</button>
        <button className={filter === 'answered' ? 'selected' : ''} aria-pressed={filter === 'answered'} onClick={() => setFilter('answered')}><b>{answered}</b> Answered</button>
        <button className={filter === 'not-answered' ? 'selected' : ''} aria-pressed={filter === 'not-answered'} onClick={() => setFilter('not-answered')}><b>{notAnswered}</b> Not answered</button>
        <button className={filter === 'not-read' ? 'selected' : ''} aria-pressed={filter === 'not-read'} onClick={() => setFilter('not-read')}><b>{notRead}</b> Not read</button>
        <button className={filter === 'flagged' ? 'selected' : ''} aria-pressed={filter === 'flagged'} onClick={() => setFilter('flagged')}><b>{flagged.size}</b> Flagged</button>
      </div>
      <h2>Questions</h2>
      <p>Click a number to go to that question.</p>
      <div className="question-grid">
        {Array.from({ length: total }, (_, index) => index + 1).map((number) => (
          <button
            key={number}
            className={`${visitedNumbers.includes(number) ? 'read' : ''} ${hasAnswer(number) ? 'answered' : ''} ${flagged.has(number) ? 'flagged' : ''} ${filterMatches(number) ? '' : 'filtered-out'}`}
            aria-label={`Question ${number}${hasAnswer(number) ? ' answered' : visitedNumbers.includes(number) ? ' not answered' : ' not read'}${flagged.has(number) ? ' flagged' : ''}`}
            onClick={() => onQuestion(number)}
          >
            {number}
          </button>
        ))}
      </div>
    </section>
  );
}

function CalculatorTool() {
  const [display, setDisplay] = useState('');
  const keys = ['MC', 'MR', 'M+', 'M-', 'AC', '(', ')', 'π', 'x²', 'xʸ', '√', '÷', '7', '8', '9', '×', '4', '5', '6', '+', '1', '2', '3', '−', '0', '.', '(−)', '='];

  const press = (key) => {
    if (key === 'AC') {
      setDisplay('');
      return;
    }
    if (key === '=') {
      const safe = display.replaceAll('×', '*').replaceAll('÷', '/').replaceAll('−', '-').replaceAll('π', String(Math.PI));
      if (/^[\d+\-*/().\s]+$/.test(safe)) {
        try {
          // The expression is restricted to digits and arithmetic operators above.
          setDisplay(String(Function(`"use strict";return (${safe})`)()));
        } catch {
          setDisplay('Error');
        }
      }
      return;
    }
    if (['MC', 'MR', 'M+', 'M-', 'x²', 'xʸ', '√'].includes(key)) return;
    setDisplay((value) => `${value}${key === '(−)' ? '-' : key}`);
  };

  return (
    <div className="calculator-tool" role="dialog" aria-label="Calculator">
      <div className="calculator-display">{display}</div>
      <div className="calculator-grid">
        {keys.map((key) => <button key={key} onClick={() => press(key)}>{key}</button>)}
      </div>
    </div>
  );
}

function ToolOverlays({ tools }) {
  return (
    <>
      {tools.ruler && <img className="ruler-overlay" src="/assets/ruler.svg" alt="Movable ruler" />}
      {tools.protractor && <img className="protractor-overlay" src="/assets/protractor.png" alt="Movable protractor" />}
      {tools.calculator && <CalculatorTool />}
    </>
  );
}

function ExamSideControls({
  canControlTest,
  sessionComplete,
  hasBookmark,
  onHome,
  onRestart,
  onEnd,
}) {
  const testDisabled = !canControlTest || sessionComplete;
  return (
    <aside className="exam-side-controls" aria-label="Practice test controls">
      <div className="exam-side-status">
        <span className={hasBookmark ? 'saved' : ''}><CheckCircle2 size={19} /></span>
        <strong>{hasBookmark ? '进度已自动保存' : '模拟考试控制'}</strong>
        <small>{hasBookmark ? 'Progress auto-saved' : 'Practice controls'}</small>
      </div>
      <button type="button" onClick={onHome}>
        <Home size={23} />
        <span><strong>回到主屏幕</strong><small>Main screen</small></span>
      </button>
      <button type="button" onClick={onRestart} disabled={testDisabled}>
        <RotateCcw size={23} />
        <span><strong>重新考试</strong><small>Restart test</small></span>
      </button>
      <button type="button" className="end-test-control" onClick={onEnd} disabled={testDisabled}>
        <Square size={21} fill="currentColor" />
        <span><strong>结束考试</strong><small>End test</small></span>
      </button>
      {canControlTest && !sessionComplete && <p>离开后再次进入模拟做题，将自动回到当前进度。</p>}
    </aside>
  );
}

function EndExamDialog({ answered, total, onCancel, onConfirm }) {
  const remaining = Math.max(0, total - answered);
  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onCancel]);

  return (
    <div className="end-exam-backdrop" role="presentation">
      <section className="end-exam-dialog" role="dialog" aria-modal="true" aria-labelledby="end-exam-title">
        <span className="end-exam-dialog-icon"><Square size={26} fill="currentColor" /></span>
        <h1 id="end-exam-title">结束考试 <small>End test</small></h1>
        <p>你已完成 <strong>{answered}</strong> / {total} 题。</p>
        {remaining > 0 && <p>还有 {remaining} 题未作答；确认后只会显示已经完成题目的批改结果。</p>}
        <p className="end-exam-dialog-en">You can continue, or end now and review completed answers only.</p>
        <div className="end-exam-actions">
          <button type="button" onClick={onCancel}>继续考试<small>Continue</small></button>
          <button type="button" className="confirm-end" onClick={onConfirm}>确认结束<small>End & review</small></button>
        </div>
      </section>
    </div>
  );
}

function FinishConfirm({ grade, domain, onReturn, onSubmit }) {
  return (
    <section className="finish-confirm">
      <h1>{domain} Demonstration Test Year {grade}</h1>
      <h2>Example Test Student</h2>
      <h3>Are you sure you want to finish the test?</h3>
      <p>Have you completed all questions?<br />Have you reviewed all your answers?</p>
      <div className="two-buttons">
        <button onClick={onReturn}>No</button>
        <button onClick={onSubmit}>Yes</button>
      </div>
    </section>
  );
}

function Submitted({ onRestart, zoomOpen, setZoomOpen, onZoom, domain, result, writingResponse, grade }) {
  const writing = domain === 'Writing';
  const paperTranscription = writing && grade === 3;
  const completedRows = result?.rows.filter((row) => row.complete) ?? [];
  const completedCorrect = completedRows.filter((row) => row.correct).length;
  const percentage = writing || !completedRows.length
    ? null
    : Math.round((completedCorrect / completedRows.length) * 100);
  return (
    <BrandShell onRestart={onRestart} zoomOpen={zoomOpen} setZoomOpen={setZoomOpen} onZoom={onZoom} contentClass="submitted-wrap">
      <section className="submitted-card">
        <h1><span>Example Test Student</span>your test has been submitted.</h1>
        {writing ? (
          <div className="submission-result">
            <strong>{paperTranscription ? 'Parent transcription saved' : 'Writing response saved'}</strong>
            <p>{writingResponse.trim().split(/\s+/).filter(Boolean).length} words are ready for AI rubric scoring.</p>
            {paperTranscription && <p>The saved response is labelled as a parent-entered copy of the Year 3 handwritten paper response.</p>}
          </div>
        ) : (
          <div className="submission-result">
            <strong>{completedCorrect} / {completedRows.length}</strong>
            <p>{percentage === null ? 'No completed answers' : `${percentage}% of completed answers correct`}</p>
            <small>{result.unanswered} unanswered question{result.unanswered === 1 ? '' : 's'} omitted from this review</small>
          </div>
        )}
        {!writing && completedRows.length > 0 && (
          <div className="completed-answer-review">
            <h2>Completed answer review</h2>
            {completedRows.map((row) => (
              <article className={row.correct ? 'answer-correct' : 'answer-incorrect'} key={row.id}>
                <header>
                  <strong>Question {row.number}</strong>
                  <span>{row.correct ? <CheckCircle2 size={18} /> : <XCircle size={18} />}{row.correct ? 'Correct' : 'Incorrect'}</span>
                </header>
                <p className="review-prompt">{row.prompt}</p>
                <dl>
                  <div><dt>Your answer</dt><dd>{row.responseDisplay}</dd></div>
                  {!row.correct && <div><dt>Correct answer</dt><dd>{row.answer}</dd></div>}
                </dl>
                <p>{row.explanation}</p>
              </article>
            ))}
          </div>
        )}
        {!writing && completedRows.length === 0 && <p className="no-completed-answers">No answered questions were available to review.</p>}
        <button onClick={onRestart}>Reopen test</button>
        <div className="acknowledgements">
          <strong>Acknowledgements</strong>
          <p>This independent practice experience uses the original question bank created for NAPLAN Learning Assistant.</p>
          <p>These are not official NAPLAN test questions and the result is not an official NAPLAN score.</p>
        </div>
      </section>
    </BrandShell>
  );
}

function resumeMode(savedMode, domain) {
  if (domain === 'Writing') {
    if (['writing-prompt', 'paper-writing', 'writing-editor'].includes(savedMode)) return savedMode;
    return 'writing-prompt';
  }
  return ['question', 'progress', 'section', 'review'].includes(savedMode) ? savedMode : 'question';
}

function Player({
  grade,
  domain,
  writingTask,
  formSeed,
  questions,
  sectionBreakAfter,
  onSubmitted,
  onCompleted,
  endRequestId,
  zoomOpen,
  setZoomOpen,
  onZoom,
  zoomLabel,
}) {
  const total = questions.length;
  const progressKey = practiceProgressKey(grade, domain, writingTask);
  const sessionId = practiceSessionId(grade, domain, writingTask);
  const saved = useMemo(() => {
    try {
      return JSON.parse(window.localStorage.getItem(progressKey) || '{}');
    } catch {
      return {};
    }
  }, [progressKey]);
  const [question, setQuestion] = useState(() => Math.min(total, Math.max(1, Number(saved.question) || 1)));
  const [mode, setMode] = useState(() => resumeMode(saved.mode, domain));
  const [answers, setAnswers] = useState(saved.answers ?? {});
  const [flagged, setFlagged] = useState(new Set(saved.flagged ?? []));
  const [visited, setVisited] = useState(new Set(saved.visited ?? [1]));
  const [writingResponse, setWritingResponse] = useState(saved.writingResponse ?? '');
  const [timeHidden, setTimeHidden] = useState(false);
  const [audioVisible, setAudioVisible] = useState(domain === 'Writing' || domain === 'Numeracy');
  const [tools, setTools] = useState({ ruler: false, protractor: false, calculator: false });
  const [calculatorSection, setCalculatorSection] = useState(saved.calculatorSection ?? !sectionBreakAfter);
  const [endDialogOpen, setEndDialogOpen] = useState(false);
  const submissionSaved = useRef(false);
  const elapsedSeconds = useRef(Math.max(0, Number(saved.elapsed_seconds) || 0));
  const timeLimitSeconds = domain === 'Writing'
    ? (grade === 3 ? 40 : 42) * 60
    : 2 * 60 * 60;
  const [remainingSeconds, setRemainingSeconds] = useState(() => Math.max(0, timeLimitSeconds - elapsedSeconds.current));
  const currentItem = questions[question - 1];
  const audioText = useMemo(() => {
    const scripted = currentItem?.stimulus?.audio_script;
    if (scripted) return scripted;
    if (domain === 'Writing') {
      return [
        currentItem?.stimulus?.title,
        currentItem?.prompt,
        currentItem?.stimulus?.context,
        currentItem?.stimulus?.instructions,
      ].filter(Boolean).join('. ');
    }
    return currentItem?.prompt || '';
  }, [currentItem, domain]);
  const audioPlayback = useMicrosoftTts({
    text: audioText,
    playbackKey: currentItem?.id || `${domain}-${question}`,
  });
  const audioPlaying = audioPlayback.status === 'playing';
  const toolAvailability = {
    ruler: domain === 'Numeracy' && Boolean(currentItem?.tool_policy?.ruler),
    protractor: domain === 'Numeracy' && Boolean(currentItem?.tool_policy?.protractor),
    calculator: domain === 'Numeracy' && calculatorSection && Boolean(currentItem?.tool_policy?.calculator),
  };
  const result = domain === 'Writing' ? null : scorePracticeTest(questions, answers);
  const answeredCount = domain === 'Writing'
    ? (writingResponse.trim() ? 1 : 0)
    : result.rows.filter((row) => row.complete).length;

  const submitTest = () => {
    if (!submissionSaved.current) {
      savePracticeSubmission({
        year: grade,
        domain,
        writingTask,
        questions,
        result,
        writingResponse,
        durationSeconds: elapsedSeconds.current,
      });
      submissionSaved.current = true;
    }
    window.localStorage.removeItem(progressKey);
    clearActivePracticeSession();
    clearLivePracticeMistakes(sessionId);
    notifyLiveMistakesChanged();
    onCompleted?.();
    setEndDialogOpen(false);
    setMode('submitted');
  };

  useEffect(() => {
    if (mode === 'submitted') return;
    window.localStorage.setItem(progressKey, JSON.stringify({
      question,
      mode,
      answers,
      flagged: [...flagged],
      visited: [...visited],
      writingResponse,
      calculatorSection,
      elapsed_seconds: elapsedSeconds.current,
    }));
    saveActivePracticeSession({ year: grade, domain, writingTask, formSeed });
  }, [answers, calculatorSection, domain, flagged, formSeed, grade, mode, progressKey, question, visited, writingResponse, writingTask]);

  useEffect(() => {
    if (endRequestId > 0 && mode !== 'submitted') setEndDialogOpen(true);
  }, [endRequestId, mode]);

  useEffect(() => {
    if (mode === 'submitted') return undefined;
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      elapsedSeconds.current += 1;
      const nextRemaining = Math.max(0, timeLimitSeconds - elapsedSeconds.current);
      setRemainingSeconds(nextRemaining);
      if (nextRemaining === 0) {
        submitTest();
        return;
      }
      if (elapsedSeconds.current % 5 === 0) {
        if (submissionSaved.current) return;
        let current = {};
        try {
          current = JSON.parse(window.localStorage.getItem(progressKey) || '{}');
        } catch {
          current = {};
        }
        window.localStorage.setItem(progressKey, JSON.stringify({
          ...current,
          elapsed_seconds: elapsedSeconds.current,
        }));
      }
    }, 1000);

    return () => {
      window.clearInterval(timer);
      if (submissionSaved.current) return;
      let current = {};
      try {
        current = JSON.parse(window.localStorage.getItem(progressKey) || '{}');
      } catch {
        current = {};
      }
      window.localStorage.setItem(progressKey, JSON.stringify({
        ...current,
        elapsed_seconds: elapsedSeconds.current,
      }));
    };
  }, [mode, progressKey]);

  useEffect(() => {
    setVisited((current) => {
      if (current.has(question)) return current;
      const next = new Set(current);
      next.add(question);
      return next;
    });
  }, [question]);

  useEffect(() => {
    setTools((current) => ({
      ruler: current.ruler && toolAvailability.ruler,
      protractor: current.protractor && toolAvailability.protractor,
      calculator: current.calculator && toolAvailability.calculator,
    }));
  }, [toolAvailability.calculator, toolAvailability.protractor, toolAvailability.ruler]);

  const currentAnswer = answers[question];
  const setCurrentAnswer = (value) => setAnswers((current) => ({ ...current, [question]: value }));

  const toggleFlag = () => {
    setFlagged((current) => {
      const next = new Set(current);
      if (next.has(question)) next.delete(question);
      else next.add(question);
      return next;
    });
  };

  const toggleAudio = audioPlayback.toggle;

  const toggleTool = (tool) => setTools((current) => ({ ...current, [tool]: !current[tool] }));

  const goToQuestion = (number) => {
    setQuestion(number);
    setMode('question');
  };

  const nextQuestion = () => {
    if (sectionBreakAfter && question === sectionBreakAfter && !calculatorSection) {
      setMode('section');
      return;
    }
    if (question >= total) {
      setMode('review');
      return;
    }
    setQuestion((current) => current + 1);
  };

  if (mode === 'submitted') {
    return (
      <Submitted
        onRestart={onSubmitted}
        zoomOpen={zoomOpen}
        setZoomOpen={setZoomOpen}
        onZoom={onZoom}
        domain={domain}
        result={result}
        writingResponse={writingResponse}
        grade={grade}
      />
    );
  }

  return (
    <div className={`player-shell theme-player-${domain.toLowerCase().replaceAll(' ', '-')}`}>
      <PlayerToolbar
        question={question}
        total={total}
        showProgress={() => total > 1 && setMode((current) => current === 'progress' ? 'question' : 'progress')}
        timeHidden={timeHidden}
        setTimeHidden={setTimeHidden}
        audioVisible={audioVisible}
        setAudioVisible={(domain === 'Writing' || domain === 'Numeracy') ? setAudioVisible : null}
        tools={tools}
        toggleTool={domain === 'Numeracy' ? toggleTool : null}
        toolAvailability={toolAvailability}
        zoomOpen={zoomOpen}
        setZoomOpen={setZoomOpen}
        onZoom={onZoom}
        zoomLabel={zoomLabel}
        remainingSeconds={remainingSeconds}
        progressOpen={mode === 'progress'}
      />

      <main className="player-main">
        {mode === 'writing-prompt' && (
          <WritingPrompt
            item={currentItem}
            audioVisible={audioVisible}
            audioPlayback={audioPlayback}
            paperMode={grade === 3}
            onStart={() => setMode(grade === 3 ? 'paper-writing' : 'writing-editor')}
          />
        )}
        {mode === 'paper-writing' && (
          <PaperWritingStage
            item={currentItem}
            onPrompt={() => setMode('writing-prompt')}
            onComplete={() => setMode('writing-editor')}
          />
        )}
        {mode === 'writing-editor' && (
          <WritingEditor
            item={currentItem}
            response={writingResponse}
            setResponse={setWritingResponse}
            paperEntry={grade === 3}
            onPrompt={() => setMode(grade === 3 ? 'paper-writing' : 'writing-prompt')}
            onFinish={() => setMode('finish-confirm')}
          />
        )}
        {mode === 'question' && (
          <>
            {audioVisible && domain === 'Numeracy' && <AudioBar playback={audioPlayback} />}
            <div className={`question-content ${audioVisible && domain === 'Numeracy' ? 'with-audio' : ''}`}>
              {domain === 'Reading' && (
                <ReadingQuestion
                  item={currentItem}
                  answer={currentAnswer}
                  setAnswer={setCurrentAnswer}
                  audioPlaying={audioPlaying}
                  toggleAudio={toggleAudio}
                />
              )}
              {domain === 'Numeracy' && (
                <NumeracyQuestion
                  item={currentItem}
                  answer={currentAnswer}
                  setAnswer={setCurrentAnswer}
                  audioPlayback={audioPlayback}
                />
              )}
              {domain === 'Conventions of language' && (
                <ConventionsQuestion
                  item={currentItem}
                  answer={currentAnswer}
                  setAnswer={setCurrentAnswer}
                  audioPlayback={audioPlayback}
                />
              )}
            </div>
            <PlayerFooter
              showBack={question > 1}
              onBack={() => setQuestion((current) => Math.max(1, current - 1))}
              onFlag={toggleFlag}
              flagged={flagged.has(question)}
              onNext={nextQuestion}
            />
          </>
        )}
        {mode === 'section' && (
          <SectionTransition
            type={domain === 'Numeracy' ? 'non-calculator' : 'section'}
            unanswered={result.rows.slice(0, sectionBreakAfter).filter((row) => !row.complete).length}
            onCheck={() => setMode('progress')}
            onContinue={() => {
              if (domain === 'Numeracy') {
                setCalculatorSection(true);
                setQuestion(sectionBreakAfter + 1);
              } else {
                setCalculatorSection(true);
                setQuestion(sectionBreakAfter + 1);
              }
              setMode('question');
            }}
          />
        )}
        {mode === 'progress' && (
          <>
            <ProgressSummary
              total={total}
              answers={answers}
              resultRows={result.rows}
              flagged={flagged}
              visited={visited}
              onQuestion={goToQuestion}
            />
            <PlayerFooter
              showBack
              onBack={() => setMode('question')}
              hideFlag
              onNext={() => setMode('question')}
            />
          </>
        )}
        {mode === 'review' && (
          <>
            <ProgressSummary
              total={total}
              answers={answers}
              resultRows={result.rows}
              flagged={flagged}
              visited={visited}
              end
              onQuestion={goToQuestion}
            />
            <PlayerFooter
              showBack
              onBack={() => {
                setQuestion(total);
                setMode('question');
              }}
              hideFlag
              onNext={() => setMode('finish-confirm')}
              nextLabel="Finish"
            />
          </>
        )}
        {mode === 'finish-confirm' && (
          <FinishConfirm
            grade={grade}
            domain={domain}
            onReturn={() => setMode(domain === 'Writing' ? 'writing-editor' : 'review')}
            onSubmit={submitTest}
          />
        )}
        {domain === 'Numeracy' && <ToolOverlays tools={tools} />}
      </main>
      {endDialogOpen && (
        <EndExamDialog
          answered={answeredCount}
          total={total}
          onCancel={() => setEndDialogOpen(false)}
          onConfirm={submitTest}
        />
      )}
    </div>
  );
}

export function App() {
  const viewport = useStageViewport();
  const viewportRef = useRef(null);
  const initialRoute = useMemo(() => getInitialExamRoute(), []);
  const [screen, setScreen] = useState(initialRoute.screen);
  const [grade, setGrade] = useState(initialRoute.year);
  const [domain, setDomain] = useState(initialRoute.domain);
  const [writingTask, setWritingTask] = useState('Narrative Task');
  const [theme, setTheme] = useState('standard');
  const [zoomOpen, setZoomOpen] = useState(false);
  const [zoomLabel, setZoomLabel] = useState('100%');
  const [examData, setExamData] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [playerRunId, setPlayerRunId] = useState(0);
  const [endRequestId, setEndRequestId] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [hasBookmark, setHasBookmark] = useState(() => Boolean(readActivePracticeSession()));

  const reset = () => {
    window.history.replaceState({}, '', window.location.pathname);
    setScreen('years');
    setDomain('Reading');
    setWritingTask('Narrative Task');
    setZoomOpen(false);
    setExamData(null);
    setLoadError('');
  };

  const selectDomain = (selectedDomain) => {
    setDomain(selectedDomain);
    setScreen(selectedDomain === 'Writing' ? 'writing-task' : 'variant');
  };

  const onZoom = (label) => {
    setZoomLabel(label);
    setZoomOpen(false);
  };

  const startTest = async () => {
    setLoadError('');
    setScreen('loading');
    setSessionComplete(false);
    try {
      const formSeed = Date.now() % 2147483647;
      const loaded = await loadPracticeTest({ year: grade, domain, writingTask, formSeed });
      setExamData({ ...loaded, formSeed });
      setScreen('player');
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'The question bank could not be loaded.');
      setScreen('load-error');
    }
  };

  useEffect(() => {
    if (initialRoute.hasDeepLink) return undefined;
    const bookmark = readActivePracticeSession();
    if (!bookmark || !DOMAINS[bookmark.year]?.includes(bookmark.domain)) return undefined;
    let cancelled = false;
    setGrade(bookmark.year);
    setDomain(bookmark.domain);
    setWritingTask(bookmark.writingTask || 'Narrative Task');
    setLoadError('');
    setScreen('loading');
    loadPracticeTest({
      year: bookmark.year,
      domain: bookmark.domain,
      writingTask: bookmark.writingTask || 'Narrative Task',
      formSeed: bookmark.formSeed || 0,
    }).then((loaded) => {
      if (cancelled) return;
      setExamData({ ...loaded, formSeed: bookmark.formSeed || 0 });
      setHasBookmark(true);
      setSessionComplete(false);
      setScreen('player');
    }).catch((error) => {
      if (cancelled) return;
      setLoadError(error instanceof Error ? error.message : 'The saved practice test could not be loaded.');
      setScreen('load-error');
    });
    return () => {
      cancelled = true;
    };
  }, [initialRoute.hasDeepLink]);

  const restartCurrentTest = () => {
    if (screen !== 'player') return;
    const sessionId = practiceSessionId(grade, domain, writingTask);
    window.localStorage.removeItem(practiceProgressKey(grade, domain, writingTask));
    clearActivePracticeSession();
    clearLivePracticeMistakes(sessionId);
    notifyLiveMistakesChanged();
    setSessionComplete(false);
    setHasBookmark(true);
    setEndRequestId(0);
    setPlayerRunId((value) => value + 1);
  };

  const returnToMainScreen = () => {
    setHasBookmark(Boolean(readActivePracticeSession()) || screen === 'player');
    window.location.assign('/');
  };

  const stageClass = `exam-stage theme-${theme} ui-zoom-${zoomLabel.replace('%', '').toLowerCase()}`;
  const sideRailWidth = viewport.width >= 1440 ? 232 : 0;
  const availableViewportWidth = Math.max(320, viewport.width - (sideRailWidth * 2));
  const normalHeightScale = Math.min(viewport.height / 768, 1);
  const baseWidth = Math.max(1024, Math.min(1280, availableViewportWidth / normalHeightScale));
  const baseHeight = 768;
  const fitScale = Math.min(availableViewportWidth / baseWidth, viewport.height / baseHeight, 1);
  const zoomScale = zoomLabel === 'Fit'
    ? fitScale
    : normalHeightScale * (Number.parseInt(zoomLabel, 10) / 100);
  const scaledWidth = baseWidth * zoomScale;
  const scaledHeight = baseHeight * zoomScale;

  const brandScreen = screen !== 'player' && screen !== 'submitted';

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;
    node.scrollTo({ top: 0, left: 0 });
  }, [screen, zoomLabel]);

  return (
    <div className="prototype-viewport" ref={viewportRef}>
      <div className="stage-frame" style={{ width: `${scaledWidth}px`, height: `${scaledHeight}px` }}>
        <div
          className={stageClass}
          style={{
            width: `${baseWidth}px`,
            height: `${baseHeight}px`,
            transform: `scale(${zoomScale})`,
          }}
        >
          {brandScreen && (
            <BrandShell
              onRestart={reset}
              zoomOpen={zoomOpen}
              setZoomOpen={setZoomOpen}
              onZoom={onZoom}
            >
              {screen === 'years' && (
                <MenuCard
                  title="NAPLAN public demonstration"
                  items={[3, 5, 7, 9].map((year) => ({ label: `Year ${year}`, value: year }))}
                  onSelect={(year) => {
                    setGrade(year);
                    setScreen('domains');
                  }}
                />
              )}
              {screen === 'domains' && (
                <MenuCard
                  title={`Year ${grade}`}
                  items={DOMAINS[grade]}
                  onSelect={selectDomain}
                  onBack={() => setScreen('years')}
                />
              )}
              {screen === 'writing-task' && (
                <MenuCard
                  title={`Year ${grade} Writing`}
                  items={['Narrative Task', 'Persuasive Task']}
                  onSelect={(task) => {
                    setWritingTask(task);
                    setScreen(grade === 3 ? 'year3-writing-info' : 'variant');
                  }}
                  onBack={() => setScreen('domains')}
                />
              )}
              {screen === 'year3-writing-info' && (
                <Year3WritingNotice
                  writingTask={writingTask}
                  onBack={() => setScreen('writing-task')}
                  onStart={startTest}
                />
              )}
              {screen === 'variant' && (
                <MenuCard
                  title={`Year ${grade} ${domain}${domain === 'Writing' ? ` - ${writingTask}` : ''}`}
                  items={[
                    { label: 'Standard test', value: 'standard' },
                    ...(domain === 'Writing' ? [] : [{ label: DOMAIN_ALTERNATIVES[domain], value: 'alternative' }]),
                    { label: 'Colour themes', value: 'themes' },
                  ]}
                  onSelect={(value) => value === 'themes' ? setScreen('themes') : setScreen('session')}
                  onBack={() => setScreen(domain === 'Writing' ? 'writing-task' : 'domains')}
                  compact
                />
              )}
              {screen === 'themes' && (
                <ThemeCard theme={theme} setTheme={setTheme} onBack={() => setScreen('variant')} />
              )}
              {screen === 'session' && <LoginScreen type="session" onNext={() => setScreen('student-code')} />}
              {screen === 'student-code' && <LoginScreen type="student" onNext={() => setScreen('identity')} />}
              {screen === 'identity' && (
                <IdentityScreen
                  grade={grade}
                  domain={domain}
                  onNo={() => setScreen('student-code')}
                  onYes={() => setScreen('dashboard')}
                />
              )}
              {screen === 'dashboard' && (
                <Dashboard grade={grade} domain={domain} onStart={startTest} />
              )}
              {screen === 'loading' && (
                <section className="bank-status-card" aria-live="polite">
                  <span className="bank-loader" />
                  <h1>Preparing your practice test</h1>
                  <p>Loading original Year {grade} {domain} questions from the connected bank…</p>
                </section>
              )}
              {screen === 'load-error' && (
                <section className="bank-status-card">
                  <h1>Question bank unavailable</h1>
                  <p>{loadError}</p>
                  <button className="large-primary" onClick={() => setScreen('dashboard')}>Back</button>
                </section>
              )}
            </BrandShell>
          )}
          {screen === 'player' && examData && (
            <Player
              key={`${grade}-${domain}-${writingTask}-${playerRunId}`}
              grade={grade}
              domain={domain}
              writingTask={writingTask}
              formSeed={examData.formSeed}
              questions={examData.questions}
              sectionBreakAfter={examData.sectionBreakAfter}
              onSubmitted={reset}
              onCompleted={() => {
                setSessionComplete(true);
                setHasBookmark(false);
              }}
              endRequestId={endRequestId}
              zoomOpen={zoomOpen}
              setZoomOpen={setZoomOpen}
              onZoom={onZoom}
              zoomLabel={zoomLabel}
            />
          )}
        </div>
      </div>
      <ExamSideControls
        canControlTest={screen === 'player'}
        sessionComplete={sessionComplete}
        hasBookmark={hasBookmark || (screen === 'player' && !sessionComplete)}
        onHome={returnToMainScreen}
        onRestart={restartCurrentTest}
        onEnd={() => setEndRequestId((value) => value + 1)}
      />
    </div>
  );
}
