// М31 · срез — сюжет: акт III · торможение и прибытие. Сцены по порядку (движок идёт по массиву content.beats); собираются в content.js:
// фабрика получает общие имена content.js (помощники, константы, модели) и возвращает сцены акта.
(function (root) {
  'use strict';
  const act3 = K => {
    const {
      DV, EPOCH3, GREET_LAST, M, RESCUE, SHELTER_R, STORM, STREAM, THAW0, THAW_LOSS, Y, Y3, YD, agroLost, aliveOf, arriveX, bad, brakeApply,
      brakeSettle, burnDays, busCheck, busRecord, busRestart, busSplit, canEvade, connectNeed, connectOptions, contactRun, crewOf, darkAt, days,
      daysTo, dd, deadCauses, deliverOptions, discText, dockApply, dvPct, eqOf, f1, f2, fb, greetR, hasIR, heatAgo, homeOptionsR, housedOf, incident,
      isoDays, lag, lossesOf, months, nameAt, nm, nmG, opNormal, opStart, opYear, ownStory, pct, pctFrom, ppl, probeOK, probesLeft, rescueLegacy,
      rescueOptions, rescueS, riskLine, roadDead, sectionHolds, sectionLine, siteRecord, sosEnd, sosKnown, sosOption, src, stagePass, storeLine,
      storeNow, storeR, stormU, streamAt, streamDv, streamLate, streamLogV5, streamOptions, streamPlan, streamTimes, supplyS, supplySrc,
      taskReportText, taskResult, thawAdvance, thawAlive, thawDeadline, thawN, thawNames, vAt, warnAt, win, windowLine, yrs, yrsEn
    } = K;
    return [
    // ------------------------------------------------------------ АКТ III · ТОРМОЖЕНИЕ И ПРИБЫТИЕ
    { id: 's.e1', kind: 'skip', toYear: s => Y3(s),
      label: { ru: s => `Промотать до года ${Math.round(Y3(s))} · смена подхода`, en: s => `Skip ahead to year ${Math.round(Y3(s))} · the approach watch` } },
    {
      // первой в акте: ракурс экрана — вылет паруса с Земли (камера идёт за ним)
      id: 'a3.epoch3', scene: 'epoch3', kind: 'bulletin', year: s => Y3(s),
      act: { ru: 'Акт III · Торможение и прибытие', en: 'Act III · Braking and arrival' },
      title: { ru: s => `Сводка Кольца · отправлена с Земли ${yrs(lag(s, Y3(s)))} назад`, en: s => `Ring bulletin · sent from Earth ${yrsEn(lag(s, Y3(s)))} ago` },
      text: {
        ru: s => `По лучу лазерных станций ушла экспедиция эпохи III: парус, разогнанный светом с Земли до 0,2c, и плазменный магнит для торможения — как у нас, только легче. Второй раз её не разогнать: станции остаются дома.
` + (src(s) ? `Она летит к ${nameAt(EPOCH3.far, 'ru')} — дальше нашей цели — и доберётся до неё быстрее, чем мы до своей.` : (contactRun(s) ? 'Она летит к ε Индейца — к источнику сигнала, куда мы не пошли. Там она будет лет через шестьдесят.' : 'Она летит к ε Индейца, к источнику сигнала: это и есть обещанная следующая экспедиция. Там она будет лет через шестьдесят.')),
        en: s => `An epoch III expedition has left along the beam of the laser stations: a sail driven by light from Earth to 0.2c, and a plasma magnet for braking — like ours, only lighter. It cannot be driven a second time: the stations stay at home.
` + (src(s) ? `It is bound for ${nameAt(EPOCH3.far, 'en')}, farther than our target, and will reach it sooner than we reach ours.` : (contactRun(s) ? 'It is bound for ε Indi — the signal source we did not go to. It will be there in some sixty years.' : 'It is bound for ε Indi, the signal source: this is the promised next expedition. It will be there in some sixty years.'))
      }
    },
    {
      id: 'a3.watch', illus: 'approach-watch', scene: 'ring', kind: 'transcript', year: s => Y3(s),
      title: { ru: 'Смена подхода', en: 'The approach watch' },
      text: {
        ru: s => `Смена подхода принимает корабль. Штурман — Селина Вей. Она училась у Орина Дала в одно из его коротких пробуждений: несколько недель рядом с ним и привычка всё перепроверять. Боится она не самой опасности, а удобного ответа модели там, где чутья уже мало. Кора спит.

Инженер смены — Тамир Вент из группы Б. ` + (!s.choices['d.heat'] ? 'Его группа спала весь дрейф: контур охлаждения обошёлся без компромиссов. Он считает каждый процент запаса.' : s.groupB === 'woken'
          ? 'Его разбудили аварийно, когда Ирсон выбрал полный контур. Он знает, во что кораблю обошлись годы его вахты, и не хочет тратить резерв на то, что можно решить дешевле.'
          : s.blueprint === 'built'
            ? 'Его группу сохранил компромисс Ирсона, а резерв мощности вернул капельный радиатор по чертежу Кольца. Он помнит, сколько материалов ушло на радиатор, и считает каждый процент запаса.'
          : s.highPower
            ? 'Его группу спас второй теплообменник, собранный из материалов для высадки. Он знает, из чего его собрали, и считает каждый процент запаса.'
            : 'О выборе Ирсона он узнал из архива при пробуждении: за его сон заплатили резервом повышенной мощности. Он считает себя должником Ирсона и не хочет тратить оставшийся резерв на то, что можно решить дешевле.'),
        en: s => `The approach watch takes over the ship. The navigator is Selina Vei. She learned from Orin Dal during one of his short wakings: a few weeks beside him and a habit of checking everything twice. What she fears is not danger itself but the opposite: accepting the model's convenient answer where instinct no longer reaches. Kora is asleep.

The watch engineer is Tamir Vent, from group B. ` + (!s.choices['d.heat'] ? 'His group slept through the drift: the cooling loop managed without compromises. He counts every percent of stock.' : s.groupB === 'woken'
          ? 'He was woken in the emergency when Irson chose the full loop. He knows what his years on watch cost the ship, and he does not want the reserve spent on anything that can be solved more cheaply.'
          : s.blueprint === 'built'
            ? "His group was kept by Irson's compromise, and the droplet radiator from the Ring's design brought the high-power reserve back. He remembers how much material the radiator took, and he counts every percent of stock."
          : s.highPower
            ? 'His group was saved by the second exchanger, built from the landing materials. He knows what it was made of, and he counts every percent of stock.'
            : "He learned of Irson's choice from the archive on waking: his sleep was paid for with the high-power reserve. He counts himself Irson's debtor and does not want the remaining reserve spent on anything that can be solved more cheaply.")
      }
    },
    {
      id: 'a3.med', scene: 'vault', overlay: 'sleepers', kind: 'instrument', year: s => Y3(s),
      effect: s => { s.lost = lossesOf(s, Y3(s)).total + s.dead; },
      title: { ru: 'Медицинский журнал · итог дрейфа', en: 'Medical log · the drift in sum' },
      text: {
        ru: s => { const L = lossesOf(s, Y3(s)); return `Погибли в пути: ${ppl(L.total + s.dead)}.
Отказы капсул: ${L.capsule}. Смерть при пробуждении: ${L.revival}. Несчастные случаи на вахте: ${L.accident}. Рак от облучения: ${L.cancer}.${s.dead ? ` В происшествиях: ${s.dead}.` : ''}
Имена умерших читают вслух на каждой пересменке; список висит у входа в зал анабиоза.
Облучение продолжает счёт: у спящих раки проявятся годы спустя, уже у цели. По модели — ещё около ${L.later}.`; },
        en: s => { const L = lossesOf(s, Y3(s)); return `Died on the road: ${L.total + s.dead}.
Capsule failures: ${L.capsule}. Deaths on waking: ${L.revival}. Accidents on watch: ${L.accident}. Radiation cancers: ${L.cancer}.${s.dead ? ` In incidents: ${s.dead}.` : ''}
The names of the dead are read aloud at every handover; the list hangs at the entrance to the anabiosis hall.
The radiation keeps counting: in the sleepers, cancers will show years later, at the target. The model expects about ${L.later} more.`; }
      }
    },

    { id: 's.e2', kind: 'skip', toYear: warnAt, when: s => !supplyS(s),
      label: { ru: s => `Промотать до года ${s.arrive - 5} · вход в систему`, en: s => `Skip ahead to year ${s.arrive - 5} · entering the system` } },
    // ---- у источника сигнала: Тёмная звезда
    {
      id: 'a3.dark', scene: 'dark', kind: 'instrument', year: warnAt, when: src,
      title: { ru: 'Навигационный журнал · вход в систему', en: 'Navigation log · entering the system' },
      text: {
        ru: s => `Скорость ${fb(vAt(s, warnAt(s)), 'ru')}. Вход в систему ${nmG(s)}.
Тёмная звезда: пара коричневых карликов классов T1 и T6 в полутора тысячах а.е. от главной звезды. В видимом свете их почти нет, в инфракрасном они ярки; вахта ведёт их ${hasIR(s) ? `с года ${Y(s, 0.87)} — инфракрасной обсерваторией из паспорта` : 'последние три года'}. Источник сигнала — у них.
Неизвестно: поток пыли, который пара собирает из слабого пояса обломков — с Земли его не видно.`,
        en: s => `Velocity ${fb(vAt(s, warnAt(s)), 'en')}. Entering the ${nm(s, 'en')} system.
The Dark Star: a pair of brown dwarfs, classes T1 and T6, fifteen hundred AU from the main star. In visible light they are almost absent; in infrared they are bright. The watch has tracked them ${hasIR(s) ? `since year ${Y(s, 0.87)} — with the infrared observatory from the passport` : 'for the last three years'}. The signal source is beside them.
Unknown: the dust stream the pair gathers from a faint debris belt — too faint to see from Earth.`
      }
    },
    {
      id: 'a3.error', scene: 'dark', kind: 'transcript', year: warnAt, when: src,
      title: { ru: 'Ошибка вахты', en: 'The watch error' },
      text: {
        ru: `На вахте — Дан Осгер и двое инженеров; до конца смены два дня. Счётчики ударов на фронтальном щите медленно растут. Дан давно не интерпретатор: он записывает рост как скачок плотности среды — по инструкции Орина, ниже её порога.

Когда порог пересечён, будят Селину. Шесть часов до ясного сознания. Селина разворачивает инфракрасный телескоп вбок от щита и видит слабое свечение пылевого хвоста: корабль идёт по краю потока к карлику. Несколько дней уже потеряны.

Один из инженеров требует записать ошибку на Дана. Селина открывает инструкцию: порог задал Орин — для межзвёздной среды, а не для потока у тёмного тела.`,
        en: `On watch are Dan Osger and two engineers; two days left of the shift. The impact counters on the forward shield are slowly rising. Dan stopped being an interpreter long ago: he logs the rise as a jump in medium density — under Orin's instruction, below its threshold.

When the threshold is crossed, they wake Selina. Six hours to clear consciousness. Selina turns the infrared telescope aside from the shield and sees the faint glow of a dust tail: the ship is running along the edge of a stream toward the dwarf. Several days are already lost.

One of the engineers demands the error be put down to Dan. Selina opens the instruction: the threshold was set by Orin — for the interstellar medium, not for a stream around a dark body.`
      }
    },
    {
      id: 'a3.check', scene: 'dark', kind: 'transcript', year: warnAt, when: src,
      title: { ru: 'Совет смены · поток', en: 'Watch council · the stream' },
      text: {
        ru: s => `Окно для манёвра — ${days(win(s), 'ru')}; прежняя задержка вахты уже учтена. Измерение может и не захватить опасную полосу.\n\nНаучная модель оценивает проход по краю потока как безопасный — 91%, при условии, что модель верна и набор гипотез полон. Селина поднимает архивный отчёт другой экспедиции Кольца: там верно определили природу похожего объекта и ошиблись в плотности потока вокруг. Спектр рассеянного света с такого расстояния не различает, мелкая там пыль или крупная.

— Разбудить Кору, — говорит Селина. — Она увидит неоднозначность раньше нас.

Врач называет цену: у Коры один полный цикл. Пробуждение будет последним, три недели до работоспособности.

— Не надо будить, — говорит Тамир. — Нужна не догадка, а измерение. ${probesLeft(s) ? (eqOf(s).probes === 'inspect' ? 'Инспекционный зонд ещё в трюме' : 'Второй зонд из комплекта ещё в трюме') : 'Малый зонд с прямыми детекторами частиц соберём из материалов'}.`,
        en: s => `The manoeuvre window is ${days(win(s), 'en')}; the watch's earlier delay is already counted. A measurement may not catch the dangerous band.\n\nThe science model rates passage along the stream's edge as safe — 91%, given the model is correct and the hypothesis set complete. Selina pulls an archived report from another Ring expedition: they identified the nature of a similar object correctly and got the density of the stream around it wrong. From this range the spectrum of scattered light cannot tell fine dust from coarse.

"Wake Kora," says Selina. "She'll see the ambiguity sooner than we will."

The physician names the price: Kora has one full cycle left. This waking will be her last, and three weeks to working fitness.

"Don't wake her," says Tamir. "We need a measurement, not a guess. ${probesLeft(s) ? (eqOf(s).probes === 'inspect' ? 'The inspection probe is still in the hold' : 'The second probe from the kit is still in the hold') : "We'll build a small probe with direct particle detectors out of the materials"}."`
      }
    },
    {
      id: 'd.stream', scene: 'dark', kind: 'decision', year: warnAt, when: src,
      title: { ru: 'Поток у Тёмной звезды', en: 'The stream at the Dark Star' },
      context: {
        ru: 'Через несколько дней поток будет ближе. Решение не отложить.',
        en: 'In a few days the stream will be closer. The decision cannot wait.'
      },
      rec: s => probeOK(s) ? { id: 'probe', why: { ru: 'прямое измерение быстрее всего', en: 'a direct measurement is fastest' } }
        : (s.taught || s.koraYear) ? { id: 'student', why: { ru: 'зонда нет; Кору бережём для цели', en: 'no probe; Kora is kept for the target' } }
        : { id: 'kora', why: { ru: 'зонда нет, читать спектр больше некому', en: 'no probe and no one else to read the spectrum' } },
      options: streamOptions
    },
    {
      id: 'd.streamRoute', scene: 'dark', kind: 'decision', when: s => src(s) && !!s.streamCheck && !s.streamRoute,
      year: s => Math.min(streamTimes(s).warn + (s.streamDays || 0) / 365.25, streamTimes(s).core),   // решение — когда проверка закончена
      title: { ru: 'Уходить из потока?', en: 'Leave the stream?' },
      context: {
        ru: s => `${s.streamFound ? 'Опасная полоса пересекает курс.' : 'Опасной полосы на курсе не видно — метод видит её не всегда.'} ${windowLine(s, 'ru')}`,
        en: s => `${s.streamFound ? 'The dangerous band crosses our course.' : 'No dangerous band on our course — the method does not always see it.'} ${windowLine(s, 'en')}`
      },
      rec: s => s.streamFound ? (canEvade(s) && !streamLate(s) ? { id: 'evade', why: { ru: 'полоса на курсе, уйти успеваем', en: 'the band is on our course and we are in time' } }
        : canEvade(s) && streamTimes(s).warn + ((s.streamDays || 0) + burnDays(s)) / 365.25 < streamTimes(s).exit ? { id: 'evade', why: { ru: 'до ядра не успеваем, но манёвр сократит время в нём', en: 'we cannot clear the core in time, but the manoeuvre shortens the time inside it' } }
        : { id: 'pass', why: { ru: 'уйти уже не успеваем: удар будет тем же, резерв сбережём', en: 'we can no longer leave in time: the strike will be the same, so the reserve is kept' } })
        : { id: 'pass', why: { ru: 'полосы на курсе не видно', en: 'no band seen on our course' }, assume: { ru: 'опасная полоса не пересекает курс', en: 'the dangerous band does not cross our course' } },
      options: s => (canEvade(s) ? [{
        id: 'evade', label: { ru: 'Уходить', en: 'Leave' },
        known: {
          ru: s => [`Резерв манёвров −${f1(streamDv(s), 'ru')}% паспортного.`, windowLine(s, 'ru')],
          en: s => [`Manoeuvre reserve −${f1(streamDv(s), 'en')}% of rated.`, windowLine(s, 'en')]
        },
        cost: st => { st.reserve -= streamDv(st); },
        effect: st => { st.reserve -= streamDv(st); st.streamRoute = 'evade'; },
        record: { ru: 'Совет решает уходить с края потока.', en: 'The council decides to leave the edge of the stream.' }
      }] : []).concat([{
        id: 'pass', label: { ru: 'Пройти по краю', en: 'Pass along the edge' },
        known: {
          ru: s => ['Резерв манёвров цел.', s.streamFound ? 'Полоса на курсе: удар неизбежен.' : `Признак полосы не обнаружен; метод видит её ${pctFrom(STREAM.sense[s.streamCheck], 'ru')}.`, riskLine(s, 'ru')],
          en: s => ['The manoeuvre reserve is kept.', s.streamFound ? 'The band is on our course: the strike is certain.' : `No sign of the band detected; the method sees it ${pctFrom(STREAM.sense[s.streamCheck], 'en')}.`, riskLine(s, 'en')]
        },
        effect: st => { st.streamRoute = 'pass'; },
        record: { ru: 'Совет решает пройти по краю, не меняя курса.', en: 'The council decides to pass along the edge without changing course.' }
      }])
    },
    {
      id: 'a3.hit1', scene: 'dark', kind: 'instrument', year: s => streamPlan(s).coreEnd,   // удар и последствия считает модель щита
      when: s => src(s) && streamPlan(s).hit,
      title: { ru: 'Журнал вахты · удар потока', en: 'Watch log · the stream hits' },
      text: {
        ru: s => streamLogV5(s, 'ru'),
        en: s => streamLogV5(s, 'en')
      }
    },
    {
      id: 'x.lost', scene: 'dark', kind: 'end', year: streamAt, when: s => s.lostShip,
      title: { ru: 'Последняя передача', en: 'The last transmission' },
      text: {
        ru: s => `Поток прошёл сквозь сектор щита, пробитый ещё у облака. За ним — магистрали зала анабиоза. Манёвра, который увёл бы корабль за шесть часов, не было: теплообменники отдали группе Б, а слабые коррекции заняли бы дни.

Последняя передача ушла на Землю и к Кольцу: журнал, измеренный поток, медицинский журнал, имена. Она дойдёт через ${yrs(Math.round(M.star(s.target).d))}.

Остов кувыркается и уходит дальше по прежней траектории: на ${f1(M.speedAt(s.year, s.beta, s.arrive, s.tMag) * 299792.458, 'ru')} км/с ни карлик, ни ε Индейца его не удержат — он пройдёт систему насквозь. Обломки щита летят рядом.

Экспедиция окончена. Следующая — к другой цели — получит измеренный поток, журнал и траекторию остова.`,
        en: s => `The stream went through the shield sector breached back at the cloud. Behind it lay the anabiosis hall's mains. There was no manoeuvre to take the ship out in six hours: the heat exchangers had gone to group B, and weak corrections would have taken days.

The last transmission went to Earth and the Ring: the log, the measured stream, the medical log, the names. It will arrive in ${yrsEn(Math.round(M.star(s.target).d))}.

The wreck tumbles on along its former trajectory: at ${f1(M.speedAt(s.year, s.beta, s.arrive, s.tMag) * 299792.458, 'en')} km/s neither the dwarf nor ε Indi can hold it — it will pass straight through the system. Shield fragments fly beside it.

The expedition is over. The next one — to another target — will receive the measured stream, the log and the trajectory of the wreck.`
      }
    },
    {
      id: 'a3.burn', scene: 'dark', kind: 'instrument', year: s => s.streamRoute === 'evade' ? streamPlan(s).done : s.arrive - 5, when: s => src(s) && s.streamRoute === 'evade',
      title: { ru: 'Инженерный журнал · манёвр', en: 'Engineering log · manoeuvre' },
      text: {
        ru: s => !s.highPower ? `Безопасный манёвр — короткий и мощный, но резерв повышенной мощности отдан группе Б ${yrs(heatAgo(s))} назад. Остаётся серия слабых коррекций: двенадцать суток.${s.streamHit ? '' : ' Корабль уходит с края потока.'}
Резерв манёвров: −${f1(dvPct(s, DV.streamWeak), 'ru')}%.
Траектория изменена: корабль пройдёт у самого карлика.`
          : `Безопасный манёвр один — короткий и мощный. Контур с резервом повышенной мощности держит его: корабль уходит с края потока за шесть часов.\nРезерв манёвров: −${f1(dvPct(s, DV.stream), 'ru')}%.\nТраектория изменена: корабль пройдёт у самого карлика.`,
        en: s => !s.highPower ? `The safe manoeuvre is short and powerful, but the high-power reserve went to group B ${yrsEn(heatAgo(s))} ago. What remains is a series of weak corrections: twelve days.${s.streamHit ? '' : ' The ship leaves the edge of the stream.'}
Manoeuvre reserve: −${f1(dvPct(s, DV.streamWeak), 'en')}%.
Trajectory changed: the ship will pass close by the dwarf.`
          : `There is one safe manoeuvre — short and powerful. The loop with the high-power reserve holds it: the ship leaves the stream edge in six hours.\nManoeuvre reserve: −${f1(dvPct(s, DV.stream), 'en')}%.\nTrajectory changed: the ship will pass close by the dwarf.`
      }
    },
    {
      id: 'd.sos.stream', scene: 'dark', kind: 'decision', when: s => src(s) && s.streamHit === 2 && !s.lostShip,
      title: { ru: 'Звать помощь?', en: 'Call for help?' },
      context: {
        ru: s => `Блок из двадцати пяти капсул потерян. Остальные блоки изолированы; охлаждение зала идёт по обходным магистралям. До орбиты у ${nmG(s)} — пять лет торможения.

Можно идти к цели как есть. Можно уснуть всем, кроме двенадцати, и звать помощь.`,
        en: s => `A block of twenty-five capsules is lost. The other blocks are isolated; the hall is cooled through bypass mains. Five years of braking remain to orbit at ${nm(s, 'en')}.

They can go on to the target as they are. Or everyone but twelve can go to sleep and call for help.`
      },
      options: [{
        id: 'carry',
        label: { ru: 'Идти к цели как есть', en: 'Go on to the target as we are' },
        known: {
          ru: ['Экспедиция продолжается: прибытие через пять лет.', 'Обходные магистрали держат, пока их обслуживают.'],
          en: ['The expedition goes on: arrival in five years.', 'The bypass mains hold as long as they are tended.']
        },
        effect: st => {},
        record: {
          ru: 'Совет решает идти дальше. Вахта учится жить рядом с пустым блоком.',
          en: 'The council decides to go on. The watch learns to live next to the empty block.'
        }
      }, sosOption('stream')]
    },
    sosEnd('stream', 'vault'),
    // ---- у других целей
    {
      id: 'a3.flare', scene: 'drift', kind: 'instrument', year: s => s.arrive - 5, when: s => !src(s) && M.isRedDwarf(s.target) && !ownStory(s),
      effect: s => { if (!hasIR(s)) s.materials -= 5; },
      title: { ru: 'Журнал вахты · вспышка звезды', en: 'Watch log · stellar flare' },
      text: {
        ru: s => `Скорость ${fb(vAt(s, s.arrive - 5), 'ru')}. Вспышка ${nmG(s)}: за несколько минут звезда стала ярче в рентгене в тысячи раз. Красные карлики вспыхивают часто; у самой звезды такие потоки сдирают атмосферы планет.
` + (hasIR(s)
          ? 'Инфракрасная обсерватория заметила рост активного пятна за трое суток. Вахта заранее ушла в убежище, корабль развернули щитом к звезде. Потерь нет.'
          : 'Предупреждения не было. Вахта добралась до убежища за сорок минут; доза — как за год дрейфа. Антенны плазменного магнита и радиаторы обожжены; ремонт — из материалов для высадки, −5%.'),
        en: s => `Velocity ${fb(vAt(s, s.arrive - 5), 'en')}. A flare on ${nm(s, 'en')}: within minutes the star grew thousands of times brighter in X-rays. Red dwarfs flare often; close to the star such storms strip the atmospheres off planets.
` + (hasIR(s)
          ? 'The infrared observatory saw the active spot growing three days ahead. The watch went to the shelter in advance and the ship was turned shield-first to the star. No losses.'
          : 'There was no warning. The watch reached the shelter in forty minutes; the dose was a year of drift. The plasma magnet antennas and the radiators are scorched; repairs from landing materials, −5%.')
      }
    },
    {
      id: 'a3.approach', scene: 'drift', kind: 'instrument', year: s => s.arrive - 5, when: s => !src(s) && !M.isRedDwarf(s.target),
      title: { ru: 'Навигационный журнал · вход в систему', en: 'Navigation log · entering the system' },
      text: {
        ru: s => `Скорость ${fb(vAt(s, s.arrive - 5), 'ru')}. Вход в систему ${nmG(s)}. Телескоп корабля видит планеты сам — без зондов и снимков Кольца.` + (s.worldSeen ? ' То, что было известно, подтверждается.' : ' Какой там мир, станет ясно у орбиты.'),
        en: s => `Velocity ${fb(vAt(s, s.arrive - 5), 'en')}. Entering the ${nm(s, 'en')} system. The ship's telescope sees the planets itself — no probes, no Ring images.` + (s.worldSeen ? ' What was known is confirmed.' : ' What kind of world it is will become clear at orbit.')
      }
    },

    // ---- спасатель v3: магнит тормозит слабее расчётного
    {
      id: 'a3r.brake', scene: 'sail', kind: 'instrument', year: s => s.arrive - 4.75, when: rescueS,
      title: { ru: 'Навигационный журнал · меньше расчётного', en: 'Navigation log · below the calculation' },
      text: {
        ru: s => `Акселерометры и независимая навигация показывают одно: магнит тормозит слабее расчётного. Ная проверяет плазменный анализатор — среда разрежена. Селина выводит предел поправки: ещё ${dd(RESCUE.delay, 'ru')}, если участок протяжённый.

— Орин оставил нам расчёт. Решать, сколько ему ещё верить, приходится нам.

${s.scout ? 'Передовые измерения зонда лежат в архиве необработанными.' : 'Передовых измерений нет: зонд не выпускали.'}`,
        en: s => `The accelerometers and independent navigation agree: the magnet is braking less than calculated. Naya checks the plasma analyser — the medium is sparse. Selina displays the correction limit: another ${dd(RESCUE.delay, 'en')} if the stretch is extensive.

"Orin left us the calculation. We have to decide how much longer to trust it."

${s.scout ? "The probe's forward measurements sit in the archive, unprocessed." : 'There are no forward measurements: no probe was launched.'}`
      }
    },
    {
      id: 'd.rescueBrake', scene: 'sail', kind: 'decision', when: rescueS,
      title: { ru: 'Сберечь срок или резерв', en: 'Preserve time or reserve' },
      context: {
        ru: `Если разрежение протяжённое, прибытие сдвинется на ${RESCUE.delay} суток. Состояние склада известно только по сводке «штатно»: какой запас времени у Оттепели, станет ясно у склада.`,
        en: `If the sparse stretch is extensive, arrival moves by ${RESCUE.delay} days. The store's state is known only from the summary "nominal": how much time Thaw has will be clear only at the store.`
      },
      rec: s => { const burn = s.reserve >= dvPct(s, RESCUE.burn);
        return burn && s.scout ? { id: 'measure', why: { ru: 'передовые данные ещё можно использовать для ранней коррекции', en: 'forward data can still guide an early correction' }, assume: { ru: 'измеренный участок представляет оставшийся путь торможения', en: 'the measured stretch represents the remaining braking path' } }
          : burn ? { id: 'burn', why: { ru: 'запас склада неизвестен — время дороже резерва', en: "the store's margin is unknown — time is worth more than reserve" }, assume: { ru: 'остатка резерва хватит на работу у склада', en: 'the remaining reserve will cover work at the store' } }
          : { id: 'wait', why: { ru: 'резерва на коррекцию нет', en: 'there is no reserve for a correction' }, assume: { ru: 'магнит завершит торможение в объявленном диапазоне', en: 'the magnet will finish within the stated range' } }; },
      options: s => { const burn = s.reserve >= dvPct(s, RESCUE.burn), out = [];
        const pct = lang => `${f1(dvPct(s, RESCUE.burn), lang)}% (${RESCUE.burn} ${lang === 'ru' ? 'км/с' : 'km/s'})`;
        const record = { ru: s2 => s2.brakeMethod === 'wait' ? 'Корабль тормозит магнитом. Поправку покажет навигационная сверка.' : s2.brakeFound ? `Передовые данные показывают протяжённый участок разрежения. Импульс даётся сразу: резерв −${pct('ru')}.`
            : s2.brakeMethod === 'measure' ? 'В передовых данных протяжённого участка не видно. Корабль тормозит магнитом.' : `Импульс даётся сейчас: резерв −${pct('ru')}. Прибытие — по паспорту.`,
          en: s2 => s2.brakeMethod === 'wait' ? 'The ship brakes on the magnet. The navigation check will show the correction.' : s2.brakeFound ? `The forward data show an extensive sparse stretch. The impulse is given at once: reserve −${pct('en')}.`
            : s2.brakeMethod === 'measure' ? 'The forward data show no extensive stretch. The ship brakes on the magnet.' : `The impulse is given now: reserve −${pct('en')}. Arrival as in the passport.` };
        if (burn && s.scout) out.push({ id: 'measure', label: { ru: 'Проверить передовые измерения', en: 'Check the forward measurements' },
          known: { ru: ['Трое суток на обработку данных зонда; корабль тем временем тормозит, прибытие не сдвигается.', `Найдём протяжённый участок — сразу импульс: резерв манёвров −${pct('ru')}.`, 'Передовые данные видят такой участок в восьми случаях из десяти; отрицательный результат не исключает разрежения.'],
            en: ["Three days to process the probe's data; the ship keeps braking meanwhile, arrival does not move.", `If we find an extensive stretch, an impulse at once: manoeuvre reserve −${pct('en')}.`, 'Forward data show such a stretch eight times in ten; a negative result does not rule out a sparse medium.'] },
          effect: st => brakeApply(st, 'measure'), record });
        if (burn) out.push({ id: 'burn', label: { ru: 'Добавить тормозной импульс', en: 'Add a braking impulse' },
          known: { ru: [`Резерв манёвров −${pct('ru')}.`, 'Поправка на разрежение снята: прибытие — по паспорту, каким бы ни оказался участок. Потерянного времени и людей импульс не вернёт.'],
            en: [`Manoeuvre reserve −${pct('en')}.`, 'The sparse-medium correction is removed: arrival as in the passport, whatever the stretch turns out to be. The impulse cannot recover time or people already lost.'] },
          cost: st => { st.reserve -= dvPct(st, RESCUE.burn); },
          effect: st => brakeApply(st, 'burn'), record });
        out.push({ id: 'wait', label: { ru: 'Ждать магнит', en: 'Wait for the magnet' },
          known: { ru: ['Без расхода.', `Если разрежение протяжённое, прибытие позже на ${RESCUE.delay} суток: каждые сутки опоздания вычитаются из запаса склада, каким бы он ни оказался.`],
            en: ['No expenditure.', `If the sparse stretch is extensive, arrival is ${RESCUE.delay} days later: every day of delay comes out of the store's margin, whatever it turns out to be.`] },
          effect: st => brakeApply(st, 'wait'), record });
        return out; }
    },
    // ---- мимо Тёмной звезды (только у источника): пара в 1460 а.е. от пути — журнал тридцать второй принимают по радио
    { id: 's.e4', kind: 'skip', toYear: darkAt, when: src,
      label: { ru: s => `Промотать до года ${Math.floor(darkAt(s))} · мимо Тёмной звезды`, en: s => `Skip ahead to year ${Math.floor(darkAt(s))} · past the Dark Star` } },
    {
      id: 'a3.disc', scene: 'relic', kind: 'transcript', year: darkAt, when: src,
      effect: s => { s.sourceFound = true; },                          // источник локализован, журнал тридцать второй принят
      title: { ru: 'Мимо Тёмной звезды', en: 'Past the Dark Star' },
      text: { ru: s => discText(s, 'ru'), en: s => discText(s, 'en') }
    },
    {
      id: 'a3.phrase', scene: 'relic', kind: 'document', year: darkAt, when: src,
      title: { ru: 'Журнал тридцать второй · запись без номера', en: "The Thirty-Second's log · unnumbered entry" },
      text: {
        ru: `«Вспоминали сегодня Землю. Она красивее всего, что мы видели за всю дорогу».

Речь шла не о мире у Тёмной звезды — о доме, куда они не вернутся. Обрывок этой фразы дошёл до Земли и стал присказкой, с которой летел корабль.

Архив записывает полный текст рядом с обрывком, без комментария.`,
        en: `"We remembered Earth today. It is more beautiful than anything we have seen on the whole road."

It was not about the world at the Dark Star — it was about the home they would not return to. A fragment of this sentence reached Earth and became the saying the ship flew with.

The archive records the full text beside the fragment, without comment.`
      }
    },
    {
      id: 'a3.kora', illus: 'beacon-memory', scene: 'relic', kind: 'transcript', year: darkAt, when: src,
      effect: s => { if (!s.koraLast) { s.koraLast = true; s.koraAwake += 1; } },
      title: { ru: 'Память маяка', en: "The beacon's memory" },
      text: {
        ru: s => (s.koraLast ? 'Кора уже на вахте — со своего последнего пробуждения.' : 'Для чтения памяти диска и журнала совет будит Кору — её последний цикл.') + ` Ей около сорока. Дан Осгер, её ученик, за десятилетия ремонтных смен стал старше своей учительницы.

Они работают вместе над фрагментами. Навигационные записи маяка читаются частично и указывают на другие точки. Один фрагмент — повторяющийся, почти музыкальный узор без видимого назначения — не может прочесть и Кора. Архив записывает его как есть.

Ни одна станция Кольца не регистрировала сигналов того же типа кода.`,
        en: s => (s.koraLast ? 'Kora is already on watch — since her last waking.' : 'To read the memory of the disc and the log, the council wakes Kora — her last cycle.') + ` She is about forty. Dan Osger, her student, has over decades of repair watches grown older than his teacher.

They work on the fragments together. The beacon's navigation records read in part and point to other places. One fragment — a repeating, almost musical pattern with no visible purpose — not even Kora can read. The archive records it as it is.

No station of the Ring has ever registered signals with that type of code.`
      }
    },

    { id: 's.e3', kind: 'skip', toYear: s => s.arrive - 4,
      label: { ru: s => `Промотать до года ${s.arrive - 4} · разворот`, en: s => `Skip ahead to year ${s.arrive - 4} · the turnaround` } },
    {
      id: 'a3.flip', scene: 'flip', kind: 'instrument', year: s => s.arrive - 4,
      title: { ru: 'Инженерный журнал · последний участок', en: 'Engineering log · the last leg' },
      text: {
        ru: s => `Скорость ${fb(vAt(s, s.arrive - 4), 'ru')}. Плазменный магнит выключен: на малой скорости пузырь разрастается до десятков тысяч километров и тормозит неточно, а для входа в систему нужна тяга.
Корабль развёрнут кормой вперёд. Двигатель ядра гасит остаток скорости за четыре года.
Щит теперь смотрит назад. На такой скорости удар пылинки в ${Math.round((s.beta / vAt(s, s.arrive - 4)) ** 2)} раз слабее, чем в дрейфе.
Ступень разгона прошла систему ${yrs(s.arrive - 4 - stagePass(s))} назад, в тысяче а.е. в стороне. Её никто не видел.`,
        en: s => `Velocity ${fb(vAt(s, s.arrive - 4), 'en')}. The plasma magnet is off: at low speed the bubble swells to tens of thousands of kilometres and brakes imprecisely, and entering the system needs thrust.
The ship is turned stern-first. The core engine takes off the remaining speed over four years.
The shield now faces backward. At this speed a dust grain hits ${Math.round((s.beta / vAt(s, s.arrive - 4)) ** 2)} times softer than in the drift.
The acceleration stage passed the system ${yrsEn(s.arrive - 4 - stagePass(s))} ago, a thousand AU aside. No one saw it.`
      }
    },
    {
      id: 'a3r.brakeResult', scene: 'flip', kind: 'instrument', year: s => s.arrive - 4, when: rescueS,
      effect: s => brakeSettle(s),
      title: { ru: 'Навигационный журнал · исправленная дата', en: 'Navigation log · the corrected date' },
      text: {
        ru: s => `Навигационная сверка завершена. Прибытие — год ${f2(arriveX(s), 'ru')}; ${s.brakeDelay ? `позже паспорта на ${dd(s.brakeDelay, 'ru')}: участок разрежения оказался протяжённым` : 'по паспорту'}.${s.brakeMethod === 'burn' || s.brakeFound ? (s.brakeLong ? ' Импульс пригодился: без него опоздание было бы ' + dd(RESCUE.delay, 'ru') + '.' : ' Участок оказался коротким: импульс не понадобился.') : ''}

Селина отправляет исправленную лоцию и сохраняет прежнюю рядом. В строке Оттепели отдельно стоят прогноз живых к завершению помощи и ближайший порог потери.`,
        en: s => `The navigation check is complete. Arrival: year ${f2(arriveX(s), 'en')}; ${s.brakeDelay ? `${dd(s.brakeDelay, 'en')} later than the passport: the sparse stretch was extensive` : 'as in the passport'}.${s.brakeMethod === 'burn' || s.brakeFound ? (s.brakeLong ? ` The impulse paid off: without it we would be ${dd(RESCUE.delay, 'en')} late.` : ' The stretch was short: the impulse was not needed.') : ''}

Selina sends the corrected sailing directions and keeps the original beside them. Thaw's entry lists the forecast living count at the end of assistance and the next loss threshold separately.`
      }
    },

    // ---- прибытие
    { id: 's.e5', kind: 'skip', toYear: s => rescueS(s) ? arriveX(s) : s.arrive,
      label: { ru: s => rescueS(s) ? 'Промотать до прибытия к складу' : `Промотать до года ${s.arrive} · прибытие`, en: s => rescueS(s) ? 'Skip ahead to the arrival at the store' : `Skip ahead to year ${s.arrive} · arrival` } },
    {
      id: 'a3.orbit', scene: 'arrival', kind: 'instrument', year: s => rescueS(s) ? arriveX(s) : s.arrive,
      effect: s => { s.worldSeen = M.worldOf(s.target); },
      title: { ru: 'Навигационный журнал · прибытие', en: 'Navigation log · arrival' },
      text: {
        ru: s => { const w = M.worldOf(s.target); return (w === 'none' ? `Корабль на орбите ${nmG(s)}, в поясе жизни. ` : `Корабль на орбите планеты у ${nmG(s)}. `) + ({
          open: 'Ближняя к поясу жизни планета: вода, облака, суша. Воздух по спектрам пригоден для дыхания — после проверки на месте.',
          dome: 'Планета приливно захвачена: пар на дневной стороне, лёд на ночной. Жить можно на терминаторе, под куполами.',
          hostile: 'Под сплошной облачной крышей — парник, поверхность горячее четырёхсот градусов. Высадки не будет.',
          ruined: 'Кора планеты расколота; по разломам светится расплав, вокруг — дуга обломков. Высадки не будет.',
          none: 'Пригодного мира нет: в поясе жизни пусто, известные планеты слишком горячи или без твёрдой поверхности.'
        })[w] + `
Резерв манёвров: ${f1(s.reserve, 'ru')}% паспортного. Материалы для высадки: ${Math.round(s.materials)}% запаса.
` + (ownStory(s) ? '' : s.support === 'found' ? 'Корабль поддержки в пути: у точки встречи будет через год.' : 'Точка встречи с кораблём поддержки пуста. Маяки сброшены.'); },
        en: s => { const w = M.worldOf(s.target); return (w === 'none' ? `The ship is in orbit around ${nm(s, 'en')}, in the habitable zone. ` : `The ship is in orbit around a planet of ${nm(s, 'en')}. `) + ({
          open: 'The planet nearest the habitable zone: water, clouds, land. By the spectra the air is breathable — once checked on site.',
          dome: 'The planet is tidally locked: vapour on the day side, ice on the night side. Life is possible on the terminator, under domes.',
          hostile: 'Beneath an unbroken cloud deck, a greenhouse: the surface is hotter than four hundred degrees. There will be no landing.',
          ruined: "The planet's crust is split; melt glows along the faults, and an arc of debris surrounds it. There will be no landing.",
          none: 'There is no habitable world: the habitable zone is empty, and the known planets are too hot or have no solid surface.'
        })[w] + `
Manoeuvre reserve: ${f1(s.reserve, 'en')}% of rated. Landing materials: ${Math.round(s.materials)}% of stock.
` + (ownStory(s) ? '' : s.support === 'found' ? 'The support ship is on its way: it will reach the rendezvous in a year.' : 'The rendezvous point with the support ship is empty. Beacons dropped.'); }
      }
    },
    {
      id: 'a3c.greeting', illus: 'colony-greeting', scene: 'arrival', kind: 'transcript', year: s => s.arrive,
      when: s => s.mission === 'contact' && !!M.colonyAt(s.target) && M.colonyAt(s.target).awake > 0 && ['viable', 'establishing', 'declining'].includes(M.colonyAt(s.target).status),
      effect: s => { s.colonyLink = true; },                           // двусторонняя связь с поселением состоялась
      title: { ru: s => `«${M.colonyAt(s.target).ru}» · связь`, en: s => `${M.colonyAt(s.target).en} · contact` },
      text: {
        ru: s => { const c = M.colonyAt(s.target), L = roadDead(s); return `— Сорок первая, говорит дежурная поселения «${c.ru}». Ваш вызов принят. Добро пожаловать в систему.

Первые пакеты ещё разделены минутами светового хода; Селина Вей передаёт ответы целиком, не перебивая запись.

— Идём по программе контакта. Нас ${ppl(aliveOf(s))}, включая спящих. Присылаем медицинский журнал и перечень запасов.

${L > 0 ? `— В пути умерли ${ppl(L)}. В списке они отмечены отдельно; прошу сохранить их имена.` : '— Потерь в пути нет. Сверьте, пожалуйста, наш список.'}

${c.status === 'declining' ? '— Мы сами держимся на пределе. Встречающую группу примем; размещение остальных придётся рассчитывать вместе.' : c.status === 'establishing' ? '— Поселение ещё строится. Встречающую группу примем; для остальных сначала посчитаем жильё, воду и рабочие руки.' : '— Встречающую группу примем. Приём всей экспедиции обсудим с вами после проверки жилья, питания и медицинских смен.'}

Позднее в орбитальном узле их встречают дежурная и техник; на столе лежат две ведомости, корабельная и местная.

${(GREET_LAST[c.id] || GREET_LAST.default).ru}`; },
        en: s => { const c = M.colonyAt(s.target), L = roadDead(s); return `"Forty-First, this is the duty officer of ${c.en}. Your call is received. Welcome to the system."

The first packets are still separated by minutes of light travel; Selina Vei sends complete replies without interrupting the recording.

"We are here under the contact programme. There are ${aliveOf(s)} of us, including sleepers. We're sending our medical log and stores inventory."

${L > 0 ? `"${L} died on the way. They are listed separately; please preserve their names."` : '"There were no losses on the way. Please check our roster."'}

${c.status === 'declining' ? '"We are at our own limits. We can receive your visiting party; accommodating everyone else will take a joint assessment."' : c.status === 'establishing' ? '"The settlement is still being built. We can receive your visiting party; first we must work out housing, water and labour for the others."' : '"We can receive your visiting party. We\'ll discuss taking everyone in after checking housing, food and medical staffing."'}

Later, at the orbital facility, the duty officer and a technician meet them; two inventories lie on the table, the ship's and the settlement's.

${(GREET_LAST[c.id] || GREET_LAST.default).en}`; }
      }
    },
    {
      id: 'a3c.silence', scene: 'arrival', kind: 'transcript', year: s => s.arrive,
      when: s => s.mission === 'contact' && !!M.colonyAt(s.target) && M.colonyAt(s.target).status === 'dead',
      title: { ru: s => `«${M.colonyAt(s.target).ru}» · вызов`, en: s => `${M.colonyAt(s.target).en} · the call` },
      text: {
        ru: s => { const c = M.colonyAt(s.target), L = roadDead(s); return `— ${c.ru}, говорит сорок первая. Мы прибыли по программе контакта.

Селина Вей ждёт полный световой оборот до склада и ещё время на ответ человека.

Приходит пакет маяка. Он начинается с той же даты, что запись о гибели базы в земном архиве.

— Это автомат, — говорит Селина. — Запросим состояние каждой капсулы.

На изображении склада различима сорванная створка наружного кожуха.

${L > 0 ? `В журнале отправленного вызова она оставляет и наши потери: ${ppl(L)}. Ответить на эту часть пока некому.` : 'Она сохраняет вызов в журнале: его ещё можно будет дать прослушать тем, кого удастся разбудить.'}`; },
        en: s => { const c = M.colonyAt(s.target), L = roadDead(s); return `"${c.en}, this is the Forty-First. We have arrived under the contact programme."

Selina Vei waits a full light round trip to the store, then allows time for a person to answer.

A beacon packet arrives. It begins with the same date as the record of the base's loss in Earth's archive.

"It's automatic," Selina says. "Request the condition of every capsule."

The image of the store resolves a torn panel on its outer casing.

${L > 0 ? `She includes our losses in the transmitted log: ${L}. There is no one awake to answer that part yet.` : 'She saves the call in the log: anyone they manage to wake can still hear it later.'}`; }
      }
    },
    {
      id: 'a3s.outpost2', scene: 'arrival', kind: 'transcript', year: s => s.arrive, when: supplyS,
      title: { ru: 'Ксилона Ир', en: 'Xylona Ir' },
      text: {
        ru: s => `— Сорок первая, Ксилона Ир. Передаём список последнего пробуждения…

Голос обрывается. Ная Сорн отмечает вспышку на ультрафиолетовом мониторе.

Селина Вей оставляет канал открытым; свет уже пришёл, вернуть предупреждение назад нельзя.

Через паузу местная смена отвечает: питание передатчика отдали насосам.

— Люди остались. Последнюю группу подняли недавно; теперь нас двести пятьдесят.

Селина передаёт оглавление привезённого архива и просит журнал последних ремонтов.${roadDead(s) > 0 ? ` В журнал она вписывает и наших: в пути умерли ${ppl(roadDead(s))}.` : ''}

Позднее у шлюза их встречает старший форпоста; на его рукаве — ключ ручного привода.

— Расскажите, что было в Кольце, пока мы не слышали.`,
        en: s => `"Forty-First, Xylona Ir. Sending the list from the latest waking…"

The voice breaks off. Naya Sorn marks a flare on the ultraviolet monitor.

Selina Vei keeps the channel open; the light has arrived, and no warning can precede it now.

After a pause, the local shift answers: transmitter power was diverted to the pumps.

"The people are still here. We woke the last group recently; there are two hundred and fifty of us."

Selina sends the contents of the archive they brought and asks for the latest repair log.${roadDead(s) > 0 ? ` She enters ours in the log too: ${roadDead(s)} died on the way.` : ''}

Later, the outpost's senior meets them at the airlock, a hand-crank key on his sleeve.

"Tell us what happened in the Ring while we couldn't hear."`
      }
    },
    {
      id: 'a3s.activity2', scene: 'arrival', kind: 'instrument', year: s => s.arrive, when: supplyS,
      title: { ru: 'Журнал вахты · звезда Барнарда', en: "Watch log · Barnard's Star" },
      text: {
        ru: `Ная разносит на экране две записи: свет вспышки и счётчик частиц.

— Свет ослаб. Это ещё не конец бури.

Ирсон накладывает схему монтажа на местную: новое оборудование пока подчиняется старому управлению.

У временного контура сорок пять суток; ждать неизвестного конца активности нельзя.

Без отдельного управления отказ роботов может остановить охлаждение занятой секции.

Местная смена предлагает укрытый пост и независимую линию к насосам.`,
        en: `Naya separates two records on the display: the flare's light and the particle counter.

"The light has faded. That does not mean the storm is over."

Irson overlays the installation plan on the local one: new equipment still answers to old controls.

The temporary loop has forty-five days; they cannot wait for an unknown end to the activity.

Without separate controls, a robot failure could stop cooling in an occupied section.

The local shift proposes a sheltered station and an independent line to the pumps.`
      }
    },
    {
      id: 'd.supplyApproach2', scene: 'arrival', kind: 'decision', year: s => s.arrive, when: supplyS,
      title: { ru: 'Монтаж под вспышками', en: 'Installation under the flares' },
      context: { ru: 'Поток частиц после вспышки не ограничен. У временного контура — сорок пять суток.', en: 'The particle flux after the flare is not bounded. The temporary loop has forty-five days.' },
      rec: s => s.materials >= STORM.protect ? { id: 'protect', why: { ru: 'после вспышки поток частиц ещё не ограничен', en: 'the particle flux after the flare is not yet bounded' }, assume: { ru: 'отдельный пост защитит монтаж; старую схему проверим отдельно', en: 'separate controls protect the installation; the old system needs its own check' } }
        : s.gridBlocks >= 2 && s.materials >= STORM.block ? { id: 'block', why: { ru: 'на укрытый пост материалов нет', en: 'there are no materials for a sheltered station' } }
        : { id: 'fast', why: { ru: 'на защиту материалов нет', en: 'there are no materials for protection' }, assume: { ru: 'роботов достаточно', en: 'robots are enough' } },
      options: s => [{
        id: 'fast', label: { ru: 'Короткая схема, только роботы', en: 'Short procedure, robots only' },
        known: { ru: ['Трое суток, без расхода материалов.', 'Управление общее; отказ монтажа способен остановить охлаждение занятой секции.'], en: ['Three days, no materials.', 'Controls are shared; an installation failure could stop cooling in an occupied section.'] },
        effect: st => { st.supplyDays += 3; if (stormU(st) < STORM.strong) { st.outpostDead += STORM.fastDead; st.deadHere += STORM.fastDead; incident(st, 'supplyExposure', STORM.fastDead, { year: opYear(st) }, 'outpost'); } },
        record: { ru: s => s.incidents && s.incidents.some(i => i.kind === 'supplyExposure') ? `Роботы монтируют по короткой схеме. Через сутки поток частиц останавливает автоматику; занятая секция остывает раньше, чем её успевают перекрыть. Погибли ${ppl(STORM.fastDead)} форпоста.` : 'Роботы монтируют по короткой схеме. Поток частиц держится в умеренных пределах; монтаж закончен за трое суток.',
          en: s => s.incidents && s.incidents.some(i => i.kind === 'supplyExposure') ? `The robots install by the short procedure. A day later the particle flux stops the automation; an occupied section cools before it can be sealed. ${STORM.fastDead} of the outpost are dead.` : 'The robots install by the short procedure. The particle flux stays moderate; the installation is done in three days.' }
      }, {
        id: 'protect', label: { ru: 'Укрытый пост и отдельное управление', en: 'Sheltered station and separate controls' },
        known: { ru: [`Материалы −${STORM.protect}%, десять суток.`, 'Защищает новый монтаж в расчётном диапазоне; состояние старой общей платы остаётся неизвестным.'], en: [`Materials −${STORM.protect}%, ten days.`, 'Protects the new installation within its design range; the old common board remains unverified.'] },
        cost: st => { st.materials -= STORM.protect; },
        effect: st => { st.materials -= STORM.protect; st.supplyDays += 10; st.supplyProtected = true; },
        record: { ru: 'Десять суток собирают укрытый пост. Монтаж идёт под отдельным управлением.', en: 'A sheltered station takes ten days to build. The installation runs under separate controls.' }
      }, {
        id: 'block', label: { ru: 'Выделить вторую сеть насосам', en: 'Dedicate the second grid to the pumps' },
        known: { ru: [`Материалы −${STORM.block}%, трое суток.`, 'Насосы получают независимое питание; вторая сеть корабля занята до разделения систем — переселение пока недоступно.'], en: [`Materials −${STORM.block}%, three days.`, "The pumps get independent power; the ship's second grid is busy until the systems are separated — shelter is unavailable meanwhile."] },
        cost: st => { st.materials -= STORM.block; },
        effect: st => { st.materials -= STORM.block; st.supplyDays += 3; st.supplyIndependent = true; },
        record: { ru: 'Вторую сеть корабля отдают насосам форпоста.', en: "The ship's second grid is given to the outpost's pumps." }
      }].filter(o => o.id === 'fast' || (o.id === 'protect' ? s.materials >= STORM.protect : s.gridBlocks >= 2 && s.materials >= STORM.block))
    },
    {
      id: 'a3s.afterLight', scene: 'arrival', kind: 'transcript', year: opYear, when: supplyS,
      title: { ru: 'После света', en: 'After the light' },
      text: {
        ru: `При пробном подключении новый холодильник повторяет ошибку снятого.

Ная Сорн совмещает журналы: адрес остановки один и тот же.

— Мы заменили прибор, — говорит Ирсон. — Управляет им прежний узел.

Местные показывают, какие линии свели вместе, когда разбирали мастерскую.

Это может быть восстановимый сбой или повреждение общей платы; повторное включение опасно для людей.`,
        en: `During the trial connection, the new cooler repeats the removed unit's error.

Naya Sorn aligns the logs: both stops have the same address.

"We replaced the device," Irson says. "The old node still controls it."

The locals show which lines they combined while dismantling the workshop.

This may be a recoverable fault or damage to the common board; restarting could endanger lives.`
      }
    },
    {
      id: 'd.supplyBus', scene: 'arrival', kind: 'decision', year: opYear, when: supplyS,
      title: { ru: 'Общая плата', en: 'The common board' },
      context: { ru: 'Старый и новый приборы отказывают по одному адресу.', en: 'The old and the new devices fail at the same address.' },
      rec: s => s.materials >= STORM.check + busSplit(s) ? { id: 'check', why: { ru: 'совпадает адрес отказа старого и нового прибора', en: 'the old and the new devices fail at the same address' }, assume: { ru: 'обычная проверка достаточна; отрицательный результат не исключает дефект', en: 'the ordinary check meets the accepted risk; a negative result does not exclude damage' } }
        : s.materials >= busSplit(s) ? { id: 'split', why: { ru: 'на проверку и разделение вместе материалов нет', en: 'not enough materials for both a check and the separation' } }
        : { id: 'replace', why: { ru: 'на разделение материалов нет', en: 'there are no materials for the separation' }, assume: { ru: 'плата исправна', en: 'the board is sound' } },
      options: s => [{
        id: 'replace', label: { ru: 'Заменить контроллер', en: 'Replace the controller' },
        known: { ru: s => [`Материалы −${Math.min(STORM.replace, s.materials)}%, двое суток.`, 'Если общая плата повреждена, повторное включение может погубить людей и капсульную секцию.'], en: s => [`Materials −${Math.min(STORM.replace, s.materials)}%, two days.`, 'If the common board is damaged, restarting could kill people and destroy the capsule section.'] },
        cost: st => { st.materials -= Math.min(STORM.replace, st.materials); },
        effect: st => { st.materials -= Math.min(STORM.replace, st.materials); st.supplyDays += 2; st.busMethod = 'replace'; busRestart(st); },
        record: busRecord
      }, {
        id: 'check', label: { ru: 'Обычная проверка и ремонт', en: 'Standard check and repair' },
        known: { ru: s => [`Проверка: −${STORM.check}% и двое суток, видит половину повреждений.`, `Затем: замена −${STORM.replace}% за двое суток, а если повреждение найдено — разделение −${busSplit(s)}% за двенадцать (итого −${STORM.check + busSplit(s)}%).`], en: s => [`Check: −${STORM.check}% and two days; finds half the damage.`, `Then: replacement −${STORM.replace}% in two days, or, if damage is found, separation −${busSplit(s)}% in twelve (−${STORM.check + busSplit(s)}% in all).`] },
        cost: st => { st.materials -= STORM.check + STORM.replace; },      // найдено — ещё разделение (сказано в «Что известно»)
        effect: st => { st.materials -= STORM.check; st.supplyDays += 2; st.busMethod = 'ordinary'; busCheck(st, 0.5); },
        record: busRecord
      }, {
        id: 'deep', label: { ru: 'Проверка под нагрузкой и ремонт', en: 'Load test and repair' },
        known: { ru: s => [`Проверка: −${STORM.deep}% и шесть суток, видит девять повреждений из десяти.`, `Затем замена (итого −${STORM.deep + STORM.replace}%) или, если найдено, разделение (итого −${STORM.deep + busSplit(s)}%); запас для дома уменьшится.`], en: s => [`Check: −${STORM.deep}% and six days; finds nine in ten.`, `Then replacement (−${STORM.deep + STORM.replace}% in all) or, if found, separation (−${STORM.deep + busSplit(s)}% in all); less stock remains for the home.`] },
        cost: st => { st.materials -= STORM.deep + STORM.replace; },
        effect: st => { st.materials -= STORM.deep; st.supplyDays += 6; st.busMethod = 'deep'; busCheck(st, 0.9); },
        record: busRecord
      }, {
        id: 'split', label: { ru: 'Разделить питание и управление', en: 'Separate power and controls' },
        known: { ru: s => [`Материалы −${busSplit(s)}%, двенадцать суток.${busSplit(s) < STORM.split ? ` Детали изготовлены на корабле (без производства −${STORM.split}%).` : ''}`, 'Независимые линии капсул и связи; выделенная сеть корабля освобождается.'], en: s => [`Materials −${busSplit(s)}%, twelve days.${busSplit(s) < STORM.split ? ` Parts are made aboard the ship (−${STORM.split}% without production).` : ''}`, "Independent capsule and relay lines; the dedicated ship grid is released."] },
        cost: st => { st.materials -= busSplit(st); },
        effect: st => { st.materials -= busSplit(st); st.supplyDays += 12; st.busMethod = 'split'; st.busResolved = true; st.supplyIndependent = false; },
        record: busRecord
      }].filter(o => o.id === 'replace' || ({ check: STORM.check + busSplit(s), deep: STORM.deep + busSplit(s), split: busSplit(s) })[o.id] <= s.materials)
    },
    {
      id: 'a3s.future', scene: 'arrival', kind: 'document', year: opYear, when: supplyS,
      title: { ru: 'Совместный план', en: 'The joint plan' },
      text: {
        ru: s => `Ива Лорн просит считать отдельно работающие системы, спасённых людей и обещания.

Местный совет кладёт рядом свою очередь ремонтов.

Связь нужна не только для просьб: у форпоста остались наблюдения и неотправленные письма. Капсулы нужны не только для сна: они возвращают смене возможность отдыхать.

Ирсон показывает цену каждой доступной работы и зависимость от корабельной сети.${s.capsLost ? ' Капсульная секция потеряна: до сорок пятого дня людям нужны места.' : ''}

Решение принимают вместе; подпись под поставкой не заменит местную приёмку.`,
        en: s => `Iva Lorn asks for working systems, people saved and promises to be counted separately.

The local council lays its repair queue beside hers.

The link is for more than requests: the outpost still has observations and unsent letters. Capsules are for more than sleep: they give the shift a chance to rest.

Irson shows the cost of every available job and its dependence on the ship's grid.${s.capsLost ? ' The capsule section is lost: people need berths before day forty-five.' : ''}

They decide together; a delivery signature cannot replace local acceptance.`
      }
    },
    {
      id: 'd.deliver2', scene: 'arrival', kind: 'decision', year: opYear, when: supplyS,
      title: { ru: 'План работ', en: 'The work plan' },
      context: {
        ru: s => `${supplySrc(s, 'ru')} ${s.capsLost ? `Капсульная секция потеряна: до сорок пятого дня людям нужны места — прошло ${s.supplyDays} суток.` : 'Систему примут только после испытаний; до приёмки охлаждение держит корабль.'}`,
        en: s => `${supplySrc(s, 'en')} ${s.capsLost ? `The capsule section is lost: people need berths before day forty-five — ${s.supplyDays} days have passed.` : 'A system is accepted only after testing; until then the ship carries the cooling.'}`
      },
      rec: s => { const ids = deliverOptions(s).map(o => o.id), pick = (id, ru, en) => ({ id, why: { ru, en } });
        if (s.capsLost) return ids.includes('shelter') ? pick('shelter', 'капсульная секция потеряна — сначала места', 'the capsule section is lost — berths first') : pick('abort', 'ни один план не держит людей', 'no plan keeps people alive');
        return ids.includes('capsules') ? Object.assign(pick('capsules', 'сначала устойчивое жизнеобеспечение', 'stable life support first'), { assume: { ru: 'испытанная схема сохранит работоспособность до приёмки', en: 'the tested system will remain functional until acceptance' } })
          : ids.includes('shelter') ? pick('shelter', 'на капсулы материалов нет — сначала места', 'no materials for capsules — berths first') : pick(ids[0], 'других работ нет', 'no other work is possible'); },
      options: s => deliverOptions(s)
    },
    {
      id: 'a3r.store', scene: 'arrival', kind: 'instrument', year: s => rescueS(s) ? arriveX(s) : s.arrive, when: s => s.mission === 'rescue',
      effect: s => { if (!rescueS(s)) { s.rescued = thawN(arriveX(s)); s.thawDead = THAW0 - s.rescued; return; }   // при полном опоздании — все 34
        // версия 3: тепловой запас секции — от паспортного прибытия; реестр — по именам
        s.sectionEnd = (s.arrivePlan == null ? arriveX(s) : s.arrivePlan) + RESCUE.section / YD; s.sectionLeft = daysTo(s, s.sectionEnd);
        thawAdvance(s, arriveX(s)); s.thawConfirmed = thawAlive(s, arriveX(s)).length; s.thawDead = s.thawDeadIds.length; },
      title: { ru: 'Журнал вахты · склад Оттепели', en: "Watch log · Thaw's store" },
      text: {
        ru: s => rescueS(s) ? storeR(s, 'ru') : `Орбитальный склад Оттепели отвечает маяком. Капсул — сорок, рассчитаны до года ${thawDeadline()}; сейчас год ${f2(arriveX(s), 'ru')}.
` + storeLine(s, 'ru') + `\n\n` + (thawN(arriveX(s)) === 34 ? 'Тридцать четыре капсулы держат; шесть отказали за эти годы по одной.' : thawN(arriveX(s)) ? `Капсулы отказывают с года ${THAW_LOSS}: держат ${thawN(arriveX(s))}.` : 'Живых капсул нет. Последняя отказала за несколько лет до нас.'),
        en: s => rescueS(s) ? storeR(s, 'en') : `Thaw's orbital store answers with its beacon. Forty capsules, rated to year ${thawDeadline()}; it is year ${f2(arriveX(s), 'en')}.
` + storeLine(s, 'en') + `\n\n` + (thawN(arriveX(s)) === 34 ? 'Thirty-four capsules hold; six failed over the years, one by one.' : thawN(arriveX(s)) ? `The capsules have been failing since year ${THAW_LOSS}: ${thawN(arriveX(s))} hold.` : 'No capsule is alive. The last one failed a few years before us.')
      }
    },
    {
      id: 'd.rescueDock', scene: 'arrival', kind: 'decision', when: s => rescueS(s) && thawAlive(s, storeNow(s)).length > 0,
      title: { ru: 'Как закрепиться', en: 'How to secure the ship' },
      context: {
        ru: s => `Склад вращается; струя теплоносителя нагружает его крепления. Чтобы работать, корабль должен встать к складу жёстко. ${sectionLine(s, 'ru')}`,
        en: s => `The store is rotating; the coolant jet loads its mounts. To work, the ship must be fixed rigidly to the store. ${sectionLine(s, 'en')}`
      },
      rec: s => s.materials >= RESCUE.inspectCost ? { id: 'inspect', why: { ru: 'струя и вращение нагружают старое крепление', en: 'the jet and the rotation load the old mount' }, assume: { ru: 'осмотр найдёт опасный надлом до захвата', en: 'the inspection will find a dangerous fracture before grappling' } }
        : { id: 'grab', why: { ru: 'на осмотр не хватает материалов', en: 'materials do not cover an inspection' }, assume: { ru: 'крепление выдержит захват', en: 'the mount will withstand grappling' } },
      options: s => {
        const record = {
          ru: s2 => s2.dockFound ? 'Надлом найден; корабль встаёт к другому узлу. Утечки не усилились.' : s2.pipeTorn ? `Крепление разрушилось и сорвало трубопровод секции. ${sectionLine(s2, 'ru')} Прямое подключение теперь угрожает охлаждению корабля.` : 'Захват завершён; утечки не усилились.',
          en: s2 => s2.dockFound ? 'A fracture is found; the ship moves to another mount. The leakage has not increased.' : s2.pipeTorn ? `The mount failed and tore the section's pipe away. ${sectionLine(s2, 'en')} A direct connection now threatens the ship's cooling.` : 'Grappling is complete; the leakage has not increased.'
        };
        return [{
          id: 'inspect', label: { ru: 'Осмотреть и погасить вращение', en: 'Inspect and stop the rotation' },
          known: { ru: [`${dd(RESCUE.inspect, 'ru')}, материалы −${RESCUE.inspectCost}%; найдём надлом — встанем к другому узлу.`, 'Осмотр видит не все внутренние трещины: девять из десяти.'],
            en: [`${dd(RESCUE.inspect, 'en')}, materials −${RESCUE.inspectCost}%; if we find a fracture, we use another mount.`, 'The inspection does not see every internal crack: nine in ten.'] },
          cost: st => { st.materials -= RESCUE.inspectCost; st.rescueDays += RESCUE.inspect; },
          effect: st => dockApply(st, 'inspect'), record
        }, {
          id: 'grab', label: { ru: 'Захватить сразу', en: 'Grapple now' },
          known: { ru: ['Одни сутки, без расхода материалов.', `Прочность крепления не проверена: если оно разрушится, секции останется не больше ${dd(RESCUE.torn, 'ru')}.`],
            en: ['One day, no materials.', `The mount's strength is untested: if it fails, the section has no more than ${dd(RESCUE.torn, 'en')}.`] },
          cost: st => { st.rescueDays += RESCUE.grab; },
          effect: st => dockApply(st, 'grab'), record
        }].filter(o => o.id !== 'inspect' || s.materials >= RESCUE.inspectCost);
      }
    },
    {
      id: 'd.rescueConnect', scene: 'arrival', kind: 'decision', when: connectNeed,
      title: { ru: 'Не перенести аварию', en: 'Keep the failure from spreading' },
      context: {
        ru: s => `${s.pipeTorn ? 'Трубопровод секции сорван.' : `Штатная операция — ${months(opNormal(s), 'ru')} — не успевает к сроку секции.`} ${sectionLine(s, 'ru')}`,
        en: s => `${s.pipeTorn ? "The section's pipe is torn away." : `The normal operation — ${months(opNormal(s), 'en')} — will not make the section deadline.`} ${sectionLine(s, 'en')}`
      },
      rec: s => { const intime = s.materials >= RESCUE.isolate && sectionHolds(s, storeNow(s) + isoDays(s) / YD), other = s.pipeTorn ? 'cut' : 'proceed';
        return intime ? { id: 'isolate', why: { ru: 'отделить корабельное охлаждение и сохранить всех, кого ещё успеваем', en: "separate the ship's cooling and preserve everyone still reachable in time" }, assume: { ru: 'независимый контур выдержит измеренную нагрузку', en: 'the independent loop will carry the measured load' } }
          : { id: other, why: { ru: 'секцию уже не успеваем; сохраняем остальных', en: 'we cannot save the section in time; we preserve the others' }, assume: { ru: 'остальные капсулы дождутся операции', en: 'the other capsules will last until the operation' } }; },
      options: s => connectOptions(s)
    },
    sosEnd('rescueDock', 'arrival'),
    {
      id: 'd.rescueShelter', scene: 'arrival', kind: 'decision', year: s => s.arrive, when: s => s.mission === 'rescue' && (rescueS(s) ? !s.sos && thawAlive(s, storeNow(s)).length > 0 : s.rescued > 0) && crewOf(s) >= M.CREW,
      rec: s => rescueS(s) ? { id: 'direct', why: { ru: 'сначала остановить потери, жильё строить после стабилизации', en: 'stop the losses first; build housing after stabilisation' }, assume: { ru: 'временное размещение позволит дождаться стройки', en: 'temporary accommodation will last until construction' } } : null,
      title: { ru: 'Куда принимать', en: 'Where to take them in' },
      context: {
        ru: s => `Спасательного сектора нет: места погибших в пути — резерв экспедиции. Без жилья спасённых можно лишь удержать во сне или в лазарете. ${storeLine(s, 'ru')}`,
        en: s => `There is no rescue sector: the places of those who died on the road are the expedition's reserve. Without housing the rescued can only be kept asleep or in the infirmary. ${storeLine(s, 'en')}`
      },
      options: s => [{
        id: 'module',
        label: { ru: 'Сначала жилой модуль', en: 'The living module first' },
        known: {
          ru: rescueS(s) ? [`Материалы для высадки −${SHELTER_R}%: койки, вода и воздух для сорока.`, `Три месяца работы до помощи капсулам: к концу стройки по прогнозу живы ${thawAlive(s, storeNow(s) + 0.25).length}.`, 'Тепловой срок секции на это время не останавливается.']
            : [`Материалы для высадки −${SHELTER_R}%: койки, вода и воздух для сорока.`, `Три месяца работы; склад тем временем стареет: к концу стройки по прогнозу живы ${thawN(arriveX(s) + 0.25)}.`],
          en: rescueS(s) ? [`Landing materials −${SHELTER_R}%: berths, water and air for forty.`, `Three months of work before helping the capsules: by the end, ${thawAlive(s, storeNow(s) + 0.25).length} alive by the forecast.`, "The section's thermal deadline does not stop meanwhile."]
            : [`Landing materials −${SHELTER_R}%: berths, water and air for forty.`, `Three months of work; the store ages meanwhile: by the end, ${thawN(arriveX(s) + 0.25)} alive by the forecast.`]
        },
        cost: st => { st.materials -= SHELTER_R; st.rescueShelter = true; },
        effect: st => { st.materials -= SHELTER_R; st.rescueShelter = true; if (rescueS(st)) { st.rescueDays += 0.25 * YD; thawAdvance(st, storeNow(st)); } },
        record: {
          ru: 'Сначала — жильё. Модуль на сорок мест собирают три месяца; склад всё это время на связи.',
          en: 'Housing first. The forty-berth module takes three months to build; the store stays in contact the whole time.'
        }
      }, {
        id: 'direct',
        label: { ru: 'Сразу к складу', en: 'Straight to the store' },
        known: {
          ru: ['Ни дня на стройку: операция начинается сейчас.', 'Постоянных мест для спасённых не будет.'],
          en: ['Not a day for building: the operation starts now.', 'There will be no permanent places for the rescued.']
        },
        effect: st => { st.rescueShelter = false; },
        record: {
          ru: 'Совет решает не ждать. Где жить спасённым — решат потом.',
          en: 'The council decides not to wait. Where the rescued will live will be decided later.'
        }
      }].filter(o => o.id !== 'module' || s.materials >= SHELTER_R)
    },
    {
      id: 'd.rescue', scene: 'arrival', overlay: 'sleepers', kind: 'decision', year: s => s.arrive, when: s => s.mission === 'rescue' && (rescueS(s) ? !s.sos && thawAlive(s, storeNow(s)).length > 0 : s.rescued > 0),
      rec: s => { if (!rescueS(s)) return null; const ids = rescueOptions(s).map(o => o.id), id = ['move', 'restore', 'wake'].find(x => ids.includes(x));
        return { id, why: { ru: 'стабилизировать без массового экстренного пробуждения', en: 'stabilise without mass emergency waking' }, assume: { ru: 'операция завершится в показанные сроки', en: 'the operation will finish within the displayed time' } }; },
      title: { ru: 'Как сохранить жизнь', en: 'How to keep them alive' },
      context: {
        ru: s => `${storeLine(s, 'ru', opStart(s))} Места: ${housedOf(s) ? (crewOf(s) < M.CREW ? 'спасательный сектор — сорок' : 'жилой модуль — сорок') : 'постоянных нет'}.`,
        en: s => `${storeLine(s, 'en', opStart(s))} Places: ${housedOf(s) ? (crewOf(s) < M.CREW ? 'the rescue sector — forty' : 'the living module — forty') : 'no permanent ones'}.`
      },
      options: s => rescueOptions(s),
      option: (s, id) => rescueOptions(s).find(o => o.id === id) || (rescueS(s) ? null : rescueLegacy(s, id))
    },
    {
      id: 'a3r.operationResult', scene: 'arrival', overlay: 'sleepers', kind: 'instrument', year: s => Math.max(s.year, s.rescueEnd || 0), when: s => rescueS(s) && !s.sos,
      effect: s => { if (!s.rescueOp) { s.thawDead = s.thawDeadIds.length; s.rescued = 0; } },
      title: { ru: 'Журнал вахты · имена в двух ведомостях', en: 'Watch log · names in two manifests' },
      text: {
        ru: s => `Ива сверяет каждую запись Оттепели с нашим журналом. Стабилизированы ${s.rescued}; дополнительно погибли ${s.thawDead}. ${({ move: 'Спящие — в нашем секторе.', restore: 'Спящие — на стабилизированном складе.', wake: 'Выжившие — в лазарете.' })[s.rescueOp] || 'Стабилизировать было некого.'}

У каждого человека остаётся прежнее имя и прежний номер капсулы.${s.thawDead ? ` В ведомость погибших вписаны: ${thawNames(s.thawDeadIds, 'ru')}.` : ''} Протокол отделяет потери от опоздания, аварии и пробуждения.`,
        en: s => `Iva checks every Thaw entry against our log. Stabilised: ${s.rescued}; additional deaths: ${s.thawDead}. ${({ move: 'The sleepers are in our sector.', restore: 'The sleepers are in the stabilised store.', wake: 'The survivors are in the infirmary.' })[s.rescueOp] || 'There was no one left to stabilise.'}

Everyone keeps their name and original capsule number.${s.thawDead ? ` Entered in the record of the dead: ${thawNames(s.thawDeadIds, 'en')}.` : ''} The record separates losses from late arrival, accidents and waking.`
      }
    },
    {
      id: 'a3r.greeting', illus: 'infirmary-first-words', scene: 'arrival', kind: 'transcript', year: s => Math.max(s.year, s.rescueEnd + (rescueS(s) && s.rescueOp !== 'wake' ? 30 / YD : 0)),
      when: s => s.mission === 'rescue' && s.rescued > 0 && !s.sos && (rescueS(s) || s.rescueOp === 'wake'),
      title: { ru: 'Лазарет · первые слова', en: 'Infirmary · first words' },
      text: {
        ru: s => { const L = roadDead(s); if (rescueS(s)) return greetR(s, L, 'ru'); return `Первая из тех, кто уже может говорить, долго смотрит на незнакомый потолок лазарета.

— Вы со склада? — спрашивает она.

— С сорок первой. Я Селина Вей. Мы пришли к Оттепели.

Селина показывает ей дату и ждёт; женщина придерживает большим пальцем край одеяла.

— А остальные?

${s.thawDead > 0 ? `— Живы ${s.rescued}. Из ${THAW0} мы потеряли ${s.thawDead}. Я останусь, пока вы будете читать список.` : `— Все ${THAW0} живы. Сейчас сверим, где каждый.`}

${L > 0 ? `— Вы тоже потеряли людей?\n\n— Да. В пути умерли ${ppl(L)}.` : '— Долго вы летели?\n\nСелина придвигает экран с календарём рейса.'}

Здесь отвечают сразу: между ними больше нет передатчика и лет ожидания.`; },
        en: s => { const L = roadDead(s); if (rescueS(s)) return greetR(s, L, 'en'); return `The first woman well enough to speak studies the unfamiliar infirmary ceiling.

"Are you from the store?" she asks.

"From the Forty-First. I'm Selina Vei. We came to Thaw."

Selina shows her the date and waits; the woman holds the blanket's edge beneath her thumb.

"And the others?"

${s.thawDead > 0 ? `"${s.rescued} are alive. Of the ${THAW0}, we lost ${s.thawDead}. I'll stay while you read the list."` : `"All ${THAW0} are alive. We'll check where each of them is."`}

${L > 0 ? `"Did you lose people too?"\n\n"Yes. ${L} died on the way."` : '"How long were you travelling?"\n\nSelina brings the voyage calendar closer.'}

Here an answer comes at once: there is no transmitter between them, no years of waiting.`; }
      }
    },
    {
      // отчёт по заданию исследовательской заявки: первый месяц у цели — работа сделана или нет, отчёт уходит Кольцу
      // (DOC «Ревью Codex — заявки из мира», шаг 3). Выполнение задания и судьба дома — разные итоги
      id: 'a3.taskReport', scene: 'arrival', kind: 'archive', year: s => Math.max(s.year, s.arrive + 1 / 12),
      when: s => s.mission === 'contact' && !!s.task && !s.sos && !s.lostShip,
      place: { ru: 'Отчёт Кольцу · задание заявки', en: 'Report to the Ring · the request task' },
      effect: s => { const r = taskResult(s); s.task.done = r.done; s.task.found = r.found; s.task.reportAt = Math.max(s.year, s.arrive + 1 / 12); },   // дата сцены (без модели эффект — до установки года)
      text: { ru: s => taskReportText(s, 'ru'), en: s => taskReportText(s, 'en') }
    },
    { id: 's.e6', kind: 'skip', toYear: s => s.arrive + 1,
      label: { ru: 'Промотать год ожидания', en: 'Skip the year of waiting' } },
    {
      id: 'a3.wait1', scene: 'home', kind: 'transcript', year: s => s.arrive + 1, when: supplyS,
      effect: s => { s.lost = lossesOf(s, s.arrive).total + s.dead; },
      title: { ru: 'Совет у цели', en: 'Council at the target' },
      text: {
        ru: `Будят Дассера и Орина. На столе — первоначальная заявка и совместный журнал работ.

Дассер читает журнал до конца, включая имена погибших, если они есть.

— Я обещал вернуть две системы. Вы решали, как сохранить людей между ними.

Ирсон показывает изменения, внесённые местной сменой.

— Теперь это и их инструкция. Они смогут исправить нас.

Дассер подписывает отчёт после местного совета, не вместо него.`,
        en: `Dasser and Orin are woken. The original request and the joint work log lie on the table.

Dasser reads the whole log, including the names of the dead, if there are any.

"I promised to restore two systems. You had to keep people alive between them."

Irson shows the changes made by the local shift.

"It is their procedure too now. They can correct us."

Dasser signs the report after the local council, not in its place.`
      }
    },
    {
      id: 'a3.wait3', scene: 'home', kind: 'transcript', year: s => s.arrive + 1, when: rescueS,
      effect: s => { s.lost = lossesOf(s, s.arrive).total + s.dead; },
      title: { ru: 'Подписанный прогноз', en: 'The signed forecast' },
      text: {
        ru: s => `Будят Дассера и Орина. На столе лежат паспорт, исправленная лоция и именной итог операции. Орин сравнивает две даты${s.brakeDelay ? '' : ' — они совпали'}.

— Я подписал расчёт среды, которую мы ещё не измерили.

Селина показывает, когда пришлось решать. Дассер читает список до конца: ${s.rescued ? 'теперь обещание сорока мест имеет имена' : 'обещание сорока мест осталось списком имён'}.

Медицинский журнал: погибли в пути — ${ppl(lossesOf(s, s.arrive).total + s.dead)}.`,
        en: s => `Dasser and Orin are woken. The passport, the corrected sailing directions and the named operation record lie on the table. Orin compares the two dates${s.brakeDelay ? '' : ' — they match'}.

"I signed a calculation for a medium we had not yet measured."

Selina shows when the decision had to be made. Dasser reads the entire list: ${s.rescued ? 'the promise of forty places now has names' : 'the promise of forty places has remained a list of names'}.

Medical log: died on the road — ${lossesOf(s, s.arrive).total + s.dead}.`
      }
    },
    {
      id: 'a4r.volcano', scene: 'home', kind: 'instrument', year: s => s.arrive + 1, when: rescueS,
      act: { ru: 'Акт IV · Оттепель повторяется', en: 'Act IV · Thaw happens again' },
      title: { ru: 'Журнал разведки · шлейф над старой площадкой', en: 'Survey log · a plume over the old site' },
      text: {
        ru: s => `Над старой площадкой растёт вулканический шлейф. Архив Оттепели показывает прежнюю последовательность: вода проходила штатную очистку, затем отказывали теплообменники энергетики.

Тея закрывает пробоотборник.

— Мы можем повторить их анализ и получить ту же ошибку.${s.rescued ? ' Люди уже обеспечены охлаждением; испытание воды не должно оплачиваться их жизнями.' : ''}`,
        en: s => `A volcanic plume grows above the old site. Thaw's archive shows the earlier sequence: water passed normal treatment, then the power system's heat exchangers failed.

Teya closes the sampler.

"We can repeat their analysis and get the same error."${s.rescued ? ' "Cooling is already secured; testing the water must not be paid for with their lives."' : ''}`
      }
    },
    {
      id: 'a3.wait', illus: s => s.support === 'found' ? null : 'council-at-target', scene: 'home', kind: 'transcript', year: s => s.arrive + 1, when: s => !ownStory(s),
      effect: s => { s.lost = lossesOf(s, s.arrive).total + s.dead;
        if (s.support === 'found') { s.materials += 30; s.reserve += dvPct(s, 900); s.highPower = true; } },
      title: { ru: 'Совет у цели', en: 'Council at the target' },
      text: {
        ru: s => (s.support === 'found'
          ? `Будят Дассера и Орина. Через год к точке встречи выходит корабль поддержки: семеро будят себя сами, как договорились по связи. В трюмах — ³He, теплообменники и материалы для высадки. Контур повышенной мощности снова цел; резерв манёвров и запас материалов пополнены.
`
          : `Будят Дассера и Орина. Совет решает, сколько ждать корабль поддержки: каждый месяц — годы бодрствующих, воздух, пища из запасов${!s.highPower && src(s) ? ', которые и так потрачены сильнее расчёта' : ''}. Ждут год.

Корабль поддержки признают погибшим. Обряд имён — по семи именам. Вместе с ним пропадают ³He, теплообменники и материалы, на которые когда-то рассчитывал совет Ирсона.
`) + `
Медицинский журнал: погибли в пути — ${ppl(lossesOf(s, s.arrive).total + s.dead)}${s.dead ? `, из них ${deadCauses(s, 'ru')}` : ''}.` +
          (src(s) ? '\n\nОрин читает разбор ошибки у Тёмной звезды и записывает вину на себя: он оставил простую инструкцию там, где нужен был разбор района.' : ''),
        en: s => (s.support === 'found'
          ? `Dasser and Orin are woken. A year later the support ship comes out at the rendezvous: the seven wake themselves, as agreed over the link. Its holds carry ³He, heat exchangers and landing materials. The high-power loop is whole again; the manoeuvre reserve and the materials are replenished.
`
          : `Dasser and Orin are woken. The council decides how long to wait for the support ship: every month costs waking years, air, food from stores${!s.highPower && src(s) ? ' already spent beyond plan' : ''}. They wait a year.

The support ship is declared lost. The rite of names — seven names. With it go the ³He, the heat exchangers and the materials that Irson's council once relied on.
`) + `
Medical log: died on the road — ${lossesOf(s, s.arrive).total + s.dead}${s.dead ? `, of them ${deadCauses(s, 'en')}` : ''}.` +
          (src(s) ? '\n\nOrin reads the review of the error at the Dark Star and takes the blame himself: he left a simple instruction where a survey of the region was needed.' : '')
      }
    },
    {
      id: 'd.home', scene: 'home', kind: 'decision', year: s => s.arrive + 1, when: s => s.mission !== 'supply' && !s.sos,
      title: { ru: 'Где будет дом', en: 'Where home will be' },
      rec: s => { if (!rescueS(s)) return null; const ids = homeOptionsR(s).map(o => o.id), id = ['check', 'closed', 'orbit', 'stay'].find(x => ids.includes(x));
        return id === 'check' ? { id, why: { ru: 'старая площадка сохраняет инфраструктуру; перед заселением нужна проверка', en: 'the old site keeps its infrastructure; it needs testing before occupation' }, assume: { ru: 'короткое испытание представляет будущий режим очистки', en: 'the short test represents future treatment conditions' } }
          : id === 'stay' ? { id, why: { ru: 'сохранить доступное размещение', en: 'preserve the available accommodation' }, assume: { ru: 'непокрытые обязательства остаются открытыми', en: 'uncovered commitments remain open' } }
          : { id, why: { ru: 'независимое обеспечение исключает местную воду', en: 'independent supply excludes local water' }, assume: { ru: 'материалов хватит на постоянное обеспечение', en: 'the materials will cover permanent supply' } }; },
      context: {
        ru: s => agroLost(s, 'ru') + (rescueS(s) ? (s.rescued ? 'Площадку выбирают вместе с пробуждёнными жителями Оттепели.' : 'Оттепели помочь не успели: площадку выбирает экипаж.') + ' Чем проверять воду и сколько платить за уверенность — решение совета.' : bad(M.worldOf(s.target)) ? 'Высадиться нельзя. Корабль строили и как основу поселения — это последний довод конструкторов.' : 'Мир пригоден. Вопрос — когда спускаться и сколько знать до спуска.'),
        en: s => agroLost(s, 'en') + (rescueS(s) ? (s.rescued ? "The site is chosen together with Thaw's awakened residents." : 'Thaw could not be helped in time: the crew chooses the site.') + " How to test the water and how much to pay for certainty is the council's decision." : bad(M.worldOf(s.target)) ? 'No landing is possible. The ship was built as the core of a settlement too — the designers\' last argument.' : 'The world is habitable. The question is when to go down and how much to know first.')
      },
      options: s => { if (rescueS(s)) return homeOptionsR(s); const w = M.worldOf(s.target), L = s.kits.includes('landing'), low = s.reserve < 40;
        const orbit = {
          id: 'orbit',
          label: { ru: bad(w) ? 'Поселение на орбите' : 'Сначала орбита', en: bad(w) ? 'A settlement in orbit' : 'Orbit first' },
          known: {
            ru: bad(w) ? ['Корабль и есть дом: кольца, агрозалы, зал анабиоза.', 'Материалы — на расширение колец; люди просыпаются по очереди, по мере места.']
              : ['Год разведки с орбиты: участки, погода, жизнь на поверхности.', 'Высадка откладывается; люди ждут в капсулах и кольцах.'],
            en: bad(w) ? ['The ship is the home: rings, agro halls, the anabiosis hall.', 'Materials go to extending the rings; people wake in turn, as room allows.']
              : ['A year of survey from orbit: sites, weather, life on the surface.', 'Landing is postponed; people wait in capsules and rings.']
          },
          effect: st => { st.home = 'orbit'; },
          record: {
            ru: bad(w) ? 'Совет решает строить дом на орбите. Первым делом Тея Марр расширяет агрозалы: теперь это не рейс, а жизнь.' : 'Совет решает год смотреть сверху. Разведчики составляют карту участков; Кассель когда-то сказала бы, что это и есть осторожность Совета.',
            en: bad(w) ? 'The council decides to build the home in orbit. Teya Marr extends the agro halls first: this is no longer a voyage but a life.' : 'The council decides to watch from above for a year. The scouts map the sites; Kassel would once have called this the Council\'s caution.'
          }
        };
        if (w === 'open') return [{
          id: 'land',
          label: { ru: 'Высадка', en: 'Land' },
          known: {
            ru: [L ? 'Расширенная посадка: первая волна — сто человек, база за два года.' : 'Без расширенной посадки: первая волна — сорок человек, база за пять лет.', low ? 'Резерв манёвров мал: челноки — к одному участку, без запасного.' : 'Челноки выбирают из нескольких участков.'],
            en: [L ? 'Extended landing kit: a first wave of a hundred, a base in two years.' : 'No extended landing kit: a first wave of forty, a base in five years.', low ? 'The manoeuvre reserve is small: shuttles to one site, no fallback.' : 'The shuttles can choose among several sites.']
          },
          effect: st => { st.home = 'land'; st.homeReadyAt = st.year + (L ? 2 : 5); },
          record: {
            ru: 'Совет решает спускаться. Первая волна уходит к участку, который выбрала разведка с орбиты за первые недели. Остальные спят, пока внизу не построят жильё.',
            en: 'The council decides to go down. The first wave leaves for the site the orbital survey chose in the first weeks. The rest sleep until housing is built below.'
          }
        }, orbit];
        if (w === 'dome') return [{
          id: 'domes',
          label: { ru: 'Купола на терминаторе', en: 'Domes on the terminator' },
          known: {
            ru: [s.materials >= 60 ? 'Материалы для высадки: −30% на купола.' : 'Материалов мало: купол на сорок человек, остальные ждут на орбите.', L ? 'Расширенная посадка: купола собирают за три года.' : 'Без расширенной посадки: купола — за шесть лет.'],
            en: [s.materials >= 60 ? 'Landing materials: −30% for the domes.' : 'Materials are short: a dome for forty, the rest wait in orbit.', L ? 'Extended landing kit: the domes go up in three years.' : 'No extended landing kit: the domes take six years.']
          },
          effect: st => { if (st.materials >= 60) st.homeReadyAt = st.year + (L ? 3 : 6); st.home = 'domes'; st.materials -= Math.min(30, st.materials); },   // купол на сорок — остальные на орбите
          record: {
            ru: 'Совет решает строить купола на полосе между вечным днём и вечной ночью. Ветер там не стихает никогда.',
            en: 'The council decides to build domes on the strip between endless day and endless night. The wind there never stops.'
          }
        }, orbit];
        const sleep = {
          id: 'sleep',
          label: { ru: 'Спать и ждать помощи', en: 'Sleep and wait for help' },
          known: { ru: s2 => sosKnown(s2, 'home', 'ru'), en: s2 => sosKnown(s2, 'home', 'en') },
          effect: st => { st.home = 'sleep'; st.sos = 'home'; },
          record: {
            ru: 'Совет решает спать и ждать. Сигнал бедствия уходит к колониям и на Землю; вахта из двенадцати человек остаётся у капсул.',
            en: 'The council decides to sleep and wait. The distress signal goes out to the colonies and to Earth; a watch of twelve stays with the capsules.'
          }
        };
        const opts = s.materials >= 30 ? [orbit] : [];
        if (s.materials >= 50) opts.push({
          id: 'moons',
          label: { ru: w === 'ruined' ? 'База на обломках' : w === 'none' ? 'База на астероидах' : 'База на спутнике', en: w === 'ruined' ? 'A base on the debris' : w === 'none' ? 'A base on the asteroids' : 'A base on a moon' },
          known: {
            ru: ['Твёрдая опора, лёд и металл под рукой; материалы для высадки −30%.', L ? 'Расширенная посадка: база за три года.' : 'Без расширенной посадки: база — за семь лет.'],
            en: ['Solid ground, ice and metal at hand; landing materials −30%.', L ? 'Extended landing kit: a base in three years.' : 'No extended landing kit: a base in seven years.']
          },
          effect: st => { st.home = 'moons'; st.materials -= 30; st.homeReadyAt = st.year + (L ? 3 : 7); },
          record: {
            ru: 'Совет решает садиться туда, где есть твёрдое. Дом будет маленьким и тяжёлым, зато из местного камня.',
            en: 'The council decides to land wherever there is solid ground. The home will be small and heavy, but built of local stone.'
          }
        });
        opts.push({
          id: 'beacon',
          label: { ru: 'Маяк для следующих', en: 'A beacon for those who follow' },
          known: {
            ru: ['Экипаж остаётся на орбите и передаёт Кольцу всё, что узнал.', 'Дом строит следующая экспедиция — уже с нашими данными.'],
            en: ['The crew stays in orbit and sends the Ring everything it has learned.', 'The next expedition builds the home — with our data.']
          },
          effect: st => { st.home = 'beacon'; },
          record: {
            ru: 'Совет решает стать маяком. Передатчик корабля работает на Землю без перерыва; ответ придёт через поколения.',
            en: 'The council decides to become a beacon. The ship\'s transmitter works toward Earth without pause; the answer will come in generations.'
          }
        });
        if (M.hasGiant(s.target) && s.materials >= 100) opts.push({
          id: 'return',
          label: { ru: 'Вернуться домой', en: 'Go home' },
          known: {
            ru: ['Десятилетия добычи дейтерия и ³He из атмосферы гиганта; ступень обратного пути — из материалов.', 'Сто тридцать — двести лет пути: Земля к возвращению уйдёт на несколько эпох вперёд.'],
            en: ['Decades of mining deuterium and ³He from the giant\'s atmosphere; a return stage built from the materials.', 'A hundred and thirty to two hundred years of travel: by the return, Earth will be several epochs ahead.']
          },
          effect: st => { st.home = 'return'; },
          record: {
            ru: 'Совет решает возвращаться. Первые черпалки уходят к гиганту через месяц. Сводки Кольца уже сказали, какой будет Земля.',
            en: 'The council decides to go back. The first scoops leave for the giant within a month. The Ring\'s bulletins have already told them what Earth will be like.'
          }
        });
        if (s.materials < 30) opts.push(sleep);
        return opts;
      }
    },
    sosEnd('home', 'home'),
    {
      id: 'a4r.siteResult', scene: 'home', kind: 'instrument', year: s => s.arrive + 1 + ((s.siteDays || 0) + (s.site === 'evacuated' ? 30 : 0)) / YD, when: s => rescueS(s) && !s.sos,
      title: { ru: 'Журнал поселения · принятая площадка', en: 'Settlement log · the accepted site' },
      text: { ru: s => siteRecord(s, 'ru'), en: s => siteRecord(s, 'en') }
    },
    ];
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = act3;
  else (root.M31Story = root.M31Story || {}).act3 = act3;
})(typeof globalThis !== 'undefined' ? globalThis : this);
