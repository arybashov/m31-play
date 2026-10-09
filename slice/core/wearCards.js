// М31 · срез — карточки модели (износ, опоры, опасный узел, мастерская, донор), календарь и перемотка. Часть content.js: объявленное здесь — в общем реестре частей; имена других частей
// приходят через __link (позднее связывание: после создания всех частей; при загрузке нужны только части выше).
(function (root) {
  'use strict';
  const wearCards = __core => {
    let CARGO_NAME, DONOR, EV, JB, M, SH, W, WEAR_OPS, arriveView, auralDays, awakeAt, awakeNowAt, book, cargoSync, cloudBand, cloudHit, cloudSpan,
    cloudThrough, dangerAfter, dangerAsk, dangerCan, dangerReask, dangerSig, donorDays, envMarks, erodeSpan, fuelSpan, hidden, jobDone, layout, nf,
    offShipAt, plural, pools, ppl, prodOf, pumpFail, pumpProspect, queueDays, radLoop, rhoAt, streamGrain, streamOn, streamOutcome, streamPlan,
    tankLine, tankSync, techs, wearCheckGroups, wearCoreWarn, wearDonor, wearFire, wearNote, wearOn, wearOp, wearRegAsk, wearRegDecision, wearRegTick,
    wearRnd, wearShop, wearStart, wearStop, wearSyncDead, wearTerminal;
    const __link = () => { ({ CARGO_NAME, DONOR, EV, JB, M, SH, W, WEAR_OPS, arriveView, auralDays, awakeAt, awakeNowAt, book, cargoSync, cloudBand, cloudHit, cloudSpan, cloudThrough, dangerAfter, dangerAsk, dangerCan, dangerReask, dangerSig, donorDays, envMarks, erodeSpan, fuelSpan, hidden, jobDone, layout, nf, offShipAt, plural, pools, ppl, prodOf, pumpFail, pumpProspect, queueDays, radLoop, rhoAt, streamGrain, streamOn, streamOutcome, streamPlan, tankLine, tankSync, techs, wearCheckGroups, wearCoreWarn, wearDonor, wearFire, wearNote, wearOn, wearOp, wearRegAsk, wearRegDecision, wearRegTick, wearRnd, wearShop, wearStart, wearStop, wearSyncDead, wearTerminal } = __core); };
    __link();

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
  // опасный узел: тормозной бак (шаг «хрупкость» 4в) — течь арматуры. Совет видит содержимое, срок ремонта по очереди и резерв
  // после изоляции (на копии); дефектная серия и броски разрыва скрыты
  function wearTankDecision(s, ev) {
    const id = ev.id, stage = ev.stage, Dg = W.DANGER.brakeTank, open = stage === 'open' || stage === 'warn', nb = W.TANK_PAIR[id];
    const R = x => W.dangerRecipe(x.wear, id), can = x => dangerCan(x, id), fuelOf = x => x.fuel ? x.fuel.tanks[id].fuel : 0;
    const left = x => Math.max(0, (Dg.tol - W.defectAt(x.wear.nodes[id], x.year)) / Math.max(0.2, x.wear.nodes[id].r));
    const shut = x => { const c = M.copy(x); if (c.wear.nodes[id].ok) W.isolate(c.wear, id, c.year); tankSync(c, c.year); return c; };   // бак перекрыт: резерв, нехватка
    const resLine = (c, x, ru) => c.fuel.short > 1e-9 ? (ru ? `Торможения не хватит: недостаёт ${nf(c.fuel.short * 299792.458, 0, 'ru')} км/с.` : `Braking will not be covered: ${nf(c.fuel.short * 299792.458, 0, 'en')} km/s short.`)
      : (ru ? `Резерв манёвров станет ${nf(c.reserve, 1, 'ru')}% (сейчас ${nf(x.reserve, 1, 'ru')}%); торможение обеспечено.` : `The manoeuvre reserve becomes ${nf(c.reserve, 1, 'en')}% (now ${nf(x.reserve, 1, 'en')}%); braking is covered.`);
    const days = x => queueDays(x, { prio: JB.PRIO.path, pool: 'tech', minW: 1, maxW: 2, work: R(x).work, hold: R(x).hold }, x.year);
    const cost = (x, ru) => { const d = days(x), q = d == null ? (ru ? 'людей на ремонт сейчас нет' : 'no people for the repair now') : (ru ? `по очереди работ — около ${nf(d, 0, 'ru')} суток` : `about ${nf(d, 0, 'en')} days by the work queue`);
      return ru ? `Гермокомплект (в запасе ${x.wear.inv.tankKit}), ${R(x).work} чел.-сут и ${R(x).hold} суток проверки; ${q}.` : `A sealing kit (${x.wear.inv.tankKit} in stock), ${R(x).work} person-days and ${R(x).hold} days of leak testing; ${q}.`; };
    const head = (x, ru) => {
      if (stage === 'open') return ru ? `Течь арматуры бака ${id}: давление падает. В баке ${nf(fuelOf(x), 2, 'ru')} тыс. т топлива. С открытой подачей содержимое уйдёт примерно за ${nf(left(x), 0, 'ru')} суток. ${tankLine(x, 'ru')}`
        : `A leak in tank ${id}'s fittings: the pressure is dropping. The tank holds ${nf(fuelOf(x), 2, 'en')} thousand t of propellant. With the feed open it will all leak away in about ${nf(left(x), 0, 'en')} days. ${tankLine(x, 'en')}`;
      if (stage === 'heavy') return ru ? `Бак ${id} пуст и непригоден. ${tankLine(x, 'ru')}` : `Tank ${id} is empty and unusable. ${tankLine(x, 'en')}`;
      return ru ? `Бак ${id} перекрыт: ${nf(fuelOf(x), 2, 'ru')} тыс. т топлива на борту, но двигателю недоступны. ${tankLine(x, 'ru')}` : `Tank ${id} is shut: ${nf(fuelOf(x), 2, 'en')} thousand t of propellant aboard but unavailable to the engine. ${tankLine(x, 'en')}`; };
    const repair = { id: 'repair', label: { ru: open ? 'Перекрыть подачу и восстановить арматуру' : 'Восстановить арматуру', en: open ? 'Shut the feed and restore the fittings' : 'Restore the fittings' },
      known: { ru: y => [cost(y, true), open ? 'На время ремонта топливо бака недоступно двигателю, потом подача откроется. ' + resLine(shut(y), y, true) : 'После проверки подача откроется — топливо бака снова доступно.'],
        en: y => [cost(y, false), open ? "For the repair the tank's propellant is unavailable to the engine; then the feed reopens. " + resLine(shut(y), y, false) : "After the test the feed reopens — the tank's propellant is available again."] },
      effect: y => { const w = y.wear; if (w.nodes[id].ok) W.isolate(w, id, y.year); const op = wearOp(y, 'tank', id, y.year, false); (y.danger = y.danger || {})[id] = op ? 'repair' : 'isolate'; tankSync(y, y.year);
        if (!op) wearNote(y, `Ремонт арматуры бака ${id} не начат: гермокомплектов не хватило. Подача перекрыта.`, `The repair of tank ${id}'s fittings did not start: no sealing kit. The feed is shut.`); },
      record: { ru: `Подачу бака ${id} перекрывают, арматуру восстанавливают.`, en: `Tank ${id}'s feed is shut and its fittings restored.` } };
    const isolate = { id: 'isolate', label: { ru: 'Перекрыть подачу, бак не трогать', en: 'Shut the feed, leave the tank' },
      known: { ru: y => ['Топливо остаётся на борту, но двигателю недоступно — лишний вес. ' + resLine(shut(y), y, true), 'Гермокомплект цел; восстановить арматуру можно позже.'],
        en: y => ['The propellant stays aboard but the engine cannot use it — dead weight. ' + resLine(shut(y), y, false), 'The sealing kit is kept; the fittings can be restored later.'] },
      effect: y => { W.isolate(y.wear, id, y.year); tankSync(y, y.year); (y.danger = y.danger || {})[id] = 'isolate'; },
      record: { ru: `Подачу бака ${id} перекрывают; бак остаётся как есть.`, en: `Tank ${id}'s feed is shut; the tank is left as it is.` } };
    const cont = { id: 'continue', label: { ru: 'Оставить подачу открытой — до отказа', en: 'Keep the feed open — to failure' },
      known: { ru: y => [`Течь продолжится: ${nf(fuelOf(y), 2, 'ru')} тыс. т уйдут примерно за ${nf(left(y), 0, 'ru')} суток, потом бак непригоден.`, `Оболочка при этом может разорваться и задеть соседний бак ${nb}.`, 'Решение окончательное: дальше — только запись прибора.'],
        en: y => [`The leak goes on: ${nf(fuelOf(y), 2, 'en')} thousand t will leak away in about ${nf(left(y), 0, 'en')} days; then the tank is unusable.`, `The shell may burst as well and hit the neighbouring tank ${nb}.`, 'The decision is final: from here on, only an instrument record.'] },
      effect: y => { (y.danger = y.danger || {})[id] = 'continue'; },
      record: { ru: `Бак ${id} работает с течью; за давлением следят.`, en: `Tank ${id} runs with a leak, its pressure under watch.` } };
    const leave = { id: 'leave', label: { ru: 'Оставить бак перекрытым', en: 'Leave the tank shut' },
      known: { ru: y => [`Гермокомплекты (${y.wear.inv.tankKit}) — на другое.`, stage === 'heavy' ? 'Бак пуст: восстанавливать нечего.' : 'Топливо бака остаётся лишним весом.'],
        en: y => [`The sealing kits (${y.wear.inv.tankKit}) are kept for other work.`, stage === 'heavy' ? 'The tank is empty: there is nothing to restore.' : "The tank's propellant stays dead weight."] },
      effect: y => { (y.danger = y.danger || {})[id] = 'leave'; },
      record: { ru: `Бак ${id} остаётся перекрытым.`, en: `Tank ${id} stays shut.` } };
    return {
      id: 'd.wear.danger', key: id, stage, scene: 'vault', kind: 'decision',
      title: { ru: open ? `Опасный узел: течь бака ${id}` : `Бак ${id} перекрыт`, en: open ? `A dangerous node: a leak in tank ${id}` : `Tank ${id} is shut` },
      rec: x => can(x) ? { id: 'repair', why: open ? { ru: 'течь не остановится сама; топливо бака — это торможение у цели', en: "a leak does not stop by itself; the tank's propellant is the braking at the target" }
          : { ru: 'топливо бака снова станет торможением и резервом', en: "the tank's propellant becomes braking and reserve again" } }
        : { id: open ? 'isolate' : 'leave', why: { ru: 'восстанавливать нечем — подачу перекрывают, пока топливо цело', en: 'there is nothing to restore it with — the feed is shut while the propellant is intact' } },
      context: { ru: x => head(x, true), en: x => head(x, false) },
      options: x => dangerOwn(id, (can(x) ? [repair] : []).concat(open ? [isolate, cont] : [leave]))
    };
  }
  // опасный груз (шаг «хрупкость» 4г): аномалия партии — локализовать (функция партии потеряна, источник убран) или продолжать
  // (функция до исчерпания допуска, потом потеряна; возможна разгерметизация и удар по соседнему узлу)
  function wearCargoDecision(s, ev) {
    const id = ev.id, open = ev.stage === 'open' || ev.stage === 'warn', Dg = W.DANGER.hazCargo, nb = W.CARGO_NEXT[id];
    const left = x => Math.max(0, (Dg.tol - W.defectAt(x.wear.nodes[id], x.year)) / Math.max(0.2, x.wear.nodes[id].r));
    const loss = ru => id === 'C1' ? (ru ? 'Запасного аккумуляторного блока не будет: при отказе энергоблока заменить нечем.' : 'There will be no spare battery block: if a power block fails there is nothing to replace it with.')
      : (ru ? 'Готового капсульного блока заявки не будет: форпосту его соберут из своих материалов (−40%).' : 'There will be no ready capsule unit for the request: it will be built for the outpost from our own materials (−40%).');
    const nbName = ru => /^T\d$/.test(nb) ? (ru ? `бак ${nb}` : `tank ${nb}`) : (ru ? `коллектор контура ${nb.split('.')[0]}` : `loop ${nb.split('.')[0]}'s collector`);
    const recipe = (x, ru) => { const kit = (x.wear.inv.isoKit || 0) >= 1, w = Dg.repair.work * (kit ? 1 : 2);
      return ru ? `${kit ? `Комплект изоляции (в запасе ${x.wear.inv.isoKit}), ` : 'Комплектов изоляции нет — подручными средствами, '}${w} чел.-сут и ${Dg.repair.hold} сут контроля.` : `${kit ? `An isolation kit (${x.wear.inv.isoKit} in stock), ` : 'No isolation kits — with what is at hand, '}${w} person-days and ${Dg.repair.hold} day of monitoring.`; };
    const isolate = { id: 'isolate', label: { ru: 'Локализовать партию', en: 'Isolate the batch' },
      known: { ru: y => [recipe(y, true), 'Партия списывается сразу; опасность для соседнего узла снята. ' + loss(true)], en: y => [recipe(y, false), 'The batch is written off at once; the risk to the neighbouring node is removed. ' + loss(false)] },
      effect: y => { W.isolate(y.wear, id, y.year); cargoSync(y, y.year); wearOp(y, 'cargo', id, y.year, false); (y.danger = y.danger || {})[id] = 'isolate'; },
      record: { ru: `Партию ${id} локализуют и списывают.`, en: `Batch ${id} is isolated and written off.` } };
    const cont = { id: 'continue', label: { ru: 'Продолжать, следить', en: 'Carry on, under watch' },
      known: { ru: y => [`Партия служит ещё около ${nf(left(y), 0, 'ru')} суток, затем потеряна всё равно. ` + loss(true), `Партия может разгерметизироваться и задеть соседний узел — ${nbName(true)}.`, 'Решение окончательное: дальше — только запись прибора.'],
        en: y => [`The batch lasts about ${nf(left(y), 0, 'en')} more days, then it is lost anyway. ` + loss(false), `The batch may vent and hit the neighbouring node — ${nbName(false)}.`, 'The decision is final: from here on, only an instrument record.'] },
      effect: y => { (y.danger = y.danger || {})[id] = 'continue'; },
      record: { ru: `Партия ${id} остаётся на месте; за ней следят.`, en: `Batch ${id} stays in place, under watch.` } };
    const leave = { id: 'leave', label: { ru: 'Принять потерю', en: 'Accept the loss' },
      known: { ru: () => [loss(true), 'Партию уже не вернуть.'], en: () => [loss(false), 'The batch cannot be brought back.'] },
      effect: y => { (y.danger = y.danger || {})[id] = 'leave'; }, record: { ru: `Партия ${id} потеряна.`, en: `Batch ${id} is lost.` } };
    return {
      id: 'd.wear.danger', key: id, stage: ev.stage, scene: 'vault', kind: 'decision',
      title: { ru: `Опасный узел: груз ${id}`, en: `A dangerous node: cargo ${id}` },
      rec: () => ({ id: open ? 'isolate' : 'leave', why: { ru: 'партия потеряна в любом случае; локализация убирает опасность для соседнего узла', en: 'the batch is lost either way; isolating it removes the risk to the neighbouring node' } }),
      context: { ru: x => `Груз ${id} — ${CARGO_NAME[id].ru}: аномалия, растёт температура, газоанализ показывает выделение. Рядом — ${nbName(true)}.`,
        en: x => `Cargo ${id} — ${CARGO_NAME[id].en}: an anomaly, the temperature is rising, the gas analysis shows outgassing. Next to it is ${nbName(false)}.` },
      options: () => dangerOwn(id, open ? [isolate, cont] : [leave])
    };
  }
  function wearDangerDecision(s, ev) {
    if (/^C\d$/.test(ev.id)) return wearCargoDecision(s, ev);
    if (/^T\d$/.test(ev.id)) return wearTankDecision(s, ev);
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
              : inTime(y) ? 'Группы на тепловом резерве дождутся монтажа.' : 'До исчерпания резерва не успеть — группы на резерве погибнут и так.', 'Ставят насос только на этот контур. Прежде оставленные контуры так и стоят, политика «беречь запас» сохраняется: следующий отказ — снова это решение, если будут насос и материалы.'],
          en: y => [`Every free technician: about ${nf(auralDays(y) * 24, 0, 'en')} h; a pump from stock (${y.wear.inv.pump - 1} left), materials −${WEAR_OPS.pump}%.`,
            ev.core ? (inTime(y) ? 'The core holds out until it is fitted.' : `It cannot be done before the core's reserve runs out: the voyage ends in ${nf(W.coreAt(y.wear, y.year), 0, 'en')} h.`)
              : inTime(y) ? 'The groups on thermal reserve hold out until it is fitted.' : 'It cannot be done before the reserve runs out — the groups on reserve die anyway.', 'Only this loop gets a pump. Loops left off earlier stay off and the stock-saving policy stands: the next failure brings this decision again if a pump and materials are there.']
        },
        cost: y => { y.materials -= WEAR_OPS.pump; },
        effect: y => { wearOp(y, 'pump', `${L}.pump`, y.year, true); wearShop(y, y.year); },   // только этот контур: политика прежняя (решение значит то, что сказано)
        record: { ru: `Насос ${L} ставят авралом; остальное — по прежней политике экономии запаса.`, en: `The ${L} pump is fitted all-hands; everything else stays on the stock-saving policy.` }
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
    // торможение невыполнимо (4в): к началу двигательного участка (и во время него) топлива на STOP → 0 не хватает — конец рейса
    { id: 'brake', next: (s, t0, t1) => { if (!s.fuel || s.terminalAt != null || s.arrive == null || !(s.fuel.short > 1e-9)) return null;
      const at = Math.max(t0, arriveView(s) - M.ENGINE); if (at > t1 + 1e-12 || at > arriveView(s) + 1e-9) return null;
      const w = s.wear, shut = w ? W.TANKS.filter(id => w.nodes[id] && !w.nodes[id].ok && !(w.nodes[id].defect && w.nodes[id].defect.stage === 'heavy')) : [];
      // ремонт перекрытого бака идёт (люди на нём или выдержка) и кончится до середины двигательного участка — ждать его; работа
      // без людей или поздняя — не ждать (иначе финал обходится до прибытия)
      const going = id => w.ops.some(o => { if (o.done || o.target !== id) return false; const j = s.jobs && s.jobs.list.find(x => x.ref === o.id && x.status !== 'done');
        return !!j && (j.status === 'work' || j.status === 'hold') && JB.eta(j, at) <= arriveView(s) - M.ENGINE / 2; });
      if (shut.some(going)) return null;
      const ask = shut.find(id => dangerCan(s, id) && !(s.fuel.brakeAsked || []).includes(id));
      if (ask) return { at, cause: null, go: () => { (s.fuel.brakeAsked = s.fuel.brakeAsked || []).push(ask); return dangerAsk(s, ask, 'isolated', at); } };   // последний шанс — восстановить
      return { at, cause: null, go: () => { wearTerminal(s, at, 'braking'); return null; } }; } },
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
        if (t1 > t0) { erodeSpan(s, t0, t1, rhoAt(s, (t0 + t1) / 2)); if (fuelSpan(s, t0, t1)) book(s, 'wear.leak', t1); t0 = t1; s.simYear = t1; if (s.wear && wearOn(s)) W.touch(s.wear, t1); }   // модель износа дошла до t1
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

    return {
      names: {
        wearRingDecision, dangerOwn, wearTankDecision, wearCargoDecision, wearDangerDecision, wearNext, wearDecision, wearReviseDecision,
        wearShopDecision, wearDonorDecision, inSpan, CAL, CAL_EPS, calPick, calNext, simAdvance
      },
      link: __link
    };
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = wearCards;
  else (root.M31Core = root.M31Core || {}).wearCards = wearCards;
})(typeof globalThis !== 'undefined' ? globalThis : this);
