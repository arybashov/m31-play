/* М31 · срез: единая очередь работ корабля (DOC «Долгий рейс — износ и смена курса», шаг 3a; план — «Ревью Codex —
   износ, шаг 3», раздел C). Чистые расчёты без DOM и сюжетных текстов, для браузера и Node.

   Работа — трудоёмкость в человеко-сутках (ручная часть) и непараллелимая выдержка (опрессовка, проверка, наблюдение),
   которая идёт без работников. Работа без пула людей (pool: null) — только выдержка: наблюдения, сниженная нагрузка,
   обучение. Техников делят все владельцы (модель износа, события v1) — одних людей нельзя занять дважды.
   Раздача — заново на каждой границе (новая работа, конец этапа, смена вахты): по приоритету (0 — спасение людей до
   исчерпания буфера, 1 — независимый путь, 1,5 — регламент, 2 — запас и плановый ремонт, 3 — переработка, наука), затем по сроку, затем
   по номеру. Менее важная работа уступает людей более важной и сохраняет выполненный объём.
   Ход — от опорной точки последней раздачи (t0): выполненное считается от неё, нарезка перемотки срок не меняет.
   Пул людей tech — все специалисты вахты (шаг «хрупкость»: регламент — сама работа очереди, бесконечная, приоритет 1,5;
   спасение и путь забирают у него людей, запас ждёт, пока регламент не получит своё; свободного времени «даром» нет).
   Оборудование (equip, шаг 3b): работа занимает единицу пула оборудования (мастерская — один производственный слот);
   оборудование занято — работа ждёт, как без людей. */
(function (root) {
  'use strict';

  const DAY = 1 / 365.25;
  const PRIO = { rescue: 0, path: 1, reg: 1.5, stock: 2, low: 3 };     // регламент — после спасения и пути, до запаса
  const create = () => ({ seq: 0, list: [] });

  // spec: { owner, ref, type, how, blocks, prio, deadline, pool: 'tech' | null, work — чел.-сут, minW, maxW, hold — сут,
  //   equip — пул оборудования на время ручной части (мастерская) }
  function enqueue(Q, spec, t, pools) {
    const j = Object.assign({ owner: 'wear', ref: null, type: null, how: null, blocks: [], prio: PRIO.stock, deadline: Infinity, pool: 'tech',
      work: 0, minW: 1, maxW: 2, hold: 0, equip: null }, spec);
    Object.assign(j, { id: `job.${Q.seq++}`, at: t, done: 0, held: 0, w: 0, t0: t, status: j.pool && j.work > 0 ? 'wait' : 'hold' });
    if (!(j.deadline < Infinity)) delete j.deadline;                    // JSON без Infinity
    if (!(j.maxW < Infinity)) j.maxW = 'all';
    Q.list.push(j);
    dispatch(Q, t, pools);
    return j;
  }
  const active = Q => Q.list.filter(j => j.status !== 'done');
  // выполненное к дате t — от опорной точки (без изменения состояния)
  const rate = j => j.w;                                                 // чел.-сут в сутки
  const doneAt = (j, t) => j.status === 'work' ? j.done + rate(j) * (t - j.t0) / DAY : j.done;
  const heldAt = (j, t) => j.status === 'hold' ? j.held + (t - j.t0) / DAY : j.held;
  function sync(Q, t) {
    for (const j of active(Q)) { const d = doneAt(j, t), h = heldAt(j, t); j.done = Math.min(j.work, d); j.held = Math.min(j.hold, h); j.t0 = t; }
  }
  // раздача людей: заново, по приоритету, сроку, номеру; не хватает минимума — работа ждёт
  function dispatch(Q, t, pools) {
    sync(Q, t);
    const left = Object.assign({}, pools || {});
    const order = active(Q).slice().sort((a, b) => a.prio - b.prio || (a.deadline ?? Infinity) - (b.deadline ?? Infinity) || a.at - b.at || (+a.id.slice(4)) - (+b.id.slice(4)));
    for (const j of order) {
      if (j.done >= j.work - 1e-9) { j.w = 0; j.status = 'hold'; continue; }   // ручная часть сделана — выдержка без людей
      if (j.equip && !((left[j.equip] || 0) >= 1)) { j.w = 0; j.status = 'wait'; continue; }   // оборудование занято
      const free = left[j.pool] || 0, max = j.maxW === 'all' ? free : Math.min(j.maxW, free);
      if (max >= j.minW) { j.w = max; left[j.pool] = free - max; j.status = 'work';
        if (j.equip) left[j.equip]--; }
      else { j.w = 0; j.status = 'wait'; }
    }
  }
  // конец этапа (ручная часть или выдержка) ближайшей работы в [t0, t1]
  function nextBoundary(Q, t0, t1) {
    let best = null;
    for (const j of active(Q)) {
      const at = j.status === 'work' ? j.t0 + (j.work - j.done) / rate(j) * DAY : j.status === 'hold' ? j.t0 + (j.hold - j.held) * DAY : null;
      if (at == null) continue;
      const a = Math.max(t0, at);
      if (a <= t1 + 1e-12 && (!best || a < best.at - 1e-12 || (Math.abs(a - best.at) <= 1e-12 && j.at < best.job.at))) best = { at: a, job: j };
    }
    return best;
  }
  // этап кончился: ручная часть → выдержка (если есть), выдержка → работа сделана; возвращает работу, если она завершена
  function step(Q, id, t, pools) {
    const j = Q.list.find(x => x.id === id); if (!j || j.status === 'done') return null;
    sync(Q, t);
    if (j.status === 'work' && j.done >= j.work - 1e-9 && j.hold > j.held + 1e-9) { j.w = 0; j.status = 'hold'; dispatch(Q, t, pools); return null; }
    if ((j.status === 'work' || j.status === 'hold') && j.done >= j.work - 1e-9 && j.held >= j.hold - 1e-9) {
      j.status = 'done'; j.w = 0; j.end = t; dispatch(Q, t, pools); return j;
    }
    dispatch(Q, t, pools); return null;
  }
  // оценка конца работы при нынешней раздаче (для блокировок событий и подсказок); ждущая — как если бы ей дали людей
  function eta(j, t) {
    if (j.status === 'done') return j.end;
    const w = j.w ? rate(j) : (j.maxW === 'all' ? 1 : j.maxW) || 1, d = doneAt(j, t), h = heldAt(j, t);
    return t + Math.max(0, j.work - d) / w * DAY + Math.max(0, j.hold - h) * DAY;
  }
  // людей занято пулом сейчас
  const busy = (Q, pool) => active(Q).filter(j => j.pool === pool && j.status === 'work').reduce((a, j) => a + j.w, 0);
  const publicOf = Q => Q && JSON.parse(JSON.stringify(Q));

  const api = { DAY, PRIO, create, enqueue, dispatch, nextBoundary, step, eta, busy, active, sync, publicOf };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.M31Jobs = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
