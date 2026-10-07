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
        kind: 'D', strat: { careful: 'replace', risky: 'regen', frugal: 'regen' }, family: 'lifeSupport', lam: 0.008, lamMax: 0.012, cooldown: 25, cap: 2,
        rate: s => s.groupB === 'woken' ? 1.5 : 1,
        name: L('картриджи воздуха', 'air-filter cartridges'),
        prepare: (s, e, u) => { e.ch = 1 + Math.floor(u('channel') * 6); e.ppm = 40 + Math.round(u('ppm') * 50); },
        cost: s => H.prod(s) === 'printQC' ? 1 : H.prod(s) === 'tools' ? 1.5 : 2,
        decision: (s, e, T) => ({
          scene: 'vault',
          title: L('Картриджи воздуха после регенерации', 'Air-filter cartridges after regeneration'),
          context: L(`${e.who.ru}, вахта жизнеобеспечения: после одинакового цикла очистки остаточный CO₂ в канале ${e.ch} растёт уже третий месяц — на ${e.ppm} ppm выше нормы цикла. Соседний канал исправен; если рост продолжится, автоматика изолирует канал. Сорбент теряет эффективность раньше паспортного срока.`,
            `${e.who.en}, life-support watch: after the same cleaning cycle the residual CO₂ in channel ${e.ch} has been rising for three months — ${e.ppm} ppm above the cycle norm. The neighbouring channel is fine; if the rise goes on, the control system will isolate the channel. The sorbent is losing effectiveness before the end of its rated service life.`),
          rec: x => rich(x) ? { id: 'replace', why: L('материалов хватает, а занятость вахты дороже', 'there are materials enough, and the watch\'s time costs more') }
            : { id: 'regen', why: L('материалов мало — платим временем', 'materials are short — we pay in time') },
          options: [{
            id: 'replace',
            label: L('Заменить сорбент', 'Replace the sorbent'),
            known: lang => lang === 'ru' ? [`Материалы для высадки −${H.nf(T.cost(s), 1, 'ru')}%${H.prod(s) !== 'repair' ? ' (вставки режут из запаса на станках)' : ''}; ${dd(dur(s, 'lifeSupport', 10), 'ru')} работы${qualNote(s, 'lifeSupport', 'ru')}.`, 'Канал возвращается к паспортной производительности.']
              : [`Landing materials −${H.nf(T.cost(s), 1, 'en')}%${H.prod(s) !== 'repair' ? ' (the inserts are cut from stock on the machine tools)' : ''}; ${dd(dur(s, 'lifeSupport', 10), 'en')} of work${qualNote(s, 'lifeSupport', 'en')}.`, 'The channel returns to its rated output.'],
            effect: x => { const c = T.cost(x); x.materials -= c; scrap(x, c); job(x, e, 'replace', dur(x, 'lifeSupport', 10) * DAY); },
            record: L(`Сорбент канала ${e.ch} заменяют. Старые картриджи — в мастерскую: корпуса пойдут во вторсырьё.`, `The sorbent of channel ${e.ch} is replaced. The old cartridges go to the workshop: their housings will go to scrap.`)
          }, {
            id: 'regen',
            label: L('Регенерировать партиями', 'Regenerate in batches'),
            known: lang => lang === 'ru' ? ['Материалы −0,5%.', `Двое специалистов заняты ${H.thin(s) ? 'девять месяцев' : 'полгода'}.`, 'До конца регенерации канал работает на девяти десятых производительности.']
              : ['Materials −0.5%.', `Two specialists are assigned to the work for ${H.thin(s) ? 'nine months' : 'half a year'}.`, 'Until the regeneration is done the channel runs at nine tenths of its output.'],
            effect: x => { x.materials -= 0.5; job(x, e, 'regen', H.thin(x) ? 0.75 : 0.5); },
            record: L(`Канал ${e.ch} переводят на регенерацию партиями. ${e.who.ru} ведёт график.`, `Channel ${e.ch} goes over to batch regeneration. ${e.who.en} keeps the schedule.`)
          }]
        }),
        done: (s, e, j) => j.how === 'replace'
          ? note(s, e, L('Журнал жизнеобеспечения', 'Life-support log'), L(`Канал ${e.ch}: сорбент заменён, остаточный CO₂ — в норме цикла.`, `Channel ${e.ch}: sorbent replaced, residual CO₂ within the cycle norm.`), 'done')
          : note(s, e, L('Журнал жизнеобеспечения', 'Life-support log'), L(`Канал ${e.ch}: регенерация закончена, канал снова на полной производительности.`, `Channel ${e.ch}: regeneration complete; full output restored.`), 'done')
      },

      // 09 «Эфемериды разошлись» — навигация; только пока до торможения достаточно времени
      navResidual: {
        kind: 'D', strat: { careful: 'baseline', risky: 'correct', frugal: 'baseline' }, family: 'navigation', lam: 0.006, lamMax: 0.006, cooldown: 25, cap: 2, council: true,
        rate: () => 1,
        name: L('эфемериды разошлись', 'the ephemerides disagree'),
        prepare: (s, e, u) => { e.mas = 2 + Math.round(u('mas') * 20) / 10; },
        decision: (s, e) => ({
          scene: 'chart',
          title: L('Эфемериды разошлись', 'The ephemerides disagree'),
          context: L(`${e.who.ru}, навигационная смена: два независимых решения по разным наборам опорных звёзд расходятся на ${H.nf(e.mas, 1, 'ru')} угловой миллисекунды, и расхождение медленно растёт. Это не потеря курса: остаток пока меньше допуска точки встречи, но до торможения траекторию нужно уточнить либо скорректировать с запасом на расхождение.`,
            `${e.who.en}, navigation watch: two independent solutions from different sets of reference stars disagree by ${H.nf(e.mas, 1, 'en')} milliarcseconds, and the gap is slowly growing. This is not a lost course: the residual is still within the rendezvous tolerance, but before braking the trajectory must be refined or corrected with allowance for the difference.`),
          rec: x => x.reserve >= 90 && !H.thin(x) ? { id: 'correct', why: L('резерв почти полон, а прибор нужен для других наблюдений', 'the reserve is nearly full, and the instrument is needed for other observations') }
            : { id: 'baseline', why: L('лучше потратить время на наблюдения и сохранить резерв манёвров', 'observing time is better spent than manoeuvre reserve') },
          options: [{
            id: 'correct',
            label: L('Принять консервативную коррекцию', 'Accept a conservative correction'),
            known: lang => lang === 'ru' ? [`Резерв манёвров −10 км/с (−${H.nf(H.dvPct(s, 10), 2, 'ru')}% паспортного).`, 'Коррекция сразу, без дополнительной серии наблюдений.']
              : [`Manoeuvre reserve −10 km/s (−${H.nf(H.dvPct(s, 10), 2, 'en')}% of rated).`, 'A correction now, without an additional observation series.'],
            effect: x => { x.reserve -= H.dvPct(x, 10); },
            record: L('Выполнена коррекция на 10 км/с с запасом на расхождение двух навигационных решений.', 'A 10 km/s correction has been made, with allowance for the difference between the two navigation solutions.')
          }, {
            id: 'baseline',
            label: L('Набрать длинную базу наблюдений', 'Build a long observation baseline'),
            known: lang => lang === 'ru' ? [`${dd(dur(s, 'navigation', H.sensors(s) === 'spectraPlus' ? 90 : 180), 'ru')} наблюдений на ходу${qualNote(s, 'navigation', 'ru')}; прибор занят — научные сверки ждут.`, `Затем коррекция −4 км/с (−${H.nf(H.dvPct(s, 4), 2, 'ru')}% паспортного).`]
              : [`${dd(dur(s, 'navigation', H.sensors(s) === 'spectraPlus' ? 90 : 180), 'en')} of observing on the move${qualNote(s, 'navigation', 'en')}; the instrument is busy — science checks wait.`, `Then a correction of −4 km/s (−${H.nf(H.dvPct(s, 4), 2, 'en')}% of rated).`],
            cost: x => { x.reserve -= H.dvPct(x, 4); },                      // предпросмотр: коррекция после серии
            effect: x => { job(x, e, 'baseline', dur(x, 'navigation', H.sensors(x) === 'spectraPlus' ? 90 : 180) * DAY, ['ai']); },
            record: L(`${e.who.ru} ставит длинную серию наблюдений; коррекция — после неё.`, `${e.who.en} sets up a long observing series; the correction comes after it.`)
          }]
        }),
        done: (s, e, j) => { const d = H.dvPct(s, 4); s.reserve -= d; move(s, e, 'reserve', -d);
          note(s, e, L('Навигационный журнал', 'Navigation log'), L(`По длинной серии наблюдений траектория уточнена; выполнена коррекция на 4 км/с.`, `The extended observation series has refined the trajectory; a 4 km/s correction has been made.`), 'done'); }
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
            L(`Партия восстановления за девяносто суток: из корпусов, крепежа и обрезков прошлых ремонтов в запас вернулось ${g('ru')}% материалов. ${H.prod(s) === 'printQC' ? 'Металлопечать с контролем' : H.prod(s) === 'tools' ? 'Станки' : 'Ремонтный набор'} — годного ${y('ru')}% от лома; остаток партии списан как непригодный.`,
              `A ninety-day recovery batch: housings, fasteners and offcuts from past repairs return ${g('en')}% of materials to stock. ${H.prod(s) === 'printQC' ? 'Metal printing with QC' : H.prod(s) === 'tools' ? 'The machine tools' : 'The repair kit'} — ${y('en')}% of the scrap comes out usable; the remainder of the batch is written off as unrecoverable.`), 'note');
        }
      },

      // 01 «Тёплый шов» — радиатор приборного блока; при слабой нагрузке блок на год откладывает новые наблюдения
      radiatorSeam: {
        kind: 'D', strat: { careful: 'insert', risky: 'load', frugal: 'load' }, family: 'cooling', lam: 0.008, lamMax: 0.008, cooldown: 25, cap: 2,
        rate: () => 1,
        name: L('тёплый шов радиатора', 'a warm radiator seam'),
        prepare: (s, e, u) => { e.block = 1 + Math.floor(u('block') * 4); e.dT = 6 + Math.round(u('dT') * 2); },
        cost: s => H.prod(s) === 'repair' ? 2 : 1,
        decision: (s, e, T) => ({
          scene: 'flip',
          title: L('Тёплый шов радиатора', 'A warm radiator seam'),
          context: L(`${e.who.ru}, тепловая смена: перепад температуры на шве радиатора приборного блока ${e.block} при той же нагрузке вырос на ${e.dT} К за два измерения. Течи нет, шов локализован.`,
            `${e.who.en}, thermal watch: the temperature drop across a radiator seam of instrument block ${e.block} has grown by ${e.dT} K over two measurements at the same load. No leak; the seam is located.`),
          rec: x => rich(x) ? { id: 'insert', why: L('материалов хватает, а приборы нужны', 'there are materials enough, and the instruments are needed') }
            : { id: 'load', why: L('материалов мало — подождут наблюдения', 'materials are short — the observations can wait') },
          options: [{
            id: 'insert',
            label: L('Заменить вставку шва', 'Replace the seam insert'),
            known: lang => lang === 'ru' ? [`Материалы для высадки −${H.nf(T.cost(s), 0, 'ru')}%${H.prod(s) !== 'repair' ? ' (вставку режут из запаса на станках)' : ''}; ${dd(dur(s, 'cooling', 14), 'ru')} работы${qualNote(s, 'cooling', 'ru')}.`, 'Приборный блок возвращается к штатному режиму.']
              : [`Landing materials −${H.nf(T.cost(s), 0, 'en')}%${H.prod(s) !== 'repair' ? ' (the insert is cut from stock on the machine tools)' : ''}; ${dd(dur(s, 'cooling', 14), 'en')} of work${qualNote(s, 'cooling', 'en')}.`, 'The instrument block returns to normal running.'],
            effect: x => { const c = T.cost(x); x.materials -= c; scrap(x, c); job(x, e, 'insert', dur(x, 'cooling', 14) * DAY); },
            record: L(`Вставку шва блока ${e.block} меняют; старую — в лом.`, `The seam insert of block ${e.block} is replaced; the old one goes to scrap.`)
          }, {
            id: 'load',
            label: L('Снизить нагрузку и обслуживать шов', 'Reduce the load and maintain the seam'),
            known: lang => lang === 'ru' ? ['Материалы целы.', `${H.highPower(s) ? 'Год' : 'Полтора года (без резерва мощности)'} блок работает на сниженной нагрузке; новые длительные наблюдения ждут.`]
              : ['The materials are kept.', `For ${H.highPower(s) ? 'a year' : 'a year and a half (without the high-power reserve)'} the block runs at reduced load; new long observations wait.`],
            effect: x => { job(x, e, 'load', H.highPower(x) ? 1 : 1.5, ['navigation', 'ai']); },
            record: L(`Блок ${e.block} переводят на сниженную нагрузку. ${e.who.ru} ведёт контроль шва.`, `Block ${e.block} goes to reduced load. ${e.who.en} keeps watch on the seam.`)
          }]
        }),
        done: (s, e, j) => note(s, e, L('Тепловой журнал', 'Thermal log'), j.how === 'insert'
          ? L(`Блок ${e.block}: вставка шва заменена, перепад температуры — в паспортных пределах.`, `Block ${e.block}: seam insert replaced, the temperature difference within specified limits.`)
          : j.dur > 1.25 ? L(`Блок ${e.block}: полтора года на сниженной нагрузке позади; шов держит, блок возвращается к полной нагрузке.`, `Block ${e.block}: the year and a half at reduced load is over; the seam holds, the block returns to full load.`)
          : L(`Блок ${e.block}: год на сниженной нагрузке позади; шов держит, блок возвращается к полной нагрузке.`, `Block ${e.block}: the year at reduced load is over; the seam holds, the block returns to full load.`), 'done')
      },

      // 05 «Пульс датчика капсулы» — предупреждение, не бросок смерти; дефект разъёма — скрытый факт (40%)
      capsulePulse: {
        kind: 'D', strat: { careful: 'replace', risky: 'measure', frugal: 'measure' }, family: 'capsules', lam: 0.006, lamMax: 0.006, cooldown: 25, cap: 2,
        rate: s => H.caps(s) === 'capsSafe' ? 0.5 : 1,
        name: L('пульс датчика капсулы', 'a capsule sensor pulse'),
        prepare: (s, e, u) => { e.grp = 1 + Math.floor(u('grp') * 20); e.cap = 1 + Math.floor(u('cap') * 25); e.h.defect = u('defect') < 0.4; e.sleeper = H.pickName(s, u('sleeper'), e.whoI); },
        cost: s => H.caps(s) === 'capsSafe' ? 0.5 : 1,
        decision: (s, e, T) => ({
          scene: 'vault', overlay: 'sleepers',
          title: L('Пульс датчика капсулы', 'A capsule sensor pulse'),
          context: L(`${e.who.ru}, медицинская смена: датчик охлаждения капсулы ${e.grp}-${e.cap} (${e.sleeper.ru}) расходится с независимым термодатчиком — импульсы рвутся раз в несколько суток. По остальным каналам спящий в норме. Причин две: разъём датчика или сам датчик.`,
            `${e.who.en}, medical watch: the cooling sensor of capsule ${e.grp}-${e.cap} (${e.sleeper.en}) disagrees with the independent thermal sensor — its pulses drop out every few days. On every other channel the sleeper is fine. There are two possible causes: the sensor's connector or the sensor itself.`),
          rec: x => rich(x) ? { id: 'replace', why: L('надёжнее и быстрее, материалы есть', 'surer and faster, and there are materials') }
            : { id: 'measure', why: L('материалов мало — сначала узнать причину', 'materials are short — find the cause first') },
          options: [{
            id: 'replace',
            label: L('Заменить разъём и датчик, проверить канал', 'Replace the connector and sensor, then test the channel'),
            known: lang => lang === 'ru' ? [`Материалы −${H.nf(T.cost(s), 1, 'ru')}%${H.caps(s) === 'capsSafe' ? ' (у надёжных капсул деталь проще)' : ''}; двенадцать суток.`, 'Обе возможные причины устранены.']
              : [`Materials −${H.nf(T.cost(s), 1, 'en')}%${H.caps(s) === 'capsSafe' ? ' (the reliable capsules take a simpler part)' : ''}; twelve days.`, 'Both possible causes are removed.'],
            effect: x => { const c = T.cost(x); x.materials -= c; scrap(x, c); job(x, e, 'replace', 12 * DAY); },
            record: L(`Разъём и датчик капсулы ${e.grp}-${e.cap} меняют; канал проверяют целиком.`, `The connector and sensor of capsule ${e.grp}-${e.cap} are replaced; the entire channel is tested.`)
          }, {
            id: 'measure',
            label: L('Снять независимую серию измерений', 'Take an independent series of measurements'),
            known: lang => lang === 'ru' ? ['Материалы −0,25%; девяносто суток, специалист занят.', 'Если подтвердится дефект разъёма — ещё −0,75% на замену.']
              : ['Materials −0.25%; ninety days, a specialist is busy.', 'If the connector defect is confirmed — another −0.75% for the replacement.'],
            cost: x => { x.materials -= 0.25; },
            effect: x => { x.materials -= 0.25; job(x, e, 'measure', 90 * DAY); },
            record: L(`${e.who.ru} ставит независимый датчик на капсулу ${e.grp}-${e.cap}.`, `${e.who.en} fits an independent sensor to capsule ${e.grp}-${e.cap}.`)
          }]
        }),
        done: (s, e, j) => {
          if (j.how === 'measure' && e.h.defect) { s.materials -= 0.75; move(s, e, 'materials', -0.75); scrap(s, 0.75); }
          note(s, e, L('Медицинский журнал', 'Medical log'), j.how === 'replace'
            ? L(`Капсула ${e.grp}-${e.cap}: разъём и датчик заменены, показания канала совпадают с независимым датчиком.`, `Capsule ${e.grp}-${e.cap}: connector and sensor replaced; the channel readings agree with the independent sensor.`)
            : e.h.defect ? L(`Капсула ${e.grp}-${e.cap}: серия подтвердила дефект разъёма — его заменили (−0,75% материалов). Показания канала совпадают с независимым датчиком.`, `Capsule ${e.grp}-${e.cap}: the series confirmed the connector defect — it was replaced (−0.75% of materials). The channel readings now agree with the independent sensor.`)
            : L(`Капсула ${e.grp}-${e.cap}: разъём исправен, сбоил сам датчик — его заменили запасным без расхода материалов.`, `Capsule ${e.grp}-${e.cap}: the connector is sound, the sensor itself was failing — replaced with a spare at no cost in materials.`), 'done');
        }
      },

      // 07 «Тонкое пылевое волокно» — участок среды на пути: пройти (износ щита по модели) или сместиться (−10 км/с)
      dustFilament: {
        kind: 'D', strat: { careful: 'shift', risky: 'pass', frugal: 'pass', avoid: 'shift' }, family: 'external', lam: 0.005, lamMax: 0.008, cooldown: 30, cap: 2,
        rate: s => Math.min(1.5, H.beta(s, s.year) / 0.08),
        name: L('пылевое волокно', 'a dust filament'),
        prepare: (s, e, u) => { const v = H.beta(s, s.year); e.lead = Math.round(60 + u('lead') * 60); e.h.k = Math.round(600 + u('k') * 600);
          e.a = s.year + e.lead * DAY; e.b = e.a + 0.01 / v; e.days = Math.round((e.b - e.a) * 365.25);
          e.lo = H.erosion(s, e.a, e.b, 600); e.hi = H.erosion(s, e.a, e.b, 1200); },
        decision: (s, e) => ({
          scene: 'space',
          title: L('Тонкое пылевое волокно', 'A thin dust filament'),
          context: L(`${e.who.ru}, обзорная смена: прямо по курсу — тонкое пылевое волокно. Мелких ударов больше, рассеянный свет растёт. До кромки — ${e.lead} сут., проход — ${e.days} сут. Плотность пыли в нём в 600–1200 раз выше фоновой; крупных зёрен модель не ждёт.`,
            `${e.who.en}, survey watch: dead ahead is a thin dust filament. Small impacts are up, scattered light is rising. ${e.lead} days to its edge, ${e.days} days to cross it. Its dust is 600 to 1200 times denser than the background; the model expects no large grains.`),
          rec: x => H.shieldMin(x) - e.hi > 2 * H.service() ? { id: 'pass', why: L('щит выдержит с запасом, и это сохраняет резерв манёвров', 'the shield will hold with margin, and this preserves manoeuvre reserve') }
            : { id: 'shift', why: L('щит и так близок к допуску', 'the shield is already close to its limit') },
          options: [{
            id: 'pass',
            label: L('Пройти измеренную кромку', 'Cross at the measured edge'),
            known: lang => lang === 'ru' ? ['Резерв манёвров цел.', `Прогноз износа щита — ${H.nf(e.lo, 2, 'ru')}–${H.nf(e.hi, 2, 'ru')} кг/м² проекции; сейчас минимум ${H.nf(H.shieldMin(s), 2, 'ru')} кг/м².`]
              : ['The manoeuvre reserve is kept.', `Forecast shield wear — ${H.nf(e.lo, 2, 'en')}–${H.nf(e.hi, 2, 'en')} kg/m² of projected area; the minimum now is ${H.nf(H.shieldMin(s), 2, 'en')} kg/m².`],
            effect: x => { medium(x, e); },
            record: L('Корабль идёт сквозь волокно по измеренной кромке. Обзорная смена считает удары.', 'The ship goes through the filament at its measured edge. The survey watch counts the impacts.')
          }, {
            id: 'shift',
            label: L('Сместить траекторию', 'Shift the trajectory'),
            known: lang => lang === 'ru' ? [`Резерв манёвров −10 км/с (−${H.nf(H.dvPct(s, 10), 2, 'ru')}% паспортного).`, 'Волокно остаётся в стороне; дополнительного износа от него не будет.']
              : [`Manoeuvre reserve −10 km/s (−${H.nf(H.dvPct(s, 10), 2, 'en')}% of rated).`, 'The ship bypasses the filament, avoiding the additional erosion it would cause.'],
            effect: x => { x.reserve -= H.dvPct(x, 10); },
            record: L('Коррекция на 10 км/с: волокно проходит в стороне.', 'A 10 km/s correction: the filament passes to one side.')
          }]
        }),
        done: (s, e) => note(s, e, L('Журнал фронтального щита', 'Forward shield log'),
          L(`Волокно пройдено за ${e.days} сут.: пыль сняла ${H.nf(1000 * H.erosion(s, e.a, e.b, e.h.k), 1, 'ru')} г/м² проекции. Минимум по щиту — ${H.nf(H.shieldMin(s), 2, 'ru')} кг/м².`,
            `The filament is crossed in ${e.days} days: the dust removed ${H.nf(1000 * H.erosion(s, e.a, e.b, e.h.k), 1, 'en')} g/m² of projected area. Shield minimum — ${H.nf(H.shieldMin(s), 2, 'en')} kg/m².`), 'done')
      },

      // 10 «Пломба грузового узла» — дефект соединителя 35%; повторная приёмка его полностью различает
      cargoAcceptance: {
        kind: 'D', strat: { careful: 'replace', risky: 'reaccept', frugal: 'reaccept' }, family: 'cargo', lam: 0.006, lamMax: 0.006, cooldown: 25, cap: 2,
        rate: () => 1,
        name: L('пломба грузового узла', 'a cargo seal'),
        prepare: (s, e, u) => { e.h.defect = u('defect') < 0.35; e.node = H.cargo(s); },
        nodeName: (e, lang) => ({ request: ['разъём передатчика из груза заявки', 'the connector of the request-cargo transmitter'],
          berths: ['соединитель спасательного сектора', 'the rescue sector\'s connector'], none: ['разъём запасного приборного блока', 'the connector on the spare instrument block'] })[e.node][lang === 'ru' ? 0 : 1],
        cost: s => H.prod(s) === 'repair' ? 1 : 0.5,
        decision: (s, e, T) => ({
          scene: 'vault',
          title: L('Пломба грузового узла', 'A cargo seal'),
          context: L(`${e.who.ru}, грузовая смена: пломба на узле «${T.nodeName(e, 'ru')}» цела, но сопротивление контакта изменилось после хранения. Есть старая приёмочная запись — с ней и сравнивают.`,
            `${e.who.en}, cargo watch: the seal on ${T.nodeName(e, 'en')} is intact, but the contact resistance has changed in storage. The old acceptance record is there to compare against.`),
          rec: x => rich(x) ? { id: 'replace', why: L('у цели узел должен работать сразу', 'at the target the node has to work at once') }
            : { id: 'reaccept', why: L('материалов мало — сначала повторить приёмочное испытание', 'materials are short — repeat the acceptance test first') },
          options: [{
            id: 'replace',
            label: L('Заменить соединитель', 'Replace the connector'),
            known: lang => lang === 'ru' ? [`Материалы −${H.nf(T.cost(s), 1, 'ru')}%; неделя работы.`, 'Узел готов к работе у цели.']
              : [`Materials −${H.nf(T.cost(s), 1, 'en')}%; a week of work.`, 'The node is ready to work at the target.'],
            effect: x => { const c = T.cost(x); x.materials -= c; scrap(x, c); job(x, e, 'replace', 7 * DAY); },
            record: L('Соединитель меняют; старый — в лом.', 'The connector is replaced; the old one goes to scrap.')
          }, {
            id: 'reaccept',
            label: L('Повторить приёмочное испытание', 'Repeat the acceptance test'),
            known: lang => lang === 'ru' ? [`Материалы −0,25%; ${H.probes(s) === 'inspect' ? 'двадцать суток (инспекционный зонд)' : 'сорок пять суток'}.`, 'Если найдут дефект — ещё −0,75% на замену.']
              : [`Materials −0.25%; ${H.probes(s) === 'inspect' ? 'twenty days (the inspection probe)' : 'forty-five days'}.`, 'If a defect is found — another −0.75% for the replacement.'],
            cost: x => { x.materials -= 0.25; },
            effect: x => { x.materials -= 0.25; job(x, e, 'reaccept', (H.probes(x) === 'inspect' ? 20 : 45) * DAY); },
            record: L(`${e.who.ru} повторяет приёмочное испытание узла.`, `${e.who.en} repeats the unit's acceptance test.`)
          }]
        }),
        done: (s, e, j) => {
          if (j.how === 'reaccept' && e.h.defect) { s.materials -= 0.75; move(s, e, 'materials', -0.75); scrap(s, 0.75); }
          note(s, e, L('Грузовой журнал', 'Cargo log'), j.how === 'replace' ? L('Соединитель заменён; узел прошёл приёмочное испытание.', 'The connector has been replaced; the unit has passed the acceptance test.')
            : e.h.defect ? L('Испытание нашло дефект контакта — соединитель заменён (−0,75% материалов). Узел принят.', 'The acceptance test found a contact defect — the connector was replaced (−0.75% of materials). The unit is accepted.')
            : L('Испытание: дрейф сопротивления измерительного контакта, сам узел исправен. Принят без замены.', 'Acceptance test: the measurement contact\'s resistance had drifted; the unit itself is sound. It passed without replacement.'), 'done');
        }
      },

      // 13 «Две смены без передачи» — усталость тонкой вахты; без шкалы морали
      fatigue: {
        kind: 'D', strat: { careful: 'double', risky: 'rotate', frugal: 'rotate' }, family: 'watch', lam: 0.008, lamMax: 0.012, cooldown: 25, cap: 2, council: true,
        rate: s => H.thin(s) ? 1.5 : 1,
        name: L('две передачи без подписи', 'two unsigned handovers'),
        prepare: (s, e, u) => { e.two = H.pickName(s, u('two'), e.whoI); },
        decision: (s, e) => ({
          scene: 'ring',
          title: L('Две передачи без подписи', 'Two unsigned handovers'),
          context: L(`Журнал смен: дважды за месяц при передаче задания нет подписи. ${e.who.ru} и ${e.two.ru} объясняют: закрывали чужую работу — рук не хватает.`,
            `The watch log: twice in a month a task was handed over unsigned. ${e.who.en} and ${e.two.en} explain: they were covering someone else's work — there are not enough hands.`),
          rec: x => rich(x) ? { id: 'double', why: L('стенд дешевле сорванного графика', 'a test bench costs less than a broken schedule') }
            : { id: 'rotate', why: L('материалов мало — перестроим дежурства', 'materials are short — rebuild the duty rota') },
          options: [{
            id: 'rotate',
            label: L('Перестроить дежурства', 'Rebuild the duty rota'),
            known: lang => lang === 'ru' ? ['Материалы целы.', 'Полгода — организационная и учебная работа; новые работы мастерской на это время ждут.']
              : ['The materials are kept.', 'Half a year of organising and training; new workshop jobs wait until then.'],
            effect: x => { job(x, e, 'rotate', 0.5, ['workshop']); },
            record: L(`Дежурства перестраивают: ${e.who.ru} и ${e.two.ru} больше не закрывают чужие смены.`, `The rota is rebuilt: ${e.who.en} and ${e.two.en} no longer cover other people's watches.`)
          }, {
            id: 'double',
            label: L('Поставить двойную проверку операций', 'Set up a double check of operations'),
            known: lang => lang === 'ru' ? [`Материалы −1% на контрольный стенд; ${H.repairQual(s) ? 'двадцать суток (с допуском — быстрее)' : 'месяц работы'}.`, 'Прежний график сохраняется.']
              : [`Materials −1% for a test bench; ${H.repairQual(s) ? 'twenty days (faster with the qualification)' : 'a month of work'}.`, 'The old schedule stays.'],
            effect: x => { x.materials -= 1; job(x, e, 'double', (H.repairQual(x) ? 20 : 30) * DAY); },
            record: L('Ставят контрольный стенд: каждая передача задания — с двумя подписями.', 'A test bench goes in: every task handover gets two signatures.')
          }]
        }),
        done: (s, e, j) => note(s, e, L('Журнал смен', 'Watch log'), j.how === 'rotate'
          ? L(`Полгода по новому графику: пропусков подписи нет. ${e.who.ru} и ${e.two.ru} — на своих сменах.`, `Half a year on the new rota: no missed signatures. ${e.who.en} and ${e.two.en} are on their own watches.`)
          : L('Контрольный стенд работает: передачи заданий — с двумя подписями, пропусков нет.', 'The test bench works: task handovers carry two signatures, none missed.'), 'done')
      },

      // 14 «Одна общая вахта» — просьба совместить вахты; обмен годами запрещён очередью (тритмент)
      overlap: {
        kind: 'D', strat: { careful: 'now', risky: 'later', frugal: 'later' }, family: 'watch', lam: 0.006, lamMax: 0.006, cooldown: 30, cap: 2, council: true,
        rate: () => 1,
        name: L('просьба об общей вахте', 'a request for a shared watch'),
        prepare: (s, e, u) => { e.two = H.pickName(s, u('two'), e.whoI); },
        decision: (s, e) => ({
          scene: 'ring',
          title: L('Одна общая вахта', 'One shared watch'),
          context: L(`${e.who.ru} и ${e.two.ru} просят совместить вахты: годы на борту у них расходятся, и следующий цикл они снова проведут порознь. Обменять годы нельзя — правило очереди. ${e.two.ru} сейчас работает в ремонтной бригаде.`,
            `${e.who.en} and ${e.two.en} ask to have their watches together: their years aboard are drifting apart, and the next cycle they will again spend apart. Years cannot be traded — the queue's rule. ${e.two.en} is working with the repair crew right now.`),
          rec: x => !H.thin(x) ? { id: 'now', why: L('численность вахты позволяет совместить назначения сейчас', 'watch staffing allows the assignments to be aligned now') }
            : { id: 'later', why: L('вахта тонкая — ремонт важнее', 'the watch is thin — the repair comes first') },
          options: [{
            id: 'now',
            label: L('Свести назначения в ближайший период', 'Bring the assignments together now'),
            known: lang => lang === 'ru' ? ['Полгода — обучение замены для ремонтной бригады.', 'Новые работы мастерской на это время ждут.']
              : ['Half a year of training a replacement for the repair crew.', 'New workshop jobs wait until then.'],
            effect: x => { job(x, e, 'now', 0.5, ['workshop']); },
            record: L(`Назначения сводят: ${e.two.ru} передаёт работу в бригаде и готовит замену.`, `The assignments are brought together: ${e.two.en} hands over the crew work and trains a replacement.`)
          }, {
            id: 'later',
            label: L('Сохранить назначения до конца ремонта', 'Keep the assignments until the repair is done'),
            known: lang => lang === 'ru' ? ['Сейчас — без расхода.', 'Через два года, после завершения ремонта, назначения будут совмещены.']
              : ['No cost now.', 'In two years, after the repair is done, the two will be assigned to the same watch.'],
            effect: x => { job(x, e, 'later', 2); },
            record: L(`Просьба принята: общая вахта назначена через два года, после завершения ремонта.`, `Request approved: a shared watch is scheduled in two years, after the repair is done.`)
          }]
        }),
        done: (s, e, j) => note(s, e, L('Журнал смен', 'Watch log'), j.how === 'now'
          ? L(`${e.who.ru} и ${e.two.ru} — на одной вахте. Замена в ремонтной бригаде работает сама.`, `${e.who.en} and ${e.two.en} are on the same watch. The replacement in the repair crew works on their own.`)
          : L(`Два года прошли: ремонт закончен, ${e.who.ru} и ${e.two.ru} теперь на одной вахте, как обещали.`, `Two years have passed: the repair is done, and ${e.who.en} and ${e.two.en} are on the same watch, as promised.`), 'done')
      },

      // 16 «Навык остался в инструкции» — локальный допуск, не глобальные repairQual/taught
      skill: {
        kind: 'D', strat: { careful: 'course', risky: 'archive', frugal: 'archive' }, family: 'watch', lam: 0.006, lamMax: 0.006, cooldown: 30, cap: 2, council: true,
        rate: s => H.taught(s) || H.repairQual(s) ? 0.6 : 1,
        name: L('навык в инструкции', 'a skill left in the manual'),
        prepare: (s, e, u) => { e.fam = Math.floor(u('fam') * 3); },
        // система (род. п. / англ.) и операция, которую меняет навык: именительный, предложный, англ.
        famName: (e, lang) => [['системы охлаждения', 'the cooling system'], ['системы жизнеобеспечения', 'the life-support system'], ['навигационных приборов', 'the navigation instruments']][e.fam][lang === 'ru' ? 0 : 1],
        op: (e, form) => ({ nom: ['замена вставки шва радиатора', 'замена сорбента', 'навигационная серия наблюдений'], loc: ['замене вставки шва радиатора', 'замене сорбента', 'навигационной серии наблюдений'],
          en: ['replacing a radiator seam insert', 'replacing the air-filter sorbent', 'a navigation observing series'] })[form][e.fam],
        cost: s => H.prod(s) === 'repair' ? 1 : 0.5,
        decision: (s, e, T) => ({
          scene: 'ring',
          title: L('Навык остался в инструкции', 'A skill left in the manual'),
          context: L(`${e.who.ru} из новой смены ремонтной бригады воспроизводит процедуру ремонта ${T.famName(e, 'ru')} без ошибок, но не может объяснить, при каких показаниях она неприменима. Тот, кто учил, спит.`,
            `${e.who.en}, on the repair crew's new shift, follows the repair procedure for ${T.famName(e, 'en')} without errors but cannot explain which readings rule out its use. The one who taught it is asleep.`),
          rec: x => rich(x) ? { id: 'course', why: L(`${T.op(e, 'nom')} пойдёт вдвое быстрее`, `${T.op(e, 'en')} will take half the time`) }
            : { id: 'archive', why: L('материалов мало — проверка по архиву', 'materials are short — check against the archive') },
          options: [{
            id: 'course',
            label: L('Практический курс на испытательном стенде', 'A practical course on an operational test bench'),
            known: lang => lang === 'ru' ? [`Материалы −${H.nf(T.cost(s), 1, 'ru')}%; полгода.`, `После курса ${T.op(e, 'nom')} занимает вдвое меньше времени, чем обычно.`]
              : [`Materials −${H.nf(T.cost(s), 1, 'en')}%; half a year.`, `After the course, ${T.op(e, 'en')} takes half the standard time.`],
            effect: x => { x.materials -= T.cost(x); job(x, e, 'course', 0.5); },
            record: L(`${e.who.ru} и напарник проходят курс на испытательном стенде.`, `${e.who.en} and a partner take the course on a test bench.`)
          }, {
            id: 'archive',
            label: L('Взаимная проверка по архиву', 'Cross-check against the archive'),
            known: lang => lang === 'ru' ? ['Материалы −0,25%; полгода.', `При ${T.op(e, 'loc')} обязательна отдельная проверка: на 30 сут. дольше обычного.`]
              : ['Materials −0.25%; half a year.', `${T.op(e, 'en')[0].toUpperCase() + T.op(e, 'en').slice(1)} will need a separate check, adding 30 days to the standard duration.`],
            effect: x => { x.materials -= 0.25; job(x, e, 'archive', 0.5); },
            record: L('Смена сверяет процедуру с архивом прежних ремонтов.', 'The shift checks the procedure against the archive of past repairs.')
          }]
        }),
        done: (s, e, j) => (s.ev.qual[['cooling', 'lifeSupport', 'navigation'][e.fam]] = j.how === 'course' ? 'skilled' : 'checked', note(s, e, L('Журнал ремонтной бригады', 'Repair crew log'), j.how === 'course'
          ? L(`Курс закончен: двое подтвердили навык ремонта ${TYPES.skill.famName(e, 'ru')} на испытательном стенде, с границами применимости; ${TYPES.skill.op(e, 'nom')} теперь вдвое быстрее.`,
            `The course is done: two have confirmed the repair skill for ${TYPES.skill.famName(e, 'en')} on the test bench, limits of use included; ${TYPES.skill.op(e, 'en')} now takes half the time.`)
          : L(`Сверка с архивом закончена: при ${TYPES.skill.op(e, 'loc')} — отдельная проверка, на 30 сут. дольше обычного.`,
            `The archive check is done: ${TYPES.skill.op(e, 'en')} now needs a separate check, adding 30 days.`), 'done'))
      },

      // 20 «Класс пыли верен, вывод — нет» — ошибка области применимости научной модели
      dustClass: {
        kind: 'D', strat: { careful: 'compare', risky: 'assume', frugal: 'compare' }, family: 'ai', lam: 0.006, lamMax: 0.006, cooldown: 30, cap: 2, council: true,
        rate: s => H.taught(s) ? 0.6 : 1,
        name: L('класс пыли верен, вывод — нет', 'the dust class is right, the conclusion is not'),
        decision: (s, e) => ({
          scene: 'space',
          title: L('Класс пыли верен, вывод — нет', 'The dust class is right, the conclusion is not'),
          context: L(`${e.who.ru}, научная смена: спектр пыли по курсу совпал с известным классом, но счётчики ударов не сходятся с выведенной из него крупностью частиц. Данные исправны — модель применили за пределами её области.`,
            `${e.who.en}, science watch: the spectrum of the dust ahead matches a known class, but the impact counters disagree with the grain size the model derives from it. The data are sound — the model was used outside its range.`),
          rec: x => !(x.ev && x.ev.jobs.some(j => j.type === 'navResidual')) ? { id: 'compare', why: L('прибор свободен, и это сохраняет резерв манёвров', 'the instrument is free, and this preserves manoeuvre reserve') }
            : { id: 'assume', why: L('прибор занят навигационной серией', 'the instrument is busy with a navigation series') },
          options: [{
            id: 'compare',
            label: L('Сопоставить с показаниями счётчиков ударов', 'Compare with impact-counter readings'),
            known: lang => lang === 'ru' ? [`${H.sensors(s) === 'spectraPlus' ? 'Сорок пять' : 'Девяносто'} суток; прибор занят — навигационные серии ждут.`, 'Класс остаётся, оценка крупности пересчитывается.']
              : [`${H.sensors(s) === 'spectraPlus' ? 'Forty-five' : 'Ninety'} days; the instrument is busy — navigation series wait.`, 'The class stays; the grain-size estimate is recomputed.'],
            effect: x => { job(x, e, 'compare', (H.sensors(x) === 'spectraPlus' ? 45 : 90) * DAY, ['navigation']); },
            record: L(`${e.who.ru} сопоставляет спектральные данные и показания счётчиков ударов за одни и те же интервалы.`, `${e.who.en} compares spectral data with impact-counter readings from the same time intervals.`)
          }, {
            id: 'assume',
            label: L('Принять верхнюю границу опасности', 'Assume the upper bound of danger'),
            known: lang => lang === 'ru' ? [`Резерв манёвров −6 км/с (−${H.nf(H.dvPct(s, 6), 2, 'ru')}% паспортного) на консервативную коррекцию.`, 'Новых измерений нет.']
              : [`Manoeuvre reserve −6 km/s (−${H.nf(H.dvPct(s, 6), 2, 'en')}% of rated) for a conservative correction.`, 'No new measurements.'],
            effect: x => { x.reserve -= H.dvPct(x, 6); },
            record: L('Коррекция на 6 км/с по верхней границе опасности.', 'A 6 km/s correction for the upper bound of danger.')
          }]
        }),
        done: (s, e) => note(s, e, L('Научный журнал', 'Science log'), L('Сверка закончена: класс пыли определён верно; уточнённая оценка размера частиц втрое меньше прежней. Область применимости модели уточнена; в архиве сохранены прежний вывод и данные, на которых основан пересмотр.',
          'Cross-check complete: the dust classification is correct; the revised grain-size estimate is one third of the previous one. The model\'s domain of applicability has been clarified; the archive keeps the earlier conclusion and the data behind the revision.'), 'done')
      },

      // 26 «Бюллетень об отзыве детали» — Кольцо; дефект конкретного экземпляра 30%
      recall: {
        kind: 'D', strat: { careful: 'fix', risky: 'check', frugal: 'check' }, family: 'ring', lam: 0.006, lamMax: 0.006, cooldown: 40, cap: 1,
        rate: () => 1,
        name: L('отзыв клапанов по бюллетеню Кольца', 'a valve recall announced in a Ring bulletin'),
        prepare: (s, e, u) => { e.series = 100 + Math.floor(u('series') * 800); e.h.defect = u('defect') < 0.3; e.lag = H.lag(s); e.after = 40 + Math.round(u('after') * 40); },
        cost: s => H.prod(s) === 'printQC' ? 1 : H.prod(s) === 'tools' ? 1.5 : 2,
        decision: (s, e, T) => ({
          scene: 'ring',
          title: L('Бюллетень об отзыве детали', 'A part recall bulletin'),
          context: L(`Бюллетень Кольца, отправлен ${H.yrs(e.lag, 'ru')} назад: в серии ${e.series} клапанов теплообменника найден дефект уплотнения — на Земле испытания показали течь после ${yGen(e.after)} работы. На борту стоят клапаны этой серии. ${e.who.ru} сверяет номера с паспортом.`,
            `A Ring bulletin, sent ${H.yrs(e.lag, 'en')} ago: series ${e.series} heat-exchanger valves have a seal defect — tests on Earth showed a leak after ${e.after} years of service. Valves of this series are aboard. ${e.who.en} checks the numbers against the equipment records.`),
          rec: x => rich(x, 5) ? { id: 'fix', why: L('исправление гарантированное, материалы есть', 'the fix is certain, and there are materials') }
            : { id: 'check', why: L('материалов мало — сначала проверить нашу серию', 'materials are short — check our series first') },
          options: [{
            id: 'fix',
            label: L('Применить исправление', 'Apply the fix'),
            known: lang => lang === 'ru' ? [`Материалы −${H.nf(T.cost(s), 1, 'ru')}%; шестьдесят суток.`, 'Дефект уплотнения будет устранён на всех клапанах этой серии на борту.']
              : [`Materials −${H.nf(T.cost(s), 1, 'en')}%; sixty days.`, 'The seal defect will be eliminated in all valves of this series aboard.'],
            effect: x => { const c = T.cost(x); x.materials -= c; scrap(x, c); job(x, e, 'fix', 60 * DAY); },
            record: L(`Уплотнения клапанов серии ${e.series} меняют по бюллетеню.`, `The seals of the series ${e.series} valves are replaced per the bulletin.`)
          }, {
            id: 'check',
            label: L('Проверить нашу серию прицельно', 'Check our series specifically'),
            known: lang => lang === 'ru' ? ['Материалы −0,5%; сто восемьдесят суток.', `Замена — только при подтверждении дефекта: ещё −${H.nf(T.cost(s), 1, 'ru')}%.`]
              : ['Materials −0.5%; a hundred and eighty days.', `Replacement only if the defect is confirmed: another −${H.nf(T.cost(s), 1, 'en')}%.`],
            cost: x => { x.materials -= 0.5; },
            effect: x => { x.materials -= 0.5; job(x, e, 'check', 180 * DAY); },
            record: L(`${e.who.ru} ставит клапаны серии ${e.series} на прицельную проверку.`, `${e.who.en} puts the series ${e.series} valves through a targeted check.`)
          }]
        }),
        done: (s, e, j) => {
          if (j.how === 'check' && e.h.defect) { const c = TYPES.recall.cost(s); s.materials -= c; move(s, e, 'materials', -c); scrap(s, c); }
          note(s, e, L('Журнал теплообменника', 'Heat-exchanger log'), j.how === 'fix'
            ? L(`Уплотнения серии ${e.series} заменены: дефект, описанный в бюллетене, устранён.`, `The series ${e.series} seals are replaced: the defect described in the bulletin has been eliminated.`)
            : e.h.defect ? L(`Проверка подтвердила дефект на наших клапанах серии ${e.series} — уплотнения заменены. Ответ Кольцу ушёл.`, `The check confirmed the defect on our series ${e.series} valves — the seals are replaced. A reply has gone to the Ring.`)
            : L(`Проверка: наши клапаны серии ${e.series} исправны — дефект их экземпляров не коснулся. Ответ Кольцу ушёл.`, `The check: our series ${e.series} valves are sound — the defect did not touch these units. A reply has gone to the Ring.`), 'done');
        }
      }
    };

    // ---------------------------------------------------------------- профиль рейса и разнообразие (шаг 4)
    // источник напряжения (концепт §5): корабль, общество вахт, ИИ, внешнее
    const SOURCE = { lifeSupport: 'ship', cooling: 'ship', capsules: 'ship', cargo: 'ship', workshop: 'ship', navigation: 'ship', watch: 'watch', ai: 'ai', external: 'external', ring: 'external' };
    // G — предел паузы между любыми решениями (плановый совет), LD — потолок частоты решений событий в год;
    // длинный рейс: тип — до трёх раз и не чаще раза в 60 лет
    function profile(s) {
      const T = (s.arrive || 0) - 20, long = T >= 220;
      return { long, G: s.mission === 'supply' ? 12 : T >= 400 ? 30 : T >= 220 ? 22 : 16, LD: s.mission === 'supply' ? 0.09 : T >= 400 ? 0.045 : T >= 220 ? 0.06 : 0.08,
        g: s.mission === 'supply' ? 2 : s.mission === 'rescue' ? 3 : T >= 400 ? 6 : T >= 220 ? 4 : 3 };
    }
    const capOf = (s, T) => T.cap + (profile(s).long ? 1 : 0);
    // рекомендация совета тратить материалы: на длинном рейсе — только при большом запасе (впереди ещё века ремонтов)
    const rich = (x, d = 0) => x.materials >= (profile(x).long ? 50 : 25) + d;
    const coolOf = (s, T) => profile(s).long ? Math.max(T.cooldown, 60) : T.cooldown;
    // повторы: тип — не среди шести последних эпизодов; источник — не больше двух эпизодов подряд
    function diverse(s, type) {
      const r = s.ev.recent, src = SOURCE[TYPES[type].family];
      return !r.slice(-6).includes(type) && !(r.length >= 2 && r.slice(-2).every(x => SOURCE[TYPES[x].family] === src));
    }

    // ---------------------------------------------------------------- состояние
    function init(s) {
      if (s.ev) return s.ev;
      s.ev = { clock: {}, n: {}, last: {}, root: -Infinity, recent: [], councilAt: null, log: [], jobs: [], notes: [], moves: [], media: [], qual: {}, scrap: 0, recovered: 0 };
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
      for (const type of Object.keys(TYPES)) { const c = clockOf(s, type), at = Math.max(c.at, t0 + 1e-9);   // отставшие часы — на ближайшей границе
        if (at <= t1 && (!best || at < best.at)) best = { at, type, k: c.k }; }
      if (s.ev.councilAt != null) { const at = Math.max(s.ev.councilAt, t0 + 1e-9);
        if (at <= t1 && (!best || at < best.at)) best = { at, council: true }; }
      return best;
    }
    const scrap = (s, x) => { init(s); s.ev.scrap += x; };
    function decided(s) {
      if (!s.eq || !s.riskSeed || s.evOff) return;
      init(s);
      const t0 = s.year, P = profile(s);
      let at = t0 + P.G;
      // предел в защищённом окне (у сюжетной даты, у края дрейфа) — ближайшее разрешённое время раньше, шагом в четверть года
      for (let x = at; x > t0 + P.g; x -= 0.25) if (H.window(s, x, 'council')) { at = x; break; }
      s.ev.councilAt = at;
    }
    function job(s, e, how, years, blocks) { init(s); s.ev.jobs.push({ id: e.id, type: e.type, how, until: s.year + years, dur: years, blocks: blocks || [] }); }
    // навык семьи работ (событие «навык в инструкции»): курс — вдвое быстрее, сверка по архиву — нестандартное с проверкой (+30 суток)
    const qual = (s, fam) => s.ev && s.ev.qual ? s.ev.qual[fam] : undefined;
    const dur = (s, fam, days) => qual(s, fam) === 'skilled' ? Math.round(days / 2) : qual(s, fam) === 'checked' ? days + 30 : days;
    const qualNote = (s, fam, lang) => qual(s, fam) === 'skilled' ? (lang === 'ru' ? ' (навык подтверждён — вдвое быстрее)' : ' (a confirmed skill — twice as fast)')
      : qual(s, fam) === 'checked' ? (lang === 'ru' ? ' (с отдельной проверкой)' : ' (with a separate check)') : '';
    const dd = (n, lang) => lang === 'ru' ? `${n} сут.` : `${n} day${n === 1 ? '' : 's'}`;
    // «после 41 года / 45 лет» — родительный падеж
    const yGen = n => `${n} ${n % 10 === 1 && n % 100 !== 11 ? 'года' : 'лет'}`;
    // участок среды на пути (пылевое волокно): плотность пыли ×k на [a, b]; модель щита режет по его границам
    function medium(s, e) { init(s); s.ev.media.push({ id: e.id, a: e.a, b: e.b, k: e.h.k });
      job(s, e, 'pass', e.b - s.year); }
    const rhoK = (s, y) => { const m = s.ev && s.ev.media && s.ev.media.find(x => y >= x.a && y <= x.b); return m ? m.k : 0; };
    const marks = s => s.ev && s.ev.media ? s.ev.media.flatMap(x => [x.a, x.b]) : [];
    function move(s, e, key, d) { s.ev.moves.push({ at: s.year, key, d, id: e.id, name: TYPES[e.type].name }); }
    function note(s, e, title, text, stage) {
      if (H.book) H.book(s, `ev.${e.type}`);                              // журнал запасов и людей — до снимка: снимок с ним сходится
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
      const t = s.year;
      if (b.council) {                                                  // плановый совет: пауза без решений дошла до предела
        if (!H.window(s, t, 'council')) { ev.councilAt = t + 0.5; return null; }
        // тип — из свободных и не исчерпанных; сначала с соблюдением разнообразия, затем без него; раньше — у кого ближе кандидат
        // у совета — на два повтора темы больше, чем у естественного потока (до шага 6 каталога тем на длинный рейс мало)
        const free = type => H.window(s, t, TYPES[type].family) && (ev.n[type] || 0) < capOf(s, TYPES[type]) + 2 && freeAt(s, type, true, t) <= t + 1e-9;
        const D = Object.keys(TYPES).filter(type => TYPES[type].council && free(type)).sort((a, c) => clockOf(s, a).at - clockOf(s, c).at);
        const type = D.find(x => diverse(s, x)) || D[0];
        if (!type) { ev.councilAt = t + 1; return null; }
        const k = clockOf(s, type).k; step(s, type);
        return admit(s, type, k, t, true);
      }
      const type = b.type, T = TYPES[type], k = b.k;
      if (!H.window(s, t, T.family) || (ev.n[type] || 0) >= capOf(s, T)) { step(s, type); return null; }   // вне окна или лимит — кандидат пропадает
      // занят (пауза между эпизодами, повтор типа, работа той же семьи) — кандидат ждёт освобождения, а не пропадает;
      // свой сдвиг у каждого типа: отложенные на одно освобождение не совпадают (ревью Codex: проигравшие зависали)
      const fr = freeAt(s, type, false, t);
      if (fr > t + 1e-9) { ev.clock[type] = { k, at: fr + 1e-6 * (1 + Object.keys(TYPES).indexOf(type)) }; return null; }
      step(s, type);
      if (!diverse(s, type)) return null;                               // разнообразие: такой эпизод был только что
      const u = key => H.hidden(s, `events.${type}.${k}.${key}`) ?? 0.5;
      const sumD = Object.values(TYPES).filter(X => X.kind === 'D').reduce((a, X) => a + X.lam * X.rate(s), 0);
      const norm = T.kind === 'D' ? Math.min(1, profile(s).LD / sumD) : 1;   // потолок частоты решений по профилю рейса
      if (!(u('accept') < T.lam * T.rate(s) * norm / T.lamMax)) return null;
      return admit(s, type, k, t, false);
    }
    // когда тип свободен: пауза между эпизодами (у совета её нет), повтор типа, работы той же семьи
    function freeAt(s, type, council, t) {
      const ev = s.ev, T = TYPES[type], g = profile(s).g;
      const beforeCouncil = !council && ev.councilAt != null && t != null && ev.councilAt >= t - 1e-9 && ev.councilAt - t < g ? ev.councilAt + g : -Infinity;
      return Math.max(council ? -Infinity : ev.root + g, beforeCouncil, (ev.last[type] ?? -Infinity) + coolOf(s, T),
        ...ev.jobs.filter(j => j.type === type || j.blocks.includes(T.family)).map(j => j.until));
    }
    // экземпляр события: участник, параметры, учёт; N — сразу запись, D — вставка-решение
    function admit(s, type, k, t, council) {
      const ev = s.ev, T = TYPES[type], u = key => H.hidden(s, `events.${type}.${k}.${key}`) ?? 0.5;
      const alive = H.alive(s), who = alive.length ? alive[Math.floor(u('who') * alive.length) % alive.length] : 0;
      const e = { id: `${type}.${k}`, type, k, at: t, whoI: who, who: H.name(s, who), h: {} };
      if (council) e.council = true;
      if (T.prepare) T.prepare(s, e, u);
      ev.n[type] = (ev.n[type] || 0) + 1; ev.last[type] = t; ev.root = t; ev.log.push(e); ev.recent.push(type);
      if (T.kind === 'N') { T.apply(s, e); return null; }
      return { kind: 'event', id: e.id, type };
    }
    // решение-вставка по событию: id и текст — от экземпляра (имена записаны при генерации, с сидом)
    function decision(s, ev) {
      const e = s.ev.log.find(x => x.id === ev.id), T = TYPES[e.type], d = T.decision(s, e, T);
      const opts = d.options.map(o => Object.assign({}, o, { effect: x => { o.effect(x); const i = x.ev.log.find(y => y.id === e.id); if (i) i.choice = o.id; },
        known: { ru: () => pick('ru', o.known), en: () => pick('en', o.known) } }));
      // плановый совет — тот же вопрос, поднятый разбором смены, а не тревогой
      const context = e.council ? { ru: 'Плановое заседание совета. ' + d.context.ru, en: 'Scheduled council meeting. ' + d.context.en } : d.context;
      return { id: `d.ev.${e.id}`, kind: 'decision', eventType: e.type, scene: d.scene, title: d.title, context, rec: d.rec, options: opts };
    }
    // записи журнала, накопленные моделью (забирает движок)
    function take(s) { if (!s.ev) return []; const out = s.ev.notes; s.ev.notes = []; return out; }
    // эпизоды периода для отчёта вахты: [{ at, name, choice }]
    const since = (s, y0, y1) => s.ev ? s.ev.log.filter(e => e.at > y0 + 1e-9 && e.at <= y1 + 1e-9) : [];
    const movesIn = (s, key, y0, y1) => s.ev ? s.ev.moves.filter(m => m.key === key && m.at > y0 + 1e-9 && m.at <= y1 + 1e-9) : [];
    // для интерфейса: будущие кандидаты — скрытое состояние
    const strip = p => { if (p && p.ev) { delete p.ev.clock; p.ev.log.forEach(x => { delete x.h; });
      p.ev.media = (p.ev.media || []).map(({ id, a, b }) => ({ id, a, b })); } return p; };
    return { TYPES, next, fire, decision, decided, take, since, movesIn, strip, scrap, rhoK, marks, profile };
  }

  const api = { create };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.M31Events = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
