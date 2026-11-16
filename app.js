'use strict';
/* GymTrack — seguimiento de entrenamientos de hipertrofia.
   Todo se guarda en localStorage (solo en este dispositivo). */

const KEY = 'gymtrack.v1';
const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DAYS_SHORT = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
const REST_OPTIONS = [30, 45, 60, 75, 90, 120, 150, 180, 240, 300];
const LB_PER_KG = 2.20462;
const ACTIVITY = [
  { v: 1.375, l: 'Ligera (1-3 días/sem)' },
  { v: 1.55, l: 'Moderada (4 días gym + pasos)' },
  { v: 1.725, l: 'Alta (5-6 días o trabajo activo)' },
];

/* Imágenes de referencia: free-exercise-db (dominio público, Unlicense).
   Las de la rutina por defecto van incluidas en /img; el resto se cargan del repositorio original. */
const IMG_REMOTE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';
const IMG_BY_NAME = {
  'Press de banca con barra': 'Barbell_Bench_Press_-_Medium_Grip',
  'Press inclinado con mancuernas': 'Incline_Dumbbell_Press',
  'Press en máquina convergente': 'Leverage_Chest_Press',
  'Cruce de poleas (alto a bajo)': 'Cable_Crossover',
  'Fondos en paralelas (lastrados)': 'Dips_-_Chest_Version',
  'Press francés con barra EZ': 'EZ-Bar_Skullcrusher',
  'Extensión de tríceps en polea con cuerda': 'Triceps_Pushdown_-_Rope_Attachment',
  'Extensión sobre la cabeza en polea': 'Cable_Rope_Overhead_Triceps_Extension',
  'Sentadilla trasera con barra': 'Barbell_Full_Squat',
  'Prensa de pierna': 'Leg_Press',
  'Sentadilla búlgara': 'Split_Squat_with_Dumbbells',
  'Extensión de cuádriceps': 'Leg_Extensions',
  'Curl femoral sentado': 'Seated_Leg_Curl',
  'Elevación de talones de pie': 'Standing_Calf_Raises',
  'Crunch en polea': 'Cable_Crunch',
  'Dominadas lastradas': 'Weighted_Pull_Ups',
  'Remo con barra': 'Bent_Over_Barbell_Row',
  'Jalón al pecho agarre neutro': 'V-Bar_Pulldown',
  'Remo en máquina con pecho apoyado': 'Lying_T-Bar_Row',
  'Pullover en polea': 'Straight-Arm_Pulldown',
  'Face pull': 'Face_Pull',
  'Curl con barra': 'Barbell_Curl',
  'Curl inclinado con mancuernas': 'Incline_Dumbbell_Curl',
  'Curl martillo': 'Hammer_Curls',
  'Peso muerto rumano': 'Romanian_Deadlift',
  'Hip thrust con barra': 'Barbell_Hip_Thrust',
  'Sentadilla hack': 'Hack_Squat',
  'Curl femoral acostado': 'Lying_Leg_Curls',
  'Zancadas caminando': 'Barbell_Walking_Lunge',
  'Aducción en máquina': 'Thigh_Adductor',
  'Elevación de talones sentado': 'Seated_Calf_Raise',
};
const BUNDLED = new Set(Object.values(IMG_BY_NAME));
const imgUrl = (id, n = 0) => (BUNDLED.has(id) ? `img/${id}/${n}.jpg` : `${IMG_REMOTE}${encodeURIComponent(id)}/${n}.jpg`);
const MUSCLE_ES = {
  abdominals: 'abdomen', hamstrings: 'femoral', adductors: 'aductores', quadriceps: 'cuádriceps', biceps: 'bíceps',
  shoulders: 'hombro', chest: 'pecho', 'middle back': 'espalda media', calves: 'pantorrilla', glutes: 'glúteo',
  'lower back': 'espalda baja', lats: 'dorsal', triceps: 'tríceps', traps: 'trapecio', forearms: 'antebrazo', neck: 'cuello', abductors: 'abductores',
};
const QUERY_ES = {
  banca: 'bench', mancuerna: 'dumbbell', mancuernas: 'dumbbell', barra: 'barbell', polea: 'cable', poleas: 'cable',
  sentadilla: 'squat', remo: 'row', prensa: 'press', zancada: 'lunge', zancadas: 'lunge', dominada: 'pull', dominadas: 'pull',
  fondos: 'dips', jalon: 'pulldown', lateral: 'lateral', laterales: 'lateral', elevacion: 'raise', elevaciones: 'raise', militar: 'military',
  hombro: 'shoulder', pantorrilla: 'calf', talones: 'calf', muerto: 'deadlift', inclinado: 'incline', declinado: 'decline',
  maquina: 'machine', aperturas: 'fly', apertura: 'fly', cruce: 'crossover', encogimiento: 'shrug', encogimientos: 'shrug',
  plancha: 'plank', martillo: 'hammer', frances: 'skullcrusher', extension: 'extension', cuerda: 'rope', pecho: 'chest',
  espalda: 'back', pierna: 'leg', femoral: 'leg curl', gluteo: 'glute', biceps: 'biceps', triceps: 'triceps', abdominal: 'crunch',
  abdomen: 'abdominals', cuadriceps: 'quadriceps', trasera: 'rear', frontal: 'front', sentado: 'seated', acostado: 'lying', pie: 'standing',
};

/* ---------- Utilidades ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
const pad = n => String(n).padStart(2, '0');
const isoDate = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseDate = iso => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
const num = v => { const n = parseFloat(String(v ?? '').replace(',', '.')); return Number.isFinite(n) ? n : 0; };
const fmtNum = n => (Math.round(n * 10) / 10).toLocaleString('es');
const fmtInt = n => Math.round(n).toLocaleString('es');
function fmtTime(sec) { sec = Math.max(0, Math.round(sec)); const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60; return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`; }
function fmtDur(sec) { const h = Math.floor(sec / 3600), m = Math.round((sec % 3600) / 60); return h ? `${h} h ${m} min` : `${m} min`; }
function fmtDate(iso, opts = { weekday: 'short', day: 'numeric', month: 'short' }) { return parseDate(iso).toLocaleDateString('es', opts); }
function repRange(reps) {
  const m = String(reps).match(/(\d+)\s*(?:-|–|a)\s*(\d+)/);
  if (m) return [+m[1], +m[2]];
  const s = String(reps).match(/\d+/);
  return s ? [+s[0], +s[0]] : [8, 12];
}
const e1rm = (w, r) => (w > 0 && r > 0 ? w * (1 + r / 30) : 0); // Epley
const restLabel = s => (s >= 60 ? (s % 60 ? fmtTime(s) : `${s / 60} min`) : `${s} s`);

/* ---------- Rutina por defecto (hipertrofia, nivel avanzado) ---------- */
function E(name, sets, reps, rest, notes = '') { return { id: uid(), name, sets, reps, rest, notes, img: IMG_BY_NAME[name] || '' }; }
function defaultRoutines() {
  return [
    { id: uid(), name: 'Pecho y Tríceps', day: 1, exercises: [
      E('Press de banca con barra', 4, '6-8', 180, 'Compuesto principal. RIR 1-2. Baja en 2-3 s, sin rebotar.'),
      E('Press inclinado con mancuernas', 4, '8-10', 120, 'Banco a 30°. Estira bien abajo.'),
      E('Press en máquina convergente', 3, '10-12', 90, 'Pausa de 1 s con el pecho estirado.'),
      E('Cruce de poleas (alto a bajo)', 3, '12-15', 60, 'Última serie al fallo.'),
      E('Fondos en paralelas (lastrados)', 3, '8-10', 120, 'Torso inclinado al frente. Peso = lastre.'),
      E('Press francés con barra EZ', 3, '8-10', 90, 'Codos fijos, baja detrás de la cabeza.'),
      E('Extensión de tríceps en polea con cuerda', 3, '12-15', 60, 'Abre la cuerda al final del movimiento.'),
      E('Extensión sobre la cabeza en polea', 2, '12-15', 60, 'Énfasis cabeza larga. Al fallo.'),
    ] },
    { id: uid(), name: 'Pierna · Cuádriceps', day: 2, exercises: [
      E('Sentadilla trasera con barra', 4, '6-8', 180, 'Compuesto principal. Profundidad completa, RIR 1-2.'),
      E('Prensa de pierna', 4, '10-12', 120, 'Pies a media plataforma, rango completo.'),
      E('Sentadilla búlgara', 3, '8-10', 90, 'Reps por pierna. Descansa al terminar ambas.'),
      E('Extensión de cuádriceps', 3, '12-15', 60, 'Pausa 1 s arriba. Drop set en la última.'),
      E('Curl femoral sentado', 3, '10-12', 75, 'Torso inclinado al frente para más estiramiento.'),
      E('Elevación de talones de pie', 4, '10-15', 60, 'Pausa de 2 s abajo, en estiramiento.'),
      E('Crunch en polea', 3, '12-15', 60, ''),
    ] },
    { id: uid(), name: 'Espalda y Bíceps', day: 3, exercises: [
      E('Dominadas lastradas', 4, '6-8', 150, 'Agarre prono, pecho a la barra. Peso = lastre.'),
      E('Remo con barra', 4, '8-10', 120, 'Torso a ~45°, tira hacia la cadera.'),
      E('Jalón al pecho agarre neutro', 3, '10-12', 90, ''),
      E('Remo en máquina con pecho apoyado', 3, '10-12', 90, 'Aprieta las escápulas 1 s.'),
      E('Pullover en polea', 3, '12-15', 60, 'Brazos casi rectos, siente el dorsal.'),
      E('Face pull', 3, '15-20', 60, 'Deltoide posterior y salud del hombro.'),
      E('Curl con barra', 3, '8-10', 90, 'Sin balanceo.'),
      E('Curl inclinado con mancuernas', 3, '10-12', 60, 'Máximo estiramiento del bíceps.'),
      E('Curl martillo', 2, '12-15', 60, 'Al fallo.'),
    ] },
    { id: uid(), name: 'Pierna · Femoral y Glúteo', day: 4, exercises: [
      E('Peso muerto rumano', 4, '6-8', 180, 'Cadera atrás, barra pegada a las piernas.'),
      E('Hip thrust con barra', 4, '8-10', 120, 'Pausa de 1 s arriba.'),
      E('Sentadilla hack', 3, '8-10', 120, ''),
      E('Curl femoral acostado', 3, '10-12', 75, 'Baja en 3 s.'),
      E('Zancadas caminando', 3, '10-12', 90, 'Reps por pierna.'),
      E('Aducción en máquina', 3, '12-15', 60, ''),
      E('Elevación de talones sentado', 4, '12-15', 60, 'Pausa abajo.'),
    ] },
  ];
}

/* ---------- Estado ---------- */
function freshState() {
  return {
    v: 2,
    profile: { startLb: 200, heightCm: 179, goalLb: 190, age: 26, sex: 'M', activity: 1.55, theme: 'system' },
    routines: defaultRoutines(),
    sessions: [],
    weights: [{ date: isoDate(), lb: 200 }],
    active: null,
  };
}
function load() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY));
    if (d && Array.isArray(d.routines)) return migrate(d);
  } catch (_) { /* sin datos */ }
  return freshState();
}
function migrate(d) {
  const f = freshState();
  const s = { ...f, ...d, profile: { ...f.profile, ...d.profile } };
  if (!d.v || d.v < 2) {
    // v2: imágenes de referencia y edad real (26) en lugar del valor estimado anterior (30).
    if (s.profile.age === 30) s.profile.age = 26;
    const addImg = e => { if (e.img === undefined) e.img = IMG_BY_NAME[e.name] || ''; };
    s.routines.forEach(r => r.exercises.forEach(addImg));
    if (s.active) s.active.exercises.forEach(addImg);
  }
  s.v = 2;
  return s;
}
let S = load();
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); }
  catch (_) { snack('No se pudo guardar en este navegador'); }
}

const ui = { view: 'hoy', pick: null };

/* ---------- Cálculos ---------- */
function currentWeight() {
  if (!S.weights.length) return S.profile.startLb;
  return [...S.weights].sort((a, b) => a.date.localeCompare(b.date)).at(-1).lb;
}
function sameName(a, b) { return a.trim().toLowerCase() === b.trim().toLowerCase(); }
function lastPerf(name) {
  for (let i = S.sessions.length - 1; i >= 0; i--) {
    const e = S.sessions[i].exercises.find(x => sameName(x.name, name));
    if (e && e.sets.length) return { date: S.sessions[i].date, sets: e.sets };
  }
  return null;
}
function suggestion(ex) {
  const lp = lastPerf(ex.name);
  if (!lp) return null;
  const [lo, hi] = repRange(ex.reps);
  const maxW = Math.max(...lp.sets.map(s => num(s.w)));
  if (!(maxW > 0)) return null;
  const top = lp.sets.filter(s => num(s.w) === maxW);
  if (top.every(s => num(s.r) >= hi)) {
    const inc = maxW >= 135 ? 5 : 2.5;
    return { type: 'up', text: `Sube a ${fmtNum(maxW + inc)} lb`, w: maxW + inc };
  }
  if (top.some(s => num(s.r) < lo)) return { type: 'hold', text: `Mantén ${fmtNum(maxW)} lb`, w: maxW };
  return { type: 'reps', text: `${fmtNum(maxW)} lb · busca +1 rep`, w: maxW };
}
function bestByExercise(sessions = S.sessions) {
  const map = new Map();
  for (const s of sessions) for (const e of s.exercises) for (const st of e.sets) {
    const v = e1rm(num(st.w), num(st.r));
    const k = e.name.trim().toLowerCase();
    const cur = map.get(k);
    if (v > 0 && (!cur || v > cur.e1rm)) map.set(k, { name: e.name, e1rm: v, w: num(st.w), r: num(st.r), date: s.date });
  }
  return map;
}
function sessionVolume(s) { return s.exercises.reduce((t, e) => t + e.sets.reduce((u, st) => u + num(st.w) * num(st.r), 0), 0); }
function sessionSets(s) { return s.exercises.reduce((t, e) => t + e.sets.length, 0); }
function routineSets(r) { return r.exercises.reduce((t, e) => t + (+e.sets || 0), 0); }
function routineMinutes(r) { return Math.round(r.exercises.reduce((t, e) => t + (+e.sets || 0) * (40 + (+e.rest || 0)), 0) / 60) + 5; }
function weekStart(d = new Date()) { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }

function nutrition() {
  const p = S.profile;
  const lb = currentWeight();
  const kg = lb / LB_PER_KG;
  const bmr = 10 * kg + 6.25 * p.heightCm - 5 * p.age + (p.sex === 'F' ? -161 : 5);
  const tdee = bmr * p.activity;
  const diff = lb - p.goalLb;
  const mode = diff > 1 ? 'cut' : diff < -1 ? 'bulk' : 'maint';
  const adj = mode === 'cut' ? -450 : mode === 'bulk' ? 250 : 0;
  const kcal = Math.round((tdee + adj) / 10) * 10;
  const protein = Math.round(2.2 * (Math.max(p.goalLb, 1) / LB_PER_KG));
  const fat = Math.round(0.8 * kg);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return { bmr, tdee, kcal, protein, fat, carbs, mode, adj };
}
function weightTrend() {
  const pts = [...S.weights].sort((a, b) => a.date.localeCompare(b.date));
  if (pts.length < 2) return null;
  const last = pts.at(-1);
  const lastT = parseDate(last.date);
  const from = pts.find(p => (lastT - parseDate(p.date)) / 864e5 <= 28) || pts[0];
  const days = (lastT - parseDate(from.date)) / 864e5;
  if (days < 6) return null;
  return (last.lb - from.lb) / days * 7;
}

/* ---------- Render ---------- */
const TITLES = { hoy: 'Hoy', rutinas: 'Rutinas', historial: 'Historial', progreso: 'Progreso', perfil: 'Perfil' };
function render() {
  const v = ui.view;
  $('#title').textContent = v === 'hoy' && S.active ? 'Entrenando' : TITLES[v];
  $$('.nav-item').forEach(a => a.classList.toggle('active', a.dataset.view === v));
  const fn = { hoy: viewHoy, rutinas: viewRutinas, historial: viewHistorial, progreso: viewProgreso, perfil: viewPerfil }[v];
  $('#view').innerHTML = fn();
  updateTicker();
}
function go(view) { if (location.hash !== '#' + view) location.hash = view; else { ui.view = view; render(); } }

/* ---------- Hoy ---------- */
function weekStrip() {
  const ws = weekStart();
  const done = new Set(S.sessions.map(s => s.date));
  const todayIso = isoDate();
  return `<div class="week" aria-label="Semana actual">${WEEK_ORDER.map((dow, i) => {
    const d = new Date(ws); d.setDate(ws.getDate() + i);
    const iso = isoDate(d);
    const planned = S.routines.some(r => r.day === dow);
    const cls = [done.has(iso) ? 'done' : planned ? 'planned' : '', iso === todayIso ? 'today' : ''].join(' ');
    return `<div class="wd ${cls}" title="${DAYS[dow]}"><span class="wd-dot">${done.has(iso) ? '<span class="msr sm">check</span>' : d.getDate()}</span><span class="label-s">${DAYS_SHORT[dow]}</span></div>`;
  }).join('')}</div>`;
}

function viewHoy() {
  if (S.active) return viewActive();
  const dow = new Date().getDay();
  const scheduled = S.routines.find(r => r.day === dow);
  const sel = (ui.pick && S.routines.find(r => r.id === ui.pick)) || scheduled;
  const dateLabel = new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });
  const doneToday = S.sessions.some(s => s.date === isoDate());

  let hero;
  if (sel) {
    hero = `<section class="hero">
      <div class="label-m">${esc(dateLabel)}${sel !== scheduled ? ' · elegida' : ''}</div>
      <h2 class="headline-m">${esc(sel.name)}</h2>
      <div class="hero-meta body-m">
        <span><span class="msr sm">fitness_center</span>${sel.exercises.length} ejercicios</span>
        <span><span class="msr sm">repeat</span>${routineSets(sel)} series</span>
        <span><span class="msr sm">schedule</span>~${routineMinutes(sel)} min</span>
      </div>
      <button class="btn filled lg" data-action="start" data-id="${sel.id}"><span class="msr">play_arrow</span>${doneToday ? 'Entrenar otra vez' : 'Iniciar entrenamiento'}</button>
    </section>`;
  } else {
    hero = `<section class="hero rest">
      <div class="label-m">${esc(dateLabel)}</div>
      <h2 class="headline-m">Día de descanso</h2>
      <p class="body-m" style="margin:8px 0 4px">La recuperación también construye músculo. Para tu meta de peso:</p>
      <ul class="tips body-m">
        <li>Camina 8,000–10,000 pasos o haz 30–40 min de cardio suave.</li>
        <li>Mantén la proteína alta (~${nutrition().protein} g) y duerme 7–9 h.</li>
      </ul>
      <p class="body-s" style="margin-top:12px">¿Quieres entrenar igual? Elige una rutina abajo.</p>
    </section>`;
  }

  const chips = S.routines.length ? `<div class="chips" role="listbox" aria-label="Elegir rutina">${S.routines.map(r =>
    `<button class="chip ${sel && sel.id === r.id ? 'selected' : ''}" data-action="pick" data-id="${r.id}">${sel && sel.id === r.id ? '<span class="msr">check</span>' : ''}${esc(r.name)}${r.day !== null && r.day !== undefined ? ` · ${DAYS[r.day].slice(0, 3)}` : ''}</button>`
  ).join('')}</div>` : '';

  const preview = sel ? `<h3 class="title-m section-title">Ejercicios</h3>
    <section class="card outlined"><ul class="list">${sel.exercises.map((e, i) => {
      const sg = suggestion(e);
      return `<li class="list-item">${e.img ? thumbBtn(e, 'lead-thumb', i + 1) : `<span class="lead">${i + 1}</span>`}<div class="grow">
        <div class="body-l">${esc(e.name)}</div>
        <div class="body-m muted">${e.sets} × ${esc(e.reps)} · descanso ${restLabel(e.rest)}</div>
        ${sg ? `<div style="margin-top:6px"><span class="chip sug ${sg.type}"><span class="msr">${sg.type === 'up' ? 'trending_up' : sg.type === 'hold' ? 'pause' : 'add'}</span>${esc(sg.text)}</span></div>` : ''}
      </div></li>`;
    }).join('')}</ul></section>` : '';

  const thisWeek = S.sessions.filter(s => parseDate(s.date) >= weekStart()).length;
  const planned = S.routines.filter(r => r.day !== null && r.day !== undefined).length;
  const cur = currentWeight();
  const stats = `<div class="stats">
    <div class="stat"><div class="label-m muted">ESTA SEMANA</div><div class="v">${thisWeek}<small>/ ${planned || '—'}</small></div><div class="body-s muted">entrenamientos</div></div>
    <div class="stat"><div class="label-m muted">PESO</div><div class="v">${fmtNum(cur)}<small>lb</small></div><div class="body-s muted">meta ${fmtNum(S.profile.goalLb)} lb</div></div>
  </div>`;

  return hero + weekStrip() + chips + stats + preview;
}

function viewActive() {
  const a = S.active;
  const total = a.exercises.reduce((n, e) => n + e.sets.length, 0);
  const done = a.exercises.reduce((n, e) => n + e.sets.filter(s => s.done).length, 0);
  return `<section class="active-head">
      <div class="grow"><div class="label-m">EN CURSO</div><h2 class="title-l">${esc(a.name)}</h2><div class="body-m muted">${done} de ${total} series</div></div>
      <span class="chip static"><span class="msr">timer</span><span id="elapsed" class="tnum">${fmtTime((Date.now() - a.start) / 1000)}</span></span>
    </section>
    <div class="lp" style="margin-bottom:16px"><div style="width:${total ? done / total * 100 : 0}%"></div></div>
    ${a.exercises.map(exCard).join('')}
    <div class="finish-row">
      <button class="btn outlined danger" data-action="discard"><span class="msr">delete</span>Descartar</button>
      <button class="btn filled" data-action="finish"><span class="msr">flag</span>Terminar entrenamiento</button>
    </div>`;
}

function setDefaults(e, j) {
  const lp = lastPerf(e.name);
  const [, hi] = repRange(e.reps);
  const prev = lp && (lp.sets[j] || lp.sets.at(-1));
  return { w: prev ? prev.w : '', r: prev ? prev.r : hi };
}

/* ---------- Imágenes de referencia ---------- */
function thumbBtn(e, cls, badge = '') {
  return `<button class="thumb-btn ${cls}" data-action="show-img" data-img="${esc(e.img)}" data-name="${esc(e.name)}" aria-label="Ver imagen de ${esc(e.name)}">
    <img src="${imgUrl(e.img)}" alt="" loading="lazy">${badge !== '' ? `<span class="thumb-badge">${badge}</span>` : ''}</button>`;
}
let viewerT = null;
function showImage(id, name) {
  const yt = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(name + ' técnica');
  modal({
    title: esc(name),
    body: `<div class="viewer"><img id="viewer-img" src="${imgUrl(id, 0)}" alt="${esc(name)}"><span class="viewer-tag" id="viewer-tag">Inicio</span></div>
      <div class="viewer-frames">
        <figure><img src="${imgUrl(id, 0)}" alt=""><figcaption class="label-m muted">INICIO</figcaption></figure>
        <figure><img src="${imgUrl(id, 1)}" alt=""><figcaption class="label-m muted">FINAL</figcaption></figure>
      </div>
      <a class="btn text" href="${yt}" target="_blank" rel="noopener" style="margin-top:8px"><span class="msr">play_circle</span>Ver video de técnica</a>`,
    ok: 'Cerrar',
  }).then(() => { clearInterval(viewerT); viewerT = null; });
  let n = 0;
  clearInterval(viewerT);
  viewerT = setInterval(() => {
    const im = $('#viewer-img'); if (!im) return;
    n = 1 - n; im.src = imgUrl(id, n); $('#viewer-tag').textContent = n ? 'Final' : 'Inicio';
  }, 1200);
}

let exIndex = null;
let pickFor = null;
const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
async function openPicker(i) {
  pickFor = i;
  const d = $('#picker');
  const q = draft.exercises[i].name;
  d.innerHTML = `<div class="fs">
    <header class="top-app-bar">
      <button class="icon-btn" data-action="pick-close" aria-label="Cerrar"><span class="msr">arrow_back</span></button>
      <div class="search grow"><span class="msr">search</span><input id="pick-q" type="search" placeholder="Buscar ejercicio (ej. curl, banca, squat)" value="${esc(q)}" autocomplete="off"></div>
    </header>
    <div class="dialog-body"><div class="dialog-body-inner" id="pick-results"><p class="body-m muted" style="padding:16px">Cargando ejercicios…</p></div></div>
  </div>`;
  d.showModal();
  if (!exIndex) {
    try { exIndex = await (await fetch('exercises-index.json')).json(); }
    catch (_) { $('#pick-results').innerHTML = '<p class="body-m muted" style="padding:16px">No se pudo cargar la lista. Revisa tu conexión.</p>'; return; }
  }
  renderPicker();
}
function renderPicker() {
  const box = $('#pick-results'); if (!box || !exIndex) return;
  const words = norm($('#pick-q').value).split(/[^a-z0-9]+/).filter(w => w.length > 1 && !['de', 'con', 'en', 'el', 'la', 'al', 'y', 'a'].includes(w));
  const terms = words.map(w => QUERY_ES[w] || w);
  let res;
  if (!terms.length) res = exIndex.slice(0, 40).map(x => ({ x, s: 0 }));
  else {
    res = exIndex.map(x => {
      const hay = norm(x[1] + ' ' + x[2] + ' ' + (MUSCLE_ES[x[2]] || ''));
      const s = terms.reduce((t, w) => t + (hay.includes(w.split(' ')[0]) ? 1 : 0), 0);
      return { x, s };
    }).filter(r => r.s > 0).sort((a, b) => b.s - a.s || a.x[1].length - b.x[1].length).slice(0, 40);
  }
  box.innerHTML = res.length ? `<p class="body-s muted" style="margin:8px 4px">Base de datos en inglés; puedes escribir en español (banca, polea, sentadilla…).</p><ul class="list">${res.map(({ x }) => `
    <li><button class="pick-row" data-action="pick-img" data-id="${esc(x[0])}">
      <img src="${imgUrl(x[0])}" alt="" loading="lazy">
      <span class="grow"><span class="body-l" style="display:block">${esc(x[1])}</span><span class="body-s muted">${esc(MUSCLE_ES[x[2]] || x[2])}</span></span>
    </button></li>`).join('')}</ul>` : '<p class="body-m muted" style="padding:16px">Sin resultados. Prueba con otra palabra.</p>';
}

function exCard(e, i) {
  const lp = lastPerf(e.name);
  const sg = suggestion(e);
  const allDone = e.sets.length && e.sets.every(s => s.done);
  return `<section class="card outlined ex-card ${allDone ? 'is-done' : ''}" id="ex-${i}">
    <div class="ex-head">
      ${e.img ? thumbBtn(e, 'ex-thumb', allDone ? '<span class="msr">check</span>' : i + 1) : `<div class="ex-idx">${allDone ? '<span class="msr">check</span>' : i + 1}</div>`}
      <div class="grow"><h3 class="title-m">${esc(e.name)}</h3>
        <div class="body-s muted">${e.sets.length} × ${esc(e.reps)} reps · descanso ${restLabel(e.rest)}</div></div>
    </div>
    ${e.notes ? `<p class="body-s note"><span class="msr sm">info</span><span>${esc(e.notes)}</span></p>` : ''}
    ${lp || sg ? `<div class="ex-meta">
      ${sg ? `<span class="chip sug ${sg.type}"><span class="msr">${sg.type === 'up' ? 'trending_up' : sg.type === 'hold' ? 'pause' : 'add'}</span>${esc(sg.text)}</span>` : ''}
      ${lp ? `<span class="body-s muted">Anterior (${fmtDate(lp.date, { day: 'numeric', month: 'short' })}): ${lp.sets.map(s => `${fmtNum(num(s.w))}×${num(s.r)}`).join(' · ')}</span>` : ''}
    </div>` : ''}
    <div class="set-grid">
      <span class="label-s muted">SERIE</span><span class="label-s muted">PESO (LB)</span><span class="label-s muted">REPS</span><span></span>
      ${e.sets.map((s, j) => {
        const df = setDefaults(e, j);
        return `<span class="set-num ${s.done ? 'on' : ''}">${j + 1}</span>
        <input class="set-input ${s.done ? 'on' : ''}" type="text" inputmode="decimal" autocomplete="off" data-set="w" data-e="${i}" data-s="${j}" value="${esc(s.w)}" placeholder="${esc(df.w === '' ? '0' : fmtNum(num(df.w)))}" aria-label="Peso serie ${j + 1}">
        <input class="set-input ${s.done ? 'on' : ''}" type="text" inputmode="numeric" autocomplete="off" data-set="r" data-e="${i}" data-s="${j}" value="${esc(s.r)}" placeholder="${esc(df.r)}" aria-label="Repeticiones serie ${j + 1}">
        <button class="check ${s.done ? 'on' : ''}" data-action="toggle" data-e="${i}" data-s="${j}" aria-pressed="${s.done}" aria-label="Completar serie ${j + 1}"><span class="msr">check</span></button>`;
      }).join('')}
    </div>
    <div class="ex-actions">
      <button class="btn text sm" data-action="add-set" data-e="${i}"><span class="msr">add</span>Serie</button>
      <button class="btn text sm" data-action="rm-set" data-e="${i}" ${e.sets.length <= 1 ? 'disabled' : ''}><span class="msr">remove</span>Serie</button>
      <span class="grow"></span>
      <button class="btn text sm" data-action="rest" data-e="${i}"><span class="msr">timer</span>${fmtTime(e.rest)}</button>
    </div>
  </section>`;
}

function startWorkout(id) {
  const r = S.routines.find(x => x.id === id);
  if (!r) return;
  S.active = {
    routineId: r.id, name: r.name, start: Date.now(), timerEnd: null, timerTotal: 0,
    exercises: r.exercises.map(e => {
      const sg = suggestion(e);
      return {
        name: e.name, reps: e.reps, rest: +e.rest || 90, notes: e.notes || '', img: e.img || '',
        sets: Array.from({ length: Math.max(1, +e.sets || 1) }, () => ({ w: sg ? String(sg.w) : '', r: '', done: false })),
      };
    }),
  };
  ui.pick = null;
  save(); unlockAudio(); requestWake(); render(); window.scrollTo(0, 0);
}

async function finishWorkout() {
  const a = S.active;
  const exercises = a.exercises
    .map(e => ({ name: e.name, reps: e.reps, sets: e.sets.filter(s => s.done).map(s => ({ w: num(s.w), r: num(s.r) })) }))
    .filter(e => e.sets.length);
  if (!exercises.length) {
    if (await modal({ title: 'Sin series completadas', body: 'No marcaste ninguna serie. ¿Quieres descartar este entrenamiento?', ok: 'Descartar', cancel: 'Seguir entrenando', danger: true })) discardWorkout();
    return;
  }
  const pending = a.exercises.reduce((n, e) => n + e.sets.filter(s => !s.done).length, 0);
  if (pending && !(await modal({ title: '¿Terminar entrenamiento?', body: `Quedan ${pending} series sin marcar; no se guardarán.`, ok: 'Terminar', cancel: 'Cancelar' }))) return;

  const before = bestByExercise();
  const sess = { id: uid(), date: isoDate(new Date(a.start)), routineName: a.name, duration: Math.round((Date.now() - a.start) / 1000), exercises };
  const prs = [];
  for (const e of exercises) {
    const prev = before.get(e.name.trim().toLowerCase());
    const best = e.sets.reduce((b, s) => (e1rm(s.w, s.r) > e1rm(b.w, b.r) ? s : b), { w: 0, r: 0 });
    if (prev && e1rm(best.w, best.r) > prev.e1rm + 0.01) prs.push(`${esc(e.name)}: ${fmtNum(best.w)} lb × ${best.r}`);
  }
  S.sessions.push(sess);
  S.active = null;
  save(); releaseWake(); render();
  modal({
    title: '¡Entrenamiento completado! 💪',
    body: `<div class="stats" style="margin:4px 0 12px">
        <div class="stat"><div class="label-m muted">DURACIÓN</div><div class="v">${fmtDur(sess.duration)}</div></div>
        <div class="stat"><div class="label-m muted">SERIES</div><div class="v">${sessionSets(sess)}</div></div>
        <div class="stat"><div class="label-m muted">VOLUMEN</div><div class="v">${fmtInt(sessionVolume(sess))}<small>lb</small></div></div>
      </div>
      ${prs.length ? `<div class="title-s" style="color:var(--primary)">🏆 Nuevos récords</div><ul class="tips">${prs.map(p => `<li>${p}</li>`).join('')}</ul>` : '<p>Sigue sumando: la sobrecarga progresiva es la clave de la hipertrofia.</p>'}`,
    ok: 'Listo',
  });
}
function discardWorkout() { S.active = null; save(); releaseWake(); render(); snack('Entrenamiento descartado'); }

/* ---------- Temporizador de descanso ---------- */
let tick = null;
let audioCtx = null;
function unlockAudio() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch (_) { /* sin audio */ }
}
function beep(at, freq = 880, dur = 0.18) {
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = 'sine'; o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(0.35, at + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(audioCtx.destination); o.start(at); o.stop(at + dur + 0.02);
}
function alarm() {
  try { if (audioCtx) { const t = audioCtx.currentTime + 0.05; beep(t); beep(t + 0.28); beep(t + 0.56, 1175, 0.35); } } catch (_) { /* ignore */ }
  try { navigator.vibrate && navigator.vibrate([250, 120, 250, 120, 400]); } catch (_) { /* ignore */ }
}
function startTimer(sec) {
  if (!S.active) return;
  S.active.timerEnd = Date.now() + sec * 1000;
  S.active.timerTotal = sec;
  save(); unlockAudio(); ensureTick();
}
function ensureTick() { if (!tick) tick = setInterval(updateTicker, 250); updateTicker(); }
function updateTicker() {
  const a = S.active;
  const t = $('#timer');
  const el = $('#elapsed');
  if (el && a) el.textContent = fmtTime((Date.now() - a.start) / 1000);
  if (!a || !a.timerEnd) {
    t.hidden = true; document.body.classList.remove('has-timer');
    if (!a && tick) { clearInterval(tick); tick = null; }
    else if (a && !tick) ensureTick();
    return;
  }
  const left = (a.timerEnd - Date.now()) / 1000;
  if (left <= 0) {
    const late = left < -5;
    a.timerEnd = null; save();
    t.hidden = true; document.body.classList.remove('has-timer');
    if (!late) { alarm(); snack('¡Descanso terminado! A la siguiente serie 💪'); }
    return;
  }
  t.hidden = false; document.body.classList.add('has-timer');
  t.classList.toggle('ending', left <= 10);
  $('#timer-time').textContent = fmtTime(Math.ceil(left));
  $('#timer-bar').style.width = Math.min(100, (100 * left) / a.timerTotal) + '%';
}

let wakeLock = null;
async function requestWake() {
  try { if ('wakeLock' in navigator && S.active && document.visibilityState === 'visible') wakeLock = await navigator.wakeLock.request('screen'); } catch (_) { /* no soportado */ }
}
function releaseWake() { try { wakeLock && wakeLock.release(); } catch (_) { /* ignore */ } wakeLock = null; }
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { requestWake(); updateTicker(); } });

/* ---------- Rutinas ---------- */
function viewRutinas() {
  const week = `<h3 class="title-m section-title">Tu semana</h3>
    <section class="card filled"><ul class="list">${WEEK_ORDER.map(d => {
      const r = S.routines.find(x => x.day === d);
      const isToday = d === new Date().getDay();
      return `<li class="list-item" style="padding:10px 0">
        <span class="body-l" style="width:96px;${isToday ? 'color:var(--primary);font-weight:500' : ''}">${DAYS[d]}</span>
        <span class="grow body-m ${r ? '' : 'muted'}">${r ? esc(r.name) : 'Descanso / cardio'}</span>
        ${isToday ? '<span class="badge primary">Hoy</span>' : ''}
      </li>`;
    }).join('')}</ul></section>`;

  const cards = S.routines.length ? S.routines.map(r => `<section class="card elevated routine-card">
      <div class="row"><h3 class="title-m grow">${esc(r.name)}</h3>${r.day !== null && r.day !== undefined ? `<span class="badge">${DAYS[r.day]}</span>` : '<span class="badge muted">Sin día</span>'}</div>
      <div class="body-m muted">${r.exercises.length} ejercicios · ${routineSets(r)} series · ~${routineMinutes(r)} min</div>
      <p class="body-s muted ex-names">${r.exercises.map(e => esc(e.name)).join(' · ')}</p>
      <div class="row wrap">
        <button class="btn tonal sm" data-action="edit-routine" data-id="${r.id}"><span class="msr">edit</span>Editar</button>
        <button class="btn text sm" data-action="start" data-id="${r.id}" ${S.active ? 'disabled' : ''}><span class="msr">play_arrow</span>Entrenar</button>
        <button class="btn text sm" data-action="dup-routine" data-id="${r.id}"><span class="msr">content_copy</span>Duplicar</button>
      </div>
    </section>`).join('') : `<div class="empty"><span class="msr">list_alt</span><p>No tienes rutinas.</p><button class="btn tonal" data-action="reset-routines">Restaurar rutina por defecto</button></div>`;

  const guide = `<h3 class="title-m section-title">Guía de descansos · hipertrofia</h3>
    <section class="card outlined">
      <table class="rest-table body-m">
        <tr><td><div class="title-s">Compuestos pesados</div><div class="body-s muted">Banca, sentadilla, peso muerto rumano · 6–8 reps</div></td><td>2:30 – 3:00</td></tr>
        <tr><td><div class="title-s">Compuestos secundarios</div><div class="body-s muted">Press inclinado, remos, prensa, dominadas · 8–12 reps</div></td><td>1:30 – 2:00</td></tr>
        <tr><td><div class="title-s">Aislamiento</div><div class="body-s muted">Poleas, curls, extensiones · 10–15 reps</div></td><td>1:00 – 1:30</td></tr>
        <tr><td><div class="title-s">Pantorrilla y abdomen</div><div class="body-s muted">Series cortas, recuperación rápida</div></td><td>0:45 – 1:00</td></tr>
      </table>
      <p class="body-s muted" style="margin-top:12px">Nivel avanzado: trabaja a RIR 0–2 (0–2 reps en reserva), 10–20 series efectivas por músculo a la semana y aplica sobrecarga progresiva. Descansar lo suficiente para repetir el rendimiento genera más hipertrofia que acortar descansos.</p>
    </section>`;

  return week + `<h3 class="title-m section-title">Mis rutinas</h3>` + cards + guide +
    `<div style="height:72px"></div><button class="fab" data-action="new-routine"><span class="msr">add</span>Nueva rutina</button>`;
}

let draft = null;
function openEditor(id) {
  const src = id ? S.routines.find(x => x.id === id) : { id: uid(), name: '', day: null, exercises: [E('', 3, '8-12', 90)] };
  draft = JSON.parse(JSON.stringify(src));
  draft.isNew = !id;
  renderEditor();
  $('#editor').showModal();
}
function renderEditor() {
  const d = $('#editor');
  const body = d.querySelector('.dialog-body');
  const scroll = body ? body.scrollTop : 0;
  const restOpts = cur => {
    const opts = REST_OPTIONS.includes(+cur) ? REST_OPTIONS : [...REST_OPTIONS, +cur].sort((a, b) => a - b);
    return opts.map(s => `<option value="${s}" ${+cur === s ? 'selected' : ''}>${restLabel(s)}</option>`).join('');
  };
  d.innerHTML = `<div class="fs">
    <header class="top-app-bar">
      <button class="icon-btn" data-action="ed-close" aria-label="Cerrar"><span class="msr">close</span></button>
      <h2 class="title-l grow">${draft.isNew ? 'Nueva rutina' : 'Editar rutina'}</h2>
      <button class="btn filled sm" data-action="ed-save">Guardar</button>
    </header>
    <div class="dialog-body"><div class="dialog-body-inner">
      <div class="field"><label for="ed-name">Nombre de la rutina</label><input id="ed-name" data-ed="name" value="${esc(draft.name)}" placeholder="Ej. Hombro y abdomen" autocomplete="off"></div>
      <div class="field"><label for="ed-day">Día de la semana</label><select id="ed-day" data-ed="day">
        <option value="" ${draft.day === null || draft.day === undefined ? 'selected' : ''}>Sin día fijo</option>
        ${WEEK_ORDER.map(dw => `<option value="${dw}" ${draft.day === dw ? 'selected' : ''}>${DAYS[dw]}</option>`).join('')}
      </select></div>
      <h3 class="title-m section-title">Ejercicios (${draft.exercises.length})</h3>
      ${draft.exercises.map((e, i) => `<div class="card outlined ed-ex">
        <div class="ed-ex-head"><span class="ex-idx">${i + 1}</span>
          <div class="field grow"><label>Ejercicio</label><input data-ed="ex" data-i="${i}" data-f="name" value="${esc(e.name)}" placeholder="Nombre del ejercicio" autocomplete="off"></div></div>
        <div class="ed-grid">
          <div class="field"><label>Series</label><input data-ed="ex" data-i="${i}" data-f="sets" type="number" min="1" max="10" inputmode="numeric" value="${esc(e.sets)}"></div>
          <div class="field"><label>Reps</label><input data-ed="ex" data-i="${i}" data-f="reps" value="${esc(e.reps)}" placeholder="8-12" autocomplete="off"></div>
          <div class="field"><label>Descanso</label><select data-ed="ex" data-i="${i}" data-f="rest">${restOpts(e.rest)}</select></div>
        </div>
        <div class="field"><label>Notas (opcional)</label><input data-ed="ex" data-i="${i}" data-f="notes" value="${esc(e.notes)}" placeholder="Técnica, tempo, RIR…" autocomplete="off"></div>
        <div class="ed-img">
          ${e.img ? `<img src="${imgUrl(e.img)}" alt="" loading="lazy">` : '<span class="ed-img-empty"><span class="msr">image</span></span>'}
          <div class="grow body-s muted">${e.img ? 'Imagen de referencia' : 'Sin imagen de referencia'}</div>
          <button class="btn text sm" data-action="ed-img" data-i="${i}"><span class="msr">${e.img ? 'swap_horiz' : 'add_photo_alternate'}</span>${e.img ? 'Cambiar' : 'Elegir'}</button>
          ${e.img ? `<button class="icon-btn" data-action="ed-img-clear" data-i="${i}" aria-label="Quitar imagen"><span class="msr">hide_image</span></button>` : ''}
        </div>
        <div class="ed-ex-actions">
          <button class="icon-btn" data-action="ed-up" data-i="${i}" ${i === 0 ? 'disabled' : ''} aria-label="Subir"><span class="msr">arrow_upward</span></button>
          <button class="icon-btn" data-action="ed-down" data-i="${i}" ${i === draft.exercises.length - 1 ? 'disabled' : ''} aria-label="Bajar"><span class="msr">arrow_downward</span></button>
          <span class="grow"></span>
          <button class="icon-btn danger" data-action="ed-del" data-i="${i}" aria-label="Eliminar ejercicio"><span class="msr">delete</span></button>
        </div>
      </div>`).join('')}
      <button class="btn tonal full" data-action="ed-add"><span class="msr">add</span>Agregar ejercicio</button>
      ${!draft.isNew ? '<div class="spacer"></div><button class="btn text danger full" data-action="ed-delete-routine"><span class="msr">delete</span>Eliminar rutina</button>' : ''}
    </div></div>
  </div>`;
  const nb = d.querySelector('.dialog-body');
  if (nb) nb.scrollTop = scroll;
}
async function saveEditor() {
  const name = draft.name.trim();
  if (!name) { snack('Ponle un nombre a la rutina'); $('#ed-name').focus(); return; }
  const exercises = draft.exercises
    .map(e => ({ ...e, img: e.img || IMG_BY_NAME[e.name.trim()] || '', name: e.name.trim(), sets: Math.min(10, Math.max(1, parseInt(e.sets, 10) || 3)), reps: String(e.reps).trim() || '8-12', rest: +e.rest || 90 }))
    .filter(e => e.name);
  if (!exercises.length) { snack('Agrega al menos un ejercicio'); return; }
  const r = { id: draft.id, name, day: draft.day, exercises };
  let moved = '';
  if (r.day !== null && r.day !== undefined) {
    const other = S.routines.find(x => x.day === r.day && x.id !== r.id);
    if (other) { other.day = null; moved = ` · "${other.name}" quedó sin día`; }
  }
  const idx = S.routines.findIndex(x => x.id === r.id);
  if (idx >= 0) S.routines[idx] = r; else S.routines.push(r);
  save(); $('#editor').close(); draft = null; render();
  snack('Rutina guardada' + moved);
}

/* ---------- Historial ---------- */
function viewHistorial() {
  if (!S.sessions.length) return `<div class="empty"><span class="msr">history</span><p class="body-l">Aún no hay entrenamientos.</p><p class="body-m">Cuando termines uno aparecerá aquí con su volumen y tus récords.</p><button class="btn filled" data-action="go" data-view="hoy">Ir a Hoy</button></div>`;
  const ws = weekStart();
  const week = S.sessions.filter(s => parseDate(s.date) >= ws);
  const since = Date.now() - 7 * 864e5;
  const vol7 = S.sessions.filter(s => parseDate(s.date) >= since).reduce((t, s) => t + sessionVolume(s), 0);
  const stats = `<div class="stats">
    <div class="stat"><div class="label-m muted">TOTAL</div><div class="v">${S.sessions.length}</div><div class="body-s muted">entrenamientos</div></div>
    <div class="stat"><div class="label-m muted">ESTA SEMANA</div><div class="v">${week.length}</div><div class="body-s muted">${week.reduce((t, s) => t + sessionSets(s), 0)} series</div></div>
    <div class="stat"><div class="label-m muted">VOLUMEN 7 DÍAS</div><div class="v">${fmtInt(vol7)}<small>lb</small></div><div class="body-s muted">peso × reps</div></div>
  </div>`;

  const best = [...bestByExercise().values()].sort((a, b) => b.e1rm - a.e1rm).slice(0, 12);
  const records = best.length ? `<h3 class="title-m section-title">Récords (1RM estimado)</h3>
    <section class="card outlined"><ul class="list">${best.map(b => `<li class="list-item">
      <span class="lead"><span class="msr sm">emoji_events</span></span>
      <div class="grow"><div class="body-l">${esc(b.name)}</div><div class="body-s muted">${fmtNum(b.w)} lb × ${b.r} · ${fmtDate(b.date)}</div></div>
      <div class="trail"><div class="title-m">${fmtInt(b.e1rm)}</div><div class="body-s muted">lb</div></div>
    </li>`).join('')}</ul></section>` : '';

  const list = `<h3 class="title-m section-title">Sesiones</h3>` + [...S.sessions].reverse().map(s => `<details class="session">
    <summary>
      <div class="grow"><div class="title-s">${esc(s.routineName)}</div><div class="body-s muted">${fmtDate(s.date)} · ${fmtDur(s.duration || 0)} · ${sessionSets(s)} series · ${fmtInt(sessionVolume(s))} lb</div></div>
      <span class="msr chev">expand_more</span>
    </summary>
    <div class="session-body">
      ${s.exercises.map(e => `<div class="session-ex"><div class="body-m">${esc(e.name)}</div><div class="body-s muted">${e.sets.map(st => `${fmtNum(num(st.w))}×${num(st.r)}`).join(' · ')}</div></div>`).join('')}
      <div class="row" style="justify-content:flex-end;margin-top:4px"><button class="btn text danger sm" data-action="del-session" data-id="${s.id}"><span class="msr">delete</span>Eliminar</button></div>
    </div>
  </details>`).join('');
  return stats + records + list;
}

/* ---------- Progreso ---------- */
function weightChart() {
  const pts = [...S.weights].sort((a, b) => a.date.localeCompare(b.date));
  if (!pts.length) return '';
  const W = Math.max(280, Math.min(window.innerWidth, 720) - 64), H = 200, pl = 36, pr = 12, pt = 12, pb = 24;
  const goal = S.profile.goalLb;
  const vals = pts.map(p => p.lb).concat(goal);
  const min = Math.floor(Math.min(...vals) - 2), max = Math.ceil(Math.max(...vals) + 2);
  const t0 = parseDate(pts[0].date).getTime();
  const span = Math.max(parseDate(pts.at(-1).date).getTime() - t0, 7 * 864e5);
  const x = t => pl + ((t - t0) / span) * (W - pl - pr);
  const y = v => pt + ((max - v) / (max - min)) * (H - pt - pb);
  const ticks = [];
  const step = Math.max(1, Math.ceil((max - min) / 4));
  for (let v = min; v <= max; v += step) ticks.push(v);
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${x(parseDate(p.date).getTime()).toFixed(1)},${y(p.lb).toFixed(1)}`).join(' ');
  const area = `${path} L${x(parseDate(pts.at(-1).date).getTime()).toFixed(1)},${H - pb} L${x(t0).toFixed(1)},${H - pb} Z`;
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Gráfica de peso corporal">
    ${ticks.map(v => `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" stroke="var(--outline-variant)" stroke-width="1"/><text x="${pl - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`).join('')}
    <line x1="${pl}" x2="${W - pr}" y1="${y(goal)}" y2="${y(goal)}" stroke="var(--tertiary)" stroke-width="1.5" stroke-dasharray="6 4"/>
    <text x="${W - pr}" y="${y(goal) - 6}" text-anchor="end" style="fill:var(--tertiary);font-weight:500">Meta ${fmtNum(goal)}</text>
    ${pts.length > 1 ? `<path d="${area}" fill="var(--primary)" opacity=".1"/><path d="${path}" fill="none" stroke="var(--primary)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>` : ''}
    ${pts.map(p => `<circle cx="${x(parseDate(p.date).getTime())}" cy="${y(p.lb)}" r="${pts.length > 30 ? 2 : 4}" fill="var(--primary)" stroke="var(--surface)" stroke-width="1.5"><title>${fmtDate(p.date)}: ${fmtNum(p.lb)} lb</title></circle>`).join('')}
    <text x="${pl}" y="${H - 6}">${fmtDate(pts[0].date, { day: 'numeric', month: 'short' })}</text>
    ${pts.length > 1 ? `<text x="${W - pr}" y="${H - 6}" text-anchor="end">${fmtDate(pts.at(-1).date, { day: 'numeric', month: 'short' })}</text>` : ''}
  </svg>`;
}

function viewProgreso() {
  const p = S.profile;
  const cur = currentWeight();
  const remaining = cur - p.goalLb;
  const totalToMove = p.startLb - p.goalLb;
  const pct = totalToMove ? Math.max(0, Math.min(1, (p.startLb - cur) / totalToMove)) : 1;
  const n = nutrition();
  const trend = weightTrend();
  const rate = n.mode === 'cut' ? 0.9 : n.mode === 'bulk' ? 0.4 : 0;
  const weeks = rate ? Math.ceil(Math.abs(remaining) / rate) : 0;
  const eta = new Date(Date.now() + weeks * 7 * 864e5);
  const bmi = (cur / LB_PER_KG) / Math.pow(p.heightCm / 100, 2);

  let trendTxt = '';
  if (trend !== null) {
    let advice = '';
    if (n.mode === 'cut') {
      if (trend < -1.5) advice = 'Bajas muy rápido: sube ~150 kcal para proteger el músculo.';
      else if (trend > -0.3) advice = 'Casi sin cambio: baja ~150 kcal o suma 2,000 pasos diarios.';
      else advice = 'Buen ritmo para perder grasa conservando músculo.';
    }
    trendTxt = `<div class="body-m" style="margin-top:12px"><b>Ritmo real:</b> ${trend > 0 ? '+' : ''}${fmtNum(trend)} lb/semana. ${advice}</div>`;
  }

  const goalCard = `<section class="hero">
    <div class="label-m">Objetivo · ${n.mode === 'cut' ? 'definición con hipertrofia' : n.mode === 'bulk' ? 'volumen limpio' : 'recomposición'}</div>
    <div class="row" style="align-items:baseline;gap:8px;margin:6px 0 2px"><span class="headline-m">${fmtNum(cur)} lb</span><span class="body-l">→ ${fmtNum(p.goalLb)} lb</span></div>
    <div class="body-m" style="margin-bottom:12px">${Math.abs(remaining) < 0.5 ? '¡Meta alcanzada! 🎉' : `Faltan ${fmtNum(Math.abs(remaining))} lb${weeks ? ` · ~${weeks} semanas (≈ ${eta.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })})` : ''}`}</div>
    <div class="lp thick" style="background:var(--surface)"><div style="width:${pct * 100}%"></div></div>
    <div class="row body-s" style="justify-content:space-between;margin-top:6px"><span>Inicio ${fmtNum(p.startLb)} lb</span><span>${Math.round(pct * 100)}%</span></div>
    ${trendTxt}
  </section>`;

  const log = `<section class="card filled">
    <h3 class="title-m">Registrar peso</h3>
    <div class="field-row">
      <div class="field"><label for="w-val">Peso (lb)</label><input id="w-val" type="number" step="0.1" inputmode="decimal" value="${fmtNum(cur).replace(',', '.')}"></div>
      <div class="field"><label for="w-date">Fecha</label><input id="w-date" type="date" value="${isoDate()}" max="${isoDate()}"></div>
    </div>
    <button class="btn filled full" data-action="log-weight"><span class="msr">add</span>Guardar registro</button>
    <p class="body-s muted" style="margin-top:8px">Pésate en ayunas 3–7 veces por semana; mira la tendencia, no el dato diario.</p>
  </section>`;

  const chart = `<section class="card outlined"><h3 class="title-m">Peso corporal</h3>${weightChart()}</section>`;

  const nut = `<h3 class="title-m section-title">Nutrición sugerida</h3>
    <section class="card elevated">
      <div class="label-m muted">CALORÍAS DIARIAS</div>
      <div class="kcal">${fmtInt(n.kcal)} <span class="title-m muted">kcal</span></div>
      <div class="body-s muted">Mantenimiento estimado ${fmtInt(n.tdee)} kcal ${n.adj ? `· ${n.adj > 0 ? '+' : '−'}${Math.abs(n.adj)} kcal` : ''}</div>
      <div class="macro-grid">
        <div class="macro"><div class="v">${n.protein} g</div><div class="label-m muted">PROTEÍNA</div></div>
        <div class="macro"><div class="v">${n.carbs} g</div><div class="label-m muted">CARBOS</div></div>
        <div class="macro"><div class="v">${n.fat} g</div><div class="label-m muted">GRASAS</div></div>
      </div>
      <ul class="tips body-m">
        <li>Proteína alta (2.2 g/kg de tu peso meta): reparte en 4–5 comidas de 35–50 g.</li>
        <li>Concentra los carbohidratos antes y después de entrenar para rendir en series pesadas.</li>
        <li>Agua: ~${(cur / LB_PER_KG * 0.04).toFixed(1)} L al día. Creatina 3–5 g diarios si la usas.</li>
        <li>Si tu fuerza cae varias semanas seguidas, sube ligeramente las calorías.</li>
      </ul>
      <p class="body-s muted" style="margin-top:12px">Cálculo Mifflin-St Jeor con edad ${p.age}, ${p.heightCm} cm y actividad ${String(p.activity).replace('.', ',')}. Ajusta tus datos en Perfil. IMC ${fmtNum(bmi)} (no distingue músculo de grasa). Es una guía, no consejo médico.</p>
    </section>`;

  const recent = [...S.weights].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
  const hist = `<h3 class="title-m section-title">Registros recientes</h3>
    <section class="card outlined"><ul class="list">${recent.map((w, i) => {
      const prev = [...S.weights].sort((a, b) => b.date.localeCompare(a.date))[i + 1];
      const delta = prev ? w.lb - prev.lb : 0;
      return `<li class="list-item" style="padding:8px 0">
        <div class="grow"><div class="body-l">${fmtNum(w.lb)} lb</div><div class="body-s muted">${fmtDate(w.date, { weekday: 'long', day: 'numeric', month: 'short' })}</div></div>
        ${prev ? `<span class="body-m" style="color:${delta <= 0 ? 'var(--success)' : 'var(--error)'}">${delta > 0 ? '+' : ''}${fmtNum(delta)}</span>` : ''}
        <button class="icon-btn" data-action="del-weight" data-date="${w.date}" aria-label="Eliminar registro"><span class="msr">close</span></button>
      </li>`;
    }).join('')}</ul></section>`;

  return goalCard + log + chart + nut + (recent.length ? hist : '');
}

/* ---------- Perfil ---------- */
function viewPerfil() {
  const p = S.profile;
  const field = (k, label, type = 'number', extra = '') => `<div class="field"><label for="p-${k}">${label}</label><input id="p-${k}" data-p="${k}" type="${type}" inputmode="decimal" value="${esc(p[k])}" ${extra}></div>`;
  return `<h3 class="title-m section-title">Tus datos</h3>
    <section class="card filled">
      <div class="field-row">
        ${field('startLb', 'Peso inicial (lb)', 'number', 'step="0.1"')}
        ${field('goalLb', 'Peso meta (lb)', 'number', 'step="0.1"')}
        ${field('heightCm', 'Altura (cm)')}
        ${field('age', 'Edad')}
      </div>
      <div class="field-row">
        <div class="field"><label for="p-sex">Sexo (para el cálculo)</label><select id="p-sex" data-p="sex">
          <option value="M" ${p.sex === 'M' ? 'selected' : ''}>Masculino</option>
          <option value="F" ${p.sex === 'F' ? 'selected' : ''}>Femenino</option></select></div>
        <div class="field"><label for="p-act">Nivel de actividad</label><select id="p-act" data-p="activity">
          ${ACTIVITY.map(a => `<option value="${a.v}" ${+p.activity === a.v ? 'selected' : ''}>${a.l}</option>`).join('')}</select></div>
      </div>
      <p class="body-s muted">Tu peso actual se toma del último registro en Progreso (${fmtNum(currentWeight())} lb). Objetivo: hipertrofia · nivel avanzado.</p>
    </section>

    <h3 class="title-m section-title">Apariencia</h3>
    <section class="card filled">
      <div class="seg" role="group" aria-label="Tema">
        ${[['system', 'brightness_auto', 'Sistema'], ['light', 'light_mode', 'Claro'], ['dark', 'dark_mode', 'Oscuro']].map(([v, ic, l]) =>
          `<button class="${p.theme === v ? 'on' : ''}" data-action="theme" data-v="${v}" aria-pressed="${p.theme === v}">${p.theme === v ? '<span class="msr">check</span>' : `<span class="msr">${ic}</span>`}${l}</button>`).join('')}
      </div>
    </section>

    <h3 class="title-m section-title">Tus datos y respaldo</h3>
    <section class="card outlined">
      <p class="body-m muted" style="margin-bottom:12px">Todo se guarda solo en este navegador. Exporta un respaldo de vez en cuando o para pasarlo a otro dispositivo.</p>
      <div class="row wrap">
        <button class="btn tonal" data-action="export"><span class="msr">download</span>Exportar</button>
        <button class="btn outlined" data-action="import"><span class="msr">upload</span>Importar</button>
      </div>
      <div class="spacer"></div>
      <div class="row wrap">
        <button class="btn text" data-action="reset-routines"><span class="msr">restart_alt</span>Restaurar rutina por defecto</button>
        <button class="btn text danger" data-action="wipe"><span class="msr">delete_forever</span>Borrar todo</button>
      </div>
    </section>
    <p class="body-s muted" style="text-align:center;margin:24px 0">GymTrack · instálala desde el menú del navegador para usarla como app y sin conexión.</p>`;
}

/* ---------- Diálogos y snackbar ---------- */
function modal({ title, body, ok = 'Aceptar', cancel = null, danger = false }) {
  return new Promise(res => {
    const d = $('#modal');
    d.innerHTML = `<form method="dialog" class="modal">
      <h2 class="headline-s">${title}</h2>
      <div class="body-m muted modal-body">${body}</div>
      <div class="modal-actions">${cancel ? `<button class="btn text" value="0">${cancel}</button>` : ''}<button class="btn text ${danger ? 'danger' : ''}" value="1">${ok}</button></div>
    </form>`;
    d.returnValue = '';
    d.onclose = () => res(d.returnValue === '1');
    d.showModal();
  });
}
let snackT = null;
function snack(msg) {
  const s = $('#snackbar');
  s.textContent = msg; s.classList.add('show');
  clearTimeout(snackT); snackT = setTimeout(() => s.classList.remove('show'), 3200);
}

function applyTheme() {
  const t = S.profile.theme;
  if (t === 'system') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', t);
  const dark = t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  $$('meta[name="theme-color"]').forEach(m => m.setAttribute('content', dark ? '#111318' : '#f9f9ff'));
}

/* ---------- Eventos ---------- */
document.addEventListener('click', async ev => {
  const b = ev.target.closest('[data-action]');
  if (!b || b.disabled) return;
  const d = b.dataset;
  const a = S.active;
  switch (d.action) {
    case 'go': go(d.view); break;
    case 'pick': ui.pick = d.id; render(); break;
    case 'start':
      if (S.active) { go('hoy'); snack('Ya tienes un entrenamiento en curso'); break; }
      startWorkout(d.id); if (ui.view !== 'hoy') go('hoy');
      break;
    case 'toggle': {
      const e = a.exercises[+d.e], s = e.sets[+d.s];
      s.done = !s.done;
      if (s.done) {
        const df = setDefaults(e, +d.s);
        if (String(s.w).trim() === '') s.w = df.w === '' ? '0' : String(df.w);
        if (String(s.r).trim() === '') s.r = String(df.r);
        e.sets.slice(+d.s + 1).forEach(n => { if (!n.done && String(n.w).trim() === '') n.w = s.w; });
        startTimer(e.rest);
      }
      save(); render();
      break;
    }
    case 'add-set': {
      const e = a.exercises[+d.e]; const last = e.sets.at(-1);
      e.sets.push({ w: last ? last.w : '', r: '', done: false }); save(); render(); break;
    }
    case 'rm-set': { const e = a.exercises[+d.e]; if (e.sets.length > 1) { e.sets.pop(); save(); render(); } break; }
    case 'rest': startTimer(a.exercises[+d.e].rest); break;
    case 'timer-add': if (a && a.timerEnd) { a.timerEnd += 15000; a.timerTotal += 15; save(); updateTicker(); } break;
    case 'timer-sub': if (a && a.timerEnd) { a.timerEnd -= 15000; save(); updateTicker(); } break;
    case 'timer-skip': if (a) { a.timerEnd = null; save(); updateTicker(); } break;
    case 'finish': finishWorkout(); break;
    case 'discard':
      if (await modal({ title: '¿Descartar entrenamiento?', body: 'Se perderán las series registradas de esta sesión.', ok: 'Descartar', cancel: 'Cancelar', danger: true })) discardWorkout();
      break;
    case 'new-routine': openEditor(null); break;
    case 'edit-routine': openEditor(d.id); break;
    case 'dup-routine': {
      const r = S.routines.find(x => x.id === d.id);
      const c = JSON.parse(JSON.stringify(r)); c.id = uid(); c.name = r.name + ' (copia)'; c.day = null; c.exercises.forEach(e => { e.id = uid(); });
      S.routines.push(c); save(); render(); snack('Rutina duplicada'); break;
    }
    case 'show-img': showImage(d.img, d.name); break;
    case 'ed-img': openPicker(+d.i); break;
    case 'ed-img-clear': draft.exercises[+d.i].img = ''; renderEditor(); break;
    case 'pick-close': $('#picker').close(); break;
    case 'pick-img':
      if (draft && pickFor !== null) {
        const ex = draft.exercises[pickFor];
        ex.img = d.id;
        if (!ex.name.trim()) { const it = exIndex && exIndex.find(x => x[0] === d.id); if (it) ex.name = it[1]; }
        renderEditor();
      }
      $('#picker').close();
      break;
    case 'ed-close': $('#editor').close(); draft = null; break;
    case 'ed-save': saveEditor(); break;
    case 'ed-add': draft.exercises.push(E('', 3, '10-12', 90)); renderEditor(); { const ins = $$('#editor [data-f="name"]'); ins.at(-1).focus(); } break;
    case 'ed-up': case 'ed-down': {
      const i = +d.i, j = d.action === 'ed-up' ? i - 1 : i + 1;
      [draft.exercises[i], draft.exercises[j]] = [draft.exercises[j], draft.exercises[i]]; renderEditor(); break;
    }
    case 'ed-del': draft.exercises.splice(+d.i, 1); renderEditor(); break;
    case 'ed-delete-routine':
      if (await modal({ title: '¿Eliminar rutina?', body: `"${esc(draft.name)}" se eliminará. Tu historial no se borra.`, ok: 'Eliminar', cancel: 'Cancelar', danger: true })) {
        S.routines = S.routines.filter(r => r.id !== draft.id); save(); $('#editor').close(); draft = null; render(); snack('Rutina eliminada');
      }
      break;
    case 'del-session':
      if (await modal({ title: '¿Eliminar sesión?', body: 'Esta acción no se puede deshacer.', ok: 'Eliminar', cancel: 'Cancelar', danger: true })) {
        S.sessions = S.sessions.filter(s => s.id !== d.id); save(); render();
      }
      break;
    case 'log-weight': {
      const lb = num($('#w-val').value); const date = $('#w-date').value || isoDate();
      if (lb < 60 || lb > 700) { snack('Escribe un peso válido en libras'); break; }
      S.weights = S.weights.filter(w => w.date !== date).concat({ date, lb: Math.round(lb * 10) / 10 });
      save(); render(); snack(`Peso registrado: ${fmtNum(lb)} lb`); break;
    }
    case 'del-weight': S.weights = S.weights.filter(w => w.date !== d.date); save(); render(); break;
    case 'theme': S.profile.theme = d.v; save(); applyTheme(); render(); break;
    case 'export': {
      const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = Object.assign(document.createElement('a'), { href: url, download: `gymtrack-respaldo-${isoDate()}.json` });
      document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      break;
    }
    case 'import': $('#import-file').click(); break;
    case 'reset-routines':
      if (await modal({ title: '¿Restaurar rutina por defecto?', body: 'Se reemplazarán tus rutinas actuales por Lunes pecho/tríceps, Martes pierna, Miércoles espalda/bíceps y Jueves pierna. Tu historial se conserva.', ok: 'Restaurar', cancel: 'Cancelar' })) {
        S.routines = defaultRoutines(); save(); render(); snack('Rutina por defecto restaurada');
      }
      break;
    case 'wipe':
      if (await modal({ title: '¿Borrar todos los datos?', body: 'Se eliminarán rutinas, historial y registros de peso de este navegador. No se puede deshacer.', ok: 'Borrar todo', cancel: 'Cancelar', danger: true })) {
        S = freshState(); save(); applyTheme(); render(); snack('Datos reiniciados');
      }
      break;
  }
});

document.addEventListener('input', ev => {
  const t = ev.target;
  if (t.id === 'pick-q') { renderPicker(); return; }
  if (t.dataset.set && S.active) {
    const s = S.active.exercises[+t.dataset.e].sets[+t.dataset.s];
    s[t.dataset.set] = t.value.replace(/[^\d.,]/g, '');
    save();
  } else if (t.dataset.ed && draft) {
    if (t.dataset.ed === 'name') draft.name = t.value;
    else if (t.dataset.ed === 'day') draft.day = t.value === '' ? null : +t.value;
    else if (t.dataset.ed === 'ex') draft.exercises[+t.dataset.i][t.dataset.f] = t.dataset.f === 'rest' ? +t.value : t.value;
  }
});
document.addEventListener('change', ev => {
  const t = ev.target;
  if (t.dataset.ed === 'day' && draft) draft.day = t.value === '' ? null : +t.value;
  if (!t.dataset.p) return;
  const k = t.dataset.p;
  if (k === 'sex') S.profile.sex = t.value;
  else {
    const v = num(t.value);
    const limits = { startLb: [60, 700], goalLb: [60, 700], heightCm: [120, 230], age: [13, 100], activity: [1.2, 2] }[k];
    if (!limits || v < limits[0] || v > limits[1]) { snack('Valor fuera de rango'); t.value = S.profile[k]; return; }
    S.profile[k] = v;
  }
  save(); snack('Perfil actualizado');
});
document.addEventListener('keydown', ev => {
  if (ev.key === 'Enter' && ev.target.classList.contains('set-input')) {
    const inputs = $$('.set-input'); const i = inputs.indexOf(ev.target);
    if (inputs[i + 1]) inputs[i + 1].focus(); else ev.target.blur();
  }
});
$('#editor').addEventListener('cancel', () => { draft = null; });
$('#import-file').addEventListener('change', async ev => {
  const f = ev.target.files[0]; ev.target.value = '';
  if (!f) return;
  try {
    const data = JSON.parse(await f.text());
    if (!data || !Array.isArray(data.routines) || !Array.isArray(data.sessions)) throw new Error('formato');
    if (await modal({ title: '¿Importar respaldo?', body: `Contiene ${data.routines.length} rutinas y ${data.sessions.length} sesiones. Reemplazará los datos actuales.`, ok: 'Importar', cancel: 'Cancelar' })) {
      S = migrate(data);
      save(); applyTheme(); render(); snack('Respaldo importado');
    }
  } catch (_) { snack('El archivo no es un respaldo válido de GymTrack'); }
});
window.addEventListener('hashchange', () => { if ($('#modal').open) $('#modal').close(); const v = location.hash.slice(1); ui.view = TITLES[v] ? v : 'hoy'; render(); window.scrollTo(0, 0); });
window.addEventListener('scroll', () => $('#appbar').classList.toggle('scrolled', window.scrollY > 4), { passive: true });
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);

/* ---------- Inicio ---------- */
(function init() {
  const v = location.hash.slice(1);
  ui.view = TITLES[v] ? v : 'hoy';
  applyTheme();
  render();
  if (S.active) { ensureTick(); requestWake(); }
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('sw.js').catch(() => { /* sin SW */ });
  }
})();
