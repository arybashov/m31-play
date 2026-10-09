/* М31 · срез: заявочный план, пролог и Акт I (годы 0–8).
   v2 по ревью Codex (DOC/Ревью Codex — драматургия и срез.md): пролог — сцена без ложного выбора,
   первое действие — сопоставить записи; Кору и Дана игрок видит до распоряжения их временем;
   очередь даёт отдачу у облака; цены — в единицах бюджета; передача полномочий — действием.
   v3: выбор цели в секторе и три ветки Акта I между общими узлами (концепт §7.8).
   Текст сразу на двух языках. Числа ресурсов — значения прототипа, не паспорт корабля. */
(function (root) {
  'use strict';

  const pct = (x, lang) => (lang === 'ru' ? x.toFixed(1).replace('.', ',') : x.toFixed(1));
  // материалы: целые — без десятых, дробные (ремонты и вторсырьё событий) — с десятыми
  const pctM = (x, lang) => Math.abs(x - Math.round(x)) < 0.05 ? String(Math.round(x)) : pct(x, lang);

  // Миссия: цель, паспорт, поворот курса — расчёты в mission.js (браузер: M31Mission).
  const M = root.M31Mission || require('./mission.js');
  // Щит как прибор (симулятор): shield.js (браузер: M31Shield).
  const SH = root.M31Shield || require('./shield.js');
  // События v1 (DOC «События v1»): генератор эпизодов дрейфа — events.js (браузер: M31Events)
  const EVM = root.M31Events || require('./events.js');
  // Износ корабля (DOC «Долгий рейс — износ и смена курса», шаг 2): граф узлов, отказы, буферы групп — wear.js (браузер: M31Wear)
  const W = root.M31Wear || require('./wear.js');
  // Единая очередь работ (шаг 3a): люди делятся между ремонтами износа и работами событий — jobs.js (браузер: M31Jobs)
  const JB = root.M31Jobs || require('./jobs.js');
  const R = root.M31Requests || require('./requests.js'), RQ = R;   // RQ — там, где R занято локально (досье: признаки маршрута)
  const nm = (s, lang) => M.nameOf(s.target || M.DECLARED, lang);
  // «звезда Барнарда» склоняется: у звезды, к звезде; остальные названия каталога — нет
  const nmG = s => nm(s, 'ru').replace(/^звезда /, 'звезды '), nmD = s => nm(s, 'ru').replace(/^звезда /, 'звезде ');
  const f1 = (x, lang) => (lang === 'ru' ? String(Math.round(x * 10) / 10).replace('.', ',') : String(Math.round(x * 10) / 10));
  const fb = (b, lang) => (lang === 'ru' ? b.toFixed(3).replace('.', ',') : b.toFixed(3)) + 'c';
  function plural(n, forms) {
    const a = Math.abs(Math.round(n)) % 100, b = a % 10;
    return forms[a > 10 && a < 20 ? 2 : b === 1 ? 0 : b >= 2 && b <= 4 ? 1 : 2];
  }
  const yrs = n => `${Math.round(n)} ${plural(n, ['год', 'года', 'лет'])}`;
  const yrsG = n => `${Math.round(n)} ${plural(n, ['года', 'лет', 'лет'])}`;   // после «около»
  const yrsEn = n => `${Math.round(n)} year${Math.round(n) === 1 ? '' : 's'}`;
  const ppl = n => `${n} ${plural(n, ['человек', 'человека', 'человек'])}`;
  // трата резерва манёвров в км/с → % паспортного резерва (reserveDv — доля c)
  const dvPct = (s, kms) => kms / (s.reserveDv * 299792.458) * 100;
  const DV = { probe: 120, stream: 250, streamWeak: 900 };   // км/с
  const pctDv = (r, lang) => (lang === 'ru' ? String(r * 100).replace('.', ',') : String(r * 100)) + '% c';
  const eachAwake = (T, w) => M.awake(T, w);

  // ---------------------------------------------------------------- архив колоний и следов (mission.js: knownAtStart)
  // Карта показывает то, что Земля знает на день старта: последний отчёт, его возраст и даты наблюдения и получения.
  // Память прошлых партий — отдельным слоем «наследия»: общий календарь мира пока не ведётся.
  const STATUS = { viable: { ru: 'действует', en: 'active' }, establishing: { ru: 'развивается', en: 'growing' },
    declining: { ru: 'угасает', en: 'declining' }, dead: { ru: 'погибла', en: 'lost' }, trace: { ru: 'след', en: 'trace' } };
  const yrsAgo = (n, lang) => { const r = Math.round(Math.abs(n) * 12);
    if (r < 12) return lang === 'ru' ? `${r} ${plural(r, ['месяц', 'месяца', 'месяцев'])}` : `${r} month${r === 1 ? '' : 's'}`;
    return lang === 'ru' ? yrs(Math.abs(n)) : yrsEn(Math.abs(n)); };
  const yr1 = (y, lang) => f1(y, lang).replace('-', '−');
  // короткая подпись для карты в 3D
  // compact — для 3D: имя и знак состояния, без возраста (у Солнца подписи теснятся; возраст — в панели и карточке)
  function archiveShort(o, lang, year, compact) {
    const ru = lang === 'ru', age = Math.round(year - o.observedAt);
    if (compact) return o.kind === 'trace' ? `${ru ? '№' : 'No. '}${o.id.slice(1)}` : `${o[lang]}${o.status === 'declining' ? ' ?' : o.status === 'dead' ? ' ×' : ''}`;
    if (o.kind === 'trace') return `${ru ? '№' : 'No. '}${o.id.slice(1)} · ${o.id === 'e24' ? (ru ? 'пустой корабль' : 'empty ship') : (ru ? 'судьба неизвестна' : 'fate unknown')}`;
    if (o.status === 'dead') return `${o[lang]} × · ${ru ? 'погибла' : 'lost'}`;
    return `${o[lang]}${o.status === 'declining' ? ' ?' : ''} · ${ru ? `сведениям ${age} ${plural(age, ['год', 'года', 'лет'])}` : `data ${age} yr old`}`;
  }
  // строки карточки звезды на карте выбора цели
  function archiveLines(o, lang, year, world) {
    const ru = lang === 'ru', out = [];
    if (o.kind === 'trace') {
      out.push(`${o[lang]} — ${o.note[lang]}.`);
      out.push(ru ? `Последняя передача — год ${yr1(o.observedAt, 'ru')}; Земля получила её в год ${yr1(o.receivedAt, 'ru')}.` : `Last transmission: year ${yr1(o.observedAt, 'en')}; Earth received it in year ${yr1(o.receivedAt, 'en')}.`);
      return out;
    }
    const st = STATUS[o.status][lang];
    if (o.status === 'dead') {
      out.push(ru ? `«${o.ru}» — ${st}: около ${yrs(year - o.observedAt)} назад; сообщение получено за ${yrsAgo(o.receivedAt, 'ru')} до старта.` : `${o.en} — ${st}: about ${yrsEn(year - o.observedAt)} ago; the message arrived ${yrsAgo(o.receivedAt, 'en')} before departure.`);
      out.push(ru ? `Тогда в капсулы склада ушли ${o.asleep} человек; расчётный ресурс — до года 125. Живы ли все сейчас, неизвестно.` : `Then ${o.asleep} people went into the store's capsules; rated life to year 125. Whether all are alive now is unknown.`);
    } else {
      out.push(ru ? `«${o.ru}» — ${st}. Сведения около ${yrsAgo(year - o.observedAt, 'ru')} назад: ${o.awake} бодрствовали, ${o.asleep} спали.` : `${o.en} — ${st}. Data about ${yrsAgo(year - o.observedAt, 'en')} old: ${o.awake} awake, ${o.asleep} asleep.`);
      out.push(ru ? `Умеет: ${o.cap.ru}. Беда: ${o.trouble.ru}.` : `Capable of: ${o.cap.en}. Trouble: ${o.trouble.en}.`);
    }
    const EVERY = { 0.25: ['раз в квартал', 'quarterly'], 0.5: ['раз в полгода', 'every six months'], 1: ['раз в год', 'yearly'], 2: ['раз в два года', 'every two years'] }[o.every] || ['', ''];
    if (o.status === 'dead') out.push(ru ? `Последний сигнал — год ${yr1(o.observedAt, 'ru')}; Земля получила его в год ${yr1(o.receivedAt, 'ru')}.` : `Last signal: year ${yr1(o.observedAt, 'en')}; Earth received it in year ${yr1(o.receivedAt, 'en')}.`);
    else out.push(ru ? `Наблюдение — год ${yr1(o.observedAt, 'ru')}; отчёт получен за ${yrsAgo(o.receivedAt, 'ru')} до старта; отчёты — ${EVERY[0]}. Нынешнее состояние не подтверждено.` : `Observed in year ${yr1(o.observedAt, 'en')}; the report arrived ${yrsAgo(o.receivedAt, 'en')} before departure; reports come ${EVERY[1]}. The current state is unconfirmed.`);
    if (o.id === 'pass' && world && world.passTug === false) out.push(ru ? 'Наследие прошлых экспедиций: межзвёздный аппарат ушёл спасать сорок первую — для этой партии его нет.' : 'Legacy of past expeditions: the interstellar vessel went to rescue the Forty-First — it is not available this time.');
    return out;
  }
  // поселения из памяти мира у звезды
  const legacyLines = (name, lang, world) => ((world && world.settled) || []).filter(x => x.star === name).map(x => x.joined
    ? (lang === 'ru' ? `Наследие прошлых экспедиций: колония «${M.colony(x.joined).ru}» приняла спасённых — ${ppl(x.people)}.` : `Legacy of past expeditions: ${M.colony(x.joined).en} took in the rescued — ${x.people} people.`)
    : (lang === 'ru' ? `Наследие прошлых экспедиций: поселение спасённых — ${ppl(x.people)}.` : `Legacy of past expeditions: a settlement of the rescued — ${x.people} people.`));
  // строка цели контакта у звезды колонии: колонию признаём, миссия остаётся контактом
  function colonyTie(n, lang) {
    const c = M.colonyAt(n), tr = M.TRACES.find(t => t.star === n && t.id !== 'e32'), ru = lang === 'ru';
    if (c) return c.status === 'dead'
      ? (ru ? `В системе — погибшая колония «${c.ru}»: склад капсул на орбите.` : `The system holds the lost colony ${c.en}: a capsule store in orbit.`)
      : (ru ? `В системе известна колония «${c.ru}» (${STATUS[c.status].ru}). Задача — контакт; приём пятисот человек и помощь колонии не согласованы.` : `A colony is known in the system: ${c.en} (${STATUS[c.status].en}). The task is contact; taking in five hundred and helping the colony are not agreed.`);
    if (tr) return ru ? `Здесь — ${tr.ru.toLowerCase()}: ${tr.note.ru}.` : `Here: ${tr.en} — ${tr.note.en}.`;
    return null;
  }

  // ---------------------------------------------------------------- паспорт: скорость × резерв × комплекты × оснащение
  // Id ответа: b|r|комплекты|оснащение (восемь вариантов по позициям, mission.js: eqCode). Вариант собирается разбором id
  // (beat.option), а не перечислением: сочетаний с оснащением — десятки тысяч. Старые id b|r|комплекты — прежние правила:
  // зонды и ИК из комплектов становятся оснащением, профиль торможения — прежний (tMag = null), без предела замен.
  function subsets(ids) { return ids.reduce((acc, k) => acc.concat(acc.map(x => x.concat(k))), [[]]); }
  const cargoOf = (kits, eq) => M.kitMass(kits) + M.eqMass(eq);
  // Совет утверждает: груз помещается, бодрствование ≤ 25 лет, не больше двух замен оснащения (кроме старых паспортов)
  function passportParse(s, id) {
    const p = String(id).split('|');
    if (p.length !== 3 && p.length !== 4) return null;
    const b = Number(p[0]), r = Number(p[1]), legacy = p.length === 3, names = p[2] ? p[2].split('+') : [];
    if (!M.SPEEDS.includes(b) || !M.RESERVES.includes(r) || new Set(names).size !== names.length) return null;
    const order = legacy ? Object.keys(M.LEGACY_KITS) : M.kitsFor(s.mission);
    if (!names.every(k => order.includes(k)) || names.join('+') !== order.filter(k => names.includes(k)).join('+')) return null;
    const eq = legacy ? M.eqLegacy(names) : M.eqParse(p[3]);
    if (!eq || (!legacy && M.eqSwaps(eq, s.mission) > M.SWAPS)) return null;
    const kits = names.filter(k => M.KITS[k]), cargo = cargoOf(kits, eq), cap = M.capacity(b, r);
    if (cap < 0 || cargo > cap + 1e-9) return null;
    const bm = legacy ? null : M.brakeMass(b, r, cargo), tMag = legacy ? null : M.magYears(bm, b);
    const Tx = M.trip(M.star(s.target).d, b, tMag), T = Math.round(Tx);
    if (M.awake(T, 48, M.crewOf(kits)) > 25) return null;
    return passportOption(s, id, b, r, kits, eq, T, bm, tMag, Tx);
  }
  // список для экрана решения и выборочного обхода: рекомендованное оснащение миссии, все комплекты
  function passportOptions(s) {
    const eq = M.eqDefault(s.mission), code = M.eqCode(eq), out = [];
    for (const b of M.SPEEDS) for (const r of M.RESERVES) for (const kits of subsets(M.kitsFor(s.mission))) {
      const o = passportParse(s, `${b}|${r}|${kits.join('+')}|${code}`);
      if (o) out.push(o);
    }
    return out;
  }
  const kitList = (kits, lang) => kits.length ? kits.map(k => M.KITS[k][lang].toLowerCase()).join(', ') : (lang === 'ru' ? 'без груза сверх ядра' : 'nothing beyond the core');
  // оснащение словами: отличия от рекомендации Совета
  const eqList = (s, eq, lang) => { const d = M.eqDefault(s.mission), diff = M.EQUIP.filter(p => eq[p.id] !== d[p.id]);
    return diff.length ? diff.map(p => `${p[lang].toLowerCase()} — ${M.eqOpt(p.id, eq[p.id])[lang].toLowerCase()}`).join('; ')
      : (lang === 'ru' ? 'как рекомендует Совет' : 'as the Council recommends'); };
  function passportOption(s0, id, b, r, kits, eq, T, bm, tMag, Tx) {
    const a = M.awake(T, 48, M.crewOf(kits)), mag = tMag == null ? '' : { ru: ` Магнит тормозит ${yrsEn(tMag).replace(/ years?/, '')} ${plural(Math.round(tMag), ['год', 'года', 'лет'])}: масса к торможению ${Math.round(bm)} тыс. т.`, en: ` The magnet brakes for ${yrsEn(tMag)}: ${Math.round(bm)} thousand tonnes at braking.` };
    return {
      id,
      label: { ru: `${fb(b, 'ru')} · резерв ${pctDv(r, 'ru')} · ${kitList(kits, 'ru')}`, en: `${fb(b, 'en')} · reserve ${pctDv(r, 'en')} · ${kitList(kits, 'en')}` },
      known: {
        ru: [`Путь около ${yrsG(T)}; каждый проживёт в пути около ${yrsG(a)} при вахте 48.` + (mag ? mag.ru : ''), `Резерв манёвров — ${pctDv(r, 'ru')}.`, `Груз: ${kitList(kits, 'ru')}. Оснащение: ${eqList(s0, eq, 'ru')}.`],
        en: [`About ${yrsEn(T)} on the road; each person lives about ${yrsEn(a)} of it awake with a watch of 48.` + (mag ? mag.en : ''), `Manoeuvre reserve: ${pctDv(r, 'en')}.`, `Cargo: ${kitList(kits, 'en')}. Equipment: ${eqList(s0, eq, 'en')}.`]
      },
      effect: s => {
        s.beta = b; s.reserveDv = r; s.kits = kits.slice(); s.eq = Object.assign({}, eq); s.arrive = T;
        s.brakeMass = bm; s.tMag = tMag; s.arriveExact = Tx == null ? T : Tx; s.crew = M.crewOf(kits);
        s.materials = kits.includes('materials') ? 140 : 100;
      },
      record: {
        ru: s => `Ирсон зачитывает паспорт: ${fb(b, 'ru')}, резерв манёвров ${pctDv(r, 'ru')}, груз — ${kitList(kits, 'ru')}; оснащение — ${eqList(s0, eq, 'ru')}. Прибытие к ${nmD(s)} — около года ${T}.

Кассель ставит подпись Совета последней.`,
        en: s => `Irson reads out the passport: ${fb(b, 'en')}, manoeuvre reserve ${pctDv(r, 'en')}, cargo — ${kitList(kits, 'en')}; equipment — ${eqList(s0, eq, 'en')}. Arrival at ${nm(s, 'en')} around year ${T}.

Kassel signs for the Council last.`
      }
    };
  }

  // зонд вперёд: скорость, пролёт и данные на борту — из паспорта и года запуска
  function probeTimes(s, t) {
    const d = M.star(s.target).d, vp = s.beta * Math.min(t, 8) / 8 + (t < 8 ? 0.085 : 0.07);
    const flyby = t + (d - M.distLy(t, s.beta)) / vp;
    const gap = d - M.distLy(flyby, s.beta);
    return { vp, flyby: Math.round(flyby), data: Math.round(flyby + gap / (1 + s.beta)) };
  }
  // Дрейф: узлы Акта II стоят на долях пути, а не на фиксированных годах —
  // дрейф длится от ~30 до ~230 лет в зависимости от цели и паспорта.
  const brake = s => M.brakeStart(s.arrive, s.tMag);                   // год раскрытия магнита
  // увод ступени разгона: от отделения (год 8) до прохода цели — за десять лет до нас
  const stageOff = s => M.divert(stageYears(s), s.reserveDv);
  const kms = x => String(Math.round(x));
  const Y = (s, f) => Math.round(8 + f * (brake(s) - 8));
  const lag = (s, y) => Math.max(1, Math.round(M.distLy(y, s.beta, s.arrive, s.tMag, M.star(s.target).d)));   // лет идёт сообщение с Земли
  // корабль поддержки (DOC «Корабль поддержки — проект v1»): стартовал, когда сводка о нём ушла с Земли (год сводки минус
  // наше расстояние в св. годах), встреча — через год после нашего прибытия; крейсерская скорость — из этих сроков
  // (разгон 8 лет, магнит 3,86 года до 0,01c, двигатель 4 года): D = b·a/2 + b·q + (b + u)·m/2 + u·e/2
  function supportPlan(s) {
    if (!s.target || !s.arrive || ownStory(s)) return null;
    const D = M.star(s.target).d, tN = Y(s, 0.12), A = arriveView(s), tL = tN - M.distLy(tN, s.beta, s.arrive, s.tMag, D);
    const a = 8, m = 3.86, e = 4, u = 0.01, q = A + 1 - tL - a - m - e;
    return { launch: tL, arrive: A + 1, beta: (D - u * (m + e) / 2) / (a / 2 + q + m / 2), acc: a, mag: m, brake: e, u, D };
  }
  // в 3D — после сводки о нём; найденный — у цели рядом с нами (встреча)
  const supportWorld = (s, ids) => { if (!ids.has('a2.support')) return null; const P = supportPlan(s); return P && Object.assign(P, { meet: s.support === 'found' }); };
  // Акт III: годы от прибытия; источник сигнала — ε Индейца
  const src = s => s.target === M.SOURCE;
  const vAt = (s, y) => M.speedAt(y, s.beta, s.arrive, s.tMag);
  const heatAgo = s => s.arrive - 5 - Y(s, 0.68);
  // ---- оснащение: что даёт каждая позиция (mission.js: EQUIP). До паспорта — базовое.
  // оснащение партии; станки потеряны (износ, шаг 3c) — производство для всех решений и событий — ремкомплект
  const eqOf = s => { const e = s.eq || M.EQ_BASE; return s.wear && s.wear.shop && s.wear.shop.lost && e.prod !== 'repair' ? Object.assign({}, e, { prod: 'repair' }) : e; };
  const hasIR = s => eqOf(s).sensors === 'ir';                          // ИК: слабые спектры, карлики, вспышки
  const hasScouts = s => eqOf(s).probes === 'scout2';                   // два разведчика: ранний зонд и зонд в поток
  const probesLeft = s => ['scout2', 'inspect'].includes(eqOf(s).probes);   // есть готовый зонд для проверки потока
  const capsSafe = s => eqOf(s).caps === 'capsSafe';                    // надёжные капсулы: отказы вдвое реже
  const crewOf = s => s.crew || M.CREW;                               // своих: 460 со спасательным сектором
  const contactRun = s => !s.mission || s.mission === 'contact';
  const nmA = s => nm(s, 'ru').replace(/^звезда /, 'звезду ');            // курс на звезду Барнарда
  // что торопит паспорт: у каждой миссии своё
  // исследовательские заявки — по виду работы (requests.js): у каждой своя срочность и своя задача словами
  const URGENT_WORK = { contactColony: { ru: 'лоции Перевала стареют сейчас', en: "the Pass's charts are ageing now" },
    trace: { ru: 'след двадцать четвёртой стареет сейчас', en: "No. 24's trace is ageing now" },
    survey: { ru: 'Кольцо ждёт измерений', en: 'the Ring is waiting for the measurements' } };
  const urgentOf = (s, lang) => { const q = s.requestId && R.get(s.requestId), L = R.linkOf(q); if (L) return L.urgent[lang === 'ru' ? 0 : 1];
    const w = q && URGENT_WORK[q.work]; return (w || URGENT[s.mission || 'contact'])[lang]; };
  const URGENT = { contact: { ru: 'тридцать вторая молчит сейчас', en: 'the Thirty-Second is silent now' },
    supply: { ru: 'передатчик форпоста слабеет сейчас', en: "the outpost's transmitter is fading now" },
    rescue: { ru: 'капсулы Оттепели стареют сейчас', en: "Thaw's capsules are ageing now" } };
  // о чём наш отчёт домой
  const reportOn = (s, lang) => { const ru = lang === 'ru';
    if (s.mission === 'supply') return ru ? 'о форпосте Ксилона Ир и о мире у звезды Барнарда' : "on the Xylona Ir outpost and the world at Barnard's Star";
    if (s.mission === 'rescue') return ru ? `об Оттепели и о мире у ${nmG(s)}` : `on Thaw and the world at ${nm(s, 'en')}`;
    return ru ? `о мире у ${nmG(s)}` : `on the world at ${nm(s, 'en')}`; };
  // задача экспедиции словами — по миссии; у исследования — по виду работы заявки
  const GOAL_WORK = {
    contactColony: { ru: 'установить прямую связь с Перевалом, сверить лоции и, если у цели можно жить, построить там дом', en: 'establish a direct link with the Pass, reconcile the navigation records and, if the target can be lived on, build a home there' },
    trace: { ru: 'найти след двадцать четвёртой, передать протокол и, если у цели можно жить, построить там дом', en: "find No. 24's trace, transmit the report and, if the target can be lived on, build a home there" },
    survey: { ru: 'обследовать систему и её планету, передать измерения и, если у цели можно жить, построить там дом', en: 'survey the system and its planet, transmit the measurements and, if the target can be lived on, build a home there' }
  };
  const goalOf = (s, lang) => { const q = s.requestId && R.get(s.requestId), L = R.linkOf(q), k = lang === 'ru' ? 0 : 1;
    if (L) return lang === 'ru' ? `установить прямую связь ${L.with[0]}, ${L.whatV[0]} и, если у цели можно жить, построить там дом`
      : `establish a direct link ${L.with[1]}, ${L.whatV[1]} and, if the target can be lived on, build a home there`;
    return q && GOAL_WORK[q.work] ? GOAL_WORK[q.work][lang] : goalBase(s, lang); };
  const goalBase = (s, lang) => ({
    contact: { ru: 'найти тридцать вторую, понять сигнал и, если у цели можно жить, построить там дом', en: 'find the Thirty-Second, understand the signal and, if the target can be lived on, build a home there' },
    supply: { ru: 'вернуть форпосту Ксилона Ир связь и капсулы и остаться с ним', en: 'give the Xylona Ir outpost back its link and its capsules, and stay with it' },
    rescue: { ru: 'успеть к сорока спящим Оттепели и, если у цели можно жить, построить там дом', en: "reach Thaw's forty sleepers in time and, if the target can be lived on, build a home there" }
  })[s.mission || 'contact'][lang];
  const crewWord = (s, lang) => crewOf(s) < M.CREW ? (lang === 'ru' ? 'Четыреста шестьдесят' : 'Four hundred and sixty') : (lang === 'ru' ? 'Пятьсот' : 'Five hundred');
  // потери в пути: с моделью износа — история (смерти по журналу модели до даты, не позже её хода), без неё — прежняя
  // оценка модели первого порядка по нынешней вахте. Запрос истории на будущую дату, пока модель идёт, считается
  // (проверки); после сигнала бедствия модель остановлена — дальше людей ведёт модель спасения
  let LOSS_FUTURE = 0;
  const lossesOf = (s, years) => {
    if (s.wear) { if (years > s.wear.t + 1e-6 && wearOn(s)) LOSS_FUTURE++; return W.losses(s.wear, Math.min(years, s.wear.t)); }
    return M.losses(years, s.watch, capsSafe(s), crewOf(s));
  };
  const supplyS = s => s.mission === 'supply';      // сюжет снабженца «То, что они разобрали» (DOC: спецификация Codex)
  const rescueS = s => s.mission === 'rescue';      // сюжет спасателя «Сорок мест» (DOC: спасатель v3, спецификация)
  const ownStory = s => supplyS(s) || rescueS(s);                        // у миссии свой дрейф: без компромисса Ирсона и корабля поддержки
  // снабженец (версия 2): в дрейфе пыль бьёт по охлаждению; в 30% партий треснул коллектор — прямое подключение холодильника
  // переносит отказ на весь контур: 12 погибших экипажа, аварийный сон и сигнал бедствия. Опрессовка видит трещину в 9 из 10.
  const SUPPLY = { collector: 0.3, cargoSense: 0.9, check: 2, isolate: 8, cargoDead: 12 };
  const collectorCracked = s => (hidden(s, 'supply.cargo.collector') ?? 1) < SUPPLY.collector;
  const coolerName = (s, lang) => s.kits.includes('request') ? (lang === 'ru' ? 'холодильник из груза заявки' : 'the request-cargo cooler') : (lang === 'ru' ? 'корабельный резервный холодильник' : "the ship's reserve cooler");
  const SOS_AT_cargo = s => Y(s, 0.5) + (s.cargoDays || 0) / 365.25;
  // буря у Барнарда — одна на всю операцию: u < 0,40 — сильный поток (повреждает и общую плату), 0,40–0,65 — умеренный,
  // но изношенная плата не выдерживает, ≥ 0,65 — восстановимый сбой. Обычная проверка платы видит повреждение в половине
  // случаев, под нагрузкой — в 9 из 10 (один ключ). Короткая схема при сильной буре — 18 местных; замена при повреждённой
  // плате — 24 местных и капсульная секция (независимые насосы спасают людей, но не секцию).
  const STORM = { strong: 0.4, board: 0.65, fastDead: 18, busDead: 24, protect: 6, block: 2, replace: 3, check: 1, deep: 8, split: 12 };
  const stormU = s => hidden(s, 'supply.storm') ?? 1;
  const boardDamaged = s => stormU(s) < STORM.board;
  const opYear = s => s.arrive + (s.supplyDays || 0) / 365.25;          // дата внутри операции у форпоста
  function cargoConnect(st) {                                           // прямое подключение: при трещине — общий отказ
    if (!collectorCracked(st)) return;
    st.cargoFailed = true; st.dead += SUPPLY.cargoDead; st.supplyCrewDead = SUPPLY.cargoDead;
    incident(st, 'supplyCargo', SUPPLY.cargoDead, { check: st.cargoMethod === 'check' ? 'pressure' : null, found: false, year: Y(st, 0.5) + st.cargoDays / 365.25 });
    st.sos = 'cargo';
  }
  // сектор щита пробит (удар облака или потока) и не заменён запасным
  const breached = s => !!s.shieldBreach && !s.shieldFixed;
  // облако: в 25% партий в крае — полоса крупной пыли; затмение видит её в 90% случаев
  const CLOUD = { band: 0.25, sense: 0.9, check: 2, dead: 8 };
  const cloudBand = s => (hidden(s, 'contact.cloud.band') ?? 1) < CLOUD.band;
  // край облака D2 — место на пути, не год (DOC «Симулятор v1 — время и щит», шаг 4): вход и выход, св. лет
  // от Солнца — из прежнего эталона (0,08c: вход на году 4,6, проход 21 сутки); на разгоне путь β·t²/(2·ACC).
  // Мелкая пыль края — 10 фонов; полоса крупной пыли (скрытый факт cloudBand) — средняя треть края, 40 фонов, и одно
  // крупное зерно 0,500–0,515 мм: его удар считает модель щита (энергия → выбоина → пробой, если не хватило остатка)
  const CLOUD_X = [0.1058, 0.108461292158756], CLOUD_RHO = { edge: 10, band: 40 };
  const cloudYear = (s, x) => Math.sqrt(2 * M.ACC * x / s.beta);
  const edgeIn = s => cloudYear(s, CLOUD_X[0]), edgeOut = s => cloudYear(s, CLOUD_X[1]);
  const edgeDays = s => Math.round((edgeOut(s) - edgeIn(s)) * 365.25);
  const edgeMonths = (s, lang) => { const m = Math.max(1, Math.round((edgeIn(s) - 4) * 12));
    return lang === 'ru' ? `${m} ${plural(m, ['месяц', 'месяца', 'месяцев'])}` : `${m} month${m === 1 ? '' : 's'}`; };
  // исход полосы для текстов — из модели щита
  const bandHit = s => !!s.cloudHit;
  const bandBreach = s => !!(s.cloudHit && s.cloudHit.breached);
  // контур воды (контакт): после пробуждения группы Б в 66,5% партий повреждена общая магистраль колец;
  // обычная проверка (7 суток, −2) видит дефект в половине случаев, углублённая (42 суток, −8) — в девяти из десяти
  const LOOP = { common: 0.665, ordinary: { days: 7, cost: 2, sense: 0.5 }, deep: { days: 42, cost: 8, sense: 0.9 }, dead: 31, materials: 20 };
  const loopCommon = s => (hidden(s, 'contact.loop.common') ?? 1) < LOOP.common;
  const loopAt = s => Y(s, 0.68) + 2;                                    // два года запаса от пробуждения группы Б
  // совместный план (снабженец v2): связь, капсулы, обе работы, места в кольцах корабля или признанный срыв.
  // relay/capsules/both — только при разделённом или исправном управлении; при потерянной секции — места до 45-го дня.
  const shelterPeople = s => Math.max(0, Math.min(90, 250 - (s.outpostDead || 0) - 160));
  const shelterFree = s => s.gridBlocks >= 2 && !s.supplyIndependent && s.materials >= SHELTER && (!s.capsLost || s.supplyDays + 7 <= 45);
  // переселение: связь из остатка, капсулы — только если секция цела (тот же расчёт для «После» и для исхода)
  function shelterBuild(st) {
    if (st.capsLost) st.relayOK = relayKit(st) || (st.materials >= BUILD.relay && (st.materials -= BUILD.relay, true));
    else supplyBuild(st, 'relay');
  }
  function deliverOptions(s) {
    const ok = s.busResolved && !s.capsLost, out = [];
    if (ok && (relayKit(s) || s.materials >= BUILD.relay)) out.push({ id: 'relay', label: { ru: 'Сначала постоянная связь', en: 'Permanent link first' },
      known: { ru: s => ['Связь через полгода; капсулы — через три года, если на них хватит материалов.', 'До приёмки капсул охлаждение зависит от корабля.', supplyForecast(s, 'relay').capsOK ? 'По расчёту обе системы встанут.' : 'Капсульный блок собрать будет не из чего.'],
        en: s => ['The link in half a year; capsules in three years if materials cover them.', 'Until the capsules are accepted, cooling depends on the ship.', supplyForecast(s, 'relay').capsOK ? 'By the estimate both systems will be in.' : 'There will be nothing to build the capsule unit from.'] },
      cost: st => { const t = supplyForecast(st, 'relay'); st.materials = t.materials; },
      effect: st => { st.deliver = 'relay'; supplyBuild(st, 'relay'); },
      record: { ru: s => `Сначала — связь. ${s.capsOK ? 'Капсульный блок ставят следом.' : 'Капсульного блока не будет: материалов не хватает.'}`, en: s => `The link first. ${s.capsOK ? 'The capsule unit follows.' : 'There will be no capsule unit: the materials are short.'}` } });
    if (ok && (capsKit(s) || s.materials >= BUILD.caps)) out.push({ id: 'capsules', label: { ru: 'Сначала независимые капсулы', en: 'Independent capsules first' },
      known: { ru: s => ['Капсулы принимают после монтажа — двенадцать суток; связь через три года, если хватит материалов.', supplyForecast(s, 'caps').relayOK ? 'По расчёту обе системы встанут.' : 'Передатчик собрать будет не из чего.'],
        en: s => ['The capsules are accepted after installation — twelve days; the link in three years if materials suffice.', supplyForecast(s, 'caps').relayOK ? 'By the estimate both systems will be in.' : 'There will be nothing to build the transmitter from.'] },
      cost: st => { const t = supplyForecast(st, 'caps'); st.materials = t.materials; },
      effect: st => { st.deliver = 'capsules'; st.supplyDays += 12; supplyBuild(st, 'caps'); },
      record: { ru: s => `Сначала — капсулы. ${s.relayOK ? 'Передатчик ставят следом.' : 'Передатчика не будет: материалы кончились на капсулах.'}`, en: s => `The capsules first. ${s.relayOK ? 'The transmitter follows.' : 'There will be no transmitter: the materials ran out on the capsules.'}` } });
    const both = supplyBothCost(s);
    if (ok && both != null && !s.supplyIndependent) out.push({ id: 'both', label: { ru: 'Две работы параллельно', en: 'Both jobs in parallel' },
      known: { ru: [`Второй монтажный комплект: −${both}% и недостающее оборудование.`, 'Нужны две свободные сети корабля: капсулы — за двенадцать суток, связь — через полгода.'], en: [`A second installation kit: −${both}% plus the missing equipment.`, "Requires two free ship grids: capsules in twelve days, the link in half a year."] },
      cost: st => { st.materials -= both; const t = supplyForecast(st, 'caps'); st.materials = t.materials; },
      effect: st => { st.materials -= both; st.deliver = 'both'; st.supplyDays += 12; supplyBuild(st, 'caps'); },
      record: { ru: 'Обе бригады работают одновременно; вторую питает вторая сеть корабля.', en: "Both crews work at once; the ship's second grid powers the second." } });
    if (shelterFree(s)) out.push({ id: 'shelter', label: { ru: 'Принять людей в кольца корабля', en: "House people in the ship's rings" },
      known: { ru: s => [`Материалы −${SHELTER}%, семь суток: места для ${ppl(shelterPeople(s))} и свободная вторая сеть.`, 'Корабль становится постоянной частью форпоста; оставшиеся материалы — на связь, затем на капсулы, если секция цела.'],
        en: s => [`Materials −${SHELTER}%, seven days: berths for ${shelterPeople(s)} and a free second grid.`, 'The ship becomes a permanent part of the outpost; the remaining materials go to the link, then to the capsules if the section survived.'] },
      cost: st => { st.materials -= SHELTER; shelterBuild(st); },
      effect: st => { st.materials -= SHELTER; st.deliver = 'shelter'; st.shelter = true; st.supplyDays += 7; st.shelterPeople = shelterPeople(st); shelterBuild(st); },
      record: { ru: s => `${cap(ppl(s.shelterPeople))} переходят в кольца сорок первой. Форпост впервые за годы спит не по очереди.`, en: s => `${s.shelterPeople} people move into the Forty-First's rings. For the first time in years the outpost sleeps without taking turns.` } });
    if (!out.length || (s.capsLost && !out.some(o => o.id === 'shelter'))) out.push({ id: 'abort', label: { ru: 'Признать срыв снабжения', en: 'Declare the supply mission failed' },
      known: { ru: ['Без расхода.', 'Постоянное обеспечение форпоста не восстановлено; судьба оставшихся не установлена.'], en: ['No expenditure.', "Permanent support is not restored; the remaining residents' fate is unknown."] },
      effect: st => { st.deliver = 'abort'; st.supplyFailed = true; },
      record: { ru: 'Совет признаёт срыв снабжения. В отчёт ложатся израсходованные материалы, занятые сети и дни, которых не хватило.', en: 'The council declares the supply mission failed. The report lists the materials spent, the grids taken and the days that ran short.' } });
    return out;
  }
  // общая плата (снабженец v2): повторное включение через повреждённую плату — 24 местных и капсульная секция
  function busRestart(st) {
    if (!boardDamaged(st)) { st.busResolved = true; return; }
    st.capsLost = true;
    const dead = st.supplyIndependent ? 0 : STORM.busDead;                 // независимые насосы сохраняют людей, не секцию
    st.outpostDead += dead; st.deadHere += dead;
    incident(st, 'supplyBus', dead, { check: st.busMethod === 'replace' ? null : st.busMethod, found: false, year: opYear(st) }, 'outpost');
  }
  function busCheck(st, sense) {
    st.busFound = boardDamaged(st) && (hidden(st, 'supply.bus.check') ?? 1) < sense;
    if (st.busFound) { st.materials -= busSplit(st); st.supplyDays += 12; st.busResolved = true; st.supplyIndependent = false; }
    else { st.materials -= STORM.replace; st.supplyDays += 2; busRestart(st); }
  }
  const busRecord = {
    ru: s => s.busFound ? 'Проверка находит повреждение общей платы. Двенадцать суток разделяют питание и управление капсул и связи.'
      : s.capsLost ? (s.busMethod === 'replace' ? 'Контроллер меняют и включают снова.' : 'Проверка повреждения не находит; контроллер меняют и включают снова.') + ` Плата не выдерживает: капсульная секция обесточена.${s.supplyIndependent ? ' Насосы на отдельной сети держат людей.' : ` Погибли ${ppl(STORM.busDead)} форпоста.`}`
      : s.busMethod === 'split' ? 'Двенадцать суток разделяют питание и управление. Новый холодильник больше не зависит от старого узла.'
      : 'Контроллер меняют; повторное испытание проходит. Местная смена разносит каналы до окончательной приёмки.',
    en: s => s.busFound ? 'The check finds damage on the common board. Twelve days go into separating power and controls for the capsules and the relay.'
      : s.capsLost ? (s.busMethod === 'replace' ? 'The controller is replaced and restarted.' : 'The check finds no damage; the controller is replaced and restarted.') + ` The board does not hold: the capsule section loses power.${s.supplyIndependent ? ' The pumps on the separate grid keep people alive.' : ` ${STORM.busDead} of the outpost are dead.`}`
      : s.busMethod === 'split' ? 'Twelve days go into separating power and controls. The new cooler no longer depends on the old node.'
      : 'The controller is replaced; the second trial passes. The local shift reroutes the channels before final acceptance.'
  };
  // ---- протокол происшествий: наблюдение → проверка → допущение → решение → причина → имена → что можно было
  // Имена погибших — из реестра рядовых членов экипажа (персонажи с репликами не гибнут за кадром и не говорят после).
  const FIRST = [['Аран', 'Aran'], ['Вела', 'Vela'], ['Дарен', 'Daren'], ['Ева', 'Eva'], ['Ильм', 'Ilm'], ['Кира', 'Kira'], ['Лей', 'Lei'], ['Мара', 'Mara'],
    ['Олен', 'Olen'], ['Рина', 'Rina'], ['Сав', 'Sav'], ['Тала', 'Tala'], ['Ульф', 'Ulf'], ['Фира', 'Fira'], ['Хал', 'Hal'], ['Эла', 'Ela'],
    ['Юн', 'Yun'], ['Яра', 'Yara'], ['Бор', 'Bor'], ['Гела', 'Gela'], ['Дин', 'Din'], ['Лин', 'Lin'], ['Мир', 'Mir'], ['Сая', 'Saya']];
  const LAST = [['Аск', 'Ask'], ['Бранд', 'Brand'], ['Вир', 'Vir'], ['Гест', 'Gest'], ['Дорн', 'Dorn'], ['Ирт', 'Irt'], ['Калев', 'Kalev'], ['Лунд', 'Lund'],
    ['Мейр', 'Meir'], ['Норр', 'Norr'], ['Остен', 'Osten'], ['Ранд', 'Rand'], ['Сайр', 'Sayr'], ['Толь', 'Tol'], ['Урс', 'Urs'], ['Фаль', 'Fal'],
    ['Хейм', 'Heim'], ['Эрн', 'Ern'], ['Юрт', 'Yurt'], ['Ярв', 'Yarv'], ['Бек', 'Bek'], ['Вал', 'Val'], ['Грин', 'Grin'], ['Рост', 'Rost']];
  // номер места → имя: сдвиг по сиду мира и шаг 7 (взаимно прост с 576) — в экспедиции имена не повторяются, в другом мире другие
  const crewName = (s, i, lang) => { const k = lang === 'ru' ? 0 : 1, off = s && s.riskSeed ? hashU32(JSON.stringify(['crew', s.riskSeed])) % 576 : 0, c = (7 * i + off) % 576;
    return `${FIRST[c % 24][k]} ${LAST[Math.floor(c / 24)][k]}`; };
  // сюжетный экипаж 41-й (Кассель остаётся на Земле во главе Совета); у следующих экспедиций будет свой состав
  const CAST = ['dasser', 'orin', 'lorn', 'kora', 'irson', 'marr', 'dan', 'naya', 'selina', 'tamir'];
  const castNames = lang => CAST.map(id => people[id] ? people[id][lang][0] : id);
  // погибшие — разные люди, выбор задан сидом (детерминирован); без сида имён нет
  function victims(s, key, n, pop) {
    const local = pop === 'outpost', field = local ? 'outpostDeadIds' : 'deadIds', size = local ? 250 : crewOf(s);
    const out = [], dead = new Set(s[field] || []);
    for (let k = 0; out.length < n && k < n * 20; k++) {
      const h = hidden(s, `victims.${key}.${k}`); if (h == null) break;
      const i = Math.floor(h * size); if (!dead.has(i) && (local || !CAST_SEATS.includes(i))) { dead.add(i); out.push(i); }   // сюжетные герои — не случайные жертвы
    }
    s[field] = [...dead];
    return out;
  }
  // реестры имён поселений — свои, не от сида партии: новое посещение не переименует жителей
  const POP_REG = { outpost: 'colony:xylona', thaw: 'colony:thaw' };
  const POP_STEP = { thaw: 107 };                                       // 7·107 ≡ 173 (mod 576): соседние номера — разные имена и фамилии
  const popName = (s, pop, i, lang) => POP_REG[pop] ? crewName({ riskSeed: POP_REG[pop] }, (POP_STEP[pop] || 1) * i % 576, lang) : crewName(s, i, lang);
  // extra.ids — заданные погибшие (реестр Оттепели: сроки капсул, секция), extra.beat — решение, к которому относится запись
  function incident(s, kind, dead, extra, pop) {
    const ids = extra && extra.ids ? extra.ids : victims(s, kind, dead, pop);
    const beat = extra && extra.beat || (kind === 'stream' && s.choices['d.streamRoute'] ? 'd.streamRoute' : INCIDENT_BEAT[kind]);
    (s.incidents = s.incidents || []).push(Object.assign({ kind, year: s.year, dead, ids, pop: pop || 'crew', names: { ru: ids.map(i => popName(s, pop, i, 'ru')), en: ids.map(i => popName(s, pop, i, 'en')) },
      rec: (s.recs || {})[beat] || null, choice: s.choices[beat] || null }, extra || {}));
  }
  const INCIDENT_NAME = { cloud: { ru: 'край облака', en: "the cloud's edge" }, loop: { ru: 'общая магистраль', en: 'the common main' }, stream: { ru: 'поток', en: 'the stream' },
    supplyCargo: { ru: 'охлаждение в дрейфе', en: 'cooling in the drift' }, supplyExposure: { ru: 'монтаж под вспышками', en: 'installation under the flares' }, supplyBus: { ru: 'общая плата', en: 'the common board' },
    rescueLate: { ru: 'сроки капсул Оттепели', en: "Thaw's capsule lives" }, rescueSection: { ru: 'протекающая секция склада', en: "the store's leaking section" },
    rescueDock: { ru: 'крепление склада', en: "the store's mount" }, wearGroup: { ru: 'группа без охлаждения', en: 'a group without cooling' }, wearLost: { ru: 'ядро без охлаждения', en: 'the core without cooling' }, rescueWake: { ru: 'массовое пробуждение', en: 'mass waking' }, rescueWater: { ru: 'вода старой площадки', en: "the old site's water" } };
  const INCIDENT_BEAT = { cloud: 'd.cloud', loop: 'd.overload1', stream: 'd.stream', supplyCargo: 'd.supplyCooler', supplyExposure: 'd.supplyApproach2', supplyBus: 'd.supplyBus',
    rescueLate: 'd.rescue', rescueSection: 'd.rescueConnect', rescueDock: 'd.rescueConnect', rescueWake: 'd.rescue', rescueWater: 'd.home' };
  // старые записи без имён — прежний порядок реестра (номер места → имя без сдвига)
  const legacyName = (i, lang) => { const k = lang === 'ru' ? 0 : 1; return `${FIRST[i % 24][k]} ${LAST[Math.floor(i / 24) % 24][k]}`; };
  const namesLine = (inc, lang) => { const n = inc.names ? inc.names[lang] : inc.ids.map(i => legacyName(i, lang)), ru = lang === 'ru';
    return n.length <= 6 ? n.join(', ') : `${n.slice(0, 6).join(', ')} ${ru ? `и ещё ${n.length - 6}` : `and ${n.length - 6} more`}`; };
  const incYear = inc => /^rescue/.test(inc.kind) ? Math.round(inc.year) : Math.floor(inc.year);   // у склада и площадки — как в журнале
  // строки протокола для итога пути
  function incidentLines(s, lang) {
    const ru = lang === 'ru';
    return (s.incidents || []).map(inc => {
      // одна авария на площадке — две ведомости (жители и экипаж): вторая строка короткая
      if (inc.kind === 'rescueWater' && inc.pop !== 'thaw' && (s.incidents || []).some(z => z.kind === 'rescueWater' && z.pop === 'thaw' && z.year === inc.year))
        return ru ? `Год ${incYear(inc)} · Вода старой площадки — та же авария. Погибли ${ppl(inc.dead)} экипажа: ${namesLine(inc, 'ru')}.`
          : `Year ${incYear(inc)} · The old site's water — the same accident. Dead, ${inc.dead} of the crew: ${namesLine(inc, 'en')}.`;
      // рейс окончен: ядро без отвода тепла (шаг 3d)
      if (inc.kind === 'wearLost') return ru ? `Год ${incYear(inc)} · Ядро без охлаждения. Все контуры стояли дольше теплового запаса обязательного оборудования; рейс окончен. На борту было ${ppl(inc.aboard || 0)}.`
        : `Year ${incYear(inc)} · The core without cooling. Every loop was down longer than the essential equipment's thermal reserve; the voyage is over. There were ${inc.aboard || 0} people aboard.`;
      // гибель группы без охлаждения (модель износа): что отказало, что решали, чем кончилось
      if (inc.kind === 'wearGroup') {
        const polRu = inc.kept ? ' Совет прежде решил беречь запасной насос и оставить перестановку.' : '', polEn = inc.kept ? ' Earlier the council chose to keep the spare pump and the rerouting.' : '';
        return ru ? `Год ${incYear(inc)} · Группа ${inc.group} без охлаждения. Отказы контуров и холодильников не успели восстановить, а перестановкой и свободными капсулами группу не укрыть: тепловой резерв исчерпан.${polRu} Погибли ${ppl(inc.dead)}: ${namesLine(inc, 'ru')}.`
          : `Year ${incYear(inc)} · Group ${inc.group} without cooling. Loop and cooler failures were not restored in time, and neither rerouting nor free capsules could shelter the group: the thermal reserve ran out.${polEn} Dead, ${inc.dead}: ${namesLine(inc, 'en')}.`;
      }
      const recPart = inc.rec ? (inc.rec === inc.choice ? (ru ? 'по рекомендации Совета' : 'on the council\'s recommendation') : (ru ? 'вопреки рекомендации Совета' : 'against the council\'s recommendation')) : '';
      const P = {
        cloud: ru ? {
          what: 'Край облака', obs: 'край плотнее модели на шесть процентов; наибольший размер частиц не установлен',
          check: inc.check === 'measured' ? (inc.found ? 'затмение показало полосу крупной пыли' : 'затмение полосы не показало — метод пропускает одну из десяти') : 'край не проверяли',
          dec: 'идти без коррекции', assume: 'полосы крупной пыли нет', cause: 'полоса крупной пыли пробила сектор щита; за ним — жилой отсек', alt: 'обход края стоил бы около трёх процентов резерва' }
          : { what: "The cloud's edge", obs: 'the edge six percent denser than the model; the largest particle size not established',
          check: inc.check === 'measured' ? (inc.found ? 'the occultation showed a band of coarse dust' : 'the occultation showed no band — the method misses one in ten') : 'the edge was not checked',
          dec: 'go straight through', assume: 'there is no band of coarse dust', cause: 'a band of coarse dust broke through a shield sector; a living compartment was behind it', alt: 'going around the edge would have cost about three percent of the reserve' },
        loop: ru ? {
          what: 'Общая магистраль', obs: 'под нагрузкой давление проседало на семь процентов',
          check: inc.check === 'deep' ? (inc.found ? 'вскрытие магистрали нашло трещину' : 'вскрытие магистрали дефекта не нашло — оно пропускает один из десяти') : inc.check === 'ordinary' ? (inc.found ? 'проверка нашла трещину' : 'обычная проверка дефекта не нашла — она видит его лишь в половине случаев') : 'магистраль не проверяли',
          dec: 'тянуть на запасе', assume: 'общая магистраль исправна', cause: 'трещина на стыке колец раскрылась под нагрузкой', alt: 'усыпить группу Б или собрать второй контур' }
          : { what: 'The common main', obs: 'under load the pressure sagged by seven percent',
          check: inc.check === 'deep' ? (inc.found ? 'opening the main found the crack' : 'opening the main found no defect — it misses one in ten') : inc.check === 'ordinary' ? (inc.found ? 'the check found the crack' : 'the ordinary check found no defect — it sees one only half the time') : 'the main was not checked',
          dec: 'run on the reserve', assume: 'the common main is sound', cause: 'a crack at the junction of the rings opened under load', alt: 'putting group B back to sleep or building a second loop' },
        supplyCargo: ru ? {
          what: 'Охлаждение в дрейфе', obs: 'после серии пылевых ударов наружная панель теряла давление и после изоляции',
          check: inc.check ? 'опрессовка трещины не нашла — она пропускает одну из десяти' : 'коллектор не проверяли',
          dec: 'подключить холодильник напрямую', assume: 'коллектор цел', cause: 'трещина в коллекторе перенесла отказ на весь контур охлаждения', alt: 'собрать независимую секцию: −8% и двадцать суток' }
          : { what: 'Cooling in the drift', obs: 'after a series of dust impacts the external panel kept losing pressure even after isolation',
          check: inc.check ? 'the pressure test missed the crack — it misses one in ten' : 'the manifold was not checked',
          dec: 'connect the cooler directly', assume: 'the manifold is intact', cause: 'a crack in the manifold carried the failure to the whole cooling loop', alt: 'building an independent section: −8% and twenty days' },
        supplyExposure: ru ? {
          what: 'Монтаж под вспышками', obs: 'вспышка уже прошла, счётчик частиц ещё рос; управление общее с капсульной секцией',
          check: 'поток частиц не ограничен', dec: 'короткая схема, только роботы', assume: 'роботов достаточно', cause: 'частицы остановили автоматику и охлаждение занятой секции', alt: 'укрытый пост (−6%, десять суток) или отдельная сеть насосам' }
          : { what: 'Installation under the flares', obs: "the flare had passed, the particle counter was still rising; the controls were shared with the capsule section",
          check: 'the particle flux was not bounded', dec: 'the short procedure, robots only', assume: 'robots are enough', cause: 'particles stopped the automation and the cooling of an occupied section', alt: 'a sheltered station (−6%, ten days) or a separate grid for the pumps' },
        supplyBus: ru ? {
          what: 'Общая плата управления', obs: 'новый холодильник повторил ошибку снятого: тот же адрес остановки',
          check: inc.check === 'deep' ? 'проверка под нагрузкой повреждения не нашла — она пропускает одно из десяти' : inc.check === 'ordinary' ? 'обычная проверка повреждения не нашла — она видит лишь половину' : 'плату не проверяли',
          dec: 'заменить контроллер', assume: 'плата исправна', cause: 'повторное включение через повреждённую общую плату обесточило капсульную секцию', alt: 'разделить питание и управление: −12% и двенадцать суток' }
          : { what: 'The common control board', obs: "the new cooler repeated the removed unit's error: the same stop address",
          check: inc.check === 'deep' ? 'the load test found no damage — it misses one in ten' : inc.check === 'ordinary' ? 'the ordinary check found no damage — it sees only half' : 'the board was not checked',
          dec: 'replace the controller', assume: 'the board is sound', cause: 'restarting through the damaged common board cut power to the capsule section', alt: 'separating power and controls: −12% and twelve days' },
        rescueLate: ru ? {
          what: 'Сроки капсул Оттепели', obs: `капсулы склада отказывают по одной с года ${THAW_LOSS}; срок каждой известен по маяку`,
          check: 'проверка не требовалась: сроки установлены', dec: inc.op ? `${OP_NAME[inc.op].ru} — завершение в год ${f2(inc.end, 'ru')}` : 'помощь не завершена', assume: 'помощь успеет до следующего отказа',
          cause: 'исчерпан ресурс капсулы до завершения помощи', alt: 'раньше прибыть (паспорт), собрать переходники в пути или не тратить дни у склада' }
          : { what: "Thaw's capsule lives", obs: `the store's capsules have been failing one by one since year ${THAW_LOSS}; each one's life is known from the beacon`,
          check: 'no check needed: the lives were known', dec: inc.op ? `${OP_NAME[inc.op].en} — completed in year ${f2(inc.end, 'en')}` : 'assistance not completed', assume: 'assistance will finish before the next failure',
          cause: 'a capsule ran out of life before assistance was completed', alt: 'arriving earlier (the passport), building the adapters in flight, or spending fewer days at the store' },
        rescueSection: ru ? {
          what: 'Протекающая секция склада', obs: 'склад вращается; струя теплоносителя уносит тепло двенадцати капсул',
          check: inc.torn ? `крепление разрушилось при захвате: секции осталось ${dd(inc.tornLeft, 'ru')}` : inc.delay ? `торможение затянулось на ${inc.delay} суток: секции оставалось ${inc.left} суток` : `ближняя диагностика: секции оставалось ${inc.left} суток`,
          dec: SECTION_DEC[inc.choice] ? SECTION_DEC[inc.choice].ru : 'операция без отдельной помощи секции', assume: 'секция дождётся помощи',
          cause: 'секция лишилась охлаждения до стабилизации', alt: 'изоляция, испытанная в полёте (восемь суток), ранняя коррекция торможения или осмотр крепления' }
          : { what: "The store's leaking section", obs: 'the store is rotating; a coolant jet carries away the heat of twelve capsules',
          check: inc.torn ? `the mount failed during grappling: the section had ${dd(inc.tornLeft, 'en')} left` : inc.delay ? `braking ran ${inc.delay} days long: the section had ${inc.left} days left` : `close diagnostics: the section had ${inc.left} days left`,
          dec: SECTION_DEC[inc.choice] ? SECTION_DEC[inc.choice].en : 'the operation with no separate help for the section', assume: 'the section will last until help comes',
          cause: 'the section lost cooling before stabilisation', alt: 'isolation tested in flight (eight days), an early braking correction or a mount inspection' },
        rescueDock: ru ? {
          what: 'Крепление склада', obs: 'склад вращается; струя теплоносителя нагружает старые крепления',
          check: inc.check === 'inspect' ? 'осмотр надлома не нашёл — он пропускает один из десяти' : 'крепление не осматривали',
          dec: 'подключить повреждённую линию напрямую', assume: 'отказ не перейдёт в корабельный контур',
          cause: 'захват надломленного крепления сорвал трубопровод; прямое соединение перенесло отказ в охлаждение корабля', alt: 'изолированное подключение или отсечение секции' }
          : { what: "The store's mount", obs: 'the store is rotating; the coolant jet loads the old mounts',
          check: inc.check === 'inspect' ? 'the inspection missed the fracture — it misses one in ten' : 'the mount was not inspected',
          dec: 'connect the damaged line directly', assume: "the failure will not reach the ship's loop",
          cause: "grappling a fractured mount tore the pipe away; the direct connection carried the failure into the ship's cooling", alt: 'an isolated connection or cutting off the section' },
        rescueWake: ru ? {
          what: 'Массовое пробуждение', obs: 'медицинская смена рассчитана на постепенное пробуждение',
          check: 'медицинский расчёт: каждый десятый может не пережить экстренного пробуждения', dec: 'будить всех сразу', assume: 'медики справятся с потоком',
          cause: 'экстренное массовое пробуждение превысило возможности медицинской смены', alt: 'стабилизировать капсулы переносом или восстановлением склада' }
          : { what: 'Mass waking', obs: 'the medical shift is sized for gradual waking',
          check: 'the medical estimate: one in ten may not survive emergency waking', dec: 'wake everyone at once', assume: 'the medics will cope with the flow',
          cause: "mass emergency waking exceeded the medical shift's capacity", alt: 'stabilising the capsules by moving them or restoring the store' },
        rescueWater: ru ? {
          what: 'Вода старой площадки', obs: 'над старой площадкой — вулканический шлейф; Оттепель погибла от той же последовательности',
          check: inc.check === 'check' ? 'короткое испытание примеси не нашло — оно видит её лишь в половине случаев' : inc.check === 'deep' ? 'длительное испытание примеси не нашло — оно пропускает одну из двадцати' : 'воду не испытывали',
          dec: 'заселить старую площадку со старой очисткой', assume: 'очистка справится с водой после выброса',
          cause: 'примесь после выброса вывела из строя теплообменники энергетики; температурная авария', alt: 'замкнутый водяной цикл или орбитальный дом' }
          : { what: "The old site's water", obs: 'a volcanic plume over the old site; Thaw died of the same sequence',
          check: inc.check === 'check' ? 'the short test found no impurity — it sees one only half the time' : inc.check === 'deep' ? 'the extended test found no impurity — it misses one in twenty' : 'the water was not tested',
          dec: 'occupy the old site with the old treatment', assume: 'treatment will cope with the post-eruption water',
          cause: "post-eruption contamination disabled the power system's heat exchangers; a thermal accident", alt: 'a closed water loop or an orbital home' },
        stream: ru ? {
          what: 'Поток у Тёмной звезды', obs: 'счётчики ударов росли; модель давала 91% за безопасный проход',
          check: inc.check ? (inc.found ? 'измерение показало полосу на курсе' : 'измерение полосы не показало') : 'поток не измеряли',
          dec: inc.route === 'evade' ? 'уходить — слишком поздно' : 'пройти по краю', assume: inc.route === 'evade' ? 'манёвр сократит время в ядре потока' : 'опасная полоса не пересекает курс', cause: 'полоса крупных частиц на курсе', alt: 'уйти сразу, не дожидаясь измерений' }
          : { what: 'The stream at the Dark Star', obs: 'the impact counters were rising; the model gave 91% for a safe passage',
          check: inc.check ? (inc.found ? 'the measurement showed the band on course' : 'the measurement showed no band') : 'the stream was not measured',
          dec: inc.route === 'evade' ? 'leave — too late' : 'pass along the edge', assume: inc.route === 'evade' ? "the manoeuvre would shorten the time in the stream's core" : 'the dangerous band does not cross the course', cause: 'a band of coarse particles on the course', alt: 'leaving at once, without waiting for measurements' }
      }[inc.kind];
      return ru
        ? `Год ${incYear(inc)} · ${P.what}. Наблюдение: ${P.obs}. Проверка: ${P.check}. Решение: ${P.dec}${recPart ? ` (${recPart}; допущение — ${P.assume})` : ''}. Причина: ${P.cause}${inc.lost ? '; ранее пробитый сектор щита и нехватка мощности для быстрого ухода' : ''}. ${inc.lost ? `Корабль погиб: на борту было ${ppl(inc.aboard)}, среди них ${castNames('ru').join(', ')}.` : inc.dead ? `Погибли ${ppl(inc.dead)}${inc.pop === 'thaw' ? ' Оттепели' : /^rescue/.test(inc.kind) ? ' экипажа' : ''}: ${namesLine(inc, 'ru')}.` : 'Погибших нет: насосы на отдельной сети удержали людей; капсульная секция потеряна.'} Можно было: ${P.alt}.`
        : `Year ${incYear(inc)} · ${P.what}. Observed: ${P.obs}. Check: ${P.check}. Decision: ${P.dec}${recPart ? ` (${recPart}; assumption: ${P.assume})` : ''}. Cause: ${P.cause}${inc.lost ? '; a shield sector breached earlier and too little power for a quick escape' : ''}. ${inc.lost ? `The ship was lost: ${inc.aboard} were aboard, among them ${castNames('en').join(', ')}.` : inc.dead ? `Dead, ${inc.dead}${inc.pop === 'thaw' ? ' of Thaw' : /^rescue/.test(inc.kind) ? ' of the crew' : ''}: ${namesLine(inc, 'en')}.` : 'No one died: the pumps on the separate grid kept people alive; the capsule section was lost.'} Could have: ${P.alt}.`;
    });
  }
  // приветствие Оттепели (версия 3): говорит первый живой по реестру; после переноса и восстановления будят двоих представителей
  function greetR(s, L, lang) {
    const ru = lang === 'ru', first = thawAlive(s, Infinity)[0], who = thawName(first, lang), d = s.thawDead;
    return ru ? `${s.rescueOp === 'wake' ? '' : 'Через месяц после стабилизации будят двоих представителей Оттепели.\n\n'}${who} проводит пальцами по шву одеяла.

— Вы со склада?

— С сорок первой. Я Селина Вей. Мы пришли к Оттепели.

Селина показывает дату и ждёт.

— А остальные?

— Сейчас живы ${s.rescued}. Вот сорок имён: шестеро умерли до нашего рейса${d ? `, ${d} — пока шла помощь` : '; пока шла помощь, не умер никто'}. Я останусь, пока вы читаете.

${L > 0 ? `— Вы тоже потеряли людей?\n\n— Да. В пути умерли ${ppl(L)}.` : '— Долго вы летели?\n\nСелина придвигает экран с календарём рейса.'}

Между вопросом и ответом больше нет лет ожидания.`
      : `${s.rescueOp === 'wake' ? '' : "A month after stabilisation, two of Thaw's representatives are woken.\n\n"}${who} runs a hand along the blanket's seam.

"Are you from the store?"

"From the Forty-First. I'm Selina Vei. We came to Thaw."

Selina shows the date and waits.

"And the others?"

"${s.rescued} are alive now. Here are forty names: six died before our voyage${d ? `, ${d} while help was coming` : '; no one died while help was coming'}. I'll stay while you read."

${L > 0 ? `"Did you lose people too?"\n\n"Yes. ${L} died on the way."` : '"How long were you travelling?"\n\nSelina brings the voyage calendar closer.'}

There are no longer years of waiting between question and answer.`;
  }
  // приветствия у людей: сколько умерли в пути (фон и аварии) и чем встреча кончается у каждой колонии
  const roadDead = s => lossesOf(s, s.arrive).total + s.dead;
  const GREET_LAST = {
    shore: { ru: '— В вашем отчёте мы зависим от земных точных деталей. Давайте сверим, что теперь можете делать вы и что можем мы.', en: '"Your report says we depend on precision parts from Earth. Let\'s compare what you can make now with what we can."' },
    garden: { ru: '— Вы привезли врачей? Сначала познакомим ваши медицинские смены с нашими.', en: '"Did you bring physicians? First we\'ll introduce your medical teams to ours."' },
    pass: { ru: '— В старом отчёте у нас один ремонтный аппарат. Покажем вам нынешнюю ведомость рейсов.', en: '"The old report lists one repair vessel. We\'ll show you the current voyage schedule."' },
    yard: { ru: '— Прежде чем обещать док, сверим очередь работ и ваш инженерный журнал.', en: '"Before promising a dock, let\'s compare the work queue with your engineering log."' },
    default: { ru: '— Наш старый отчёт у вас есть. Начнём с того, что за годы вашего пути изменилось у нас.', en: '"You have our old report. Let\'s start with what has changed here during your voyage."' }
  };
  // погибшие в авариях пути — по причинам (облако, контур, поток)
  function deadCauses(s, lang) {
    const ru = lang === 'ru', c = [];
    if (s.cloudDead) c.push(ru ? `${s.cloudDead} — у края облака` : `${s.cloudDead} at the cloud's edge`);
    if (s.loopDead) c.push(ru ? `${s.loopDead} — при отказе контура воды` : `${s.loopDead} when the water loop failed`);
    const st = s.streamDead || 0;
    if (st) c.push(ru ? `${st} — в потоке у Тёмной звезды` : `${st} in the stream at the Dark Star`);
    return c.join(ru ? '; ' : '; ');
  }
  const gridAlive = s => { const c = M.colonyAt(s.target); return !!(c && c.awake > 0); };
  // энергия у цели из оснащения: второй блок переживает удар потока, одиночный реактор — нет; сеть — только у живой колонии
  const powerOK = s => { const e = eqOf(s).energy; return e === 'dual' || (e === 'reactor5' && s.streamHit < 2) || (e === 'grid' && gridAlive(s)); };
  const BLUEPRINT = { tools: 20, printQC: 10 };                          // материалов на капельный радиатор
  // профиль торможения от массы: при повороте масса та же, скорость другая
  const tm = (s, beta) => s.brakeMass == null ? null : M.magYears(s.brakeMass, beta);
  const tripOf = (s, d, beta) => M.trip(d, beta, tm(s, beta));
  // ---- прибор паспорта: что изменит выбор — полосы и вероятности (game.js: панель поверх 3D)
  // d — черновик паспорта { b, r, kits, eq }. Числа — та же модель, что у партии: профиль торможения от массы,
  // ожидаемые потери в пути (calc_life.py), известные затраты резерва (DV). Вероятности — на одного человека за путь.
  // общий расчёт паспорта: точные срок и бодрствование, потери по модели, вместимость (прибор и карточки оснащения)
  function passportNumbers(s, d) {
    const used = M.kitMass(d.kits) + M.eqMass(d.eq), cap = M.capacity(d.b, d.r), bm = M.brakeMass(d.b, d.r, used), tm = M.magYears(bm, d.b);
    const crew = M.crewOf(d.kits), T = M.trip(M.star(s.target).d, d.b, tm);
    return { used, cap, fits: cap >= 0 && used <= cap + 1e-9, bm, tm, T, crew, aw: M.awake(T, 48, crew), L: M.losses(T, 48, d.eq.caps === 'capsSafe', crew) };
  }
  function passportMetrics(s, d, lang) {
    const ru = lang === 'ru', safe = d.eq.caps === 'capsSafe';
    const { used, cap, bm, tm, crew, T, aw, L } = passportNumbers(s, d), drift = T - M.ACC - tm - M.ENGINE;
    const kms = d.r * 299792.458, wakings = 4 * T / 133, pWake = 1 - Math.pow(1 - (safe ? 0.002 : 0.004), wakings);
    const pCaps = 1 - Math.exp(-(safe ? 1e-4 : 2e-4) * (T - aw)), pCancer = 0.02 * 0.112 * aw;   // капсула — время во сне; рак — доза за годы вахты
    const n0 = x => Math.round(x), pc = x => `${f1(x * 100, lang)}%`, TMAX = 280;
    const rows = [
      { k: 'trip', type: 'segs', n: n0(T), label: ru ? `Путь — ${yrs(T)}` : `Road — ${yrsEn(T)}`,
        segs: [{ w: M.ACC / TMAX, c: 'acc' }, { w: drift / TMAX, c: 'drift' }, { w: tm / TMAX, c: 'mag' }, { w: M.ENGINE / TMAX, c: 'eng' }],
        note: ru ? `разгон 8 · дрейф ${n0(drift)} · магнит ${n0(tm)} · двигатель 4` : `acceleration 8 · drift ${n0(drift)} · magnet ${n0(tm)} · engine 4` },
      { k: 'awake', type: 'bar', n: n0(aw), label: ru ? `Бодрствование на человека — ${yrsG(aw)}` : `Waking years per person — ${n0(aw)}`,
        fill: aw / 30, c: aw > 25 ? 'bad' : aw > 20 ? 'warn' : 'ok',
        ticks: [{ at: 20 / 30, t: ru ? 'тонкая вахта' : 'thin watch' }, { at: 25 / 30, t: ru ? 'предел Совета' : 'Council limit' }] },
      { k: 'cargo', type: 'bar', n: Math.round(used * 10) / 10, label: ru ? `Груз — ${f1(used, 'ru')} из ${f1(Math.max(0, cap), 'ru')} тыс. т` : `Cargo — ${f1(used, 'en')} of ${f1(Math.max(0, cap), 'en')} kt`,
        fill: cap > 0 ? used / cap : 1, c: cap < 0 || used > cap + 1e-9 ? 'bad' : 'ok' },
      { k: 'brake', type: 'bar', n: n0(bm), label: ru ? `Масса к торможению — ${n0(bm)} тыс. т` : `Mass at braking — ${n0(bm)} kt`,
        fill: bm / 120, c: bm > 59 ? 'warn' : 'ok', ticks: [{ at: 59 / 120, t: ru ? 'расчёт магнита 59' : 'magnet design 59' }] },
      { k: 'reserve', type: 'bar', n: n0(kms), label: ru ? `Резерв манёвров — ${n0(kms)} км/с` : `Manoeuvre reserve — ${n0(kms)} km/s`,
        fill: kms / 3000, c: 'ok', ticks: [{ at: DV.probe / 3000, t: '' }, { at: DV.stream / 3000, t: '' }, { at: DV.streamWeak / 3000, t: '' }],
        note: ru ? `отметки — известные затраты: зонд ${DV.probe}, уход от потока ${DV.stream}, слабые коррекции ${DV.streamWeak} км/с` : `marks are known costs: probe ${DV.probe}, stream escape ${DV.stream}, weak corrections ${DV.streamWeak} km/s` },
      { k: 'loss', type: 'stack', n: L.total, label: ru ? `Ожидаемые потери в пути — ${ppl(L.total)} из ${crew} (${pc(L.total / crew)})` : `Expected losses on the road — ${L.total} of ${crew} (${pc(L.total / crew)})`,
        segs: [{ w: L.capsule / 40, c: 'caps', t: ru ? 'капсулы' : 'capsules' }, { w: L.revival / 40, c: 'wake', t: ru ? 'пробуждения' : 'wakings' }, { w: L.accident / 40, c: 'acc', t: ru ? 'аварии' : 'accidents' }, { w: L.cancer / 40, c: 'cancer', t: ru ? 'рак' : 'cancer' }],
        note: ru ? `капсулы ${L.capsule} · пробуждения ${L.revival} · аварии ${L.accident} · рак ${L.cancer}; ещё ≈${L.later} отложенных случаев рака — после прибытия. Оценка модели при вахте 48: ожидаемое, не гарантированное.` : `capsules ${L.capsule} · wakings ${L.revival} · accidents ${L.accident} · cancer ${L.cancer}; ≈${L.later} more delayed cancer cases after arrival. A model estimate with a watch of 48: expected, not guaranteed.` },
      { k: 'probs', type: 'probs', n: null, label: ru ? 'Вероятности на одного человека · шкала 0–8%' : 'Per-person probabilities · scale 0–8%',
        items: [{ t: ru ? 'отказ капсулы за годы сна' : 'capsule failure over the years asleep', v: pc(pCaps), p: pCaps, f: pCaps / 0.08 },
          { t: ru ? `гибель при пробуждениях (≈${n0(wakings)})` : `death on wakings (≈${n0(wakings)})`, v: pc(pWake), p: pWake, f: pWake / 0.08 },
          { t: ru ? 'рак от доз за годы вахты' : 'cancer from the watch-years dose', v: pc(pCancer), p: pCancer, f: pCancer / 0.08 }],
        note: ru ? 'риски по причинам не складываются: это разные события у одного человека' : 'the risks by cause do not add up: they are different events for one person' }
    ];
    if (s.mission === 'rescue') { const n = thawN(T), m = Math.round((THAW_LOSS - T) * 12);
      rows.push({ k: 'mission', type: 'bar', n: Math.round(T * 100) / 100, label: ru ? `Прибытие — год ${f2(T, 'ru')}; первая потеря на складе — год ${THAW_LOSS}` : `Arrival — year ${f2(T, 'en')}; the first loss at the store — year ${THAW_LOSS}`,
        fill: T / 160, c: n < THAW0 ? 'bad' : m < 3 ? 'warn' : 'ok', ticks: [{ at: THAW_LOSS / 160, t: ru ? 'первая потеря' : 'first loss' }],
        note: (n < THAW0 ? (ru ? `к прибытию живы ${n} из ${THAW0}` : `${n} of ${THAW0} alive at arrival`) : (ru ? `запас до первой потери — ${m} мес.; операция у склада — 1–6 мес.` : `margin to the first loss: ${m} months; the operation at the store takes 1–6 months`))
          + (d.kits.includes('berths') ? (ru ? ` · спасательный сектор: своих ${crew}, 40 мест для Оттепели` : ` · rescue sector: ${crew} of our own, 40 berths for Thaw`) : (ru ? ' · мест для спасённых нет: места погибших в пути — резерв экспедиции' : ' · no berths for the rescued: the places of those who die on the road are the expedition\'s reserve')) }); }
    if (s.mission === 'supply') rows.push({ k: 'mission', type: 'bar', n: n0(T), label: ru ? `Форпост без связи к прибытию — ${yrs(T - xyl().relayYears)}` : `Outpost without the link by arrival — ${yrsEn(T - xyl().relayYears)}`,
      fill: (T - xyl().relayYears) / 120, c: 'warn',
      note: d.kits.includes('request') ? (ru ? 'груз заявки на борту: передатчик и капсульный блок для форпоста' : 'request cargo aboard: a transmitter and a capsule unit for the outpost')
        : (ru ? `груза заявки нет: обе системы — из своих материалов, −${BUILD.relay + BUILD.caps}% у цели` : `no request cargo: both systems from our own materials, −${BUILD.relay + BUILD.caps}% at the target`) });
    return rows;
  }

  // ---- приборы: чего сколько осталось (HUD) и что останется после варианта решения (game.js).
  // Живые — по модели потерь на текущий год плюс гибель в авариях; зонды — готовые аппараты в трюме.
  const aliveOf = s => s.lostShip ? 0 : crewOf(s) - (lossesOf(s, Math.max(0, Math.min(s.year, s.arrive))).total + s.dead + s.deadHere - (s.outpostDead || 0));
  const probesOf = s => { const p = eqOf(s).probes, n = p === 'scout2' ? 2 : p === 'inspect' ? 1 : 0;
    return Math.max(0, n - (p === 'scout2' && s.choices['d.scout'] === 'launch' ? 1 : 0) - (n && s.choices['d.stream'] === 'probe' ? 1 : 0)); };
  const kms0 = s => Math.round(s.reserve / 100 * s.reserveDv * 299792.458);
  // ids — записи партии (интерфейс): «на вахте» — кто на ногах сейчас, как в отчёте вахты и на карте спящих
  function gauges(s, lang, ids) {
    if (!s || !s.eq || s.relief) return [];
    const ru = lang === 'ru', out = [];
    const g = (id, label, value, n) => out.push({ id, label, value, n });
    g('materials', ru ? 'материалы' : 'materials', `${pctM(s.materials, lang)}%`, s.materials);
    g('reserve', ru ? 'резерв манёвров' : 'manoeuvre reserve', `${pct(s.reserve, lang)}% · ${kms0(s)} ${ru ? 'км/с' : 'km/s'}`, s.reserve);
    g('alive', ru ? 'живы' : 'alive', `${aliveOf(s)}`, aliveOf(s));
    const aw = ids ? awakeOf(s, ids) : s.watch;
    g('watch', ru ? 'на вахте' : 'on watch', `${aw}`, aw);
    g('loop', ru ? 'контур' : 'cooling loop', s.highPower ? (ru ? 'полный' : 'full') : (ru ? 'без резерва мощности' : 'no high-power reserve'));
    if (s.shield) g('shield', ru ? 'щит' : 'shield', shieldGaugeV5(s, lang), SH.observe(s.shield).min); else
    g('shield', ru ? 'щит' : 'shield', breached(s) ? (ru ? 'сектор пробит' : 'sector breached') : (ru ? 'цел' : 'whole'));
    g('probes', ru ? 'зонды' : 'probes', `${probesOf(s)}`, probesOf(s));
    g('power', ru ? 'энергия у цели' : 'power at target', s.support === 'found' ? (ru ? 'топливо поддержки' : 'support fuel') : powerOK(s) ? M.eqOpt('energy', eqOf(s).energy)[lang].toLowerCase() : (ru ? 'только корабль' : 'the ship only'));
    if (s.support) g('support', ru ? 'поддержка' : 'support', s.support === 'found' ? (ru ? 'найдена' : 'found') : (ru ? 'потеряна' : 'lost'));
    if (s.mission === 'supply' && !s.deliver) g('request', ru ? 'груз заявки' : 'request cargo', !capsKit(s) ? (ru ? 'нет' : 'none') : relayKit(s) ? (ru ? 'передатчик и капсулы' : 'transmitter and capsules') : (ru ? 'только капсулы' : 'capsules only'));
    if (s.mission === 'supply' && (s.deliver || s.outpostDead)) g('outpost', ru ? 'форпост' : 'outpost', (s.deliver ? [s.relayOK ? (ru ? 'связь есть' : 'link up') : (ru ? 'без связи' : 'no link'), s.capsOK ? (ru ? 'капсулы есть' : 'capsules up') : (ru ? 'без капсул' : 'no capsules')] : [])
      .concat(s.shelter ? [ru ? 'люди на корабле' : 'people aboard'] : []).concat(s.outpostDead ? [ru ? `погибли ${s.outpostDead}` : `${s.outpostDead} dead`] : []).join(', '));
    if (s.mission === 'supply' && s.gridBlocks < 2) g('grid', ru ? 'сеть корабля' : 'ship grid', ru ? 'один блок из двух' : 'one block of two');
    g('arrive', ru ? 'прибытие' : 'arrival', `${ru ? 'год' : 'year'} ${s.arrive}`, s.arrive);
    return out;
  }
  // ---- состояние корабля — полоса и строка (приборы; автор, 08.10: «общее здоровье корабля — а не простыню надписей»,
  // «полосу здоровья сделай»). Не «очки здоровья»: каждый настоящий показатель модели переводится в запас 0…1 с общими
  // порогами (≥ 0,6 — в норме; 0,35–0,6 — без резерва: следующий отказ так легко не закрыть; 0,15–0,35 — дефицит: кто-то
  // или что-то уже без обеспечения; < 0,15 — критично: рейс под угрозой). Полоса — запас самого слабого места, причина — оно
  const HZ = [0.15, 0.35, 0.6];
  // кусочно-линейно: x ≤ t[0] → 0…0,15, t[0]…t[1] → 0,15…0,35, t[1]…t[2] → 0,35…0,6, t[2]…t[3] → 0,6…1
  const zoneOf = (x, t) => { const y = [0, ...HZ, 1], k = [0, ...t];
    for (let i = 1; i < k.length; i++) if (x <= k[i]) return y[i - 1] + (y[i] - y[i - 1]) * Math.max(0, (x - k[i - 1]) / (k[i] - k[i - 1] || 1));
    return 1; };
  const levelOf = m => m < HZ[0] ? 3 : m < HZ[1] ? 2 : m < HZ[2] ? 1 : 0;
  function shipHealth(s, lang) {
    if (!s || !s.eq || s.relief) return null;
    const ru = lang === 'ru', items = [], add = (m, ru1, en1) => items.push({ m: Math.max(0, Math.min(1, m)), text: ru ? ru1 : en1 });
    if (s.terminalAt != null) add(0, 'рейс окончен', 'the voyage is over');
    else if (s.lostShip) add(0, 'корабль потерян', 'the ship is lost');
    const w = s.wear;
    if (w && wearOn(s)) {
      const o = W.observe(w, Math.max(w.t, s.year)), warm = o.groups.filter(g => g.sleep && g.heat), n = W.LOOPS.length;
      if (!o.core.cooled) add(0.15 * o.core.heatH / o.core.cap, `ядро без охлаждения: запас ${nf(o.core.heatH, 0, 'ru')} ч`, `the core uncooled: ${nf(o.core.heatH, 0, 'en')} h left`);
      else if (o.independent < n) add([0.15, 0.2, 0.3, 0.5][o.independent], `охлаждение: ${o.independent} ${plural(o.independent, ['контур', 'контура', 'контуров'])} из ${n}`, `cooling: ${o.independent} of ${n} loops`);
      if (warm.length) add(0.3, `на тепловом резерве: ${warm.map(g => g.id).join(', ')}`, `on thermal reserve: ${warm.map(g => g.id).join(', ')}`);
      if (w.inv.pump === 0 && !pumpProspect(s)) add(0.5, 'запасных насосов нет', 'no spare pumps');
      if (w.shop && w.shop.lost) add(0.55, 'станков больше нет', 'no machine tools left');
      for (const r of (o.danger || []).filter(x => x.fam === 'bearing')) { const H = r.id.split('.')[0], rep = pendingFor(w, r.id);   // опора кольца
        if (r.ok && r.defect) add(0.5 - 0.35 * r.used / r.tol, `опора кольца ${H}: износ дорожки, израсходовано ${Math.round(100 * r.used / r.tol)}% допуска`, `ring ${H}'s bearing: track wear, ${Math.round(100 * r.used / r.tol)}% of margin used`);
        else if (!r.ok) add(rep ? 0.6 : r.defect === 'heavy' ? 0.3 : 0.4, rep ? `кольцо ${H} остановлено на ремонт опоры` : `кольцо ${H} ${r.defect === 'heavy' ? 'заклинило навсегда' : 'остановлено'}: в невесомости ${ppl(o.zeroG.n)}`,
          rep ? `ring ${H} stopped for a bearing repair` : `ring ${H} ${r.defect === 'heavy' ? 'seized for good' : 'stopped'}: ${o.zeroG.n} people in zero-g`); }
      for (const r of o.rads || []) { if (!r.defect) continue; const rep = pendingFor(w, r.id);   // опасный узел: секция радиатора
        if (r.ok) add(0.5 - 0.35 * r.used / r.tol, `течь секции радиатора ${r.id}: израсходовано ${Math.round(100 * r.used / r.tol)}% допуска`, `radiator section ${r.id} leaking: ${Math.round(100 * r.used / r.tol)}% of margin used`);
        else add(rep ? 0.6 : r.defect === 'heavy' ? 0.35 : 0.45, rep ? `секция радиатора ${r.id} в ремонте` : `секция радиатора ${r.id} ${r.defect === 'heavy' ? 'разрушена навсегда' : 'изолирована'}`,
          rep ? `radiator section ${r.id} under repair` : `radiator section ${r.id} ${r.defect === 'heavy' ? 'ruptured for good' : 'isolated'}`); }
      if (o.reg) { const b = o.reg.B / W.REG.D0;                         // отставание в годовых объёмах регламента
        if (b > 0.05) add(b < 0.25 ? 0.6 + 0.4 * (0.25 - b) / 0.2 : b < 0.5 ? 0.35 + 0.25 * (0.5 - b) / 0.25 : b < 1.5 ? 0.15 + 0.2 * (1.5 - b) : Math.max(0, 0.15 * (3 - b) / 1.5),
          `регламент: отставание ${nf(o.reg.B, 0, 'ru')} чел.-сут, старение ×${nf(o.reg.m, 2, 'ru')}`, `maintenance: ${nf(o.reg.B, 0, 'en')} person-days behind, ageing ×${nf(o.reg.m, 2, 'en')}`); }
    }
    if (s.shield) { const so = SH.observe(s.shield), open = s.shield.hits.some(x => x.state !== 'replaced' && x.residual <= 0);
      // пробоина — нулевой остаток (хуже любого тонкого места), не маскирует остальные панели
      add(zoneOf(open ? 0 : so.min, [0.5 * SH.RULES.service, SH.RULES.service, 2 * SH.RULES.service, 5 * SH.RULES.service]),
        open ? 'щит пробит' : `щит: минимум ${nf(so.min, 1, 'ru')} кг/м²`, open ? 'the shield is breached' : `shield: minimum ${nf(so.min, 1, 'en')} kg/m²`); }
    add(zoneOf(s.materials, [2, 5, 15, 40]), `материалы ${pctM(s.materials, lang)}%`, `materials ${pctM(s.materials, lang)}%`);
    add(zoneOf(s.reserve, [3, 10, 40, 80]), `резерв манёвров ${pct(s.reserve, lang)}%`, `manoeuvre reserve ${pct(s.reserve, lang)}%`);   // < 40% — у цели нет запасного участка (карточка высадки)
    const value = items.reduce((a, x) => Math.min(a, x.m), 1), level = levelOf(value), worst = items.filter(x => levelOf(x.m) === level);
    const LV = ru ? ['в норме', 'без резерва', 'дефицит', 'критично'] : ['nominal', 'no margin', 'shortfall', 'critical'];
    return { value, level, label: LV[level], reason: level ? worst.map(x => x.text).join('; ') : '', items };
  }
  // ---- модель времени (DOC «Симулятор v1 — время и щит», шаг 3): перемотка продвигает модель корабля.
  // Фронтальный щит: фоновая эрозия по скорости корабля, удары облака и потока, прибор и приборный журнал.
  const SIM_TITLE = { ru: 'Приборный журнал · щит', en: 'Instrument log · shield' };
  const SIM_NOTE = 0.05;                                                // кг/м²: шаг сводки износа в журнале
  // среда на пути: множитель фоновой плотности пыли на год y (край облака — только при проходе через край)
  const cloudThrough = s => M.episode(s) === 'cloud' && s.choices['d.cloud'] === 'trust';
  function cloudSpan(s) {
    const a = edgeIn(s), b = edgeOut(s);
    return { a, b, band: [a + (b - a) / 3, a + 2 * (b - a) / 3] };
  }
  const streamOn = src;                                                // предвестник — с точки предупреждения; ядро — по решению о маршруте
  function rhoAt(s, y) {
    const fk = EV.rhoK(s, y); if (fk) return fk;                         // пылевое волокно (события v1)
    if (streamOn(s)) {
      const P = streamPlan(s);
      if (P.coreEnd != null && y >= P.core && y <= P.coreEnd) return STREAM_RHO.core / SH.RULES.rhoDust;
      if (y >= P.warn && y <= P.preEnd) return STREAM_RHO.pre / SH.RULES.rhoDust;
    }
    if (!cloudThrough(s)) return 1;
    const c = cloudSpan(s);
    if (y < c.a || y > c.b) return 1;
    return cloudBand(s) && y >= c.band[0] && y <= c.band[1] ? CLOUD_RHO.band : CLOUD_RHO.edge;
  }
  // имя среды для сводки журнала
  function envOf(s, y) {
    if (EV.rhoK(s, y)) return 'filament';
    if (streamOn(s)) { const P = streamPlan(s);
      if (P.coreEnd != null && y >= P.core && y <= P.coreEnd) return 'core';
      if (y >= P.warn && y <= P.preEnd) return 'pre'; }
    if (cloudThrough(s)) { const c = cloudSpan(s); if (y >= c.a && y <= c.b) return 'cloud'; }
    return 'ism';
  }
  // удар зерна ядра: панель — по площади, радиус и момент — по сиду (только повреждение; последствия — на выходе из ядра)
  function streamGrain(s, t) {
    const beta = M.speedAt(t, s.beta, s.arrive, s.tMag);
    const panel = SH.panelAt(hidden(s, 'shield.stream.hit.0.position') ?? 0.5);
    const a = 1.9e-3 + 0.2e-3 * (hidden(s, 'shield.stream.hit.0.radius') ?? 0.5);
    const h = SH.hit(s.shield, { id: 'stream.hit.0', panel, radius: a, beta, at: t, energy: SH.grainEnergy(a, beta) });
    s.streamImpact = { panel, breached: h.breached, removed: h.removed, residual: h.residual, energy: h.energy, radius: a, beta, at: t };
  }
  // последствия на выходе из ядра: тяжесть — по реальным уязвимостям, а не по формуле прежних правил:
  // +1, если пыль ядра прожгла другое слабое место щита; +1, если после удара корабль оставался в ядре больше суток
  function streamOutcome(s, P) {
    const sh = s.shield, burnt = sh.hits.some(x => x.id !== 'stream.hit.0' && x.state !== 'replaced' && x.residual <= 0);
    const long = (P.coreEnd - P.g) * 365.25 > 1, lv = 1 + (burnt ? 1 : 0) + (long ? 1 : 0);
    s.streamHit = lv; s.streamCause = burnt ? 'shield' : 'power'; Object.assign(s.streamImpact, { level: lv, burnt, out: P.coreEnd, done: P.done });
    if (lv >= 3) { incident(s, 'stream', 0, { check: s.streamCheck, found: s.streamFound, route: s.streamRoute, lost: true, aboard: aliveOf(s), year: P.coreEnd }); s.lostShip = true; return null; }
    s.dead += STREAM.dead[lv]; s.materials -= STREAM_MAT5[lv]; s.streamDead = STREAM.dead[lv]; s.shieldBreach = true; s.shieldFixed = false;
    incident(s, 'stream', STREAM.dead[lv], { check: s.streamCheck, found: s.streamFound, route: s.streamRoute, year: P.coreEnd });
    const h = SH.hitOf(sh, 'stream.hit.0');
    return h.residual < SH.RULES.service ? { id: 'stream.hit.0', kind: 'shieldService', panel: h.panel, cause: 'stream' } : null;
  }
  // эрозия отрезка [y0, y1] при постоянном множителе среды и сводка журнала — не на каждую перемотку (тиков в
  // журнале нет): когда с прошлой снято SIM_NOTE кг/м², и у цели
  function erodeSpan(s, y0, y1, k) {
    const r = SH.erode(s.shield, y0, y1, y => M.speedAt(y, s.beta, s.arrive, s.tMag), SH.RULES.rhoDust * k);
    if (y1 > y0) s.shield.flux = { at: y1, w: r.energy / ((y1 - y0) * SH.YEAR_S) };   // последний измеренный поток, Вт/м² (для прогноза осмотра)
    const acc = s.shield.acc || (s.shield.acc = { y0, dSigma: 0, energy: 0, env: [] });
    acc.dSigma += r.dSigma; acc.energy += r.energy;
    const env = envOf(s, (y0 + y1) / 2); if (!(acc.env || (acc.env = [])).includes(env)) acc.env.push(env);
    if (acc.dSigma >= SIM_NOTE || (y1 >= s.arrive && acc.dSigma > 0)) {
      const o = SH.observe(s.shield);                                  // наблюдение — на момент сводки, не на момент выдачи в журнал
      SH.note(s.shield, { kind: 'summary', y0: acc.y0, y1, dSigma: acc.dSigma, flux: acc.energy / ((y1 - acc.y0) * SH.YEAR_S), env: acc.env,
        obs: { min: o.min, at: o.at, hurt: o.damaged.length > 0, bulk: Math.min(...s.shield.sigma) } });
      s.shield.acc = { y0: y1, dSigma: 0, energy: 0, env: [] };
    }
  }
  // удар крупного зерна полосы: панель — по площади, радиус и момент — по сиду; пробой — люди за сектором
  function cloudHit(s, t) {
    const sh = s.shield, beta = M.speedAt(t, s.beta, s.arrive, s.tMag);
    const panel = SH.panelAt(hidden(s, 'shield.cloud.hit.0.position') ?? 0.5);
    const a = (0.5 + 0.015 * (hidden(s, 'shield.cloud.hit.0.radius') ?? 0.5)) * 1e-3;
    const h = SH.hit(sh, { id: 'cloud.hit.0', panel, radius: a, beta, at: t, energy: SH.grainEnergy(a, beta) });
    s.cloudHit = { panel, breached: h.breached, removed: h.removed, residual: h.residual, energy: h.energy, radius: a, beta, at: t };
    if (h.breached) {                                                  // за сектором — жилой отсек: потери — сценарный слой
      s.shieldBreach = true; s.dead += CLOUD.dead; s.cloudDead = CLOUD.dead;
      incident(s, 'cloud', CLOUD.dead, { check: s.cloudCheck, found: s.cloudFound, year: t });
    }
    // решение — если в месте удара не осталось сервисного допуска (удвоенный щит держит с запасом — без решения)
    return h.residual < SH.RULES.service ? { id: 'cloud.hit.0', kind: 'shieldService', panel } : null;
  }
  // ---- общий календарь модели (DOC «Долгий рейс — износ и смена курса», шаг 1): ход идёт от границы к границе.
  // Следующая граница — ближайшая из источников на [t0, t1]; при равенстве дат — порядок источников в CAL (постоянный,
  // проверяется тестом). Между границами — непрерывная часть (эрозия щита при постоянной среде), на границе — дискретная:
  // событие, удар, выход из ядра. Источник одноразов на своей дате: после go() он её больше не предлагает. Каждая
  // граница — запись в журнал запасов и людей с причиной. Модель износа добавит отказы узлов, исчерпание буферов и
  // завершение ремонтов
  function envMarks(s) {                                               // где меняется множитель пыли: волокно, облако, поток
    const m = EV.marks(s);
    if (cloudThrough(s)) { const c = cloudSpan(s); m.push(c.a, c.b, c.band[0], c.band[1]); }
    if (streamOn(s)) { const P = streamPlan(s); m.push(P.warn, P.core, P.preEnd); if (P.coreEnd != null) m.push(P.coreEnd); }
    return m;
  }
  // ---- износ корабля (DOC «Долгий рейс — износ и смена курса», шаг 2; план — «Ревью Codex — износ, шаг 2»).
  // Модель — wear.js; здесь — подключение к партии: создание при отлёте, граница календаря, ответы на отказы.
  // ctx.wear: false — партия без модели (сравнение в калибровке).
  // модель идёт, пока экспедиция сама ведёт корабль: после сигнала бедствия людей ведёт модель спасения (M.survivors)
  // год, когда на корабле никого не остаётся: база внизу построена и последняя волна спустилась (высадка, купола на всех,
  // база на спутниках — по сроку стройки из «Где будет дом»; поселение — только на поверхности, surface или keep; сначала
  // орбита, потом поверхность — стройка с решения «Дом»; keep без своей энергии — зимой люди возвращаются на орбиту, корабль
  // остаётся домом), у спасателя — площадка готова. С этого года корабль — склад и архив над домом: модель износа останавливается (wearStop),
  // её конец больше не конец экспедиции. Упрощение среза: гибель корабля над готовым домом (больница, энергия) не
  // моделируется — DOC «Долгий рейс — износ и смена курса». Орбитальный дом, маяк, возвращение, форпост снабженца,
  // эвакуация в корабль, купол на сорок (остальные ждут на орбите) — корабль и есть дом: износ идёт до конца
  const offShipAt = s => s.mission === 'rescue' ? (['old', 'closed'].includes(s.site) ? s.homeReadyAt ?? null : null)
    : s.home === 'moons' || s.settle === 'surface' || (s.settle === 'keep' && energyOK(s)) ? s.homeReadyAt ?? null : null;
  const wearOn = s => !!s.wearOn && !s.sos && !s.lostShip && !s.dutchman && !(s.wear && s.wear.stopAt != null);
  const wearRnd = s => key => hidden(s, key);
  // бодрствующие на год y: до года 2 на ногах весь экипаж, до передачи полномочий (год 8) — шестьдесят, дальше — вахта;
  // у цели (год прибытия) зал будят — капсулы больше не держат людей
  const awakeAt = s => [2, 8].concat(s.arrive ? [arriveView(s)] : []);
  // группа Б разбужена — двадцать на ногах сверх вахты, пока не случилась авария магистрали (дальше сюжет называет вахту сам)
  const awakeNowAt = (s, y) => y < 2 ? crewOf(s) : s.arrive && y >= arriveView(s) ? crewOf(s) : y < 8 ? 60 : s.watch + (s.groupB === 'woken' && !s.loopDead ? 20 : 0);
  const awakeNow = s => awakeNowAt(s, s.year);
  const WEAR_OPS = { reroute: 0.5, pump: 1, cooler: 0.25, control: 0.1, move: 0.25 };   // материалы, % запаса
  // места сюжетных героев на карте зала (game.js NAMED: Дассер, Дал, Лорн, Ландис, Осгер) — случайные отказы их не выбирают
  const CAST_SEATS = [0, 1, 50, 162, 282];
  // ложатся в капсулы на году 2: живые сверх шестидесяти на вахте (с моделью — по реестру)
  const sleepersAt2 = s => (s.wear ? s.wear.ps.split('').filter(c => c !== 'D').length : crewOf(s)) - 60;
  // трудоёмкость работ износа: ручная часть (человеко-сутки) и непараллелимая выдержка (сутки) — ревью Codex, шаг 3, C
  const WEAR_WORK = { pump: { work: 13, hold: 0.5 }, cooler: { work: 0.75, hold: 0.125 }, control: { work: 0.375, hold: 0.0625 }, move: { work: 1, hold: 0 },
    coll: { work: 28, hold: 2 } };                                       // вставка коллектора: 28 чел.-сут и 48 ч опрессовки (шаг 3e)
  // специалисты вахты: вахта/6 (полная 48 — восемь, тонкая 26 — четверо). Регламент — постоянная работа очереди: после спасения
  // людей и восстановления пути, до запаса; аврал забирает людей у регламента и честно копит отставание (шаг «хрупкость»)
  // разбуженные учатся — ещё не в счёте; кольцо остановлено — лишние в невесомости, вахта слабее (шаг «хрупкость» 3в)
  const zgFactor = s => { const w = s.wear; if (!w || !wearOn(s) || !(s.year >= 8) || s.year >= arriveView(s)) return 1; const z = W.zeroG(w); return z.awake ? 1 - W.RING.zeroG * z.n / z.awake : 1; };
  const techs = s => Math.max(0, Math.floor((Math.floor(s.watch / 6) - (s.trainees ? s.trainees.n : 0)) * zgFactor(s) + 1e-9));
  const pools = s => ({ tech: techs(s), shop: !s.wear || W.shopOpen(s.wear) ? 1 : 0 });   // мастерская — один производственный слот (3b); привод в ремонте — закрыта (3c)
  const auralN = s => techs(s);
  const auralDays = s => { const n = auralN(s); return n ? WEAR_WORK.pump.work / n + WEAR_WORK.pump.hold : Infinity; };   // насос авралом, сутки
  // все внизу (offShipAt): незаконченные работы износа (ремонт, переборка, лом, регламент) снимаются с той же даты; модель
  // дальше не идёт (wearOn) — ни отказов, ни новых работ, ни материалов из лома
  function wearStop(s, t) {
    const w = s.wear; if (!w || w.stopAt != null) return;
    w.stopAt = t;
    if (!s.jobs) return;
    for (const j of JB.active(s.jobs).filter(x => x.owner === 'wear')) Object.assign(j, { status: 'done', w: 0, end: t, cancelled: true });
    JB.dispatch(s.jobs, t, pools(s));
  }
  function wearStart(s) {
    if (!wearOn(s) || s.wear || !s.eq) return;
    s.wear = W.create({ crew: crewOf(s), watch: awakeNow(s), reserved: Math.max(0, M.CREW - crewOf(s)), safe: capsSafe(s), at: s.year, protect: CAST_SEATS,
      machine: eqOf(s).prod !== 'repair', agro: (s.kits || []).includes('agro') });   // станки (не ремкомплект) и второй агромодуль
    if (!s.jobs) s.jobs = JB.create();
    regJob(s, s.year);
  }
  // работа «регламент» в очереди: бесконечная, людей — по спросу и догонке отставания (не больше полугодового спроса в год)
  function regJob(s, t) {
    let j = s.jobs.list.find(x => x.type === 'wear.reg' && x.status !== 'done');
    if (!j) j = JB.enqueue(s.jobs, { owner: 'wear', ref: 'reg', type: 'wear.reg', prio: JB.PRIO.reg, pool: 'tech', minW: 1, maxW: 1, work: 1e12, hold: 0 }, t, pools(s));
    return j;
  }
  // «Обслуживание не успевает» (шаг «хрупкость», первая из двух карточек плана Codex): отставание больше десятой годового спроса
  // и растёт — спросить совет. После «отложить» — снова, когда отставание вырастет вдвое и ещё на четверть годового; после
  // «разбудить» — не раньше чем через год. У цели (меньше года до прибытия) не спрашиваем
  const REG_ASK = { B: 0.1, again: 0.25, gap: 1, spare: 2 };
  function wearRegAsk(s, t) {
    const w = s.wear; if (!w || !w.reg || !s.jobs || !wearOn(s) || t + 1 > arriveView(s)) return null;
    const B = W.regAt(w, t), a = s.regAsk;
    if (!(B >= REG_ASK.B * W.REG.D0 && w.reg.S < W.regDemand(w, t) - 1e-9)) return null;
    if (s.materials <= 0.5 || s.trainees || regWakeTo(s) <= s.watch) return null;   // нет материалов, люди уже учатся или будить некого — выбора нет
    if (a && (a.policy === 'defer' ? B < 2 * a.B + REG_ASK.again * W.REG.D0 : t - a.at < REG_ASK.gap)) return null;
    s.wearAsked = (s.wearAsked || 0) + 1; return { kind: 'wear', type: 'reg', at: t };
  }
  // вахта, которой хватит до прибытия: специалистов — на спрос у цели, догонку отставания (не больше полугодового спроса в год)
  // и двое сверх регламента — на ремонт и переборку
  const regWakeTo = s => { const w = s.wear, t = s.year, D = W.regDemand(w, t);
    return Math.max(s.watch, 6 * (REG_ASK.spare + Math.ceil((W.regDemand(w, Math.max(t, arriveView(s))) + Math.min(W.regAt(w, t), D / 2)) / W.REG.perYear - 1e-9))); };
  function wearRegDecision(s, ev) {
    const info = (x, lang) => { const w = x.wear, t = x.year, ru = lang === 'ru', n = techs(x), D = W.regDemand(w, t), B = W.regAt(w, t), m = 1 + Math.min(W.REG.kMax, W.REG.k * B / W.REG.D0);
      return ru ? `Регламент — смазка, замены, диагностика, герметичность — требует ${nf(D, 0, 'ru')} чел.-сут в год. Специалистов на вахте — ${n}: ${n * W.REG.perYear} в год, когда их не забирают ремонты. Отставание — ${nf(B, 0, 'ru')} чел.-сут; узлы стареют в ${nf(m, 2, 'ru')} раза быстрее нормы, и чем больше долг, тем быстрее.`
        : `Routine maintenance — lubrication, replacements, diagnostics, seals — needs ${nf(D, 0, 'en')} person-days a year. There are ${n} specialists on watch: ${n * W.REG.perYear} a year when repairs do not take them. The backlog is ${nf(B, 0, 'en')} person-days; the nodes age ${nf(m, 2, 'en')} times faster than normal, and the larger the backlog, the faster.`; };
    const short = x => Math.max(0, Math.round(W.regDemand(x.wear, x.year) - x.wear.reg.S));
    return {
      id: 'd.wear.reg', scene: 'vault', overlay: 'sleepers', kind: 'decision',
      title: { ru: 'Обслуживание не успевает', en: 'Maintenance is falling behind' },
      rec: x => ({ id: 'wake', why: { ru: 'отставание регламента само не гасится — оно превращается в отказы', en: 'a maintenance backlog does not clear itself — it turns into failures' } }),
      context: { ru: x => info(x, 'ru'), en: x => info(x, 'en') },
      options: x => [{
        id: 'wake', label: { ru: y => `Разбудить специалистов — вахта ${regWakeTo(y)}`, en: y => `Wake specialists — a watch of ${regWakeTo(y)}` },
        known: { ru: y => [`На вахте — на ${ppl(regWakeTo(y) - y.watch)} больше: годы их жизни в пути и тепло колец.`, 'Полгода разбуженные учатся — отставание пока растёт; потом регламент его догонит. Старение вернётся к норме, но прожитое узлами не вернуть.'],
          en: y => [`${regWakeTo(y) - y.watch} more on watch: years of their lives on the road, and the rings' heat.`, 'For half a year the woken train — the backlog still grows; then maintenance catches up. Ageing returns to normal, but what the nodes have lived through does not come back.'] },
        effect: y => { const n = regWakeTo(y), k = Math.floor(n / 6) - Math.floor(y.watch / 6);
          y.ageShift = (y.ageShift || 0) + Math.round(M.awake(Math.max(0, y.arrive - y.year), n - y.watch, crewOf(y)));
          if (k > 0) y.trainees = { n: k, until: W.regNext(y.wear, y.year + W.REG.train / 365.25 - 1e-9, Infinity) };   // конец обучения — узел сетки
          y.regAsk = { at: y.year, policy: 'wake', B: W.regAt(y.wear, y.year) }; y.watch = n; },
        record: { ru: y => `Лорн будит специалистов: на вахте — ${ppl(y.watch)}. Полгода — обучение, потом регламент догонит график.`, en: y => `Lorn wakes specialists: ${y.watch} on watch. Half a year of training, then maintenance catches up.` }
      }, {
        id: 'defer', label: { ru: 'Отложить часть регламента', en: 'Defer part of the maintenance' },
        known: { ru: y => [`Отставание растёт примерно на ${nf(short(y), 0, 'ru')} чел.-сут в год.`, 'Все узлы стареют быстрее: на треть за каждый годовой объём долга, до четырёх раз.'],
          en: y => [`The backlog grows by about ${nf(short(y), 0, 'en')} person-days a year.`, 'All nodes age faster: by a third for every year of backlog, up to four times.'] },
        effect: y => { y.regAsk = { at: y.year, policy: 'defer', B: W.regAt(y.wear, y.year) }; },
        record: { ru: 'Совет откладывает часть регламента. Журнал обслуживания растёт строками «перенесено».', en: 'The council defers part of the maintenance. The service log grows rows of "postponed".' }
      }]
    };
  }
  // тик регламента — до событий шага и после них (на той же дате): материалы за выполненное с прошлой опоры; людей регламенту —
  // только на узлах сетки (остановка перемотки их не меняет); новая опора отставания
  function wearRegTick(s, t) {
    const w = s.wear; if (!w || !s.jobs || !wearOn(s)) return;
    // выполненное с прошлой опоры — спрос плюс погашенное отставание (сверх спроса без долга люди материалов не тратят);
    // материалов меньше — сколько есть (сумма по кускам та же, что за весь ход)
    const r = W.regOf(w, t), used = Math.min(Math.max(0, s.materials), W.REG.mat / W.REG.D0 * Math.max(0, W.regDemand(w, r.t0) * (t - r.t0) + r.B - W.regAt(w, t)));
    if (used > 0) { s.materials -= used; r.spent = (r.spent || 0) + used; book(s, 'wear.reg', t); }   // в отчёт вахты — по разности накопленного (снимки периода)
    const j = regJob(s, t); let re = false;
    if (W.onRegGrid(w, t)) {
      if (s.trainees && t >= s.trainees.until - 1e-9) { delete s.trainees; re = true; }   // обучение кончилось — специалисты в счёте
      // материалов нет — только трудовая часть (60% спроса), долг ею не гасится; иначе — по спросу и догонке отставания
      const D = W.regDemand(w, t); r.lab = s.materials <= 0.5;
      const need = Math.max(1, Math.ceil((r.lab ? W.REG.labor * D : D + Math.min(W.regAt(w, t), D / 2)) / W.REG.perYear - 1e-9));
      if (j.maxW !== need) { j.maxW = need; re = true; }
    }
    // переборка насоса, когда контур стоит, а готового нет, — восстановление пути (раньше регламента), иначе — запас
    const down = w.inv.pump === 0 && W.LOOPS.some(L => !w.nodes[L + '.pump'].ok);
    for (const q of JB.active(s.jobs)) if (q.type === 'wear.rebuild.pump') { const p = down ? JB.PRIO.path : JB.PRIO.stock; if (q.prio !== p) { q.prio = p; re = true; } }
    if (re) JB.dispatch(s.jobs, t, pools(s));
    const S = j.status === 'work' ? j.w * W.REG.perYear : 0;
    W.regSet(w, t, r.lab ? Math.min(S, W.REG.labor * W.regDemand(w, t)) : S);
  }
  // резерв материалов, который честный совет не тратит: регламент до прибытия и трёх лет у цели (×1,2) и 12 пунктов на ремонты
  const matReserve = s => s.wear && s.wear.reg && wearOn(s) ? 1.2 * W.regMatTo(s.wear, s.year, arriveView(s) + 3) + 12 : 0;
  // конец работы очереди: владелец оформляет результат (износ — установка детали или перекладка, событие — его итог)
  function jobDone(s, j, t) {
    if (j.owner === 'wear') return wearOpDone(s, j.ref, t) || dangerReask(s, t);   // запас пополнился — ремонт секции снова возможен
    if (j.owner === 'ev') return EV.jobDone(s, j) || dangerReask(s, t);
    return null;
  }
  // люди: погибшие сюжета и происшествий — в реестр модели, погибшие модели — в реестр сюжета (deadIds): никто не
  // погибает дважды (полный единый учёт людей — подшаг 2d)
  function wearSyncDead(s, t) {
    const w = s.wear; if (!w) return;
    const ids = new Set(s.deadIds || []);
    for (const x of s.incidents || []) if ((x.pop || 'crew') === 'crew') for (const i of x.ids || []) ids.add(i);
    const fresh = [...ids].filter(i => i < w.crew && w.ps[i] !== 'D');
    if (fresh.length) W.recordDeaths(w, fresh, Math.max(w.t, t));
  }
  const wearDead = (s, ids) => { s.deadIds = [...new Set((s.deadIds || []).concat(ids))]; };
  // вахта изменилась сценой или решением — люди в зале по новому счёту (с той же даты); заснувшие группы с неисправным
  // оборудованием получают ремонт
  function wearSync(s) {
    const w = s.wear; if (!w) return;
    wearSyncDead(s, s.year);
    const n = awakeNow(s), t = Math.max(w.t, s.year);
    W.setRoad(w, !(s.arrive && s.year >= arriveView(s)), t);             // фон пути — до прибытия
    if (n !== w.watchN) { W.setAwake(w, n, t); wearCheckGroups(s, t); }
    if (s.jobs) JB.dispatch(s.jobs, Math.max(t, s.simYear || 0), pools(s));   // вахта могла смениться — люди раздаются заново
    // снабженец: резервный блок сгорел под вспышками — блок PB2 выбыл, перемычка держит шину (причина — в журнале модели)
    if (s.gridBlocks < 2 && w.nodes.PB2.ok) { W.fail(w, 'PB2', t, 'supply.flares'); w.link.tie = true; W.recompute(w, t); }
  }
  // «Отказал насос L2 (поколение 1, коллектору — 84 года).»
  const pumpFail = (w, L, lang) => { const o = W.observe(w), x = o.loops.find(l => l.id === L);
    return lang === 'ru' ? `Отказал насос ${L} (поколение ${x.pumpGen + 1}, коллектору — ${yrs(x.collAge)}).` : `Pump ${L} failed (generation ${x.pumpGen + 1}; the collector is ${Math.round(x.collAge)} years old).`; };
  const layout = w => W.LOOPS.map(L => W.loopRuns(w, L) ? String(W.loopLoad(w, L)) : '–').join('·');
  function wearNote(s, ru, en) { const w = s.wear; w.noteK = (w.noteK || 0) + 1; w.notes.push({ at: s.year, ru, en, k: w.noteK }); }   // k — сквозной номер записи
  // группы контура L на работающие контуры: перестановка автоматикой (обратимая, сразу), 0,5% материалов (сколько есть).
  // Мест не хватает — переводится сколько помещается; возвращает { plan, left } (left — группы на тепловом резерве)
  function wearReroute(s, L, t) {
    const w = s.wear, r = W.reroutePlan(w, L);
    if (Object.keys(r.plan).length) { const d = Math.min(WEAR_OPS.reroute, Math.max(0, s.materials)); W.relink(w, r.plan, t); s.materials -= d;
      if (d) wearMove$(s, t, -d, `перестановка групп контура ${L}`, `rerouting loop ${L}'s groups`); }
    return r;
  }
  // операция: материалы и деталь — при запуске, исправность — когда работа очереди кончится (jobs.js). Двое техников на
  // работу; аврал (urgent: группы без охлаждения) — все свободные техники, приоритет спасения (насос: 13 человеко-суток на
  // шестерых и полсуток опрессовки — 64 часа). Холодильник, управление и перекладка группы на резерве — тоже спасение.
  // Материалов не хватает — работы нет (null)
  function wearOp(s, kind, id, t, urgent, paid) {                       // paid — материалы оплачены заранее (донор агромодуля)
    const w = s.wear, R = kind === 'rad' || kind === 'ring' ? W.dangerRecipe(w, id) : null;   // ремонт секции радиатора или опоры кольца — по стадии дефекта (шаг «хрупкость» 3)
    const cost = paid ? 0 : kind === 'coll' ? W.COLL.materials[prodOf(s)] || W.COLL.materials.repair : R ? R.materials : WEAR_OPS[kind];
    if (s.materials < cost - 1e-9) return null;
    if (kind === 'coll' && !(w.inv.valve >= 1)) return null;             // вставка — клапанный комплект из общих восьми
    if ((kind === 'rad' || kind === 'ring') && !(R && W.canRepairDefect(w, id, s.materials))) return null;   // комплекты; разрушенное не чинится
    const op = { id: `op.${kind}.${id}.${w.ops.length}`, kind, target: id, at: t };
    if (R) op.heavy = R === W.DANGER.bearing.alt;                         // опора: дорожка вместо роликов
    w.ops.push(op); s.materials -= cost;
    const rescue = urgent || (kind !== 'pump' && kind !== 'coll' && kind !== 'rad' && kind !== 'ring'), deadline = t + W.BUF[w.safe ? 'safe' : 'std'] / 8766;
    JB.enqueue(s.jobs, Object.assign({ owner: 'wear', ref: op.id, type: `wear.${kind}`, prio: rescue ? JB.PRIO.rescue : JB.PRIO.path, deadline: rescue ? deadline : Infinity,
      pool: 'tech', minW: 1, maxW: urgent ? Infinity : kind === 'ring' ? 4 : 2 }, R ? { work: R.work, hold: R.hold } : WEAR_WORK[kind]), t, pools(s));   // опору — до четырёх
    if (kind === 'coll') w.inv.valve--;
    if (R) w.inv[R.kit] -= R.kits;
    const u = id.split('.')[0], NM = { ring: [`ремонт опоры кольца ${u}`, `repairing ring ${u}'s bearing`], rad: [`ремонт секции радиатора ${u}`, `repairing radiator section ${u}`], coll: [`вставка коллектора ${u}`, `an insert for the ${u} collector`], pump: [`замена насоса ${u}`, `replacing the ${u} pump`], cooler: [`замена холодильника группы ${u}`, `replacing group ${u}'s cooler`],
      control: [`замена управления группы ${u}`, `replacing group ${u}'s control`], move: [`перекладка группы ${u}`, `moving group ${u}`] }[kind];
    if (cost) wearMove$(s, t, -cost, NM[0], NM[1]);
    if (kind === 'pump' || kind === 'cooler') op.sn = W.reservePart(w, kind); else if (kind === 'control') w.inv.control--;   // насос, холодильник — экземпляр из запаса
    return op;
  }
  // изменение запаса работой износа — с причиной (отчёт вахты: «Материалы: −1% — замена насоса L2»)
  function wearMove$(s, t, d, ru, en) { (s.wear.moves = s.wear.moves || []).push({ at: t, key: 'materials', d, name: { ru, en } }); }
  const pendingFor = (w, target) => w.ops.some(o => !o.done && o.target === target);
  // спящих группы — в свободные исправные капсулы охлаждаемых групп (двое за 12 часов, 0,25% материалов); мест мало — никого
  function wearMove(s, g, t) {
    const w = s.wear, n = W.groupPeople(w, g).sleep.length, seats = W.freeSeats(w, g);
    if (!n || seats.length < n || pendingFor(w, g)) return false;
    const op = wearOp(s, 'move', g, t); if (!op) return false;
    W.holdSeats(w, op.id, seats.slice(0, n));                          // места обещаны этой перекладке — другой не достанутся
    wearNote(s, `Группу ${g} переводят в свободные капсулы других групп: ${ppl(n)}, двенадцать часов работы.`, `Group ${g} is being moved into free capsules of other groups: ${n} people, twelve hours of work.`);
    return true;
  }
  // неисправный холодильник или управление занятой группы: замена из запаса, иначе перекладка, иначе — тепловой резерв
  function wearUnit(s, g, part, t) {
    const w = s.wear, kind = part === 'cool' ? 'cooler' : 'control';
    if (w.inv[kind] > 0 && wearOp(s, kind, `${g}.${part}`, t)) return;
    if (wearMove(s, g, t)) return;
    wearNote(s, `Отказал${kind === 'cooler' ? ' холодильник' : 'о управление'} группы ${g}; ${w.inv[kind] > 0 ? 'материалов на замену нет' : kind === 'cooler' ? 'запасных холодильников нет' : 'запасных блоков управления нет'}, свободных капсул мало. Группа на тепловом резерве.`,
      `Group ${g} ${kind === 'cooler' ? 'cooler' : 'control'} failed; ${w.inv[kind] > 0 ? 'no materials for the replacement' : `no spare ${kind === 'cooler' ? 'coolers' : 'control units'}`}, too few free capsules. The group is on its thermal reserve.`);
  }
  // занятые группы на остановленном контуре — перестановка автоматикой (сколько помещается, остальные — в свободные
  // капсулы); занятые группы с неисправным оборудованием и без начатой работы (группа заснула, работа сорвалась) — в работу
  function wearCheckGroups(s, t) {
    const w = s.wear;
    for (const L of W.LOOPS) if (!W.loopRuns(w, L) && W.loopLoad(w, L) > 0) { const rr = wearReroute(s, L, t); for (const g of rr.left) wearMove(s, g, t); }
    const c = W.census(w);
    for (const g of W.GIDS) {
      if (!c[g].sleep.length || pendingFor(w, g)) continue;
      for (const part of ['cool', 'ctrl']) if (!w.nodes[`${g}.${part}`].ok && !pendingFor(w, `${g}.${part}`)) { wearUnit(s, g, part, t); break; }
    }
    wearShop(s, t);
  }
  // ---- восстановление (шаг 3b; «Ревью Codex — износ, шаг 3», B1–B4). Снятый агрегат: годен к переборке — ждёт на складе
  // снятых, иначе — разборка в лом. Мастерская: готовых агрегатов (с перебираемыми) меньше резерва совета — перебрать
  // снятый (сначала реже перебранный); снятого нет, а отказавший стоит на месте без замены — снять его на переборку.
  // Переборка — два специалиста и мастерская, приоритет запаса; затем партия переработки лома (один специалист и мастерская,
  // приоритет 3). Перебранный насос встаёт на отказавший контур, если политика не «беречь запас»
  const SHOP_RESERVE = { pump: 1, cooler: 1 };
  // политика мастерской (шаг 3d.2; решает совет при первом снятом насосе): reserve — держать готовый агрегат (по умолчанию),
  // paths — перебирать, только когда контур стоит без запаса, defer — не перебирать: беречь клапанные комплекты и материалы
  const shopPolicy = s => s.shopPolicy || 'reserve';
  const shopNeeds = (s, fam) => { const w = s.wear, busy = w.ops.filter(o => !o.done && o.kind === 'rebuild' && o.fam === fam).length, P = shopPolicy(s);
    if (fam === 'pump' && P === 'defer') return false;                  // политика — о насосах; холодильники — по резерву
    if (fam === 'pump' && P === 'paths') return w.inv.pump + busy === 0 && W.LOOPS.some(L => !w.nodes[L + '.pump'].ok && !pendingFor(w, L + '.pump'));
    return w.inv[fam] + busy < SHOP_RESERVE[fam]; };
  // спросить совет о политике мастерской: снятый насос, годный к переборке, а политики ещё нет
  function wearShopAsk(s, t) {
    const w = s.wear; if (!w || s.shopPolicy || !W.removedOf(w, 'pump').some(x => W.canRebuild(w, x))) return null;
    s.wearAsked = (s.wearAsked || 0) + 1; return { kind: 'wear', type: 'shop', at: t };
  }
  const prodOf = s => s.wear && s.wear.shop && s.wear.shop.lost ? 'repair' : eqOf(s).prod;   // станки потеряны — ручной ремкомплект
  const PART_RU = { pump: 'Насос', cooler: 'Холодильник' }, PART_EN = { pump: 'Pump', cooler: 'Cooler' };
  function wearDispose(s, sn, t) {
    const w = s.wear;
    if (!W.canRebuild(w, sn)) W.dismantle(w, sn, t);                    // переборки исчерпаны — в лом; годный ждёт мастерскую
  }
  function wearShop(s, t) {
    const w = s.wear; if (!w || !s.jobs || !wearOn(s)) return;
    W.partsOf(w);
    if (w.nodes['SHOP.drive'] && !w.nodes['SHOP.drive'].ok && !w.shop.lost) wearDriveFix(s, t);   // ремонт привода ждал материалов
    wearCollRetry(s, t);                                                // и вставка коллектора
    for (const fam of W.TRACK) {
      if (!shopNeeds(s, fam)) continue;
      let sn = W.removedOf(w, fam).find(x => W.canRebuild(w, x));
      if (sn == null) {                                                  // отказавший на месте, замены нет — снять на переборку
        const id = Object.keys(w.nodes).find(id => { const n = w.nodes[id]; return n.fam === fam && !n.ok && n.sn != null && !pendingFor(w, id) && W.canRebuild(w, n.sn); });
        if (id && wearRebuildable(s, w.nodes[id].sn)) sn = W.removePart(w, id, t);
      }
      if (sn != null) wearRebuild(s, sn, t);
    }
    if (!w.ops.some(o => !o.done && o.kind === 'recover') && w.scrap.v >= 1 - 1e-9) wearRecover(s, t);   // партия — от пункта лома
  }
  // ---- мастерская (шаг 3c; план B6). Привод отказал — машинная работа стоит, привод чинят ручным набором (не станком):
  // первый раз 2 пункта, 28 чел.-сут и 7 суток проверки, второй — 3, 56 и 14; третий отказ или отказ управляющей базы —
  // машин больше нет: мастерская работает ручным ремкомплектом, идущие переборки пересчитываются по ручному рецепту
  function wearShopFail(s, part, t) {
    const w = s.wear;
    if (part === 'base' || w.shop.fixes >= W.DRIVE_FIX.length) return wearShopLost(s, t, part);
    wearNote(s, `Отказал привод станков мастерской: машинная работа остановлена до ремонта привода ручным набором.`,
      `The workshop's machine drive failed: machine work stops until the drive is repaired with the hand kit.`);
    JB.dispatch(s.jobs, t, pools(s));                                   // мастерская закрыта — станочные работы ждут сразу
    wearDriveFix(s, t);
  }
  function wearDriveFix(s, t) {
    const w = s.wear, F = W.DRIVE_FIX[w.shop.fixes];
    if (!F || w.nodes['SHOP.drive'].ok || pendingFor(w, 'SHOP.drive') || s.materials < F.materials - 1e-9) return null;
    const op = { id: `op.drive.${w.ops.length}`, kind: 'drive', target: 'SHOP.drive', at: t };
    w.ops.push(op); s.materials -= F.materials;
    JB.enqueue(s.jobs, { owner: 'wear', ref: op.id, type: 'wear.drive', prio: JB.PRIO.stock, pool: 'tech', minW: 1, maxW: 2, work: F.work, hold: F.hold }, t, pools(s));
    wearMove$(s, t, -F.materials, 'ремонт привода станков', 'repairing the machine drive');
    return op;
  }
  function wearShopLost(s, t, part) {
    const w = s.wear; if (w.shop.lost) return;
    w.shop.lost = true;
    for (const op of w.ops) if (!op.done && op.kind === 'rebuild') {          // ручной рецепт: та же доля выполненного, новые сутки и ресурс
      const j = s.jobs.list.find(x => x.ref === op.id && x.status !== 'done'), q = W.quoteRebuild(w, op.sn, 'repair'); if (!j || !q) continue;
      JB.sync(s.jobs, t); const f = j.work > 0 ? j.done / j.work : 0; j.work = q.days * 2; j.done = f * j.work; op.eta = q.eta;
    }
    JB.dispatch(s.jobs, t, pools(s));
    wearNote(s, part === 'base' ? 'Отказала управляющая база станков — её не изготовить на борту. Машинного производства больше нет: мастерская работает ручным ремкомплектом, переборки дольше, ресурс перебранного меньше.'
      : 'Привод станков отказал в третий раз — ручным набором его уже не восстановить. Мастерская работает ручным ремкомплектом, переборки дольше, ресурс перебранного меньше.',
      part === 'base' ? 'The machine control base failed — it cannot be made aboard. Machine production is over: the workshop works with the hand repair kit; rebuilds take longer and give less life.'
      : 'The machine drive failed a third time — the hand kit can no longer restore it. The workshop works with the hand repair kit; rebuilds take longer and give less life.');
  }
  // ---- коллектор (основание контура, шаг 3e; план B5): отказ останавливает контур, замена насоса не помогает. Перестановка —
  // как при отказе насоса; ремонт — вставка (комплект, материалы, 28 чел.-сут и 48 ч опрессовки) — путь или аврал, если группы
  // на тепловом резерве или ядро без отвода тепла. Вставок не больше двух; третий отказ основание не переживёт
  const deadLoop = (w, L) => !w.nodes[L + '.coll'].ok && !W.canInsert(w, L);   // основание отказало, вставок больше нет
  // отложенная вставка (материалов или комплекта не было) — повторить, когда появились; срочность — по нынешнему положению
  function wearCollRetry(s, t) {
    const w = s.wear;
    for (const L of W.LOOPS) { const id = L + '.coll'; if (w.nodes[id].ok || !W.canInsert(w, L) || pendingFor(w, id)) continue;
      const o = W.observe(w, t), urgent = !o.core.cooled || o.groups.some(g => g.sleep && g.heat);
      if (wearOp(s, 'coll', id, t, urgent)) wearNote(s, `Коллектор ${L}: появились материалы и комплект — ставят вставку.`, `${L} collector: materials and a kit are available — an insert is being fitted.`); }
  }
  function wearCollFail(s, L, t) {
    const w = s.wear, rr = wearReroute(s, L, t), full = !rr.left.length, core = !W.observe(w, t).core.cooled, ins = w.nodes[L + '.coll'].inserts || 0;
    for (const g of rr.left) wearMove(s, g, t);
    const ru0 = `Отказал коллектор контура ${L} (основание; вставок было ${ins}). Замена насоса тут не поможет.`, en0 = `The ${L} collector failed (the loop's base; ${ins} insert${ins === 1 ? '' : 's'} so far). A new pump will not help.`;
    if (!W.canInsert(w, L)) { wearNote(s, `${ru0} Вставок больше не сделать: контур ${L} потерян.`, `${en0} No more inserts are possible: loop ${L} is lost.`); return null; }
    const op = wearOp(s, 'coll', `${L}.coll`, t, !full || core);
    wearNote(s, op ? `${ru0} Ставят вставку${!full || core ? ' авралом' : ''}: клапанный комплект (осталось ${w.inv.valve}), около ${nf(W.COLL.work / (!full || core ? auralN(s) || 1 : 2) + W.COLL.hold, 1, 'ru')} сут.`
        : `${ru0} Вставку не из чего ставить: ${w.inv.valve < 1 ? 'клапанных комплектов нет' : 'материалов не хватает'}.`,
      op ? `${en0} An insert is being fitted${!full || core ? ' all-hands' : ''}: a valve kit (${w.inv.valve} left), about ${nf(W.COLL.work / (!full || core ? auralN(s) || 1 : 2) + W.COLL.hold, 1, 'en')} days.`
        : `${en0} There is nothing to fit an insert with: ${w.inv.valve < 1 ? 'no valve kits' : 'not enough materials'}.`);
    return null;
  }
  // ---- конец рейса из состояния корабля (шаг 3d; «Ревью Codex — цепочка решений и терминальные исходы»): записывается один
  // раз — дата, причина, сколько было на борту; дальше модель не идёт, движок показывает финал (sim.terminal / sim.endBeat)
  function wearTerminal(s, t, reason) {
    if (s.terminalAt != null) return;
    const aboard = aliveOf(s), w = s.wear;
    const pumps = w ? w.log.filter(x => x.kind === 'fail' && /\.(pump|coll)$/.test(x.id)).map(x => ({ id: x.id.split('.')[0], part: x.id.split('.')[1], at: x.at })) : [];
    s.terminalAt = t; s.terminalReason = reason; s.year = Math.max(s.year, t);
    incident(s, 'wearLost', 0, { reason, aboard, year: t, pumps });
    s.lostShip = true;
  }
  // все контуры стоят — предупреждение: тепловой запас ядра, что делается и успевает ли
  function wearCoreWarn(s, t) {
    const w = s.wear; if (!w || W.independentLoops(w) > 0 || w.coreWarned === w.log.length) return;
    w.coreWarned = w.log.length;
    const op = w.ops.find(o => !o.done && (o.kind === 'pump' || o.kind === 'coll')), j = op && s.jobs && s.jobs.list.find(x => x.ref === op.id && x.status !== 'done');
    const h = j ? (JB.eta(j, t) - t) * 8766 : null, ok = h != null && h <= W.coreAt(w, t);
    wearNote(s, `Все контуры охлаждения стоят: ядро без отвода тепла. Тепловой запас обязательного оборудования — ${W.CORE_BUF} часов. ` +
      (j ? `${op.kind === 'coll' ? 'Вставку коллектора' : 'Насос'} ${op.target.split('.')[0]} ставят: около ${nf(h, 0, 'ru')} ч — ${ok ? 'успевают' : 'не успевают'}.` : pumpSpare(s) ? 'Насос в запасе есть — нужна команда совета.' : 'Насоса на замену нет.'),
      `Every cooling loop is down: the core has no heat rejection. The essential equipment's thermal reserve is ${W.CORE_BUF} hours. ` +
      (j ? `The ${op.target.split('.')[0]} ${op.kind === 'coll' ? 'collector insert' : 'pump'} is being fitted: about ${nf(h, 0, 'en')} h — ${ok ? 'in time' : 'not in time'}.` : pumpSpare(s) ? "There is a pump in stock — it needs the council's word." : 'There is no pump to fit.'));
  }
  // финал «рейс окончен» — сцена конца по причине (движок показывает её вместо оставшегося пути)
  function terminalBeat(s) {
    const inc = (s.incidents || []).find(x => x.kind === 'wearLost') || {}, d = Math.round(M.star(s.target).d);
    const chain = (lang) => { const p = inc.pumps || [], ru = lang === 'ru';
      return p.length ? (ru ? 'Отказы контуров: ' : 'Loop failures: ') + p.map(x => `${x.id} ${x.part === 'coll' ? (ru ? 'коллектор' : 'collector') : (ru ? 'насос' : 'pump')} — ${ru ? 'год' : 'year'} ${Math.floor(x.at)}`).join(', ') + '.' : ''; };
    return {
      id: 'x.wearLost', scene: 'dark', kind: 'end',
      title: { ru: 'Последняя передача', en: 'The last transmission' },
      text: {
        ru: s => `Год ${Math.floor(s.terminalAt)}. Все четыре контура охлаждения стоят; тепловой запас обязательного оборудования ядра — ${W.CORE_BUF} часов — исчерпан. Реактор ушёл в защитное отключение, автоматика и жилые кольца остались без отвода тепла и питания. ${chain('ru')}

Последняя передача ушла на Землю и к Кольцу: журнал отказов, ведомость работ, имена. Она дойдёт через ${yrs(d)}. На борту было ${ppl(inc.aboard || 0)}.

Экспедиция окончена. Следующая получит журнал — какой отказ не успели закрыть и что могло бы его закрыть.`,
        en: s => `Year ${Math.floor(s.terminalAt)}. All four cooling loops are down; the core's essential equipment has used up its ${W.CORE_BUF}-hour thermal reserve. The reactor went into protective shutdown; the automation and the living rings were left without heat rejection and power. ${chain('en')}

The last transmission went to Earth and the Ring: the failure log, the work ledger, the names. It will arrive in ${yrsEn(d)}. There were ${inc.aboard || 0} people aboard.

The expedition is over. The next one will receive the log — which failure was not closed in time and what could have closed it.`
      }
    };
  }
  // ---- донор второго агромодуля (шаг 3c; план D): насос агромодуля снимают (14 чел.-сут, 0,5% материалов на переходники)
  // и ставят в контур отдельным монтажом; агромодуль больше не работает — у цели его нет. Один раз
  const DONOR = { work: 14, materials: 0.5 };
  // у цели: второй агромодуль разобран на насос — в итогах его нет (решение «Где будет дом»)
  const agroLost = (s, lang) => s.agroDonor == null ? '' : lang === 'ru' ? `Второго агромодуля нет: его насос с года ${Math.floor(s.agroDonor)} стоит в контуре охлаждения — агрозалы у цели одни. `
    : `There is no second agro module: its pump has been in the cooling loop since year ${Math.floor(s.agroDonor)} — the target gets one set of agro halls. `;
  const donorDays = s => { const n = auralN(s); return n ? (DONOR.work + WEAR_WORK.pump.work) / n + WEAR_WORK.pump.hold : Infinity; };   // снять и поставить авралом
  const agroDonorOK = s => !!(s.wear && s.wear.agro === 'ok' && s.materials >= DONOR.materials + WEAR_OPS.pump - 1e-9);
  function wearDonor(s, L, t, urgent) {
    const w = s.wear;
    if (!agroDonorOK(s)) { wearNote(s, 'Насос агромодуля снять не на что: материалов на переходники и монтаж не хватает.', 'There is nothing to take the agro-module pump with: not enough materials for adapters and fitting.'); return null; }
    const op = { id: `op.donor.${w.ops.length}`, kind: 'donor', target: `${L}.pump`, at: t, urgent: !!urgent };
    w.ops.push(op); s.materials -= DONOR.materials + WEAR_OPS.pump; w.agro = 'taking';   // и снятие, и монтаж — сразу: мастерская их не потратит
    JB.enqueue(s.jobs, { owner: 'wear', ref: op.id, type: 'wear.donor', prio: urgent ? JB.PRIO.rescue : JB.PRIO.path, pool: 'tech', minW: 1, maxW: urgent ? Infinity : 2,
      work: DONOR.work, hold: 0 }, t, pools(s));
    wearMove$(s, t, -(DONOR.materials + WEAR_OPS.pump), 'насос агромодуля: переходники и монтаж', 'agro-module pump: adapters and fitting');
    return op;
  }
  function wearDonorDone(s, op, t) {
    const w = s.wear; w.agro = 'ok'; const sn = W.agroDonor(w, t); s.agroDonor = t;
    wearNote(s, `Насос второго агромодуля снят (№ ${sn}); агромодуль больше не работает. Насос ставят в контур ${op.target.split('.')[0]}.`,
      `The second agro module's pump is off (no. ${sn}); the agro module no longer works. The pump is being fitted to loop ${op.target.split('.')[0]}.`);
    if (!w.nodes[op.target].ok && !pendingFor(w, op.target)) wearOp(s, 'pump', op.target, t, op.urgent || W.GIDS.some(g => w.link.group[g] === op.target.split('.')[0] && W.groupPeople(w, g).sleep.length > 0), true);   // монтаж оплачен при выборе
    wearCheckGroups(s, t);
    return null;
  }
  // ---- ведомость работ (шаг 3c): что делается, кем и сколько осталось; ждущие — чего ждут
  function jobName(s, j, lang) {
    const ru = lang === 'ru';
    if (j.owner === 'ev') { const T = EV.TYPES[j.type]; return T ? txt(T.name, lang) : j.type; }
    if (j.type === 'wear.reg') return ru ? 'регламент' : 'routine maintenance';
    const op = s.wear && s.wear.ops.find(o => o.id === j.ref); if (!op) return j.type;
    const u = String(op.target).split('.')[0];
    return { ring: ru ? `ремонт опоры кольца ${u}` : `repairing ring ${u}'s bearing`, rad: ru ? `ремонт секции радиатора ${u}` : `repairing radiator section ${u}`, coll: ru ? `вставка коллектора ${u}` : `an insert for the ${u} collector`, pump: ru ? `замена насоса ${u}` : `replacing the ${u} pump`, cooler: ru ? `замена холодильника ${u}` : `replacing the ${u} cooler`,
      control: ru ? `замена управления ${u}` : `replacing the ${u} control`, move: ru ? `перекладка группы ${u}` : `moving group ${u}`,
      rebuild: ru ? `переборка ${op.fam === 'pump' ? 'насоса' : 'холодильника'} № ${op.sn}` : `rebuilding ${op.fam} no. ${op.sn}`,
      recover: ru ? 'переработка лома' : 'scrap recovery', drive: ru ? 'ремонт привода станков' : 'machine drive repair',
      donor: ru ? 'снятие насоса агромодуля' : 'removing the agro-module pump' }[op.kind] || op.kind;
  }
  function jobsLine(s, lang) {
    const ru = lang === 'ru', act = s.jobs ? JB.active(s.jobs) : []; if (!act.length) return null;
    const t = s.year, items = act.map(j => { if (j.type === 'wear.reg') { const o = s.wear && W.observe(s.wear, t).reg;
        if (s.wear && s.wear.reg && s.wear.reg.lab) return ru ? `регламент — без материалов: только трудовая часть, ${j.w} чел.` : `routine maintenance — no materials: labour only, ${j.w} people`;
        return `${jobName(s, j, lang)} — ${j.w} ${ru ? 'чел. из' : 'of'} ${j.maxW}${ru ? '' : ' people'}${o && o.B > 1 ? (ru ? `, отставание ${nf(o.B, 0, 'ru')} чел.-сут` : `, backlog ${nf(o.B, 0, 'en')} person-days`) : ''}`; }
      const d = Math.max(0, (JB.eta(j, t) - t) * 365.25);
      const st = j.status === 'wait' ? (j.equip && !(pools(s)[j.equip] > 0) ? (ru ? 'ждёт мастерскую' : 'waits for the workshop') : (ru ? 'ждёт людей' : 'waits for people'))
        : j.status === 'hold' ? (ru ? 'выдержка' : 'hold') : (ru ? `${j.w} чел.` : `${j.w} ${j.w === 1 ? 'person' : 'people'}`);
      return `${jobName(s, j, lang)} — ${st}${j.status === 'wait' ? '' : `, ≈${nf(d, d < 10 ? 1 : 0, lang)} ${ru ? 'сут.' : 'days'}`}`; });
    const line = (ru ? 'Работы: ' : 'Work: ') + items.join('; ');
    return /\.$/.test(line) ? line : line + '.';                          // «сут.» в конце — без второй точки
  }
  const wearRebuildable = (s, sn) => { const q = W.quoteRebuild(s.wear, sn, prodOf(s)); return !!(q && s.wear.inv.valve >= 1 && s.materials >= q.materials - 1e-9); };
  function wearRebuild(s, sn, t) {
    const w = s.wear, q = W.quoteRebuild(w, sn, prodOf(s));
    if (!wearRebuildable(s, sn)) return null;
    const op = { id: `op.rebuild.${sn}.${w.ops.length}`, kind: 'rebuild', fam: q.fam, sn, target: `part.${sn}`, at: t, eta: q.eta, cost: q.materials };
    w.ops.push(op); s.materials -= q.materials; W.startRebuild(w, sn, t);
    JB.enqueue(s.jobs, { owner: 'wear', ref: op.id, type: `wear.rebuild.${q.fam}`, prio: JB.PRIO.stock, pool: 'tech', minW: 1, maxW: 2, equip: 'shop', work: q.days * 2, hold: 0 }, t, pools(s));
    const ru = q.fam === 'pump' ? 'насоса' : 'холодильника', en = q.fam === 'pump' ? 'pump' : 'cooler';
    wearMove$(s, t, -q.materials, `переборка ${ru} № ${sn}`, `rebuilding ${en} no. ${sn}`);
    wearNote(s, `${PART_RU[q.fam]} № ${sn} — на ${q.rg ? 'вторую ' : ''}переборку в мастерской: два специалиста, ${q.days} суток; материалы −${nf(q.materials, 2, 'ru')}%, клапанный комплект (осталось ${w.inv.valve}).`,
      `${PART_EN[q.fam]} no. ${sn} goes for ${q.rg ? 'a second ' : ''}rebuild in the workshop: two specialists, ${q.days} days; materials −${nf(q.materials, 2, 'en')}%, one valve kit (${w.inv.valve} left).`);
    return op;
  }
  function wearRebuilt(s, op, t) {
    const w = s.wear;
    W.completeRebuild(w, op.sn, t, op.eta);
    W.addScrap(w, W.SCRAP_BACK * op.cost, `rebuild.${op.sn}`, t);       // обрезки и снятые детали переборки — в лом
    wearNote(s, `${PART_RU[op.fam]} № ${op.sn} перебран: в запасе ${op.fam === 'pump' ? `насосов — ${w.inv.pump}` : `холодильников — ${w.inv.cooler}`}. Ресурс перебранного меньше заводского.`,
      `${PART_EN[op.fam]} no. ${op.sn} rebuilt: ${op.fam === 'pump' ? `${w.inv.pump} pump${w.inv.pump === 1 ? '' : 's'}` : `${w.inv.cooler} cooler${w.inv.cooler === 1 ? '' : 's'}`} in stock. A rebuilt unit has less life than a factory one.`);
    wearRefit(s, t);
    wearCheckGroups(s, t);
    return null;
  }
  // отказавшие насосы без работы — из запаса (перебранный встаёт так же, как заводской), если политика не «беречь запас»;
  // на контуре остались спящие группы (они на тепловом резерве) — аврал при любой политике (ревью Codex 3b)
  function wearRefit(s, t) {
    const w = s.wear;
    for (const L of W.LOOPS) { const id = L + '.pump';
      if (w.nodes[id].ok || pendingFor(w, id) || !pumpSpare(s) || deadLoop(w, L)) continue;
      const urgent = W.GIDS.some(g => w.link.group[g] === L && W.groupPeople(w, g).sleep.length > 0);
      if (s.wearPolicy === 'reroute') continue;                          // политика совета — до её пересмотра (шаг 3d.2)
      if (wearOp(s, 'pump', id, t, urgent)) wearNote(s, urgent ? `Насос ${L}: группы на тепловом резерве — ставят из запаса авралом.` : `Насос ${L}: ставят из запаса, неделя работы.`,
        urgent ? `Pump ${L}: groups are on their thermal reserve — a unit from stock is being fitted all-hands.` : `Pump ${L}: a unit from stock is being fitted, a week of work.`); }
  }
  function wearRecover(s, t) {
    const w = s.wear, batch = W.takeScrap(w, W.BATCH, 'recover', t); if (!(batch > 0)) return null;
    const op = { id: `op.recover.${w.ops.length}`, kind: 'recover', target: 'scrap', at: t, batch };
    w.ops.push(op);
    JB.enqueue(s.jobs, { owner: 'wear', ref: op.id, type: 'wear.recover', prio: JB.PRIO.low, pool: 'tech', minW: 1, maxW: 1, equip: 'shop', work: W.BATCH_DAYS, hold: 0 }, t, pools(s));   // партия — 90 суток при любом объёме
    return op;
  }
  function wearRecovered(s, op, t) {
    const w = s.wear, k = W.YIELD[prodOf(s)] || W.YIELD.repair, gain = k * op.batch;
    s.materials += gain; wearMove$(s, t, gain, 'переработка лома', 'scrap recovery');
    wearNote(s, `Партия переработки лома: ${nf(op.batch, 2, 'ru')} пункта — в запас вернулось ${nf(gain, 2, 'ru')}% материалов (выход годного ${Math.round(k * 100)}%), остальное — в отходы.`,
      `A scrap recovery batch: ${nf(op.batch, 2, 'en')} points — ${nf(gain, 2, 'en')}% of materials back in stock (${Math.round(k * 100)}% usable), the rest is waste.`);
    wearRefit(s, t);                                                     // материалов хватило на монтаж ждущего агрегата:
    wearCheckGroups(s, t);                                               // насосы, затем холодильники и управление групп (и мастерская)
    return null;
  }
  function wearOpDone(s, id, t) {
    const w = s.wear, op = w.ops.find(o => o.id === id); if (!op || op.done) return null;
    op.done = true;
    if (op.kind === 'rebuild') return wearRebuilt(s, op, t);
    if (op.kind === 'donor') return wearDonorDone(s, op, t);
    if (op.kind === 'coll') { const L = op.target.split('.')[0]; W.insertColl(w, L, t); const home = W.rehome(w, t), ins = w.nodes[L + '.coll'].inserts;
      const runs = W.loopRuns(w, L);
      wearNote(s, `Коллектор ${L}: вставка ${ins === 1 ? 'первая' : 'вторая'}, опрессовка пройдена — ${runs ? 'контур работает' : 'основание цело, контур ждёт насос'}${ins >= W.COLL.inserts ? ', на единицу мощности слабее; следующий отказ основания не восстановить' : ''}${home ? '; группы вернулись домой' : ''}.`,
        `${L} collector: ${ins === 1 ? 'first' : 'second'} insert, pressure test passed — ${runs ? 'the loop runs' : 'the base is sound, the loop waits for a pump'}${ins >= W.COLL.inserts ? ', one unit weaker; the next base failure cannot be restored' : ''}${home ? '; the groups are back home' : ''}.`);
      if (!runs) wearRefit(s, t);
      wearCheckGroups(s, t); return null; }
    if (op.kind === 'ring') { W.repairDefect(w, op.target, t); const H = op.target.split('.')[0]; JB.dispatch(s.jobs, t, pools(s));   // кольцо вращается — места и люди вернулись
      const zg = W.zeroG(w).n;
      wearNote(s, `Опора кольца ${H} отремонтирована${op.heavy ? ' — новая дорожка' : ''}: кольцо снова вращается${zg ? `; в невесомости остаются ${ppl(zg)}` : ', невесомость кончилась'}. Комплектов роликов — ${w.inv.rollerKit}, дорожек — ${w.inv.trackKit}.`,
        `Ring ${H}'s bearing repaired${op.heavy ? ' — a new track' : ''}: the ring rotates again${zg ? `; ${zg} people still work in zero-g` : ', the zero-g work is over'}. Roller kits left: ${w.inv.rollerKit}, tracks: ${w.inv.trackKit}.`);
      return null; }
    if (op.kind === 'rad') { W.repairDefect(w, op.target, t); const home = W.rehome(w, t), L = W.LOOPS.find(x => w.link.rad[x] === op.target);
      wearNote(s, `Секция радиатора ${op.target} отремонтирована, опрессовка пройдена — контур ${L} ${W.loopRuns(w, L) ? 'снова отводит тепло' : 'ждёт насос'}${home ? '; группы вернулись домой' : ''}. Секционных комплектов — ${w.inv.radKit}.`,
        `Radiator section ${op.target} repaired, pressure test passed — loop ${L} ${W.loopRuns(w, L) ? 'rejects heat again' : 'waits for a pump'}${home ? '; the groups are back home' : ''}. Section kits left: ${w.inv.radKit}.`);
      wearCheckGroups(s, t); return null; }
    if (op.kind === 'drive') { W.install(w, 'SHOP.drive', t); w.shop.fixes++;
      wearNote(s, `Привод станков восстановлен ручным набором (${w.shop.fixes === 1 ? 'первый' : 'второй'} ремонт): машинная работа продолжается.`,
        `The machine drive is restored with the hand kit (${w.shop.fixes === 1 ? 'first' : 'second'} repair): machine work resumes.`);
      JB.dispatch(s.jobs, t, pools(s)); wearShop(s, t); return null; }
    if (op.kind === 'recover') return wearRecovered(s, op, t);
    if (op.kind === 'move') { const n = W.moveSleepers(w, op.target, t, op.id);
      wearNote(s, n ? `Группа ${op.target} переложена: ${ppl(n)} в капсулах других групп.` : `Группу ${op.target} переложить не удалось: свободных капсул не осталось.`,
        n ? `Group ${op.target} moved: ${n} people in other groups' capsules.` : `Group ${op.target} could not be moved: no free capsules left.`);
      wearCheckGroups(s, t); return null; }
    const unit = op.target.split('.')[0];
    const old = W.install(w, op.target, t, op.sn);                      // снятый агрегат: переборка или лом
    if (old != null) wearDispose(s, old, t); else if (op.kind === 'control') W.addScrap(w, W.SCRAP_OF.control, `${op.target}.${w.nodes[op.target].gen - 1}`, t);
    const ask = op.kind === 'pump' ? wearShopAsk(s, t) : null;
    const home = op.kind === 'pump' ? W.rehome(w, t) : 0;                // восстановленный контур забирает свои группы; чужие — домой, где есть место
    wearNote(s, op.kind === 'pump' ? `Насос ${unit} заменён из запаса${home ? '; группы вернулись на свои контуры' : ''}. Схема ${layout(w)}.`
      : op.kind === 'cooler' ? `Холодильник группы ${unit} заменён из запаса.` : `Управление группы ${unit} заменено из запаса.`,
      op.kind === 'pump' ? `The ${unit} pump replaced from stock${home ? '; the groups are back on their loops' : ''}. Layout ${layout(w)}.`
        : op.kind === 'cooler' ? `Group ${unit} cooler replaced from stock.` : `Group ${unit} control replaced from stock.`);
    if (ask) return ask;                                                // мастерская — после решения совета о политике
    wearCheckGroups(s, t);
    return null;
  }
  // острая гибель группы (буфер исчерпан) — происшествие с именами; одиночные отказы капсул — фон модели (учёт людей — 2d)
  function wearDeaths(s, rec) {
    if (!rec || !rec.ids || !rec.ids.length) return;
    wearDead(s, rec.ids);
    if (rec.kind === 'buffer') { const kept = !!(s.wearKept && s.wearKept[rec.group] != null && rec.at - s.wearKept[rec.group] < 0.05);   // остались без охлаждения при политике «беречь запас»
      s.dead += rec.ids.length; incident(s, 'wearGroup', rec.ids.length, { ids: rec.ids, group: rec.group, kept }); }
  }
  const pumpSpare = s => s.wear.inv.pump > 0 && s.materials >= WEAR_OPS.pump - 1e-9;
  // запас насосов восполним: идёт переборка, или есть клапанный комплект, годный к переборке насос (снятый или отказавший id)
  // и материалы на его переборку после монтажа запасного (ревью Codex 3b)
  const pumpProspect = (s, id) => { const w = s.wear; if (w.ops.some(o => !o.done && o.kind === 'rebuild' && o.fam === 'pump')) return true;
    if (w.inv.valve < 1) return false;
    const sn = W.removedOf(w, 'pump').find(x => W.canRebuild(w, x)) ?? (id && w.nodes[id].sn != null && W.canRebuild(w, w.nodes[id].sn) ? w.nodes[id].sn : null);
    const q = sn != null && W.quoteRebuild(w, sn, prodOf(s));
    return !!q && s.materials - WEAR_OPS.pump >= q.materials - 1e-9; };
  // отказ узла: обратимая автоматика сразу; карточка — когда есть настоящий выбор (перестановка покрыла все группы, а
  // это первый отказ контура или последний запасной насос); иначе — принятая политика или единственный путь, в ведомость
  function wearRespond(s, rec) {
    const w = s.wear, t = rec.at, [unit, part] = rec.id.split('.');
    if (unit === 'SHOP') { wearShopFail(s, part, t); return null; }
    if (part === 'pump') {
      const rr = wearReroute(s, unit, t), full = !rr.left.length, spare = pumpSpare(s);
      if (deadLoop(w, unit)) { for (const g of rr.left) wearMove(s, g, t);    // основание не восстановить — насос на этот контур не тратят
        wearNote(s, `${pumpFail(w, unit, 'ru')} Контур ${unit} без основания: насос на него не ставят.`, `${pumpFail(w, unit, 'en')} Loop ${unit} has no base: no pump is fitted to it.`); return null; }
      // контур был пуст (зал ещё не спит) — выбирать нечего: штатная замена из запаса. Но если стоят все контуры — ядро без
      // отвода тепла (96 ч): аврал; под «беречь запас» — пересмотр советом (последняя возможность, шаг 3d)
      if (!Object.keys(rr.plan).length && !rr.left.length) {
        const core = W.independentLoops(w) === 0;
        if (core && spare && s.wearPolicy === 'reroute') { s.wearAsked = (s.wearAsked || 0) + 1; return { kind: 'wear', type: 'revise', loop: unit, plan: rr.plan, left: [], core: true, at: t }; }
        if (core && spare && wearOp(s, 'pump', rec.id, t, true)) wearNote(s, `${pumpFail(w, unit, 'ru').slice(0, -1)}; это был последний работающий контур — насос меняют авралом.`, `${pumpFail(w, unit, 'en').slice(0, -1)}; it was the last running loop — the pump is replaced all-hands.`);
        else if (spare && wearOp(s, 'pump', rec.id, t)) wearNote(s, `${pumpFail(w, unit, 'ru').slice(0, -1)}; групп на нём нет. Насос меняют из запаса.`, `${pumpFail(w, unit, 'en').slice(0, -1)}; no groups on it. The pump is being replaced from stock.`);
        else wearNote(s, `${pumpFail(w, unit, 'ru').slice(0, -1)}; групп на нём нет. Запасного насоса нет.`, `${pumpFail(w, unit, 'en').slice(0, -1)}; no groups on it. No spare pump.`);
        return null;
      }
      // «последний насос» — когда переборкой его уже не восполнить (нет клапанных комплектов или годных к переборке)
      if (spare && full && (!s.wearPolicy || (w.inv.pump === 1 && !pumpProspect(s, rec.id)))) { s.wearAsked = (s.wearAsked || 0) + 1; return { kind: 'wear', type: 'loop', loop: unit, plan: rr.plan, at: t }; }   // счёт карточек — для калибровки
      for (const g of rr.left) wearMove(s, g, t);                       // не поместились на контуры — в свободные капсулы, если есть
      // перестановка больше не покрывает отказ, а совет решил беречь запасной насос — политику пересматривает совет, а не
      // автоматика (шаг 3d.2): аврал или беречь запас дальше ценой групп на тепловом резерве
      if (!full && s.wearPolicy === 'reroute' && spare) {
        s.wearKept = Object.assign(s.wearKept || {}, Object.fromEntries(rr.left.map(g => [g, t])));   // их гибель — цена «беречь запас»
        s.wearAsked = (s.wearAsked || 0) + 1; return { kind: 'wear', type: 'revise', loop: unit, plan: rr.plan, left: rr.left, at: t }; }
      if (spare && (s.wearPolicy === 'replace' || !full) && pumpSpare(s) && wearOp(s, 'pump', rec.id, t, !full)) {   // группы без охлаждения — аврал
        const op = w.ops.find(o => !o.done && o.target === rec.id), j = op && s.jobs.list.find(x => x.ref === op.id), n = j ? j.w : 0;
        const days = j && n ? nf((JB.eta(j, t) - t) * 365.25, 1, 'ru') : null, daysEn = j && n ? nf((JB.eta(j, t) - t) * 365.25, 1, 'en') : null;
        wearNote(s, `${pumpFail(w, unit, 'ru')} ${full ? 'Группы переведены на другие контуры; насос меняют из запаса (неделя).' : n ? `Перестановкой всех групп не покрыть — насос меняют авралом: ${n} ${plural(n, ['техник', 'техника', 'техников'])}, ${days} сут.` : 'Перестановкой всех групп не покрыть, а свободных техников нет — работа ждёт.'}`,
          `${pumpFail(w, unit, 'en')} ${full ? 'The groups moved to other loops; the pump is being replaced from stock (a week).' : n ? `Rerouting cannot cover every group — an all-hands pump replacement: ${n} technician${n === 1 ? '' : 's'}, ${daysEn} days.` : 'Rerouting cannot cover every group, and no technician is free — the work waits.'}`);
        return null;
      }
      // запасного нет, а второй агромодуль цел — его насос: выбор совета (агромодуль теряется). Группы на резерве — только
      // если снятие и монтаж авралом успевают до исчерпания резерва
      if (!spare && agroDonorOK(s) && (full || donorDays(s) * 24 <= W.BUF[w.safe ? 'safe' : 'std'])) {
        s.wearAsked = (s.wearAsked || 0) + 1; return { kind: 'wear', type: 'loop', loop: unit, plan: rr.plan, at: t, donor: true, full }; }
      wearNote(s, full ? `${pumpFail(w, unit, 'ru')} Группы переведены на другие контуры: схема ${layout(w)}.${w.inv.pump ? '' : ' Запасных насосов нет.'}`
        : `${pumpFail(w, unit, 'ru')} Перестановкой всех групп не покрыть — часть зала на тепловом резерве.`,
        full ? `${pumpFail(w, unit, 'en')} The groups moved to other loops: layout ${layout(w)}.${w.inv.pump ? '' : ' No spare pumps.'}`
          : `${pumpFail(w, unit, 'en')} Rerouting cannot cover every group — part of the hall is on its thermal reserve.`);
      return null;
    }
    if (part === 'coll') return wearCollFail(s, unit, t);
    if ((part === 'cool' || part === 'ctrl') && W.groupPeople(w, unit).sleep.length > 0) wearUnit(s, unit, part, t);   // пустая группа — при заселении (wearCheckGroups)
    return null;
  }
  function wearFire(s, b) {
    const w = s.wear, t = b.at;
    if (b.kind === 'awake') { wearSync(s); w.zgDone = t; return null; }   // и производительность вахты (невесомость) — с этой даты
    if (b.kind === 'op') return wearOpDone(s, b.id, t) || dangerReask(s, t);
    if (b.kind === 'capsule') { wearDeaths(s, W.capsuleFail(w, b.id, t, wearRnd(s))); return null; }
    if (b.kind === 'med') { wearDeaths(s, W.bgDeath(w, b.id, t, wearRnd(s))); return null; }
    if (b.kind === 'buffer') { const r = W.bufferFail(w, b.id, t); wearDeaths(s, r);
      wearNote(s, `Группа ${r.group}: тепловой резерв исчерпан. Погибли ${ppl(r.ids.length)}.`, `Group ${r.group}: the thermal reserve ran out. ${r.ids.length} dead.`); return null; }
    if (b.kind === 'fail') { const r = wearRespond(s, W.fail(w, b.id, t)); if (!r) wearShop(s, t); wearCoreWarn(s, t); return r || dangerReask(s, t); }   // карточка — мастерская после решения
    if (b.kind === 'core') { wearTerminal(s, t, 'heat'); return null; }
    // опасный дефект (шаг «хрупкость» 3): обнаружен — карточка; 75% допуска — снова (если работу продолжили); допуск исчерпан —
    // тяжёлый отказ: секция выключена, группы — на другие контуры, карточка о тяжёлом ремонте
    if (b.kind === 'defect') { W.detect(w, b.id, t); return dangerAsk(s, b.id, 'open', t); }
    // шаг 4б: 75% — только прибор (решение «эксплуатировать до отказа» принято); исчерпанный допуск — разрушение основания навсегда
    if (b.kind === 'warn') { W.warnDefect(w, b.id, t); const bear = /\.bearing$/.test(b.id), u = b.id.split('.')[0], d = Math.round(W.DANGER[bear ? 'bearing' : 'radiator'].tol * 0.25 / Math.max(0.2, w.nodes[b.id].r));
      wearNote(s, bear ? `Опора кольца ${u}: израсходовано три четверти допуска — до заклинивания около ${d} суток.` : `Секция радиатора ${u}: израсходовано три четверти допуска — до разрушения около ${d} суток.`,
        bear ? `Ring ${u}'s bearing: three quarters of its margin used — about ${d} days before it seizes.` : `Radiator section ${u}: three quarters of its margin used — about ${d} days before it ruptures.`); return null; }
    if (b.kind === 'heavy') { W.isolate(w, b.id, t, true); wearCheckGroups(s, t); wearCoreWarn(s, t); if (s.jobs) JB.dispatch(s.jobs, t, pools(s));
      const bear = /\.bearing$/.test(b.id), u = b.id.split('.')[0], L = radLoop(w, b.id);
      wearNote(s, bear ? `Опора кольца ${u} заклинила и повредила посадочное место: кольцо остановлено до конца рейса — в невесомости ${ppl(W.zeroG(w).n)}.` : `Секция радиатора ${u} разрушена: основание потеряно, контур ${L} без теплоотвода до конца рейса. Схема ${layout(w)}.`,
        bear ? `Ring ${u}'s bearing seized and damaged its seat: the ring is stopped for the rest of the voyage — ${W.zeroG(w).n} people in zero-g.` : `Radiator section ${u} ruptured: its base is lost, loop ${L} has no heat rejection for the rest of the voyage. Layout ${layout(w)}.`);
      return dangerReask(s, t); }
    return null;
  }
  // ---- опасный узел (шаг «хрупкость» 3; спецификация Codex — DOC «Ревью Codex — хрупкость корабля и регламент», шаг 3):
  // единая карточка для узлов с развивающимся дефектом. Сейчас — секции радиаторов R1–R4 (секция = теплоотвод своего контура)
  const radLoop = (w, id) => W.LOOPS.find(L => w.link.rad[L] === id);
  // положение для повторов: можно ли ремонтировать и сколько групп без охлаждения (и ядро)
  const dangerSig = (s, id) => { const o = W.observe(s.wear, Math.max(s.wear.t, s.year)); return { can: dangerCan(s, id), warm: o.groups.filter(g => g.sleep && g.heat).length + (o.core.cooled ? 0 : 100), zg: o.zeroG.n }; };
  function dangerAsk(s, id, stage, t) { s.wearAsked = (s.wearAsked || 0) + 1; (s.dangerSeen = s.dangerSeen || {})[id] = dangerSig(s, id); return { kind: 'wear', type: 'danger', id, stage, at: t }; }
  // выключенная и не ремонтируемая секция: совет решает снова, когда ремонт стал возможен (материалы, комплекты) или когда
  // без охлаждения осталось больше групп, чем при прошлом решении (ядро — тоже), — один раз на каждое изменение
  function dangerReask(s, t) {
    const w = s.wear; if (!w || !wearOn(s)) return null;
    for (const id of W.dangerIds(w)) { const n = w.nodes[id];
      if (n.ok || !n.defect || pendingFor(w, id)) continue;
      const now = dangerSig(s, id), was = (s.dangerSeen || {})[id] || { can: false, warm: 0, zg: 0 };
      if (!now.can) { (s.dangerSeen = s.dangerSeen || {})[id] = Object.assign({}, was, { can: false }); continue; }   // ремонтировать нечем — запомнить
      if ((!was.can && now.can) || now.warm > was.warm || now.zg > (was.zg || 0)) return dangerAsk(s, id, n.defect.stage === 'heavy' ? 'heavy' : 'isolated', t);
    }
    return null;
  }
  // ремонт целиком: перестановка (если секция ещё работает и на контуре есть группы) и сам ремонт — хватает ли материалов
  const dangerCan = (s, id) => { const w = s.wear, L = radLoop(w, id), re = L && w.nodes[id].ok && W.loopLoad(w, L) > 0 ? WEAR_OPS.reroute : 0;
    return W.canRepairDefect(w, id, s.materials - re); };
  // срок работы по копии очереди с нынешними приоритетами и людьми (сутки; null — не начнётся за пять лет)
  function queueDays(s, spec, t) {
    const Q = JSON.parse(JSON.stringify(s.jobs)), P = pools(s), j = JB.enqueue(Q, Object.assign({ owner: 'probe', ref: 'probe', type: 'probe' }, spec), t, P);
    let x = t; for (let k = 0; k < 400; k++) { const b = JB.nextBoundary(Q, x, t + 5); if (!b) return null; x = b.at; const done = JB.step(Q, b.job.id, x, P); if (done && done.id === j.id) return (x - t) * 365.25; }
    return null;
  }
  // во что обойдётся выключение секции: схема и старение перегруженных насосов (на копии модели)
  function dangerAfter(w, id, t) {
    const c = JSON.parse(JSON.stringify(w)), L = radLoop(c, id); if (c.nodes[id].ok) W.isolate(c, id, t);
    const r = W.reroutePlan(c, L); W.relink(c, r.plan, t);
    return { layout: layout(c), over: W.overAge(c), left: r.left.length };
  }
  // ---- опора кольца (шаг 3в–3г): износ дорожки → заклинивание; остановка кольца — места колец, люди в невесомости, вахта слабее
  function wearRingDecision(s, ev) {
    const id = ev.id, H = id.split('.')[0], stage = ev.stage, Dg = W.DANGER.bearing, open = stage === 'open' || stage === 'warn';
    const R = x => W.dangerRecipe(x.wear, id), can = x => dangerCan(x, id);
    const left = x => Math.max(0, (Dg.tol - W.defectAt(x.wear.nodes[id], x.year)) / Math.max(0.2, x.wear.nodes[id].r));
    // кольцо остановлено (на копии): сколько в невесомости и сколько специалистов; срок ремонта — по копии очереди
    const stopped = x => { const c = JSON.parse(JSON.stringify(x)); if (c.wear.nodes[id].ok) W.isolate(c.wear, id, c.year); return { c, zg: W.zeroG(c.wear).n, tech: techs(c), was: techs(x) }; };
    const days = x => { const r = R(x), st = stopped(x); return queueDays(st.c, { prio: JB.PRIO.path, pool: 'tech', minW: 1, maxW: 4, work: r.work, hold: r.hold }, st.c.year); };
    const zgLine = (x, ru, forever) => { const st = stopped(x);
      return ru ? `${st.zg ? `${ppl(st.zg)} ${forever ? 'до конца рейса' : 'на время ремонта'} работают в невесомости: специалистов вахты ${st.tech} вместо ${st.was}` : 'Мест во втором кольце хватает всем на ногах'}.`
        : `${st.zg ? `${st.zg} people work in zero-g ${forever ? 'for the rest of the voyage' : 'during the repair'}: ${st.tech} specialists on watch instead of ${st.was}` : 'The other ring has room for everyone awake'}.`; };
    const cost = (x, ru) => { const r = R(x), d = days(x), heavy = r === Dg.alt, q = d == null ? (ru ? 'по очереди работ не начнётся: людей нет' : 'the work queue will not start it: no people')
        : (ru ? `по очереди работ — около ${nf(d, 0, 'ru')} суток` : `about ${nf(d, 0, 'en')} days by the work queue`);
      const last = heavy && x.wear.inv.trackKit === 1;
      return ru ? `Ремонт — ${heavy ? `дорожка с роликами (${last ? 'последняя' : `комплектов дорожки: ${x.wear.inv.trackKit}`})` : `ролики (комплектов: ${x.wear.inv.rollerKit})`}, материалы −${r.materials}%, ${r.work} чел.-сут и ${r.hold} суток обкатки; ${q}.`
        : `The repair takes ${heavy ? `a track with rollers (${last ? 'the last one' : `track kits: ${x.wear.inv.trackKit}`})` : `rollers (kits: ${x.wear.inv.rollerKit})`}, materials −${r.materials}%, ${r.work} person-days and ${r.hold} days of running-in; ${q}.`; };
    const head = (x, ru) => {
      if (stage === 'open') return ru ? `Опора кольца ${H}: растут вибрация и момент привода, в смазке — частицы износа дорожки. Кольцо ещё вращается, но повреждение развивается — около ${nf(left(x), 0, 'ru')} суток вращения до заклинивания.`
        : `Ring ${H}'s bearing: vibration and drive torque are rising, the lubricant carries track wear particles. The ring still rotates, but the damage is growing — about ${nf(left(x), 0, 'en')} days of rotation before it seizes.`;
      if (stage === 'warn') return ru ? `Опора кольца ${H}: три четверти допуска израсходованы, до заклинивания — около ${nf(left(x), 0, 'ru')} суток.` : `Ring ${H}'s bearing: three quarters of its margin are used, about ${nf(left(x), 0, 'en')} days before it seizes.`;
      const z = W.zeroG(x.wear).n;
      return (stage === 'heavy' ? (ru ? `Опора кольца ${H} заклинила: кольцо остановлено.` : `Ring ${H}'s bearing has seized: the ring is stopped.`) : (ru ? `Кольцо ${H} остановлено.` : `Ring ${H} is stopped.`))
        + (ru ? ` В невесомости работают ${ppl(z)}; специалистов вахты — ${techs(x)}.` : ` ${z} people work in zero-g; ${techs(x)} specialists on watch.`); };
    const repair = { id: 'repair', label: { ru: open ? 'Остановить кольцо и ремонтировать' : 'Ремонтировать опору', en: open ? 'Stop the ring and repair it' : 'Repair the bearing' },
      known: { ru: y => [cost(y, true), zgLine(y, true, false)], en: y => [cost(y, false), zgLine(y, false, false)] },
      effect: y => { const w = y.wear; if (w.nodes[id].ok) W.isolate(w, id, y.year);
        const op = wearOp(y, 'ring', id, y.year, false); (y.danger = y.danger || {})[id] = op ? 'repair' : 'isolate'; JB.dispatch(y.jobs, y.year, pools(y));
        if (!op) wearNote(y, `Ремонт опоры кольца ${H} не начат: материалов или комплектов не хватило. Кольцо остановлено.`, `The repair of ring ${H}'s bearing did not start: not enough materials or kits. The ring is stopped.`); },
      record: { ru: `Кольцо ${H} тормозят и ремонтируют опору.`, en: `Ring ${H} is braked and its bearing repaired.` } };
    const stop = { id: 'isolate', label: { ru: 'Остановить кольцо', en: 'Stop the ring' },
      known: { ru: y => [zgLine(y, true, true), 'Комплекты и материалы целы; износ дальше не развивается.'], en: y => [zgLine(y, false, true), 'The kits and materials are kept; the wear stops growing.'] },
      effect: y => { W.isolate(y.wear, id, y.year); (y.danger = y.danger || {})[id] = 'isolate'; JB.dispatch(y.jobs, y.year, pools(y)); },
      record: { ru: `Кольцо ${H} останавливают; лишние переходят в невесомость.`, en: `Ring ${H} is stopped; the extra people move to zero-g.` } };
    const cont = { id: 'continue', label: { ru: 'Вращать до отказа', en: 'Rotate it to failure' },
      known: { ru: y => [`Кольцо вращается около ${nf(left(y), 0, 'ru')} суток; затем опора заклинит и повредит посадочное место — кольцо остановлено до конца рейса, ремонта нет.`, 'Решение окончательное: дальше — только предупреждение прибора.'],
        en: y => [`The ring rotates for about ${nf(left(y), 0, 'en')} days; then the bearing seizes and damages its seat — the ring is stopped for the rest of the voyage, with no repair.`, 'The decision is final: from here on, only an instrument warning.'] },
      effect: y => { (y.danger = y.danger || {})[id] = 'continue'; },
      record: { ru: `Кольцо ${H} вращается; за опорой следят.`, en: `Ring ${H} keeps rotating, its bearing under watch.` } };
    const leave = { id: 'leave', label: { ru: 'Оставить кольцо остановленным', en: 'Leave the ring stopped' },
      known: { ru: y => [`Комплекты и материалы — на другое.`, zgLine(y, true, true)], en: y => ['The kits and materials are kept for other work.', zgLine(y, false, true)] },
      effect: y => { (y.danger = y.danger || {})[id] = 'leave'; },
      record: { ru: `Опору кольца ${H} не ремонтируют; кольцо стоит.`, en: `Ring ${H}'s bearing is not repaired; the ring stays stopped.` } };
    return {
      id: 'd.wear.danger', key: id, stage, scene: 'vault', kind: 'decision',
      title: { ru: open ? `Опасный узел: опора кольца ${H}` : `Кольцо ${H} остановлено`, en: open ? `A dangerous node: ring ${H}'s bearing` : `Ring ${H} is stopped` },
      rec: x => can(x) ? { id: 'repair', why: open ? (R(x) === Dg.alt ? { ru: 'износ дорожки сам не остановится; роликов нет — меняют дорожку, пока опора не заклинила', en: 'track wear does not stop by itself; there are no rollers — the track is replaced before the bearing seizes' }
            : { ru: 'износ дорожки сам не остановится; после заклинивания кольцо не вернуть', en: 'track wear does not stop by itself; after seizure the ring cannot be restored' })
          : { ru: 'без кольца вахта работает слабее, и регламент отстаёт', en: 'without the ring the watch works slower, and maintenance falls behind' } }
        : { id: open ? 'isolate' : 'leave', why: { ru: 'ремонтировать нечем — кольцо останавливают, пока опора цела', en: 'there is nothing to repair it with — the ring is stopped while the bearing is intact' } },
      context: { ru: x => `${head(x, true)}${can(x) ? '' : ' Ремонтировать нечем: ' + ((x.wear.inv[R(x).kit] || 0) < R(x).kits ? 'комплектов не хватает.' : 'материалов не хватает.')}`,
        en: x => `${head(x, false)}${can(x) ? '' : ' There is nothing to repair it with: ' + ((x.wear.inv[R(x).kit] || 0) < R(x).kits ? 'not enough kits.' : 'not enough materials.')}` },
      options: x => dangerOwn(id, (can(x) ? [repair] : []).concat(open ? [stop, cont] : [leave]))
    };
  }
  // решение совета по опасному узлу: положение после него запоминается — своя остановка не повод спрашивать снова
  const dangerOwn = (id, opts) => opts.map(o => Object.assign({}, o, { effect: y => { if (o.effect) o.effect(y); (y.dangerSeen = y.dangerSeen || {})[id] = dangerSig(y, id); } }));
  function wearDangerDecision(s, ev) {
    if (/\.bearing$/.test(ev.id)) return wearRingDecision(s, ev);
    const id = ev.id, stage = ev.stage, Dg = W.DANGER.radiator, open = stage === 'open' || stage === 'warn';
    const L = x => radLoop(x.wear, id), R = x => W.dangerRecipe(x.wear, id), can = x => dangerCan(x, id);
    const days = x => { const r = R(x), c = JSON.parse(JSON.stringify(x)); if (c.wear.nodes[id].ok) W.isolate(c.wear, id, c.year); wearCheckGroups(c, c.year);
      const u = urgentOf(c);
      return queueDays(c, { prio: u ? JB.PRIO.rescue : JB.PRIO.path, deadline: u ? c.year + W.BUF[c.wear.safe ? 'safe' : 'std'] / 8766 : Infinity,   // как у wearOp
        pool: 'tech', minW: 1, maxW: u ? Infinity : 2, work: r.work, hold: r.hold }, c.year); };
    const left = x => Math.max(0, (Dg.tol - W.defectAt(x.wear.nodes[id], x.year)) / Math.max(0.2, x.wear.nodes[id].r));
    const head = (x, ru) => { const l = L(x);
      if (stage === 'open') return ru ? `Течь секции радиатора ${id}: температура обратки контура ${l} растёт. Секция ещё отводит тепло, но повреждение развивается — около ${nf(left(x), 0, 'ru')} суток работы при нынешней нагрузке до разрушения.`
        : `A leak in radiator section ${id}: loop ${l}'s return temperature is rising. The section still rejects heat, but the damage is growing — about ${nf(left(x), 0, 'en')} days of work at today's load before it ruptures.`;
      if (stage === 'warn') return ru ? `Секция ${id} работает с течью: три четверти допуска израсходованы, до разрушения — около ${nf(left(x), 0, 'ru')} суток.` : `Section ${id} runs with a leak: three quarters of its margin are used, about ${nf(left(x), 0, 'en')} days before it ruptures.`;
      if (stage === 'heavy') return ru ? `Секция ${id} разрушена: теплоноситель потерян, контур ${l} стоит. Автоматика перевела группы на другие контуры: схема ${layout(x.wear)}.` : `Section ${id} has ruptured: the coolant is lost, loop ${l} is down. The automation moved the groups to other loops: layout ${layout(x.wear)}.`;
      return ru ? `Секция ${id} выключена, контур ${l} стоит — а теперь часть зала без охлаждения: схема ${layout(x.wear)}.` : `Section ${id} is off and loop ${l} is down — and now part of the hall is uncooled: layout ${layout(x.wear)}.`; };
    const cost = (x, ru) => { const r = R(x), d = days(x), q = d == null ? (ru ? 'по очереди работ не начнётся: людей нет' : 'the work queue will not start it: no people')
        : (ru ? `по очереди работ — около ${nf(d, 0, 'ru')} суток` : `about ${nf(d, 0, 'en')} days by the work queue`);
      return ru ? `Ремонт — ${r.kits === 1 ? 'секционный комплект' : `${r.kits} секционных комплекта`} (в запасе ${x.wear.inv.radKit}), материалы −${r.materials}%, ${r.work} чел.-сут и ${r.hold} суток опрессовки; ${q}.`
        : `The repair takes ${r.kits === 1 ? 'a section kit' : `${r.kits} section kits`} (${x.wear.inv.radKit} in stock), materials −${r.materials}%, ${r.work} person-days and ${r.hold} days of pressure testing; ${q}.`; };
    // без секции: схема, старение и группы, которым не хватит места (их тепловой резерв короче ремонта — переложат, если есть капсулы)
    const after = (x, ru) => { const a = dangerAfter(x.wear, id, x.year), hrs = W.BUF[x.wear.safe ? 'safe' : 'std'];
      return ru ? `Без секции схема станет ${a.layout}; перегруженные насосы стареют в ${nf(a.over, 1, 'ru')} раза быстрее.${a.left ? ` ${a.left} ${plural(a.left, ['группа', 'группы', 'групп'])} не помещается на другие контуры: тепловой резерв — ${hrs} ч, дольше ремонта не продержится; спасти — только перекладкой в свободные капсулы.` : ''}`
        : `Without the section the layout becomes ${a.layout}; the overloaded pumps age ${nf(a.over, 1, 'en')} times faster.${a.left ? ` ${a.left} group${a.left === 1 ? '' : 's'} will not fit on other loops: the thermal reserve is ${hrs} h, shorter than the repair; only moving them into free capsules can save them.` : ''}`; };
    const urgentOf = x => { const o = W.observe(x.wear, x.year); return !o.core.cooled || o.groups.some(g => g.sleep && g.heat); };
    const repair = { id: 'repair', label: { ru: open ? 'Выключить секцию и ремонтировать' : 'Ремонтировать секцию', en: open ? 'Shut the section and repair it' : 'Repair the section' },
      known: { ru: y => [cost(y, true), open ? after(y, true) : 'Контур вернётся, когда опрессовка пройдёт.'], en: y => [cost(y, false), open ? after(y, false) : 'The loop returns once the pressure test passes.'] },
      effect: y => { const w = y.wear; if (w.nodes[id].ok) W.isolate(w, id, y.year); wearCheckGroups(y, y.year);
        const op = wearOp(y, 'rad', id, y.year, urgentOf(y)); (y.danger = y.danger || {})[id] = op ? 'repair' : 'isolate';
        if (!op) wearNote(y, `Ремонт секции ${id} не начат: материалов или комплектов не хватило. Секция выключена.`, `The repair of section ${id} did not start: not enough materials or kits. The section is off.`);
        wearCoreWarn(y, y.year); },
      record: { ru: `Секцию ${id} выключают и ремонтируют.`, en: `Section ${id} is shut and repaired.` } };
    const isolate = { id: 'isolate', label: { ru: 'Изолировать секцию', en: 'Isolate the section' },
      known: { ru: y => [after(y, true), 'Комплекты и материалы целы; дефект дальше не развивается.'], en: y => [after(y, false), 'The kits and materials are kept; the damage stops growing.'] },
      effect: y => { W.isolate(y.wear, id, y.year); wearCheckGroups(y, y.year); (y.danger = y.danger || {})[id] = 'isolate'; wearCoreWarn(y, y.year); },
      record: { ru: `Секцию ${id} изолируют; контур остаётся выключенным.`, en: `Section ${id} is isolated; the loop stays off.` } };
    const cont = { id: 'continue', label: { ru: 'Эксплуатировать до отказа', en: 'Run it to failure' },
      known: { ru: y => [`Контур работает около ${nf(left(y), 0, 'ru')} суток; затем секция разрушится — теплоотвод контура ${L(y)} потерян до конца рейса, ремонта нет.`, 'Решение окончательное: дальше — только предупреждение прибора.'],
        en: y => [`The loop runs for about ${nf(left(y), 0, 'en')} days; then the section ruptures — loop ${L(y)} loses its heat rejection for the rest of the voyage, with no repair.`, 'The decision is final: from here on, only an instrument warning.'] },
      effect: y => { (y.danger = y.danger || {})[id] = 'continue'; },
      record: { ru: `Секция ${id} работает с течью; за ней следят.`, en: `Section ${id} runs with a leak, under watch.` } };
    const leave = { id: 'leave', label: { ru: 'Оставить контур выключенным', en: 'Leave the loop off' },
      known: { ru: y => [`Комплекты (${y.wear.inv.radKit}) и материалы — на другое.`, `Схема ${layout(y.wear)}: перегруженные насосы стареют в ${nf(W.overAge(y.wear), 1, 'ru')} раза быстрее.`],
        en: y => [`The kits (${y.wear.inv.radKit}) and materials are kept for other work.`, `Layout ${layout(y.wear)}: the overloaded pumps age ${nf(W.overAge(y.wear), 1, 'en')} times faster.`] },
      effect: y => { (y.danger = y.danger || {})[id] = 'leave'; },
      record: { ru: `Секцию ${id} не ремонтируют; контур остаётся выключенным.`, en: `Section ${id} is not repaired; the loop stays off.` } };
    return {
      id: 'd.wear.danger', key: id, stage, scene: 'vault', kind: 'decision',
      title: { ru: open ? `Опасный узел: секция радиатора ${id}` : `Секция радиатора ${id} выключена`, en: open ? `A dangerous node: radiator section ${id}` : `Radiator section ${id} is off` },
      rec: x => can(x) ? { id: 'repair', why: open ? { ru: 'течь не остановится сама; после разрушения контур не вернуть', en: 'a leak does not stop by itself; after a rupture the loop cannot be restored' }
          : { ru: `без контура остальные насосы перегружены и стареют в ${nf(W.overAge(x.wear), 1, 'ru')} раза быстрее`, en: `without the loop the other pumps are overloaded and age ${nf(W.overAge(x.wear), 1, 'en')} times faster` } }
        : { id: open ? 'isolate' : 'leave', why: { ru: 'ремонтировать нечем — секцию выключают, пока она цела', en: 'there is nothing to repair it with — the section is shut while it is intact' } },
      context: { ru: x => `${head(x, true)}${can(x) ? '' : ' Ремонтировать нечем: ' + (x.wear.inv.radKit < R(x).kits ? 'секционных комплектов не хватает.' : 'материалов не хватает.')}`,
        en: x => `${head(x, false)}${can(x) ? '' : ' There is nothing to repair it with: ' + (x.wear.inv.radKit < R(x).kits ? 'not enough section kits.' : 'not enough materials.')}` },
      options: x => dangerOwn(id, (can(x) ? [repair] : []).concat(open ? [isolate, cont] : [leave]))
    };
  }
  // граница модели износа в [t0, t1]: смена числа бодрствующих (годы 2, 8, прибытие — пока не применена, в том числе на
  // дате, где уже сработал другой источник) — раньше отказов той же даты; затем граница модели
  function wearNext(s, t0, t1) {
    if (!wearOn(s) || !s.wear) return null;
    const zgEdge = y => (Math.abs(y - 8) < 1e-9 || Math.abs(y - arriveView(s)) < 1e-9) && W.RINGS.some(H => !W.ringRuns(w, H)) && !(w.zgDone >= y - 1e-9);   // невесомость начинает или перестаёт считаться
    const w = s.wear, aw = awakeAt(s).filter(y => y >= t0 - 1e-12 && y <= t1 && (awakeNowAt(s, y) !== w.watchN || zgEdge(y))).sort((a, b) => a - b)[0];
    const b2 = W.nextBoundary(w, t0, aw != null ? aw : t1, wearRnd(s));
    const nx = aw != null && !(b2 && b2.at < aw - 1e-12) ? { at: Math.max(t0, aw), kind: 'awake', id: 'awake' } : b2;
    if (!nx) return null;
    return { at: nx.at, cause: `wear.${nx.kind}.${nx.id}`, go: () => { s.year = Math.max(s.year, nx.at); return wearFire(s, nx); } };
  }
  // карточка «Контур остановлен»: автоматика уже перевела группы; выбор — вернуть независимую схему или беречь запас
  function wearDecision(s, ev) {
    if (ev.donor) return wearDonorDecision(s, ev);
    if (ev.type === 'revise') return wearReviseDecision(s, ev);
    if (ev.type === 'shop') return wearShopDecision(s, ev);
    if (ev.type === 'reg') return wearRegDecision(s, ev);
    if (ev.type === 'danger') return wearDangerDecision(s, ev);
    const L = ev.loop, full = true, moved = Object.keys(ev.plan || {});   // карточка — только когда перестановка покрыла все группы
    return {
      id: 'd.wear.loop', scene: 'vault', overlay: 'sleepers', kind: 'decision',
      title: { ru: `Контур ${L} остановлен`, en: `Loop ${L} stopped` },
      rec: x => ({ id: 'replace', why: { ru: 'независимая схема переживёт следующий отказ контура', en: 'an independent layout survives the next loop failure' } }),
      context: {
        ru: x => { const w = x.wear, o = W.observe(w);
          return `${pumpFail(w, L, 'ru')} ` + (full ? `Автоматика перевела ${moved.length} ${plural(moved.length, ['группу', 'группы', 'групп'])} на другие контуры: схема ${layout(w)}, предел контура — ${W.budget(w).gcap} групп рядом с долей ядра. ${(n => n ? `Свободной мощности — на ${n === 1 ? 'одну группу' : `${n} ${plural(n, ['группу', 'группы', 'групп'])}`}.` : 'Свободной мощности больше нет.')(o.loops.reduce((a, l) => a + (l.runs ? l.max - l.load : 0), 0))}`
            : `Перевести все группы на другие контуры нельзя: часть зала на тепловом резерве — ${W.BUF[w.safe ? 'safe' : 'std']} часов.`) + ` Насосов в запасе: ${w.inv.pump}.`; },
        en: x => { const w = x.wear, o = W.observe(w);
          return `${pumpFail(w, L, 'en')} ` + (full ? `The automation moved ${moved.length} group${moved.length === 1 ? '' : 's'} to other loops: layout ${layout(w)}, loop limit ${W.budget(w).gcap} groups beside the core's share.`
            : `Not every group can move to other loops: part of the hall is on its thermal reserve — ${W.BUF[w.safe ? 'safe' : 'std']} hours.`) + ` Spare pumps: ${w.inv.pump}.`; }
      },
      options: x => [{
        id: 'replace',
        label: { ru: 'Поставить запасной насос', en: 'Fit a spare pump' },
        known: {
          ru: y => [`Неделя работы двух механиков; насос из запаса (останется ${y.wear.inv.pump - 1}), материалы −${WEAR_OPS.pump}%.`, full ? 'Группы вернутся на свой контур; независимая схема восстановится.' : 'Группы без охлаждения ждут неделю — дольше их теплового резерва.', `Коллектор ${L} остаётся прежним.`],
          en: y => [`A week for two mechanics; a pump from stock (${y.wear.inv.pump - 1} left), materials −${WEAR_OPS.pump}%.`, full ? 'The groups return to their loop; the independent layout is restored.' : 'The uncooled groups wait a week — longer than their thermal reserve.', `The ${L} collector stays the old one.`]
        },
        cost: y => { y.materials -= WEAR_OPS.pump; },
        effect: y => { y.wearPolicy = 'replace'; wearOp(y, 'pump', `${L}.pump`, y.year); wearShop(y, y.year); },
        record: { ru: `Запасной насос ${L} ставят; группы вернутся на свой контур через неделю.`, en: `A spare ${L} pump is being fitted; the groups return to their loop in a week.` }
      }].concat(full ? [{
        id: 'reroute',
        label: { ru: 'Оставить перестановку', en: 'Keep the rerouting' },
        known: {
          ru: y => ['Насос остаётся в запасе.', `Схема ${layout(y.wear)}: перегруженные насосы стареют в ${nf(W.overAge(y.wear), 1, 'ru')} раза быстрее.`,
            `Следующий отказ контура перестановкой не покрыть: насос будут менять авралом, всеми техниками вахты (${auralDays(y) < Infinity ? `${nf(auralDays(y), 1, 'ru')} сут. при нынешней вахте` : 'техников сверх регламента нет'}), а теплового резерва у групп — ${W.BUF[y.wear.safe ? 'safe' : 'std']} часов.`],
          en: y => ['The pump stays in stock.', `Layout ${layout(y.wear)}: the overloaded pumps age ${nf(W.overAge(y.wear), 1, 'en')} times faster.`,
            `The next loop failure cannot be covered by rerouting: the pump will be replaced all-hands, by every technician of the watch (${auralDays(y) < Infinity ? `${nf(auralDays(y), 1, 'en')} days with today's watch` : 'no technician is free of routine'}), and the groups' thermal reserve is ${W.BUF[y.wear.safe ? 'safe' : 'std']} hours.`]
        },
        effect: y => { y.wearPolicy = 'reroute'; wearShop(y, y.year); },
        record: { ru: `Контур ${L} остаётся выключенным; группы работают на трёх контурах.`, en: `Loop ${L} stays off; the groups run on three loops.` }
      }] : [])
    };
  }
  // «Перестановкой не покрыть»: совет решил беречь запасной насос, а следующий отказ контура перестановкой уже не закрыть
  function wearReviseDecision(s, ev) {
    const L = ev.loop, left = ev.left || [];
    const people = x => left.reduce((a, g) => a + W.groupPeople(x.wear, g).sleep.length, 0);
    const inTime = x => auralDays(x) * 24 <= (ev.core ? W.coreAt(x.wear, x.year) : W.BUF[x.wear.safe ? 'safe' : 'std']);   // ядро — его оставшийся запас
    return {
      id: 'd.wear.revise', scene: 'vault', overlay: 'sleepers', kind: 'decision',
      title: { ru: `Контур ${L} остановлен: перестановкой не покрыть`, en: `Loop ${L} stopped: rerouting cannot cover it` },
      rec: x => ({ id: 'replace', why: { ru: 'группы на тепловом резерве — люди; насос в запасе для этого и лежит', en: 'the groups on thermal reserve are people; the spare pump is there for exactly this' } }),
      context: {
        ru: x => `${pumpFail(x.wear, L, 'ru')} ` + (ev.core ? `Это был последний работающий контур: ядро без отвода тепла, тепловой запас — ${W.CORE_BUF} часов.`
          : `Перестановкой всех групп не покрыть: на тепловом резерве ${left.length} ${plural(left.length, ['группа', 'группы', 'групп'])} — ${W.BUF[x.wear.safe ? 'safe' : 'std']} часов.`) + ` Совет прежде решил беречь запасной насос и оставить перестановку; насосов в запасе: ${x.wear.inv.pump}.`,
        en: x => `${pumpFail(x.wear, L, 'en')} ` + (ev.core ? `It was the last running loop: the core has no heat rejection, its thermal reserve is ${W.CORE_BUF} hours.`
          : `Rerouting cannot cover every group: ${left.length} group${left.length === 1 ? '' : 's'} on thermal reserve — ${W.BUF[x.wear.safe ? 'safe' : 'std']} hours.`) + ` Earlier the council chose to keep the spare pump and the rerouting; spare pumps: ${x.wear.inv.pump}.`
      },
      options: x => [{
        id: 'replace',
        label: { ru: 'Поставить насос авралом', en: 'Fit a pump all-hands' },
        known: {
          ru: y => [`Все свободные техники: около ${nf(auralDays(y) * 24, 0, 'ru')} ч; насос из запаса (останется ${y.wear.inv.pump - 1}), материалы −${WEAR_OPS.pump}%.`,
            ev.core ? (inTime(y) ? 'Ядро дождётся монтажа.' : `До исчерпания запаса ядра не успеть: рейс окончится через ${nf(W.coreAt(y.wear, y.year), 0, 'ru')} ч.`)
              : inTime(y) ? 'Группы на тепловом резерве дождутся монтажа.' : 'До исчерпания резерва не успеть — группы на резерве погибнут и так.', 'Политика меняется: насосы ставят из запаса, прежде оставленные контуры восстанавливают.'],
          en: y => [`Every free technician: about ${nf(auralDays(y) * 24, 0, 'en')} h; a pump from stock (${y.wear.inv.pump - 1} left), materials −${WEAR_OPS.pump}%.`,
            ev.core ? (inTime(y) ? 'The core holds out until it is fitted.' : `It cannot be done before the core's reserve runs out: the voyage ends in ${nf(W.coreAt(y.wear, y.year), 0, 'en')} h.`)
              : inTime(y) ? 'The groups on thermal reserve hold out until it is fitted.' : 'It cannot be done before the reserve runs out — the groups on reserve die anyway.', 'The policy changes: pumps are fitted from stock, loops left off earlier are restored.']
        },
        cost: y => { y.materials -= WEAR_OPS.pump; },
        effect: y => { y.wearPolicy = 'replace'; wearOp(y, 'pump', `${L}.pump`, y.year, true); wearRefit(y, y.year); wearShop(y, y.year); },
        record: { ru: `Насос ${L} ставят авралом; совет отказывается от экономии запаса.`, en: `The ${L} pump is fitted all-hands; the council drops the stock-saving policy.` }
      }, {
        id: 'keep',
        label: { ru: 'Беречь запас дальше', en: 'Keep saving the stock' },
        known: {
          ru: y => ['Насос остаётся в запасе.', ev.core ? `Ядро без отвода тепла: через ${W.CORE_BUF} часов рейс окончен.` : `Группы на тепловом резерве погибнут: около ${ppl(people(y))}.`, 'Следующий отказ контура — то же решение; без контуров ядро держится 96 часов.'],
          en: y => ['The pump stays in stock.', ev.core ? `The core has no heat rejection: in ${W.CORE_BUF} hours the voyage is over.` : `The groups on thermal reserve will die: about ${people(y)} people.`, 'The next loop failure brings the same decision; with no loops the core holds for 96 hours.']
        },
        effect: y => { wearShop(y, y.year); },
        record: { ru: `Контур ${L} не восстанавливают; группы на тепловом резерве остаются без охлаждения.`, en: `Loop ${L} is not restored; the groups on thermal reserve stay without cooling.` }
      }]
    };
  }
  // политика мастерской — при первом снятом насосе: держать готовый резерв, перебирать по нужде или беречь комплекты
  function wearShopDecision(s, ev) {
    const rb = x => { const sn = W.removedOf(x.wear, 'pump').find(y => W.canRebuild(x.wear, y)); return sn != null ? W.quoteRebuild(x.wear, sn, prodOf(x)) : null; };
    const cost = (x, lang) => { const q = rb(x); return q ? (lang === 'ru' ? `переборка насоса — ${q.days} суток двух специалистов, материалы −${nf(q.materials, 1, 'ru')}%, клапанный комплект (их ${x.wear.inv.valve})`
      : `a pump rebuild takes ${q.days} days of two specialists, materials −${nf(q.materials, 1, 'en')}%, a valve kit (${x.wear.inv.valve} left)`) : ''; };
    return {
      id: 'd.wear.shop', scene: 'vault', kind: 'decision',
      title: { ru: 'Мастерская: что делать со снятыми насосами', en: 'The workshop: what to do with removed pumps' },
      rec: x => ({ id: 'reserve', why: { ru: 'переборка идёт месяцами — готовый насос нужен до отказа, а не после', en: 'a rebuild takes months — a ready pump is needed before the failure, not after it' } }),
      context: {
        ru: x => `Насос заменён из запаса; снятый годен к переборке. Насосов в запасе: ${x.wear.inv.pump}; ${cost(x, 'ru')}. Переборка — это и ресурс: перебранный насос служит меньше заводского.`,
        en: x => `A pump was replaced from stock; the removed one can be rebuilt. Spare pumps: ${x.wear.inv.pump}; ${cost(x, 'en')}. A rebuild also costs life: a rebuilt pump lasts less than a factory one.`
      },
      options: x => [{
        id: 'reserve', label: { ru: 'Держать готовый насос', en: 'Keep a pump ready' },
        known: { ru: y => ['Перебирают, как только готовых насосов не остаётся: замена — неделя, а не месяцы.', 'Комплекты и материалы расходуются заранее.'],
          en: y => ['A rebuild starts as soon as no ready pump is left: a replacement takes a week, not months.', 'Kits and materials are spent in advance.'] },
        effect: y => { y.shopPolicy = 'reserve'; wearShop(y, y.year); },
        record: { ru: 'Мастерская держит готовый насос.', en: 'The workshop keeps a pump ready.' }
      }, {
        id: 'paths', label: { ru: 'Перебирать, когда контур встанет', en: 'Rebuild when a loop stops' },
        known: { ru: y => ['Комплекты и материалы целы, пока всё работает.', 'Отказ без запаса — контур стоит, пока идёт переборка: месяцы на перестановке или без охлаждения части зала.'],
          en: y => ['Kits and materials are kept while everything works.', 'A failure with no spare — the loop stays down during the rebuild: months on rerouting, or part of the hall uncooled.'] },
        effect: y => { y.shopPolicy = 'paths'; wearShop(y, y.year); },
        record: { ru: 'Мастерская перебирает насосы только по нужде.', en: 'The workshop rebuilds pumps only when needed.' }
      }, {
        id: 'defer', label: { ru: 'Не перебирать — беречь комплекты', en: 'No rebuilds — save the kits' },
        known: { ru: y => ['Клапанные комплекты и материалы остаются на другое.', 'Когда кончится запас насосов, отказавший контур не восстановить.'],
          en: y => ['The valve kits and materials stay for other work.', 'When the spare pumps run out, a failed loop cannot be restored.'] },
        effect: y => { y.shopPolicy = 'defer'; },
        record: { ru: 'Мастерская насосы не перебирает.', en: 'The workshop does not rebuild pumps.' }
      }]
    };
  }
  // «Контур остановлен», запасного насоса нет: насос второго агромодуля (агромодуль у цели теряется) или ждать — перестановка
  // и переборка; если часть зала на тепловом резерве — ждать значит потерять эти группы
  function wearDonorDecision(s, ev) {
    const L = ev.loop, full = ev.full !== false, moved = Object.keys(ev.plan || {});
    const reb = x => { const w = x.wear, op = w.ops.find(o => !o.done && o.kind === 'rebuild' && o.fam === 'pump'), j = op && x.jobs.list.find(q => q.ref === op.id);
      return j ? Math.max(0, (JB.eta(j, x.year) - x.year) * 365.25) : null; };
    const wait = (x, lang) => { const d = reb(x), ru = lang === 'ru';
      return d != null ? (ru ? `Насос на переборке будет готов примерно через ${nf(d, 0, 'ru')} сут.` : `The pump in rebuild will be ready in about ${nf(d, 0, 'en')} days.`)
        : pumpProspect(x, `${L}.pump`) ? (ru ? 'Отказавший насос переберут в мастерской — недели работы.' : 'The failed pump will be rebuilt in the workshop — weeks of work.')
        : (ru ? 'Запасного насоса не будет: перебирать нечего или нечем.' : 'There will be no spare pump: nothing left to rebuild, or nothing to rebuild with.'); };
    return {
      id: 'd.wear.loop', scene: 'vault', overlay: 'sleepers', kind: 'decision',
      title: { ru: `Контур ${L} остановлен`, en: `Loop ${L} stopped` },
      rec: x => full && pumpProspect(x, `${L}.pump`) ? { id: 'reroute', why: { ru: 'перестановка держит зал, а насос переберут — агромодуль сохранится', en: 'the rerouting holds the hall and the pump will be rebuilt — the agro module is kept' } }
        : { id: 'donor', why: { ru: full ? 'запасного насоса не будет — без него следующий отказ контура не закрыть' : 'иначе группы на тепловом резерве погибнут', en: full ? 'there will be no spare pump — without one the next loop failure cannot be covered' : 'otherwise the groups on thermal reserve die' } },
      context: {
        ru: x => `${pumpFail(x.wear, L, 'ru')} ` + (full ? `Автоматика перевела ${moved.length} ${plural(moved.length, ['группу', 'группы', 'групп'])} на другие контуры: схема ${layout(x.wear)}.`
          : `Перевести все группы на другие контуры нельзя: часть зала на тепловом резерве — ${W.BUF[x.wear.safe ? 'safe' : 'std']} часов.`) + ` Запасных насосов нет. ${wait(x, 'ru')} Такой же насос стоит во втором агромодуле.`,
        en: x => `${pumpFail(x.wear, L, 'en')} ` + (full ? `The automation moved ${moved.length} group${moved.length === 1 ? '' : 's'} to other loops: layout ${layout(x.wear)}.`
          : `Not every group can move to other loops: part of the hall is on its thermal reserve — ${W.BUF[x.wear.safe ? 'safe' : 'std']} hours.`) + ` No spare pumps. ${wait(x, 'en')} The second agro module carries the same pump.`
      },
      options: x => [{
        id: 'donor',
        label: { ru: 'Поставить насос второго агромодуля', en: "Fit the second agro module's pump" },
        known: {
          ru: y => [`Снять насос агромодуля и поставить в контур: ${full ? 'две бригады, около двух недель' : `авралом, около ${nf(donorDays(y), 1, 'ru')} сут.`}; материалы −${nf(DONOR.materials + WEAR_OPS.pump, 1, 'ru')}%.`,
            'Второй агромодуль больше не работает: у цели его не будет.', full ? 'Независимая схема восстановится.' : 'Группы на тепловом резерве дождутся монтажа.'],
          en: y => [`Take the agro module's pump and fit it to the loop: ${full ? 'two crews, about two weeks' : `all hands, about ${nf(donorDays(y), 1, 'en')} days`}; materials −${nf(DONOR.materials + WEAR_OPS.pump, 1, 'en')}%.`,
            'The second agro module stops working: there will be none at the target.', full ? 'The independent layout is restored.' : 'The groups on thermal reserve hold out until it is fitted.']
        },
        cost: y => { y.materials -= DONOR.materials + WEAR_OPS.pump; },
        effect: y => { wearDonor(y, L, y.year, !full); wearShop(y, y.year); },   // группы на резерве — аврал; затем мастерская
        record: { ru: `Насос второго агромодуля снимают для контура ${L}; агромодуль остаётся без него.`, en: `The second agro module's pump is being taken for loop ${L}; the agro module is left without it.` }
      }, {
        id: 'reroute',
        label: full ? { ru: 'Оставить перестановку', en: 'Keep the rerouting' } : { ru: 'Не разбирать агромодуль', en: 'Leave the agro module whole' },
        known: {
          ru: y => ['Второй агромодуль сохраняется.', wait(y, 'ru'), full ? `Схема ${layout(y.wear)}: следующий отказ контура перестановкой не покрыть.` : 'Группы на тепловом резерве погибнут.'],
          en: y => ['The second agro module is kept.', wait(y, 'en'), full ? `Layout ${layout(y.wear)}: the next loop failure cannot be covered by rerouting.` : 'The groups on thermal reserve will die.']
        },
        effect: y => { wearShop(y, y.year); },
        record: full ? { ru: `Контур ${L} остаётся выключенным; агромодуль цел.`, en: `Loop ${L} stays off; the agro module is intact.` }
          : { ru: 'Агромодуль не разбирают.', en: 'The agro module is left whole.' }
      }]
    };
  }
  const inSpan = (t, t0, t1) => t != null && t >= t0 && t <= t1;
  const CAL = [
    // события v1, работы, плановый совет; решение — вставка посреди перемотки
    { id: 'events', next: (s, t0, t1) => { const b = EV.next(s, t0, t1);
      return b && { at: b.at, cause: b.type ? `ev.${b.type}` : b.job ? `job.${b.job.id}` : 'ev.council', go: () => { s.year = b.at; return EV.fire(s, b); } }; } },
    // удар крупного зерна полосы облака
    { id: 'cloudHit', next: (s, t0, t1) => {
      if (!cloudThrough(s) || !cloudBand(s) || SH.hitOf(s.shield, 'cloud.hit.0')) return null;
      const c = cloudSpan(s), t = c.band[0] + (hidden(s, 'shield.cloud.hit.0.time') ?? 0.5) * (c.band[1] - c.band[0]);
      return inSpan(t, t0, t1) && { at: t, cause: 'cloud.hit', go: () => { const ev = cloudHit(s, t); if (ev) s.year = t; return ev; } }; } },
    // зерно ядра потока: только повреждение
    { id: 'streamGrain', next: (s, t0, t1) => {
      if (!streamOn(s)) return null;
      const P = streamPlan(s);
      return P.hit && !SH.hitOf(s.shield, 'stream.hit.0') && inSpan(P.g, t0, t1) && { at: P.g, cause: 'stream.grain', go: () => { streamGrain(s, P.g); return null; } }; } },
    // выход из ядра: последствия удара (перемотка могла встать между ударом и выходом)
    { id: 'streamOut', next: (s, t0, t1) => {
      if (!streamOn(s) || !(s.streamImpact && s.streamImpact.level == null)) return null;
      const P = streamPlan(s);
      return P.hit && inSpan(P.coreEnd, t0, t1) && { at: P.coreEnd, cause: 'stream.out', go: () => { const ev = streamOutcome(s, streamPlan(s)); if (ev || s.lostShip) s.year = P.coreEnd; return ev; } }; } },
    // границы среды: только смена множителя пыли (строго после t0 — граница, на которой стоим, пройдена)
    { id: 'env', next: (s, t0, t1) => { let m = null; for (const t of envMarks(s)) if (t > t0 && t <= t1 && (m == null || t < m)) m = t;
      return m != null && { at: m, cause: null, go: () => null }; } },
    // все внизу: модель износа останавливается в этот день (раньше работ очереди и отказов той же даты)
    { id: 'offShip', next: (s, t0, t1) => { const at = offShipAt(s); return s.wear && s.wear.stopAt == null && inSpan(at, t0, t1) && { at, cause: null, go: () => { wearStop(s, at); return null; } }; } },
    // работы очереди (шаг 3a): конец ручной части или выдержки; завершение — у владельца (износ, событие)
    { id: 'jobs', next: (s, t0, t1) => { if (!s.jobs) return null; const b = JB.nextBoundary(s.jobs, t0, t1);
      return b && { at: b.at, cause: `job.${b.job.type || b.job.owner}`, go: () => { s.year = Math.max(s.year, b.at); const j = JB.step(s.jobs, b.job.id, b.at, pools(s)); return j ? jobDone(s, j, b.at) : null; } }; } },
    // износ корабля: смена бодрствующих, отказы узлов, одиночные капсулы, исчерпание буферов
    { id: 'wear', next: wearNext },
    // регламент: узлы сетки в четверть года (множитель старения по отставанию, спрос по году рейса); сама работа — тик в начале хода
    // устойчиво (долга нет, старение штатное, людей — ровно по спросу и хватает, материалы есть, никто не учится) — промежуточные
    // узлы ничего не меняют: только границы лет (ревью Codex: после погашения долга m и люди меняются на ближайшем узле сетки)
    { id: 'reg', next: (s, t0, t1) => { if (!s.wear || !wearOn(s) || !s.wear.reg) return null; const w = s.wear, r = w.reg, D = W.regDemand(w, t0);
      const j = s.jobs && s.jobs.list.find(x => x.type === 'wear.reg' && x.status !== 'done');
      const calm = !s.trainees && !r.lab && r.m === 1 && s.materials > 1.5 && r.S >= D - 1e-9 && W.regAt(w, t0) <= 1e-9
        && j && j.maxW === Math.max(1, Math.ceil(D / W.REG.perYear - 1e-9));
      const at = calm ? W.regNextYear(w, t0, t1) : W.regNext(w, t0, t1); return at != null && { at, cause: null, go: () => { s.year = Math.max(s.year, at); return wearRegAsk(s, at) || dangerReask(s, at); } }; } }   // и выключенные секции: ремонт снова возможен
  ];
  // ближайшая граница; при равенстве — раньше по порядку календаря. Равенство с допуском (миллиардная года, ~0,03 с):
  // насос, законченный «ровно к исчерпанию буфера», не должен проигрывать ему на ошибке округления (ревью Codex 3a)
  const CAL_EPS = 1e-9;
  const calPick = cs => { let nx = null; for (const c of cs) if (c && (!nx || c.at < nx.at - CAL_EPS)) nx = c; return nx; };
  const calNext = (s, t0, t1) => calPick(CAL.map(src => src.next(s, t0, t1)));
  function simAdvance(s, target) {
    if (s.terminalAt != null) return null;                              // рейс окончен — модель больше не идёт (год — дата конца)
    if (!s.shield && s.eq) { s.shield = SH.create(s.eq.shield); s.simYear = s.year; SH.note(s.shield, { kind: 'accept' }); }
    wearStart(s);
    const from = s.simYear != null ? s.simYear : s.year;
    if (offShipAt(s) != null && offShipAt(s) <= from + 1e-9) wearStop(s, from);   // все уже внизу — работы износа сняты
    // и при target === from: решение-вставка могло встать на дате, где осталась необработанная граница (удар на той же дате)
    if (s.shield && target >= from) {
      let t0 = from;
      for (let guard = 0; ; guard++) {
        if (guard > 100000) throw new Error(`Календарь модели не продвигается: год ${t0}`);
        wearRegTick(s, t0);                                                // регламент: опора отставания и людей с этой границы
        if (s.wear && s.jobs && s.wear.shop && s.wear.shop.machine)        // станки заняты работой — привод стареет (с этой границы)
          W.setShop(s.wear, W.shopMachine(s.wear) && JB.active(s.jobs).some(j => j.equip === 'shop' && j.status === 'work'), t0);
        const nx = calNext(s, t0, target), t1 = nx ? nx.at : target;
        if (t1 > t0) { erodeSpan(s, t0, t1, rhoAt(s, (t0 + t1) / 2)); t0 = t1; s.simYear = t1; if (s.wear && wearOn(s)) W.touch(s.wear, t1); }   // модель износа дошла до t1
        wearRegTick(s, t0);                                                // регламент списан по t1 — события шага видят настоящий запас
        if (!nx) break;
        const ev = nx.go();
        if (s.wear) wearSyncDead(s, t1);                                // погибшие события или удара — и в реестре модели
        if (nx.cause) book(s, nx.cause, t1);
        if (s.terminalAt != null) return null;                          // рейс окончен состоянием корабля: год — дата конца
        if (ev) return ev;
      }
    }
    s.year = Math.max(s.year, target);                                   // перемотка ставит год цели; пройденная цель — уже достигнута
    return null;
  }
  // решение по повреждению щита (вставка модели посреди перемотки)
  const beltOf = id => SH.PANELS[SH.panelIndex(id)].belt;
  const canReplace = (s, panel) => !!s.repairQual && s.shield.spares[beltOf(panel)] > 0 && s.materials >= SHIELD_WORK.replace;
  const SHIELD_WORK = { patch: 5, replace: 3 };
  function serviceDecision(st, ev) {
    const panel = ev.panel, hitId = ev.id, cause = ev.cause || 'cloud', rec5 = s => cause === 'stream' ? s.streamImpact : s.cloudHit;
    if (cause === 'stream') return Object.assign(serviceOptions(panel, hitId, rec5, cause), {
      id: 'd.shieldService.stream', scene: 'shield', overlay: 'shield', inspect: panel, kind: 'decision',
      title: { ru: `Пробита панель щита ${panel}`, en: `Shield panel ${panel} breached` },
      context: {
        ru: s => { const h = s.streamImpact; return `Ядро потока. Зерно около ${nf(h.radius * 1000, 1, 'ru')} мм на ${nf(h.beta * 100, 1, 'ru')}% c — ${nf(h.energy / 1e6, 0, 'ru')} МДж: панель ${panel} пробита насквозь. ${streamLossLine(s, 'ru')} Щит с открытой пробоиной в 0,06 м².`; },
        en: s => { const h = s.streamImpact; return `The stream's core. A grain of about ${nf(h.radius * 1000, 1, 'en')} mm at ${nf(h.beta * 100, 1, 'en')}% c — ${nf(h.energy / 1e6, 0, 'en')} MJ: panel ${panel} breached through. ${streamLossLine(s, 'en')} The shield has an open hole of 0.06 m².`; }
      }
    });
    return Object.assign(serviceOptions(panel, hitId, rec5, cause), {
      id: 'd.shieldService.cloud', scene: 'shield', overlay: 'shield', inspect: panel, kind: 'decision',
      title: { ru: `Пробита панель щита ${panel}`, en: `Shield panel ${panel} breached` },
      context: {
        ru: s => { const h = s.cloudHit; return `Полоса крупной пыли. Зерно около ${nf(h.radius * 1000, 2, 'ru')} мм на ${nf(h.beta * 100, 1, 'ru')}% c — ${nf(h.energy / 1e6, 0, 'ru')} МДж. В месте удара выбито ${nf(h.removed, 1, 'ru')} кг/м² из ${s.shield.nominal}: панель ${panel} пробита насквозь. За ней — жилой отсек: разгерметизация, погибли ${ppl(s.cloudDead)} смены, отсек перекрыт. Щит с открытой пробоиной в 0,06 м².`; },
        en: s => { const h = s.cloudHit; return `A band of coarse dust. A grain of about ${nf(h.radius * 1000, 2, 'en')} mm at ${nf(h.beta * 100, 1, 'en')}% c — ${nf(h.energy / 1e6, 0, 'en')} MJ. ${nf(h.removed, 1, 'en')} kg/m² of ${s.shield.nominal} knocked out at the impact point: panel ${panel} is breached through. Behind it, a living compartment: decompression, ${s.cloudDead} of the shift dead, the compartment sealed. The shield has an open hole of 0.06 m².`; }
      }
    });
  }
  // варианты обслуживания пробитой панели (общие для облака и потока); rec5(s) — запись удара в состоянии
  // другие открытые повреждения щита (кроме панели panel) — для честных текстов замены
  const DMG = { breached: ['пробоина', 'hole'], patched: ['заплата', 'patch'], scarred: ['выбоина', 'scar'] };
  const otherDmg = (s, panel, lang) => SH.observe(s.shield).damaged.filter(d => d.panel !== panel)
    .map(d => `${d.panel} — ${DMG[d.state] ? DMG[d.state][lang === 'ru' ? 0 : 1] : d.state}`).join(', ');
  const fullLine = (s, panel, lang) => { const o = otherDmg(s, panel, lang);
    return lang === 'ru' ? (o ? `Панель ${panel} снова держит полный расчёт; другие повреждения щита остаются: ${o}.` : 'Щит снова держит полный расчёт.')
      : (o ? `Panel ${panel} holds its full rating again; other shield damage remains: ${o}.` : 'The shield holds its full rating again.'); };
  function serviceOptions(panel, hitId, rec5, cause) {
    return {
      rec: s => canReplace(s, panel) ? { id: 'replace', why: otherDmg(s, panel, 'ru') ? { ru: `запасная панель есть — панель ${panel} снова держит полный расчёт`, en: `a spare panel is aboard — panel ${panel} holds its full rating again` }
          : { ru: 'запасная панель есть — щит снова держит полный расчёт', en: 'a spare panel is aboard — the shield holds its full rating again' } }
        : { id: 'patch', why: { ru: 'открытая пробоина пропустит следующий удар', en: 'an open hole lets the next impact through' } },
      options: s => [{
        id: 'replace',
        label: { ru: `Заменить панель ${panel} запасной`, en: `Replace panel ${panel} with a spare` },
        known: {
          ru: x => [`Запасных панелей пояса ${beltOf(panel)} в трюме: ${x.shield.spares[beltOf(panel)]}.`, `Роботы с тыльной стороны, 16 часов; крепёж — материалы для высадки −${SHIELD_WORK.replace}%.`, fullLine(x, panel, 'ru')],
          en: x => [`Spare belt ${beltOf(panel)} panels in the hold: ${x.shield.spares[beltOf(panel)]}.`, `Robots from the rear side, 16 hours; fasteners from the landing materials −${SHIELD_WORK.replace}%.`, fullLine(x, panel, 'en')]
        },
        cost: x => { x.materials -= SHIELD_WORK.replace; },
        effect: x => { SH.replace(x.shield, panel, x.year); x.materials -= SHIELD_WORK.replace; EV.scrap(x, SHIELD_WORK.replace); x.shieldFixed = !SH.observe(x.shield).damaged.some(d => d.residual <= 0); rec5(x).repair = 'replace'; },
        record: { ru: x => `Панель ${panel} снята целиком, на её место встала запасная. ${fullLine(x, panel, 'ru')}`, en: x => `Panel ${panel} removed whole, a spare fitted in its place. ${fullLine(x, panel, 'en')}` }
      }, {
        id: 'patch',
        label: { ru: 'Поставить аварийную заплату', en: 'Fit an emergency patch' },
        known: {
          ru: [`48 часов работы; материалы для высадки −${SHIELD_WORK.patch}%.`, `Пробоина закрыта: в месте удара ${SH.RULES.patch} кг/м² вместо полного расчёта.`, cause === 'stream' ? 'Слабое место остаётся до прибытия.' : 'Слабое место остаётся — у потока это важно.'],
          en: [`48 hours of work; landing materials −${SHIELD_WORK.patch}%.`, `The hole is closed: ${SH.RULES.patch} kg/m² at the impact point instead of the full rating.`, cause === 'stream' ? 'A weak spot remains until arrival.' : 'A weak spot remains — it matters at the stream.']
        },
        cost: x => { x.materials -= SHIELD_WORK.patch; },
        effect: x => { SH.patch(x.shield, hitId, x.year); x.materials -= SHIELD_WORK.patch; EV.scrap(x, 1); rec5(x).repair = 'patch'; },
        record: { ru: `Пробоина в панели ${panel} закрыта заплатой: ${SH.RULES.patch} кг/м² в месте удара.`, en: `The hole in panel ${panel} is closed with a patch: ${SH.RULES.patch} kg/m² at the impact point.` }
      }, {
        id: 'defer',
        label: { ru: 'Отложить ремонт', en: 'Defer the repair' },
        known: {
          ru: ['Материалы целы.', 'Пробоина остаётся открытой: следующий удар в эту панель пройдёт насквозь.'],
          en: ['The materials are kept.', 'The hole stays open: the next impact on this panel goes straight through.']
        },
        effect: x => { rec5(x).repair = 'defer'; },
        record: { ru: `Ремонт панели ${panel} отложен. Пробоина открыта.`, en: `The repair of panel ${panel} is deferred. The hole is open.` }
      }].filter(o => o.id === 'replace' ? canReplace(s, panel) : o.id === 'patch' ? s.materials >= SHIELD_WORK.patch : true)
    };
  }
  const nf = (x, d, lang) => { const v = x.toFixed(d); return lang === 'ru' ? v.replace('.', ',') : v; };
  // измеренная среда отрезка (сводки щита и отчёт вахты)
  const ENV_NAME = { ism: ['средняя межзвёздная среда', 'average interstellar medium'], cloud: ['край облака D2', "the D2 cloud's edge"],
    pre: ['предвестник потока у Тёмной звезды', "the stream's precursor at the Dark Star"], core: ['ядро потока', "the stream's core"],
    filament: ['пылевое волокно', 'a dust filament'] };
  function noteText(s, n, lang) {
    const ru = lang === 'ru', sh = s.shield, o = SH.observe(sh), rho = SH.RULES.rhoDust.toExponential(1).replace('e-', '·10⁻').replace('24', '²⁴');
    if (n.kind === 'accept') {
      const sp = sh.spares.A;
      return ru ? `Приёмка фронтального щита. Пакет — 64 сменные панели в четырёх поясах и центральная защита носа, Ø 350 м. Норма — ${sh.nominal} кг/м² по проекции${sp ? `; в трюме запас — по ${sp} панелей каждого пояса` : ''}. Сервисный допуск — ${o.service} кг/м². Модель среды — средняя межзвёздная: пыль ${ru ? rho.replace('.', ',') : rho} кг/м³.`
        : `Forward shield acceptance. The pack: 64 replaceable panels in four belts and the central nose guard, 350 m across. Rating — ${sh.nominal} kg/m² of projected area${sp ? `; spares in the hold — ${sp} panels for each belt` : ''}. Service limit — ${o.service} kg/m². Environment model — average interstellar medium: dust ${rho} kg/m³.`;
    }
    const ob = n.obs || { min: o.min, at: o.at, hurt: o.damaged.length > 0, bulk: Math.min(...sh.sigma) };
    const done = (sh.nominal - ob.bulk) * 1000;                          // снятое пылью — без локальных повреждений
    const lim = ob.min < o.service ? (ru ? `ниже сервисного допуска (${o.service} кг/м²) — нужен ремонт` : `below the service limit (${o.service} kg/m²) — repair needed`)
      : ob.min < 2 * o.service ? (ru ? 'запас до сервисного допуска мал' : 'little margin above the service limit')
      : (ru ? 'до сервисного допуска далеко' : 'far from the service limit');
    const where = ob.hurt ? (ru ? ` (место удара на ${ob.at})` : ` (impact point on ${ob.at})`) : '';
    const fd = n.flux >= 100 ? 0 : n.flux >= 1 ? 2 : 4;                  // точность — по величине потока
    const short = n.y1 - n.y0 < 0.1, yd = n.y1 - n.y0 < 0.002 ? 4 : short ? 3 : 1;   // короткий отрезок — с сутками
    const dur = short ? (ru ? ` (${nf((n.y1 - n.y0) * 365.25, 1, 'ru')} сут.)` : ` (${nf((n.y1 - n.y0) * 365.25, 1, 'en')} days)`) : '';
    const env = (n.env && n.env.length ? n.env : ['ism']).map(k => ENV_NAME[k][ru ? 0 : 1]).join(', ');
    const Env = env[0].toUpperCase() + env.slice(1);
    return ru ? `Годы ${nf(n.y0, yd, 'ru')}–${nf(n.y1, yd, 'ru')}${dur}. ${Env}. Средний поток энергии пыли на щит — ${nf(n.flux, fd, 'ru')} Вт/м². Снято за отрезок — ${nf(n.dSigma * 1000, 1, 'ru')} г/м² проекции, с приёмки — ${nf(done, 1, 'ru')} г/м². Минимум по щиту — ${nf(ob.min, 3, 'ru')} кг/м²${where}, ${lim}.`
      : `Years ${nf(n.y0, yd, 'en')}–${nf(n.y1, yd, 'en')}${dur}. ${Env}. Mean dust energy flux on the shield — ${nf(n.flux, fd, 'en')} W/m². Removed over the interval — ${nf(n.dSigma * 1000, 1, 'en')} g/m² of projected area, since acceptance — ${nf(done, 1, 'en')} g/m². Shield minimum — ${nf(ob.min, 3, 'en')} kg/m²${where}, ${lim}.`;
  }
  // потери удара потока — одной строкой (тяжесть — streamOutcome)
  function streamLossLine(s, lang) {
    const ru = lang === 'ru', h = s.streamImpact;
    if (!h || h.level == null) return '';
    if (h.level === 1) return ru ? `В носовом отсеке гибнут ${ppl(s.streamDead)}.` : `${s.streamDead} die in the forward compartment.`;
    return h.burnt ? (ru ? `Пыль ядра прожгла старое место у облака: удар проходит в зал анабиоза. Погибли ${ppl(s.streamDead)}.` : `The core dust burned through the old spot from the cloud: the strike reaches the anabiosis hall. ${s.streamDead} are dead.`)
      : (ru ? `Без резерва мощности корабль уходит из ядра сутками: поток успевает пройти по корпусу. Погибли ${ppl(s.streamDead)}.` : `Without the high-power reserve the ship takes days to leave the core: the stream has time to sweep the hull. ${s.streamDead} are dead.`);
  }
  // журнал прохода края облака: сутки прохода — из профиля, удар и ремонт — из модели щита
  function edgeLogV5(s, lang) {
    const ru = lang === 'ru', d = edgeDays(s), h = s.cloudHit, kg = ru ? 'кг/м²' : 'kg/m²';
    const head = ru ? `Проход края облака: ${d} ${plural(d, ['сутки', 'суток', 'суток'])}.` : `Passage through the cloud's edge: ${d} days.`;
    if (!h) return head + (ru ? `\nУдары пыли — в пределах прогноза модели. Щит: ${shieldGaugeV5(s, 'ru')}.\nРезерв манёвров: ${pct(s.reserve, 'ru')}% паспортного.`
      : `\nDust impacts within the model forecast. Shield: ${shieldGaugeV5(s, 'en')}.\nManoeuvre reserve: ${pct(s.reserve, 'en')}% of rated.`);
    const band = ru ? ` В средней трети — полоса крупной пыли: мелкой пыли в сорок раз больше фона и одно крупное зерно, около ${nf(h.radius * 1000, 2, 'ru')} мм, ${nf(h.energy / 1e6, 0, 'ru')} МДж.`
      : ` In the middle third, a band of coarse dust: forty times the background in fine dust and one coarse grain, about ${nf(h.radius * 1000, 2, 'en')} mm, ${nf(h.energy / 1e6, 0, 'en')} MJ.`;
    if (!h.breached) return head + band + (ru ? `\nУдвоенный щит держит: на панели ${h.panel} выбито ${nf(h.removed, 1, 'ru')} ${kg} на 0,06 м², в месте удара осталось ${nf(h.residual, 1, 'ru')} ${kg}. Сквозного пробоя нет, ремонт не нужен.`
      : `\nThe doubled shield holds: ${nf(h.removed, 1, 'en')} ${kg} knocked out of panel ${h.panel} over 0.06 m², ${nf(h.residual, 1, 'en')} ${kg} left at the impact point. No breach through, no repair needed.`);
    const fix = h.repair === 'replace' ? (ru ? `Панель заменена запасной, −${SHIELD_WORK.replace}% материалов.` : `The panel was replaced with a spare, −${SHIELD_WORK.replace}% of materials.`)
      : h.repair === 'patch' ? (ru ? `Заплата: ${SH.RULES.patch} ${kg} в месте удара, −${SHIELD_WORK.patch}% материалов.` : `Patch: ${SH.RULES.patch} ${kg} at the impact point, −${SHIELD_WORK.patch}% of materials.`)
      : (ru ? 'Ремонт отложен: пробоина открыта.' : 'Repair deferred: the hole is open.');
    return head + band + (ru ? `\nЗерно пробивает панель ${h.panel}; за ней — жилой отсек кольца. Разгерметизация.\nПогибли ${ppl(s.cloudDead)} смены. Отсек перекрыт. ${fix}`
      : `\nThe grain breaks through panel ${h.panel}; behind it, a living compartment of the ring. Decompression.\n${s.cloudDead} of the shift are dead. The compartment is sealed. ${fix}`);
  }
  function streamLogV5(s, lang) {
    const ru = lang === 'ru', h = s.streamImpact;
    const head = s.streamRoute === 'evade' ? (ru ? 'Манёвр опоздал: корабль ещё в потоке. ' : 'The manoeuvre came too late: the ship is still in the stream. ')
      : (ru ? 'Корабль идёт по краю потока — и ядро потока на курсе. ' : 'The ship runs along the edge of the stream — and the stream\'s core is on its course. ');
    if (!h) return head;
    const grain = ru ? `Зерно около ${nf(h.radius * 1000, 1, 'ru')} мм на ${nf(h.beta * 100, 1, 'ru')}% c — ${nf(h.energy / 1e6, 0, 'ru')} МДж — пробивает панель ${h.panel}. `
      : `A grain of about ${nf(h.radius * 1000, 1, 'en')} mm at ${nf(h.beta * 100, 1, 'en')}% c — ${nf(h.energy / 1e6, 0, 'en')} MJ — breaks through panel ${h.panel}. `;
    if (s.lostShip) return head + grain;
    const fix = h.repair === 'replace' ? (ru ? ` Панель заменена запасной, −${SHIELD_WORK.replace}%.` : ` The panel was replaced with a spare, −${SHIELD_WORK.replace}%.`)
      : h.repair === 'patch' ? (ru ? ` Заплата на пробоину, −${SHIELD_WORK.patch}%.` : ` A patch over the hole, −${SHIELD_WORK.patch}%.`)
      : h.repair === 'defer' ? (ru ? ' Ремонт отложен: пробоина открыта.' : ' Repair deferred: the hole is open.') : '';
    return head + grain + streamLossLine(s, lang) + (ru ? ` Отсеки — материалы для высадки −${STREAM_MAT5[h.level]}%.` : ` The compartments — landing materials −${STREAM_MAT5[h.level]}%.`) + fix;
  }
  // сводки износа (summary) — не в ленту, а в ведомость ближайшего отчёта вахты (fold); приёмка — отдельной записью
  const WEAR_TITLE = { ru: 'Приборный журнал · охлаждение', en: 'Instrument log · cooling' };
  function simNotes(s) {
    const evNotes = EV.take(s).concat(s.wear ? W.take(s.wear).map(n => ({ id: `sim.wear.${n.k}`, kind: 'instrument', title: WEAR_TITLE,
      text: { ru: n.ru, en: n.en }, fold: true })) : []);
    if (!s.shield) return evNotes;
    return SH.take(s.shield).map(n => ({ id: `sim.shield.${n.kind}.${nf(n.y1 != null ? n.y1 : s.year, 3, 'en')}`, kind: 'instrument', title: SIM_TITLE,
      text: { ru: noteText(s, n, 'ru'), en: noteText(s, n, 'en') }, fold: n.kind === 'summary', env: n.env || [] })).concat(evNotes);
  }

  // ---- отчёт вахты (DOC «Симулятор v2 — видимость», шаг 1): что случилось на корабле за период — от прошлого отчёта
  // до конца перемотки или до остановки модели на событии. Только зарегистрированное и рассчитанное: кто на вахте,
  // расчётные потери по категориям модели, происшествия, удары по щиту, резерв, материалы, путь. Состояние не меняет.
  // На вахте: до года 2 на ногах весь экипаж, до передачи полномочий — шестьдесят, дальше — штат (один счёт для отчёта,
  // прибора HUD и карты спящих)
  // с моделью износа (пока она ведёт людей, до прибытия) — по реестру мест: группа Б, разбуженные без капсулы
  const awakeOf = (s, ids) => s.wear && wearOn(s) && s.year < arriveView(s) ? s.wear.ps.split('').filter(c => c === 'A').length
    : s.year < 2 && !ids.has('a1.empty') ? crewOf(s) : ids.has('a1.handover') ? s.watch : 60;
  function observeShip(s, log) {
    if (!s.eq || s.relief || !s.arrive) return null;
    const ids = new Set((log || []).map(i => i.beat.id));
    return { year: s.year, watch: s.watch, awake: awakeOf(s, ids), crew: crewOf(s), alive: aliveOf(s), dead: s.dead || 0, deadHere: s.deadHere || 0, out: s.outpostDead || 0,
      L: lossesOf(s, Math.max(0, Math.min(s.year, s.arrive))), reserve: s.reserve, materials: s.materials, highPower: !!s.highPower,
      inc: (s.incidents || []).length, regMat: regSpent(s), shield: s.shield ? { eroded: s.shield.erodedKg / SH.AREA, hits: s.shield.hits.length } : null };
  }
  const regSpent = st => st && st.wear && st.wear.reg ? st.wear.reg.spent || 0 : 0;   // материалы, списанные регламентом с начала рейса
  const LOSS_KEYS = ['capsule', 'revival', 'accident', 'cancer'];
  const LOSS_NAME = { capsule: ['отказы капсул', 'capsule failures'], revival: ['при пробуждении', 'on waking'], accident: ['несчастные случаи на вахте', 'accidents on watch'],
    cancer: ['рак в пути', 'cancers on the road'] };
  const phaseAt = (s, y) => { const A = arriveView(s), b0 = M.brakeStart(A, s.tMag);
    return y < M.ACC ? 'acc' : y >= A ? 'home' : y < b0 ? 'drift' : s.tMag != null && y >= A - M.ENGINE ? 'eng' : 'mag'; };
  const txt = (v, lang, st) => { const x = v && v[lang]; return typeof x === 'function' ? x(st) : (x || ''); };
  const yWhole = y => Math.abs(y - Math.round(y)) < 1e-6;
  function spanText(y0, y1, lang) {
    const ru = lang === 'ru', d = y1 - y0, k = d < 0.002 ? 4 : d < 0.1 ? 3 : 1, f = y => nf(y, yWhole(y) ? 0 : k, lang).replace(/[.,]0$/, '');
    const days = d < 0.1 ? (ru ? ` (${nf(d * 365.25, 1, 'ru')} сут.)` : ` (${nf(d * 365.25, 1, 'en')} days)`) : '';
    return `${ru ? 'годы' : 'years'} ${f(y0)}–${f(y1)}${days}`;
  }
  // изменения запаса за период — по записям периода: разность снимка записи и предыдущего; причина — решение или запись
  // изменения внутри хода модели (удар, выход из ядра) записи не имеют — остаток относим к происшествиям периода
  function resourceMoves(base, items, key, lang, s, incs) {
    const ru = lang === 'ru', out = [];
    let prev = base[key], py = base.year;
    const wIn = (a, b) => s.wear ? (s.wear.moves || []).filter(m => m.key === key && m.at > a + 1e-9 && m.at <= b + 1e-9) : [];   // работы износа
    const evIn = (a, b) => EV.movesIn(s, key, a, b).concat(wIn(a, b)).reduce((x, m) => x + m.d, 0);
    // регламент списывает материалы непрерывно — по разности накопленного между снимками
    const rg = st => key === 'materials' ? regSpent(st) : 0; let pr = key === 'materials' ? base.regMat || 0 : 0;
    for (const m of EV.movesIn(s, key, base.year, s.year).concat(wIn(base.year, s.year))) out.push({ d: m.d, why: m.name[lang] });
    if (rg(s) - pr >= 0.05) out.push({ d: -(rg(s) - pr), why: lang === 'ru' ? 'регламент' : 'routine maintenance' });
    for (const it of items) {
      const v = it.state[key], d = v - prev - evIn(py, it.state.year) + (rg(it.state) - pr); prev = v; py = Math.max(py, it.state.year); pr = rg(it.state);
      if (Math.abs(d) < 0.05) continue;
      const b = it.beat, title = txt(b.title, lang, it.state);
      const why = b.kind === 'decision' && it.option ? (ru ? `решение «${title}» — ${txt(it.option.label, lang, it.state).toLowerCase()}` : `decision “${title}” — ${txt(it.option.label, lang, it.state).toLowerCase()}`)
        : title ? (ru ? `«${title}»` : `“${title}”`) : '';
      out.push({ d, why });
    }
    const d = s[key] - prev - evIn(py, s.year) + (rg(s) - pr);
    if (Math.abs(d) >= 0.05) out.push({ d, why: incs.map(x => lc1(HEADLINE_NAME[x.kind] ? HEADLINE_NAME[x.kind][ru ? 0 : 1] : x.kind)).join(', ') });
    return out;
  }
  const endDot = x => /\.$/.test(x) ? x : x + '.';
  // особая среда, через которую корабль прошёл за [y0, y1]: край облака, предвестник и ядро потока — по тем же
  // границам, что и износ (rhoAt); после y1 ничего не смотрим
  function envsPassed(s, y0, y1) {
    const over = (a, b) => a != null && b != null && a < y1 && b > y0, out = [];
    if (s.ev && s.ev.media && s.ev.media.some(m => over(m.a, m.b))) out.push('filament');
    if (cloudThrough(s)) { const c = cloudSpan(s); if (over(c.a, c.b)) out.push('cloud'); }
    if (streamOn(s)) { const P = streamPlan(s);
      if (over(P.warn, P.preEnd)) out.push('pre');
      if (P.coreEnd != null && over(P.core, P.coreEnd)) out.push('core'); }
    return out;
  }
  const lc1 = x => x[0].toLowerCase() + x.slice(1);
  const POP_WHO = { outpost: [' форпоста', ' of the outpost'], thaw: [' из Оттепели', ' of Thaw'] };
  function watchReport(s, base, items, folded, ev, lang, now) {
    const ru = lang === 'ru', y0 = base.year, y1 = s.year, A = s.arrive;
    const yr = y => `${ru ? 'год' : 'year'} ${nf(y, yWhole(y) ? 0 : 2, lang)}`;
    // что передаём: остановка модели, происшествия, удары по щиту
    const incs = (s.incidents || []).slice(base.inc);
    const hits = s.shield && base.shield ? s.shield.hits.slice(base.shield.hits) : [];
    const burnt = s.shield ? s.shield.hits.filter(h => h.burntAt != null && h.burntAt > y0 + 1e-9 && h.burntAt <= y1 + 1e-9) : [];
    const hitLine = h => ru ? `удар в панель ${h.panel} (${yr(h.at)}) — ${h.first === 'breached' ? 'сквозной пробой' : 'выбоина, щит держит'}`
      : `an impact on panel ${h.panel} (${yr(h.at)}) — ${h.first === 'breached' ? 'breached through' : 'a scar, the shield holds'}`;
    const events = incs.map(x => { const nm = HEADLINE_NAME[x.kind] ? HEADLINE_NAME[x.kind][ru ? 0 : 1] : INCIDENT_NAME[x.kind] ? INCIDENT_NAME[x.kind][lang] : x.kind;
      const who = POP_WHO[x.pop] ? POP_WHO[x.pop][ru ? 0 : 1] : '';
      return `${lc1(nm)} (${ru ? 'год' : 'year'} ${incYear(x)})${x.dead ? (ru ? ` — погибли ${ppl(x.dead)}${who}` : ` — ${x.dead}${who} dead`) : ''}`; })
      .concat(hits.filter(h => !(ev && ev.id === h.id)).map(hitLine))
      .concat(burnt.map(h => ru ? `пыль прожгла место удара на ${h.panel} (${yr(h.burntAt)})` : `the dust burned through the impact point on ${h.panel} (${yr(h.burntAt)})`))
      .concat(EV.since(s, y0, y1).filter(e => !(ev && ev.id === e.id)).map(e => `${EV.TYPES[e.type].name[lang]} (${yr(e.at)})`))
      .concat(s.wear ? s.wear.log.filter(e => e.kind === 'fail' && e.at > y0 + 1e-9 && e.at <= y1 + 1e-9 && !(ev && ev.kind === 'wear' && ev.at === e.at)).map(e => `${wearPart(e.id, lang)} (${yr(e.at)})`) : []);
    const head = [];
    if (ev) head.push(ev.kind === 'shieldService' ? (ru ? `Требуется решение совета: пробита панель щита ${ev.panel}.` : `Council decision required: shield panel ${ev.panel} is breached.`)
      : ev.kind === 'event' ? (ru ? `Требуется решение совета: ${EV.TYPES[ev.type].name.ru}.` : `Council decision required: ${EV.TYPES[ev.type].name.en}.`)
      : ev.kind === 'wear' ? (ev.type === 'shop' ? (ru ? 'Требуется решение совета: что мастерская делает со снятыми насосами.' : 'Council decision required: what the workshop does with removed pumps.')
        : ev.type === 'reg' ? (ru ? 'Требуется решение совета: регламент не успевает.' : 'Council decision required: maintenance is falling behind.')
        : ev.type === 'danger' ? (/\.bearing$/.test(ev.id) ? (ru ? `Требуется решение совета: опасный узел — опора кольца ${ev.id.split('.')[0]}.` : `Council decision required: a dangerous node — ring ${ev.id.split('.')[0]}'s bearing.`)
          : ru ? `Требуется решение совета: опасный узел — секция радиатора ${ev.id}.` : `Council decision required: a dangerous node — radiator section ${ev.id}.`)
        : ru ? `Требуется решение совета: остановлен контур охлаждения ${ev.loop}.` : `Council decision required: cooling loop ${ev.loop} has stopped.`)
      : (ru ? 'Требуется решение совета.' : 'Council decision required.'));
    if (events.length) head.push((ru ? 'За период: ' : 'Over the period: ') + events.join('; ') + '.');
    // среда, пройденная за период (уже пройденное — не прогноз), если не обычная межзвёздная
    const envs = envsPassed(s, y0, y1);
    if (envs.length) head.push((ru ? 'Приборы фиксируют среду: ' : 'The instruments register: ') + envs.map(k => ENV_NAME[k][ru ? 0 : 1]).join(', ') + '.');
    // люди: расчётные потери периода при нынешних параметрах; смена штата вахты пересчитывает оценку за прошлые годы
    const Lre = lossesOf(s, Math.max(0, Math.min(y0, A))), dk = {}; let dl = 0;
    for (const k of LOSS_KEYS) { dk[k] = Math.max(0, now.L[k] - Lre[k]); dl += dk[k]; }
    // погибшие своего экипажа (люди форпоста — в deadHere, но не наши); чужие — отдельной строкой по поселениям
    const reest = Lre.total - base.L.total, dInc = (now.dead - base.dead) + (now.deadHere - base.deadHere) - (now.out - base.out);
    const others = ['outpost', 'thaw'].map(p => [p, incs.filter(x => x.pop === p).reduce((a, x) => a + (x.dead || 0), 0)]).filter(x => x[1]);
    const cats = LOSS_KEYS.filter(k => dk[k]).map(k => `${LOSS_NAME[k][ru ? 0 : 1]} — ${dk[k]}`).join(', ');
    const watchLine = now.awake === now.crew ? (ru ? 'На ногах весь экипаж' : 'The whole crew is awake')
      : (ru ? `На вахте — ${now.awake}${now.awake !== base.awake ? ` (было: ${base.awake === now.crew ? 'весь экипаж' : base.awake})` : ''}` : `On watch — ${now.awake}${now.awake !== base.awake ? ` (was: ${base.awake === now.crew ? 'the whole crew' : base.awake})` : ''}`);
    // запасы: изменения — с причиной; без изменений — одной строкой
    const res = resourceMoves(base, items, 'reserve', lang, s, incs), mat = resourceMoves(base, items, 'materials', lang, s, incs);
    const why = (ms, f) => ms.slice(0, 2).map(m => `${f(m.d)}${m.why ? ` — ${m.why}` : ''}`).join('; ') + (ms.length > 2 ? (ru ? `; и ещё ${ms.length - 2}` : `; and ${ms.length - 2} more`) : '');
    const resNow = `${pct(s.reserve, lang)}% (${kms0(s)} ${ru ? 'км/с' : 'km/s'})`, matNow = `${pctM(s.materials, lang)}%`;
    const sgn = (d, k) => `${d > 0 ? '+' : '−'}${nf(Math.abs(d), k, lang)}`;
    const sgnM = d => sgn(d, Math.abs(Math.abs(d) - Math.round(Math.abs(d))) < 0.05 ? 0 : 1);   // материалы: дробные — с десятыми
    const g = s.shield && base.shield ? (now.shield.eroded - base.shield.eroded) * 1000 : 0;
    const shieldNow = s.shield ? shieldGaugeV5(s, lang).replace(' · ', ', ') : '';
    const shieldSame = !s.shield || (g < 0.005 && !hits.length && !burnt.length);
    const gT = g >= 1000 ? `${nf(g / 1000, 2, lang)} ${ru ? 'кг/м²' : 'kg/m²'}` : `${nf(g, g < 10 ? 2 : 1, lang)} ${ru ? 'г/м²' : 'g/m²'}`;
    // путь: скорость, задержка связи, смена фазы полёта, сводки Кольца
    const AV = arriveView(s), beta = M.speedAt(y1, s.beta, AV, s.tMag), ly = M.distLy(y1, s.beta, AV, s.tMag, M.star(s.target).d);
    const p0 = phaseAt(s, y0), p1 = phaseAt(s, y1), PH = ui[lang].tlPhase;
    const lagT = ly * 12 < 1 ? (ru ? `${Math.max(1, Math.round(ly * 365.25))} сут.` : `${Math.max(1, Math.round(ly * 365.25))} days`)
      : ly < 2 ? `${nf(ly * 12, 0, lang)} ${ru ? 'мес.' : 'months'}` : `${nf(ly, 1, lang)} ${ru ? 'г.' : 'years'}`;
    const way = [p1 === 'home' ? endDot(ru ? `Корабль у цели; сигнал до Земли идёт ${lagT}` : `The ship is at the target; a signal takes ${lagT} to reach Earth`)
      : endDot(ru ? `Скорость — ${nf(beta, 3, 'ru')}c, сигнал до Земли идёт ${lagT}` : `Velocity — ${nf(beta, 3, 'en')}c, a signal takes ${lagT} to reach Earth`)];
    if (p0 !== p1) way.unshift(ru ? `Фаза полёта: ${PH[p0]} → ${PH[p1]}.` : `Flight phase: ${PH[p0]} → ${PH[p1]}.`);
    const bul = items.filter(i => i.beat.kind === 'bulletin').length;
    if (bul) way.push(ru ? (bul === 1 ? 'Принята сводка Кольца.' : `Приняты сводки Кольца: ${bul}.`) : (bul === 1 ? 'A Ring bulletin was received.' : `Ring bulletins received: ${bul}.`));
    // ведомость: потери с отлёта по категориям модели, все изменения запасов, сводки износа щита
    const Lall = now.L, det = [ru ? `С отлёта, по расчёту модели: ${LOSS_KEYS.map(k => `${LOSS_NAME[k][0]} — ${Lall[k]}`).join(', ')}; в происшествиях — ${now.dead + now.deadHere - now.out}. Отложенный риск — рак после пробуждения у цели: около ${ppl(Lall.later)}.`
      : `Since departure, by the model: ${LOSS_KEYS.map(k => `${LOSS_NAME[k][1]} — ${Lall[k]}`).join(', ')}; in incidents — ${now.dead + now.deadHere - now.out}. Deferred risk — cancers after waking at the target: about ${Lall.later}.`];
    if (res.length > 2) det.push((ru ? 'Резерв манёвров: ' : 'Manoeuvre reserve: ') + res.map(m => `${sgn(m.d, 1)} ${ru ? 'п.п.' : 'pp'} — ${m.why}`).join('; ') + '.');
    if (mat.length > 2) det.push((ru ? 'Материалы: ' : 'Materials: ') + mat.map(m => `${sgnM(m.d)}% — ${m.why}`).join('; ') + '.');
    if (s.wear) det.push(coolLine(s.wear, lang));
    { const jl = jobsLine(s, lang); if (jl) det.push(jl); }
    for (const f of folded) det.push(txt(f.text, lang));
    const title = ev ? (ru ? `Донесение вахты · ${spanText(y0, y1, 'ru')}` : `Watch report · ${spanText(y0, y1, 'en')} · interrupted`)
      : (ru ? `Отчёт вахты · ${spanText(y0, y1, 'ru')}` : `Watch report · ${spanText(y0, y1, 'en')}`);
    // спокойный период — две строки: без событий, потерь, работ и перемен
    const data = { y0, y1, losses: dl, reest, crewDead: dInc, alive: now.alive, interrupted: !!ev };   // числа периода — для перемотки и проверок
    const calm = !ev && !events.length && !envs.length && !dl && !dInc && !others.length && !reest && !res.length && !mat.length && shieldSame && now.awake === base.awake && now.highPower === base.highPower
      && !(s.wear && W.observe(s.wear).groups.some(g => g.sleep && g.heat));   // группы на тепловом резерве — не спокойный период
    if (calm) return { title, data, details: det.join('\n\n'), text: [ru ? `Передаём корабль без происшествий. ${watchLine}, живы — ${now.alive}; запасы${s.shield ? ' и щит' : ''} без изменений.`
      : `We hand over the ship with no incidents. ${watchLine}, alive — ${now.alive}; stores${s.shield ? ' and shield' : ''} unchanged.`, way.join(' ')].join('\n\n') };
    if (!events.length && !ev) head.unshift(ru ? 'Передаём корабль без происшествий.' : 'We hand over the ship with no incidents.');
    const people = [`${watchLine}.`, dl ? (ru ? `Расчётные потери за период — ${ppl(dl)}: ${cats}.` : `Estimated losses over the period — ${dl}: ${cats}.`)
      : (ru ? 'Расчётных потерь за период нет.' : 'No estimated losses over the period.')];
    if (dInc) people.push(ru ? `В происшествиях погибли ${ppl(dInc)} экипажа.` : `${dInc} of the crew died in incidents.`);
    if (others.length) people.push(ru ? `Погибли ${others.map(([p, n]) => `${ppl(n)}${POP_WHO[p][0]}`).join(' и ')}.` : `${others.map(([p, n]) => `${n}${POP_WHO[p][1]}`).join(' and ')} died.`);
    if (reest) people.push(ru ? `Оценка потерь за прошлые годы пересчитана под новый штат вахты: ${reest > 0 ? '+' : '−'}${Math.abs(reest)}.`
      : `The estimate for past years is recalculated for the new watch roster: ${reest > 0 ? '+' : '−'}${Math.abs(reest)}.`);
    people.push(ru ? `Живы — ${now.alive}.` : `Alive — ${now.alive}.`);
    const sys = [!res.length && !mat.length
      ? (ru ? `Резерв манёвров — ${resNow}, материалы — ${matNow}: без изменений.` : `Manoeuvre reserve — ${resNow}, materials — ${matNow}: unchanged.`)
      : [res.length ? (ru ? `Резерв манёвров — ${resNow}: ${why(res, d => `${sgn(d, 1)} п.п.`)}.` : `Manoeuvre reserve — ${resNow}: ${why(res, d => `${sgn(d, 1)} pp`)}.`)
          : (ru ? `Резерв манёвров — ${resNow}.` : `Manoeuvre reserve — ${resNow}.`),
        mat.length ? (ru ? `Материалы — ${matNow}: ${why(mat, d => `${sgnM(d)}%`)}.` : `Materials — ${matNow}: ${why(mat, d => `${sgnM(d)}%`)}.`)
          : (ru ? `Материалы — ${matNow}.` : `Materials — ${matNow}.`)].join(' ')];
    if (now.highPower !== base.highPower) sys.push(now.highPower ? (ru ? 'Контуру вернули резерв мощности.' : 'The loop has its high-power reserve back.')
      : (ru ? 'Контур остался без резерва мощности.' : 'The loop is left without its high-power reserve.'));
    if (s.wear) sys.push(coolLine(s.wear, lang));
    if (s.shield) sys.push(shieldSame ? (ru ? `Щит без изменений: ${shieldNow}.` : `Shield unchanged: ${shieldNow}.`)
      : (ru ? `Щит: за период пыль сняла ${gT} проекции; ${shieldNow}.` : `Shield: the dust removed ${gT} of projected area over the period; ${shieldNow}.`));
    return { title, data, text: [head.join(' '), people.join(' '), sys.join(' '), way.join(' ')].join('\n\n'), details: det.join('\n\n') };
  }
  // охлаждение и питание (износ, шаг 2): нагрузка контуров, независимость, запас деталей
  const wearPart = (id, lang) => { const [u, p] = id.split('.'), ru = lang === 'ru';
    if (p === 'coll') return ru ? `отказ коллектора контура ${u}` : `loop ${u} collector failure`;
    return p === 'pump' ? (ru ? `отказ насоса контура ${u}` : `loop ${u} pump failure`) : p === 'cool' ? (ru ? `отказ холодильника группы ${u}` : `group ${u} cooler failure`)
      : p === 'ctrl' ? (ru ? `отказ управления группы ${u}` : `group ${u} control failure`) : (ru ? `отказ ${id}` : `${id} failure`); };
  const shopRu = o => { const r = o.shop.removed, b = o.shop.rebuilding, x = [];
    if (r.pump + b.pump) x.push(`снятых насосов ${r.pump + b.pump}${b.pump ? ` (на переборке ${b.pump})` : ''}`);
    if (r.cooler + b.cooler) x.push(`снятых холодильников ${r.cooler + b.cooler}${b.cooler ? ` (на переборке ${b.cooler})` : ''}`);
    return x.length ? '; ' + x.join(', ') : ''; };
  const shopEn = o => { const r = o.shop.removed, b = o.shop.rebuilding, x = [];
    if (r.pump + b.pump) x.push(`removed pumps ${r.pump + b.pump}${b.pump ? ` (${b.pump} in rebuild)` : ''}`);
    if (r.cooler + b.cooler) x.push(`removed coolers ${r.cooler + b.cooler}${b.cooler ? ` (${b.cooler} in rebuild)` : ''}`);
    return x.length ? '; ' + x.join(', ') : ''; };
  function coolLine(w, lang) {
    const o = W.observe(w), ru = lang === 'ru', loops = o.loops.map(l => l.runs ? `${l.id} ${l.load}/${l.max}` : `${l.id} ${ru ? 'стоит' : 'stopped'}`).join(' · ');
    const warm = o.groups.filter(g => g.sleep && g.heat), inv = o.inv;
    return ru ? `Охлаждение: ${loops}; независимых контуров — ${o.independent}.${warm.length ? ` На тепловом резерве: ${warm.map(g => `${g.id} (${nf(g.heatH, 0, 'ru')} ч)`).join(', ')}.` : ''} Запас: насосы ${inv.pump}, холодильники ${inv.cooler}, управление ${inv.control}, клапанные комплекты ${inv.valve}${shopRu(o)}; лом ${nf(o.shop.scrap, 1, 'ru')}. Питание — ${o.power === 2 ? 'два независимых канала' : o.tie ? 'один канал, вторая шина — через перемычку' : 'один канал'}.`
      : `Cooling: ${loops}; independent loops — ${o.independent}.${warm.length ? ` On thermal reserve: ${warm.map(g => `${g.id} (${nf(g.heatH, 0, 'en')} h)`).join(', ')}.` : ''} Stock: pumps ${inv.pump}, coolers ${inv.cooler}, controls ${inv.control}, valve kits ${inv.valve}${shopEn(o)}; scrap ${nf(o.shop.scrap, 1, 'en')}. Power — ${o.power === 2 ? 'two independent channels' : o.tie ? 'one channel, the second bus through the tie' : 'one channel'}.`;
  }
  function simReport(s, base, log, mark, folded, ev) {
    const now = observeShip(s, log);
    if (!base || !now || (s.lostShip && s.terminalAt == null) || !(s.year > base.year)) return null;   // конец рейса от износа — с итоговым отчётом
    const items = log.slice(mark), ru = watchReport(s, base, items, folded, ev, 'ru', now), en = watchReport(s, base, items, folded, ev, 'en', now);
    return { id: `sim.watch.${nf(s.year, 4, 'en')}`, kind: 'watch', title: { ru: ru.title, en: en.title }, text: { ru: ru.text, en: en.text },
      details: { ru: ru.details, en: en.details }, parts: folded, data: ru.data };
  }
  // события v1: разрешено ли событие семьи family в год t — только дрейф, не у сюжетных узлов (±1 год от дат решений и
  // перемоток сюжета), жизнеобеспечение и охлаждение — не во время истории контура Ирсона
  function storyMarks(s) {
    const out = [];
    for (const b of beats) {
      const v = b.kind === 'skip' ? b.toYear : b.kind === 'decision' ? b.year : undefined;
      if (v === undefined) continue;
      try { if (b.when && !b.when(s)) continue; const y = typeof v === 'function' ? v(s) : v; if (isFinite(y)) out.push(y); } catch (e) { /* дата из будущего состояния */ }
    }
    return out;
  }
  function evWindow(s, t, family) {
    if (!s.arrive || s.lostShip || s.relief || s.outcome) return false;
    if (t < M.ACC + 1 || t > M.brakeStart(arriveView(s), s.tMag) - 1) return false;
    if ((family === 'lifeSupport' || family === 'cooling') && !ownStory(s) && t > Y(s, 0.6) - 1 && t < Y(s, 0.75) + 1) return false;
    return !storyMarks(s).some(y => Math.abs(t - y) < 1);
  }
  // свои живые по реестру: без погибших в происшествиях (номера — как у victims)
  // погибшие в происшествиях и в реестре сюжета (deadIds — с моделью износа туда входят и фоновые смерти модели)
  const aliveIds = s => { const dead = new Set((s.incidents || []).filter(x => (x.pop || 'crew') === 'crew').flatMap(x => x.ids || []).concat(s.deadIds || []));
    return [...Array(crewOf(s)).keys()].filter(i => !dead.has(i)); };
  const EV = EVM.create({ hidden: (s, k) => hidden(s, k), name: (s, i) => ({ ru: crewName(s, i, 'ru'), en: crewName(s, i, 'en') }), alive: aliveIds, window: evWindow,
    dvPct, kms: kms0, nf, prod: s => eqOf(s).prod, sensors: s => eqOf(s).sensors, thin: s => s.watch < 40,
    caps: s => eqOf(s).caps, probes: s => eqOf(s).probes, highPower: s => !!s.highPower, taught: s => !!s.taught, repairQual: s => !!s.repairQual,
    cargo: s => s.kits.includes('request') ? 'request' : s.kits.includes('berths') ? 'berths' : 'none',
    pickName: (s, u, not) => { const a = aliveIds(s).filter(i => i !== not), i = a.length ? a[Math.floor(u * a.length) % a.length] : 0; return { ru: crewName(s, i, 'ru'), en: crewName(s, i, 'en') }; },   // not — номер, который исключить
    beta: (s, y) => M.speedAt(y, s.beta, s.arrive, s.tMag),
    erosion: (s, a, b, k) => SH.erode(SH.create('dust20'), a, b, y => M.speedAt(y, s.beta, s.arrive, s.tMag), SH.RULES.rhoDust * k).dSigma,   // прогноз на свежей копии
    shieldMin: s => s.shield ? SH.observe(s.shield).min : 0, service: () => SH.RULES.service, eroded: s => s.shield ? s.shield.erodedKg / SH.AREA : 0,
    lag: s => lag(s, s.year), yrs: (n, lang) => lang === 'ru' ? yrs(n) : yrsEn(n),
    book: (s, cause) => book(s, cause),                               // журнал — до снимка записи события
    // общая очередь работ (шаг 3a): события ставят работы в неё, когда она есть (модель износа включена)
    jobs: s => s.jobs ? { enqueue: spec => JB.enqueue(s.jobs, spec, s.year, pools(s)), list: () => JB.active(s.jobs).filter(j => j.owner === 'ev'), eta: j => JB.eta(j, s.year) } : null,
    // лом работ событий — в склад модели износа (четверть расхода, при завершении работы); переработка — работа мастерской
    scrapAdd: (s, x, src) => { if (!s.wear || !wearOn(s)) return false; W.addScrap(s.wear, W.SCRAP_BACK * x, `ev.${src}`, s.year); wearShop(s, s.year); return true; },
    scrapOwned: s => !!s.wear });
  // ---- журнал запасов и людей, ревизии маршрута (DOC «Долгий рейс — износ и смена курса», шаг 1).
  // Журнал: каждое изменение запасов и числа погибших — записью с причиной: решение (id/вариант), сцена (id), граница
  // модели (событие, удар, выход из ядра). Сумма записей сходится с состоянием — одно происшествие не считается дважды
  // и не теряется (проверка test-engine). Расчётные потери в капсулах (lossesOf) — пока вне журнала: их заменят отказы
  // капсульных групп модели износа.
  // Ревизия маршрута: цель, скорость, магнит, прибытие. Номер растёт при каждой смене; по ревизиям видно исходный курс
  // (последняя ревизия до отлёта) и каждый поворот с причиной
  const BOOK_KEYS = ['materials', 'reserve', 'dead', 'deadHere', 'outpostDead', 'thawDead'];
  function startBooks(s) {
    s.book = { v: Object.fromEntries(BOOK_KEYS.map(k => [k, s[k] || 0])), log: [] };
    s.nav = { rev: 0, revs: [] };
  }
  function book(s, cause, at) {
    const b = s.book; if (!b) return;
    const d = {};
    for (const k of BOOK_KEYS) { const v = s[k] || 0; if (Math.abs(v - b.v[k]) > 1e-9) { d[k] = v - b.v[k]; b.v[k] = v; } }
    const last = b.log[b.log.length - 1];
    if (cause === 'wear.reg' && last && last.cause === cause && Object.keys(d).every(k => k in last.d)) {   // регламент списывает непрерывно — одна запись подряд
      for (const k of Object.keys(d)) last.d[k] += d[k]; last.at = at != null ? at : s.year; return; }
    if (Object.keys(d).length) b.log.push({ at: at != null ? at : s.year, cause, d });
  }
  function routeCheck(s, cause) {
    const n = s.nav; if (!n || !s.target || !s.arrive) return;
    const r = { target: s.target, beta: s.beta, tMag: s.tMag ?? null, arrive: s.arriveExact ?? s.arrive };
    const l = n.revs[n.revs.length - 1];
    if (l && l.target === r.target && l.beta === r.beta && l.tMag === r.tMag && Math.abs(l.arrive - r.arrive) < 1e-9) return;
    n.rev++; n.revs.push(Object.assign({ rev: n.rev, at: s.year, cause }, r));
  }
  const track = (s, cause) => { routeCheck(s, cause); book(s, cause); };
  // исходный курс — последняя ревизия до отлёта (выбор цели и паспорт — в год 0); дальше — повороты
  const navDeparture = s => s.nav ? s.nav.revs.filter(r => r.at <= 0).pop() || null : null;
  const sim = { active: () => true, advance: simAdvance, notes: simNotes,
    decision: (s, ev) => ev.kind === 'event' ? EV.decision(s, ev) : ev.kind === 'wear' ? wearDecision(s, ev) : serviceDecision(s, ev),
    decided: (s, beat) => { EV.decided(s); wearSync(s); track(s, beat ? `${beat.id}/${s.choices[beat.id]}` : 'model'); },   // плановый совет, вахта в зале, ревизия маршрута, журнал
    applied: (s, beat) => { wearSync(s); track(s, beat.id); }, observe: observeShip, report: simReport, calendar: CAL.map(c => c.id),
    terminal: s => s.terminalAt != null, endBeat: s => terminalBeat(s) };   // рейс окончен состоянием корабля (шаг 3d)
  // прибор щита: минимум остатка по панелям — среднее скрыло бы опасную дыру
  function shieldGaugeV5(s, lang) {
    const o = SH.observe(s.shield), ru = lang === 'ru', kg = ru ? 'кг/м²' : 'kg/m²';
    const worst = o.damaged.slice().sort((a, b) => a.residual - b.residual)[0];
    const dmg = !worst ? (ru ? 'повреждений нет' : 'no damage')
      : worst.state === 'breached' ? (ru ? `${worst.panel}: сквозной пробой` : `${worst.panel}: through-breach`)
      : worst.state === 'patched' ? (ru ? `${worst.panel}: заплата, ${nf(worst.residual, 1, lang)} ${kg}` : `${worst.panel}: patch, ${nf(worst.residual, 1, lang)} ${kg}`)
      : (ru ? `${worst.panel}: выбоина, остаток ${nf(worst.residual, 1, lang)} ${kg}` : `${worst.panel}: scar, ${nf(worst.residual, 1, lang)} ${kg} left`);
    return `${ru ? 'минимум' : 'minimum'} ${nf(o.min, 2, lang)} ${kg} · ${dmg}`;
  }
  // крупный заголовок по центру кадра (интерфейс): итог экспедиции у концовки и происшествие экрана.
  // Только то, что знает экспедиция: состояние партии и записи протокола
  const endHeadline = (s, id, lang) => {
    const ru = lang === 'ru', kicker = ru ? 'Итог экспедиции' : 'Expedition outcome', yr = y => ru ? `год ${Math.floor(y)}` : `year ${Math.floor(y)}`;
    const lost = [...(s.incidents || [])].reverse().find(x => x.lost);
    if (id === 'x.lost' && lost) return { kicker, lines: [ru ? `На борту было ${ppl(lost.aboard)}` : `${lost.aboard} were aboard`, yr(lost.year)] };
    if (/^x\.sos\./.test(id) && s.incident) return { kicker, lines: [ru ? `В капсулах — ${ppl(s.incident.sleepers)}, на вахте — ${s.incident.watch}` : `${s.incident.sleepers} in the capsules, ${s.incident.watch} on watch`,
      ru ? `сигнал бедствия — ${yr(s.incident.sent)}` : `distress signal — ${yr(s.incident.sent)}`] };
    if (id === 'e.end' && s.arrive) {
      const road = lossesOf(s, s.arrive).total + s.dead, lines = [ru ? `Позади ${yrs(Yepi(s))}` : `${yrsEn(Yepi(s))} behind`];
      if (s.mission === 'rescue' && s.rescued) lines.push(ru ? `спасены ${ppl(s.rescued)} из Оттепели` : `${s.rescued} saved from Thaw`);
      if (s.mission === 'contact' && s.task) { const n = taskName(s.task, lang);
        lines.push(s.task.done ? (ru ? `задание выполнено: ${n}` : `task done: ${n}`) : (ru ? `задание не выполнено: ${n}` : `task not done: ${n}`)); }
      lines.push(ru ? `погибли в пути — ${road}, у цели — ${s.deadHere}` : `died on the road — ${road}, at the target — ${s.deadHere}`);
      return { kicker, lines };
    }
    return { kicker, lines: [] };
  };
  const HEADLINE_NAME = { cloud: ['Пробой щита у облака', 'Shield breach at the cloud'], stream: ['Удар потока у Тёмной звезды', 'The stream strikes at the Dark Star'],
    loop: ['Авария общей магистрали', 'The common main fails'], supplyCargo: ['Отказ охлаждения в дрейфе', 'Cooling fails in the drift'],
    supplyExposure: ['Монтаж под вспышками', 'Installation under the flares'], supplyBus: ['Отказ общей платы', 'The common board fails'],
    rescueLate: ['Сроки капсул Оттепели', "Thaw's capsule lives run out"], rescueSection: ['Протекающая секция склада', "The store's section leaks"],
    rescueDock: ['Срыв крепления склада', "The store's mount gives way"], wearGroup: ['Группа без охлаждения', 'A group without cooling'], wearLost: ['Ядро без охлаждения', 'The core without cooling'], rescueWake: ['Массовое пробуждение', 'Mass waking'], rescueWater: ['Вода старой площадки', "The old site's water"] };
  const incidentHeadline = (inc, lang) => {
    const ru = lang === 'ru', name = HEADLINE_NAME[inc.kind] ? HEADLINE_NAME[inc.kind][ru ? 0 : 1] : INCIDENT_NAME[inc.kind] ? INCIDENT_NAME[inc.kind][ru ? 'ru' : 'en'] : inc.kind;
    const who = inc.pop === 'thaw' ? (ru ? ' Оттепели' : ' of Thaw') : /^rescue/.test(inc.kind) ? (ru ? ' экипажа' : ' of the crew') : '';
    return { kicker: ru ? `Происшествие · год ${incYear(inc)}` : `Incident · year ${incYear(inc)}`, title: name[0].toUpperCase() + name.slice(1),
      lines: [inc.lost ? (ru ? 'Корабль потерян' : 'The ship is lost') : inc.dead ? (ru ? `Погибших${who} — ${inc.dead}` : `Dead${who}: ${inc.dead}`) : (ru ? 'Погибших нет' : 'No one died')] };
  };
  // осмотр щита (шаг 6): карточка панели — состояние, остаток, прогноз при нынешнем потоке, история работ.
  // Прогноз — по среде, в которой корабль уже идёт (её видит вахта), без скрытых опасностей впереди
  const PANEL_STATE = { ok: ['цела', 'intact'], scarred: ['выбоина', 'scar'], patched: ['заплата', 'patch'], breached: ['сквозной пробой', 'through-breach'], new: ['заменена', 'replaced'] };
  function shieldInspect(s, id, lang) {
    if (!s.shield) return null;
    const ru = lang === 'ru', kg = ru ? 'кг/м²' : 'kg/m²', V = SH.publicView(s.shield), p = V.panels.find(x => x.id === id) || V.panels[0];
    const yr = y => ru ? `год ${nf(y, 2, 'ru')}` : `year ${nf(y, 2, 'en')}`;
    const where = p.belt ? (ru ? `пояс ${p.belt}, ${p.r0}–${p.r1} м от оси` : `belt ${p.belt}, ${p.r0}–${p.r1} m from the axis`) : (ru ? `центр носа, до ${p.r1} м` : `nose centre, out to ${p.r1} m`);
    const lines = [`${ru ? 'Остаток' : 'Residual'} — ${nf(p.residual, 2, lang)} ${kg} ${ru ? 'из' : 'of'} ${V.nominal}; ${ru ? 'сервисный допуск' : 'service limit'} — ${V.service} ${kg}.`];
    if (p.belt && V.spares[p.belt] != null && s.shield.kind === 'sectors') lines.push(ru ? `Запасных панелей пояса ${p.belt}: ${V.spares[p.belt]}.` : `Spare belt ${p.belt} panels: ${V.spares[p.belt]}.`);
    // прогноз: сколько до допуска при последнем измеренном потоке пыли (наблюдение модели, не план среды впереди)
    const F = s.shield.flux, rate = F ? SH.RULES.eta / SH.RULES.Q * F.w * SH.YEAR_S : 0;   // кг/м² в год
    const left = p.residual - V.service, fw = F ? nf(F.w, F.w >= 100 ? 0 : F.w >= 1 ? 2 : 4, lang) : '';
    lines.push(left <= 0 ? (ru ? 'Допуск исчерпан: нужна замена или заплата.' : 'The limit is exhausted: a replacement or a patch is needed.')
      : !(rate > 0) ? (ru ? 'При нынешнем потоке пыли допуск не достигается.' : 'At the present dust flux the limit is not reached.')
      : left / rate > 1000 ? (ru ? `При последнем измеренном потоке (${fw} Вт/м²) запас до допуска — больше тысячи лет.` : `At the last measured flux (${fw} W/m²) the margin to the limit is over a thousand years.`)
      : left / rate >= 1 ? (ru ? `При последнем измеренном потоке (${fw} Вт/м²) допуск — через ${yrs(left / rate)}.` : `At the last measured flux (${fw} W/m²) the limit is reached in about ${yrsEn(left / rate)}.`)
      : (ru ? `При последнем измеренном потоке (${fw} Вт/м²) допуск — через ${days(Math.max(1, Math.round(left / rate * 365.25)), 'ru')}.` : `At the last measured flux (${fw} W/m²) the limit is reached in ${days(Math.max(1, Math.round(left / rate * 365.25)), 'en')}.`));
    // история: удары, работы, прогорание — по годам
    const hist = [];
    for (const h of V.hits.filter(x => x.panel === p.id)) {
      hist.push({ at: h.at, t: ru ? `${yr(h.at)} — удар зерна ${nf(h.radius * 1000, 2, 'ru')} мм, ${nf(h.energy / 1e6, 0, 'ru')} МДж: ${h.first === 'breached' ? 'пробой' : 'выбоина'}`
        : `${yr(h.at)} — grain ${nf(h.radius * 1000, 2, 'en')} mm, ${nf(h.energy / 1e6, 0, 'en')} MJ: ${h.first === 'breached' ? 'breach' : 'scar'}` });
      if (h.patchedAt != null) hist.push({ at: h.patchedAt, t: ru ? `${yr(h.patchedAt)} — аварийная заплата, ${SH.RULES.patch} ${kg}` : `${yr(h.patchedAt)} — emergency patch, ${SH.RULES.patch} ${kg}` });
      if (h.burntAt != null) hist.push({ at: h.burntAt, t: ru ? `к ${yr(h.burntAt).replace('год', 'году')} — пыль прожгла заплату` : `by ${yr(h.burntAt)} — dust burned through the patch` });
    }
    if (p.renewedAt != null) hist.push({ at: p.renewedAt, t: ru ? `${yr(p.renewedAt)} — панель заменена запасной` : `${yr(p.renewedAt)} — the panel was replaced with a spare` });
    hist.sort((a, b) => a.at - b.at);
    return { id: p.id, state: p.state, title: `${ru ? 'Панель' : 'Panel'} ${p.id} · ${PANEL_STATE[p.state][ru ? 0 : 1]}`, where, lines,
      history: hist.length ? hist.map(h => h.t) : [ru ? 'Ударов и работ не было.' : 'No impacts or work.'], view: V };
  }

  // что изменится: только отличающиеся приборы, с разницей для чисел
  function gaugeDiff(a, b, lang) {
    const A = gauges(a, lang), B = gauges(b, lang), sign = x => (x > 0 ? '+' : '−') + (Math.abs(x) % 1 ? pct(Math.abs(x), lang) : Math.abs(x));
    return B.filter(g => { const o = A.find(x => x.id === g.id); return !o || o.value !== g.value; })
      .map(g => { const o = A.find(x => x.id === g.id); const d = o && g.n !== undefined && o.n !== undefined ? g.n - o.n : 0;
        return `${g.label} ${g.value}` + (d ? ` (${sign(d)})` : ''); });
  }
  const stageYears = s => brake(s) + M.brakeDist(s.beta, s.tMag) / s.beta - M.ACC;   // от отделения ступени до прохода цели
  const stagePass = s => M.ACC + stageYears(s);
  // кто на борту читает слабые спектры (для поиска поддержки)
  const reader = (s, lang) => s.taught ? (lang === 'ru' ? 'ученики Коры' : "Kora's students") : s.koraYear ? (lang === 'ru' ? 'Ная Сорн' : 'Naya Sorn')
    : hasIR(s) ? (lang === 'ru' ? 'инфракрасная обсерватория' : 'the infrared observatory') : null;
  // сутки проверки потока: проверка и манёвр должны уложиться в окно до ядра (streamWin)
  const CHECK = { probe: 10, kora: 21, student: 26 };
  const burnDays = s => s.highPower ? 0.25 : 12;
  const CHECK_PLUS = { student: 18 };                                   // расширенная спектрометрия: ученики читают поток быстрее; Кору будят три недели в любом случае
  const checkDays = (s, k) => eqOf(s).sensors === 'spectraPlus' && CHECK_PLUS[k] ? CHECK_PLUS[k] : CHECK[k];
  // поток: в 30% партий опасная полоса пересекает номинальный курс. Зонд (10 суток) видит её в 9 из 10,
  // Кора (21) — в 19 из 20, ученики (26, со спектрометрией 18) — в 8 из 10. Удар — при проходе или опоздавшем уходе:
  // целый щит и полная мощность — 8 погибших, нет одного — 27, нет обоих — гибель корабля
  const STREAM = { wide: 0.3, sense: { probe: 0.9, kora: 0.95, student: 0.8 }, dead: { 1: 8, 2: 27 } };
  const streamWide = s => (hidden(s, 'contact.stream.wide') ?? 1) < STREAM.wide;
  // поток у Тёмной звезды — место на пути, отсчитанное от цели (DOC «Симулятор v1 — время и щит», шаг 5):
  // предупреждение и вход в ядро — на 0,0328 и 0,0315 св. года до цели (на эталоне — «прибытие − 5» и 30 суток до
  // ядра), ядро толщиной 0,00012 св. года (около трёх суток на 0,015c). Предвестник — 10⁻¹⁸ кг/м³; ядро на курсе —
  // только при широкой полосе (скрытый факт streamWide): 10⁻¹⁶ кг/м³ и одно зерно 1,9–2,1 мм.
  const STREAM_X = { warn: 0.032809771231847, core: 0.031545807335968, thick: 0.00012, dark: 1900 / 63241.077 };   // dark — ближайший проход пары карликов, 1900 а.е. до цели вдоль пути
  const STREAM_RHO = { pre: 1e-18, core: 1e-16 }, STREAM_MAT5 = { 1: 5, 2: 10 };   // отсеки; щит — отдельным решением
  const STREAM_MEMO = new Map();
  // года предупреждения, входа в ядро и выхода из него: остаток пути до цели — интеграл той же скорости, что у модели
  function streamTimes(s) {
    const key = `${s.beta}|${s.arrive}|${s.tMag}`;
    if (STREAM_MEMO.has(key)) return STREAM_MEMO.get(key);
    const v = t => M.speedAt(t, s.beta, s.arrive, s.tMag), h = 0.002;
    const left = y => { const n = Math.max(2, 2 * Math.ceil((s.arrive - y) / h / 2)), dt = (s.arrive - y) / n; let a = 0;
      for (let i = 0; i <= n; i++) a += (i === 0 || i === n ? 1 : i % 2 ? 4 : 2) * v(y + i * dt); return a * dt / 3; };
    const at = x => { let lo = s.arrive - 30, hi = s.arrive; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (left(m) > x) lo = m; else hi = m; } return (lo + hi) / 2; };
    const T = { warn: at(STREAM_X.warn), core: at(STREAM_X.core), exit: at(STREAM_X.core - STREAM_X.thick), dark: at(STREAM_X.dark) };
    STREAM_MEMO.set(key, T); return T;
  }
  const streamWin = s => (streamTimes(s).core - streamTimes(s).warn) * 365.25;      // окно до ядра, сутки
  // мимо Тёмной звезды: пара карликов лежит в 1460 а.е. поперёк пути к A (проекция на небо) и — по выбору автора, данные
  // это допускают — на 1900 а.е. впереди A вдоль луча, у потока. Ближе 1460 а.е. путь к ней не подходит; диск отсюда не виден.
  // Встать рядом с парой — прежде всего погасить скорость прохода (тысячи км/с); сверх того — поперечный перенос и путь к A
  const DARK = { side: 1460 };                                            // а.е.
  const darkAt = s => streamTimes(s).dark;
  function discText(s, lang) {
    const ru = lang === 'ru', vk = vAt(s, darkAt(s)) * 299792.458, v = Math.round(vk / 10) * 10, res = kms0(s);
    // остановиться у пары: одно только гашение скорости прохода больше малого резерва; при большом — съело бы его, а у цели он нужнее
    const stop = res < vk ? (ru ? `Встать рядом с ней нечем: одно гашение скорости прохода — ${v} км/с, больше всего резерва манёвров (${res} км/с).`
        : `There is nothing to stop beside it with: just killing the passing speed takes ${v} km/s, more than the whole manoeuvre reserve (${res} km/s).`)
      : (ru ? `Встать рядом с ней — одно гашение скорости прохода съело бы ${Math.round(100 * vk / res)}% резерва манёвров (${v} из ${res} км/с), а ещё поперечный перенос и годы пути обратно к A. Совет решает идти мимо.`
        : `Stopping beside it — just killing the passing speed would eat ${Math.round(100 * vk / res)}% of the manoeuvre reserve (${v} of ${res} km/s), plus the sideways transfer and years back to A. The council decides to go past.`);
    const lead = s.streamRoute === 'pass' ? (ru ? 'Край потока проводит' : 'The edge of the stream takes') : (ru ? 'Изменённая траектория проводит' : 'The changed trajectory takes');
    const log = ru ? `Они пытались вскрыть диск, прорезая один из спиральных выступов. Разрез выпустил пламя; чужой металл заварил пролом сам. Погибла часть экипажа, двигатель был повреждён. Маяк диска проснулся от вскрытия — это и был сигнал, который приняло Кольцо. Выжившие годами держались на орбите, пока питание капсул не иссякло.`
      : `They tried to open the disc by cutting through one of the spiral ridges. The cut let out flame; the alien metal welded the breach shut by itself. Part of the crew died, the engine was damaged. The disc's beacon woke at the breach — that was the signal the Ring received. The survivors held on in orbit for years, until the capsules' power ran out.`;
    return ru ? `${lead} корабль мимо пары карликов — источника сигнала. Ближе ${DARK.side} а.е. путь к ε Индейца A к ним не подходит: пара лежит в стороне. ${stop}

В инфракрасные телескопы карлики видны двумя тусклыми точками. Диск отсюда не разглядеть ни в один прибор: четыреста метров с такого расстояния — миллионные доли угловой секунды. Зато слышны оба маяка — диска и корабля тридцать второй. Радио от пары идёт больше восьми суток.

Маяк тридцать второй на изотопном питании передаёт их бортовой журнал по кругу; за несколько суток его принимают целиком. В журнале — их собственные снимки: дискообразный корпус около четырёхсот метров поперёк, миллионы лет как мёртвый, со спиральными выступами по поверхности, и заваренный разрез на одном из выступов. ${log}

Когда пара остаётся позади, экипаж проводит обряд имён: каждого из тридцать второй называют вслух по реестру и показывают его запись в архиве.

Последняя запись журнала — голос женщины: тем, кто придёт, — не вскрывать корпус.`
      : `${lead} the ship past the pair of dwarfs — the source of the signal. The road to ε Indi A comes no closer to them than ${DARK.side} AU: the pair lies off to the side. ${stop}

In the infrared telescopes the dwarfs are two faint points. The disc cannot be seen from here by any instrument: four hundred metres at this distance is millionths of an arcsecond. But both beacons are heard — the disc's and the Thirty-Second's ship's. Radio from the pair takes more than eight days.

The Thirty-Second's beacon, on isotope power, sends their log round and round; within a few days it is received in full. The log holds their own pictures: a disc-shaped hull about four hundred metres across, dead for millions of years, with spiral ridges across its surface, and a welded cut on one of the ridges. ${log}

When the pair is behind, the crew holds the rite of names: each of the Thirty-Second is named aloud from the register, and their archive entry is shown.

The log's last entry is a woman's voice: to those who come after — do not open the hull.`;
  }
  const warnAt = s => src(s) ? streamTimes(s).warn : s.arrive - 5;   // вход в систему — точка предупреждения
  const streamAt = s => s.streamImpact && s.streamImpact.out != null ? s.streamImpact.out : s.arrive - 5;   // выход из ядра после удара
  const sosAtStream = s => s.streamImpact && s.streamImpact.out != null ? Math.max(s.streamImpact.out, s.streamImpact.done ?? s.streamImpact.out) : s.arrive - 5;   // сигнал — после манёвра ухода
  const days = (n, lang) => lang === 'ru' ? `${n} ${plural(n, ['сутки', 'суток', 'суток'])}` : `${n} day${n === 1 ? '' : 's'}`;
  // сколько снимает пыль ядра за весь проход (кг/м²) — для подсказки о слабом месте; на свежей копии, без скрытых фактов
  const coreLoss = s => { const T = streamTimes(s); return SH.erode(SH.create('dust20'), T.core, T.exit, y => M.speedAt(y, s.beta, s.arrive, s.tMag), STREAM_RHO.core).dSigma; };
  const win = s => Math.round(streamWin(s));
  // план прохода: когда начат и закончен манёвр ухода, когда удар зерна, сколько корабль в предвестнике и в ядре
  function streamPlan(s) {
    const T = streamTimes(s), wide = streamWide(s);
    const start = s.streamRoute === 'evade' ? T.warn + (s.streamDays || 0) / 365.25 : null;
    const done = start != null ? start + burnDays(s) / 365.25 : null;
    const g = T.core + (hidden(s, 'shield.stream.hit.0.time') ?? 0.5) * (T.exit - T.core);
    let coreEnd = null, hit = false;
    if (wide && s.streamRoute && (done == null || done > T.core)) {                 // ядро на курсе и уйти до него не успели
      if (done != null) { coreEnd = Math.min(done, T.exit); hit = g < coreEnd; }
      else { hit = true; coreEnd = Math.min(T.exit, g + burnDays(s) / 365.25); } // после удара — уход из ядра
    }
    return Object.assign({}, T, { done, g, hit, coreEnd, preEnd: done != null ? Math.min(done, T.exit) : T.exit });
  }
  const streamDv = s => dvPct(s, s.highPower ? DV.stream : DV.streamWeak);
  const canEvade = s => s.reserve >= streamDv(s);
  const streamLate = s => (s.streamDays || 0) + burnDays(s) > streamWin(s);   // граница включительна: ровно по окну — вовремя
  const windowLine = (s, lang) => { const ru = lang === 'ru', d = s.streamDays || 0, bd = s.highPower ? (ru ? '6 часов' : '6 hours') : (ru ? '12 суток' : '12 days'), W = streamWin(s), over = d + burnDays(s) - W;
    return ru ? `Окно — ${days(win(s), 'ru')}: прошло ${d}, манёвр — ${bd}.` + (over > 0 ? ` Не успеваем на ${Math.ceil(over)} сут.` : ' Успеваем.')
      : `Window: ${days(win(s), 'en')} — ${d} gone, manoeuvre ${bd}.` + (over > 0 ? ` Too late by ${Math.ceil(over)} days.` : ' In time.'); };
  // проверка у потока даёт сведения; маршрут — отдельным решением (d.streamRoute)
  function streamCheckEffect(st, k) {
    st.streamCheck = k; st.streamDays = checkDays(st, k);
    st.streamFound = streamWide(st) && (hidden(st, 'contact.stream.check') ?? 1) < STREAM.sense[k];
  }
  // ответ приходит в свой срок — в совете о маршруте; в записи выбора — только начало проверки
  const streamFoundRecord = { ru: s => `Проверка начата: ответ — через ${days(s.streamDays, 'ru')}.`,
    en: s => `The check has begun: the answer in ${days(s.streamDays, 'en')}.` };
  const probeOK = s => probesLeft(s) || s.materials >= 5;              // зонд: готовый или из материалов
  const pctFrom = (p, lang) => lang === 'ru' ? { 0.9: 'в девяти случаях из десяти', 0.95: 'в девятнадцати случаях из двадцати', 0.8: 'в восьми случаях из десяти' }[p] : { 0.9: 'nine times in ten', 0.95: 'nineteen times in twenty', 0.8: 'eight times in ten' }[p];
  function streamOptions(s) {
    const out = [{
      id: 'probe', label: { ru: 'Зонд Тамира', en: "Tamir's probe" },
      known: {
        ru: s => [probesLeft(s) ? 'Готовый зонд: прямые детекторы, без трат материалов.' : 'Зонд из материалов для высадки: −5% запаса.', `${checkDays(s, 'probe')} суток: прямые детекторы видят опасную полосу ${pctFrom(STREAM.sense.probe, 'ru')}.`, 'Решать, уходить ли, — по результату.'],
        en: s => [probesLeft(s) ? 'A ready probe: direct detectors, no materials spent.' : 'A probe from landing materials: −5% of stock.', `${checkDays(s, 'probe')} days: direct detectors see the dangerous band ${pctFrom(STREAM.sense.probe, 'en')}.`, 'Whether to leave is decided on the result.']
      },
      cost: st => { if (!probesLeft(st)) st.materials -= 5; },
      effect: st => { if (!probesLeft(st)) st.materials -= 5; streamCheckEffect(st, 'probe'); },
      record: streamFoundRecord
    }].filter(o => probeOK(s)).concat([{
      id: 'kora', label: { ru: 'Разбудить Кору', en: 'Wake Kora' },
      known: {
        ru: s => ['Её последнее пробуждение: у цели Кору будить будет нельзя.', `${checkDays(s, 'kora')} суток: Кора видит опасную полосу ${pctFrom(STREAM.sense.kora, 'ru')}.`, 'Решать, уходить ли, — по результату.'],
        en: s => ['Her last waking: at the target Kora cannot be woken again.', `${checkDays(s, 'kora')} days: Kora sees the dangerous band ${pctFrom(STREAM.sense.kora, 'en')}.`, 'Whether to leave is decided on the result.']
      },
      effect: st => { st.koraLast = true; st.koraAwake += 1; streamCheckEffect(st, 'kora'); },
      record: streamFoundRecord
    }]);
    if (s.taught || s.koraYear) out.push({
      id: 'student', label: { ru: s => s.taught ? 'Разбудить учеников Коры' : 'Разбудить Наю Сорн', en: s => s.taught ? "Wake Kora's students" : 'Wake Naya Sorn' },
      known: {
        ru: s => ['Кора остаётся для цели.', `${checkDays(s, 'student')} суток: видят опасную полосу ${pctFrom(STREAM.sense.student, 'ru')}.`, 'Решать, уходить ли, — по результату.'],
        en: s => ['Kora is kept for the target.', `${checkDays(s, 'student')} days: they see the dangerous band ${pctFrom(STREAM.sense.student, 'en')}.`, 'Whether to leave is decided on the result.']
      },
      effect: st => { streamCheckEffect(st, 'student'); },
      record: streamFoundRecord
    });
    if (canEvade(s)) out.push({
      id: 'evade', label: { ru: 'Уходить сразу', en: 'Leave at once' },
      known: {
        ru: s => [`Резерв манёвров −${f1(streamDv(s), 'ru')}% паспортного.`, windowLine(s, 'ru'), 'Опасна ли полоса — так и не узнаем.'],
        en: s => [`Manoeuvre reserve −${f1(streamDv(s), 'en')}% of rated.`, windowLine(s, 'en'), 'Whether the band was dangerous we will never know.']
      },
      cost: st => { st.reserve -= streamDv(st); },
      effect: st => { st.reserve -= streamDv(st); st.streamRoute = 'evade'; },
      record: { ru: 'Совет решает уходить, не дожидаясь измерений.', en: 'The council decides to leave without waiting for measurements.' }
    });
    out.push({
      id: 'model', label: { ru: 'Довериться модели', en: 'Trust the model' },
      known: {
        ru: s => ['91% за безопасный проход — если модель верна и набор гипотез полон.', 'Ни циклов, ни материалов, ни времени.', riskLine(s, 'ru')],
        en: s => ['91% for a safe passage — if the model is correct and the hypothesis set complete.', 'No cycles, no materials, no time.', riskLine(s, 'en')]
      },
      effect: st => { st.streamRoute = 'pass'; },
      record: { ru: 'Корабль идёт по краю потока, не меняя курса.', en: 'The ship runs along the edge of the stream without changing course.' }
    });
    return out;
  }
  // энергия у цели: груз поддержки или работающий изомерный контур
  const energyOK = s => s.support === 'found' || powerOK(s);
  const riskLine = (s, lang) => { const ru = lang === 'ru', r = [];
    if (s.shield) {                                      // слабое место — по модели щита (ядро снимает ~10 кг/м²)
      const cl = coreLoss(s), w = SH.observe(s.shield).damaged.filter(d => d.residual < cl).sort((a, b) => a.residual - b.residual)[0];
      if (w) r.push(ru ? (w.residual <= 0 ? `в панели ${w.panel} открытая пробоина — пыль ядра пойдёт прямо в отсек` : `в панели ${w.panel} ${nf(w.residual, 1, 'ru')} кг/м², а ядро потока снимает до ${nf(cl, 1, 'ru')}`)
        : (w.residual <= 0 ? `panel ${w.panel} has an open hole — the core dust goes straight into the compartment` : `panel ${w.panel} has ${nf(w.residual, 1, 'en')} kg/m², and the stream's core removes up to ${nf(cl, 1, 'en')}`));
    } else if (breached(s)) r.push(ru ? 'сектор щита, пробитый у облака, держит меньше' : 'the shield sector breached at the cloud holds less');
    if (!s.highPower) r.push(ru ? 'без полного контура быстро уйти из потока нельзя' : 'without the full loop there is no quick way out of the stream');
    return r.length ? (ru ? 'Если поток ударит: ' : 'If the stream hits: ') + r.join('; ') + '.' : (ru ? 'Если поток ударит — щит цел, контур полный.' : 'If the stream hits — the shield is whole, the loop full.'); };                   // в комплекте два зонда: один остаётся всегда
  const bad = w => ['hostile', 'ruined', 'none'].includes(w);
  // Акт IV: мир пригоден для высадки (открытый или под куполами); иначе дом — на орбите, спутниках или в пути
  const livable = s => s.mission !== 'supply' && ['open', 'dome'].includes(M.worldOf(s.target));
  // Акт III — за 12 лет до прибытия, но не раньше раскрытия магнита: после поворота к источнику скорость ниже и торможение короче
  const Y3 = s => M.actIII(s.arrive, s.tMag);
  const Y4 = s => s.arrive + 3;                                        // первое утро дома
  const answerLag = s => 2 * Math.round(M.star(s.target).d) + 2;      // отчёт туда, ответ обратно и решение Совета
  const Yepi = s => Y4(s) + answerLag(s);
  const laserYear = s => s.arrive + 1 + laserNews(s);
  // исход партии по фактическому состоянию
  const OUTCOME = {
    mainstay: { ru: 'Новая опора Кольца', en: 'A new mainstay of the Ring' },
    lean: { ru: 'Неполная, но живая колония', en: 'An incomplete but living colony' },
    orbital: { ru: 'Орбитальный дом', en: 'An orbital home' },
    beacon: { ru: 'Маяк для следующих', en: 'A beacon for those who follow' },
    return: { ru: 'Возвращение', en: 'The return' },
    delivered: { ru: 'Форпост снова в Кольце', en: 'The outpost back in the Ring' },
    partialSupply: { ru: 'Форпост спасён наполовину', en: 'The outpost half saved' },
    sheltered: { ru: 'Форпост под крылом корабля', en: 'The outpost under the ship\'s wing' },
    supplyFailed: { ru: 'Снабжение сорвано', en: 'The supply mission failed' },
    housed: { ru: 'Спасены и устроены', en: 'Rescued and housed' },
    unhoused: { ru: 'Спасены, но без постоянных мест', en: 'Rescued, awaiting housing' },
    tooLate: { ru: 'Опоздали', en: 'Too late' },
    rescueFailed: { ru: 'Спасены, но обязательство не выполнено', en: 'Rescued, but the commitment failed' }
  };
  function outcomeOf(s) {
    if (s.mission === 'supply' && supplyS(s)) { if (s.supplyFailed) return 'supplyFailed'; if ((s.outpostDead || 0) > 0 || (s.supplyCrewDead || 0) > 0) return 'partialSupply'; }
    if (s.mission === 'supply') return !(s.relayOK && s.capsOK) ? 'partialSupply' : s.shelter ? 'sheltered' : 'delivered';
    if (rescueS(s) && s.rescued && !s.housed && s.thawPlace === 'infirmary') return 'rescueFailed';   // срок лазарета истёк без жилья
    if (s.mission === 'rescue') return !s.rescued ? 'tooLate' : s.housed ? 'housed' : 'unhoused';      // версия 3: полнота — в итоге, не в названии исхода
    if (s.home === 'return') return 'return';
    if (s.home === 'beacon') return 'beacon';
    if (!livable(s) || s.settle === 'orbit') return 'orbital';
    const deadAll = lossesOf(s, s.arrive).total + s.dead + s.deadHere;
    return s.winterDead > 0 || deadAll > 60 ? 'lean' : 'mainstay';
  }                  // когда до нас дойдёт весть с Тёмной звезды
  const laserLate = s => !src(s) && laserYear(s) > Yepi(s);
  // экспедиция эпохи III из сводки a3.epoch3: парус уходит с Земли, когда отправлена сводка (год приёма минус задержка),
  // к источнику; если источник — наша цель, то к δ Павлина. Разгон и торможение — как у спасательного паруса Земли
  const EPOCH3 = { beta: 0.2, acc: 2, dec: 8, far: 'Gl 780' };
  function epoch3(s) {
    if (!s.arrive || !s.target) return null;
    const news = Y3(s);
    return { launch: news - lag(s, news), news, star: src(s) ? EPOCH3.far : M.SOURCE, beta: EPOCH3.beta, acc: EPOCH3.acc, dec: EPOCH3.dec };
  }
  // лазерная экспедиция эпохи III: от Земли к ε Индейца на 0,2c; весть о находке идёт от ε Индейца к нам
  function laserNews(s) {
    const t0 = epoch3(s).launch, a = M.star(M.SOURCE), b = M.star(s.target);
    const d = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
    return Math.max(2, Math.round(t0 + a.d / EPOCH3.beta + (EPOCH3.acc + EPOCH3.dec) / 2 + d - (s.arrive + 1)));
  }
  const skipTo = (f, ru, en) => ({ kind: 'skip', toYear: s => Y(s, f),
    label: { ru: s => `Промотать до года ${Y(s, f)}${ru ? ' · ' + ru : ''}`, en: s => `Skip ahead to year ${Y(s, f)}${en ? ' · ' + en : ''}` } });
  const bulletinTitle = f => ({
    ru: s => `Сводка Кольца · отправлена с Земли ${yrs(lag(s, Y(s, f)))} назад`,
    en: s => `Ring bulletin · sent from Earth ${yrsEn(lag(s, Y(s, f)))} ago`
  });
  // что из решений Акта I уходящая вахта разбирает последним
  function lastCall(s, lang) {
    const c = s.choices, ru = lang === 'ru', E = s.earlyCouncil;
    const why = E && (E.family === 'signal' ? (ru ? 'сообщения об источнике' : 'the report on the source') : (ru ? 'новых сведений о мирах' : 'new information on the worlds'));
    if (E && E.choice === 'turn') return ru ? `смену курса с ${nameAt(E.from, 'ru')} на ${nameAt(E.to, 'ru')} после ${why}` : `the course change from ${M.nameOf(E.from, 'en')} to ${M.nameOf(E.to, 'en')} after ${why}`;
    if (c['d.cloud'] === 'trust') return ru ? 'доверие модели у края облака и полтора года щита' : 'trusting the model at the cloud edge, and a year and a half of shield';
    if (c['d.cloud'] === 'manoeuvre') return ru ? 'манёвр у облака и то, чем за него заплатили' : 'the manoeuvre at the cloud and what it cost';
    if (c['d.scout'] === 'launch') return ru ? 'зонд, отправленный вперёд' : 'the probe sent ahead';
    if (c['d.scout'] === 'keep') return ru ? 'зонд, который не стали строить' : 'the probe that was not built';
    if (c['d.long']) return ru ? `вахту в ${ppl(s.watch)}` : `a watch of ${s.watch}`;
    if (E) return ru ? `решение держать курс после ${why}` : `the decision to hold the course after ${why}`;
    return ru ? 'курс, выбранный на Земле' : 'the course chosen on Earth';
  }
  // миссии: окно спасения и опоздание снабженца (M.COLONIES)
  const thaw = () => M.colony('thaw'), xyl = () => M.colony('xylona');
  const thawDeadline = () => thaw().capsuleYears - thaw().diedAgo;          // год после старта, до которого держат капсулы Оттепели
  // склад Оттепели по точному времени (годы от старта 41-й): 34 живых до 124,5; первая необратимая потеря — год 125;
  // к 140 — 12, к 150 — никого. Помощь останавливает деградацию, когда операция закончена.
  const THAW0 = 34, THAW_LOSS = 125;
  const thawLife = t => t <= 124.5 ? 34 : t <= 125 ? 34 - (t - 124.5) * 2 : t <= 140 ? 33 - 21 * (t - 125) / 15 : t <= 150 ? 12 - 1.2 * (t - 140) : 0;
  const thawN = t => Math.max(0, THAW0 - Math.floor(THAW0 - thawLife(t) + 1e-9));
  const lifeAt = v => v >= 33 ? 124.5 + (34 - v) / 2 : v >= 12 ? 125 + (33 - v) * 15 / 21 : 140 + (12 - v) / 1.2;
  const nextLoss = t => thawN(t) > 0 ? lifeAt(thawN(t) - 1) : null;                 // год ближайшей потери
  const arriveX = s => s.arriveExact == null ? s.arrive : s.arriveExact;
  const f2 = (x, lang) => (lang === 'ru' ? x.toFixed(2).replace('.', ',') : x.toFixed(2));
  const PREP = 8, SHELTER_R = 15, RESTORE = 10, MOVE = 2;
  const thawLag = s => Math.max(1, Math.round(M.star(s.target).d - M.distLy(Y(s, 0.5), s.beta, s.arrive, s.tMag, M.star(s.target).d)));
  const housedOf = s => crewOf(s) < M.CREW || !!s.rescueShelter;      // постоянные места: сектор или жилой модуль
  const opStart = s => rescueS(s) ? storeNow(s) : arriveX(s) + (s.rescueShelter ? 0.25 : 0);   // операция начинается после стройки модуля
  const opTime = (s, op) => op === 'wake' ? 1 / 12 : s.rescuePrep ? 1 / 12 : 0.25;
  const months = (t, lang) => { const m = Math.max(0, Math.round(t * 12)); return lang === 'ru' ? `${m} ${plural(m, ['месяц', 'месяца', 'месяцев'])}` : `${m} month${m === 1 ? '' : 's'}`; };
  // ---- спасатель v3 (rescueS): реестр Оттепели, тепловой срок секции, торможение, крепление, площадка
  // Реестр «colony:thaw» — 40 мест: 0–5 умерли до рейса, 6–39 — тридцать четыре живых. Срок капсулы i — (i − 5)-я потеря
  // по thawN: без аварий живые по реестру совпадают с thawN. Протекающая секция — капсулы 6–17 (старейшие).
  const THAW_REG = 40, THAW_HIST = 6, YD = 365.25;
  const thawAt = i => lifeAt(39 - i);
  const inSection = i => i >= 6 && i <= 17;
  const thawName = (i, lang) => popName(null, 'thaw', i, lang);
  const namesShort = (ids, lang) => ids.length <= 5 ? thawNames(ids, lang) : `${ids.slice(0, 5).map(i => thawName(i, lang)).join(', ')} ${lang === 'ru' ? `и ещё ${ids.length - 5}` : `and ${ids.length - 5} more`}`;
  const thawNames = (ids, lang) => ids.length ? ids.map(i => thawName(i, lang)).join(', ') : (lang === 'ru' ? 'нет' : 'none');
  // скрытое (версия 3): протяжённое разрежение — 25% (передовые данные видят его в 8 из 10), надлом крепления — 25%
  // (осмотр видит в 9 из 10), примесь у старой площадки после выброса — 60% (короткое испытание — половина, длительное — 95%).
  // Тепловой запас секции — 36 суток от паспортного прибытия: задержка торможения съедает его; разрыв линии — 12 суток.
  const RESCUE = { long: 0.25, longSense: 0.8, delay: 24, burn: 100, section: 36, crack: 0.25, crackSense: 0.9, torn: 12,
    grab: 1, inspect: 4, inspectCost: 3, isolate: 6, isoFast: 8, isoSlow: 16, direct: 2, cut: 1, dockDead: 6, tested: 10,
    impurity: 0.6, sense: { check: 0.5, deep: 0.95 }, waterThaw: 8, waterCrew: 4 };
  const brakeLong = s => (hidden(s, 'rescue.brake.long') ?? 1) < RESCUE.long;
  const mountCracked = s => (hidden(s, 'rescue.dock.crack') ?? 1) < RESCUE.crack;
  const waterBad = s => (hidden(s, 'rescue.water.impurity') ?? 1) < RESCUE.impurity;
  const storeNow = s => arriveX(s) + (s.rescueDays || 0) / YD;            // часы у склада: точное прибытие + сутки работ
  const daysTo = (s, t) => Math.round((t - storeNow(s)) * YD);
  const dd = (n, lang) => lang === 'ru' ? `${n} ${plural(n, ['сутки', 'суток', 'суток'])}` : `${n} day${n === 1 ? '' : 's'}`;
  // судьба капсулы к моменту t: срок капсулы или тепловой срок секции (что раньше); стабилизированные не стареют
  function thawFate(s, i, t) {
    if ((s.thawDeadIds || []).includes(i)) return 'dead';
    if (s.thawStable || (inSection(i) && s.sectionSafe)) return 'alive';
    const cap = thawN(t) <= 39 - i, sec = inSection(i) && s.sectionEnd != null && s.sectionEnd <= t + 1e-9;
    if (!cap && !sec) return 'alive';
    return sec && (!cap || s.sectionEnd < thawAt(i)) ? 'section' : 'late';
  }
  const sectionHolds = (s, t) => s.sectionEnd > t + 1e-9;               // секция жива к моменту t (та же ε, что в реестре)
  const thawAlive = (s, t, from = THAW_HIST, to = THAW_REG - 1) => { const out = []; for (let i = from; i <= to; i++) if (thawFate(s, i, t) === 'alive') out.push(i); return out; };
  const sectionAlive = (s, t) => thawAlive(s, t, 6, 17).length;
  // время у склада дошло до t: умершие — в реестр и протокол, по причине, без двойного счёта
  function thawAdvance(st, t, extra) {
    const late = [], sect = [];
    for (let i = THAW_HIST; i < THAW_REG; i++) { const f = thawFate(st, i, t); if (f === 'late') late.push(i); else if (f === 'section') sect.push(i); }
    st.thawDeadIds = (st.thawDeadIds || []).concat(sect, late);
    if (sect.length) incident(st, 'rescueSection', sect.length, { ids: sect, year: st.sectionEnd, torn: !!st.pipeTorn, tornLeft: st.tornLeft, delay: st.brakeDelay || 0, left: st.sectionLeft,
      beat: st.choices['d.rescueConnect'] ? 'd.rescueConnect' : st.choices['d.rescue'] ? 'd.rescue' : 'd.rescueDock' }, 'thaw');
    if (late.length) incident(st, 'rescueLate', late.length, Object.assign({ ids: late, year: Math.min(...late.map(thawAt)), end: t, beat: st.choices['d.rescue'] ? 'd.rescue' : 'none' }, extra || {}), 'thaw');
  }
  // жертвы среди живых жителей (пробуждение, авария на площадке) — детерминированный выбор по сиду
  function thawVictims(st, key, n, pool) {
    const out = [], left = pool.slice();
    for (let k = 0; out.length < n && left.length && k < n * 20; k++) {
      const h = hidden(st, `thaw.${key}.${k}`); if (h == null) break;
      out.push(left.splice(Math.floor(h * left.length), 1)[0]);
    }
    return out;
  }
  const OP_NAME = { move: { ru: 'перенос в спасательный сектор', en: 'moving into the rescue sector' }, restore: { ru: 'восстановление склада', en: 'restoring the store' }, wake: { ru: 'пробуждение всех', en: 'waking everyone' } };
  const SECTION_DEC = { isolate: { ru: 'независимый контур — готов позже срока секции', en: 'an independent loop — ready after the section deadline' },
    cut: { ru: 'отсечь повреждённую секцию', en: 'cut off the damaged section' }, proceed: { ru: 'сразу к операции, без отдельной помощи секции', en: 'straight to the operation, with no separate help for the section' },
    move: { ru: 'перенос — дольше срока секции', en: 'moving — longer than the section deadline' }, restore: { ru: 'восстановление склада — дольше срока секции', en: 'restoring the store — longer than the section deadline' },
    wake: { ru: 'пробуждение — дольше срока секции', en: 'waking — longer than the section deadline' }, grab: { ru: 'захват без осмотра', en: 'grappling without inspection' }, inspect: { ru: 'осмотр крепления', en: 'a mount inspection' } };
  // торможение: поправка — только к точному прибытию (целый год пути и пройденный дрейф не сдвигаются)
  function brakeApply(st, method) {
    st.brakeMethod = method; st.arrivePlan = arriveX(st);
    st.brakeFound = method === 'measure' && brakeLong(st) && (hidden(st, 'rescue.brake.check') ?? 1) < RESCUE.longSense;
    if (method === 'burn' || st.brakeFound) st.reserve -= dvPct(st, RESCUE.burn);
  }
  // навигационная сверка: протяжённость участка установлена по факту, поправка — к точному прибытию
  function brakeSettle(st) {
    st.brakeLong = brakeLong(st);
    if (st.brakeLong && st.brakeMethod !== 'burn' && !st.brakeFound) { st.brakeDelay = RESCUE.delay; st.arriveExact = st.arrivePlan + RESCUE.delay / YD; }
  }
  // крепление: при надломе захват срывает трубопровод в конце работ — секции остаётся не больше двенадцати суток
  function dockApply(st, method) {
    st.dockMethod = method;
    if (method === 'inspect') st.materials -= RESCUE.inspectCost;
    st.rescueDays += method === 'inspect' ? RESCUE.inspect : RESCUE.grab;
    const crack = mountCracked(st);
    st.dockFound = method === 'inspect' && crack && (hidden(st, 'rescue.dock.check') ?? 1) < RESCUE.crackSense;
    if (crack && !st.dockFound) { st.pipeTorn = true; st.sectionEnd = Math.min(st.sectionEnd, storeNow(st) + RESCUE.torn / YD); st.tornLeft = daysTo(st, st.sectionEnd); }
    thawAdvance(st, storeNow(st));
  }
  const opNormal = s => opTime(s, 'move');                              // перенос или восстановление: месяц с переходниками, три — без
  const isoDays = s => s.rescueIsolation ? RESCUE.isoFast : RESCUE.isoSlow;
  const connectNeed = s => rescueS(s) && !s.sectionSafe && s.sectionEnd != null && sectionAlive(s, storeNow(s)) > 0
    && (s.pipeTorn || s.sectionEnd <= storeNow(s) + opNormal(s) + 1e-9);
  // прямое подключение сорванной линии: отказ уходит в охлаждение корабля — шестеро погибших, аварийный сон
  function directFail(st) {
    st.deadHere += RESCUE.dockDead; st.rescueCrewDead = (st.rescueCrewDead || 0) + RESCUE.dockDead;
    incident(st, 'rescueDock', RESCUE.dockDead, { check: st.dockMethod, year: storeNow(st) });
    st.sos = 'rescueDock';
  }
  function connectOptions(s) {
    const out = [], iso = isoDays(s), left = daysTo(s, s.sectionEnd), intime = sectionHolds(s, storeNow(s) + iso / YD), n = sectionAlive(s, storeNow(s));
    if (s.materials >= RESCUE.isolate) out.push({ id: 'isolate', label: { ru: 'Подключить независимый контур', en: 'Connect an independent loop' },
      known: { ru: [`Материалы −${RESCUE.isolate}%, ${dd(iso, 'ru')}${s.rescueIsolation ? ': комплект испытан в полёте' : ': комплект собирают на месте'}. Корабельный контур изолирован.`, `Срок секции — через ${dd(left, 'ru')}: ${intime ? 'успеваем' : 'не успеваем'}.`],
        en: [`Materials −${RESCUE.isolate}%, ${dd(iso, 'en')}${s.rescueIsolation ? ': the kit was tested in flight' : ': the kit is built on site'}. The ship's loop stays isolated.`, `The section deadline is in ${dd(left, 'en')}: ${intime ? 'we make it' : 'we do not make it'}.`] },
      cost: st => { st.materials -= RESCUE.isolate; st.rescueDays += iso; },
      effect: st => { st.materials -= RESCUE.isolate; st.connect = 'isolate'; st.rescueDays += iso; thawAdvance(st, storeNow(st)); if (sectionAlive(st, storeNow(st)) > 0) st.sectionSafe = true; },
      record: { ru: s2 => s2.sectionSafe ? `Независимый контур принимает секцию: ${ppl(sectionAlive(s2, storeNow(s2)))} больше не зависят от повреждённой линии.` : 'Контур готов позже срока секции: принимать в него уже некого.',
        en: s2 => s2.sectionSafe ? `The independent loop takes the section: ${sectionAlive(s2, storeNow(s2))} no longer depend on the damaged line.` : "The loop is ready after the section's deadline: there is no one left to take into it." } });
    if (s.pipeTorn) out.push({ id: 'direct', label: { ru: 'Подключить повреждённую линию напрямую', en: 'Connect the damaged line directly' },
      known: { ru: [`${dd(RESCUE.direct, 'ru')}, без материалов.`, 'Развязки нет: отказ может перейти в охлаждение корабля и потребовать аварийного сна.'],
        en: [`${dd(RESCUE.direct, 'en')}, no materials.`, "There is no isolation: a failure can spread into the ship's cooling and require emergency sleep."] },
      cost: st => { st.rescueDays += RESCUE.direct; },
      effect: st => { st.connect = 'direct'; st.rescueDays += RESCUE.direct; directFail(st); },
      record: { ru: 'Линию подключают напрямую. Через несколько часов давление уходит и из нашего контура: отказ перешёл в охлаждение корабля.', en: "The line is connected directly. Within hours the pressure drains from our loop too: the failure has spread into the ship's cooling." } });
    out.push(s.pipeTorn ? { id: 'cut', label: { ru: 'Отсечь повреждённую секцию', en: 'Cut off the damaged section' },
      known: { ru: ['Одни сутки, без материалов. Корабль защищён.', `Без охлаждения ${ppl(n)} секции погибнут к её сроку — через ${dd(left, 'ru')}. Остальные доступны операции.`],
        en: ['One day, no materials. The ship is protected.', `Without cooling, the section's ${n} will die by its deadline — in ${dd(left, 'en')}. The others remain reachable.`] },
      cost: st => { st.rescueDays += RESCUE.cut; },
      effect: st => { st.connect = 'cut'; st.rescueDays += RESCUE.cut; thawAdvance(st, storeNow(st)); },
      record: { ru: 'Секцию отсекают. Ива вписывает в ведомость двенадцать номеров отдельной строкой.', en: 'The section is cut off. Iva enters twelve numbers in the record on a separate line.' } }
      : { id: 'proceed', label: { ru: 'Сразу к операции', en: 'Straight to the operation' },
      known: { ru: ['Без расхода.', `Секция дождётся, только если операция закончится раньше её срока — через ${dd(left, 'ru')}.`],
        en: ['No expenditure.', `The section will last only if the operation finishes before its deadline — in ${dd(left, 'en')}.`] },
      effect: st => { st.connect = 'proceed'; },
      record: { ru: 'Совет начинает операцию без отдельной помощи секции.', en: 'The council starts the operation with no separate help for the section.' } });
    return out;
  }
  // площадка после выброса: испытания вложены (один ключ диагностики); положительный результат ведёт к замкнутой воде.
  // Примесь проявляется через тридцать суток после заселения: теплообменники, температурная авария.
  const SITE = { reuse: [6, 7], closed: [12, 60], orbit: [15, 60], check: [3, 7], deep: [8, 60] };
  function siteApply(st, method) {
    st.siteMethod = method;
    const bad = waterBad(st), h = hidden(st, 'rescue.water.check') ?? 1, sense = RESCUE.sense[method];
    if (sense) { st.materials -= SITE[method][0]; st.siteDays += SITE[method][1]; st.siteFound = bad && h < sense; method = st.siteFound ? 'closed' : 'reuse'; }
    if (method !== 'stay') { st.materials -= SITE[method][0]; st.siteDays += SITE[method][1]; }
    st.site = method === 'reuse' ? 'old' : method === 'stay' ? null : method;
    if (st.site === 'old' && bad) waterAccident(st);
    st.homeReady = !!st.site && st.site !== 'evacuated';
    if (st.homeReady) st.homeReadyAt = st.year + st.siteDays / YD;     // площадка готова — люди переходят
    if (st.homeReady && st.rescued > 0) { st.housed = true; st.thawPlace = st.site; st.infirmaryUntil = null; }
  }
  function waterAccident(st) {
    const y = st.year + (st.siteDays + 30) / YD, check = RESCUE.sense[st.siteMethod] ? st.siteMethod : null;
    const pool = thawAlive(st, Infinity), thaw = st.rescued > 0 ? thawVictims(st, 'water', Math.min(RESCUE.waterThaw, pool.length), pool) : [];
    if (thaw.length) { st.thawDeadIds = st.thawDeadIds.concat(thaw); st.rescued -= thaw.length; st.thawDead += thaw.length; incident(st, 'rescueWater', thaw.length, { ids: thaw, year: y, check }, 'thaw'); }
    st.deadHere += RESCUE.waterCrew; st.rescueCrewDead = (st.rescueCrewDead || 0) + RESCUE.waterCrew; st.waterDead = thaw.length + RESCUE.waterCrew;
    incident(st, 'rescueWater', RESCUE.waterCrew, { year: y, check });
    st.site = 'evacuated'; st.housed = st.rescued > 0 && housedOf(st);
    thawShelter(st, 'infirmary', y);                                    // эвакуация: сектор или модуль, иначе лазарет с новым сроком
  }
  const SITE_REC = {
    check: { ru: 'Тея берёт пробы у старого водозабора: короткое испытание — семь суток.', en: 'Teya takes samples at the old water intake: a short test, seven days.' },
    deep: { ru: 'Тея ставит длительное испытание: шестьдесят суток, все режимы очистки.', en: 'Teya sets up an extended test: sixty days, every treatment mode.' },
    closed: { ru: 'Старую площадку переводят на замкнутую воду из корабельного оборудования.', en: 'The old site is moved to a closed water loop built from ship equipment.' },
    orbit: { ru: 'Кольца корабля готовят к постоянной жизни: дом будет на орбите.', en: "The ship's rings are prepared for permanent life: the home will be in orbit." },
    reuse: { ru: 'Старую площадку готовят к заселению: семь суток, прежняя очистка.', en: 'The old site is prepared for occupation: seven days, the old treatment.' },
    stay: { ru: 'Совет сохраняет нынешнее размещение. Дом пока не выбран.', en: 'The council keeps the present accommodation. The home is not yet chosen.' }
  };
  const SITE_NAME = { old: { ru: 'старая площадка Оттепели', en: "Thaw's old site" }, closed: { ru: 'старая площадка, замкнутая вода', en: 'the old site, closed water loop' },
    orbit: { ru: 'орбитальный дом', en: 'an orbital home' }, evacuated: { ru: 'площадка закрыта, все на корабле', en: 'the site closed, everyone aboard the ship' } };
  function homeOptionsR(s) {
    const m = s.materials, sector = crewOf(s) < M.CREW, out = [];
    const opt = (id, need, label, known, cost) => { if (m >= need) out.push({ id, label, known, cost, effect: st => siteApply(st, id), record: SITE_REC[id] }); };
    opt('check', 15, { ru: 'Короткое испытание старой площадки', en: 'A short test at the old site' },
      { ru: ['Испытание: материалы −3%, семь суток. Найдём примесь — замкнутая вода ещё за −12% и шестьдесят суток; не найдём — заселение за −6% и семь суток.', 'Короткое испытание видит примесь в половине случаев: медленное загрязнение оно не охватывает.'],
        en: ['Test: materials −3%, seven days. If impurity is found, a closed water loop for another −12% and sixty days; if not, occupation for −6% and seven days.', 'The short test sees impurity half the time: it does not cover slow contamination.'] },
      st => { st.materials -= SITE.check[0]; });
    opt('deep', 20, { ru: 'Длительное испытание старой площадки', en: 'An extended test at the old site' },
      { ru: ['Испытание: материалы −8%, шестьдесят суток. Дальше те же −12% и шестьдесят суток либо −6% и семь суток.', 'Проверяется больше режимов: примесь находят в девятнадцати случаях из двадцати; полной гарантии нет.'],
        en: ['Test: materials −8%, sixty days. Then the same −12% and sixty days, or −6% and seven days.', 'More operating conditions are tested: impurity is found nineteen times in twenty; there is no complete guarantee.'] },
      st => { st.materials -= SITE.deep[0]; });
    opt('closed', 12, { ru: 'Старая площадка с замкнутой водой', en: 'The old site with a closed water loop' },
      { ru: ['Материалы −12%, шестьдесят суток.', 'Местная вода исключена из энергетики и жилого контура: замкнутая схема из корабельного оборудования.'],
        en: ['Materials −12%, sixty days.', 'Local water is excluded from the power and habitat loops: a closed system built from ship equipment.'] },
      st => { st.materials -= SITE.closed[0]; });
    opt('orbit', 15, { ru: 'Постоянный дом на орбите', en: 'A permanent orbital home' },
      { ru: ['Материалы −15%, шестьдесят суток на длительное обеспечение поселения.', sector ? 'Спасательный сектор сохраняет свои места; новые капсулы этой работой не создаются.' : 'Кольца корабля расширяют: места будут и для спасённых.'],
        en: ['Materials −15%, sixty days for long-term settlement support.', sector ? 'The rescue sector keeps its berths; this work creates no new capsules.' : "The ship's rings are extended: there will be places for the rescued too."] },
      st => { st.materials -= SITE.orbit[0]; });
    opt('reuse', 6, { ru: 'Вернуться без испытания воды', en: 'Return without testing the water' },
      { ru: ['Материалы −6%, семь суток подготовки.', 'Старая очистка после выброса не проверена: отказ энергетики угрожает первым поселенцам.'],
        en: ['Materials −6%, seven days of preparation.', 'The old treatment has not been tested since the eruption: a power failure threatens the first residents.'] },
      st => { st.materials -= SITE.reuse[0]; });
    out.push({ id: 'stay', label: { ru: 'Сохранить нынешнее размещение', en: 'Keep the present accommodation' },
      known: { ru: ['Без расхода и новой стройки.', !s.rescued ? 'Дом экипажа — корабль.' : housedOf(s) ? 'Постоянные места спасённых сохраняются; дом экипажа — корабль.' : s.thawPlace === 'store' ? 'Дом экипажа — корабль. Спасённые спят на восстановленном складе: жилья для них нет.' : `Дом экипажа — корабль. Лазарет — до года ${yr(s.infirmaryUntil)}; жилья для спасённых к этому сроку не будет.`],
        en: ['No expenditure, no new construction.', !s.rescued ? "The crew's home is the ship." : housedOf(s) ? "The rescued keep their permanent places; the crew's home is the ship." : s.thawPlace === 'store' ? "The crew's home is the ship. The rescued sleep in the restored store: there is no housing for them." : `The crew's home is the ship. The infirmary until year ${yr(s.infirmaryUntil)}; there will be no housing for the rescued by then.`] },
      effect: st => siteApply(st, 'stay'), record: SITE_REC.stay });
    return out;
  }
  // итог площадки — после испытаний и заселения (то, что стало известно по факту)
  function siteRecord(s, lang) {
    const ru = lang === 'ru', w = s.waterDead || 0;
    const res = s.site === 'evacuated'
      ? (ru ? `После заселения примесь вывела из строя теплообменники; температурная авария. Погибли ${(s.incidents || []).filter(x => x.kind === 'rescueWater').map(x => x.pop === 'thaw' ? `${ppl(x.dead)} Оттепели` : `${ppl(x.dead)} экипажа`).join(' и ')}. Площадку закрыли, живых эвакуировали на корабль.`
        : `After occupation the impurity disabled the heat exchangers; a thermal accident. Dead: ${(s.incidents || []).filter(x => x.kind === 'rescueWater').map(x => x.pop === 'thaw' ? `${x.dead} of Thaw` : `${x.dead} of the crew`).join(' and ')}. The site was closed, the living evacuated to the ship.`)
      : s.siteFound ? (ru ? 'Испытание нашло примесь до заселения: местную воду отключили, площадку переводят на замкнутый цикл.' : 'The test found the impurity before occupation: local water was disconnected, the site is moved to a closed loop.')
      : s.siteMethod === 'check' || s.siteMethod === 'deep' ? (ru ? 'Испытание примеси не нашло; жилой контур принят.' : 'The test found no impurity; the habitat loop is accepted.')
      : s.site === 'old' ? (ru ? 'Заселение прошло; очистка держит.' : 'Occupation went ahead; the treatment holds.')
      : s.site === 'closed' ? (ru ? 'Замкнутый контур принят: местная вода в энергетику не идёт.' : 'The closed loop is accepted: local water does not enter the power system.')
      : s.site === 'orbit' ? (ru ? 'Кольца приняты: орбитальный дом работает.' : 'The rings are accepted: the orbital home is running.')
      : (ru ? 'Нового жилья пока нет; прежние места и обязательства сохраняются.' : 'There is no new housing yet; existing places and commitments remain.');
    const placed = s.housed ? s.rescued : 0, where = SITE_NAME[s.site] ? SITE_NAME[s.site][lang] : (ru ? 'не выбрано' : 'undecided');
    return `${res} ${ru ? `Постоянно устроены ${placed} из Оттепели; ждут жилья ${s.rescued - placed}. Место: ${where}.` : `Permanently housed from Thaw: ${placed}; awaiting housing: ${s.rescued - placed}. Location: ${where}.`}`;
  }
  // строка о секции — то, что видит вахта после ближней диагностики
  function sectionLine(s, lang) {
    const ru = lang === 'ru', n = sectionAlive(s, storeNow(s));
    if (s.sectionEnd == null) return '';
    if (s.sectionSafe) return ru ? 'Протекающая секция — на независимом контуре.' : 'The leaking section is on an independent loop.';
    if (!n) return ru ? 'Протекающая секция потеряна.' : 'The leaking section is lost.';
    const d = daysTo(s, s.sectionEnd);
    return ru ? `Протекающая секция: живы ${n}; её срок — через ${dd(d, 'ru')}${s.pipeTorn ? ', линия сорвана' : ''}.` : `The leaking section: ${n} alive; its deadline is in ${dd(d, 'en')}${s.pipeTorn ? ', the line torn away' : ''}.`;
  }
  function storeLineR(s, lang, t) {
    const ru = lang === 'ru', alive = thawAlive(s, t), n = alive.length;
    if (!n) return ru ? 'Живых на складе нет.' : 'No one is alive in the store.';
    const head = ru ? `Живы ${n === THAW0 ? `все ${THAW0}` : `${n} из ${THAW0}`}` : `${n === THAW0 ? `All ${THAW0}` : `${n} of ${THAW0}`} alive`;
    const nx = s.thawStable ? Infinity : alive.filter(i => !(inSection(i) && s.sectionSafe))
      .map(i => Math.min(thawAt(i), inSection(i) && s.sectionEnd != null ? s.sectionEnd : Infinity)).reduce((a, b) => Math.min(a, b), Infinity);
    if (nx === Infinity) return head + '.';
    const d = Math.max(0, Math.round((nx - t) * YD));
    return ru ? `${head}; ближайшая потеря — около года ${f2(nx, 'ru')}, через ${dd(d, 'ru')}.` : `${head}; the next loss is around year ${f2(nx, 'en')}, in ${dd(d, 'en')}.`;
  }
  // склад вращается (версия 3): что показала ближняя диагностика
  function storeR(s, lang) {
    const ru = lang === 'ru', n = s.thawConfirmed, hist = [0, 1, 2, 3, 4, 5], nx = thawAlive(s, arriveX(s)).map(thawAt).reduce((a, b) => Math.min(a, b), Infinity);
    return ru ? `Маяк пропадает и возвращается: склад вращается. Камеры видят струю теплоносителя; световая кривая подтверждает поворот корпуса.

Ближняя диагностика: ${n === THAW0 ? `живы все ${THAW0}` : `живы ${n} из ${THAW0}`}. Ещё шестеро умерли до нашего рейса: ${thawNames(hist, 'ru')}. У протекающей секции — двенадцать капсул — осталось ${dd(s.sectionLeft, 'ru')}.${nx < Infinity ? ` Ближайший отказ по сроку капсулы — около года ${f2(nx, 'ru')}.` : ''}

Сводка «штатно» всё это время описывала режим оборудования.`
      : `The beacon disappears and returns: the store is rotating. Cameras show a coolant jet; the light curve confirms the hull's turn.

Close diagnostics: ${n === THAW0 ? `all ${THAW0} alive` : `${n} of ${THAW0} alive`}. Another six died before our voyage: ${thawNames(hist, 'en')}. The leaking section — twelve capsules — has ${dd(s.sectionLeft, 'en')} left.${nx < Infinity ? ` The next capsule failure by its life is around year ${f2(nx, 'en')}.` : ''}

All this time, "nominal" described the equipment's operating mode.`;
  }
  // живые сейчас и ближайшая потеря — то, что видит вахта
  function storeLine(s, lang, t = arriveX(s)) {
    if (rescueS(s)) return storeLineR(s, lang, t);
    const ru = lang === 'ru', n = thawN(t), nx = nextLoss(t);
    if (!n) return ru ? 'Живых на складе нет.' : 'No one is alive in the store.';
    return ru ? `Живы ${n === THAW0 ? `все ${THAW0}` : `${n} из ${THAW0}`}; ближайшая потеря — около года ${f2(nx, 'ru')}, через ${months(nx - t, 'ru')}.` : `${n === THAW0 ? `All ${THAW0}` : `${n} of ${THAW0}`} alive; the next loss is around year ${f2(nx, 'en')}, in ${months(nx - t, 'en')}.`;
  }
  // операция у склада: известны цена, срок и прогноз склада; число спасённых — в записи результата
  function rescueOp(st, op, cost) {
    st.materials -= cost; st.rescueOp = op;
    if (st.preview) return;                                             // «После»: только известные затраты
    const tEnd = opStart(st) + opTime(st, op), n = thawN(tEnd), k = op === 'wake' ? Math.round(n / 10) : 0;
    st.rescued = n - k; st.thawDead = THAW0 - st.rescued; st.rescueEnd = tEnd; st.housed = st.rescued > 0 && housedOf(st);
  }
  // версия 3: одни часы у склада, реестр по именам, сроки секции; пробуждение — именные потери
  function rescueOpR(st, op, cost) {
    st.materials -= cost; st.rescueOp = op;
    if (st.preview) return;
    const tEnd = storeNow(st) + opTime(st, op);
    thawAdvance(st, tEnd, { op, end: tEnd });
    const alive = thawAlive(st, tEnd), woke = op === 'wake' ? thawVictims(st, 'wake', Math.round(alive.length / 10), alive) : [];
    if (woke.length) { st.thawDeadIds = st.thawDeadIds.concat(woke); incident(st, 'rescueWake', woke.length, { ids: woke, year: tEnd }, 'thaw'); }
    st.thawStable = true; st.rescued = alive.length - woke.length; st.thawDead = THAW0 - st.rescued;
    st.rescueEnd = tEnd; st.rescueDays = (tEnd - arriveX(st)) * YD; st.housed = st.rescued > 0 && housedOf(st);
    thawShelter(st, op === 'restore' ? 'store' : 'infirmary', tEnd);
  }
  // временное размещение: без постоянных мест — склад (спят) или лазарет на три года от приёма
  function thawShelter(st, temp, t) {
    st.thawPlace = !st.rescued ? null : housedOf(st) ? (crewOf(st) < M.CREW ? 'sector' : 'module') : temp;
    st.infirmaryUntil = st.thawPlace === 'infirmary' ? t + 3 : null;
  }
  // срок секции против срока операции — в «Что известно» каждого варианта
  function opSection(s, op, lang) {
    if (!rescueS(s) || s.sectionSafe || s.sectionEnd == null || !sectionAlive(s, storeNow(s))) return [];
    const ru = lang === 'ru', d = daysTo(s, s.sectionEnd), need = Math.round(opTime(s, op) * YD), ok = sectionHolds(s, storeNow(s) + opTime(s, op));
    return [ru ? `Срок протекающей секции — через ${dd(d, 'ru')}; операция — ${dd(need, 'ru')}: ${ok ? 'секция дождётся' : `секция не дождётся — ${ppl(sectionAlive(s, storeNow(s)))} погибнут`}.`
      : `The leaking section's deadline is in ${dd(d, 'en')}; the operation takes ${dd(need, 'en')}: ${ok ? 'the section will last' : `the section will not last — ${sectionAlive(s, storeNow(s))} will die`}.`];
  }
  function rescueOptions(s) {
    const R = rescueS(s), t0 = opStart(s), out = [], tm = op => opTime(s, op), fc = op => R ? thawAlive(s, t0 + tm(op)).length : thawN(t0 + tm(op));
    const run = (op, cost) => st => R ? rescueOpR(st, op, cost) : rescueOp(st, op, cost);
    const where = lang => housedOf(s) ? (lang === 'ru' ? 'Места для них есть.' : 'There are places for them.') : null;
    if (crewOf(s) < M.CREW && thawN(t0) <= 40 && (!R || s.materials >= MOVE)) out.push({
      id: 'move',
      label: { ru: 'Перенести в наш сектор', en: 'Move them into our sector' },
      known: {
        ru: [`Сорок мест спасательного сектора ждут. Материалы −${MOVE}%.`, `Срок — ${months(tm('move'), 'ru')}: к концу по прогнозу живы ${fc('move')}.`, 'Спящие переходят в наши капсулы; будить — у цели, по одному.'].concat(opSection(s, 'move', 'ru')),
        en: [`The rescue sector's forty berths are waiting. Materials −${MOVE}%.`, `Time: ${months(tm('move'), 'en')}; by the end, ${fc('move')} alive by the forecast.`, 'The sleepers move into our capsules; waking later, one by one.'].concat(opSection(s, 'move', 'en'))
      },
      effect: run('move', MOVE),
      record: {
        ru: s => `Спящих переносят в спасательный сектор. На каждой капсуле — номер Оттепели и наш. Перенесены ${ppl(s.rescued)}.`,
        en: s => `The sleepers are moved into the rescue sector. Each capsule carries Thaw's number and ours. ${s.rescued} are moved.`
      }
    });
    if (s.materials >= RESTORE) out.push({
      id: 'restore',
      label: { ru: 'Восстановить склад', en: 'Restore the store' },
      known: {
        ru: [`Питание и охлаждение склада — от нашей сети. Материалы −${RESTORE}%.`, `Срок — ${months(tm('restore'), 'ru')}: к концу по прогнозу живы ${fc('restore')}.`, where('ru') || 'Спящие остаются в своих капсулах: склад — не дом, постоянных мест нет.'].concat(opSection(s, 'restore', 'ru')),
        en: [`The store's power and cooling come from our grid. Materials −${RESTORE}%.`, `Time: ${months(tm('restore'), 'en')}; by the end, ${fc('restore')} alive by the forecast.`, where('en') || 'The sleepers stay in their capsules: a store is not a home, there are no permanent places.'].concat(opSection(s, 'restore', 'en'))
      },
      effect: run('restore', RESTORE),
      record: {
        ru: s => `Склад подключают к нашей сети. Капсулы Оттепели больше не стареют: спят ${ppl(s.rescued)}.`,
        en: s => `The store is connected to our grid. Thaw's capsules no longer age: ${s.rescued} sleep.`
      }
    });
    out.push({
      id: 'wake',
      label: { ru: 'Будить всех сразу', en: 'Wake everyone at once' },
      known: {
        ru: ['Все пробуждения за месяц: врачей не хватает. Каждый десятый может не пережить пробуждения.', where('ru') || 'Мест нет: лазарет — временное убежище на три года.'].concat(opSection(s, 'wake', 'ru')),
        en: ['All the wakings within a month: not enough physicians. One in ten may not survive waking.', where('en') || 'No places: the infirmary is a temporary shelter for three years.'].concat(opSection(s, 'wake', 'en'))
      },
      effect: run('wake', 0),
      record: {
        ru: s => `Будят всех за месяц. Медики не спят сами. Живы ${ppl(s.rescued)}.${s.thawDead ? ` Оттепель потеряла ${s.thawDead}.` : ''}`,
        en: s => `Everyone is woken within a month. The medics do not sleep themselves. ${s.rescued} are alive.${s.thawDead ? ` Thaw lost ${s.thawDead}.` : ''}`
      }
    });
    return out;
  }
  // старые сохранения: прежние «перенести» (места погибших) и «будить по одному»
  function rescueLegacy(s, id) {
    if (id === 'gradual') return { id, label: { ru: 'Будить по одному на складе', en: 'Wake them one by one at the store' }, known: { ru: [], en: [] },
      effect: st => { if (st.preview) return; const n = thawN(arriveX(st)), k = Math.min(3, n); st.rescueOp = 'gradual'; st.rescued = n - k; st.thawDead = THAW0 - st.rescued; st.housed = false; },
      record: { ru: 'Будят по одному. Трое не дожидаются своей очереди.', en: 'They are woken one by one. Three do not live to their turn.' } };
    if (id === 'move' && s.lost >= s.rescued) return { id, label: { ru: 'Перенести в наш зал', en: 'Move them into our hall' }, known: { ru: [], en: [] },
      effect: st => { if (st.preview) return; st.rescueOp = 'move'; st.rescued = thawN(arriveX(st)); st.thawDead = THAW0 - st.rescued; st.housed = true; },
      record: { ru: 'Спящих переносят в капсулы тех, кто не долетел. На каждой капсуле — два имени.', en: 'The sleepers are moved into the capsules of those who did not make it. Each capsule carries two names.' } };
    return null;
  }
  // таймлайн: сроки миссии на шкале пути (годы от старта)
  function missionMarks(s, lang) {
    const ru = lang === 'ru';
    if (s.mission === 'rescue') return [{ at: THAW_LOSS, c: 'bad', short: ru ? `Оттепель: потери с ${THAW_LOSS}` : `Thaw: losses from ${THAW_LOSS}`,
      title: ru ? `Год ${THAW_LOSS} — первая необратимая потеря на складе Оттепели` : `Year ${THAW_LOSS} — the first irreversible loss in Thaw's store` }];
    return [];
  }
  function missionCheck(s, T, lang) {
    const ru = lang === 'ru';
    if (s.mission === 'rescue') { const n = thawN(T), m = Math.round((THAW_LOSS - T) * 12);
      return { good: n === THAW0, text: n === THAW0 ? (ru ? `Прибытие — год ${f2(T, 'ru')}: до первой потери на складе ${m} мес.` : `Arrival — year ${f2(T, 'en')}: ${m} months before the first loss at the store.`)
        : (ru ? `Прибытие — год ${f2(T, 'ru')}, позже первой потери (год ${THAW_LOSS}): живы будут ${n} из ${THAW0}.` : `Arrival — year ${f2(T, 'en')}, after the first loss (year ${THAW_LOSS}): ${n} of ${THAW0} will be alive.`) }; }
    T = Math.round(T);
    if (s.mission === 'supply') return { warn: true, text: ru ? `Прибытие — год ${T}: форпост ${T - xyl().relayYears} лет без связи и ${Math.max(0, T - xyl().capsuleYears)} лет без запаса для капсул.` : `Arrival — year ${T}: the outpost ${T - xyl().relayYears} years without the link and ${Math.max(0, T - xyl().capsuleYears)} years without capsule spares.` };
    return null;
  }
  // тонкая вахта: столько людей, чтобы каждый прожил в пути около 13 лет, как на ближней дороге
  const thinWatch = T => Math.max(24, Math.min(40, Math.round(13 * 500 / T)));
  const regHands = s => Math.ceil(W.REG.D0 * (1 + Math.min(W.REG.ageMax, W.REG.age * s.arrive)) / W.REG.perYear - 1e-9);   // специалистов на регламент к прибытию
  // поворот к источнику в год t

  // ---------------------------------------------------------------- оснащение: досье, вопросы, карточки, цена (DOC: оснащение v4)
  // Анкета показывает только публичное: цель, каталог, архив на день старта, расчёт паспорта. Скрытое (сид) не используется.
  // скрытые в анкете варианты: без применения в этой миссии (паспорт со старым id остаётся валидным)
  function eqHidden(s, pos, opt) {
    if (supplyS(s)) return pos === 'energy' || pos === 'sensors' || (pos === 'shield' && opt !== 'dust20') || opt === 'inspect';
    if (rescueS(s)) return ['energy', 'sensors', 'prod'].includes(pos) || (pos === 'shield' && opt !== 'dust20') || opt === 'inspect';
    return false;
  }
  const eqPosHidden = (s, pos) => M.EQUIP.find(p => p.id === pos).opts.filter(o => !o.era && !eqHidden(s, pos, o.id)).length < 2;
  const EQ_Q = {
    caps: { ru: 'Как снизить потери во сне и при пробуждении?', en: 'How do we reduce losses during sleep and waking?' },
    energy: { ru: 'На чём пережить первую зиму после высадки?', en: 'What will power the first winter after landing?' },
    sensors: { ru: 'Какие слабые признаки мы хотим прочитать?', en: 'Which faint signals do we want to read?' },
    probes: { ru: 'Везти готовые зонды или собирать их в пути?', en: 'Carry ready probes or build them en route?' },
    shield: { ru: 'Как пережить повреждение пылевого щита?', en: 'How do we cope with dust-shield damage?' },
    prod: { ru: 'Чем восстановить резерв мощности?', en: 'How do we restore the high-power reserve?' },
    prodSupply: { ru: 'Чем изготовить детали для восстановления форпоста?', en: 'How do we make parts to restore the outpost?' }
  };
  const eqQuestion = (s, pos, lang) => (pos === 'prod' && s.mission === 'supply' ? EQ_Q.prodSupply : EQ_Q[pos])[lang];
  // публичные признаки маршрута (по черновику паспорта): облако — та же ветка, что M.episode; ε Индейца; красный карлик; колония в архиве
  function routeSigns(s, d) {
    const T = d ? Math.round(passportNumbers(s, d).T) : s.arrive, c = M.knownAtStart().find(o => o.kind === 'colony' && o.star === s.target);
    return { cloud: s.mission === 'contact' && M.episode(Object.assign({}, s, { arrive: T })) === 'cloud', source: s.target === M.SOURCE,
      red: M.isRedDwarf(s.target), colony: c && c.status !== 'dead' && c.awake > 0 ? c : null };
  }
  // польза / условие / основание — по миссии
  function eqCard(s, opt, lang) {
    const ru = lang === 'ru', R = routeSigns(s), L = (r, e) => ru ? r : e;
    const red = R.red && !R.source, sup = supplyS(s), res = rescueS(s);
    const C = {
      capsStd: [L('Не добавляют массы к штатному кораблю.', 'Add no mass to the standard ship.'), L('Сохраняются штатные риски отказа капсулы и пробуждения.', 'Standard capsule-failure and waking risks remain.'), L('Меньшая масса сокращает путь; прогноз потерь — ниже.', 'Lower mass shortens the voyage; the loss estimate is below.')],
      capsSafe: [L('Вдвое снижают фоновые отказы капсул и смерти при пробуждении.', 'Halve background capsule failures and deaths on waking.'),
        res ? L('Не защищают капсулы Оттепели и не продлевают их срок; добавленная масса задерживает прибытие.', "Do not protect Thaw's capsules or extend their life; the added mass delays arrival.") : L('Не защищают от пробоя и общего отказа охлаждения.', 'Do not protect against breaches or a shared cooling failure.'),
        L('Долгий сон и повторные пробуждения входят в план рейса.', 'Long sleep and repeated wakings are part of the voyage plan.')],
      shipOnly: [L('Не требуют отдельного энергетического груза.', 'Require no separate power cargo.'), L('После высадки нужен другой источник или решение энергетического дефицита.', 'After landing, another source or a solution to the energy shortage is needed.'), L('Корабельной энергии может не хватить поселению.', "Ship power may not cover the settlement's needs.")],
      grid: [L('Дают энергию поселению от местной сети.', 'Supply settlement power from the local grid.'), L('Работают только при действующей колонии у цели.', 'Work only with an active colony at the target.'),
        R.colony ? L('Последнее сообщение описывает работающую колонию; состояние сети к прибытию неизвестно.', "The last report describes an active colony; its grid's condition on arrival is unknown.") : L('В архиве нет подтверждения доступной работающей сети.', 'The archive does not confirm an available working grid.')],
      reactor5: [L('Обеспечивает энергию для первой зимы без местной сети.', 'Supplies first-winter power without a local grid.'), L('Тяжёлый удар потока может разбить реактор в грузовом отсеке.', 'A severe stream strike can destroy the reactor in the cargo bay.'), L('Работающая внешняя сеть к прибытию не гарантирована.', 'A working external grid on arrival is not guaranteed.')],
      dual: [L('Сохраняют источник энергии после потери одного блока.', 'Retain a power source after one unit is lost.'), L('Помогают после пережитого тяжёлого удара; гибель корабля не предотвращают.', "Help after a survivable severe strike; do not prevent the ship's destruction."), L('Один энергетический блок может быть повреждён в пути.', 'A single power unit may be damaged en route.')],
      spectra: [L('Штатные наблюдения без добавочной массы.', 'Standard observations without added mass.'), L('Слабые спектры читают подготовленные люди; проверка потока учениками — 26 суток.', 'Trained people read faint spectra; students need 26 days to check the stream.'), L('Время и подготовка смены заменяют часть возможностей приборов.', "Time and crew training provide part of the instruments' capability.")],
      ir: [L(`Позволяет найти поддержку без подготовленного читателя слабых спектров; ${red ? 'сохраняет 5% материалов ремонта при раннем предупреждении о вспышке' : 'ведёт тепловые наблюдения'}.`, `Can find the support ship without a trained reader of faint spectra; ${red ? 'saves 5% of repair materials through early flare warning' : 'provides thermal observations'}.`),
        L('Нужен выбранный поиск; проверки пыли, магистрали и потока ИК не улучшает.', 'A search must be chosen; IR does not improve dust, main-loop or stream checks.'),
        L(`В пути возможны слабые тепловые следы; ${red ? 'красный карлик требует наблюдения активности' : 'время и место возможных событий неизвестны'}.`, `Faint heat traces may occur en route; ${red ? 'the red dwarf requires activity monitoring' : 'the timing and location of possible events are unknown'}.`)],
      spectraPlus: [L('Сокращает проверку потока учениками с 26 до 18 суток.', "Cuts the students' stream check from 26 to 18 days."), L('Нужны обученные ученики или Ная после работы с Корой; чувствительность не меняется.', 'Requires trained students or Naya after working with Kora; sensitivity is unchanged.'), L('Уход от потока должен уложиться в ограниченное окно.', 'Escaping the stream must fit within a limited window.')],
      none: [L('Не добавляет массы зондов.', 'Adds no probe mass.'),
        sup || res ? L('Ранний разведчик требует 10% материалов и, без допуска ремонтников, 120 км/с резерва.', 'The early scout needs 10% of materials and, without qualified repair hands, 120 km/s of reserve.') : L('Разведчик требует 10% материалов, зонд потока — 5%; разведчику без допуска нужно ещё 120 км/с резерва.', 'A scout needs 10% of materials, a stream probe 5%; an unqualified scout launch also needs 120 km/s of reserve.'),
        L('Аппарат можно собрать из запасов, если выбран запуск.', 'A probe can be built from stock if a launch is chosen.')],
      scout2: sup ? [L('Сохраняет 10% материалов и, без допуска, 120 км/с при раннем запуске.', 'Saves 10% of materials and, without qualification, 120 km/s on an early launch.'), L('Второй аппарат в этой миссии применения не имеет; будущую бурю разведчик не предсказывает.', 'The second probe has no use in this mission; the scout does not predict the future storm.'), L('Разведка планет нужна до прибытия, а материалы — для форпоста.', 'Planetary reconnaissance is needed before arrival, while materials are needed for the outpost.')]
        : res ? [L('Сохраняет 10% материалов и, без допуска, 120 км/с при раннем запуске.', 'Saves 10% of materials and, without qualification, 120 km/s on an early launch.'), L('Данные среды помогают проверке торможения, как и у самодельного зонда; второй аппарат не используется.', 'Medium data support the braking check, just as with a built probe; the second probe is unused.'), L('Торможение зависит от среды; состояния склада разведчик не устанавливает.', "Braking depends on the medium; the scout does not establish the store's condition.")]
        : [L('Сохраняет 10% материалов раннего разведчика и 5% зонда потока; без допуска — ещё 120 км/с.', 'Saves 10% of materials for the early scout and 5% for the stream probe; without qualification also 120 km/s.'), L('Выгода — при соответствующих запусках; готовый зонд не повышает чувствительность измерения.', 'Benefits require the corresponding launches; a ready probe does not improve measurement sensitivity.'), L('Запасы для разведки конкурируют с ремонтом и высадкой.', 'Survey stock competes with repairs and landing needs.')],
      inspect: [L('Сохраняет 5% материалов при измерении потока.', 'Saves 5% of materials when measuring the stream.'), L('Не заменяет раннего разведчика; измерение занимает те же 10 суток.', 'Does not replace the early scout; measurement still takes 10 days.'), L('Готовый аппарат сохраняет посадочный запас.', 'A ready probe preserves landing stock.')],
      dust20: [L('Не добавляет массы сверх штатного щита.', 'Adds no mass beyond the standard shield.'), L('Полоса крупной пыли при прямом проходе может пробить щит; за ним — жилой отсек.', 'Crossing a coarse-dust band directly can breach the shield; a living compartment is behind it.'), L('Наличие опасной полосы на курсе заранее не установлено.', 'A dangerous band on our course has not been established in advance.')],
      dust40: [L('Выдерживает удар полосы крупной пыли у облака без сквозного пробоя.', "Withstands the cloud's coarse-dust band without a through-breach."), L('Ремонт наружного слоя требует 5% материалов; отдельной защиты от потока нет.', 'Outer-layer repair needs 5% of materials; it provides no separate stream immunity.'), L('Сохранённая целостность щита важна и при последующих ударах.', 'Keeping the shield intact also matters during later strikes.')],
      sectors: [L('Позволяют восстановить полный расчёт щита после пробоя.', "Restore the shield's full rating after a breach."), L('Нужны допуск ремонтников и 3% материалов; первоначальные потери не отменяются.', 'Require repair qualification and 3% of materials; initial losses are not reversed.'), L('Заплата закрывает пробой, но не заменяет целый сектор.', 'A patch seals the breach but does not replace an intact sector.')],
      repair: sup ? [L('Не добавляет производственной массы.', 'Adds no manufacturing mass.'), L(`Второй монтажный комплект стоит 30% материалов; разделение платы — ${busSplitFor(s, 'repair')}%.`, `The second installation kit costs 30% of materials; board separation costs ${busSplitFor(s, 'repair')}%.`), L('Детали придётся брать из общего запаса.', 'Parts must come from the shared stock.')]
        : [L('Не добавляет массы производственного оборудования.', 'Adds no production-equipment mass.'), L('Изготовить капельный радиатор этим набором нельзя.', 'This kit cannot manufacture a droplet radiator.'), L('Для возвращения утраченного резерва мощности может понадобиться производство.', 'Restoring a lost high-power reserve may require manufacturing.')],
      tools: sup ? [L(`Второй монтажный комплект — 10% материалов вместо 30; разделение платы — ${busSplitFor(s, 'tools')}% вместо 12.`, `The second installation kit costs 10% of materials instead of 30; board separation ${busSplitFor(s, 'tools')}% instead of 12.`),
          L('Производство не обнаруживает дефект и не ускоряет работы; монтаж требует свободных сетей.', 'Manufacturing neither detects damage nor speeds up work; installation requires free grids.'),
          L('Изготовление на борту сохраняет запас форпоста.', "Onboard manufacturing preserves the outpost's stock.")]
        : [L('Позволяют изготовить радиатор за 20% материалов и вернуть резерв мощности.', 'Allow a radiator to be built for 20% of materials, restoring the high-power reserve.'), L('Нужны потеря повышенной мощности, чертёж и допуск ремонтников.', 'Require lost high power, the blueprint and repair qualification.'), L('Восстановление контура требует изготовления деталей.', 'Restoring the loop requires manufactured parts.')],
      printQC: sup ? [L(`Второй монтажный комплект — 10% материалов; разделение платы — ${busSplitFor(s, 'printQC')}% вместо 12.`, `The second installation kit costs 10% of materials; board separation ${busSplitFor(s, 'printQC')}% instead of 12.`),
          L('Производство не обнаруживает дефект и не ускоряет работы; на 2 тыс. т тяжелее станков.', 'Manufacturing neither detects damage nor speeds up work; 2 kt heavier than machine tools.'),
          L('Изготовленные детали сокращают расход общего запаса.', 'Manufactured parts reduce use of the shared stock.')]
        : [L('Позволяет изготовить радиатор за 10% материалов вместо 20 на станках.', 'Allows a radiator to be built for 10% of materials instead of 20 with machine tools.'), L('Нужны потеря повышенной мощности, чертёж и допуск ремонтников.', 'Requires lost high power, the blueprint and repair qualification.'), L('Печать экономит материалы ценой большей массы оборудования.', 'Printing saves materials at the cost of greater equipment mass.')]
    };
    return C[opt] || [];
  }
  // аварийная польза — отдельной условной строкой, без частот генератора
  function eqIf(s, opt, lang, d) {
    const ru = lang === 'ru', R = routeSigns(s, d);
    if (opt === 'dust40' && s.mission === 'contact' && R.cloud) return ru ? 'Если пройдём полосу крупной пыли у облака: удвоенный щит предотвращает пробой; расчётная разница аварийных потерь — 8 человек.' : "If we cross the cloud's coarse-dust band: the doubled shield prevents a breach; the estimated difference in incident losses is 8 people.";
    if (['grid', 'reactor5', 'dual'].includes(opt) && s.mission === 'contact') return ru ? 'Если поселению не хватит энергии и другого источника не будет: энергетический груз предотвращает зимний дефицит; потери без него зависят от выбранного поселения.' : 'If the settlement lacks power and no other source is available: power cargo prevents the winter shortage; losses without it depend on the settlement chosen.';
    return null;
  }
  // цена замены: от рекомендации в этой позиции, прочие ответы те же
  const sgn = (x, lang, dg) => { const v = Math.abs(x) < 0.5 * Math.pow(10, -dg) ? 0 : x, t = (lang === 'ru' ? f1 : f1)(Math.abs(v), lang);
    return v === 0 ? (x === 0 ? '0' : (x > 0 ? '+<0' : '−<0') + (lang === 'ru' ? ',1' : '.1')) : `${v > 0 ? '+' : '−'}${dg === 2 ? (lang === 'ru' ? Math.abs(v).toFixed(2).replace('.', ',') : Math.abs(v).toFixed(2)) : t}`; };
  function eqCost(s, d, pos, lang) {
    const ru = lang === 'ru', rec = M.eqDefault(s.mission)[pos];
    if (d.eq[pos] === rec) return [];
    const a = passportNumbers(s, Object.assign({}, d, { eq: Object.assign({}, d.eq, { [pos]: rec }) })), b = passportNumbers(s, d);
    const dt = (b.T - a.T) * 365.25, dtTxt = Math.abs(dt) < 30 ? `${sgn(dt, lang, 1)} ${ru ? 'сут.' : 'days'}` : `${sgn((b.T - a.T) * 12, lang, 1)} ${ru ? 'мес.' : 'months'}`;
    const out = [ru ? `От рекомендации в этой позиции: масса ${sgn(b.used - a.used, lang, 2)} тыс. т; прибытие ${dtTxt}; бодрствование ${sgn((b.aw - a.aw) * 365.25, lang, 1)} сут. на человека.`
      : `Relative to the recommendation for this position: mass ${sgn(b.used - a.used, lang, 2)} kt; arrival ${dtTxt}; waking time ${sgn((b.aw - a.aw) * 365.25, lang, 1)} days per person.`,
      ru ? `Ожидаемые фоновые потери: ${a.L.total} → ${ppl(b.L.total)} (${b.L.total - a.L.total > 0 ? '+' : b.L.total - a.L.total < 0 ? '−' : ''}${Math.abs(b.L.total - a.L.total)}); оценка модели, не гарантия.`
      : `Expected background losses: ${a.L.total} → ${b.L.total} people (${b.L.total - a.L.total > 0 ? '+' : b.L.total - a.L.total < 0 ? '−' : ''}${Math.abs(b.L.total - a.L.total)}); a model estimate, not a guarantee.`];
    if (s.mission === 'rescue') { const m = T => T <= THAW_LOSS ? (ru ? `${f1((THAW_LOSS - T) * 12, 'ru')} мес.` : `${f1((THAW_LOSS - T) * 12, 'en')} months`) : (ru ? `просрочка ${Math.round((T - THAW_LOSS) * 365.25)} сут.` : `overdue by ${Math.round((T - THAW_LOSS) * 365.25)} days`);
      out.push(ru ? `Расчётный запас до первой потери Оттепели: ${m(a.T)} → ${m(b.T)}; время работ у склада ещё не вычтено.` : `Estimated margin before Thaw's first loss: ${m(a.T)} → ${m(b.T)}; work at the store has not yet been deducted.`); }
    if (!b.fits) out.push(ru ? `Превышение грузоподъёмности: ${f1(b.used - Math.max(0, b.cap), 'ru')} тыс. т. Для этого варианта нужно изменить другие ответы.` : `Cargo capacity exceeded by ${f1(b.used - Math.max(0, b.cap), 'en')} kt. This option requires changing other answers.`);
    return out;
  }
  // рекомендация Совета: «предлагаем X, потому что Y; принимаем риск Z»
  function eqCouncil(s, lang) {
    const ru = lang === 'ru';
    return ({
      contact: ru ? 'Совет предлагает ИК-обсерваторию и штатное остальное оснащение, потому что предстоит искать слабые тепловые следы; принимает риск повреждения щита и необходимость отдельно обеспечить энергию поселению.' : 'The Council proposes an IR observatory with otherwise standard equipment because we must seek faint heat traces; it accepts the risk of shield damage and the need to secure settlement power separately.',
      supply: ru ? 'Совет предлагает станки без отдельного энергетического груза, потому что ведомость форпоста требует восстановления оборудования, а две монтажные сети уже есть на корабле; принимает расход материалов на разведчик и остаточный риск проверок старых узлов.' : "The Council proposes machine tools without separate power cargo because the outpost's inventory calls for equipment restoration and the ship already has two installation grids; it accepts the material cost of a scout and the residual risk of checks on old components.",
      rescue: ru ? 'Совет предлагает надёжные капсулы, потому что экипажу предстоят долгий сон и пробуждения; принимает задержку от их массы, сокращающую запас времени Оттепели. Капсулы склада этот комплект не защищает.' : "The Council proposes reliable capsules because the crew faces long sleep and repeated wakings; it accepts the delay from their mass, which reduces Thaw's time margin. This equipment does not protect the store's capsules."
    })[s.mission || 'contact'];
  }
  // досье миссии: что предстоит, чего опасаемся, чего пока не знаем — только публичные сведения
  function missionDossier(s, d, lang) {
    const ru = lang === 'ru', R = routeSigns(s, d), H = ru ? ['Что предстоит', 'Чего опасаемся', 'Чего пока не знаем'] : ['What lies ahead', 'What concerns us', 'What remains unknown'];
    if (s.mission === 'supply' && supplyS(s)) return H.map((h, i) => [h, ru ? ['Доставить передатчик и капсульный блок форпосту Ксилона Ир; в заявке есть ведомость разобранного оборудования.', 'Отказа охлаждения в пути, частиц от вспышки Барнарда и зависимости новых систем от старых общих узлов.', 'Состояния коллектора и общей платы; силы будущей бури и остатка исправного оборудования к прибытию.'][i]
      : ['Deliver a transmitter and capsule unit to the Xylona Ir outpost; the request includes an inventory of dismantled equipment.', "Cooling failure en route, particles from a Barnard's Star flare and new systems depending on old shared components.", "The collector's and common board's condition; the future storm's strength and the equipment still working on arrival."][i]]);
    if (s.mission === 'rescue' && rescueS(s)) return H.map((h, i) => [h, ru ? ['Дойти до склада Оттепели у Росс 128; по последнему сообщению заняты сорок капсул, расчётный срок — год 125.', 'Опоздания из-за торможения, отказов старых капсул и повреждений при подключении склада.', 'Сколько людей живы сейчас, состояния крепления и охлаждения склада; условий будущей площадки.'][i]
      : ["Reach Thaw's store at Ross 128; the last report lists forty occupied capsules, with rated life to year 125.", 'Braking delays, ageing capsule failures and damage while connecting the store.', "How many people are alive now, the mount's and store cooling's condition, and conditions at the future site."][i]]);
    if (s.mission && s.mission !== 'contact') return null;
    const route = [], hz = [], unk = [];
    if (R.cloud) { route.push(ru ? 'На пути потребуется уточнить пылевую среду.' : 'The dust environment along the route needs checking.'); hz.push(ru ? 'пробоя щита крупной пылью;' : 'a shield breach from coarse dust;'); unk.push(ru ? 'Размер частиц и наличие плотной полосы неизвестны.' : 'Particle sizes and the presence of a dense band are unknown.'); }
    if (R.source) { route.push(ru ? 'Предстоят наблюдения системы, включая малосветящиеся компоненты.' : 'We will observe the system, including its faint components.'); hz.push(ru ? 'потока частиц при сближении;' : 'a particle stream during approach;'); unk.push(ru ? 'Пересечёт ли поток наш курс, неизвестно.' : 'Whether a stream will cross our course is unknown.'); }
    if (R.red && !R.source) { hz.push(ru ? 'звёздных вспышек;' : 'stellar flares;'); unk.push(ru ? 'Время вспышек и сила потока частиц заранее неизвестны.' : 'Flare timing and particle flux are not known in advance.'); }
    if (R.colony) { const age = Math.round(-R.colony.observedAt); route.push(ru ? `По последнему отчёту у цели действует «${R.colony.ru}»; сведениям ${yrs(age)}.` : `The last report lists ${R.colony.en} as active at the target; the information is ${yrsEn(age)} old.`); unk.push(ru ? 'Работает ли её сеть сейчас и сможет ли она принять нас, не подтверждено.' : "Its grid's current operation and its ability to receive us are unconfirmed."); }
    else route.push(ru ? 'Подключение к работающей местной сети не подтверждено.' : 'Access to a working local grid is unconfirmed.');
    const work = s.task && s.task.work, LK = s.task && RQ.linkByStar(s.task.star), DO = {
      contactColony: LK ? [`Дойти до ${nmG(s)}, установить прямую связь ${LK.with[0]}, ${LK.whatV[0]} и оценить возможность поселения. `, `Reach ${nm(s, 'en')}, establish a direct link ${LK.with[1]}, ${LK.whatV[1]} and assess prospects for settlement. `] : [`Дойти до ${nmG(s)}, установить прямую связь с Перевалом, сверить лоции и оценить возможность поселения. `, `Reach ${nm(s, 'en')}, establish a direct link with the Pass, reconcile the navigation records and assess prospects for settlement. `],
      trace: [`Дойти до ${nmG(s)}, обследовать район последней орбиты двадцать четвёртой и оценить возможность поселения. `, `Reach ${nm(s, 'en')}, survey the region of No. 24's last orbit and assess prospects for settlement. `],
      survey: [`Дойти до ${nmG(s)}, обследовать систему и её планету и оценить возможность поселения. `, `Reach ${nm(s, 'en')}, survey the system and its planet and assess prospects for settlement. `]
    }[work] || [`Дойти до ${nmG(s)}, искать след тридцать второй и оценить возможность поселения. `, `Reach ${nm(s, 'en')}, seek traces of the Thirty-Second and assess prospects for settlement. `];
    const UNK = { contactColony: LK ? [`Нынешнее состояние ${LK.gen[0]}`, `${LK.gen[1].replace(/^./, x => x.toUpperCase())} present state`] : ['Нынешнее состояние Перевала', "The Pass's present state"], trace: ['Сохранность корабля двадцать четвёртой и его журнала', "The state of No. 24's ship and its log"],
      survey: ['Поверхность планеты', "The planet's surface"] }[work] || ['Судьба тридцать второй', "The Thirty-Second's fate"];
    return [[H[0], DO[ru ? 0 : 1] + route.join(' ')],
      [H[1], ru ? `Отказов капсул в долгом пути; ${hz.join(' ')} нехватки энергии после высадки.` : `Capsule failures during the long voyage; ${hz.join(' ')} an energy shortage after landing.`],
      [H[2], (ru ? `${UNK[0]}, условия будущего поселения и фактическая среда на курсе не установлены. ` : `${UNK[1]}, settlement conditions and the actual medium along our course are unconfirmed. `) + unk.join(' ')]];
  }
  // разделение общей платы снабженца: станки и печать удешевляют
  const busSplitFor = (s, prod) => supplyS(s) ? ({ repair: 12, tools: 10, printQC: 8 })[prod] : STORM.split;
  const busSplit = s => busSplitFor(s, eqOf(s).prod);
  // итог оснащения после пути: что помогло, что не понадобилось, чего не хватило — по установленным событиям партии.
  // ids — сцены, которые прошли. Контрфакт — только для события, которое случилось; оценки капсул помечены как расчёт.
  function eqSummary(s, lang, ids) {
    const ru = lang === 'ru', eq = eqOf(s), help = [], miss = [], used = new Set(), had = id => ids.has(id), L = (r, e) => ru ? r : e;
    const rq = s.repairQual ? '' : L(` и ${DV.probe} км/с резерва манёвров`, ` and ${DV.probe} km/s of manoeuvre reserve`);
    if (s.cloudHit) {                                    // исход полосы — из модели щита
      const h = s.cloudHit;
      if (!h.breached) { help.push(L(`Удвоенный щит выдержал удар крупного зерна у облака: на панели ${h.panel} выбоина, сквозного пробоя нет, ремонт не понадобился.`, `The doubled shield withstood the coarse grain at the cloud: a scar on panel ${h.panel}, no through-breach, no repair needed.`)); used.add('shield'); }
      else {
        miss.push(L(`Щит пробит крупным зерном у облака (панель ${h.panel}). Удвоенный слой выдержал бы этот удар; расчётная разница потерь — ${CLOUD.dead} человек.`, `The shield was breached by a coarse grain at the cloud (panel ${h.panel}). A doubled layer would have held this impact; the estimated loss difference is ${CLOUD.dead} people.`));
        if (h.repair === 'replace') { help.push(L(`Запасная панель установлена ремонтниками с допуском: щит снова держит полный расчёт; крепёж — ${SHIELD_WORK.replace}% материалов.`, `Qualified repair hands fitted a spare panel: the shield holds its full rating again; fasteners took ${SHIELD_WORK.replace}% of materials.`)); used.add('shield'); }
        else if (eq.shield === 'sectors' && !s.repairQual) miss.push(L('Запасную панель не поставили: нет допуска к работе под тягой.', 'No spare panel was fitted: no qualification for work under thrust.'));
      }
    }
    const hs = s.streamImpact;                           // замена панели после удара потока — решение у пробоя
    if (hs && hs.repair === 'replace') { help.push(L(`После удара потока запасная панель ${hs.panel} установлена ремонтниками с допуском; крепёж — ${SHIELD_WORK.replace}% материалов.`, `After the stream strike qualified repair hands fitted a spare panel ${hs.panel}; fasteners took ${SHIELD_WORK.replace}% of materials.`)); used.add('shield'); }
    else if (hs && hs.level != null && !s.lostShip && eq.shield === 'sectors' && !s.repairQual) miss.push(L('После удара потока запасную панель не поставили: нет допуска к работе под тягой.', 'After the stream strike no spare panel was fitted: no qualification for work under thrust.'));
    if (s.scout > 0) {
      if (hasScouts(s)) { help.push(L(`Выпущен готовый разведчик: сохранены 10% материалов${rq}.`, `A ready scout was launched: 10% of materials saved${rq}.`)); used.add('probes'); }
      else miss.push(L(`Готового разведчика не было: сборка потребовала 10% материалов${rq}.`, `No ready scout: assembly used 10% of materials${rq}.`));
    }
    if (s.choices['d.stream'] === 'probe') {
      if (probesLeft(s)) { help.push(L('Готовый зонд сохранил 5% материалов. Измерение — 10 суток; чувствительность та же, что у собранного аппарата.', 'The ready probe saved 5% of materials. Measurement took 10 days; sensitivity matches a built probe.')); used.add('probes'); }
      else miss.push(L('Готового зонда не было: аппарат собран из посадочного запаса, расход — 5% материалов.', 'No ready probe: one was built from landing stock, using 5% of materials.'));
    }
    if (s.choices['d.stream'] === 'student') {
      if (eq.sensors === 'spectraPlus') { help.push(L('Расширенная спектрометрия сократила проверку потока с 26 до 18 суток.', 'Extended spectrometry cut the stream check from 26 to 18 days.')); used.add('sensors'); }
      else miss.push(L('Проверка потока штатными приборами заняла 26 суток; расширенная спектрометрия сократила бы её на 8.', 'The standard-instrument stream check took 26 days; extended spectrometry would have shortened it by 8.'));
    }
    if (s.choices['d.support'] === 'search') {
      if (s.support === 'found' && !s.taught && !s.koraYear && hasIR(s)) { help.push(L('ИК-обсерватория прочитала слабый тепловой след без подготовленного читателя: поддержка найдена.', 'The IR observatory read the faint heat trace without a trained reader: the support ship was found.')); used.add('sensors'); }
      else if (s.support === 'lost') miss.push(L('Слабый след прочитать не удалось: нет подготовленного читателя и ИК-обсерватории.', 'The faint trace could not be read: neither a trained reader nor an IR observatory was available.'));
    }
    if (had('a3.flare')) {
      if (hasIR(s)) { help.push(L('Раннее ИК-предупреждение о вспышке: корабль развернули заранее, 5% материалов ремонта сохранены.', 'Early IR warning of the flare: the ship turned in time, saving 5% of repair materials.')); used.add('sensors'); }
      else miss.push(L('Раннего ИК-предупреждения о вспышке не было; ремонт потребовал 5% материалов.', 'There was no early IR warning of the flare; repairs used 5% of materials.'));
    }
    if (had('a4.energy') && s.support !== 'found' && powerOK(s)) { const src = { grid: L('Сеть колонии обеспечила', 'The colony grid supplied'), reactor5: L('Реактор 5 МВт обеспечил', 'The 5 MW reactor supplied'), dual: L('Независимый блок обеспечил', 'An independent unit supplied') }[eq.energy];
      help.push(L(`${src} энергию поселению: дефицита первой зимы нет.`, `${src} the settlement: no first-winter energy shortage.`)); used.add('energy'); }
    if (had('a4.winter')) miss.push(L(`Поселению не хватило энергии: действующего дополнительного источника не было. Зимние потери — ${ppl(s.winterDead)}.`, `The settlement lacked power: no additional source was operating. Winter losses: ${s.winterDead}.`));
    // производство: глагол — по варианту (станки — мн. ч., печать — ж. р.)
    const prodName = { tools: L('Станки', 'Machine tools'), printQC: L('Металлопечать', 'Metal printing') }[eq.prod], pv = (pl, f) => eq.prod === 'printQC' ? f : pl;
    if (s.blueprint === 'built' && prodName) { help.push(L(`${prodName} ${pv('позволили', 'позволила')} восстановить резерв мощности: капельный радиатор — ${BLUEPRINT[eq.prod]}% материалов.`, `${prodName} restored the high-power reserve: the droplet radiator took ${BLUEPRINT[eq.prod]}% of materials.`)); used.add('prod'); }
    if (supplyS(s) && prodName && (s.busMethod === 'split' || s.busFound)) { help.push(L(`${prodName} ${pv('сократили', 'сократила')} расход на разделение платы: ${busSplit(s)}% вместо ${STORM.split}.`, `${prodName} cut the board-separation cost: ${busSplit(s)}% instead of ${STORM.split}.`)); used.add('prod'); }
    if (s.mission === 'supply' && s.deliver === 'both' && prodName) { help.push(L(`${prodName} ${pv('сохранили', 'сохранила')} 20% материалов: второй монтажный комплект — 10% вместо 30.`, `${prodName} saved 20% of materials: the second installation kit cost 10% instead of 30.`)); used.add('prod'); }
    if (eq.caps === 'capsSafe') { const T = Math.min(s.year, s.arrive), a = M.losses(T, s.watch, true, crewOf(s)).total, b = M.losses(T, s.watch, false, crewOf(s)).total;
      help.push(L(`Расчёт: надёжные капсулы — фоновые потери за путь ${a} вместо ${b}; это оценка модели, не список спасённых.`, `Estimate: reliable capsules — background losses on the road ${a} instead of ${b}; a model estimate, not a list of people saved.`)); used.add('caps'); }
    const idle = M.EQUIP.filter(p => !p.fixed && eq[p.id] !== M.EQ_BASE[p.id] && !used.has(p.id))
      .map(p => L(`${M.eqOpt(p.id, eq[p.id]).ru}: применение в пройденных событиях не зарегистрировано.`, `${M.eqOpt(p.id, eq[p.id]).en}: no use was recorded in the events encountered.`));
    let cost = null;
    const pp = String(s.choices['d.passport'] || '').split('|');
    if (pp.length === 4 && s.eq) {
      const sp = Object.assign({}, s, { target: s.taskHistory && s.taskHistory.length ? s.taskHistory[0].star : reqOf(s) ? reqOf(s).star : s.target }), d0 = { b: Number(pp[0]), r: Number(pp[1]), kits: pp[2] ? pp[2].split('+') : [], eq: s.eq };
      const cur = passportNumbers(sp, d0), base = passportNumbers(sp, Object.assign({}, d0, { eq: M.EQ_BASE })),
        rec = passportNumbers(sp, Object.assign({}, d0, { eq: M.eqDefault(s.mission) })), mo = x => `${sgn(x * 12, lang, 1)} ${ru ? 'мес.' : 'months'}`;
      const same = Math.abs(cur.used - rec.used) < 1e-9;
      cost = L(`Оснащение сверх штатного: ${f1(cur.used - base.used, 'ru')} тыс. т, расчётная задержка от массы ${mo(cur.T - base.T)}; ${same ? 'по массе совпадает с комплектом Совета.' : `от комплекта Совета: ${sgn(cur.used - rec.used, 'ru', 2)} тыс. т, ${mo(cur.T - rec.T)}`}`,
        `Equipment above standard: ${f1(cur.used - base.used, 'en')} kt, estimated mass-related delay ${mo(cur.T - base.T)}; ${same ? "by mass it matches the Council's loadout." : `relative to the Council's loadout: ${sgn(cur.used - rec.used, 'en', 2)} kt, ${mo(cur.T - rec.T)}.`}`);
    }
    return { help, idle, miss, cost };
  }
  const eqApi = { passportNumbers, eqHidden, eqPosHidden, eqQuestion, eqCard, eqIf, eqCost, eqCouncil, missionDossier, eqSummary };

  // ---- авария с живыми: сон, сигнал бедствия и спасатели (mission.js: rescuers, survivors)
  // Автономность H: 90 лет — вахта из двенадцати сменяется из спящих, реакторы и радиаторы исправны;
  // 60 — пробит зал (часть охлаждения на обходных магистралях); +30 — есть ремонтники с допуском.
  const WATCH_SOS = 12;
  // после отказа охлаждения в дрейфе держит только изолированное аварийное охлаждение зала — как при пробитом зале
  const sosHold = s => (s.streamHit === 2 || s.sos === 'cargo' || s.sos === 'rescueDock' ? 60 : 90) + (s.repairQual ? 30 : 0);
  let WORLD = { passTug: true };                                         // память мира между партиями (game.js)
  const setWorld = w => { WORLD = Object.assign({ passTug: true }, w || {}); };
  // cargo: год сигнала — целый (сутки работ — в журнале)
  // год сигнала — целый (у склада — после консервации зала: прибытие округляется вверх)
  const SOS_AT = { cargo: SOS_AT_cargo, drift: loopAt, stream: sosAtStream, home: s => s.arrive + 1, rescueDock: s => Math.max(s.arrive, Math.ceil(storeNow(s))) };
  function incidentOf(s, cause) {
    const sent = SOS_AT[cause](s), alive = crewOf(s) - (lossesOf(s, Math.min(sent, s.arrive)).total + s.dead + (s.rescueCrewDead || 0));
    return { id: `${s.target}|${sent}|${cause}`, cause, target: s.target, beta: s.beta, arrive: s.arrive, tMag: s.tMag, capRate: capsSafe(s) ? 1e-4 : 2e-4, sent, mission: s.mission,
      alive, watch: WATCH_SOS, sleepers: alive - WATCH_SOS, hold: sosHold(s), deadline: sent + sosHold(s) };
  }
  // названия баз в падежах: именительный, родительный, предложный с предлогом
  const PLACE = {
    pass: { ru: ['Перевал', 'Перевала', 'на Перевале'], en: 'the Pass' },
    earth: { ru: ['Земля', 'Земли', 'на Земле'], en: 'Earth' },
    shore: { ru: ['Ближний берег', 'Ближнего берега', 'на Ближнем берегу'], en: 'Near Shore' },
    yard: { ru: ['Верфь Эридана', 'Верфи Эридана', 'на Верфи Эридана'], en: 'the Eridani Yard' },
    garden: { ru: ['Сад', 'Сада', 'в Саду'], en: 'the Garden' }
  };
  const baseKey = r => r.id === 'local' ? r.colony : r.id;
  const place = (r, lang, k = 0) => lang === 'ru' ? PLACE[baseKey(r)].ru[k] : PLACE[baseKey(r)].en;
  const cap = x => x.charAt(0).toUpperCase() + x.slice(1);
  const yr = y => Math.round(y);
  function sosKnown(s, cause, lang) {
    const inc = incidentOf(s, cause), R = M.rescuers(inc, WORLD), c = R.council, ru = lang === 'ru';
    const best = R.list.reduce((a, b) => b.complete < a.complete ? b : a), m = inc.deadline - best.complete;
    return [
      best === c
        ? (ru ? `Сигнал первым услышит ${place(c, 'ru')} — в год ${yr(c.hear)} — и сможет помочь к году ${yr(c.complete)}.` : `${cap(place(c, 'en'))} will hear the signal first — in year ${yr(c.hear)} — and can help by year ${yr(c.complete)}.`)
        : (ru ? `Сигнал первым услышит ${place(c, 'ru')}, в год ${yr(c.hear)}; быстрее всех поможет ${place(best, 'ru')} — к году ${yr(best.complete)}.` : `${cap(place(c, 'en'))} will hear first, in year ${yr(c.hear)}; ${place(best, 'en')} can help soonest — by year ${yr(best.complete)}.`),
      ru ? `Капсулы с вахтой из двенадцати продержатся до года ${Math.round(inc.deadline)}.` + (m >= 0 ? ` Запас — ${yrs(m)}.` : ' Никто не успевает.')
        : `Capsules with a watch of twelve will hold until year ${Math.round(inc.deadline)}.` + (m >= 0 ? ` Margin: ${yrsEn(m)}.` : ' No one makes it in time.'),
      ru ? 'Экспедиция на этом кончается: дальше решают те, кто услышит.' : 'The expedition ends here: those who hear will decide the rest.'
    ];
  }
  const sosOption = cause => ({
    id: 'sos',
    label: { ru: 'Спать и звать помощь', en: 'Sleep and call for help' },
    known: { ru: s => sosKnown(s, cause, 'ru'), en: s => sosKnown(s, cause, 'en') },
    effect: st => { st.sos = cause; },
    record: {
      ru: 'Совет решает спать и ждать. Сигнал бедствия уходит к колониям и на Землю; двенадцать остаются на вахте.',
      en: 'The council decides to sleep and wait. The distress signal goes out to the colonies and to Earth; twelve stay on watch.'
    }
  });
  // конец партии: люди живы, экспедиция прекращена; следующую партию начинает совет, услышавший первым
  const SOS_WHERE = {
    cargo: { ru: s => `Корабль идёт к ${nmD(s)} сам и встанет там на орбиту около года ${s.arrive}${s.kits.includes('request') ? '; груз заявки — в трюме' : ''}.`, en: s => `The ship flies on to ${nm(s, 'en')} by itself and will enter orbit there around year ${s.arrive}${s.kits.includes('request') ? '; the request cargo is in the hold' : ''}.` },
    drift: { ru: s => `Корабль идёт к ${nmD(s)} сам и встанет там на орбиту около года ${s.arrive}.`, en: s => `The ship flies on to ${nm(s, 'en')} by itself and will enter orbit there around year ${s.arrive}.` },
    stream: { ru: s => `Корабль дотормаживает к ${nmD(s)}: орбита — около года ${s.arrive}.`, en: s => `The ship finishes braking toward ${nm(s, 'en')}: orbit around year ${s.arrive}.` },
    home: { ru: s => `Корабль на орбите у ${nmG(s)}.`, en: s => `The ship is in orbit at ${nm(s, 'en')}.` },
    rescueDock: { ru: s => `Корабль на орбите у ${nmG(s)}, рядом со складом Оттепели; живые Оттепели остаются в капсулах склада, их последняя диагностика — в сигнале.`, en: s => `The ship is in orbit at ${nm(s, 'en')}, beside Thaw's store; Thaw's living remain in the store's capsules, their last diagnostics in the signal.` }
  };
  // «Звать помощь?» после отказа контура (a2.loopEnd1)
  const sosDrift = (id, when) => ({
    id, scene: 'ring', kind: 'decision', when,
    title: { ru: 'Звать помощь?', en: 'Call for help?' },
    context: {
      ru: s => `Контур воды перекрыт и залатан. На вахте ${ppl(s.watch)}, ${s.repairQual ? 'ремонтники с допуском есть, но магистраль держится на заплатах' : 'ремонтников с допуском нет'}. До ${nmG(s)} — ${yrs(s.arrive - SOS_AT.drift(s))}; корабль дойдёт и затормозит сам, по программе.

Можно жить дальше на заплатах. Можно перевести зал в консервацию — глубже холод, реже обслуживание — и уснуть всем, кроме двенадцати: вахта сменяется из спящих, а сигнал бедствия услышат колонии и Земля. Для перевода нужны руки, которые пока есть.`,
      en: s => `The water loop is sealed and patched. ${s.watch} people are on watch, ${s.repairQual ? 'with qualified repair hands, but the main holds on patches' : 'with no qualified repair hands'}. ${nm(s, 'en')} is ${yrsEn(s.arrive - SOS_AT.drift(s))} away; the ship will get there and brake by itself, by programme.

They can go on living on the patches. Or they can put the hall into conservation — deeper cold, rarer maintenance — and everyone but twelve can go to sleep: the watch is relieved from among the sleepers, and the colonies and Earth will hear the distress signal. The switch needs hands, and there are still enough.`
    },
    options: [{
      id: 'carry',
      label: { ru: 'Жить дальше на заплатах', en: 'Go on living on the patches' },
      known: {
        ru: s => ['Экспедиция продолжается: вахта, агрозалы, дом у цели.', s.repairQual ? 'Ремонтники с допуском есть, но магистраль — на заплатах: следующая поломка может стать последней.' : 'Ремонтников с допуском нет: каждая следующая поломка — надолго.'],
        en: s => ['The expedition goes on: the watch, the agro halls, a home at the target.', s.repairQual ? 'There are qualified repair hands, but the main holds on patches: the next breakdown may be the last.' : 'No qualified repair hands: every next breakdown will take long.']
      },
      effect: st => {},
      record: {
        ru: 'Совет решает жить дальше. Заплаты проверяют каждую смену.',
        en: 'The council decides to go on living. The patches are checked every shift.'
      }
    }, sosOption('drift')]
  });
  // «Летучий голландец»: некому обслуживать зал (отказ списан в a2.loopEnd1)
  const dutchmanEnd = (id, when, year) => ({
    id, scene: 'drift', kind: 'end', year, when,
    title: { ru: '«Летучий голландец»', en: 'The Flying Dutchman' },
    text: {
      ru: s => `Контур воды отказал в обоих кольцах. Группа Б и одиннадцать человек вахты погибли; оставшихся ${ppl(s.watch)} не хватило, чтобы обслуживать зал анабиоза. Капсулы отказывают по одной.

Автоматика ведёт корабль дальше. Плазменный магнит включится по программе, корабль встанет на орбиту у ${nmG(s)} около года ${s.arrive} — и так и будет кружить с экипажем на борту, без живых. Маяк будет передавать, пока хватит питания.

Экспедиция окончена. Для следующей — к другой цели — это будет находка: журнал, имена, последняя запись вахты.`,
      en: s => `The water loop failed in both rings. Group B and eleven of the watch died; the remaining ${s.watch} were too few to maintain the anabiosis hall. The capsules fail one by one.

The automation flies the ship on. The plasma magnet will switch on by programme, and the ship will enter orbit at ${nm(s, 'en')} around year ${s.arrive} — and will keep circling there with its crew aboard, none of them alive. The beacon will transmit as long as there is power.

The expedition is over. For the next one — to another target — it will be a find: the log, the names, the watch's last entry.`
    }
  });
  const sosEnd = (cause, scene) => ({
    id: 'x.sos.' + cause, scene, kind: 'end', year: SOS_AT[cause], when: s => s.sos === cause,
    effect: st => { st.incident = incidentOf(st, cause); st.outcome = 'sos'; },
    title: { ru: 'Люди живы. Экспедиция прекращена', en: 'The people are alive. The expedition is over' },
    text: {
      ru: s => { const inc = s.incident, R = M.rescuers(inc, WORLD);
        return `Бодрствуют двенадцать; вахта сменяется из спящих по графику. В капсулах — ${ppl(inc.sleepers)}. ${SOS_WHERE[cause].ru(s)}

Сигнал бедствия ушёл в год ${Math.round(inc.sent)}: журнал, координаты, число живых, неисправности и дата последнего гарантированного пробуждения — год ${Math.round(inc.deadline)}. Помочь могут: ${R.list.map(r => `${place(r, 'ru')} — сигнал дойдёт в год ${yr(r.hear)}`).join('; ')}.

Экспедиция прекращена. Что будет со спящими, решит тот, кто услышит первым: ${place(R.council, 'ru')}.`; },
      en: s => { const inc = s.incident, R = M.rescuers(inc, WORLD);
        return `Twelve are awake; the watch is relieved from among the sleepers on a schedule. ${inc.sleepers} are in the capsules. ${SOS_WHERE[cause].en(s)}

The distress signal went out in year ${Math.round(inc.sent)}: the log, the coordinates, the number of living, the faults and the date of the last guaranteed waking — year ${Math.round(inc.deadline)}. Those who can help: ${R.list.map(r => `${place(r, 'en')} — the signal arrives in year ${yr(r.hear)}`).join('; ')}.

The expedition is over. What happens to the sleepers will be decided by whoever hears first: ${place(R.council, 'en')}.`; }
    }
  });

  // ---- снабженец: откуда берутся системы для форпоста. Из груза заявки — бесплатно; иначе из своих материалов:
  // передатчик −35%, капсульный блок −40% (без груза заявки обе системы — три четверти запаса).
  const BUILD = { relay: 35, caps: 40 };                                 // из своих материалов: передатчик, капсульный блок
  const relayKit = s => s.kits.includes('request');
  const capsKit = s => s.kits.includes('request');
  const supplyNeed = s => (relayKit(s) ? 0 : BUILD.relay) + (capsKit(s) ? 0 : BUILD.caps);   // материалов на обе системы
  // второй монтажный комплект: 30% материалов, со станками — 10%; нужен запас и на сами системы
  // вторую бригаду питает вторая сеть корабля: отданный под вспышками блок закрывает «всё сразу»
  const supplyBothCost = s => { const c = ['tools', 'printQC'].includes(eqOf(s).prod) ? 10 : 30; return s.gridBlocks >= 2 && s.materials >= supplyNeed(s) + c ? c : null; };
  // переселение: койки и регенерация воздуха для девяноста (−15%), отдельная сеть для их колец
  const SHELTER = 15;
  // прогноз: что будет поставлено при выбранном порядке (для «Что известно» — те же правила, что у эффекта)
  const supplyForecast = (s, first, extra = 0) => { const t = { kits: s.kits, materials: s.materials - extra, relayOK: false, capsOK: false }; supplyBuild(t, first); return t; };
  // поставить системы: из груза заявки или из своих материалов, пока их хватает (сначала связь, потом капсулы — порядок работ в тексте)
  // порядок — выбранный: при нехватке материалов достаётся то, что ставят первым
  function supplyBuild(st, first) {
    const relay = () => { st.relayOK = relayKit(st) || (st.materials >= BUILD.relay && (st.materials -= BUILD.relay, true)); };
    const caps = () => { st.capsOK = capsKit(st) || (st.materials >= BUILD.caps && (st.materials -= BUILD.caps, true)); };
    if (first === 'caps') { caps(); relay(); } else { relay(); caps(); }
  }
  const supplySrc = (s, lang) => { const ru = lang === 'ru', r = relayKit(s), c = capsKit(s);
    if (r && c) return ru ? 'Передатчик и капсульный блок — из груза заявки.' : 'The transmitter and the capsule unit come from the request cargo.';
    const need = supplyNeed(s), parts = [!r && (ru ? 'передатчик' : 'the transmitter'), !c && (ru ? 'капсульный блок' : 'the capsule unit')].filter(Boolean).join(ru ? ' и ' : ' and ');
    return ru ? `${cap(parts)} придётся собирать из своих материалов: −${need}%${s.materials < need ? ` — а их ${Math.round(s.materials)}%, на всё не хватит` : ''}.` : `${cap(parts)} must be built from our own materials: −${need}%${s.materials < need ? ` — and there are ${Math.round(s.materials)}%, not enough for everything` : ''}.`; };

  // ---- протокол совета на следующие три года (a4.plan): решённая задача, средства, ограничения — по фактам.
  // План записывается отдельно от результата: «решили восстановить связь» не значит «связь восстановлена».
  // что осталось у цели: форпост с кораблём, поселение внизу, орбитальный дом, база на спутниках, обитаемый маяк, стоянка
  const homeKind = s => s.mission === 'supply' ? 'outpost' : rescueS(s) ? (['old', 'closed'].includes(s.site) ? 'colony' : s.site === 'orbit' ? 'orbital' : 'ship') : livable(s) ? (s.settle === 'orbit' ? 'orbital' : 'colony')
    : ({ moons: 'moons', beacon: 'beacon', return: 'return' })[s.home] || 'orbital';
  const PLAN_WHO = {
    outpost: { ru: 'Протокол совета форпоста', en: 'Minutes of the outpost council' },
    colony: { ru: 'Протокол совета колонии', en: 'Minutes of the colony council' },
    orbital: { ru: 'Протокол совета орбитального дома', en: 'Minutes of the orbital home council' },
    moons: { ru: 'Протокол совета базы', en: 'Minutes of the base council' },
    beacon: { ru: 'Протокол совета вахты', en: 'Minutes of the watch council' },
    return: { ru: 'Протокол совета экспедиции', en: 'Minutes of the expedition council' },
    ship: { ru: 'Протокол совета корабля', en: "Minutes of the ship's council" }
  };
  const planWho = (s, lang) => PLAN_WHO[homeKind(s)][lang];
  function planText(s, lang) {
    const ru = lang === 'ru', m = Math.round(s.materials), plan = [], means = [], limits = [];
    if (s.mission === 'supply' && s.supplyFailed) {
      plan.push(ru ? 'держать связь с форпостом и передать отчёт о срыве; что станет с его людьми, корабль решить не может' : "keep in contact with the outpost and send the report of the failure; the ship cannot decide what becomes of its people");
      means.push(ru ? `материалы ${m}%` : `materials ${m}%`);
      limits.push(ru ? 'постоянного обеспечения форпоста нет; судьба оставшихся не установлена' : "the outpost has no permanent support; the remaining residents' fate is unknown");
    } else if (s.mission === 'supply') {
      if (!s.relayOK) plan.push(ru ? `собрать передатчик, когда хватит материалов: нужно ${BUILD.relay}%, есть ${m}%` : `build a transmitter once there are materials: ${BUILD.relay}% needed, ${m}% at hand`);
      if (!s.capsOK) plan.push(ru ? `собрать капсульный блок: нужно ${BUILD.caps}%, есть ${m}%` : `build a capsule unit: ${BUILD.caps}% needed, ${m}% at hand`);
      if (s.relayOK && s.capsOK) plan.push(ru ? 'держать связь и капсулы, восстановить ремонтный запас форпоста' : "keep the link and the capsules running, rebuild the outpost's repair stock");
      if (s.shelter) plan.push(ru ? `поддерживать кольца корабля для ${s.shelterPeople ? ppl(s.shelterPeople) : 'девяноста человек'} форпоста` : `keep the ship's rings running for ${s.shelterPeople || 'ninety'} of the outpost's people`);
      means.push(s.gridBlocks >= 2 ? (ru ? `материалы ${m}%; корабль — модуль форпоста, его реакторы — вторая сеть` : `materials ${m}%; the ship is a module of the outpost, its reactors a second grid`)
        : (ru ? `материалы ${m}%; корабль — модуль форпоста` : `materials ${m}%; the ship is a module of the outpost`));
      if (s.gridBlocks < 2) limits.push(ru ? 'резервный блок выгорел под вспышками — у корабля одна сеть, резерва нет' : 'the reserve block burned out under the flares — the ship has one grid, no backup');
      if (s.outpostDead) limits.push(ru ? `потери форпоста — ${ppl(s.outpostDead)}` : `the outpost has lost ${s.outpostDead}`);
    } else if (rescueS(s)) {
      plan.push(({ old: ru ? 'обживать старую площадку Оттепели' : "settle Thaw's old site", closed: ru ? 'обживать старую площадку на замкнутой воде; местную воду в энергетику не пускать' : 'settle the old site on a closed water loop; keep local water out of the power system',
        orbit: ru ? 'орбитальный дом: кольца корабля и обеспечение на годы' : "an orbital home: the ship's rings and supply for years", evacuated: ru ? 'площадка закрыта после аварии: жить на корабле, искать новое место' : 'the site is closed after the accident: live aboard the ship, look for a new place' })[s.site]
        || (ru ? 'жить на корабле; дом пока не выбран' : 'live aboard the ship; the home is not yet chosen'));
      if (s.rescued) plan.push(s.housed ? (ru ? `выходить спасённых Оттепели — ${ppl(s.rescued)}` : `nurse the ${s.rescued} rescued from Thaw back to health`)
        : (ru ? `построить жильё для спасённых Оттепели — ${ppl(s.rescued)}; до тех пор ${s.thawPlace === 'store' ? 'они спят на восстановленном складе' : `лазарет — их временное убежище до года ${yr(s.infirmaryUntil)}`}` : `build housing for the ${s.rescued} rescued from Thaw; until then ${s.thawPlace === 'store' ? 'they sleep in the restored store' : `the infirmary is their temporary shelter until year ${yr(s.infirmaryUntil)}`}`));
      means.push(ru ? `материалы ${m}%` : `materials ${m}%`);
      if (s.rescued && !s.housed && s.thawPlace === 'infirmary') limits.push(ru ? `жилья к сроку лазарета (год ${yr(s.infirmaryUntil)}) совет не строит — обязательство будет сорвано` : `the council builds no housing before the infirmary term (year ${yr(s.infirmaryUntil)}) — the commitment will fail`);
      if (s.rescued && s.thawDead) limits.push(ru ? `Оттепель потеряла ${ppl(s.thawDead)} из ${THAW0}, пока шла помощь` : `Thaw lost ${s.thawDead} of ${THAW0} while help was coming`);
      if (!s.rescued) limits.push(ru ? 'Оттепели помочь не успели' : 'Thaw could not be helped in time');
    } else if (livable(s)) {
      if (s.settle === 'orbit') plan.push(ru ? 'корабль — город на орбите; внизу полигон, разведка, поля под куполами' : 'the ship is a town in orbit; below — a test ground, the survey, fields under domes');
      else {
        plan.push(ru ? 'обжить поселение внизу, будить людей по мере жилья' : 'settle the ground below, waking people as housing allows');
        plan.push(energyOK(s) ? (ru ? 'энергии на зимы хватает — расширять агрозалы' : 'there is energy for the winters — expand the agro halls')
          : (ru ? 'вторая зима без надёжной энергии: искать местный источник' : 'a second winter without reliable power: find a local source'));
      }
      if (s.mission === 'rescue' && s.rescued) plan.push(s.housed ? (ru ? `выходить спасённых Оттепели — ${ppl(s.rescued)}` : `nurse the ${s.rescued} rescued from Thaw back to health`)
        : (ru ? `построить жильё для спасённых Оттепели — ${ppl(s.rescued)}; до тех пор ${s.rescueOp === 'restore' ? 'они спят на восстановленном складе' : 'лазарет — их временное убежище на три года'}` : `build housing for the ${s.rescued} rescued from Thaw; until then ${s.rescueOp === 'restore' ? 'they sleep in the restored store' : 'the infirmary is their temporary shelter for three years'}`));
      if (s.mission === 'rescue' && s.rescued && s.thawDead) limits.push(ru ? `Оттепель потеряла ${ppl(s.thawDead)} из ${THAW0}, пока шла помощь` : `Thaw lost ${s.thawDead} of ${THAW0} while help was coming`);
      means.push(ru ? `материалы ${m}%` : `materials ${m}%`);
      if (s.settle === 'surface') limits.push(ru ? 'посадочный модуль разобран на каркас — пути наверх нет' : 'the lander is taken apart for the frame — there is no way up');
      if (s.mission === 'rescue' && !s.rescued) limits.push(ru ? 'Оттепели помочь не успели' : 'Thaw could not be helped in time');
    } else {
      plan.push(({
        orbit: ru ? 'расширять кольца, будить людей по мере мест' : 'extend the rings, waking people as room allows',
        moons: ru ? 'строить базу на твёрдом из местного камня' : 'build the base on solid ground from local stone',
        beacon: ru ? 'передавать наблюдения и ждать следующих' : 'transmit observations and wait for those who follow',
        return: ru ? 'добыча у гиганта: до ступени обратного пути — десятилетия' : 'mining at the giant: the return stage is decades away'
      })[s.home] || (ru ? 'держать корабль' : 'keep the ship going'));
      means.push(ru ? `материалы ${m}%` : `materials ${m}%`);
    }
    if (s.deadHere && s.mission !== 'supply') limits.push(ru ? `потери у цели — ${ppl(s.deadHere)}${!s.winterDead ? '' : s.winterDead === s.deadHere ? ', все — в первую зиму' : `, из них в первую зиму — ${s.winterDead}`}` : `${s.deadHere} died at the target${s.winterDead ? `, ${s.winterDead} of them in the first winter` : ''}`);
    const d = Math.round(M.star(s.target).d), lines = (rescueS(s) ? [ru ? `Отчёт подписывают участники экспедиции${s.rescued ? ' и пробуждённые жители Оттепели' : ''}. В нём — даты помощи, имена погибших, работающие контуры и фактические места. Спящих не записывают подписантами.`
      : `The report is signed by the expedition${s.rescued ? " and Thaw's awakened residents" : ''}. It holds the dates of assistance, the names of the dead, the working loops and the actual places. Sleepers are not listed as signatories.`] : []).concat([
      (ru ? 'Решено: ' : 'Resolved: ') + plan.join('; ') + '.',
      (ru ? 'Средства: ' : 'Means: ') + means.join('; ') + '.'
    ]);
    if (limits.length) lines.push((ru ? 'Ограничения: ' : 'Limits: ') + limits.join('; ') + '.');
    lines.push(ru ? `Отчёт в Кольцо уходит сейчас; Земля получит его около года ${Y4(s) + d}. Это план, а не итог: что из него выйдет, узнают следующие.` : `The report goes to the Ring now; Earth will receive it around year ${Y4(s) + d}. This is a plan, not an outcome: those who come next will learn what came of it.`);
    return lines.join('\n');
  }
  // итог спасателя v3: полнота отдельно от названия исхода
  function endR(s, lang) {
    const ru = lang === 'ru', placed = s.housed ? s.rescued : 0, full = s.rescued === THAW0 && s.housed && !s.rescueCrewDead;
    const done = !s.rescued ? (ru ? 'Спасательная задача сорвана.' : 'The rescue mission failed.') : outcomeOf(s) === 'rescueFailed' ? (ru ? 'Обязательство не выполнено: срок лазарета истёк без постоянного жилья.' : 'The commitment failed: the infirmary term ran out without permanent housing.') : full ? (ru ? 'Обязательство выполнено полностью.' : 'The commitment is fully met.') : (ru ? 'Результат частичный.' : 'The result is partial.');
    return ru ? `Исход: ${OUTCOME[outcomeOf(s)].ru.toLowerCase()}. Живы после помощи ${s.rescued}; устроены ${placed}; дополнительные потери Оттепели — ${s.thawDead}, экипажа в происшествиях — ${s.rescueCrewDead || 0}. ${done} Позади ${yrs(Yepi(s))}: путь, склад, дом, ответ. Имена, причины и обязательства — в итоге ниже.`
      : `Outcome: ${OUTCOME[outcomeOf(s)].en.toLowerCase()}. Alive after assistance: ${s.rescued}; housed: ${placed}; additional Thaw losses: ${s.thawDead}; crew incident losses: ${s.rescueCrewDead || 0}. ${done} ${yrsEn(Yepi(s))} are behind: the road, the store, the home, the answer. Names, causes and commitments are in the summary below.`;
  }
  // ---- запись экспедиции в мир — один раз по id; Земля узнаёт об итоге, когда дойдёт отчёт
  const MISSION_NAME = { contact: { ru: 'контакт', en: 'contact' }, supply: { ru: 'снабжение', en: 'supply' }, rescue: { ru: 'спасение', en: 'rescue' } };
  function expeditionEvent(s, exp) {
    const d = Math.round(M.star(s.target).d), end = s.lostShip ? 'lost' : s.dutchman ? 'dutchman' : s.outcome || outcomeOf(s);
    // когда Земля узнает: отчёт первого утра дома; последняя передача погибшего; о «голландце» и аварии — не по отчёту
    const reportAt = end === 'lost' ? Math.round(s.year + d) : ['dutchman', 'sos'].includes(end) ? null : Y4(s) + d;
    const ok = !['lost', 'dutchman', 'sos'].includes(end);
    // задание заявки: выполнено ли и когда отчёт о нём дойдёт до Земли (DOC «Ревью Codex — заявки из мира», шаг 5)
    // выполнение — одно правило с эпилогом (у снабжения и спасения — по их итогу, отчёт — с отчётом экспедиции)
    const task = s.task ? Object.assign({}, s.task, { done: ok && missionComplete(s),
      reportEarthAt: s.task.reportAt != null ? Math.round(s.task.reportAt + d) : ok && missionComplete(s) ? reportAt : null }) : null;
    return { id: `${exp}|done`, expedition: { id: exp, number: 41, mission: s.mission, target: s.target, outcome: end, arrive: s.arrive, endedAt: s.year, reportAt,
      lostBy: end === 'lost' ? (s.terminalReason === 'heat' ? 'heat' : 'stream') : null,   // гибель: отказ охлаждения или поток Тёмной звезды
      request: s.requestId || null, task,
      home: ok && end !== 'supplyFailed' ? homeKind(s) : null, alive: ok ? aliveOf(s) : null,
      incidents: JSON.parse(JSON.stringify(s.incidents || [])),
      hull: end === 'lost' ? 'wreck' : end === 'dutchman' ? 'orbitDead' : end === 'sos' ? 'sleeping' : null,
      cast: CAST.map(id => ({ id, ru: people[id].ru[0], en: people[id].en[0], fate: end === 'lost' || end === 'dutchman' ? 'dead' : end === 'sos' ? 'asleep' : 'alive' })),
      facts: rescueS(s) ? thawFacts(s, end) : !ok ? null : s.mission === 'supply' ? { relayOK: s.relayOK, capsOK: s.capsOK, shelter: !!s.shelter, shelterPeople: s.shelterPeople || null, outpostDead: s.outpostDead || 0, capsLost: !!s.capsLost, failed: !!s.supplyFailed }
        : s.mission === 'rescue' ? { rescued: s.rescued, housed: !!s.housed, op: s.rescueOp, thawDead: s.thawDead } : null } };
  }
  // спасатель v3: реестр Оттепели в памяти мира — живые по номерам, где живут, погибшие; при аварии — последняя диагностика склада
  function thawFacts(s, end) {
    const stranded = !s.thawStable && !!s.thawConfirmed;
    return { v: 3, rescued: s.rescued, housed: !!s.housed, op: s.rescueOp, thawDead: s.thawDead, stranded,
      alive: stranded ? thawAlive(s, storeNow(s)) : thawAlive(s, Infinity).filter(() => s.rescued > 0), deadIds: (s.thawDeadIds || []).slice(),
      site: s.site || null, place: s.thawPlace || null, crewDead: s.rescueCrewDead || 0, failed: end === 'rescueFailed', infirmaryUntil: s.infirmaryUntil };
  }
  const THAW_PLACE = { sector: { ru: 'в спасательном секторе корабля', en: "in the ship's rescue sector" }, module: { ru: 'в жилом модуле', en: 'in the living module' },
    store: { ru: 'спят на восстановленном складе, ждут жилья', en: 'asleep in the restored store, awaiting housing' }, infirmary: { ru: 'в лазарете корабля', en: "in the ship's infirmary" },
    old: { ru: 'на старой площадке Оттепели', en: "at Thaw's old site" }, closed: { ru: 'на старой площадке, на замкнутой воде', en: 'at the old site, on a closed water loop' }, orbit: { ru: 'в орбитальном доме', en: 'in the orbital home' } };
  function thawWorld(f, lang) {
    const ru = lang === 'ru', n = f.alive.length;
    if (f.stranded) return ru ? `Оттепель: помощь не завершена — сорок первая уснула у склада. По последней диагностике на складе живы ${n}${n ? `: ${namesShort(f.alive, 'ru')}` : ''}.`
      : `Thaw: assistance was not completed — the Forty-First went to sleep beside the store. By the last diagnostics ${n} are alive in the store${n ? `: ${namesShort(f.alive, 'en')}` : ''}.`;
    if (!f.rescued) return ru ? 'Оттепель: помощь опоздала — живых на складе не осталось.' : 'Thaw: help came too late — no one was left alive in the store.';
    const where = THAW_PLACE[f.place] ? THAW_PLACE[f.place][lang] : (ru ? 'на корабле' : 'aboard the ship');
    return ru ? `Оттепель: спасены ${f.rescued === THAW0 ? `все ${THAW0}` : `${f.rescued} из ${THAW0}`} — ${where}${f.failed ? '; срок лазарета истёк без жилья — обязательство не выполнено' : ''}. В реестре — ${namesShort(f.alive, 'ru')}.`
      : `Thaw: ${f.rescued === THAW0 ? `all ${THAW0}` : `${f.rescued} of ${THAW0}`} rescued — ${where}${f.failed ? '; the infirmary term ran out without housing — the commitment failed' : ''}. The register lists ${namesShort(f.alive, 'en')}.`;
  }
  // строки «Мир после экспедиции»: что помнит мир (экспедиции, аппарат Перевала, поселения спасённых)
  const HOME_KIND = {
    outpost: { ru: 'форпост, корабль — его модуль', en: 'the outpost, with the ship as its module' },
    colony: { ru: 'поселение на поверхности', en: 'a settlement on the surface' },
    orbital: { ru: 'орбитальный дом', en: 'an orbital home' },
    moons: { ru: 'база на спутниках', en: 'a base on the moons' },
    beacon: { ru: 'обитаемый маяк', en: 'an inhabited beacon' },
    return: { ru: 'стоянка перед возвращением', en: 'a camp before the return' },
    ship: { ru: 'корабль на орбите — дом не построен', en: 'the ship in orbit — no home built' }
  };
  function worldLines(world, lang) {
    const ru = lang === 'ru', out = [];
    for (const x of (world && world.expeditions) || []) {
      const where = M.nameOf(x.target, lang), at = ru ? nmG({ target: x.target }) : where, f = x.facts;
      // записи прежних сборок: год отчёта без округления, гибель без причины (износ — по протоколу происшествий)
      const lostBy = x.lostBy || ((x.incidents || []).some(z => z.kind === 'wearLost') ? 'heat' : 'stream');
      const reportAt = x.reportAt == null ? null : Math.round(x.reportAt);
      const res = {
        lost: lostBy === 'heat' ? (ru ? 'корабль погиб: все контуры охлаждения отказали, ядро осталось без отвода тепла; следующим останутся журнал отказов и координаты остова' : 'the ship was lost: every cooling loop failed and the core was left without heat rejection; the failure log and the wreck coordinates remain for those who follow')
          : ru ? 'корабль погиб в потоке Тёмной звезды; следующим останутся измеренный поток, журнал и координаты остова' : "the ship was lost in the Dark Star's stream; the measured stream, the log and the wreck's coordinates remain for those who follow",
        dutchman: ru ? `вахты не хватило на зал анабиоза; автоматика ведёт пустой корабль к ${nmD({ target: x.target })}, орбита — около года ${x.arrive}. Для следующих это будет находка` : `the watch was too few for the anabiosis hall; the automation flies the empty ship to ${where}, orbit around year ${x.arrive}. For those who follow it will be a find`,
        sos: ru ? 'авария, люди в анабиозе, сигнал бедствия ушёл' : 'an accident; the people are in anabiosis, the distress signal has gone out'
      }[x.outcome] || (OUTCOME[x.outcome] || { ru: x.outcome, en: x.outcome })[lang];
      const mis = MISSION_NAME[x.mission] ? MISSION_NAME[x.mission][lang] : '';
      out.push((ru ? `Экспедиция №${x.number} — ${mis} · ${where}: ${res}.` : `Expedition No. ${x.number} — ${mis} · ${where}: ${res}.`)
        + (reportAt == null ? '' : reportAt <= x.endedAt ? (ru ? ` Отчёт получен на Земле около года ${reportAt}.` : ` The report was received on Earth around year ${reportAt}.`)
          : x.outcome === 'lost' ? (ru ? ` Последняя передача дойдёт до Земли около года ${reportAt}.` : ` The last transmission will reach Earth around year ${reportAt}.`)
          : (ru ? ` Отчёт дойдёт до Земли около года ${reportAt}.` : ` The report will reach Earth around year ${reportAt}.`)));
      if (x.task && TASK_NAME[x.task.work]) { const n = taskName(x.task, lang), at = x.task.reportEarthAt == null ? null : Math.round(x.task.reportEarthAt);
        out.push(x.task.done ? (ru ? `Задание — ${n}: выполнено${at != null ? `; отчёт дойдёт до Земли около года ${at}` : ''}.` : `The task — ${n}: done${at != null ? `; the report will reach Earth around year ${at}` : ''}.`)
          : (ru ? `Задание — ${n}: не выполнено.` : `The task — ${n}: not done.`)); }
      if (f && x.mission === 'supply' && (f.capsLost || f.failed)) out.push(ru ? `Ксилона Ир: ${f.failed ? 'снабжение сорвано — постоянного обеспечения нет' : 'капсульная секция потеряна при повторном включении'}.` : `Xylona Ir: ${f.failed ? 'the supply mission failed — no permanent support' : 'the capsule section was lost on restart'}.`);
      if (f && x.mission === 'rescue' && f.v !== 3) out.push(!f.rescued ? (ru ? 'Оттепель: помощь опоздала — живых на складе не осталось.' : 'Thaw: help came too late — no one was left alive in the store.')
        : ru ? `Оттепель: спасены ${f.rescued === THAW0 ? `все ${THAW0}` : `${f.rescued} из ${THAW0}`} — ${f.housed ? 'устроены' : f.op === 'restore' ? 'спят на восстановленном складе, ждут жилья' : 'в лазарете, ждут жилья'}.`
        : `Thaw: ${f.rescued === THAW0 ? `all ${THAW0}` : `${f.rescued} of ${THAW0}`} rescued — ${f.housed ? 'housed' : f.op === 'restore' ? 'asleep in the restored store, awaiting housing' : 'in the infirmary, awaiting housing'}.`);
      else if (f && x.mission === 'rescue') out.push(thawWorld(f, lang));    // спасатель v3: имена остаются там, где люди живут
      else if (f && x.mission === 'supply') out.push(ru ? `Ксилона Ир: связь ${f.relayOK ? 'восстановлена' : 'не восстановлена'}, капсулы ${f.capsOK ? 'работают' : 'не восстановлены'}${f.shelter ? `, в кольцах корабля живут ${f.shelterPeople ? ppl(f.shelterPeople) : 'девяносто'}` : ''}${f.outpostDead ? `; потери форпоста — ${ppl(f.outpostDead)}` : ''}.`
        : `Xylona Ir: link ${f.relayOK ? 'restored' : 'not restored'}, capsules ${f.capsOK ? 'running' : 'not restored'}${f.shelter ? `, ${f.shelterPeople || 'ninety'} live in the ship's rings` : ''}${f.outpostDead ? `; ${f.outpostDead} of the outpost died` : ''}.`);
      if (x.incidents && x.incidents.length) out.push(ru ? `Протокол: ${x.incidents.map(i => `год ${incYear(i)} — ${INCIDENT_NAME[i.kind].ru}, ${i.lost ? 'гибель корабля' : i.dead ? `погибли ${i.dead}` : 'без жертв'}`).join('; ')}.`
        : `Minutes: ${x.incidents.map(i => `year ${incYear(i)} — ${INCIDENT_NAME[i.kind].en}, ${i.lost ? 'the ship lost' : i.dead ? `${i.dead} dead` : 'no one died'}`).join('; ')}.`);
      if (x.cast && x.cast.length) { const n = x.cast.map(c => c[lang]).join(', ');
        out.push(x.hull === 'wreck' ? (ru ? `На борту остова — ${n}.` : `Aboard the wreck: ${n}.`)
          : x.hull === 'orbitDead' ? (ru ? `На борту «голландца» — ${n}.` : `Aboard the Flying Dutchman: ${n}.`)
          : x.hull === 'sleeping' ? (ru ? `Уснули на корабле, когда ушёл сигнал бедствия, — ${n}.` : `Went to sleep aboard the ship when the distress signal went out: ${n}.`)
          : x.home === 'colony' ? (ru ? `Основатели колонии у ${at} — ${n}.` : `Founders of the colony at ${where}: ${n}.`)
          : x.home === 'outpost' ? (ru ? `С форпостом остались — ${n}.` : `Staying with the outpost: ${n}.`)
          : (ru ? `У ${at} живут — ${n}.` : `Living at ${where}: ${n}.`)); }
      if (x.hull === 'wreck') out.push(lostBy === 'heat'   // отказ охлаждения: остов там, где корабль был, — в пути или у цели
        ? (x.endedAt >= x.arrive ? (ru ? `Остов остаётся на орбите у ${at}; журнал отказов передан.` : `The wreck stays in orbit at ${where}; the failure log has been transmitted.`)
          : (ru ? `Остов идёт по прежнему курсу к ${nmD({ target: x.target })}; его траектория передана — следующие смогут его найти.` : `The wreck coasts on along its course to ${where}; its trajectory has been transmitted — those who follow can find it.`))
        : (ru ? 'Остов уходит от ε Индейца по прежней траектории, кувыркаясь; его траектория передана — следующие смогут его найти.' : 'The wreck tumbles away from ε Indi along its former trajectory; its trajectory has been transmitted — those who follow can find it.'));
      if (x.hull === 'orbitDead') out.push(ru ? `Корабль на орбите у ${at} — с экипажем на борту, без живых. Маяк передаёт, пока хватает питания.` : `The ship is in orbit at ${where} — with its crew aboard, none alive. The beacon transmits while power lasts.`);
      if (x.home) out.push(ru ? `У ${at}: ${HOME_KIND[x.home].ru}; экипаж — ${ppl(x.alive)}.` : `At ${where}: ${HOME_KIND[x.home].en}; crew: ${x.alive} people.`);
    }
    if (world && world.passTug === false) out.push(ru ? 'Перевал: межзвёздный аппарат ушёл спасать сорок первую.' : 'The Pass: the interstellar vessel went to rescue the Forty-First.');
    for (const x of (world && world.settled) || []) {
      const at = ru ? nmG({ target: x.star }) : M.nameOf(x.star, lang), when = x.year ? (ru ? `, с года ${x.year}` : `, from year ${x.year}`) : '';
      out.push(x.joined ? (ru ? `У ${at}: колония «${M.colony(x.joined).ru}» приняла спасённых — ${ppl(x.people)}${when}.` : `At ${at}: ${M.colony(x.joined).en} took in the rescued — ${x.people} people${when}.`)
        : (ru ? `У ${at}: поселение спасённых — ${ppl(x.people)}${when}.` : `At ${at}: a settlement of the rescued — ${x.people} people${when}.`));
    }
    out.push(ru ? 'Продолжение этого мира — экспедиция №42 — пока не представлено в срезе.' : 'The continuation of this world — expedition No. 42 — is not in the slice yet.');
    return out;
  }

  // ---- цена ошибки (DOC «Ревью Codex — цена ошибки, спецификация v1»): скрытые состояния задаются сидом экспедиции
  // заранее и не перебрасываются. Без сида скрытого нет: hidden → null.
  // hidden(s, key) ∈ [0, 1): FNV-1a по UTF-8 с финализацией; ключ постоянный (без токенов, вариантов, языка, preview).
  const UTF8 = new TextEncoder();
  function hashU32(str) {
    let h = 2166136261;
    if (/^[\x00-\x7f]*$/.test(str)) for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }   // ASCII: байты UTF-8 = коды
    else for (const b of UTF8.encode(str)) { h ^= b; h = Math.imul(h, 16777619); }
    h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
    return h >>> 0;
  }
  const RISK = 5;                                                       // версия правил новых экспедиций: 1 — цена ошибки контакта, 2 — сюжет снабженца, 3 — сюжет спасателя, 4 — оснащение (Совет снабженцу без сети колонии; станки и печать удешевляют разделение платы); 5 — симулятор: время, щит, облако и поток на модели
  // публичное состояние — то, что знает экипаж: без сида скрытое недоступно (hidden → null). По нему строятся
  // тексты карточки, «Что известно», рекомендация Совета и «После»; исход — только эффектом на полном состоянии.
  const publicOf = s => { const p = JSON.parse(JSON.stringify(s)); p.riskSeed = null; if (p.wear) p.wear = W.publicOf(p.wear); return EV.strip(p); };
  const hidden = (s, key) => s.riskSeed ? hashU32(JSON.stringify([s.riskVersion, s.riskSeed, key])) / 4294967296 : null;

  function initialState(ctx) {
    const st = {
      riskVersion: RISK,                                                // правила одни (старые версии удалены; номер — в ключе скрытых бросков)
      riskSeed: ctx && ctx.riskSeed ? String(ctx.riskSeed) : null,
      evOff: !!(ctx && ctx.events === false),
      worldSeed: ctx && typeof ctx.worldSeed === 'string' && ctx.worldSeed ? ctx.worldSeed : null,   // сид мира: события Кольца
      agenda: ctx && Array.isArray(ctx.agenda) ? ctx.agenda.slice() : null,   // повестка Совета на старт экспедиции (requests.js)   // события v1 выключены (проверки и калибровка: те же сиды без событий)
      year: 0,
      reserve: 100,        // резерв манёвров, % паспортного
      agroDelay: 0,        // задержка резервного агромодуля, лет
      koraYear: false,     // Кора осталась на вахте ещё на год
      repairQual: false,   // ремонтники допущены к монтажу под тягой
      measured: false,     // плотность края облака измерена: проверка нашла полосу крупной пыли
      cloudCheck: null,    // measured | skipped — проверка края затмением
      cloudFound: false,   // проверка нашла полосу крупной пыли
      cloudDead: 0,        // погибли у края облака
      shieldBreach: false, // сектор щита пробит (установлено)
      loopCheck: null,     // ordinary | deep | skipped — проверка общей магистрали
      loopFound: false,    // проверка нашла дефект общей магистрали
      loopDead: 0,         // погибли при отказе контура воды
      streamCheck: null,   // probe | kora | student — чем проверяли поток
      streamFound: false,  // проверка увидела опасную полосу на курсе
      streamDays: 0,       // дни окна, ушедшие на проверку
      streamRoute: null,   // evade | pass
      streamDead: 0,       // погибли в потоке
      streamCause: null,   // shield | power — почему удар тяжёлый
      cargoMethod: null,   // снабженец v2: direct | check | isolate — как подключали холодильник в дрейфе
      cargoFound: false,   // опрессовка нашла трещину
      cargoDays: 0,        // дни работ в дрейфе
      cargoFailed: false,  // общий отказ охлаждения
      supplyCrewDead: 0,   // погибли из экипажа при работах снабжения
      supplyDays: 0,       // сутки операции у форпоста (временный контур держит 45)
      supplyProtected: false, // укрытый пост и отдельное управление монтажом
      supplyIndependent: false, // вторая сеть отдана насосам (до разделения систем)
      busMethod: null,     // replace | check | deep | split — что делали с общей платой
      busFound: false,     // проверка нашла повреждение платы
      busResolved: false,  // управление разделено или плата исправна
      capsLost: false,     // капсульная секция форпоста потеряна
      outpostDeadIds: [],  // погибшие местные (реестр Ксилоны)
      shelterPeople: 0,    // сколько местных переселили в кольца корабля
      supplyFailed: false, // снабжение сорвано: ни один план не держит людей
      koraAwake: 2,        // лет бодрствования Коры Ландис
      target: null,        // имя системы в каталоге (ship-builder/data/stars.js)
      beta: 0.1,           // крейсерская скорость по паспорту, c
      reserveDv: 0.01,     // резерв манёвров по паспорту, c (= 100%)
      kits: [],            // комплекты груза
      arrive: 133,         // год прибытия
      materials: 100,      // материалы для высадки, % запаса
      scout: 0,            // год запуска зонда вперёд (0 — не запущен)
      scoutTuned: false,   // программа спектрометра зонда — Коры
      watch: 48,           // людей на вахте в дрейфе
      ageShift: 0,         // на сколько лет старше экипаж придёт к цели
      agroAtRisk: false,   // решение затронуло монтаж резервного агромодуля
      taught: false,       // Кору будили в дрейфе учить интерпретаторов
      highPower: true,     // резерв повышенной мощности в контуре охлаждения
      groupB: 'ok',        // группа Б: ok | saved | woken
      worldSeen: null,     // что известно о мире цели до прибытия
      lost: 0,             // погибли в пути (медицинский журнал)
      dead: 0,             // из них — в авариях Акта III
      koraLast: false,     // Кору будили в последний раз
      home: null,          // где будет дом: land | orbit | domes | moons | beacon | return
      settle: null,        // окончательно: surface | keep | orbit
      deadHere: 0,         // погибли у цели
      support: null,       // корабль поддержки: found — нашли и он придёт; lost — потерян
      streamHit: 0,        // удар потока у Тёмной звезды: 0 — ушли, 1–2 — потери, 3 — гибель корабля
      lostShip: false,     // экспедиция погибла
      terminalAt: null,    // рейс окончен состоянием корабля (износ, шаг 3d): дата
      terminalReason: null,   // и причина: heat — ядро без отвода тепла
      overload: null,      // перегрузка жизнеобеспечения в дрейфе: sleep | materials | hold
      dutchman: false,     // «Летучий голландец»: некому обслуживать капсулы
      winterDead: 0,       // погибли в первую зиму у цели
      outcome: null,       // исход партии
      mission: null,       // contact | supply | rescue
      rescued: 0,          // спасённые Оттепели (живы после операции)
      crew: 500,           // своих в экспедиции: 460 со спасательным сектором
      arriveExact: null,   // точное прибытие, годы (срок Оттепели считается по нему)
      rescuePrep: false,   // переходники к складу собраны в пути
      rescueShelter: false, // жилой модуль на сорок у цели
      rescueOp: null,      // move | restore | wake (старые: gradual)
      housed: false,       // у спасённых есть постоянные места
      thawDead: 0,         // Оттепель: умерли из 34 живых на год 124,5
      rescueEvidence: false, // спасатель v3: два отчёта Оттепели приложены к паспорту
      rescuePromise: null, // обязательство: { eta — паспортное прибытие, places — sector | housing }
      tornLeft: null,      // сутки секции после разрыва линии
      rescueIsolation: false, // аварийная изоляция испытана в полёте (независимый контур за 8 суток)
      brakeMethod: null,   // wait | burn | measure — торможение в разреженной среде
      brakeFound: false,   // передовые данные показали протяжённый участок
      brakeDelay: 0,       // сутки опоздания из-за разрежения
      arrivePlan: null,    // точное прибытие по паспорту (до поправки торможения)
      rescueDays: 0,       // сутки у склада от прибытия
      sectionEnd: null,    // год, когда протекающая секция останется без тепла
      sectionLeft: null,   // сутки секции на момент диагностики
      sectionSafe: false,  // секция на независимом контуре
      dockMethod: null,    // grab | inspect
      dockFound: false,    // осмотр нашёл надлом крепления
      pipeTorn: false,     // крепление разрушилось и сорвало трубопровод секции
      connect: null,       // isolate | direct | cut | proceed
      thawConfirmed: 0,    // живы по ближней диагностике
      thawDeadIds: [],     // реестр Оттепели: дополнительно погибшие (номера 6–39)
      thawStable: false,   // операция закончена: капсулы больше не стареют
      rescueCrewDead: 0,   // погибли из экипажа у склада и на площадке
      siteMethod: null,    // reuse | check | deep | closed | orbit | stay — дом после выброса
      siteFound: false,    // испытание нашло примесь
      site: null,          // old | closed | orbit | evacuated | null (не выбрано)
      siteDays: 0,         // сутки подготовки площадки
      thawPlace: null,     // где спасённые сейчас: sector | module | store | infirmary | old | closed | orbit
      infirmaryUntil: null, // срок лазарета (три года от приёма)
      deliver: null,       // снабженец: relay | capsules | both
      sos: null,           // спать и звать помощь: drift | stream | home
      approach: null,      // снабженец: монтаж под вспышками — protect | wait | block
      gridBlocks: 2,       // независимых блоков корабельной сети
      relayOK: false, capsOK: false, shelter: false,   // снабженец: что работает у форпоста
      outpostDead: 0,      // погибли люди форпоста (входят в deadHere, но не в живых сорок первой)
      eq: null,            // оснащение: вариант по каждой из восьми позиций (mission.js: EQUIP)
      tMag: null,          // лет работы плазменного магнита (null — прежний профиль: 20 лет торможения)
      brakeMass: null,     // масса к началу торможения, тыс. т
      shieldFixed: false,  // пробитый сектор щита заменён запасным
      blueprint: null,     // капельный радиатор по чертежу Кольца: built | archived
      incident: null,      // авария с живыми — для партии спасателей
      earlyNews: null,     // пакет наблюдений Кольца года 3: { family, change, objects, from, received }
      earlyCouncil: null,  // решение совета «Новые сведения»: { at, family, choice: turn | stay, from, to, dvKms }
      route: null,         // излом траектории после поворота: { knee: { at, x, from }, D — длина пути }
      wearOn: !(ctx && ctx.wear === false), // модель износа (правила 5); ctx.wear: false — без неё (сравнение в калибровке)
      wear: null,          // граф корабля, люди по местам, операции (wear.js)
      wearPolicy: null,    // ответ на первый отказ контура: replace — менять насос из запаса, reroute — беречь запас
      taskHistory: [],     // снятые с программы задания
      choices: {}
    };
    startBooks(st);                                                     // журнал запасов и людей, ревизии маршрута
    return st;
  }

  // ---------------------------------------------------------------- задание заявки: итог исследовательской работы
  // search32 — источник локализован и журнал принят (диск у Тёмной звезды); contactColony — связь с поселением состоялась;
  // trace — район последней орбиты обследован (корпус найден или нет — по сиду; проверка следа и есть задание);
  // survey — первичная съёмка, «пригодного мира нет» — тоже результат
  function taskResult(s) {
    const w = s.task && s.task.work;
    if (w === 'search32') return { done: !!s.sourceFound, found: null };
    if (w === 'contactColony') return { done: !!s.colonyLink, found: null };
    if (w === 'trace') return { done: true, found: (hidden(s, 'task.e24.hull') ?? 0) < 0.7 };
    return { done: true, found: null };
  }
  const TASK_NAME = { search32: ['поиск тридцать второй', 'the search for the Thirty-Second'], contactColony: ['связь с Перевалом', 'the link with the Pass'],
    trace: ['след двадцать четвёртой', "No. 24's trace"], survey: ['обследование системы', 'the system survey'] };
  // «связь с Перевалом», «связь с Садом»… — по колонии у звезды задания
  const taskName = (task, lang) => { const L = task.work === 'contactColony' && R.linkByStar(task.star), k = lang === 'ru' ? 0 : 1;
    return L ? (lang === 'ru' ? `связь ${L.with[0]}` : `the link ${L.with[1]}`) : TASK_NAME[task.work][k]; };
  const SURVEY_WORLD = {
    open: ['Мир у звезды пригоден для жизни — после проверки на месте.', 'The world at the star is fit to live on — once checked on site.'],
    dome: ['Жить можно только под куполами.', 'Life is possible only under domes.'],
    hostile: ['Высадки не будет: база — только на орбите.', 'There will be no landing: a base can only be in orbit.'],
    ruined: ['Высадки не будет: база — только на орбите.', 'There will be no landing: a base can only be in orbit.'],
    none: ['Пригодного мира нет — это тоже результат программы.', 'There is no habitable world — that is a result of the programme too.']
  };
  function taskReportText(s, lang) {
    const ru = lang === 'ru', k = ru ? 0 : 1, T = s.task, L = Math.max(1, Math.round(lag(s, s.year)));
    const way = ru ? ` До Земли отчёт идёт ${yrs(L)}.` : ` The report takes ${yrsEn(L)} to reach Earth.`;
    if (T.work === 'search32') return (T.done
      ? (ru ? 'Отчёт уходит на Землю. Источник сигнала локализован у Тёмной звезды; журнал тридцать второй принят полностью и приложен. Задание Совета выполнено.'
        : "The report goes out to Earth. The signal source is located at the Dark Star; the Thirty-Second's log is received in full and attached. The Council's task is done.")
      : (ru ? 'Отчёт уходит на Землю. Источник сигнала не локализован; следа тридцать второй нет. Задание Совета не выполнено.'
        : "The report goes out to Earth. The signal source has not been located; there is no trace of the Thirty-Second. The Council's task is not done.")) + way;
    if (T.work === 'contactColony') { const LK = R.linkByStar(T.star) || R.linkOf(R.get('req:contact:pass')), cap1 = x => x.replace(/^./, c => c.toUpperCase());
      return (T.done
        ? (ru ? `Отчёт уходит на Землю. Связь ${LK.with[0]} двусторонняя; ${LK.what[0]} сверены, расхождения отмечены. Задание ${LK.svcG[0]} выполнено.`
          : `The report goes out to Earth. The link ${LK.with[1]} is two-way; ${LK.what[1]} are reconciled, the discrepancies marked. ${cap1(LK.svcG[1])} task is done.`)
        : (ru ? `${LK.nom[0]} не отвечает на вызовы. Протокол вызовов и снимки поселения уходят на Землю; задание ${LK.svcG[0]} не выполнено.`
          : `${LK.nom[1]} does not answer the calls. The call log and images of the settlement go out to Earth; ${LK.svcG[1]} task is not done.`)) + way; }
    if (T.work === 'trace') return (T.found
      ? (ru ? 'Протокол поиска уходит на Землю. В районе последней орбиты — корпус двадцать четвёртой: питания нет, автоматика молчит, людей на борту нет — как она и сообщала. Журнал снят через внешний порт. Задание архивной комиссии выполнено.'
        : "The search report goes out to Earth. In the region of the last orbit lies No. 24's hull: no power, the automation silent, nobody aboard — just as it reported. The log was read through the outer port. The archive commission's task is done.")
      : (ru ? 'Протокол поиска уходит на Землю. В расчётном районе корпуса нет: за полвека орбиту могло увести. В протоколе — карта просмотренных орбит и пределы обнаружения. Задание архивной комиссии выполнено: след проверен.'
        : "The search report goes out to Earth. There is no hull in the predicted region: in half a century the orbit may have drifted. The report holds a map of the orbits searched and the detection limits. The archive commission's task is done: the trace has been checked.")) + way;
    const w = s.worldSeen || M.worldOf(s.target);
    return (ru ? `Первичная съёмка закончена, измерения уходят на Землю: среда системы, массы и орбиты известных тел, условия для базы. ${SURVEY_WORLD[w][0]} Задание научной программы выполнено.`
      : `The first survey is finished and the measurements go out to Earth: the system's environment, the masses and orbits of the known bodies, the conditions for a base. ${SURVEY_WORLD[w][1]} The science programme's task is done.`) + way;
  }
  // выполнено ли обязательство заявки — одно правило для эпилога и калибровки
  function missionComplete(s) {
    if (s.mission === 'supply') return ['delivered', 'sheltered'].includes(s.outcome);
    if (s.mission === 'rescue') return !!s.housed || s.outcome === 'housed';
    return !!(s.task && s.task.done && s.task.reportAt != null);
  }

  // ---------------------------------------------------------------- совет «Новые сведения» (ранний поворот, год 3)
  // DOC «Повороты по обстановке Кольца», «Ревью Codex — ранний срез поворотов» (C), «Ревью Codex — заявки из мира» (шаг 6).
  // Курс меняют сведения Кольца, а не напоминания: к году 3 приходит пакет наблюдений (на Земле обработан на году 2,5,
  // отправлен на 2,75, корабль ещё у Солнца) — изменился сигнал источника либо уточнены миры у звёзд исследовательских
  // заявок. Совет — только если есть физически доступный поворот к звезде другой исследовательской заявки повестки;
  // иначе — только запись. Снабжение и спасение адресны: им пакет не меняет курса. Один совет за рейс, «держать курс» —
  // всегда, без штрафа. Поворот — импульс: модуль скорости сохраняется, Δv = 2v·sin(θ/2) — из резерва манёвров, с
  // запасом на увод ступени; разгон продолжается к новой цели; траектория — с изломом в точке поворота
  const NEWS = { at: 3, earth: 2.5, sent: 2.75, none: 0.35, signal: 0.5 };
  const CKMS = 299792.458;
  const unitOf = n => { const st = M.star(n); return [st.x / st.d, st.y / st.d, st.z / st.d]; };
  const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  // план пакета: есть ли сведения и какие — скрытый факт партии; объекты — звёзды исследовательских заявок повестки
  // (текущая цель и до двух ближайших по направлению)
  // события Кольца — факты мира: при одном мире у разных кораблей одна и та же новость (ревью Codex, шаг 6)
  const worldU = (s, key) => s.worldSeed ? hashU32(JSON.stringify(['world', s.worldSeed, key])) / 4294967296 : hidden(s, key);
  // дата приёма пакета кораблём: свет, ушедший на году NEWS.sent, догоняет корабль — t = sent + путь(t) (c = 1 св. год/год)
  function newsReceived(s) {
    let lo = NEWS.sent, hi = NEWS.at;
    for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (m - NEWS.sent < M.distLy(m, s.beta)) lo = m; else hi = m; }
    return (lo + hi) / 2;
  }
  function newsPlan(s) {
    if (s.mission !== 'contact' || !s.target) return null;
    const u = worldU(s, 'ring.early.family');
    if (u == null || u < NEWS.none) return null;
    const family = u < NEWS.signal ? 'signal' : 'world', u0 = unitOf(s.target);
    const others = agendaOf(s).map(id => R.get(id)).filter(q => q && q.branch === 'contact' && q.star !== s.target)
      .sort((a, b) => dot3(unitOf(b.star), u0) - dot3(unitOf(a.star), u0) || (a.star < b.star ? -1 : 1));
    const objects = family === 'signal' ? [M.SOURCE] : [s.target].concat(others.slice(0, 2).map(q => q.star));
    // наблюдения фиксируются в пакете при получении: карточка и решения читают пакет, а не истинный мир
    const observed = family === 'world' ? Object.fromEntries(objects.map(n => [n, M.worldOf(n)])) : {};
    return { family, change: (worldU(s, 'ring.early.signal') ?? 0.5) < 0.5 ? 'pattern' : 'stopped', objects, observed, from: s.target, received: newsReceived(s) };
  }
  // расчёт поворота к звезде заявки q на году NEWS.at; null — недоступен (резерв, увод ступени, срок, бодрствование)
  function earlyTurnQuote(s, q) {
    if (!q || !s.target || q.star === s.target || !s.reserveDv) return null;
    const t = NEWS.at, v = s.beta * t / M.ACC, x = M.distLy(t, s.beta), u0 = unitOf(s.target), to = M.star(q.star);
    const P = u0.map(k => k * x), w = [to.x - P[0], to.y - P[1], to.z - P[2]], L = Math.hypot(...w), u1 = w.map(k => k / L);
    const th = Math.acos(Math.max(-1, Math.min(1, dot3(u0, u1)))), dv = 2 * v * Math.sin(th / 2), D = x + L;
    let pf; try { pf = M.flightProfile(D, s.beta, s.tMag); } catch (e) { return null; }
    const A = pf.arrive, sy = M.brakeStart(A, s.tMag) + M.brakeDist(s.beta, s.tMag) / s.beta - M.ACC;   // ступень до прохода новой цели
    const stage = M.divert(sy, s.reserveDv).dv / CKMS, R0 = s.reserveDv * s.reserve / 100;
    if (dv + stage > R0 + 1e-12 || A > M.REACH || M.awake(A, 48, crewOf(s)) > 25) return null;
    const A0 = s.arriveExact != null ? s.arriveExact : s.arrive;
    return { req: q.id, to: q.star, angle: th * 180 / Math.PI, dv, dvKms: dv * CKMS, stageKms: stage * CKMS, reserveBefore: R0 * CKMS,
      reserveAfter: (R0 - dv) * CKMS, reservePct: 100 * dv / s.reserveDv, arriveExact: A, arrive: Math.round(A), delta: A - A0,
      awakeDelta: s.watch * (A - A0) / crewOf(s), x, D };
  }
  const newsCandidates = s => !s.earlyNews || s.earlyCouncil ? [] : (s.earlyNews.family === 'signal' ? [M.SOURCE] : s.earlyNews.objects.slice(1))
    .map(n => agendaOf(s).map(id => R.get(id)).find(q => q && q.branch === 'contact' && q.star === n)).filter(Boolean)
    .map(q => earlyTurnQuote(s, q)).filter(Boolean).sort((a, b) => a.dv - b.dv || a.arriveExact - b.arriveExact || (a.to < b.to ? -1 : 1)).slice(0, 2);
  // что сообщает пакет о мире звезды: только опубликованные признаки (класс мира — истина, текст — наблюдение)
  const NEWS_WORLD = {
    open: ['планета подтверждена; признаки воды и атмосферы; пригодность для дыхания не подтверждена', 'the planet is confirmed; signs of water and an atmosphere; breathability unconfirmed'],
    dome: ['сильные различия условий на поверхности; есть район для закрытого поселения', 'strong contrasts across the surface; there is a region worth checking for a closed settlement'],
    hostile: ['экстремальные условия на поверхности; работы возможны только с орбиты', 'extreme surface conditions; work is possible only from orbit'],
    ruined: ['разрушенная поверхность и обломки', 'a shattered surface and debris'],
    none: ['пригодный мир не подтверждён', 'no habitable world is confirmed']
  };
  const nameAt = (n, lang) => lang === 'ru' ? nmG({ target: n }) : M.nameOf(n, 'en');
  function newsText(s, lang) {
    const ru = lang === 'ru', N = s.earlyNews, f2 = y => nf(y, 2, lang), recv = f2(N.received);
    const dates = n => { const ep = Math.round(NEWS.earth - M.star(n).d), y = `${ep < 0 ? '−' : ''}${Math.abs(ep)}`;
      return ru ? `наблюдаемое состояние — год ${y}` : `the state observed is that of year ${y}`; };
    const head = ru ? `Служба наблюдений Кольца обработала данные на году ${f2(NEWS.earth)} и отправила пакет на году ${f2(NEWS.sent)}; на борту он принят на году ${recv}.`
      : `The Ring's observation service processed the data in year ${f2(NEWS.earth)} and sent the packet in year ${f2(NEWS.sent)}; it reached us in year ${recv}.`;
    let body;
    if (N.family === 'signal') body = ru ? `Источник в направлении ε Индейца: ${N.change === 'pattern' ? 'повторяющаяся последовательность изменилась' : 'прежняя последовательность прекратилась'} (${dates(M.SOURCE)}). Причина неизвестна; о людях пакет ничего не сообщает.`
      : `The source in the direction of ε Indi: ${N.change === 'pattern' ? 'the repeating sequence has changed' : 'the old sequence has stopped'} (${dates(M.SOURCE)}). The cause is unknown; the packet says nothing about people.`;
    else body = N.objects.map(n => ru ? `У ${nameAt(n, 'ru')}: ${NEWS_WORLD[N.observed[n]][0]} (${dates(n)}).` : `At ${nameAt(n, 'en')}: ${NEWS_WORLD[N.observed[n]][1]} (${dates(n)}).`).join(' ')
      + (ru ? ' Это состояние прошлых лет, а не нынешняя обстановка у звёзд.' : " These are past years' conditions, not the stars' present situation.");
    const cand = newsCandidates(s), tail = cand.length ? (ru ? ' Ирсон пересчитал доступные маршруты по оставшемуся резерву: вопрос — на совет.' : ' Irson has recalculated the available routes on the remaining reserve: the question goes to the council.')
      : (ru ? ' Ирсон пересчитал маршруты по оставшемуся резерву: доступной смены курса до отделения ступени нет.' : ' Irson has recalculated the routes on the remaining reserve: no course change is available before stage separation.');
    return `${head}\n\n${body}${tail}`;
  }
  const taskLabel = (q, lang) => { const T = R.TEXT[q.id], X = RESEARCH[q.id]; return T ? T.label[lang] : X ? X.label[lang] : q.id; };
  function turnOption(qt) {
    const q = R.get(qt.req), id = `accept:${q.id}`, fk = (x, lang) => nf(x, 0, lang);
    const yd = (d, lang) => `${d >= 0 ? '+' : '−'}${nf(Math.abs(d), 1, lang).replace(/[.,]0$/, '')}`;
    return { id,
      label: { ru: s => `Повернуть — ${taskLabel(q, 'ru')}`, en: s => `Turn — ${taskLabel(q, 'en')}` },
      known: {
        ru: s => [`Новое задание — ${taskLabel(q, 'ru')}; прежнее будет снято с программы.`,
          `Поворот на ${nf(qt.angle, 1, 'ru')}° при ${nf(s.beta * NEWS.at / M.ACC, 3, 'ru')}c: Δv ${fk(qt.dvKms, 'ru')} км/с.`,
          `Резерв манёвров: ${fk(qt.reserveBefore, 'ru')} → ${fk(qt.reserveAfter, 'ru')} км/с; из остатка ${fk(qt.stageKms, 'ru')} км/с — на увод ступени.`,
          `Прибытие — около года ${qt.arrive} (${yd(qt.delta, 'ru')} г.); бодрствование при вахте ${s.watch} — ${yd(qt.awakeDelta, 'ru')} г. на человека.`],
        en: s => [`New task — ${taskLabel(q, 'en')}; the old one comes off the programme.`,
          `A ${nf(qt.angle, 1, 'en')}° turn at ${nf(s.beta * NEWS.at / M.ACC, 3, 'en')}c: Δv ${fk(qt.dvKms, 'en')} km/s.`,
          `Manoeuvre reserve: ${fk(qt.reserveBefore, 'en')} → ${fk(qt.reserveAfter, 'en')} km/s; ${fk(qt.stageKms, 'en')} km/s of the rest goes to clearing the stage.`,
          `Arrival around year ${qt.arrive} (${yd(qt.delta, 'en')} yr); waking time at a watch of ${s.watch} — ${yd(qt.awakeDelta, 'en')} yr per person.`]
      },
      cost: st => { st.reserve -= qt.reservePct; },                      // «После»: только публичная цена манёвра
      effect: st => {
        const t2 = earlyTurnQuote(st, q); if (!t2) return;               // повторная проверка на полном состоянии
        const from = st.target;
        st.reserve -= t2.reservePct;
        (st.taskHistory = st.taskHistory || []).push(Object.assign({}, st.task, { status: 'abandoned', at: st.year }));
        st.requestId = q.id; st.target = q.star; st.task = { work: q.work, star: q.star, done: false, found: null, reportAt: null };
        st.arriveExact = t2.arriveExact; st.arrive = t2.arrive;
        st.route = { knee: { at: st.year, x: t2.x, from }, D: t2.D };
        st.earlyCouncil = { at: st.year, family: st.earlyNews.family, choice: 'turn', from, to: q.star, dvKms: t2.dvKms };
      },
      record: {
        ru: s => `Совет меняет курс: с ${nameAt(s.earlyCouncil ? s.earlyCouncil.from : q.star, 'ru')} на ${nameAt(q.star, 'ru')}. Ирсон заносит расход ${fk(qt.dvKms, 'ru')} км/с и новое прибытие — около года ${s.arrive}. Прежнее задание снято с программы; принято: ${taskLabel(q, 'ru')}. Уведомление уходит на Землю.`,
        en: s => `The council changes course: from ${M.nameOf(s.earlyCouncil ? s.earlyCouncil.from : q.star, 'en')} to ${M.nameOf(q.star, 'en')}. Irson enters ${fk(qt.dvKms, 'en')} km/s spent and the new arrival — around year ${s.arrive}. The old task comes off the programme; accepted: ${taskLabel(q, 'en')}. A notice goes out to Earth.`
      } };
  }
  const stayOption = {
    id: 'stay',
    label: { ru: s => `Держать курс на ${nameAt(s.target, 'ru')}`, en: s => `Hold the course for ${M.nameOf(s.target, 'en')}` },
    known: {
      ru: s => [`Задание прежнее — ${reqOf(s) ? taskLabel(reqOf(s), 'ru') : '—'}; прибытие — около года ${s.arrive}.`, 'Резерв манёвров сохраняется. Сведения остаются в программе наблюдений.'],
      en: s => [`The task stays — ${reqOf(s) ? taskLabel(reqOf(s), 'en') : '—'}; arrival around year ${s.arrive}.`, 'The manoeuvre reserve is kept. The information stays in the observation programme.']
    },
    effect: st => { st.earlyCouncil = { at: st.year, family: st.earlyNews.family, choice: 'stay', from: st.target, to: st.target }; },
    record: {
      ru: s => `Совет сохраняет курс на ${nameAt(s.target, 'ru')} и задание. Пакет приложен к решению; манёвра нет.`,
      en: s => `The council keeps the course for ${M.nameOf(s.target, 'en')} and the task. The packet is attached to the decision; no manoeuvre.`
    }
  };

  // ---------------------------------------------------------------- голосование Совета по заявкам
  // DOC «Повороты по обстановке Кольца» (заявки из мира) и «Ревью Codex — заявки из мира». Вариант голосования — заявка
  // повестки (requests.js): она задаёт ветку сюжета, звезду и работу. Отдельного выбора звезды нет; карта — обзор.
  // MISSION_BASE — тексты веток (контакт, снабжение, спасение); у исследовательских заявок — своё «за что» и курс Орина
  const MISSION_BASE = [
          {
            id: 'contact',
            label: { ru: 'Исследование и контакт', en: 'Research and contact' },
            known: {
              ru: ['Звезду выбирает экспедиция — любую достижимую; задание уточнят по сведениям о системе: поиск тридцать второй и источника сигнала, обследование системы или прямая связь с поселением.', 'Форпосту Ксилона Ир обещают специалиста через четыре года — передатчик к тому времени может замолчать.'],
              en: ['The expedition chooses the star — any it can reach; the task is set from what is known of the system: searching for the Thirty-Second and the signal source, surveying the system, or a direct link with a settlement.', 'Xylona Ir is promised a specialist in four years — its transmitter may be silent by then.']
            },
            effect: st => { st.mission = 'contact'; },
            record: {
              ru: `Совет утверждает исследовательскую экспедицию. Форпосту обещают специалиста в следующем цикле, через четыре года. Дассер знает, что это значит для передатчика, и записывает результат. Карту Ксилона Ир он пока не убирает.
  
  — Я поведу эту экспедицию.
  
  Кассель не спешит записывать его имя.
  
  — Вы голосовали за форпост.
  
  — Голосовал.
  
  — Тогда я — штурман, — говорит Орин. — Выберем, куда и за чем лететь.`,
              en: `The Council approves a research expedition. The outpost is promised a specialist next cycle, in four years. Dasser knows what that means for the transmitter, and records the result. He doesn't put the Xylona Ir chart away yet.
  
  "I'll lead this expedition."
  
  Kassel doesn't hurry to note his name.
  
  "You voted for the outpost."
  
  "I did."
  
  "Then I'm navigator," says Orin. "Now we choose where to go, and what for."`
            }
          },
          {
            id: 'supply',
            label: { ru: 'Форпост Ксилона Ир: связь и запчасти', en: 'Xylona Ir outpost: the link and spares' },
            known: {
              ru: ['Звезда Барнарда, 6 св. лет — ближе всех. Специалист дальней связи, передатчик, запас для капсул.', 'Исследование сектора сигнала ждёт следующей экспедиции.'],
              en: ["Barnard's Star, 6 ly — the nearest. A deep-relay specialist, a transmitter, capsule spares.", 'Research in the signal sector waits for the next expedition.']
            },
            effect: st => { st.mission = 'supply'; },
            record: {
              ru: `Совет голосует за форпост. Исследование Орина обещают следующей экспедиции.
  
  — Я поведу, — говорит Дассер.
  
  Орин молча переносит координаты сигнала в свой журнал.
  
  — Тогда я — штурман. Сигнал подождёт; передатчик — нет.`,
              en: `The Council votes for the outpost. Orin's research is promised to the next expedition.
  
  "I'll lead," says Dasser.
  
  Orin silently copies the signal's coordinates into his log.
  
  "Then I'm navigator. The signal can wait; the transmitter can't."`
            }
          },
          {
            id: 'rescue',
            label: { ru: 'Оттепель: сорок спящих', en: 'Thaw: forty sleepers' },
            known: {
              ru: [`Росс 128, 11 св. лет. Капсулы держат до года ${thawDeadline()}: успеть можно только на 0,1c — с запасом в месяцы.`, 'На 0,1c почти нет места для груза. Сорок мест для спасённых — это сорок своих, оставшихся на Земле.'],
              en: [`Ross 128, 11 ly. The capsules hold until year ${thawDeadline()}: only 0.1c gets there in time — with a margin of months.`, 'At 0.1c there is almost no room for cargo. Forty berths for the rescued mean forty of our own staying on Earth.']
            },
            effect: st => { st.mission = 'rescue'; },
            record: {
              ru: `Совет голосует за Оттепель. Кассель записывает срок: год ${thawDeadline()}.
  
  — Я поведу, — говорит Дассер.
  
  — Тогда я — штурман, — говорит Орин. — И считать будем каждый день.`,
              en: `The Council votes for Thaw. Kassel writes down the deadline: year ${thawDeadline()}.
  
  "I'll lead," says Dasser.
  
  "Then I'm navigator," says Orin. "And we'll count every day."`
            }
          }
        ];
  // повестка — снимок на старт экспедиции (ctx.agenda: мир после финала меняется, повтор партии — нет); без снимка — первая
  const agendaOf = s => { const a = s && Array.isArray(s.agenda) ? s.agenda.filter(id => R.get(id)) : null; return a && a.length ? a : R.agenda(null); };
  const reqOf = s => s.requestId ? R.get(s.requestId) : null;
  const RESEARCH = {
    'req:search32:e32': {
      label: { ru: 'ε Индейца: след тридцать второй и источник сигнала', en: "ε Indi: the Thirty-Second's trace and the signal source" },
      task: { ru: 'Совет: найти след тридцать второй и источник сигнала, передать записи Кольцу. Путь — по заявленному маршруту тридцать второй.', en: "The Council: find the Thirty-Second's trace and the signal source, and transmit the records to the Ring. The road follows the Thirty-Second's filed route." },
      vote: { ru: 'Совет голосует за поиск тридцать второй у ε Индейца.', en: 'The Council votes for the search for the Thirty-Second at ε Indi.' },
      course: { ru: '— Тогда я — штурман, — говорит Орин. — Пойдём дорогой тридцать второй. Если они оставили след, он на ней.', en: '"Then I\'m navigator," says Orin. "We take the Thirty-Second\'s road. If they left a trace, it\'s on it."' }
    },
    'req:contact:pass': {
      vote: { ru: 'Совет голосует за заявку службы навигации — Перевал.', en: "The Council votes for the navigation service's request — the Pass." },
      course: { ru: '— Тогда я — штурман, — говорит Орин. — Курс на Лакайль 9352. Их лоции пригодятся нам раньше, чем им — наши.', en: '"Then I\'m navigator," says Orin. "Course for Lacaille 9352. We\'ll need their charts sooner than they need ours."' }
    },
    'req:trace:e24': {
      vote: { ru: 'Совет голосует за заявку архивной комиссии — след двадцать четвёртой.', en: "The Council votes for the archive commission's request — No. 24's trace." },
      course: { ru: '— Тогда я — штурман, — говорит Орин. — Курс на 61 Лебедя. Их автоматика довела корабль без людей — посмотрим, что она видела.', en: '"Then I\'m navigator," says Orin. "Course for 61 Cygni. Their automation brought the ship in with nobody aboard — let\'s see what it saw."' }
    },
    'req:survey:gl338': {
      vote: { ru: 'Совет голосует за заявку научной программы — Gl 338.', en: "The Council votes for the science programme's request — Gl 338." },
      course: { ru: '— Тогда я — штурман, — говорит Орин. — Курс на Gl 338. Дальше всех — значит, считать точнее всех.', en: '"Then I\'m navigator," says Orin. "Course for Gl 338. Farthest of all — so we count more carefully than anyone."' }
    }
  };
  const COURSE = {
    supply: { ru: 'Орин прокладывает курс на звезду Барнарда — к форпосту Ксилона Ир.', en: "Orin lays in the course for Barnard's Star, for the Xylona Ir outpost." },
    rescue: { ru: 'Орин прокладывает курс на Росс 128 — к складу Оттепели.', en: "Orin lays in the course for Ross 128, for Thaw's store." }
  };
  const swap = (text, a, b) => { if (!text.includes(a)) throw new Error(`Нет текста для замены: ${a}`); return text.replace(a, b); };
  function requestOption(id) {
    const q = R.get(id), base = MISSION_BASE.find(o => o.id === q.branch), T = R.TEXT[id], L = R.linkOf(q);
    const X = RESEARCH[id] || (L && L.vote ? { vote: { ru: L.vote[0], en: L.vote[1] }, course: { ru: L.course[0], en: L.course[1] } } : null);
    const effect = st => { st.requestId = q.id; st.mission = q.branch; st.target = q.star; st.arrive = Math.round(M.trip(M.star(q.star).d, st.beta, M.stdMag(st.beta)));
      st.task = { work: q.work, star: q.star, done: false, found: null, reportAt: null }; };   // задание заявки; итог — в отчёте у цели
    if (q.branch !== 'contact') return Object.assign({}, base, { id, effect,
      record: { ru: `${base.record.ru}\n\n${COURSE[q.branch].ru}`, en: `${base.record.en}\n\n${COURSE[q.branch].en}` } });
    const lines = lang => (T ? T.known(q, lang) : [R.roadLine(q, lang), X.task[lang]]).concat(base.known[lang].slice(-1));   // последняя строка — цена для Ксилоны
    return { id, effect, label: T ? T.label : X.label, known: { ru: () => lines('ru'), en: () => lines('en') },
      record: {
        ru: swap(swap(base.record.ru, 'Совет утверждает исследовательскую экспедицию.', X.vote.ru), '— Тогда я — штурман, — говорит Орин. — Выберем, куда и за чем лететь.', X.course.ru),
        en: swap(swap(base.record.en, 'The Council approves a research expedition.', X.vote.en), '"Then I\'m navigator," says Orin. "Now we choose where to go, and what for."', X.course.en)
      } };
  }
  // стенограмма Совета — по повестке: кто какую заявку докладывает
  const NUMW = { ru: ['', '', 'две', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять', 'десять'], en: ['', '', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'] };
  function councilText(s, lang) {
    const A = agendaOf(s), n = A.length, ru = lang === 'ru', has = id => A.includes(id), W = id => R.TEXT[id].council[lang];
    const N = ru ? NUMW.ru[n] : NUMW.en[n].replace(/^./, c => c.toUpperCase());
    const out = [ru ? `— Заявок ${N}, экспедиция одна, — говорит Ирина Кассель. — Решаем, какую берёт сорок первая: заявка задаёт и звезду, и работу. Паспорт утвердим потом.`
        : `"${N} requests, one expedition," says Irina Kassel. "We decide which one the Forty-First takes on: a request sets both the star and the work. The passport comes after."`,
      ru ? `На общей карте ${N} ${plural(n, ['отметка', 'отметки', 'отметок'])}. Ни одна ещё не соединена с Землёй линией курса.` : `${N} markers stand on the shared chart. None is yet joined to Earth by a course line.`];
    if (has('req:supply:xylona')) out.push(ru ? 'Нил Дассер касается первой.' : 'Nil Dasser touches the first.',
      ru ? '— Ксилона Ир, звезда Барнарда. Передатчик слабеет: ещё десять лет без специалиста дальней связи — и форпост перестанет слышать Кольцо. Им нужны специалист, детали передатчика и запас для капсул.'
        : '"Xylona Ir, Barnard\'s Star. Its transmitter is failing: ten more years without a deep-relay specialist and the outpost stops hearing the Ring. They need a specialist, transmitter parts and capsule spares."');
    if (has('req:rescue:thaw')) out.push(ru ? 'Ива Лорн касается второй.' : 'Iva Lorn touches the second.',
      ru ? '— Оттепель, Росс 128. База погибла, сорок человек ушли в капсулы на орбитальный склад. Капсулы держат сто пятьдесят лет; двадцать пять уже прошло. Сколько из сорока живы, мы не знаем.'
        : '"Thaw, Ross 128. The base is dead; forty people went into capsules at the orbital store. The capsules hold a hundred and fifty years; twenty-five have passed. How many of the forty are alive, we don\'t know."');
    const extra = ['req:trace:e24', 'req:survey:gl338'].filter(has).map(W).join(' ');
    out.push(ru ? 'Орин Дал увеличивает участок карты с сектором сигнала.' : 'Orin Dal enlarges the region of the chart with the signal sector.',
      ru ? `— Исследование. Тридцать вторая шла к ε Индейца; её последняя передача оборвана, а из того же сектора идёт сигнал, которого нет в каталогах Кольца. Это моя первая кандидатура.${extra ? ' ' + extra : ''}`
        : `"Research. The Thirty-Second was bound for ε Indi; its last transmission broke off, and from the same sector comes a signal that is in none of the Ring's catalogues. That is my first candidate.${extra ? ' ' + extra : ''}"`);
    // заявки колоний — одной репликой Кассель: Перевал (служба навигации), затем остальные (Ближний берег, Верфь, Сад)
    const cols = A.filter(id => id !== 'req:contact:pass' && R.get(id).work === 'contactColony'), cn = cols.length, items = cols.map(W).join(' ');
    const more = cn ? (ru ? (cn === 1 ? 'Ещё одна заявка — от колонии. ' : `Ещё ${NUMW.ru[cn]} — от колоний. `) : (cn === 1 ? 'One more, from a colony. ' : `${NUMW.en[cn].replace(/^./, c => c.toUpperCase())} more, from the colonies. `)) + items : '';
    if (has('req:contact:pass')) out.push(!cn ? W('req:contact:pass') : ru ? `${W('req:contact:pass')} ${more}` : `${W('req:contact:pass').replace(/"$/, '')} ${more}"`);
    else if (cn) out.push(ru ? `— ${cn === 1 ? 'И ещё одна заявка — от колонии' : `И ещё ${NUMW.ru[cn]} — от колоний`}, — говорит Кассель. — ${items}`
      : `"${cn === 1 ? 'And one more, from a colony' : `And ${NUMW.en[cn]} more, from the colonies`}," says Kassel. "${items}"`);
    out.push(ru ? '— Остальные заявки останутся в очереди, — говорит Кассель. — Голосуем.' : '"The other requests stay in the queue," says Kassel. "We vote."');
    return out.join('\n\n');
  }

  const beats = [];                                                     // сцены — в story/*.js по актам; собираются перед экспортом

  const ui = {
    ru: {
      title: 'М31 · Срез: от пролога до эпилога',
      archive: 'Бортовой архив', year: 'Год', note: 'Личная запись', transcript: 'Стенограмма',
      bulletin: 'Кольцо', instrument: 'Приборная запись', document: 'Документ', decision: 'Решение',
      known: 'Что известно заранее', vote: 'Решить', skip: 'Промотать',
      restart: 'Новый мир', back: 'Вернуться', newWorld: 'Новый мир', nextRun: 'Новая экспедиция', reliefSummary: 'Итог спасения',
      filters: { all: 'Все', transcript: 'Стенограммы', note: 'Личные записи', watch: 'Вахта', instrument: 'Приборы', bulletin: 'Сводки Кольца' }, ved: 'Ведомость',
      summary: 'Итог пути', decided: 'Решено', prologue: 'Пролог', phaseDrift: 'Дрейф', phaseAccel: 'Разгон',
      lang: 'EN', langLabel: 'Switch to English'
    },
    en: {
      title: 'M31 · Slice: from prologue to epilogue',
      archive: "Ship's archive", year: 'Year', note: 'Personal log', transcript: 'Transcript',
      bulletin: 'Ring', instrument: 'Instrument record', document: 'Document', decision: 'Decision',
      known: 'Known in advance', vote: 'Decide', skip: 'Skip ahead',
      restart: 'New world', back: 'Back', newWorld: 'New world', nextRun: 'A new expedition', reliefSummary: 'The rescue',
      filters: { all: 'All', transcript: 'Transcripts', note: 'Personal logs', watch: 'Watch', instrument: 'Instruments', bulletin: 'Ring bulletins' }, ved: 'Full sheet',
      summary: 'The road so far', decided: 'Decided', prologue: 'Prologue', phaseDrift: 'Drift', phaseAccel: 'Acceleration',
      lang: 'RU', langLabel: 'Переключить на русский'
    }
  };

  // Сцены. Слева всегда 3D-вид: view — ракурс камеры. Картинка места (img) идёт иллюстрацией в текст.
  // fallback — кадр Blender, если 3D недоступно.
  const scenes = {
    space: { view: 'open', fallback: 'assets/drift.jpg', label: { ru: 'Галактика', en: 'The Galaxy' } },
    station: { view: 'dock', img: 'assets/station.jpg', fallback: 'assets/depart.jpg', label: { ru: 'Земля · станция связи Кольца', en: 'Earth · Ring contact station' }, side: 'right' },
    council: { view: 'dock', img: 'assets/council.jpg', fallback: 'assets/depart.jpg', label: { ru: 'Земля · Совет Звездоплавания', en: 'Earth · Council of Star Navigation' } },
    depart: { view: 'depart', fallback: 'assets/depart.jpg', label: { ru: 'Сорок первая · разгон', en: 'Forty-First · acceleration' } },
    ring: { view: 'rings', img: 'assets/ring.jpg', fallback: 'assets/drift.jpg', label: { ru: 'Жилое кольцо · R 150 м · 1 g', en: 'Habitat ring · R 150 m · 1 g' } },
    vault: { view: 'rings', img: 'assets/vault.jpg', fallback: 'assets/drift.jpg', label: { ru: 'Зал анабиоза · невесомость', en: 'Anabiosis hall · zero g' }, side: 'right' },
    cloud: { view: 'cloud', fallback: 'assets/cloud.jpg', label: { ru: 'Курс · облако класса D2', en: 'Course · class D2 cloud' }, side: 'right' },
    // регистрация экспедиции после паспорта: «в один конец» — весь путь от Солнца до цели, не корабль
    register: { view: 'route', img: 'assets/council.jpg', fallback: 'assets/depart.jpg', label: { ru: 'Земля · Совет Звездоплавания · курс', en: 'Earth · Council of Star Navigation · course' } },
    fitting: { view: 'cargo', fallback: 'assets/depart.jpg', label: { ru: 'Орбита Земли · комплектация', en: 'Earth orbit · fitting out' } },
    chart: { view: 'sector', fallback: 'assets/depart.jpg', label: { ru: 'Штурманская · звёздная карта', en: 'Navigation room · star chart' } },
    agenda: { view: 'agenda', fallback: 'assets/depart.jpg', label: { ru: 'Совет Звездоплавания · карта заявок', en: 'Council of Star Navigation · request chart' } },
    // цель задана заявкой (снабженец, спасатель) и лежит вне сектора сигнала — в кадре Солнце и цель, ракурс «Маршрут»
    chartTarget: { view: 'targetRoute', fallback: 'assets/depart.jpg', label: { ru: 'Штурманская · звёздная карта', en: 'Navigation room · star chart' } },
    scout: { view: 'ship', fallback: 'assets/depart.jpg', label: { ru: 'Корма · запуск зонда', en: 'Stern · probe launch' } },
    stage: { view: 'stage', fallback: 'assets/stage.jpg', label: { ru: 'Отделение ступени разгона', en: 'Acceleration stage separation' } },
    drift: { view: 'drift', fallback: 'assets/drift.jpg', label: { ru: 'Дрейф', en: 'Drift' }, side: 'right' },
    sail: { view: 'sail', fallback: 'assets/drift.jpg', label: { ru: 'Торможение · плазменный магнит', en: 'Braking · plasma magnet' }, side: 'right' },
    dark: { view: 'dark', fallback: 'assets/drift.jpg', label: { ru: 'Тёмная звезда', en: 'The Dark Star' }, side: 'right' },
    shield: { view: 'shield', fallback: 'assets/drift.jpg', label: { ru: 'Фронтальный щит · осмотр', en: 'Forward shield · inspection' }, side: 'right' },
    flip: { view: 'flip', fallback: 'assets/drift.jpg', label: { ru: 'Торможение', en: 'Braking' }, side: 'right' },
    relic: { view: 'relic', fallback: 'assets/drift.jpg', label: { ru: 'Тёмная звезда · дальний проход', en: 'The Dark Star · the distant pass' }, side: 'right' },
    arrival: { view: 'arrival', fallback: 'assets/drift.jpg', label: { ru: 'Прибытие', en: 'Arrival' }, side: 'right' },
    home: { view: 'home', fallback: 'assets/drift.jpg', label: { ru: 'Орбита · где будет дом', en: 'Orbit · where home will be' }, side: 'right' },
    // партия спасателей: карта сигнала бедствия и совет базы, услышавшей первой
    distress: { view: 'distress', fallback: 'assets/drift.jpg', label: { ru: 'Карта сигнала бедствия', en: 'Distress signal map' }, side: 'right' },
    // сводка о парусе эпохи III: камера — от Солнца за парусом по лучу лазерных станций
    epoch3: { view: 'epoch3', fallback: 'assets/drift.jpg', label: { ru: 'Луч лазерных станций · парус эпохи III', en: 'The laser stations\' beam · the epoch III sail' } },
    sosPass: { view: 'distress', fallback: 'assets/drift.jpg', label: { ru: 'Лакайль 9352 · совет Перевала', en: 'Lacaille 9352 · council of the Pass' }, side: 'right' },
    sosEarth: { view: 'distress', img: 'assets/council.jpg', fallback: 'assets/depart.jpg', label: { ru: 'Земля · Совет Звездоплавания', en: 'Earth · Council of Star Navigation' }, side: 'right' },
    sosLocal: { view: 'distress', fallback: 'assets/drift.jpg', label: { ru: 'Колония у звезды цели · совет', en: 'The colony at the target star · council' }, side: 'right' },
    rescue: { view: 'home', fallback: 'assets/drift.jpg', label: { ru: 'У цели · корабль сорок первой', en: 'At the target · the Forty-First' }, side: 'right' },
    // корабль поддержки: камера — к его расчётному положению позади нас (прямой видеосвязи нет)
    support: { view: 'support', fallback: 'assets/drift.jpg', label: { ru: 'Корабль поддержки · расчётное положение', en: 'The support ship · estimated position' }, side: 'right' }
  };
  Object.assign(ui.ru, {
    archiveBtn: 'Архив', encBtn: 'Энциклопедия', close: 'Закрыть', skipIntro: 'Пропустить', nextShot: 'Дальше', speed: 'скорость', lag: 'задержка связи с Землёй', months: 'мес.',
    earth: 'Земля', sleepers: 'Зал анабиоза', asleep: 'спят', onWatch: 'на вахте', lost: 'погибли в пути',
    model: 'модель: проход безопасен · 94%', manual: 'ручная проверка Орина: край плотнее на 6%',
    pathStraight: 'без коррекции', pathAround: 'манёвр',
    edgeMan: 'край плотнее модели', measured: 'затмение: пыль крупная, ×1,4', lives: 'Годы бодрствования',
    probeTitle: 'Две записи · один сектор неба', probeA: 'последняя передача 32-й', probeB: 'новый сигнал · каждые 40 мин',
    probeMatch: 'совпадают в пределах погрешности · код неизвестен',
    lensTitle: 'Снимок Кольца · гравитационная линза', lensSub: 'реконструкция 48 × 48 точек',
    lensClass: { ruined: 'кора расколота · расплав · обломки', hostile: 'облачная крыша · парник > 400 °C', none: 'на расчётной орбите пусто', dome: 'приливный захват · пар и лёд', open: 'вода · облака · суша' },
    // карта и паспорт экспедиции
    mapHint: 'Карту можно вращать и приближать. Строка заявки или щелчок по звезде — камера подлетает к системе. Курс задаёт заявка, за которую проголосует Совет.',
    agendaChips: 'Звёзды заявок', requestHere: 'Заявка у этой звезды', noRequest: 'Заявки у этой звезды нет — только справка.',
    planetsKnown: 'Подтверждённые планеты', noPlanets: 'Подтверждённых планет нет.', mEarth: 'массы Земли',
    pSpeed: 'Скорость', pReserve: 'Резерв манёвров', pCargo: 'Груз сверх ядра', kt: 'тыс. т', free: 'свободно', over: 'перегруз',
    pTarget: 'Цель', pPath: 'Путь', pArrive: 'прибытие около года', pAwake: 'каждый проживёт в пути', pAwakeTail: 'при вахте 48',
    pChecks: 'Проверки Совета', cFit: 'Груз помещается в выделенное топливо', cAwake: 'Не больше 25 лет бодрствования на человека',
    cThin: 'Больше 20 лет бодрствования: понадобится тонкая вахта', approve: 'Утвердить паспорт',
    gaugesTitle: 'Запасы', after: 'После', noChange: 'Запасы не меняются.', worldTitle: 'Мир после экспедиции', incidentsTitle: 'Протокол происшествий', recTitle: 'Совет рекомендует', recAssume: 'допущение', tlArrive: 'прибытие', tlShip: 'Корабль', tlPhase: { acc: 'разгон', drift: 'дрейф', mag: 'торможение магнитом', eng: 'торможение двигателем, кормой вперёд', home: 'у цели' }, tlPhases: { acc: 'разгон', drift: 'дрейф', mag: 'магнит', eng: 'двигатель', home: 'у цели' }, settings: 'Настройки', setLang: 'Язык', setSound: 'Звук', soundNone: 'В срезе пока нет звука.',
    setProgress: 'Прогресс', newWorldHint: 'Начать сначала в новом мире. Текущая партия уходит в резервную копию.',
    wipe: 'Сбросить весь прогресс', wipeHint: 'Стереть сохранение, память мира и резервную копию. Язык останется.',
    wipeAsk: 'Сбросить весь прогресс? Сохранение, память мира и резервная копия будут стёрты без возврата.', thawBerths: 'мест для Оттепели', ownPeople: 'своих', thawIn: 'спят из Оттепели', newWorldAsk: 'Начать новый мир? Ходы этой партии и память мира будут стёрты.', ppTitle: 'Расчёт паспорта · что изменит выбор',
    colonies: n => `Колонии и следы · ${n}`, archiveNote: 'Архив Кольца на день старта: последние отчёты, дошедшие до Земли.', legacyNote: 'Наследие прошлых экспедиций; общий календарь мира пока не ведётся.',
    road: (a, b) => `Ещё ${a} ${plural(a, ['экспедиция', 'экспедиции', 'экспедиций'])} в пути, ${b} ${plural(b, ['закончила', 'закончили', 'закончили'])} программы.`,
    pEquip: 'Оснащение', swaps: (n, m) => `замены ${n} из ${m}`, eraII: 'эпоха II', fixedEq: 'пока без выбора',
    eqStd: 'Штатно: плазменный магнит; радиационная защита — тороиды 20 Т·м.', eqLimit: 'Совет подготовил комплект. Можно изменить две позиции. Варианты внутри позиции можно пересматривать сколько угодно; возврат к рекомендации освобождает место.',
    eqFull: list => `Уже изменены две позиции: ${list}. Чтобы изменить третью, верните одну из них к рекомендации Совета.`, eqKeep: 'Сохранено из паспорта; отдельного применения в этой миссии нет.',
    eqBenefit: 'Польза', eqCondition: 'Условие', eqBasis: 'Основание', eqBack: 'Вернуть рекомендацию', eqSumTitle: 'Оснащение в пути', eqHelped: 'Помогло', eqIdle: 'Не понадобилось', eqMissing: 'Не хватило', eqNone: 'Нет зарегистрированных случаев.', eqRec: 'рекомендация Совета', eqDossier: 'Досье', eqCouncilT: 'Совет',
    cSwaps: 'Не больше двух замен против рекомендации Совета', pBrake: t => `магнит тормозит ${Math.round(t)} ${plural(Math.round(t), ['год', 'года', 'лет'])}`, pBrakeMass: 'масса к торможению',
    eqFx: {
      magnet: 'Тормозит почти постоянной силой: чем тяжелее корабль, тем дольше торможение.',
      rad20: 'Расчётный щит эпохи I; вдвое сильнее — только в эпохе II.',
      capsStd: 'Отказ капсулы 2·10⁻⁴ в год; при пробуждении гибнет 0,4%.',
      capsSafe: 'Отказы и гибель при пробуждении — вдвое реже; сон в ожидании теряет меньше.',
      shipOnly: 'Энергия у цели — только от корабля: первая зима тяжела без поддержки.',
      grid: 'Кабель к сети колонии — работает только у живой колонии.',
      reactor5: '5 МВт на купола и первую зиму; сильный удар потока разобьёт единственный блок.',
      dual: 'Два блока: второй переживёт любой удар.',
      spectra: 'Слабые спектры читает только специалист.',
      ir: 'Читает слабые спектры, видит холодные карлики и вспышки заранее.',
      spectraPlus: 'Ученики проверяют поток за 18 суток вместо 26; Коре всё равно три недели на пробуждение.',
      none: 'Зонд строят из материалов для высадки.',
      scout2: 'Ранний разведчик к цели и второй — для проверки потока; материалы целы.',
      inspect: 'Один зонд для проверки потока за 10 суток; до звезды не долетит.',
      dust20: 'Износ у облака пробивает сектор.',
      dust40: 'Держит полтора года износа у облака без пробоя.',
      sectors: 'Пробитый сектор меняют ремонтники с допуском.',
      repair: 'Чертежи Кольца — только в архив.',
      tools: 'Можно построить капельный радиатор по чертежу: −20% материалов.',
      printQC: 'Капельный радиатор дешевле: −10% материалов.'
    },
    say: {
      speed: ['Ива Лорн', 'Каждый год пути — это год жизни каждого из нас.'],
      reserve: ['Орин Дал', 'Резерв — это право ошибиться в пути и у цели. Чего мы не видим отсюда, увидим на подлёте.'],
      cargo: ['Феб Ирсон', 'Каждая тысяча тонн груза на 0,1c — тридцать пять тысяч тонн топлива.'],
      cargo2: ['Тея Марр', 'Материалы — это дом, а не запчасти.']
    }
  });
  Object.assign(ui.en, {
    archiveBtn: 'Archive', encBtn: 'Encyclopedia', close: 'Close', skipIntro: 'Skip', nextShot: 'Next', speed: 'velocity', lag: 'signal delay to Earth', months: 'mo',
    earth: 'Earth', sleepers: 'Anabiosis hall', asleep: 'asleep', onWatch: 'on watch', lost: 'died on the road',
    model: 'model: passage safe · 94%', manual: "Orin's manual check: edge 6% denser",
    pathStraight: 'no correction', pathAround: 'manoeuvre',
    edgeMan: 'edge denser than model', measured: 'occultation: coarse dust, ×1.4', lives: 'Years awake',
    probeTitle: 'Two recordings · one sector of sky', probeA: "32nd's last transmission", probeB: 'new signal · every 40 min',
    probeMatch: 'match within the error · code unknown',
    lensTitle: 'Ring image · gravitational lens', lensSub: 'reconstruction 48 × 48 points',
    lensClass: { ruined: 'crust split · melt · debris', hostile: 'cloud deck · greenhouse > 400 °C', none: 'predicted orbit empty', dome: 'tidally locked · vapour and ice', open: 'water · clouds · land' },
    mapHint: 'The chart can be turned and zoomed. A request row or a click on a star brings the camera to the system. The course is set by the request the Council votes for.',
    agendaChips: 'Request stars', requestHere: 'Request at this star', noRequest: 'No request at this star — reference only.',
    planetsKnown: 'Confirmed planets', noPlanets: 'No confirmed planets.', mEarth: 'Earth masses',
    pSpeed: 'Velocity', pReserve: 'Manoeuvre reserve', pCargo: 'Cargo beyond the core', kt: 'kt', free: 'free', over: 'overload',
    pTarget: 'Target', pPath: 'Road', pArrive: 'arrival around year', pAwake: 'each person lives awake on the road', pAwakeTail: 'with a watch of 48',
    pChecks: 'Council checks', cFit: 'Cargo fits the allotted fuel', cAwake: 'No more than 25 waking years per person',
    cThin: 'Over 20 waking years: a thin watch will be needed', approve: 'Approve the passport',
    gaugesTitle: 'Stores', after: 'After', noChange: 'Stores do not change.', worldTitle: 'The world after the expedition', incidentsTitle: 'Incident minutes', recTitle: 'The council recommends', recAssume: 'assumption', tlArrive: 'arrival', tlShip: 'The ship', tlPhase: { acc: 'acceleration', drift: 'drift', mag: 'braking on the magnet', eng: 'braking on the engine, stern first', home: 'at the target' }, tlPhases: { acc: 'acceleration', drift: 'drift', mag: 'magnet', eng: 'engine', home: 'at the target' }, settings: 'Settings', setLang: 'Language', setSound: 'Sound', soundNone: 'The slice has no sound yet.',
    setProgress: 'Progress', newWorldHint: 'Start over in a new world. The current run goes to the backup copy.',
    wipe: 'Reset all progress', wipeHint: 'Erase the save, the memory of the world and the backup copy. The language stays.',
    wipeAsk: 'Reset all progress? The save, the memory of the world and the backup copy will be erased for good.', thawBerths: 'berths for Thaw', ownPeople: 'of our own', thawIn: 'from Thaw asleep', newWorldAsk: 'Start a new world? The moves of this run and the memory of the world will be erased.', ppTitle: 'Passport calculation · what the choice changes',
    colonies: n => `Colonies and traces · ${n}`, archiveNote: 'The Ring archive on the day of departure: the latest reports that reached Earth.', legacyNote: 'Legacy of past expeditions; there is no common world calendar yet.',
    road: (a, b) => `${a} more expeditions are on the road, ${b} have finished their programmes.`,
    pEquip: 'Equipment', swaps: (n, m) => `swaps ${n} of ${m}`, eraII: 'epoch II', fixedEq: 'no choice yet',
    eqStd: 'Standard equipment: plasma magnet; radiation shielding — 20 T·m toroids.', eqLimit: 'The Council has prepared a loadout. You may change two positions. You can revise the option within a position as often as you like; returning to the recommendation frees a slot.',
    eqFull: list => `Two positions already differ: ${list}. To change a third, restore the Council's recommendation for one of them.`, eqKeep: 'Retained from the passport; no separate application in this mission.',
    eqBenefit: 'Benefit', eqCondition: 'Condition', eqBasis: 'Basis', eqBack: 'Restore recommendation', eqSumTitle: 'Equipment on the road', eqHelped: 'Helped', eqIdle: 'Not needed', eqMissing: 'Missing', eqNone: 'No recorded cases.', eqRec: "the Council's recommendation", eqDossier: 'Dossier', eqCouncilT: 'Council',
    cSwaps: 'No more than two swaps against the Council\'s recommendation', pBrake: t => `the magnet brakes for ${Math.round(t)} years`, pBrakeMass: 'mass at braking',
    eqFx: {
      magnet: 'Brakes with a nearly constant force: the heavier the ship, the longer the braking.',
      rad20: 'The epoch I rated shield; twice as strong only in epoch II.',
      capsStd: 'Capsule failure 2·10⁻⁴ a year; 0.4% die on waking.',
      capsSafe: 'Failures and waking deaths halved; sleeping while waiting loses fewer.',
      shipOnly: 'Power at the target comes only from the ship: the first winter is hard without support.',
      grid: 'A cable to the colony grid — works only at a living colony.',
      reactor5: '5 MW for the domes and the first winter; a strong stream strike smashes the single unit.',
      dual: 'Two units: the second survives any strike.',
      spectra: 'Only a specialist reads the weak spectra.',
      ir: 'Reads the weak spectra, sees cold dwarfs and flares in advance.',
      spectraPlus: 'The students check the stream in 18 days instead of 26; Kora still needs three weeks to wake.',
      none: 'A probe is built from the landing materials.',
      scout2: 'An early scout to the target and a second one for the stream check; the materials stay whole.',
      inspect: 'One probe for a 10-day stream check; it will not reach the star.',
      dust20: 'Wear at the cloud breaches a sector.',
      dust40: 'Holds a year and a half of cloud wear without a breach.',
      sectors: 'A breached sector is swapped by qualified repair hands.',
      repair: 'The Ring\'s designs go only into the archive.',
      tools: 'The droplet radiator can be built from the design: −20% materials.',
      printQC: 'The droplet radiator comes cheaper: −10% materials.'
    },
    say: {
      speed: ['Iva Lorn', 'Every year on the road is a year of life for each of us.'],
      reserve: ['Orin Dal', "Reserve is the right to make a mistake on the road and at the target. What we can't see from here we'll see on approach."],
      cargo: ['Feb Irson', 'Every thousand tonnes of cargo at 0.1c costs thirty-five thousand tonnes of fuel.'],
      cargo2: ['Teya Marr', 'Materials are a home, not spare parts.']
    }
  });

  // Персонажи: имена во всех встречающихся формах, портрет (или инициалы) и цвет одежды из канона.
  // Портрет в тексте — при первом упоминании в записи; готовые портреты перечислены в assets/portraits/index.js.
  const people = {
    dasser: { color: '#1f5a5c', ini: { ru: 'НД', en: 'ND' },
      ru: ['Нил Дассер', 'Дассер', 'Дассера', 'Дассеру', 'Дассером', 'Дассере'], en: ['Nil Dasser', 'Dasser'] },
    orin: { color: '#b7862f', ini: { ru: 'ОД', en: 'OD' },
      ru: ['Орин Дал', 'Орин', 'Орина', 'Орину', 'Орином', 'Дал'], en: ['Orin Dal', 'Orin', 'Dal'] },
    kassel: { color: '#6e2434', ini: { ru: 'ИК', en: 'IK' },
      ru: ['Ирина Кассель', 'Кассель'], en: ['Irina Kassel', 'Kassel'] },
    kora: { color: '#1e6d6a', ini: { ru: 'КЛ', en: 'KL' },
      ru: ['Кора Ландис', 'Кора', 'Коры', 'Коре', 'Кору', 'Корой', 'Ландис'], en: ['Kora Landis', 'Kora', 'Landis'] },
    dan: { color: '#6a6f76', ini: { ru: 'ДО', en: 'DO' },
      ru: ['Дан Осгер', 'Дан', 'Дана', 'Дану', 'Даном', 'Осгер'], en: ['Dan Osger', 'Dan', 'Osger'] },
    irson: { color: '#7d7a73', ini: { ru: 'ФИ', en: 'FI' },
      ru: ['Феб Ирсон', 'Ирсон', 'Ирсона', 'Ирсону', 'Ирсоном'], en: ['Feb Irson', 'Irson'] },
    lorn: { color: '#3d4f7a', ini: { ru: 'ИЛ', en: 'IL' },
      ru: ['Ива Лорн', 'Лорн'], en: ['Iva Lorn', 'Lorn'] },
    marr: { color: '#5b6b2e', ini: { ru: 'ТМ', en: 'TM' },
      ru: ['Тея Марр', 'Тея', 'Теи', 'Тее', 'Тею', 'Марр'], en: ['Teya Marr', 'Teya'] },
    naya: { color: '#5d4a78', ini: { ru: 'НС', en: 'NS' },
      ru: ['Ная Сорн', 'Ная', 'Наю', 'Наи', 'Наей'], en: ['Naya Sorn', 'Naya'] },
    selina: { color: '#2d5f8a', ini: { ru: 'СВ', en: 'SV' },
      ru: ['Селина Вей', 'Селина', 'Селину', 'Селины', 'Селине', 'Селиной'], en: ['Selina Vei', 'Selina'] },
    tamir: { color: '#8a4b2d', ini: { ru: 'ТВ', en: 'TV' },
      ru: ['Тамир Вент', 'Тамир', 'Тамира', 'Тамиру', 'Тамиром'], en: ['Tamir Vent', 'Tamir'] }
  };


  // ================================================================ ПАРТИЯ СПАСАТЕЛЕЙ
  // Авария кончила экспедицию, люди живы. Следующая партия — совет базы, которая услышала сигнал первой.
  // Годы — по календарю сорок первой (от её отлёта). inc — снимок аварии, world — снимок мира на старте партии:
  // повторный проход партии даёт тот же результат, даже если мир после неё изменился.
  const CAUSE = {
    cargo: { ru: 'в середине дрейфа отказало охлаждение — трещина в коллекторе, погибли двенадцать человек', en: 'in mid-drift the cooling failed — a crack in the manifold; twelve died' },
    drift: { ru: 'в последней четверти дрейфа отказал контур воды, погиб тридцать один человек', en: 'in the last quarter of the drift the water loop failed and thirty-one died' },
    stream: { ru: 'у Тёмной звезды удар потока пробил зал анабиоза', en: 'at the Dark Star a stream strike breached the anabiosis hall' },
    home: { ru: 'мир у цели непригоден, а строить нечем', en: 'the world at the target is unfit, and there is nothing to build with' },
    rescueDock: { ru: 'у склада Оттепели повреждённую линию подключили без изоляции; отказало охлаждение корабля, погибли шестеро', en: "at Thaw's store the damaged line was connected without isolation; the ship's cooling failed and six died" }
  };
  const plan = s => M.rescuers(s.inc, s.world);
  const rsc = (s, id) => plan(s).list.find(r => r.id === id) || null;
  const shipWhere = (s, y, lang) => y < s.inc.arrive
    ? (lang === 'ru' ? `Корабль идёт к ${nmD(s)} по программе и встанет на орбиту около года ${s.inc.arrive}.` : `The ship flies on to ${nm(s, 'en')} by programme and will enter orbit around year ${s.inc.arrive}.`)
    : (lang === 'ru' ? `Корабль на орбите у ${nmG(s)}.` : `The ship is in orbit at ${nm(s, 'en')}.`);
  const passEarthLy = () => M.lightYears('pass', 'earth');
  // пилотируемый вылет Земли отменяется, только если подтверждение, что аппарат Перевала вышел, пришло до её старта
  const earthStands = s => { const p = rsc(s, 'pass'), e = rsc(s, 'earth'); return !p || p.launch + passEarthLy() > e.launch; };
  const CREWED = { tug: 'pass', sail: 'earth', earth: 'earth', take: 'local', repair: 'local' };
  const voyage = r => r && r.id !== 'local' ? { id: r.id, launch: r.launch, arrive: yr(r.complete) - M.WORK } : null;
  // исход — по живым: спящих не осталось — «опоздали»; помощь позже срока — «спасены не все»
  const grade = (sv, c, until, by) => !sv.sleepers ? 'tooLate' : c > until ? 'partial' : by === 'earth' ? 'savedEarth' : 'savedColony';
  function reliefResult(s) {
    const inc = s.inc, e = rsc(s, 'earth'), p = rsc(s, 'pass');
    if (s.send === 'none') return { by: null, voyages: [], saved: M.survivors(inc, Infinity), outcome: 'remain' };
    if (s.send === 'auto') {
      // аппарат без людей ставит сменный холодильный блок, насосы и электронику: капсулы, дожившие до него,
      // держат до max(срок, его работа + 60). Разбудить всех нельзя — жизнеобеспечение рассчитано на вахту; людей шлёт Земля.
      const vs = [voyage(p), voyage(e)];
      if (e.complete <= p.complete) { const sv = M.survivors(inc, e.complete); return { by: 'earth', earthFirst: true, voyages: vs, arrive: yr(e.complete) - M.WORK, complete: e.complete, saved: sv, outcome: grade(sv, e.complete, inc.deadline, 'earth') }; }
      const kept = M.survivors(inc, p.complete).sleepers, until = Math.max(inc.deadline, p.complete + 60);
      const sv = kept ? M.survivors({ sleepers: kept, watch: inc.watch, sent: p.complete, hold: until - p.complete, capRate: inc.capRate }, e.complete) : M.survivors(inc, e.complete);
      const o = grade(sv, e.complete, until, 'earth');
      return { by: 'earth', auto: p.complete, kept, until, voyages: vs, arrive: yr(e.complete) - M.WORK, complete: e.complete, saved: sv, outcome: o === 'savedEarth' ? 'savedLater' : o };
    }
    let by = CREWED[s.send], r = rsc(s, by);
    const vs = [voyage(r)];
    if (s.send === 'tug' && earthStands(s)) { vs.push(voyage(e)); if (e.complete < r.complete) { by = 'earth'; r = e; } }   // Земля не узнала вовремя: летят оба, спасает первый
    const sv = M.survivors(inc, r.complete);
    return { by, voyages: vs.filter(Boolean), arrive: yr(r.complete) - M.WORK, complete: r.complete, saved: sv, outcome: grade(sv, r.complete, inc.deadline, by) };
  }
  // спящие на дату записи — по той же модели, с учётом работы автомата
  const sleepersAt = (s, y) => { const r = s.res, inc = s.inc;
    if (r.auto && r.kept && y >= r.auto) return M.survivors({ sleepers: r.kept, watch: inc.watch, sent: r.auto, hold: r.until - r.auto, capRate: inc.capRate }, y).sleepers;
    return M.survivors(inc, y).sleepers; };
  // События мира от партии спасателей; каждое применяется один раз по своему id, к текущему миру (game.js).
  // Аппарат Перевала списан, когда он вылетел; поселение — когда помощь закончена.
  function reliefEvents(s) {
    const out = [], r = s.res, p = rsc(s, 'pass');
    if (!r) return out;
    if ((s.send === 'tug' || s.send === 'auto') && p && s.year >= p.launch - 1e-9) out.push({ id: s.inc.id + '|tug', passTug: false });
    if (s.outcome && s.outcome !== 'remain' && r.saved.total > 0) out.push({ id: s.inc.id + '|settle', settle: { star: s.inc.target, year: yr(r.complete), people: r.saved.total, joined: s.send === 'take' ? s.colony : null } });
    return out;
  }
  function applyEvents(world, events) {
    const w = JSON.parse(JSON.stringify(world || {}));
    w.applied = w.applied || [];
    const markDone = x => { if (x && x.request && x.task && x.task.done && !(w.requestsDone || []).includes(x.request)) (w.requestsDone = w.requestsDone || []).push(x.request); };
    for (const ev of events) {
      if (w.applied.includes(ev.id)) {                                 // уже записанный итог старой партии: дописать заявку и задание
        const x = ev.expedition, old = x && (w.expeditions || []).find(e => e.id === x.id);
        if (old && old.request === undefined) { old.request = x.request; old.task = x.task; markDone(x); }
        continue;
      }
      if (ev.passTug === false) w.passTug = false;
      if (ev.settle) (w.settled = w.settled || []).push(ev.settle);
      if (ev.expedition) (w.expeditions = w.expeditions || []).push(ev.expedition);
      markDone(ev.expedition);
      w.applied.push(ev.id);
    }
    return w;
  }
  // снимок аварии из сохранения: цель, причина и числа должны быть целы
  const validIncident = inc => !!(inc && typeof inc === 'object' && typeof inc.id === 'string' && typeof inc.target === 'string' && M.star(inc.target)
    && Object.prototype.hasOwnProperty.call(CAUSE, inc.cause)
    && ['beta', 'arrive', 'sent', 'alive', 'watch', 'sleepers', 'hold', 'deadline'].every(k => Number.isFinite(inc[k]))
    && inc.beta > 0 && inc.beta < 0.3 && inc.arrive > 0 && inc.sent >= 0 && inc.hold > 0 && inc.watch >= 0 && inc.sleepers >= 0
    && inc.alive === inc.sleepers + inc.watch && inc.deadline === inc.sent + inc.hold);
  // решения, добавленные в сюжет позже: старые сохранения проходят их вариантом по умолчанию (engine.migrate)
  // (id варианта не 'go': иначе старая перемотка молча съедалась бы решением и ответы сдвигались)
  const INSERTED = { 'd.sos.stream': 'carry', 'd.rescuePrep': 'defer', 'd.rescueShelter': 'direct', 'd.newInfo': 'stay' };
  const marginLine = (c, dl, lang) => lang === 'ru'
    ? `Капсулы держат до года ${Math.round(dl)}: ` + (c <= dl ? `запас — ${yrs(dl - c)}.` : c < dl + 5 ? `опоздание ${yrs(Math.max(1, c - dl))} — часть блоков откажет.` : 'не успеть.')
    : `The capsules hold until year ${Math.round(dl)}: ` + (c <= dl ? `margin ${yrsEn(dl - c)}.` : c < dl + 5 ? `${yrsEn(Math.max(1, c - dl))} late — some blocks will fail.` : 'too late.');
  const capLine = (r, lang) => {
    const ru = lang === 'ru', c = yr(r.complete);
    if (r.id === 'local') return ru ? `помощь внутри системы — к году ${c}` : `help within the system by year ${c}`;
    if (r.id === 'pass') return ru ? `ремонтный аппарат на 0,08c — к году ${c}` : `the repair vessel at 0.08c — by year ${c}`;
    return ru ? `парус эпохи III на 0,2c, постройка десять лет — к году ${c}` : `an epoch III sail at 0.2c, ten years to build — by year ${c}`;
  };
  const OUTCOME_R = {
    savedColony: { ru: 'Спасены колонией', en: 'Rescued by a colony' },
    savedEarth: { ru: 'Спасены Землёй', en: 'Rescued by Earth' },
    savedLater: { ru: 'Разбудили следующие', en: 'Woken by those who came next' },
    partial: { ru: 'Спасены не все', en: 'Not all were saved' },
    tooLate: { ru: 'Опоздали', en: 'Too late' },
    remain: { ru: 'Остались спящие', en: 'Those who stayed asleep' }
  };
  const aliveLine = (s, lang) => { const inc = s.inc, r = s.res, ru = lang === 'ru', sv = r.saved, late = r.complete - (r.until || inc.deadline);
    if (!sv.total) return ru ? 'Живых нет: последняя смена пережила зал, но не дождалась.' : 'No one is alive: the last shift outlived the hall, but not the wait.';
    if (!sv.sleepers) return ru ? 'Живых капсул нет. Двенадцать последней смены живы.' : 'No capsule is alive. The twelve of the last shift are alive.';
    const tail = ru ? `живы ${sv.sleepers} из ${inc.sleepers} спящих и двенадцать вахты` : `${sv.sleepers} of the ${inc.sleepers} sleepers are alive, and the twelve of the watch`;
    if (late > 0) return ru ? `Капсулы отказывают уже ${yrs(Math.max(1, late))}: ${tail}.` : `The capsules have been failing for ${yrsEn(Math.max(1, late))}: ${tail}.`;
    if (r.until) return `${cap(tail)}.`;
    return ru ? `${cap(tail)}: капсулы отказывали по одной, как и считали.` : `${cap(tail)}: the capsules failed one at a time, as calculated.`;
  };
  const signalText = (s, lang, head, tail) => { const inc = s.inc, c = plan(s).council, ru = lang === 'ru', dt = c.hear - inc.sent;
    return ru
      ? `${head} Сигнал бедствия шёл сюда ${dt < 0.1 ? 'считаные недели' : `${f1(dt, 'ru')} ${Math.round(dt * 10) % 10 ? 'года' : plural(Math.round(dt), ['год', 'года', 'лет'])}`}.

Сорок первая, экспедиция к ${nmD(s)}: ${CAUSE[inc.cause].ru}. Живы ${ppl(inc.alive)}: двенадцать на вахте, остальные спят в законсервированном зале. Капсулы рассчитаны до года ${Math.round(inc.deadline)}. ${shipWhere(s, c.hear, 'ru')}

${tail}`
      : `${head} The distress signal took ${dt < 0.1 ? 'a few weeks' : `${f1(dt, 'en')} years`} to get here.

The Forty-First, the expedition to ${nm(s, 'en')}: ${CAUSE[inc.cause].en}. ${inc.alive} are alive: twelve on watch, the rest asleep in the conserved hall. The capsules are rated to year ${Math.round(inc.deadline)}. ${shipWhere(s, c.hear, 'en')}

${tail}`; };

  const RBEATS = [
    {
      id: 'r.signal.pass', scene: 'sosPass', kind: 'transcript', when: s => s.council === 'pass',
      title: { ru: 'Совет Перевала', en: 'Council of the Pass' },
      text: {
        ru: s => signalText(s, 'ru', 'Лакайль 9352, станция Перевала.', `Координатор открывает совет: «Земля ещё ничего не знает. Она услышит этот сигнал в год ${yr(rsc(s, 'earth').hear)}. Решаем мы — а у нас один межзвёздный аппарат».`),
        en: s => signalText(s, 'en', 'Lacaille 9352, the Pass station.', `The coordinator opens the council: "Earth knows nothing yet. It will hear this signal in year ${yr(rsc(s, 'earth').hear)}. We decide — and we have one interstellar vessel."`)
      }
    },
    {
      id: 'r.signal.earth', scene: 'sosEarth', kind: 'transcript', when: s => s.council === 'earth',
      title: { ru: 'Совет Звездоплавания — снова', en: 'The Council of Star Navigation — again' },
      text: {
        ru: s => { const p = rsc(s, 'pass'); return signalText(s, 'ru', 'Земля, Совет Звездоплавания: тот же зал, где когда-то утверждали паспорт сорок первой.',
          'Ближе к ним нет никого, кто мог бы вылететь раньше' + (p ? `: Перевал услышит в год ${yr(p.hear)}, его аппарат дошёл бы к году ${yr(p.complete)}` : s.world.passTug === false ? ': у Перевала больше нет межзвёздного аппарата' : '') + '. Решает Земля.'); },
        en: s => { const p = rsc(s, 'pass'); return signalText(s, 'en', 'Earth, the Council of Star Navigation: the same hall where the Forty-First\'s passport was once approved.',
          'There is no one closer who could launch sooner' + (p ? `: the Pass will hear in year ${yr(p.hear)}, and its vessel would get there by year ${yr(p.complete)}` : s.world.passTug === false ? ': the Pass no longer has an interstellar vessel' : '') + '. Earth decides.'); }
      }
    },
    {
      id: 'r.signal.local', scene: 'sosLocal', kind: 'transcript', when: s => s.council === 'local',
      title: { ru: s => `Совет ${place(plan(s).council, 'ru', 1)}`, en: s => `Council of ${place(plan(s).council, 'en')}` },
      text: {
        ru: s => { const c = plan(s).council, col = M.colony(c.colony); return signalText(s, 'ru', `${cap(place(c, 'ru'))} — у той же звезды.`,
          `Помощь отсюда — вопрос месяцев, а не десятилетий. Вопрос в другом: у нас ${ppl(col.awake)} бодрствующих, а их — ${inc0(s)}.`); },
        en: s => { const c = plan(s).council, col = M.colony(c.colony); return signalText(s, 'en', `${cap(place(c, 'en'))} is at the same star.`,
          `Help from here is a matter of months, not decades. The question is another: we have ${col.awake} awake, and they are ${s.inc.alive}.`); }
      }
    },
    {
      id: 'r.sphere', scene: 'distress', kind: 'instrument',
      title: { ru: 'Карта сигнала', en: 'Signal map' },
      text: {
        ru: s => { const R = plan(s), c = R.council, L = passEarthLy();
          return R.list.map(r => `${cap(place(r, 'ru'))}: сигнал — год ${yr(r.hear)}; ${capLine(r, 'ru')}.`).join('\n') + `\nКапсулы держат до года ${Math.round(s.inc.deadline)}.`
            + (c.id === 'pass' ? `\n\nРешение Перевала дойдёт до Земли в год ${yr(c.hear + L)}; её ответ вернётся сюда в год ${yr(c.hear + 2 * L)}. Первым услышать — не значит первым успеть.` : ''); },
        en: s => { const R = plan(s), c = R.council, L = passEarthLy();
          return R.list.map(r => `${cap(place(r, 'en'))}: signal in year ${yr(r.hear)}; ${capLine(r, 'en')}.`).join('\n') + `\nThe capsules hold until year ${Math.round(s.inc.deadline)}.`
            + (c.id === 'pass' ? `\n\nThe Pass's decision will reach Earth in year ${yr(c.hear + L)}; Earth's answer will come back here in year ${yr(c.hear + 2 * L)}. Hearing first does not mean arriving first.` : ''); }
      }
    },
    {
      id: 'd.r.launch', scene: 'distress', kind: 'decision',
      title: { ru: 'Кого посылать', en: 'Whom to send' },
      context: {
        ru: s => `Живы ${ppl(s.inc.alive)}; капсулы держат до года ${Math.round(s.inc.deadline)}. Каждый вариант — чей-то аппарат, чьё-то топливо и чьи-то люди.`,
        en: s => `${s.inc.alive} are alive; the capsules hold until year ${Math.round(s.inc.deadline)}. Every option is someone's vessel, someone's fuel and someone's people.`
      },
      options: s => {
        const e = rsc(s, 'earth'), p = rsc(s, 'pass'), c = plan(s).council, dl = s.inc.deadline;
        const pick = (id, label, known, record) => ({ id, label, known, record,
          effect: st => { st.send = id; st.res = reliefResult(st); } });
        if (s.council === 'pass') return [
          pick('tug', { ru: 'Отправить аппарат с шестью ремонтниками', en: 'Send the vessel with six repair hands' }, {
            ru: [`Вылет — год ${yr(p.launch)}, перелёт ${yrs(p.fly)} на 0,08c; ремонт закончат к году ${yr(p.complete)}.`, marginLine(p.complete, dl, 'ru'), 'Цена: около шестнадцати тысяч тонн топлива из двадцати, шесть человек и единственный межзвёздный аппарат Перевала — обратно ему лететь не на чем.'],
            en: [`Launch in year ${yr(p.launch)}, ${yrsEn(p.fly)} of flight at 0.08c; the repair done by year ${yr(p.complete)}.`, marginLine(p.complete, dl, 'en'), 'The cost: about sixteen thousand of the twenty thousand tonnes of fuel, six people and the Pass\'s only interstellar vessel — it will have nothing to fly back on.']
          }, { ru: 'Совет Перевала отправляет аппарат. Шестеро добровольцев подписывают рейс без обратного билета.', en: 'The council of the Pass sends the vessel. Six volunteers sign on for a flight with no ticket back.' }),
          pick('auto', { ru: 'Отправить аппарат без людей', en: 'Send the vessel uncrewed' }, {
            ru: [`Автомат ставит только заложенное — сменный холодильный блок, насосы, электронику: капсулы, дожившие до года ${yr(p.complete)}, продержатся ещё шестьдесят лет.`, `Разбудить всех нельзя: жизнеобеспечение корабля рассчитано на вахту. Людей пришлёт Земля — парус к году ${yr(e.complete)}.`, 'Цена: топливо и аппарат; ремонтники остаются дома.'],
            en: [`The automaton installs only what was planned — a spare cooling block, pumps, electronics: the capsules alive in year ${yr(p.complete)} will hold sixty years more.`, `Everyone cannot be woken: the ship's life support is sized for the watch. Earth will send the people — its sail by year ${yr(e.complete)}.`, 'The cost: the fuel and the vessel; the repair hands stay home.']
          }, { ru: 'Совет Перевала отправляет аппарат без людей. Программу ремонта пишут всей станцией.', en: 'The council of the Pass sends the vessel uncrewed. The whole station writes the repair programme.' }),
          pick('earth', { ru: 'Не посылать: ждать Землю', en: 'Send nothing: wait for Earth' }, {
            ru: [`Земля услышит в год ${yr(e.hear)}; её парус закончит ремонт к году ${yr(e.complete)}.`, marginLine(e.complete, dl, 'ru'), 'Перевал сохраняет аппарат, топливо и людей.'],
            en: [`Earth will hear in year ${yr(e.hear)}; its sail will finish the repair by year ${yr(e.complete)}.`, marginLine(e.complete, dl, 'en'), 'The Pass keeps its vessel, its fuel and its people.']
          }, { ru: 'Совет Перевала решает ждать Землю и шлёт ей свой расчёт.', en: 'The council of the Pass decides to wait for Earth and sends it its calculation.' })
        ];
        if (s.council === 'earth') return [
          pick('sail', { ru: 'Строить спасательный парус', en: 'Build a rescue sail' }, {
            ru: [`Постройка — десять лет${e.launch - 10 > e.hear + 0.01 ? ', и начать её можно только с приходом эпохи III' : ''}; вылет — год ${yr(e.launch)}, двенадцать спасателей на 0,2c. Ремонт — к году ${yr(e.complete)}.`, marginLine(e.complete, dl, 'ru'), 'Цена: лазерные станции десять лет работают на спасение — следующая экспедиция эпохи III уйдёт позже.'],
            en: [`Ten years to build${e.launch - 10 > e.hear + 0.01 ? ', and building can start only when epoch III comes' : ''}; launch in year ${yr(e.launch)}, twelve rescuers at 0.2c. The repair by year ${yr(e.complete)}.`, marginLine(e.complete, dl, 'en'), 'The cost: the laser stations work on the rescue for ten years — the next epoch III expedition leaves later.']
          }, { ru: 'Совет решает строить парус. Сорок первую снова снаряжают из этого зала — теперь за ней самой.', en: 'The Council decides to build the sail. The Forty-First is fitted out from this hall again — this time for its own sake.' }),
          pick('none', { ru: 'Не посылать', en: 'Send nothing' }, {
            ru: [e.complete >= dl + M.CASCADE ? `Парус не успеет: ремонт к году ${yr(e.complete)}, капсулы держат до года ${Math.round(dl)}.` : `Парус успел бы: ремонт к году ${yr(e.complete)}, капсулы держат до года ${Math.round(dl)}.`, 'Сорок первой уйдёт ответ: имена, расчёт, решение.'],
            en: [e.complete >= dl + M.CASCADE ? `A sail would not make it: the repair by year ${yr(e.complete)}, the capsules hold until year ${Math.round(dl)}.` : `A sail would make it: the repair by year ${yr(e.complete)}, the capsules hold until year ${Math.round(dl)}.`, 'The Forty-First will receive an answer: the names, the calculation, the decision.']
          }, { ru: 'Совет решает не посылать. Ответ сорок первой пишут вслух, при всех.', en: 'The Council decides to send nothing. The answer to the Forty-First is written aloud, before everyone.' })
        ];
        const col = M.colony(c.colony), pctUp = Math.round(s.inc.alive / col.awake * 100), yrsWake = Math.ceil(s.inc.sleepers / 50);
        return [
          pick('take', { ru: 'Принять всех к себе', en: 'Take them all in' }, {
            ru: [`Помощь — к году ${yr(c.complete)}: перелёт внутри системы.`, `${cap(place(c, 'ru'))} — ${ppl(col.awake)} бодрствующих; принять ${ppl(s.inc.alive)} — это +${pctUp}% людей: жильё, пища, вода, врачи. Будить по пятьдесят в год — ${yrs(yrsWake)}.`, 'Сорок первая становится частью колонии.'],
            en: [`Help by year ${yr(c.complete)}: a flight within the system.`, `${cap(place(c, 'en'))} has ${col.awake} awake; taking in ${s.inc.alive} is +${pctUp}% people: housing, food, water, physicians. Waking fifty a year — ${yrsEn(yrsWake)}.`, 'The Forty-First becomes part of the colony.']
          }, { ru: 'Совет решает принять всех. Жилые модули уплотняют ещё до прихода корабля.', en: 'The council decides to take them all in. The habitat modules are packed tighter before the ship even arrives.' }),
          pick('repair', { ru: 'Чинить их корабль', en: 'Repair their ship' }, {
            ru: [`Помощь — к году ${yr(c.complete)}: мастерские колонии чинят контур и зал.`, 'Корабль сорок первой остаётся вторым поселением у той же звезды; люди живут у себя.', 'Цена: запчасти и год работы наших ремонтников.'],
            en: [`Help by year ${yr(c.complete)}: the colony's workshops repair the loop and the hall.`, 'The Forty-First\'s ship stays as a second settlement at the same star; its people live aboard.', 'The cost: spare parts and a year of our repair crews\' work.']
          }, { ru: 'Совет решает чинить их корабль. У звезды будет два поселения.', en: 'The council decides to repair their ship. There will be two settlements at the star.' })
        ];
      }
    },
    // середина ожидания — от года, когда совет услышал, до прихода спасателя (не от текущего года: подпись та же до и после промотки)
    { id: 's.r1', kind: 'skip', when: s => s.send !== 'none' && s.council !== 'local', toYear: s => midRelief(s),
      label: { ru: s => `Промотать до года ${midRelief(s)} · рейс`, en: s => `Skip ahead to year ${midRelief(s)} · the flight` } },
    {
      id: 'r.news', scene: 'distress', kind: 'instrument', when: s => s.send !== 'none' && s.council !== 'local',
      title: { ru: 'Журнал связи', en: 'Comms log' },
      text: {
        ru: s => { const e = rsc(s, 'earth'), p = rsc(s, 'pass'), L = passEarthLy();
          const head = {
            tug: () => `Аппарат ушёл в год ${yr(p.launch)}. ` + (earthStands(s)
              ? `Подтверждение вылета дошло до Земли в год ${yr(p.launch + L)} — после старта её паруса. Спасателей будет двое.`
              : `Земля получила сигнал сорок первой в год ${yr(e.hear)}, а подтверждение нашего вылета — в год ${yr(p.launch + L)}, раньше собственного старта. Ответ Земли: второго спасателя не будет; следом уйдёт грузовой парус с материалами для поселения.`),
            auto: () => `Аппарат без людей ушёл в год ${yr(p.launch)}. Земля узнала о нём в год ${yr(p.launch + L)} и строит парус с двенадцатью: вылет — год ${yr(e.launch)}.`,
            earth: () => `Земля получила сигнал в год ${yr(e.hear)}. Парус спасателей строят; вылет — год ${yr(e.launch)}.`,
            sail: () => `Парус спасателей ушёл в год ${yr(e.launch)}. Ответ Совета дошёл до сорок первой: там знают, что помощь идёт.`
          }[s.send]();
          const alive = sleepersAt(s, s.year), lost = s.inc.sleepers - alive;
          return head + '\n\n' + (!alive ? 'Зал мёртв: живых капсул нет.' : s.year > (s.res.until && s.year >= s.res.auto ? s.res.until : s.inc.deadline)
            ? `Блоки зала отказывают: живы ${alive} из ${s.inc.sleepers} спящих.`
            : `По расчёту, за ${yrs(s.year - s.inc.sent)} отказали ${lost} ${plural(lost, ['капсула', 'капсулы', 'капсул'])}; вахта сменяется по графику.`); },
        en: s => { const e = rsc(s, 'earth'), p = rsc(s, 'pass'), L = passEarthLy();
          const head = {
            tug: () => `The vessel left in year ${yr(p.launch)}. ` + (earthStands(s)
              ? `Confirmation of the launch reached Earth in year ${yr(p.launch + L)} — after its sail had left. There will be two rescuers.`
              : `Earth received the Forty-First's signal in year ${yr(e.hear)}, and confirmation of our launch in year ${yr(p.launch + L)}, before its own launch. Earth's answer: there will be no second rescuer; a cargo sail with materials for the settlement will follow.`),
            auto: () => `The uncrewed vessel left in year ${yr(p.launch)}. Earth learned of it in year ${yr(p.launch + L)} and is building a sail with twelve: launch in year ${yr(e.launch)}.`,
            earth: () => `Earth received the signal in year ${yr(e.hear)}. The rescue sail is being built; launch in year ${yr(e.launch)}.`,
            sail: () => `The rescue sail left in year ${yr(e.launch)}. The Council's answer has reached the Forty-First: they know help is coming.`
          }[s.send]();
          const alive = sleepersAt(s, s.year), lost = s.inc.sleepers - alive;
          return head + '\n\n' + (!alive ? 'The hall is dead: no capsule is alive.' : s.year > (s.res.until && s.year >= s.res.auto ? s.res.until : s.inc.deadline)
            ? `The hall's blocks are failing: ${alive} of the ${s.inc.sleepers} sleepers are alive.`
            : `By calculation, in ${yrsEn(s.year - s.inc.sent)} ${lost} capsule${lost === 1 ? '' : 's'} failed; the watch is relieved on schedule.`); }
      }
    },
    { id: 's.r2', kind: 'skip', when: s => s.send !== 'none', toYear: s => s.res.arrive,
      label: { ru: s => `Промотать до года ${yr(s.res.arrive)} · прибытие`, en: s => `Skip ahead to year ${yr(s.res.arrive)} · arrival` } },
    {
      id: 'r.arrive', scene: 'rescue', kind: 'instrument', when: s => s.send !== 'none',
      title: { ru: 'Журнал спасателей · у сорок первой', en: 'Rescuers\' log · at the Forty-First' },
      text: {
        ru: s => { const r = s.res;
          const head = r.auto ? (r.kept ? `В год ${yr(r.auto - M.WORK)} к сорок первой подошёл аппарат Перевала без людей и по программе поставил сменный холодильный блок, насосы и электронику. Капсулы, дожившие до него, держат до года ${yr(r.until)}. Теперь дотормаживает парус Земли.` : `В год ${yr(r.auto - M.WORK)} к сорок первой подошёл аппарат Перевала без людей: живых капсул к его приходу не осталось. Теперь дотормаживает парус Земли.`)
            : r.by === 'pass' ? 'Аппарат Перевала выходит к сорок первой.' : r.by === 'earth' ? `Парус Земли дотормаживает у ${nmG(s)}.` : `Корабли ${place(plan(s).council, 'ru', 1)} подходят к сорок первой.`;
          return `${head} Маяк отвечает; ${r.saved.watch ? 'шлюз открывает вахта' : 'шлюз открывают снаружи'}.\n\n${aliveLine(s, 'ru')}`; },
        en: s => { const r = s.res;
          const head = r.auto ? (r.kept ? `In year ${yr(r.auto - M.WORK)} the Pass's uncrewed vessel reached the Forty-First and, by programme, installed a spare cooling block, pumps and electronics. The capsules alive then hold until year ${yr(r.until)}. Now Earth's sail is braking in.` : `In year ${yr(r.auto - M.WORK)} the Pass's uncrewed vessel reached the Forty-First: no capsule was still alive when it came. Now Earth's sail is braking in.`)
            : r.by === 'pass' ? 'The Pass\'s vessel comes alongside the Forty-First.' : r.by === 'earth' ? `Earth's sail finishes braking at ${nm(s, 'en')}.` : `Ships from ${place(plan(s).council, 'en')} come alongside the Forty-First.`;
          return `${head} The beacon answers; ${r.saved.watch ? 'the watch opens the airlock' : 'the airlock is opened from outside'}.\n\n${aliveLine(s, 'en')}`; }
      }
    },
    {
      id: 'r.greeting', scene: 'rescue', kind: 'transcript', when: s => s.send !== 'none' && !!s.res && s.res.saved.watch > 0 && s.send !== 'auto',
      title: { ru: 'Журнал спасателей · встреча', en: "Rescuers' log · the meeting" },
      text: {
        ru: s => `— Сорок первая, мы приняли ваш местный маяк. Назовите, кто сейчас на вахте.

Пока спасатели сближаются, ответы приходят с паузой светового хода; у шлюза пауза уже незаметна.

— Нас двенадцать. ${s.res.saved.sleepers > 0 ? 'Сменяемся из спящих.' : 'Мы последняя смена: сменять нас больше некому.'} Сейчас передадим журнал за всё время после сигнала бедствия.

Дежурный встречает их один: остальные у оборудования. На поручне закреплена потёртая схема обходных магистралей.

— Медицинские записи Ивы Лорн у вас есть? Поздние дополнения лежат рядом, по датам.

— Есть. Покажите и список умерших — до сигнала и после. Мы сверим его с вашим.

Спасатель закрепляет сумку у поручня:

— С какого поста снять первого человека на отдых?`,
        en: s => `"Forty-First, we have your local beacon. Tell us who is on watch now."

During the approach, replies arrive after a light-travel pause; by the airlock, it is imperceptible.

"Twelve of us. ${s.res.saved.sleepers > 0 ? 'We rotate from the sleepers.' : 'We are the last shift: there is no one left to relieve us.'} We'll send the full log since the distress call."

One duty officer meets them; the others remain at their equipment. A worn diagram of the bypass lines is fastened to the handrail.

"Do you have Iva Lorn's medical records? The later additions are beside them, in date order."

"Yes. Show us the list of those who died, before the signal and after. We'll check it against yours."

The rescuer secures a bag to the handrail.

"Which station should we relieve first?"`
      }
    },
    {
      id: 'x.r.end', scene: 'rescue', kind: 'end', year: s => s.res.arrive + M.WORK, when: s => s.send !== 'none',   // даты в журнале — целыми годами; исход — по точному сроку
      effect: s => { s.outcome = s.res.outcome; },
      title: { ru: s => OUTCOME_R[s.res.outcome].ru, en: s => OUTCOME_R[s.res.outcome].en },
      text: {
        ru: s => { const r = s.res, sv = r.saved, c = plan(s).council, o = r.outcome;
          const work = o !== 'tooLate' ? `Контур и зал починены за год. Спящих будят по графику: сначала врачей и инженеров, потом остальных. Спасены ${ppl(sv.total)}.`
            : sv.total ? 'Зал мёртв. Двенадцать последней смены — всё, что осталось от сорок первой.' : 'Зал мёртв, последней смены тоже нет. Спасатели находят журнал и имена.';
          const by = {
            tug: r.by === 'pass' ? (sv.total ? 'Шестеро с Перевала остаются с ними' : 'Шестеро с Перевала остаются у пустого корабля') + ': аппарату не на чем вернуться. У Перевала больше нет межзвёздного аппарата — если беда случится у него самого, помощь придёт только с Земли.' : 'Парус Земли пришёл раньше аппарата Перевала: подтверждение его вылета не успело до её старта. Шестеро с Перевала приходят к уже спасённым — и остаются с ними.',
            auto: (r.earthFirst ? (sv.sleepers ? 'Парус Земли пришёл раньше аппарата Перевала; автомат ставит свой блок уже в спасённом зале.' : 'Парус Земли пришёл раньше аппарата Перевала — и тоже слишком поздно.') : !r.kept ? 'Аппарат Перевала пришёл к мёртвому залу.' : 'Аппарат Перевала сохранил зал; разбудили его люди с Земли.') + ' У Перевала больше нет межзвёздного аппарата.',
            earth: 'Перевал сохранил аппарат, топливо и людей. Спасла Земля.',
            sail: 'Лазерные станции десять лет работали на спасение: следующая экспедиция эпохи III ушла позже.',
            take: `Сорок первую принимает ${place(c, 'ru')}: ${ppl(sv.total)} к ${(M.colony(c.colony) || {}).awake} своим. Будят по пятьдесят в год — годы тесноты, двойных смен в агрозалах и очередей к врачам.`,
            repair: `Мастерские ${place(c, 'ru', 1)} чинят корабль за год. У ${nmG(s)} теперь два поселения.`
          }[s.send];
          return `${work} ${by}\n\nЭкспедиция к ${nmD(s)} кончилась не так, как её снаряжали. Но её люди — в мире, и мир это запомнит.`; },
        en: s => { const r = s.res, sv = r.saved, c = plan(s).council, o = r.outcome;
          const work = o !== 'tooLate' ? `The loop and the hall are repaired within a year. The sleepers are woken on schedule: physicians and engineers first, then the rest. ${sv.total} are saved.`
            : sv.total ? 'The hall is dead. The twelve of the last shift are all that remains of the Forty-First.' : 'The hall is dead, and so is the last shift. The rescuers find the log and the names.';
          const by = {
            tug: r.by === 'pass' ? (sv.total ? 'The six from the Pass stay with them' : 'The six from the Pass stay by the empty ship') + ': the vessel has nothing to fly back on. The Pass no longer has an interstellar vessel — if trouble comes to it, help can come only from Earth.' : 'Earth\'s sail arrived before the Pass\'s vessel: confirmation of its launch did not reach Earth before the sail left. The six from the Pass arrive to people already saved — and stay with them.',
            auto: (r.earthFirst ? (sv.sleepers ? 'Earth\'s sail arrived before the Pass\'s vessel; the automaton installs its block in a hall already saved.' : 'Earth\'s sail arrived before the Pass\'s vessel — and it, too, was too late.') : !r.kept ? 'The Pass\'s vessel arrived at a dead hall.' : 'The Pass\'s vessel kept the hall alive; people from Earth woke it.') + ' The Pass no longer has an interstellar vessel.',
            earth: 'The Pass kept its vessel, its fuel and its people. Earth did the rescuing.',
            sail: 'The laser stations worked on the rescue for ten years: the next epoch III expedition left later.',
            take: `${cap(place(c, 'en'))} takes in the Forty-First: ${sv.total} people to its own ${(M.colony(c.colony) || {}).awake}. Fifty are woken a year — years of crowding, double shifts in the agro halls and queues at the physicians.`,
            repair: `The workshops of ${place(c, 'en')} repair the ship within a year. There are two settlements at ${nm(s, 'en')} now.`
          }[s.send];
          return `${work} ${by}\n\nThe expedition to ${nm(s, 'en')} did not end the way it was fitted out for. But its people are in the world, and the world will remember it.`; }
      }
    },
    {
      id: 'x.r.none', scene: 'distress', kind: 'end', when: s => s.send === 'none',
      effect: s => { s.outcome = 'remain'; },
      title: { ru: OUTCOME_R.remain.ru, en: OUTCOME_R.remain.en },
      text: {
        ru: s => `Совет не посылает спасателей. Сорок первой уходит ответ: имена, расчёт, решение. Спящие остаются в законсервированном зале до года ${Math.round(s.inc.deadline)}; маяк передаёт эту дату всем, кто услышит.`,
        en: s => `The Council sends no rescuers. An answer goes to the Forty-First: the names, the calculation, the decision. The sleepers stay in the conserved hall until year ${Math.round(s.inc.deadline)}; the beacon transmits that date to anyone who hears.`
      }
    }
  ];
  const inc0 = s => s.inc.alive;
  const midRelief = s => yr((plan(s).council.hear + s.res.arrive) / 2);
  function reliefState(inc, world) {
    const R = M.rescuers(inc, world);
    return { relief: true, inc, world, target: inc.target, beta: inc.beta, arrive: inc.arrive, mission: inc.mission,
      year: R.council.hear, council: R.council.id, colony: R.council.colony || null,
      send: null, res: null, outcome: null, choices: {} };
  }
  // сюжет партии спасателей: тот же движок, свои беты
  const relief = (inc, world) => ({ beats: RBEATS, initialState: () => reliefState(inc, world) });
  // кнопка на экране конца: «Совет Перевала: принять сигнал»
  function reliefButton(inc, world, lang) {
    const c = M.rescuers(inc, world).council;
    if (lang !== 'ru') return c.id === 'earth' ? 'The Council of Star Navigation: receive the signal' : `Council of ${place(c, 'en')}: receive the signal`;
    return c.id === 'earth' ? 'Совет Звездоплавания: принять сигнал' : `Совет ${place(c, 'ru', 1)}: принять сигнал`;
  }

  const arriveView = s => rescueS(s) && s.arriveExact != null ? s.arriveExact : s.arrive;
  // ---- сцены по актам (story/*.js): фабрика акта получает общие имена этого файла — собираются здесь, когда объявлено всё
  // (сцены вызывают помощников при сборке: skipTo, sosEnd …); порядок актов — порядок сюжета
  const STORY = ['plan', 'prologue', 'act1', 'act2', 'act3', 'act4', 'epilogue'];
  const Story = typeof module !== 'undefined' && module.exports ? Object.fromEntries(STORY.map(k => [k, require('./story/' + k + '.js')])) : root.M31Story;
  const K = {
    BLUEPRINT, CLOUD, DV, EPOCH3, GREET_LAST, LOOP, M, NEWS, OUTCOME, PREP, R, RESCUE, SHELTER_R, SOS_AT_cargo, STORM, STREAM, SUPPLY, THAW0,
    THAW_LOSS, W, WATCH_SOS, Y, Y3, Y4, YD, Yepi, agendaOf, agroLost, aliveOf, answerLag, arriveX, bad, bandBreach, bandHit, brake, brakeApply,
    brakeSettle, bulletinTitle, burnDays, busCheck, busRecord, busRestart, busSplit, canEvade, cap, cargoConnect, cloudBand, collectorCracked,
    colonyTie, connectNeed, connectOptions, contactRun, coolerName, councilText, crewOf, crewWord, darkAt, days, daysTo, dd, deadCauses,
    deliverOptions, discText, dockApply, dutchmanEnd, dvPct, edgeLogV5, edgeMonths, edgeOut, endR, energyOK, eqOf, f1, f2, fb, goalOf, greetR, hasIR,
    hasScouts, heatAgo, hidden, homeOptionsR, housedOf, incident, isoDays, kms, lag, laserLate, laserYear, lastCall, livable, loopAt, loopCommon,
    lossesOf, matReserve, months, nameAt, namesShort, newsCandidates, newsPlan, newsText, nm, nmD, nmG, opNormal, opStart, opYear, outcomeOf, ownStory,
    passportOptions, passportParse, pct, pctFrom, planText, planWho, plural, powerOK, ppl, probeOK, probeTimes, probesLeft, reader, regHands, reportOn,
    reqOf, requestOption, rescueLegacy, rescueOptions, rescueS, riskLine, roadDead, sectionHolds, sectionLine, shieldGaugeV5, siteRecord, skipTo,
    sleepersAt2, sosDrift, sosEnd, sosKnown, sosOption, src, stageOff, stagePass, stageYears, stayOption, storeLine, storeNow, storeR, stormU,
    streamAt, streamDv, streamLate, streamLogV5, streamOptions, streamPlan, streamTimes, supplyS, supplySrc, taskLabel, taskReportText, taskResult,
    thawAdvance, thawAlive, thawDeadline, thawLag, thawN, thawNames, thinWatch, turnOption, urgentOf, vAt, warnAt, win, windowLine, yrs, yrsEn, yrsG
  };
  for (const k of STORY) beats.push(...Story[k](K));
  const content = { beats, initialState, ui, scenes, supportPlan, supportWorld, awakeOf, aliveOf, wearObserve: s => s.wear ? W.observe(s.wear) : null, shipHealth, calPick, wearHooks: { respond: (s, rec) => wearRespond(s, rec), decision: (s, ev) => wearDecision(s, ev), jobsLine: (s, l) => jobsLine(s, l) }, events: EV, navDeparture, epoch3, lossFuture: () => LOSS_FUTURE, lossesOf, requests: R, reqOf, missionComplete, earlyTurnQuote, newsPlan, people, mission: M, missionCheck, sim, shield: SH, shieldInspect, endHeadline, incidentHeadline, edgeOut, streamTimes, streamPlan, thawN, arriveView, eq: eqApi, rescueV3: { thawAlive, thawAt, thawName, RESCUE }, missionMarks, RISK, hidden, hashU32, publicOf, incidentLines, crewName, CAST, relief, reliefButton, setWorld, getWorld: () => WORLD, OUTCOME_R,
    reliefEvents, applyEvents, validIncident, INSERTED, gauges, gaugeDiff, passportMetrics, expeditionEvent, worldLines, archiveShort, archiveLines, legacyLines, STATUS };
  if (typeof module !== 'undefined' && module.exports) module.exports = content;
  else root.M31Content = content;
})(typeof globalThis !== 'undefined' ? globalThis : this);
