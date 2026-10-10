// М31 · срез — советы: «Новые сведения», голосование по заявкам. Часть content.js: объявленное здесь — в общем реестре частей; имена других частей
// приходят через __link (позднее связывание: после создания всех частей; при загрузке нужны только части выше).
(function (root) {
  'use strict';
  const council = __core => {
    let M, R, crewOf, flightPlan, hashU32, hidden, nf, nmG, plural, spendPct, thawDeadline;
    const __link = () => { ({ M, R, crewOf, flightPlan, hashU32, hidden, nf, nmG, plural, spendPct, thawDeadline } = __core); };
    __link();

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
      cost: st => { spendPct(st, qt.reservePct); },                      // «После»: только публичная цена манёвра
      effect: st => {
        const t2 = earlyTurnQuote(st, q); if (!t2) return;               // повторная проверка на полном состоянии
        const from = st.target;
        spendPct(st, t2.reservePct);
        (st.taskHistory = st.taskHistory || []).push(Object.assign({}, st.task, { status: 'abandoned', at: st.year }));
        st.requestId = q.id; st.target = q.star; st.task = { work: q.work, star: q.star, done: false, found: null, reportAt: null };
        st.arriveExact = t2.arriveExact; st.arrive = t2.arrive;
        st.route = { knee: { at: st.year, x: t2.x, from }, D: t2.D };
        flightPlan(st);                                                  // новая цель — свой план полёта в системе (подлёт после раннего поворота — та же линия: ≲0,2°)
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

    return {
      names: {
        NEWS, CKMS, unitOf, dot3, worldU, newsReceived, newsPlan, earlyTurnQuote, newsCandidates, NEWS_WORLD, nameAt, newsText, taskLabel, turnOption,
        stayOption, MISSION_BASE, agendaOf, reqOf, RESEARCH, COURSE, swap, requestOption, NUMW, councilText, beats, ui, scenes, people
      },
      link: __link
    };
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = council;
  else (root.M31Core = root.M31Core || {}).council = council;
})(typeof globalThis !== 'undefined' ? globalThis : this);
