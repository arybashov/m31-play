// М31 · срез — сюжет: пролог. Сцены по порядку (движок идёт по массиву content.beats); собираются в content.js:
// фабрика получает общие имена content.js (помощники, константы, модели) и возвращает сцены акта.
(function (root) {
  'use strict';
  const prologue = K => {
    const {
      M, R, agendaOf, arriveX, colonyTie, councilText, crewOf, crewWord, goalOf, nm, passportOptions, passportParse, requestOption, rescueS, supplyS,
      urgentOf
    } = K;
    return [
    // ------------------------------------------------------------ ПРОЛОГ
    {
      id: 'p.council', scene: 'council', kind: 'transcript', year: 0,
      title: { ru: 'Совет Звездоплавания', en: 'Council of Star Navigation' },
      text: { ru: s => councilText(s, 'ru'), en: s => councilText(s, 'en') }
    },
    {
      // голосование — по заявкам повестки; рядом карта-обзор (ui: 'agenda'): звёзды можно смотреть, курс задаёт заявка
      id: 'd.mission', scene: 'agenda', kind: 'decision', year: 0, ui: 'agenda',
      title: { ru: 'Какую заявку берёт сорок первая', en: 'Which request the Forty-First takes on' },
      context: {
        ru: 'Совет голосует. Заявка задаёт и звезду, и работу; остальные остаются в очереди — их возьмут следующие экспедиции, через годы.',
        en: 'The Council votes. A request sets both the star and the work; the rest stay in the queue for later expeditions — years from now.'
      },
      options: s => agendaOf(s).map(requestOption)
    },
    {
      id: 'p.station', scene: 'council', kind: 'archive', year: 0, inline: 'probe', when: s => s.requestId === 'req:search32:e32',
      place: { ru: 'Земля, Совет Звездоплавания · приложение к исследовательской заявке', en: 'Earth, Council of Star Navigation · research request annex' },
      text: {
        ru: `В приложении — две записи станции связи Кольца из одного сектора неба.

Первая — обрывок последней передачи тридцать второй, принятый шесть лет назад:

«…красивее всего, что мы видели…»

Вторая пришла в тот же год. Последовательность повторяется каждые сорок минут; её кода нет в каталогах Кольца.

Направления сопоставлены: области погрешности перекрываются. Общий район возможен, связь записей не доказана.

Орин прикладывает заявленный маршрут тридцать второй — к ε Индейца.

— Там можно искать её след и источник сигнала, — говорит он. — Для другой звезды запишем другое задание.`,
        en: `The annex holds two recordings from the Ring's contact station, from the same sector of sky.

The first is a fragment of the Thirty-Second's last transmission, received six years ago:

'…more beautiful than anything we've seen…'

The second arrived the same year. Its sequence repeats every forty minutes; its code is in none of the Ring's catalogues.

The directions have been compared: the uncertainty regions overlap. A common origin is possible; a link between the recordings is not proven.

Orin attaches the Thirty-Second's declared route — to ε Indi.

"That is where to search for its trace and the signal source," he says. "Another star will get another task."`
      }
    },
    {
      id: 'p.requestEvidence', scene: 'council', kind: 'archive', year: 0, when: s => !!(s.requestId && R.TEXT[s.requestId]),
      place: { ru: 'Земля, Совет Звездоплавания · приложение к заявке', en: 'Earth, Council of Star Navigation · request annex' },
      text: { ru: s => R.TEXT[s.requestId].annex.ru, en: s => R.TEXT[s.requestId].annex.en }
    },
    {
      id: 'p.supplyEvidence', scene: 'council', kind: 'archive', year: 0, when: supplyS,
      place: { ru: 'Земля, Совет Звездоплавания · приложение к заявке', en: 'Earth, Council of Star Navigation · request annex' },
      text: {
        ru: `В приложении к заявке Ксилоны Ир — ведомость разобранного оборудования.

Напротив мастерской стоит: «насосы переданы капсульной смене». Напротив привода антенны: «оставлен ручной».

Нил Дассер задерживает запись на подписи местного совета.

— Они просят две вещи, — говорит он. — Но платят за них всем остальным.

Ирина Кассель велит приложить ведомость к паспорту экспедиции.`,
        en: `Attached to Xylona Ir's request is a list of dismantled equipment.

Beside the workshop: "Pumps transferred to the capsule shift." Beside the antenna drive: "Manual operation retained."

Nil Dasser pauses the record at the local council's signature.

"They ask for two things," he says. "But they are paying with everything else."

Irina Kassel has the list attached to the expedition passport.`
      }
    },
    {
      id: 'p.rescueEvidence', scene: 'council', kind: 'archive', year: 0, when: rescueS,
      effect: s => { s.rescueEvidence = true; },
      place: { ru: 'Земля, Совет Звездоплавания · последние передачи Оттепели', en: "Earth, Council of Star Navigation · Thaw's last transmissions" },
      text: {
        ru: `В техническом отчёте Оттепели: «Хранение штатное. Занято сорок капсул». Медицинское приложение обрывается посреди перечня каналов.

Ирина Кассель кладёт документы рядом.

— Сорок занятых мест ещё не означают сорок живых людей. В паспорт войдут оба отчёта.`,
        en: `Thaw's technical report reads: "Storage nominal. Forty capsules occupied." The medical attachment stops halfway through the channel list.

Irina Kassel lays the documents side by side.

"Forty occupied places do not yet mean forty living people. Both reports go into the passport."`
      }
    },
    {
      id: 'd.passport', scene: 'fitting', kind: 'decision', year: 0, ui: 'passport',
      title: { ru: 'Паспорт экспедиции', en: 'Expedition passport' },
      context: {
        ru: s => `Кольцо выделило 1,24 млн т D+³He. Больше не будет: гелий-3 добывают годами, а ${urgentOf(s, 'ru')}. Ядро корабля неизменно; решаем, сколько топлива уйдёт на скорость, сколько — на резерв и груз.`,
        en: s => `The Ring has allotted 1.24 million tonnes of D+³He. There will be no more: helium-3 takes years to mine, and ${urgentOf(s, 'en')}. The ship's core is fixed; we decide how much fuel goes to speed and how much to reserve and cargo.`
      },
      options: s => passportOptions(s),
      option: (s, id) => passportParse(s, id)
    },
    {
      id: 'p.supplyPromise', scene: 'register', kind: 'document', year: 0, when: supplyS,
      title: { ru: 'Обязательство перед Ксилоной Ир', en: 'The commitment to Xylona Ir' },
      text: {
        ru: s => `В обязательстве записаны капсулы, дальняя связь и подготовленная местная смена.

Феб Ирсон сверяет ведомость с выбранным паспортом: ${s.kits.includes('request') ? 'готовый груз заявки' : 'изготовление у цели из своих материалов'}.

— Накладная докажет, что мы привезли. Она не докажет, что у них работает.

Дассер оставляет обе подписи: свою и подпись совета Ксилоны.

— Изменится груз — передадим новую ведомость. Изменится работа — решим вместе.`,
        en: s => `The commitment names capsules, deep communication and a trained local shift.

Feb Irson checks the manifest against the chosen passport: ${s.kits.includes('request') ? 'the finished request cargo' : 'manufacture at the target from our own materials'}.

"The manifest proves what we brought. It cannot prove what works for them."

Dasser keeps both signatures: his own and Xylona's council's.

"If the cargo changes, we send a new manifest. If the work changes, we decide together."`
      }
    },
    {
      id: 'p.rescuePromise', scene: 'register', kind: 'document', year: 0, when: rescueS,
      effect: s => { s.rescuePromise = { eta: arriveX(s), places: crewOf(s) < M.CREW ? 'sector' : 'housing' }; },
      title: { ru: 'Для кого места', en: 'Who the places are for' },
      text: {
        ru: s => `В обязательстве записаны помощь капсулам и дом для тех, кто дождётся.

Ива Лорн вписывает: ${crewOf(s) < M.CREW ? 'сорок мест спасательного сектора' : 'обязательство построить отдельное жильё'}. Орин подписывает расчёт прибытия, Кассель — принятый запас времени.

— Это прогноз, — говорит она. — Если он изменится, обещание придётся исполнить другим способом.`,
        en: s => `The commitment names help for the capsules and a home for those who survive until arrival.

Iva Lorn enters: ${crewOf(s) < M.CREW ? 'forty berths in the rescue sector' : 'a commitment to build separate housing'}. Orin signs the arrival calculation; Kassel signs the accepted time margin.

"This is a forecast," she says. "If it changes, the promise will need another way of being kept."`
      }
    },
    {
      id: 'p.register', scene: 'register', kind: 'archive', year: 0,
      place: { ru: 'Реестр Кольца', en: 'Ring register' },
      text: {
        ru: s => (s.mission === 'contact' && M.colonyAt(s.target) ? `${colonyTie(s.target, 'ru')} Идём по программе контакта; возможности поселения известны по старому отчёту.

` : '') + `Экспедиция сорок первая. Цель — ${nm(s, 'ru')}. ${crewWord(s, 'ru')} человек в один конец: ${goalOf(s, 'ru')}.

Экипаж не выбирал цель. Каждый выбирал, лететь ли к ней.`,
        en: s => (s.mission === 'contact' && M.colonyAt(s.target) ? `${colonyTie(s.target, 'en')} We go by the contact programme; the settlement's means are known from an old report.

` : '') + `Expedition Forty-One. Destination: ${nm(s, 'en')}. ${crewWord(s, 'en')} people, one way: ${goalOf(s, 'en')}.

The crew didn't choose the destination. Each of them chose whether to fly toward it.`
      }
    },

    ];
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = prologue;
  else (root.M31Story = root.M31Story || {}).prologue = prologue;
})(typeof globalThis !== 'undefined' ? globalThis : this);
