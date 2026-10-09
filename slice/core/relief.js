// М31 · срез — партия спасателей. Часть content.js: объявленное здесь — в общем реестре частей; имена других частей
// приходят через __link (позднее связывание: после создания всех частей; при загрузке нужны только части выше).
(function (root) {
  'use strict';
  const relief = __core => {
    let M, cap, f1, nm, nmD, nmG, place, plural, ppl, rescueS, yr, yrs, yrsEn;
    const __link = () => { ({ M, cap, f1, nm, nmD, nmG, place, plural, ppl, rescueS, yr, yrs, yrsEn } = __core); };
    __link();

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

    return {
      names: {
        CAUSE, plan, rsc, shipWhere, passEarthLy, earthStands, CREWED, voyage, grade, reliefResult, sleepersAt, reliefEvents, applyEvents,
        validIncident, INSERTED, marginLine, capLine, OUTCOME_R, aliveLine, signalText, RBEATS, inc0, midRelief, reliefState, relief, reliefButton,
        arriveView
      },
      link: __link
    };
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = relief;
  else (root.M31Core = root.M31Core || {}).relief = relief;
})(typeof globalThis !== 'undefined' ? globalThis : this);
