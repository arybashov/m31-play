/* М31 · срез. Чистый движок: без DOM, работает в браузере и в Node.
   Партия — детерминированный проход по сцене с записанными ответами игрока.
   Мир фиксирован контентом (§2.6 концепта); меняются только зависимые состояния.

   Один исполнитель (drive) для двух способов вести партию: run — ответы из записанного массива, play — от стратегии.
   Переходы времени и эффекты у них общие (спецификация «Симулятор v1 — время и щит», шаг 2).

   Модель времени (content.sim, правила v5): перемотка с целью toYear не ставит год, а продвигает модель корабля;
   модель может остановиться раньше на событии, требующем решения, — оно приходит как решение-вставка, его ответ —
   обычный токен; после ответа та же перемотка продолжается к цели. Токен 'go' тратится один раз.

   Цель перемотки пересчитывается после каждого решения-вставки (DOC «Долгий рейс», шаг 1): решение может сменить курс,
   и дата сюжетного узла уйдёт вместе с прибытием. Если после вставки узел больше не применим (условие when), он
   отменяется — перемотка к нему обрывается, движок идёт к следующему. */
(function (root) {
  'use strict';

  // копия данных состояния — простые объекты и массивы, строки, числа, логические, null — по правилам JSON (то же, что
  // JSON.parse(JSON.stringify(x)), в 3 раза быстрее): undefined, функции и символы — в объекте пропуск, в массиве null;
  // NaN и ±Infinity — null; −0 — 0. Не для объектов с прототипом, геттерами, __proto__ и toJSON в массивах
  const hasOwn = Object.prototype.hasOwnProperty;
  function copy(v) {
    if (v === null) return null;
    const t = typeof v;
    if (t === 'number') return v === v && v !== Infinity && v !== -Infinity ? (v === 0 ? 0 : v) : null;
    if (t !== 'object') return v;
    if (Array.isArray(v)) { const n = v.length, a = new Array(n); for (let i = 0; i < n; i++) { const e = v[i]; a[i] = e === undefined || typeof e === 'function' || typeof e === 'symbol' ? null : copy(e); } return a; }
    if (typeof v.toJSON === 'function') return JSON.parse(JSON.stringify(v));
    const o = {};
    for (const k in v) { if (!hasOwn.call(v, k)) continue; const e = v[k]; if (e === undefined || typeof e === 'function' || typeof e === 'symbol') continue; o[k] = copy(e); }
    return o;
  }
  const clone = copy;

  // Источник ответов: decision(beat, list, view) → id ответа или undefined (ответа ещё нет — остановка);
  // skip(beat) → true (перемотка разрешена) или false (остановка); done() — проверка после прохода.
  // record — вести журнал снимков (run); play журнала не ведёт (калибровка — тысячи партий).
  function drive(content, ctx, src, record) {
    const state = content.initialState(ctx);
    const log = [];
    const view = () => content.publicOf ? content.publicOf(state) : state;
    const sim = content.sim && content.sim.active && content.sim.active(state) ? content.sim : null;

    // решение: штатное или вставка модели; возвращает остановку или null (ответ применён)
    function decide(beat) {
      // публичное состояние и варианты — один раз на решение, пока состояние не меняется (проекция — полная копия, дорогая)
      let v0 = null, l0 = null;
      const view1 = () => v0 || (v0 = view());
      const list = () => l0 || (l0 = typeof beat.options === 'function' ? beat.options(view1()) : beat.options);
      const answer = src.decision(beat, list, view1);
      if (answer === undefined) return { beat, options: list(), state: clone(state) };
      // параметрическое решение (паспорт): вариант собирается из id ответа, без перечисления всех сочетаний
      const option = beat.option ? beat.option(view1(), answer) : list().find(o => o.id === answer);
      if (!option) throw src.missing(answer, beat);
      src.took(option.id);
      state.choices[beat.id] = option.id;
      if (beat.rec) { const rc = beat.rec(view()); if (rc) (state.recs = state.recs || {})[beat.id] = rc.id; }
      if (option.effect) option.effect(state);
      if (sim && sim.decided) sim.decided(state, beat);                // модель знает дату решения (плановый совет), ревизию маршрута и журнал
      if (record) log.push({ beat, option, state: clone(state) });
      if (option.ending) return { ending: option, beat, state: clone(state) };
      return null;
    }

    // записи приборов из модели (приборный журнал) — в журнал партии; забираются и в play, чтобы состояние было одно.
    // Сухие сводки (fold) копятся до ближайшего отчёта вахты и входят в его ведомость
    let base = null, mark = 0, folded = [];
    function notes() {
      for (const b of sim.notes ? sim.notes(state) : []) {
        const st = b.state0 || clone(state); delete b.state0;              // снимок момента записи (события v1), если он есть
        if (record) (b.fold && sim.report ? folded : log).push({ beat: b, state: st });
      }
    }
    // отчёт вахты (только журнал run): период — от прошлой точки отчёта; точки — конец перемотки и остановка модели на
    // событии (ev). Отчёт строится из состояния и записей периода и ничего в состоянии не меняет
    function report(ev) {
      if (!record || !sim.report) return;
      const b = base ? sim.report(state, base, log, mark, folded.map(f => f.beat), ev || null) : null;
      // без отчёта (корабль потерян) сводки идут в ленту как есть — снимком точки отчёта, чтобы время не шло назад
      if (b) log.push({ beat: b, state: clone(state) }); else for (const f of folded) log.push({ beat: f.beat, state: clone(state) });
      base = sim.observe(state, log); mark = log.length; folded = [];
    }

    // ход модели к году resolve(): каждое событие с решением — вставка; после ответа цель пересчитывается (смена курса
    // переносит даты), а узел, ставший неприменимым, отменяется (CANCELLED). Иначе — остановка или null (цель достигнута)
    const CANCELLED = { cancelled: true };
    const dateOf = (v) => typeof v === 'function' ? v(state) : v;
    // рейс окончен состоянием корабля (модель: terminalAt): дальше ни сцен, ни перемотки — финал с причиной
    function terminal() {
      const b = sim.endBeat(state);
      report();
      if (record) log.push({ beat: b, state: clone(state) });
      return { end: true, beat: b, state: clone(state) };
    }
    function advanceTo(resolve, beat) {
      for (let guard = 0; ; guard++) {
        if (guard > 1000) throw new Error(`Модель не дошла до цели ${beat.id}`);
        const ev = sim.advance(state, resolve(), beat);
        notes();
        if (sim.terminal && sim.terminal(state)) return terminal();
        if (!ev) return null;
        report(ev);                                                    // донесение — до решения-вставки
        const st = decide(sim.decision(state, ev, beat));
        if (st) return st;
        if (beat.when && !beat.when(state)) return CANCELLED;
      }
    }
    // эффект сцены: модель ведёт ревизию маршрута и журнал запасов и людей
    function apply(beat) {
      if (beat.effect) beat.effect(state);
      if (sim && sim.applied) sim.applied(state, beat);
    }

    let stop = null;
    for (const beat of content.beats) {
      if (beat.when && !beat.when(state)) continue;
      if (beat.kind === 'decision') {
        if (sim && beat.year !== undefined && dateOf(beat.year) > state.year) {   // модель: решение принимается в свой срок
          stop = advanceTo(() => dateOf(beat.year), beat);
          if (stop === CANCELLED) { stop = null; continue; }
          if (stop) break;
          if (beat.when && !beat.when(state)) continue;                // условие — заново после хода модели
        }
        stop = decide(beat);
        if (stop) break;
        continue;
      }
      if (beat.kind === 'skip' || beat.kind === 'cinematic') {
        if (!src.skip(beat)) { stop = { beat, state: clone(state) }; break; }
        if (beat.toYear !== undefined) {
          if (sim) {
            // черта перемотки — до хода модели: записи приборов и решения-вставки встают после неё, по времени
            if (record) log.push({ beat, state: clone(state) });
            stop = advanceTo(() => dateOf(beat.toYear), beat);
            if (stop === CANCELLED) stop = null;
            if (stop) break;
            report();                                                  // отчёт вахты — в конце перемотки (и оборванной)
            continue;
          } else state.year = dateOf(beat.toYear);
        }
        if (record) log.push({ beat, state: clone(state) });
        continue;
      }
      if (sim && beat.year !== undefined) {
        // с моделью дата сцены — ход модели (годы между перемоткой и сценой не выпадают из износа); эффект сцены — после
        // хода: событие модели между перемоткой и сценой не должно видеть её последствий (ревью Codex, события v1).
        // Записи приборов встают перед сценой, по времени; после хода условие сцены проверяется заново
        stop = advanceTo(() => dateOf(beat.year), beat);
        if (stop === CANCELLED) { stop = null; continue; }
        if (stop) break;
        if (beat.when && !beat.when(state)) continue;
        apply(beat);
      } else {
        apply(beat);
        if (beat.year !== undefined) state.year = typeof beat.year === 'function' ? beat.year(state) : beat.year;   // годы дрейфа зависят от пути
      }
      if (sim && beat.kind === 'end' && folded.length) report();       // сводки после последнего отчёта — не теряются
      if (record) log.push({ beat, state: clone(state) });
      if (beat.kind === 'end') { stop = { end: true, beat, state: clone(state) }; break; }
    }
    src.done();
    return { log, stop, state };
  }

  // tokens: массив ответов игрока по порядку — id варианта для решения, 'go' для перемотки.
  // Возвращает журнал и точку остановки.
  // ctx — правила партии: { riskVersion, riskSeed } (без ctx — версия 0, прежние правила; скрытое задано сидом заранее)
  function run(content, tokens, ctx) {
    let t = 0;
    const src = {
      decision: () => tokens[t],
      skip(beat) {
        if (tokens[t] === undefined) return false;
        if (tokens[t] !== 'go') throw Object.assign(new Error(`Ожидалась перемотка в ${beat.id}`), { beat: beat.id, at: t });
        t++; return true;
      },
      took() { t++; },
      missing: (answer, beat) => Object.assign(new Error(`Нет варианта ${answer} в решении ${beat.id}`), { beat: beat.id, at: t }),
      done() { if (t < tokens.length) throw Object.assign(new Error('Лишние ответы после остановки'), { extra: true, at: t }); }
    };
    return drive(content, ctx, src, true);
  }

  // Партия по стратегии — тот же проход, без журнала: choose(beat, options, publicState) → id варианта.
  // Для калибровки цены ошибки (тысячи сидов). Возвращает состояние, точку остановки и ходы (их можно проиграть run).
  function play(content, ctx, choose) {
    const tokens = [];
    const src = {
      decision(beat, list, view) {
        const id = choose(beat, list(), view());
        if (id === undefined) throw this.missing(id, beat);           // у стратегии ответ есть всегда
        return id;
      },
      skip() { tokens.push('go'); return true; },
      took(id) { tokens.push(id); },
      missing: (id, beat) => Object.assign(new Error(`Стратегия: нет варианта ${id} в решении ${beat.id}`), { beat: beat.id }),
      done() {}
    };
    const r = drive(content, ctx, src, false);
    const s = r.stop;
    if (s && s.ending) return { state: r.state, tokens, stop: { ending: s.ending, beat: s.beat } };
    if (s && s.end) return { state: r.state, tokens, stop: { end: true, beat: s.beat } };
    return { state: r.state, tokens, stop: null };
  }

  // Текст сцены: строка или функция от снимка состояния.
  function text(value, lang, snapshot) {
    const v = value && value[lang];
    return typeof v === 'function' ? v(snapshot) : (v || '');
  }

  // Старое сохранение после того, как в сюжет добавили решения или раньше кончили ветку:
  // новые решения проходим вариантом по умолчанию (inserted: { id решения: вариант }), лишние ответы после конца отбрасываем.
  // Возвращает исправленные ответы или null, если сохранение не восстановить.
  function migrate(content, tokens, inserted, ctx) {
    let out = tokens.slice();
    for (let k = 0; k < 20; k++) {
      try { run(content, out, ctx); return out; } catch (e) {
        if (e.extra) out = out.slice(0, e.at);
        else if (e.beat !== undefined && inserted[e.beat] !== undefined && out[e.at] !== inserted[e.beat]) out.splice(e.at, 0, inserted[e.beat]);
        else return null;
      }
    }
    return null;
  }

  const api = { run, play, text, clone, migrate };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.M31Engine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
