/* М31 · срез: события v1 (DOC «События v1»; спецификация — «Ревью Codex — события v1»).
   Генератор эпизодов дрейфа внутри модели времени. Чистые функции без DOM, для браузера и Node.

   Кандидаты каждого типа — пуассоновский поток из скрытых фактов по сиду: tₖ = tₖ₋₁ − ln(U)/λmax, принятие —
   U' < λ(состояние)/λmax. Последовательность зависит только от сида и типа, а не от того, как нарезана перемотка.
   Событие с решением (D) останавливает перемотку вставкой (донесение вахты, затем карточка; ответ — обычный токен);
   событие без решения (N) идёт в журнал и в отчёт вахты. Работы (jobs) завершаются в свой срок записью журнала.
   Будущие кандидаты (ev.clock) — скрытое состояние: интерфейс их не видит (publicOf их удаляет). */
(function (root) {
  'use strict';

  const START = 8;                 // генератор — с конца разгона
  const GAP = 2;                   // лет между корневыми эпизодами любых типов
  const DAY = 1 / 365.25;

  // H — помощники content.js: hidden(s, key), name(s, i) → { ru, en } (с сидом партии), alive(s) → номера живых своих,
  // window(s, t, family) — разрешено ли событие (дрейф, вне сюжетных окон), dvPct(s, kms), kms(s), nf(x, d, lang),
  // prod(s) — 'repair' | 'tools' | 'printQC', sensors(s), thin(s) — тонкая вахта
  function create(H) {
    const L = (ru, en) => ({ ru, en });
    const pick = (lang, v) => typeof v === 'function' ? v(lang) : v[lang];

    // ---------------------------------------------------------------- каталог (первые три: 03, 09, 11)
    const TYPES = {
      // 03 «Картриджи после регенерации» — жизнеобеспечение; группа Б на ногах — нагрузка на очистку ×1,5
      airFilter: {
        kind: 'D', family: 'lifeSupport', lam: 0.008, lamMax: 0.012, cooldown: 25, cap: 2,
        rate: s => s.groupB === 'woken' ? 1.5 : 1,
        name: L('картриджи воздуха', 'air cartridges'),
        prepare: (s, e, u) => { e.ch = 1 + Math.floor(u('channel') * 6); e.ppm = 40 + Math.round(u('ppm') * 50); },
        cost: s => H.prod(s) === 'printQC' ? 1 : H.prod(s) === 'tools' ? 1.5 : 2,
        decision: (s, e, T) => ({
          scene: 'vault',
          title: L('Картриджи воздуха после регенерации', 'Air cartridges after regeneration'),
          context: L(`${e.who.ru}, вахта жизнеобеспечения: после одинакового цикла очистки остаточный CO₂ в канале ${e.ch} растёт уже третий месяц — на ${e.ppm} ppm выше нормы цикла. Соседний канал исправен; если рост продолжится, автоматика изолирует канал. Сорбент стареет быстрее паспорта.`,
            `${e.who.en}, life-support watch: after the same cleaning cycle the residual CO₂ in channel ${e.ch} has been rising for three months — ${e.ppm} ppm above the cycle norm. The neighbouring channel is fine; if the rise goes on, the automatics will isolate the channel. The sorbent is ageing faster than its rating.`),
          rec: x => x.materials >= 25 ? { id: 'replace', why: L('материалов хватает, а занятость вахты дороже', 'there are materials enough, and the watch\'s time costs more') }
            : { id: 'regen', why: L('материалов мало — платим временем', 'materials are short — we pay in time') },
          options: [{
            id: 'replace',
            label: L('Заменить сорбент', 'Replace the sorbent'),
            known: lang => lang === 'ru' ? [`Материалы для высадки −${H.nf(T.cost(s), 1, 'ru')}%${H.prod(s) !== 'repair' ? ' (вставки режут из запаса на станках)' : ''}; десять суток работы.`, 'Канал возвращается к паспортной производительности.']
              : [`Landing materials −${H.nf(T.cost(s), 1, 'en')}%${H.prod(s) !== 'repair' ? ' (the inserts are cut from stock on the machine tools)' : ''}; ten days of work.`, 'The channel returns to its rated output.'],
            effect: x => { const c = T.cost(x); x.materials -= c; scrap(x, c); job(x, e, 'replace', 10 * DAY); },
            record: L(`Сорбент канала ${e.ch} заменяют. Старые картриджи — в мастерскую: корпуса пойдут во вторсырьё.`, `The sorbent of channel ${e.ch} is replaced. The old cartridges go to the workshop: their housings will go to scrap.`)
          }, {
            id: 'regen',
            label: L('Регенерировать партиями', 'Regenerate in batches'),
            known: lang => lang === 'ru' ? ['Материалы −0,5%.', `Двое специалистов заняты ${H.thin(s) ? 'девять месяцев' : 'полгода'}; новые производственные работы на это время откладываются.`, 'До конца регенерации канал работает на девяти десятых производительности.']
              : ['Materials −0.5%.', `Two specialists are busy for ${H.thin(s) ? 'nine months' : 'half a year'}; new production work waits until then.`, 'Until the regeneration is done the channel runs at nine tenths of its output.'],
            effect: x => { x.materials -= 0.5; job(x, e, 'regen', H.thin(x) ? 0.75 : 0.5); },
            record: L(`Канал ${e.ch} переводят на регенерацию партиями. ${e.who.ru} ведёт график.`, `Channel ${e.ch} goes over to batch regeneration. ${e.who.en} keeps the schedule.`)
          }]
        }),
        done: (s, e, j) => j.how === 'replace'
          ? note(s, e, L('Журнал жизнеобеспечения', 'Life-support log'), L(`Канал ${e.ch}: сорбент заменён, остаточный CO₂ — в норме цикла.`, `Channel ${e.ch}: sorbent replaced, residual CO₂ within the cycle norm.`), 'done')
          : note(s, e, L('Журнал жизнеобеспечения', 'Life-support log'), L(`Канал ${e.ch}: регенерация закончена. Сорбент отслужит ещё срок; канал снова на полной производительности.`, `Channel ${e.ch}: regeneration finished. The sorbent will serve another term; the channel is back to full output.`), 'done')
      },

      // 09 «Эфемериды разошлись» — навигация; только пока до торможения достаточно времени
      navResidual: {
        kind: 'D', family: 'navigation', lam: 0.006, lamMax: 0.006, cooldown: 25, cap: 2,
        rate: () => 1,
        name: L('эфемериды разошлись', 'the ephemerides disagree'),
        prepare: (s, e, u) => { e.mas = 2 + Math.round(u('mas') * 20) / 10; },
        decision: (s, e) => ({
          scene: 'chart',
          title: L('Эфемериды разошлись', 'The ephemerides disagree'),
          context: L(`${e.who.ru}, навигационная смена: два независимых решения по разным наборам опорных звёзд расходятся на ${H.nf(e.mas, 1, 'ru')} угловой миллисекунды, и расхождение медленно растёт. Это не потеря курса: остаток пока меньше допуска точки встречи, но до торможения его нужно снять.`,
            `${e.who.en}, navigation watch: two independent solutions from different sets of reference stars disagree by ${H.nf(e.mas, 1, 'en')} milliarcseconds, and the gap is slowly growing. This is not a lost course: the residual is still within the rendezvous tolerance, but it has to be removed before braking.`),
          rec: x => x.reserve >= 90 && !H.thin(x) ? { id: 'correct', why: L('резерв почти полон, а прибор нужен для других наблюдений', 'the reserve is nearly full, and the instrument is needed for other observations') }
            : { id: 'baseline', why: L('резерв дороже полугода наблюдений', 'the reserve costs more than half a year of observing') },
          options: [{
            id: 'correct',
            label: L('Принять консервативную коррекцию', 'Accept a conservative correction'),
            known: lang => lang === 'ru' ? [`Резерв манёвров −10 км/с (−${H.nf(H.dvPct(s, 10), 2, 'ru')}% паспортного).`, 'Трое суток; расхождение снято сразу.']
              : [`Manoeuvre reserve −10 km/s (−${H.nf(H.dvPct(s, 10), 2, 'en')}% of rated).`, 'Three days; the disagreement is removed at once.'],
            effect: x => { x.reserve -= H.dvPct(x, 10); },
            record: L('Коррекция на 10 км/с выполнена. Оба навигационных решения сходятся.', 'The 10 km/s correction is made. Both navigation solutions agree.')
          }, {
            id: 'baseline',
            label: L('Набрать длинную базу наблюдений', 'Build a long observation baseline'),
            known: lang => lang === 'ru' ? [`${H.sensors(s) === 'spectraPlus' ? 'Три месяца' : 'Полгода'} наблюдений на ходу; прибор занят.`, `Затем коррекция −4 км/с (−${H.nf(H.dvPct(s, 4), 2, 'ru')}% паспортного).`]
              : [`${H.sensors(s) === 'spectraPlus' ? 'Three months' : 'Half a year'} of observing on the move; the instrument is busy.`, `Then a correction of −4 km/s (−${H.nf(H.dvPct(s, 4), 2, 'en')}% of rated).`],
            cost: x => { x.reserve -= H.dvPct(x, 4); },                      // предпросмотр: коррекция после серии
            effect: x => { job(x, e, 'baseline', H.sensors(x) === 'spectraPlus' ? 0.25 : 0.5); },
            record: L(`${e.who.ru} ставит длинную серию наблюдений; коррекция — после неё.`, `${e.who.en} sets up a long observing series; the correction comes after it.`)
          }]
        }),
        done: (s, e, j) => { const d = H.dvPct(s, 4); s.reserve -= d; move(s, e, 'reserve', -d);
          note(s, e, L('Навигационный журнал', 'Navigation log'), L(`Длинная база набрана: остаток уточнён, коррекция на 4 км/с выполнена. Оба решения сходятся.`, `The long baseline is complete: the residual is pinned down and a 4 km/s correction made. Both solutions agree.`), 'done'); }
      },

      // 11 «Что удалось вернуть в запас» — только из реального вторсырья прошлых ремонтов
      recovery: {
        kind: 'N', family: 'workshop', lam: 0.014, lamMax: 0.014, cooldown: 12, cap: 4,
        rate: s => (s.ev.scrap || 0) >= 0.5 && (s.ev.recovered || 0) < 6 ? 1 : 0,
        name: L('вторсырьё', 'scrap recovery'),
        apply: (s, e) => {
          const k = { repair: 0.15, tools: 0.25, printQC: 0.35 }[H.prod(s)] || 0.15;
          const gain = Math.min(2, k * s.ev.scrap, 6 - s.ev.recovered);
          if (!(gain > 0.05)) return;
          s.ev.scrap -= gain / k; s.ev.recovered += gain; s.materials += gain; move(s, e, 'materials', gain);
          const g = lang => H.nf(gain, 1, lang), y = lang => Math.round(k * 100);
          note(s, e, L('Журнал мастерской · вторсырьё', 'Workshop log · scrap'),
            L(`Партия восстановления за девяносто суток: из корпусов, крепежа и обрезков прошлых ремонтов в запас вернулось ${g('ru')}% материалов. ${H.prod(s) === 'printQC' ? 'Металлопечать с контролем' : H.prod(s) === 'tools' ? 'Станки' : 'Ремонтный набор'} — годного ${y('ru')}% от лома; остальное остаётся браком.`,
              `A ninety-day recovery batch: housings, fasteners and offcuts from past repairs return ${g('en')}% of materials to stock. ${H.prod(s) === 'printQC' ? 'Metal printing with QC' : H.prod(s) === 'tools' ? 'The machine tools' : 'The repair kit'} — ${y('en')}% of the scrap comes out usable; the rest stays scrap.`), 'note');
        }
      }
    };

    // ---------------------------------------------------------------- состояние
    function init(s) {
      if (s.ev) return s.ev;
      s.ev = { clock: {}, n: {}, last: {}, root: -Infinity, log: [], jobs: [], notes: [], moves: [], scrap: 0, recovered: 0 };
      return s.ev;
    }
    // следующий кандидат типа: k-й шаг пуассоновского потока от START
    function clockOf(s, type) {
      const ev = init(s), c = ev.clock[type];
      if (c) return c;
      const T = TYPES[type], u = Math.max(1e-9, H.hidden(s, `events.${type}.0.wait`) ?? 0.5);
      return (ev.clock[type] = { k: 0, at: START - Math.log(u) / T.lamMax });
    }
    function step(s, type) {
      const c = clockOf(s, type), T = TYPES[type], k = c.k + 1, u = Math.max(1e-9, H.hidden(s, `events.${type}.${k}.wait`) ?? 0.5);
      s.ev.clock[type] = { k, at: c.at - Math.log(u) / T.lamMax };
    }
    // ближайшая граница генератора в (t0, t1]: кандидат типа или завершение работы
    function next(s, t0, t1) {
      if (!s.eq || !s.riskSeed || s.evOff) return null;
      init(s);
      let best = null;
      for (const j of s.ev.jobs) if (j.until > t0 && j.until <= t1 && (!best || j.until < best.at)) best = { at: j.until, job: j };
      for (const type of Object.keys(TYPES)) { const c = clockOf(s, type);
        if (c.at > t0 && c.at <= t1 && (!best || c.at < best.at)) best = { at: c.at, type, k: c.k }; }
      return best;
    }
    const scrap = (s, x) => { init(s); s.ev.scrap += x; };
    function job(s, e, how, years) { init(s); s.ev.jobs.push({ id: e.id, type: e.type, how, until: s.year + years }); }
    function move(s, e, key, d) { s.ev.moves.push({ at: s.year, key, d, id: e.id, name: TYPES[e.type].name }); }
    function note(s, e, title, text, stage) {
      const q = s.ev.notes; s.ev.notes = [];                               // снимок — без очереди записей (не вкладывать их друг в друга)
      const state0 = JSON.parse(JSON.stringify(s)); s.ev.notes = q;
      q.push({ id: `ev.${e.id}.${stage}`, kind: 'instrument', at: s.year, title, text, ev: e.type, state0 });
    }
    // кандидат дошёл: шаг часов, проверка условий и принятие; D — вставка-решение, N — запись журнала
    function fire(s, b) {
      const ev = s.ev;
      if (b.job) {                                                      // работа закончилась в свой срок
        ev.jobs = ev.jobs.filter(j => j !== b.job);
        const e = ev.log.find(x => x.id === b.job.id), T = e && TYPES[e.type];
        if (T && T.done) T.done(s, e, b.job);
        return null;
      }
      const type = b.type, T = TYPES[type], k = b.k;
      step(s, type);
      const t = s.year;
      if (!H.window(s, t, T.family)) return null;
      if ((ev.n[type] || 0) >= T.cap || t - (ev.last[type] ?? -Infinity) < T.cooldown || t - ev.root < GAP) return null;
      if (ev.jobs.some(j => j.type === type)) return null;
      const u = key => H.hidden(s, `events.${type}.${k}.${key}`) ?? 0.5;
      if (!(u('accept') < T.lam * T.rate(s) / T.lamMax)) return null;
      const alive = H.alive(s), who = alive.length ? alive[Math.floor(u('who') * alive.length) % alive.length] : 0;
      const e = { id: `${type}.${k}`, type, k, at: t, who: H.name(s, who) };
      if (T.prepare) T.prepare(s, e, u);
      ev.n[type] = (ev.n[type] || 0) + 1; ev.last[type] = t; ev.root = t; ev.log.push(e);
      if (T.kind === 'N') { T.apply(s, e); return null; }
      return { kind: 'event', id: e.id, type };
    }
    // решение-вставка по событию: id и текст — от экземпляра (имена записаны при генерации, с сидом)
    function decision(s, ev) {
      const e = s.ev.log.find(x => x.id === ev.id), T = TYPES[e.type], d = T.decision(s, e, T);
      const opts = d.options.map(o => Object.assign({}, o, { effect: x => { o.effect(x); const i = x.ev.log.find(y => y.id === e.id); if (i) i.choice = o.id; },
        known: { ru: () => pick('ru', o.known), en: () => pick('en', o.known) } }));
      return { id: `d.ev.${e.id}`, kind: 'decision', eventType: e.type, scene: d.scene, title: d.title, context: d.context, rec: d.rec, options: opts };
    }
    // записи журнала, накопленные моделью (забирает движок)
    function take(s) { if (!s.ev) return []; const out = s.ev.notes; s.ev.notes = []; return out; }
    // эпизоды периода для отчёта вахты: [{ at, name, choice }]
    const since = (s, y0, y1) => s.ev ? s.ev.log.filter(e => e.at > y0 + 1e-9 && e.at <= y1 + 1e-9) : [];
    const movesIn = (s, key, y0, y1) => s.ev ? s.ev.moves.filter(m => m.key === key && m.at > y0 + 1e-9 && m.at <= y1 + 1e-9) : [];
    // для интерфейса: будущие кандидаты — скрытое состояние
    const strip = p => { if (p && p.ev) delete p.ev.clock; return p; };
    return { TYPES, next, fire, decision, take, since, movesIn, strip, scrap };
  }

  const api = { create };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.M31Events = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
