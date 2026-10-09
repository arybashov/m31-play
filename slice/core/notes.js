// М31 · срез — щит: обслуживание пробоин; приборный журнал и отчёт вахты. Часть content.js: объявленное здесь — в общем реестре частей; имена других частей
// приходят через __link (позднее связывание: после создания всех частей; при загрузке нужны только части выше).
(function (root) {
  'use strict';
  const notes = __core => {
    let EVM, HEADLINE_NAME, INCIDENT_NAME, JB, M, SH, SIM_TITLE, STREAM_MAT5, W, Y, aliveOf, arriveView, beats, book, cloudSpan, cloudThrough, crewName,
    crewOf, dvPct, edgeDays, eqOf, hidden, incYear, jobsLine, kms0, lag, lossesOf, ownStory, pct, pctM, plural, pools, ppl, shieldGaugeV5, streamOn,
    streamPlan, ui, wearOn, wearShop, yrs, yrsEn;
    const __link = () => { ({ EVM, HEADLINE_NAME, INCIDENT_NAME, JB, M, SH, SIM_TITLE, STREAM_MAT5, W, Y, aliveOf, arriveView, beats, book, cloudSpan, cloudThrough, crewName, crewOf, dvPct, edgeDays, eqOf, hidden, incYear, jobsLine, kms0, lag, lossesOf, ownStory, pct, pctM, plural, pools, ppl, shieldGaugeV5, streamOn, streamPlan, ui, wearOn, wearShop, yrs, yrsEn } = __core); };
    __link();

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

    return {
      names: {
        beltOf, canReplace, SHIELD_WORK, serviceDecision, DMG, otherDmg, fullLine, serviceOptions, nf, ENV_NAME, noteText, streamLossLine, edgeLogV5,
        streamLogV5, WEAR_TITLE, simNotes, awakeOf, observeShip, regSpent, LOSS_KEYS, LOSS_NAME, phaseAt, txt, yWhole, spanText, resourceMoves, endDot,
        envsPassed, lc1, POP_WHO, watchReport, wearPart, shopRu, shopEn, coolLine, simReport, storyMarks, evWindow, aliveIds, EV
      },
      link: __link
    };
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = notes;
  else (root.M31Core = root.M31Core || {}).notes = notes;
})(typeof globalThis !== 'undefined' ? globalThis : this);
