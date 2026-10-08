/* М31 · срез: износ корабля — энергетика, охлаждение, капсульные группы (правила v5).
   DOC «Долгий рейс — износ и смена курса», шаг 2; план и параметры — «Ревью Codex — износ, шаг 2».
   Чистые расчёты без DOM, для браузера и Node. Скрытые броски — снаружи: функция rnd(key) → U в [0, 1)
   (в партии — hidden(s, key) по сиду экспедиции); модуль сам случайность не создаёт.

   Корабль — граф обслуживаемых узлов и их подключений, а не очки здоровья:
     энергоблоки PB1/PB2 → шины BUS1/BUS2 (перемычка между ними) → контуры охлаждения L1–L4 (насос и коллектор)
     → секции радиаторов ядра R1–R4; 20 капсульных групп G01–G20 по 25 мест (холодильник, управление, аварийное питание).
     Группы G01–05 — на L1, … G16–20 — на L4; L1, L2 — на BUS1, L3, L4 — на BUS2. Номинал контура — 5 групп, предел — 7.
   Отказ узла: накопленная интенсивность H = λ0·t + q·(a/η)^k достигает порога E = −ln U (порог задан заранее для
   экземпляра и поколения ремонта). a — эффективный возраст: da/dt = max(0,2; (L/Lном)^3), у выключенного — 0,2
   (календарное старение). Узел хранит опорную точку последнего изменения нагрузки (t0, a0, h0, r): значения на любую
   дату считаются от неё, поэтому ни нарезка перемотки, ни чтение прибора отказов не меняют.
   Шаг 2: случайные отказы включены у насосов, холодильников и управления групп; коллекторы, радиаторы, шины и блоки
   стареют и измеряются, их собственные отказы — вместе с обслуживанием (шаг 3).
   Люди — по номерам мест экспедиции (тот же реестр, что у victims в content.js): человек i живёт в месте i, пока его
   не переложили (moved). ps — статус по номеру: S спит, A на вахте, D погиб.
   Шаг 3b («Ревью Codex — износ, шаг 3», B1–B4): узел — место установки, в нём — конкретный агрегат (sn). Насосы и
   холодильники учитываются экземплярами: на местах, в запасе, снятые, на переборке, в ломе. Снятый агрегат — ещё не лом:
   переборка (насос — до двух раз, холодильник — один; клапанный комплект, материалы, мастерская) даёт агрегат с меньшим
   ресурсом η, разборка — пункты лома. Склад стареет медленнее (0,2 года за год). Лом — единый склад модели. */
(function (root) {
  'use strict';

  const PARAMS = 'wear-step2';
  const YH = 1 / 8766;                                                   // год в часах (365,25 × 24)
  // семейства: η — ресурс, лет нормальной эксплуатации; k — рост интенсивности; l0 — фон, 1/год; live — отказы включены
  const FAM = {
    pump: { eta: 180, k: 3, l0: 0.0005, live: true },
    cooler: { eta: 600, k: 3, l0: 0.0001, live: true },
    control: { eta: 650, k: 3, l0: 0.0001, live: true },
    collector: { eta: 500, k: 4, l0: 0.0001, live: false },
    radiator: { eta: 350, k: 3, l0: 0.0001, live: false },
    power: { eta: 600, k: 3, l0: 0.0001, live: false },
    bus: { eta: 600, k: 3, l0: 0.0001, live: false }
  };
  const NG = 20, SEATS = 25, NOM = 5, MAX = 7;
  const LOOPS = ['L1', 'L2', 'L3', 'L4'], BUSES = ['BUS1', 'BUS2'], BLOCKS = ['PB1', 'PB2'], RADS = ['R1', 'R2', 'R3', 'R4'];
  const GIDS = Array.from({ length: NG }, (_, i) => 'G' + String(i + 1).padStart(2, '0'));
  const SPARES = { pump: 4, valve: 8, control: 8, cooler: 4, powerKit: 1 };
  // агрегаты-экземпляры и восстановление (шаг 3b). Материалы — пункты бюджета; сутки — работа двух специалистов
  const TRACK = ['pump', 'cooler'];
  const REBUILD = {
    pump: { max: 2, materials: { repair: 4, tools: 3, printQC: 2.4 }, days: { repair: [90, 120], tools: [60, 90], printQC: [45, 60] },
      eta: { repair: [117, 81], tools: [135, 99], printQC: [153, 117] } },
    cooler: { max: 1, materials: { repair: 3, tools: 2.25, printQC: 1.8 }, days: { repair: [120], tools: [90], printQC: [60] },
      eta: { repair: [360], tools: [420], printQC: [480] } }
  };
  const SCRAP_OF = { pump: 2, cooler: 1.5, control: 0.25 };            // разборка снятого агрегата, пунктов лома
  const STORE_AGE = 0.2;                                                 // склад: эквивалентных лет старения за календарный год
  const SCRAP_BACK = 0.25;                                               // в лом — четверть расхода материалов рецепта
  const YIELD = { repair: 0.15, tools: 0.25, printQC: 0.35 };            // выход годного при переработке лома
  const BATCH = 4, BATCH_DAYS = 90;                                      // партия переработки: до 4 пунктов, 90 суток одним специалистом
  const BUF = { std: 72, safe: 168 }, RECHARGE = 24;                     // часы аварийного запаса группы; полное восстановление
  const CAPS_RATE = { std: 2e-4, safe: 1e-4 };                          // одиночные отказы капсул на занятое капсуло-лето
  // Фон пути (коэффициенты прежней модели M.losses, calc_life.py §5, §10) — по фактической экспозиции людей:
  // смерть при пробуждении — на живого в год (циклы ротации; у надёжных капсул вдвое реже), несчастные случаи и рак —
  // на бодрствующего, поздние раки — оценка (не смерти): спящие 0,021 Зв/год и бодрствующие 0,112 Зв/год × 2% на Зв,
  // у вахты половина проявляется у цели. Накопление округляется по категории: k-я смерть — когда сумма доходит до k − ½
  const BG = ['revival', 'accident', 'cancer'];
  const bgRate = (w, cat, n) => !w.road ? 0 : cat === 'revival' ? (w.safe ? 0.5 : 1) * 0.004 * 4 / 133 * n.alive
    : cat === 'accident' ? 2e-4 * n.awake : cat === 'cancer' ? 0.5 * 0.02 * 0.112 * n.awake : 0.02 * (0.021 * n.sleep + 0.5 * 0.112 * n.awake);

  const gIndex = g => +g.slice(1) - 1;
  const groupOfSeat = k => GIDS[Math.floor(k / SEATS)];
  const uOpen = u => Math.min(1 - 1e-12, Math.max(1e-12, u == null ? 0.5 : u));
  const node = (id, fam, t) => ({ id, fam, gen: 0, at: t, ok: true, t0: t, a0: 0, h0: 0, r: 1 });

  // ---------------------------------------------------------------- реестр и люди
  // o: { crew — своих людей, watch — на вахте, reserved — места, обещанные чужим (спасённым), safe — надёжные капсулы, at — год }
  function create(o) {
    const t = o.at || 0, nodes = {};
    for (const id of BLOCKS) nodes[id] = node(id, 'power', t);
    for (const id of BUSES) nodes[id] = node(id, 'bus', t);
    for (const L of LOOPS) { nodes[L + '.pump'] = node(L + '.pump', 'pump', t); nodes[L + '.coll'] = node(L + '.coll', 'collector', t); }
    for (const id of RADS) nodes[id] = node(id, 'radiator', t);
    for (const g of GIDS) { nodes[g + '.cool'] = node(g + '.cool', 'cooler', t); nodes[g + '.ctrl'] = node(g + '.ctrl', 'control', t); }
    const link = { group: {}, loop: { L1: 'BUS1', L2: 'BUS1', L3: 'BUS2', L4: 'BUS2' }, bus: { BUS1: 'PB1', BUS2: 'PB2' }, rad: { L1: 'R1', L2: 'R2', L3: 'R3', L4: 'R4' }, tie: false };
    GIDS.forEach((g, i) => { link.group[g] = LOOPS[Math.floor(i / NOM)]; });
    const crew = Math.min(o.crew || 500, NG * SEATS), reserved = Math.max(0, Math.min(o.reserved || 0, NG * SEATS - crew));
    const w = { schema: 1, params: PARAMS, t, safe: !!o.safe, nodes, link, inv: Object.assign({}, SPARES), protect: (o.protect || []).slice(),
      crew, reserved, ps: 'S'.repeat(crew), moved: {}, broken: [], buf: {}, med: {}, ops: [], log: [], notes: [], causes: {},
      road: true, bg: {} };
    for (const cat of BG) w.bg[cat] = { x0: 0, t0: t, r: 0, n: 0 };
    w.bg.later = { x0: 0, t0: t, r: 0, h: [] };                          // поздние раки — оценка; h — опоры (t, x, r) для истории
    for (const g of GIDS) { const cap = bufCap(w); w.buf[g] = { heat: { v: cap, t0: t, d: 0 }, power: { v: cap, t0: t, d: 0 } }; w.med[g] = { x0: 0, t0: t, n: 0, k: 0 }; }
    partsOf(w);
    setAwake(w, o.watch || 0, t);
    return w;
  }
  // реестр экземпляров (и у модели, созданной до шага 3b): заводские агрегаты на местах и в запасе, склад лома
  function partsOf(w) {
    if (w.parts) return w.parts;
    w.parts = {}; w.sn = 0; w.scrap = { v: 0, log: [] };
    const t = w.nodes.PB1 ? w.nodes.PB1.at : 0;
    for (const id of Object.keys(w.nodes)) { const n = w.nodes[id]; if (TRACK.includes(n.fam)) n.sn = newPart(w, n.fam, 'installed', id, n.at).sn; }
    for (const fam of TRACK) for (let i = 0; i < w.inv[fam]; i++) newPart(w, fam, 'stock', null, t);
    return w.parts;
  }
  function newPart(w, fam, state, at, t) {
    const p = { sn: ++w.sn, fam, origin: 'factory', rg: 0, state, at, since: t, age: 0 };
    w.parts[p.sn] = p; return p;
  }
  const bufCap = w => w.safe ? BUF.safe : BUF.std;
  const seatOf = (w, i) => w.moved[i] != null ? w.moved[i] : i;
  // порядок пробуждения на вахту: по одному из каждой группы, с последних мест — бодрствующие распределены по залу ровно
  function awakeOrder(w) {
    const out = [];
    for (let k = SEATS - 1; k >= 0; k--) for (let g = 0; g < NG; g++) { const i = g * SEATS + k; if (i < w.crew) out.push(i); }
    return out;
  }
  // вахта n: бодрствуют первые n живых по порядку пробуждения (переложенные — по своему номеру)
  function setAwake(w, n, t) {
    const ps = w.ps.split(''), up = new Set(w.up || []);
    for (let i = 0; i < ps.length; i++) if (ps[i] === 'A' && !up.has(i)) ps[i] = 'S';   // разбуженные без капсулы (up) — на ногах
    let left = Math.max(0, Math.round(n));
    for (const i of awakeOrder(w)) { if (!left) break; if (ps[i] === 'S') { ps[i] = 'A'; left--; } }
    w.ps = ps.join(''); w.watchN = Math.max(0, Math.round(n));
    recompute(w, t != null ? t : w.t);
  }
  // занятость всех групп за один проход: спящие (тепловая нагрузка и люди под угрозой), места бодрствующих,
  // свободные исправные, обещанные чужим, отказавшие капсулы
  function census(w) {
    const c = {}, taken = new Set();
    for (const g of GIDS) c[g] = { sleep: [], awake: [], free: [], reserved: 0, broken: 0 };
    for (let i = 0; i < w.crew; i++) {
      if (w.ps[i] === 'D') continue;
      const k = seatOf(w, i), g = groupOfSeat(k); taken.add(k);
      (w.ps[i] === 'S' ? c[g].sleep : c[g].awake).push(i);
    }
    const broken = new Set(w.broken);
    for (let k = 0; k < NG * SEATS; k++) {
      if (taken.has(k)) continue;
      const g = groupOfSeat(k);
      if (broken.has(k)) c[g].broken++; else if (k >= w.crew && k < w.crew + w.reserved) c[g].reserved++; else c[g].free.push(k);
    }
    return c;
  }
  const groupPeople = (w, g) => census(w)[g];

  // ---------------------------------------------------------------- граф: питание, охлаждение, нагрузки
  const ok = (w, id) => w.nodes[id].ok;
  // шина под напряжением: свой блок исправен, или перемычка замкнута и исправен блок второй шины
  function busPowered(w, b) {
    if (!ok(w, b)) return false;
    if (ok(w, w.link.bus[b])) return true;
    const o = BUSES.find(x => x !== b);
    return w.link.tie && ok(w, o) && ok(w, w.link.bus[o]);
  }
  // контур работает: насос и коллектор исправны, шина под напряжением, радиатор исправен
  const loopRuns = (w, L) => ok(w, L + '.pump') && ok(w, L + '.coll') && ok(w, w.link.rad[L]) && busPowered(w, w.link.loop[L]);
  const activeMap = (w, c) => { c = c || census(w); const a = {}; for (const g of GIDS) a[g] = c[g].sleep.length > 0; return a; };
  // нагрузка контура — число активных групп на нём (одна группа — единица тепловой нагрузки)
  function loopLoad(w, L, act) { act = act || activeMap(w); let n = 0; for (const g of GIDS) if (w.link.group[g] === L && act[g]) n++; return n; }
  // дефицит группы: тепловой — нет охлаждения (контур, холодильник или управление), энергетический — шина без питания
  function deficit(w, g) {
    const L = w.link.group[g], power = busPowered(w, w.link.loop[L]);
    const heat = !(ok(w, g + '.cool') && ok(w, g + '.ctrl') && L && loopRuns(w, L));
    return { heat: heat ? 1 : 0, power: power ? 0 : 1 };
  }
  // темп старения узла при текущей схеме
  function rateOf(w, id, act, load) {
    const n = w.nodes[id];
    if (!n.ok) return 0;
    if (n.fam === 'pump' || n.fam === 'collector' || n.fam === 'radiator') {
      const L = n.fam === 'radiator' ? LOOPS.find(x => w.link.rad[x] === id) : id.split('.')[0];
      return loopRuns(w, L) ? Math.max(0.2, Math.pow(load[L] / NOM, 3)) : 0.2;
    }
    if (n.fam === 'cooler' || n.fam === 'control') { const g = id.split('.')[0]; return act[g] ? 1 : 0.2; }
    return 1;
  }
  const ageAt = (n, t) => n.a0 + n.r * (t - n.t0);
  function hazardAt(n, t) {
    const F = FAM[n.fam], a1 = ageAt(n, t), eta = n.eta || F.eta;          // перебранный агрегат — свой ресурс η
    return n.h0 + F.l0 * (t - n.t0) + (Math.pow(a1 / eta, F.k) - Math.pow(n.a0 / eta, F.k));
  }
  // буфер группы на дату: часы запаса (линейно от опорной точки, в пределах ёмкости)
  const bufAt = (w, b, t) => Math.max(0, Math.min(bufCap(w), b.v + b.d * (t - b.t0) / YH));
  // пересчёт после любого изменения схемы, людей или исправности: новые темпы старения и буферов — от даты t
  function recompute(w, t) {
    const c = census(w), act = activeMap(w, c), load = {};
    for (const L of LOOPS) load[L] = loopLoad(w, L, act);
    for (const id of Object.keys(w.nodes)) {
      const n = w.nodes[id], r = rateOf(w, id, act, load);
      if (r !== n.r && n.ok) { const a = ageAt(n, t), h = hazardAt(n, t); n.a0 = a; n.h0 = h; n.t0 = t; n.r = r; }   // оба — от прежней опоры
    }
    const cap = bufCap(w);
    for (const g of GIDS) {
      const D = deficit(w, g), on = act[g];
      for (const k of ['heat', 'power']) {
        const b = w.buf[g][k], v = bufAt(w, b, t);
        const d = on && D[k] ? -D[k] : v < cap ? cap / RECHARGE : 0;      // дефицит — расход, иначе восстановление за сутки
        if (d !== b.d || Math.abs(v - b.v) > 1e-9) { b.v = v; b.t0 = t; b.d = d; }
      }
      // одиночные отказы капсул: экспозиция — занятые капсулы × время; перекладка людей экспозицию группы не сбрасывает
      const m = w.med[g], n = c[g].sleep.length;
      if (n !== m.n) { m.x0 = m.x0 + m.n * (t - m.t0); m.t0 = t; m.n = n; }
    }
    // фон пути: темп — по живым, бодрствующим и спящим сейчас; накопленное до t не пересчитывается
    let alive = 0, awake = 0, sleep = 0;
    for (let i = 0; i < w.crew; i++) { const ch = w.ps[i]; if (ch !== 'D') { alive++; if (ch === 'A') awake++; else sleep++; } }
    for (const cat of Object.keys(w.bg)) {
      const b = w.bg[cat], r = bgRate(w, cat, { alive, awake, sleep });
      if (r !== b.r) { b.x0 = b.x0 + b.r * (t - b.t0); b.t0 = t; b.r = r; if (b.h) b.h.push([t, b.x0, r]); }
    }
    w.t = Math.max(w.t, t);
  }
  // время модели дошло до t без событий: состояние — от опор, меняется только отметка хода
  const touch = (w, t) => { w.t = Math.max(w.t, t); };
  const independentLoops = w => LOOPS.filter(L => loopRuns(w, L)).length;
  // независимых каналов питания: исправный блок на исправной шине (перемычка независимости не добавляет)
  const powerChannels = w => BUSES.filter(b => ok(w, b) && ok(w, w.link.bus[b])).length;

  // ---------------------------------------------------------------- календарь: следующая граница модели
  // порядок при равной дате: завершение операции → отказ узла → одиночная капсула → исчерпание буфера (затем решение)
  const threshold = (n, rnd) => -Math.log(uOpen(rnd(`wear.${n.id}.gen.${n.gen}.threshold`)));
  function failureAt(n, t0, t1, rnd) {
    const F = FAM[n.fam]; if (!F.live || !n.ok) return null;
    const E = threshold(n, rnd), from = Math.max(t0, n.t0);
    if (hazardAt(n, t1) < E) return null;
    if (hazardAt(n, from) >= E) return from;
    let a = from, b = t1;
    for (let i = 0; i < 64; i++) { const m = (a + b) / 2; if (hazardAt(n, m) >= E) b = m; else a = m; }
    return b;
  }
  // порог k-й одиночной капсулы группы — сумма k+1 экспонент (по ключам группы и номера события; не хранится)
  function medThreshold(w, g, rnd) {
    let sum = 0; for (let j = 0; j <= w.med[g].k; j++) sum += -Math.log(uOpen(rnd(`wear.group.${g}.capsule.event.${j}.threshold`)));
    return sum;
  }
  function medAt(w, g, t0, t1, rnd) {
    const m = w.med[g], lam = w.safe ? CAPS_RATE.safe : CAPS_RATE.std;
    if (!m.n) return null;
    const need = medThreshold(w, g, rnd) / lam - m.x0, at = m.t0 + need / m.n;
    return at >= t0 - 1e-12 && at <= t1 ? Math.max(t0, at) : null;
  }
  function bufferOut(w, g, k, t0, t1, act) {
    const b = w.buf[g][k];
    if (!(b.d < 0) || !act[g]) return null;
    const at = b.t0 + b.v / -b.d * YH;
    return at >= t0 - 1e-12 && at <= t1 ? Math.max(t0, at) : null;
  }
  // k-я смерть категории фона — когда накопленное доходит до k − ½ (округление суммы, а не отрезков)
  function bgAt(w, cat, t0, t1) {
    const b = w.bg[cat]; if (!(b.r > 0)) return null;
    const at = b.t0 + (b.n + 0.5 - b.x0) / b.r;
    return at >= t0 - 1e-12 && at <= t1 ? Math.max(t0, at) : null;
  }
  // ближайшая граница в (t0, t1]: { at, kind, id } — или null
  function nextBoundary(w, t0, t1, rnd) {
    let best = null;
    const take = (at, kind, id, ord) => { if (at == null) return; if (!best || at < best.at - 1e-12 || (Math.abs(at - best.at) <= 1e-12 && (ord < best.ord || (ord === best.ord && id < best.id)))) best = { at, kind, id, ord }; };
    for (const op of w.ops) if (!op.done && op.until >= t0 - 1e-12 && op.until <= t1) take(Math.max(t0, op.until), 'op', op.id, 0);
    for (const id of Object.keys(w.nodes).sort()) take(failureAt(w.nodes[id], t0, t1, rnd), 'fail', id, 1);
    const act = activeMap(w);
    for (const g of GIDS) take(medAt(w, g, t0, t1, rnd), 'capsule', g, 2);
    for (const cat of BG) take(bgAt(w, cat, t0, t1), 'med', cat, 3);
    for (const g of GIDS) for (const k of ['power', 'heat']) take(bufferOut(w, g, k, t0, t1, act), 'buffer', `${g}.${k}`, 4);
    return best;
  }

  // ---------------------------------------------------------------- события модели
  // отказ узла: узел выключен, схема пересчитана; что делать — решает слой выше (автоматика или карточка)
  function fail(w, id, t, cause) {
    const n = w.nodes[id]; if (!n.ok) return null;
    const a = ageAt(n, t), h = hazardAt(n, t); n.a0 = a; n.h0 = h; n.t0 = t; n.ok = false; n.failedAt = t;
    const rec = { at: t, kind: 'fail', id, fam: n.fam, gen: n.gen, cause: cause || 'wear' };
    w.log.push(rec); recompute(w, t);
    return rec;
  }
  // одиночный отказ капсулы: погибает спящий этой группы (выбор — по ключу события), капсула отмечена отказавшей
  function capsuleFail(w, g, t, rnd) {
    const m = w.med[g]; recompute(w, t);
    const sl = groupPeople(w, g).sleep.filter(i => !w.protect.includes(i)); if (!sl.length) { m.k++; return null; }
    const u = rnd(`wear.group.${g}.capsule.event.${m.k}.victim`), i = sl[Math.min(sl.length - 1, Math.floor((u == null ? 0.5 : u) * sl.length))];
    m.k++;
    const rec = { at: t, kind: 'capsule', group: g, seat: seatOf(w, i), ids: [i], cause: `wear.capsule.${g}.${m.k - 1}` };
    kill(w, [i], t); w.broken.push(seatOf(w, i)); w.log.push(rec); recompute(w, t);
    return rec;
  }
  // смерть фона: при пробуждении — из спящих, несчастный случай и рак — из бодрствующих (выбор — по ключу события)
  function bgDeath(w, cat, t, rnd) {
    const b = w.bg[cat]; recompute(w, t);
    const pool = []; for (let i = 0; i < w.crew; i++) if (w.ps[i] === (cat === 'revival' ? 'S' : 'A') && !w.protect.includes(i)) pool.push(i);
    const u = rnd(`wear.med.${cat}.${b.n}.victim`), i = pool.length ? pool[Math.min(pool.length - 1, Math.floor((u == null ? 0.5 : u) * pool.length))] : null;
    const rec = { at: t, kind: 'med', cat, ids: i == null ? [] : [i], cause: `wear.med.${cat}.${b.n}` };
    b.n++; if (i != null) kill(w, [i], t); w.log.push(rec); recompute(w, t);
    return rec;
  }
  // путь окончен (прибытие) или снова идёт: фон пути начисляется только в дороге
  function setRoad(w, on, t) { if (w.road === !!on) return; w.road = !!on; recompute(w, t); }
  // история потерь на дату at (не позже модели): смерти — по журналу, поздние раки — оценка накопленного
  function losses(w, at) {
    const out = { capsule: 0, revival: 0, accident: 0, cancer: 0 };
    for (const e of w.log) if (e.at <= at + 1e-9) { if (e.kind === 'capsule') out.capsule += e.ids.length ? 1 : 0; else if (e.kind === 'med') out[e.cat] += e.ids.length ? 1 : 0; }
    const b = w.bg.later; let x = 0;
    for (let k = 0; k < b.h.length; k++) { const [t0, x0, r] = b.h[k], t1 = k + 1 < b.h.length ? b.h[k + 1][0] : Infinity; if (at >= t0) x = x0 + r * (Math.min(at, t1) - t0); }
    out.later = Math.round(x); out.total = out.capsule + out.revival + out.accident + out.cancer;
    return out;
  }
  // буфер группы исчерпан: спящие группы погибают (острый каскад одной причины)
  function bufferFail(w, gk, t) {
    const [g, k] = gk.split('.'); recompute(w, t);
    const sl = groupPeople(w, g).sleep, ids = sl.filter(i => !w.protect.includes(i)), saved = sl.filter(i => w.protect.includes(i));
    const rec = { at: t, kind: 'buffer', group: g, buffer: k, ids, saved, cause: `wear.buffer.${g}.${k}.${t.toFixed(6)}` };
    kill(w, ids, t);
    if (saved.length) { const ps = w.ps.split(''); for (const i of saved) ps[i] = 'A'; w.ps = ps.join(''); w.up = (w.up || []).concat(saved); }   // их будит вахта: дальше — на ногах (капсулы нет)
    w.log.push(rec); recompute(w, t);
    return rec;
  }
  // гибель: место освобождается; погиб бодрствующий — вахту пополняют из спящих (число на ногах держится)
  function kill(w, ids, t) {
    const ps = w.ps.split(''); for (const i of ids) if (ps[i] !== 'D') ps[i] = 'D'; w.ps = ps.join('');
    const up = new Set(w.up || []), aw = ps.reduce((n, c, i) => n + (c === 'A' && !up.has(i) ? 1 : 0), 0);   // разбуженные без капсулы — сверх вахты
    if (w.watchN != null && aw < w.watchN) setAwake(w, w.watchN, t);
  }
  // внешние смерти (сюжет, происшествия): только живые; возвращает фактически погибших
  function recordDeaths(w, ids, t) { const live = ids.filter(i => i < w.crew && w.ps[i] !== 'D'); kill(w, live, t); recompute(w, t); return live; }

  // ---------------------------------------------------------------- перестановка и замена
  // мощность под обещанное: пустая группа, куда обещаны люди начатой перекладки (кроме работы except), место на своём
  // контуре уже заняла — для перестановки, перекладки и возврата домой она как занятая (ревью Codex 3a). Старение и буферы
  // считают по фактическим спящим (activeMap)
  const capMap = (w, c, except) => { const a = activeMap(w, c); for (const k of heldSeats(w, except)) a[groupOfSeat(k)] = true; return a; };
  // свободная мощность контура: предел 7 минус занятые группы (контур должен работать)
  function loopRoom(w, L, except) { return loopRuns(w, L) ? MAX - loopLoad(w, L, capMap(w, null, except)) : 0; }
  // раскладка групп остановленного контура по работающим: по одной туда, где свободнее (при равенстве — по номеру).
  // Мест не хватает — переводится сколько помещается (по номерам групп), остальные — в left
  function reroutePlan(w, from) {
    const act = capMap(w), gs = GIDS.filter(g => w.link.group[g] === from && act[g]), room = {}, plan = {}, left = [];   // с обещанными местами — вместе с обещанием
    for (const L of LOOPS) if (L !== from) room[L] = loopRoom(w, L);
    for (const g of gs) {
      const L = Object.keys(room).filter(x => room[x] > 0).sort((a, b) => room[b] - room[a] || (a < b ? -1 : 1))[0];
      if (!L) { left.push(g); continue; }
      plan[g] = L; room[L]--;
    }
    return { plan, left };
  }
  // места, обещанные начатым перекладкам (кроме работы except): другим не выдаются, пока работа не кончилась
  const heldSeats = (w, except) => { const h = new Set(); for (const [op, ks] of Object.entries(w.hold || {})) if (op !== except) for (const k of ks) h.add(k); return h; };
  const holdSeats = (w, op, ks) => { (w.hold = w.hold || {})[op] = ks.slice(); };
  // свободные исправные места в группах с охлаждением и питанием (кроме группы from) — по номеру места. Пустая группа
  // после заселения станет нагрузкой своего контура: её места — только если у контура есть мощность (предел 7); пустая
  // группа, куда уже обещаны люди, нагрузку уже заняла
  function freeSeats(w, from, except) {
    const c = census(w), act = capMap(w, c, except), room = {}, out = [], held = heldSeats(w, except);
    for (const L of LOOPS) room[L] = loopRoom(w, L, except);
    for (const g of GIDS) {
      if (g === from) continue; const D = deficit(w, g); if (D.heat || D.power) continue;
      const free = c[g].free.filter(k => !held.has(k));
      if (!act[g]) { if (!free.length) continue; const L = w.link.group[g]; if (!(room[L] > 0)) continue; room[L]--; }   // мощность — только под группу, где есть места
      out.push(...free);
    }
    return out.sort((a, b) => a - b);
  }
  // домашний контур группы — по номинальной раскладке; восстановленный контур забирает свои группы, где есть место
  const homeLoop = g => LOOPS[Math.floor(gIndex(g) / NOM)];
  function rehome(w, t) {
    let moved = 0;
    for (const g of GIDS) {
      const h = homeLoop(g); if (w.link.group[g] === h || !loopRuns(w, h)) continue;
      const act = capMap(w); if (act[g] && loopLoad(w, h, act) >= MAX) continue;
      w.link.group[g] = h; moved++;
    }
    if (moved) recompute(w, t);
    return moved;
  }
  // переложить спящих группы g в свободные капсулы охлаждаемых групп — сначала в места, обещанные работе op (если они
  // ещё годны); мест мало — не перекладывается никто. Обещание снимается в любом случае
  function moveSleepers(w, g, t, op) {
    const own = new Set(op && w.hold && w.hold[op] || []), sl = census(w)[g].sleep, seats = freeSeats(w, g, op).sort((a, b) => own.has(b) - own.has(a) || a - b);
    if (op && w.hold) delete w.hold[op];
    if (!sl.length || seats.length < sl.length) return null;
    sl.forEach((i, j) => { w.moved[i] = seats[j]; });
    w.log.push({ at: t, kind: 'move', group: g, ids: sl.slice(), seats: seats.slice(0, sl.length) });
    recompute(w, t);
    return sl.length;
  }
  function relink(w, plan, t) { for (const g of Object.keys(plan)) w.link.group[g] = plan[g]; recompute(w, t); }
  // установка агрегата sn (из запаса, зарезервированного работой): поколение +1 (новый порог), интенсивность с нуля, возраст —
  // складской (0,2 года за год хранения), ресурс η — свой у перебранного; стоявший агрегат снят (возвращается его sn).
  // Без sn — новый заводской экземпляр (проверки). Основание (коллектор, шина) не молодеет
  function install(w, id, t, sn) {
    const n = w.nodes[id], P = partsOf(w), track = TRACK.includes(n.fam);
    const old = track && n.sn != null ? P[n.sn] : null, p = track ? (sn != null ? P[sn] : newPart(w, n.fam, 'reserved', null, t)) : null;
    if (old) Object.assign(old, { state: 'removed', at: null, since: t });
    const a0 = p ? p.age + STORE_AGE * Math.max(0, t - p.since) : 0;
    if (p) Object.assign(p, { state: 'installed', at: id, since: t });
    Object.assign(n, { gen: n.gen + 1, at: t, ok: true, t0: t, a0, h0: 0, r: 1 }); delete n.failedAt;
    if (track) { n.sn = p.sn; if (p.eta) n.eta = p.eta; else delete n.eta; }
    w.log.push({ at: t, kind: 'install', id, gen: n.gen, sn: track ? n.sn : undefined }); recompute(w, t);
    return old ? old.sn : null;
  }
  // запас: зарезервировать готовый агрегат под работу (сначала заводские, затем по номеру) — счётчик запаса уменьшается сразу
  function reservePart(w, fam) {
    const P = partsOf(w), p = Object.values(P).filter(x => x.fam === fam && x.state === 'stock').sort((a, b) => a.rg - b.rg || a.sn - b.sn)[0];
    if (!p) return null;
    p.state = 'reserved'; w.inv[fam]--; return p.sn;
  }
  // снять отказавший агрегат без замены (на переборку): место пустое, узел остаётся неисправным
  function removePart(w, id, t) {
    const n = w.nodes[id], p = n.sn != null ? partsOf(w)[n.sn] : null; if (!p || n.ok) return null;
    Object.assign(p, { state: 'removed', at: null, since: t }); n.sn = null;
    w.log.push({ at: t, kind: 'remove', id, sn: p.sn });
    return p.sn;
  }
  const removedOf = (w, fam) => Object.values(partsOf(w)).filter(p => p.fam === fam && p.state === 'removed').sort((a, b) => a.rg - b.rg || a.sn - b.sn).map(p => p.sn);
  const canRebuild = (w, sn) => { const p = partsOf(w)[sn]; return !!(p && REBUILD[p.fam] && p.rg < REBUILD[p.fam].max); };
  // цена переборки по оснащению — ничего не расходует: материалы, сутки двух специалистов, ресурс после, один клапанный комплект
  function quoteRebuild(w, sn, prod) {
    const p = partsOf(w)[sn]; if (!canRebuild(w, sn)) return null;
    const R = REBUILD[p.fam], k = R.materials[prod] != null ? prod : 'repair';
    return { fam: p.fam, rg: p.rg, materials: R.materials[k], days: R.days[k][p.rg], eta: R.eta[k][p.rg], valve: 1 };
  }
  function startRebuild(w, sn, t) { const p = partsOf(w)[sn]; p.state = 'rebuilding'; p.since = t; w.inv.valve--; }
  function completeRebuild(w, sn, t, eta) {
    const p = partsOf(w)[sn];
    Object.assign(p, { state: 'stock', origin: 'rebuilt', rg: p.rg + 1, eta, since: t, age: 0 }); w.inv[p.fam]++;
    w.log.push({ at: t, kind: 'rebuilt', sn, fam: p.fam, rg: p.rg });
  }
  // разборка снятого агрегата в лом (переборка исчерпана или не нужна)
  function dismantle(w, sn, t) {
    const p = partsOf(w)[sn]; if (!p || p.state !== 'removed') return 0;
    p.state = 'scrap'; addScrap(w, SCRAP_OF[p.fam], `part.${sn}`, t); return SCRAP_OF[p.fam];
  }
  // склад лома: приход — при снятии, разборке и завершении работ, с источником; расход — партией переработки
  function addScrap(w, x, src, t) { if (!(x > 0)) return; partsOf(w); w.scrap.v += x; w.scrap.log.push({ at: t, d: x, src }); }
  function takeScrap(w, x, src, t) { partsOf(w); const d = Math.min(x, w.scrap.v); w.scrap.v -= d; w.scrap.log.push({ at: t, d: -d, src }); return d; }

  // ---------------------------------------------------------------- наблюдение (то, что видят приборы и ведомость)
  function observe(w, t) {
    t = t != null ? t : w.t;
    const loops = LOOPS.map(L => ({ id: L, runs: loopRuns(w, L), load: loopLoad(w, L), max: MAX, nom: NOM, bus: w.link.loop[L],
      pumpAge: +ageAt(w.nodes[L + '.pump'], t).toFixed(2), collAge: +ageAt(w.nodes[L + '.coll'], t).toFixed(2), pumpGen: w.nodes[L + '.pump'].gen }));
    const c = census(w), groups = GIDS.map(g => { const p = c[g], D = deficit(w, g);
      return { id: g, loop: w.link.group[g], sleep: p.sleep.length, awake: p.awake.length, free: p.free.length, reserved: p.reserved, broken: p.broken,
        cooler: ok(w, g + '.cool'), control: ok(w, g + '.ctrl'), heat: D.heat, power: D.power,
        heatH: +bufAt(w, w.buf[g].heat, t).toFixed(1), powerH: +bufAt(w, w.buf[g].power, t).toFixed(1) }; });
    const P = Object.values(partsOf(w)), cnt = (fam, st) => P.filter(p => p.fam === fam && p.state === st).length;
    const shop = { removed: { pump: cnt('pump', 'removed'), cooler: cnt('cooler', 'removed') }, rebuilding: { pump: cnt('pump', 'rebuilding'), cooler: cnt('cooler', 'rebuilding') },
      rebuilt: P.filter(p => p.origin === 'rebuilt').length, scrap: +w.scrap.v.toFixed(2) };
    return { t, loops, groups, inv: Object.assign({}, w.inv), shop, independent: independentLoops(w), power: powerChannels(w), tie: w.link.tie,
      alive: w.ps.split('').filter(c => c !== 'D').length, asleep: w.ps.split('').filter(c => c === 'S').length, dead: w.ps.split('').filter(c => c === 'D').length };
  }
  // публичная проекция: пороги не хранятся (считаются по ключам), накопленная интенсивность — скрытая величина
  function publicOf(w) {
    if (!w) return w;
    const p = JSON.parse(JSON.stringify(w));
    for (const id of Object.keys(p.nodes)) delete p.nodes[id].h0;
    return p;
  }
  const take = w => { const out = w.notes; w.notes = []; return out; };

  const api = { PARAMS, FAM, NG, SEATS, NOM, MAX, LOOPS, BUSES, BLOCKS, RADS, GIDS, SPARES, BUF, RECHARGE, CAPS_RATE,
    TRACK, REBUILD, SCRAP_OF, STORE_AGE, SCRAP_BACK, YIELD, BATCH, BATCH_DAYS,
    partsOf, reservePart, removePart, removedOf, canRebuild, quoteRebuild, startRebuild, completeRebuild, dismantle, addScrap, takeScrap,
    create, setAwake, census, groupPeople, seatOf, freeSeats, holdSeats, heldSeats, moveSleepers, homeLoop, rehome, groupOfSeat, recompute, busPowered, loopRuns, loopLoad, deficit, ageAt, hazardAt, bufAt,
    nextBoundary, failureAt, touch, fail, capsuleFail, bufferFail, bgDeath, setRoad, losses, recordDeaths, loopRoom, reroutePlan, relink, install,
    independentLoops, powerChannels, observe, publicOf, take };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.M31Wear = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
