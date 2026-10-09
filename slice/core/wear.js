// М31 · срез — модель времени и износ корабля: узлы, ремонты, мастерская, ведомость работ, опасный узел. Часть content.js: объявленное здесь — в общем реестре частей; имена других частей
// приходят через __link (позднее связывание: после создания всех частей; при загрузке нужны только части выше).
(function (root) {
  'use strict';
  const wear = __core => {
    let CLOUD, CLOUD_RHO, EV, JB, M, SH, STREAM, STREAM_MAT5, STREAM_RHO, W, aliveOf, arriveView, book, capsSafe, cloudBand, crewOf, edgeIn, edgeOut,
    energyOK, eqOf, hidden, incident, nf, plural, ppl, src, streamPlan, txt, yrs, yrsEn;
    const __link = () => { ({ CLOUD, CLOUD_RHO, EV, JB, M, SH, STREAM, STREAM_MAT5, STREAM_RHO, W, aliveOf, arriveView, book, capsSafe, cloudBand, crewOf, edgeIn, edgeOut, energyOK, eqOf, hidden, incident, nf, plural, ppl, src, streamPlan, txt, yrs, yrsEn } = __core); };
    __link();

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

    return {
      names: {
        SIM_TITLE, SIM_NOTE, cloudThrough, cloudSpan, streamOn, rhoAt, envOf, streamGrain, streamOutcome, erodeSpan, cloudHit, envMarks, offShipAt,
        wearOn, wearRnd, awakeAt, awakeNowAt, awakeNow, WEAR_OPS, CAST_SEATS, sleepersAt2, WEAR_WORK, zgFactor, techs, pools, auralN, auralDays,
        wearStop, wearStart, regJob, REG_ASK, wearRegAsk, regWakeTo, wearRegDecision, wearRegTick, matReserve, jobDone, wearSyncDead, wearDead,
        wearSync, pumpFail, layout, wearNote, wearReroute, wearOp, wearMove$, pendingFor, wearMove, wearUnit, wearCheckGroups, SHOP_RESERVE,
        shopPolicy, shopNeeds, wearShopAsk, prodOf, PART_RU, PART_EN, wearDispose, wearShop, wearShopFail, wearDriveFix, wearShopLost, deadLoop,
        wearCollRetry, wearCollFail, wearTerminal, wearCoreWarn, terminalBeat, DONOR, agroLost, donorDays, agroDonorOK, wearDonor, wearDonorDone,
        jobName, jobsLine, wearRebuildable, wearRebuild, wearRebuilt, wearRefit, wearRecover, wearRecovered, wearOpDone, wearDeaths, pumpSpare,
        pumpProspect, wearRespond, wearFire, radLoop, dangerSig, dangerAsk, dangerReask, dangerCan, queueDays, dangerAfter
      },
      link: __link
    };
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = wear;
  else (root.M31Core = root.M31Core || {}).wear = wear;
})(typeof globalThis !== 'undefined' ? globalThis : this);
