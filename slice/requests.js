/* М31 · срез. Заявки Совета (DOC «Повороты по обстановке Кольца», «Ревью Codex — заявки из мира»).
   Заявка = звезда + работа + что известно и с какой давностью. Повестка Совета — три постоянные заявки первой экспедиции
   (Ксилона Ир, Оттепель, след тридцать второй у ε Индейца) и до трёх из мира: колония, след экспедиции, подтверждённая
   планета. Голосование за заявку задаёт звезду и работу; свободного выбора звезды нет — карта остаётся обзором.
   Состояние партии хранит только id заявки; тексты строятся из полей и каталога. */
(function (root) {
  'use strict';
  const M = root.M31Mission || require('./mission.js');

  const f1 = (x, lang) => { const v = (Math.round(x * 10) / 10).toFixed(1).replace(/\.0$/, ''); return lang === 'ru' ? v.replace('.', ',') : v; };
  const plural = (n, f) => { const a = Math.abs(n) % 100, b = a % 10; return a > 10 && a < 20 ? f[2] : b === 1 ? f[0] : b >= 2 && b <= 4 ? f[1] : f[2]; };
  const sp = (b, lang) => `${lang === 'ru' ? String(b).replace('.', ',') : String(b)}c`;
  const f2 = (x, lang) => { const v = String(Math.round(x * 100) / 100); return lang === 'ru' ? v.replace('.', ',') : v; };
  const years = (n, lang) => lang === 'ru' ? `${n} ${plural(n, ['год', 'года', 'лет'])}` : `${n} year${n === 1 ? '' : 's'}`;

  // branch — сюжетная ветка (contact | supply | rescue); work — вид работы; family — семейство заявок мира;
  // beta — скорость рекомендованного паспорта для оценки пути в карточке (точный расчёт — в паспорте)
  const REQUESTS = [
    { id: 'req:supply:xylona', branch: 'supply', work: 'restoreXylona', star: "Barnard's Star", object: { kind: 'colony', id: 'xylona' }, fixed: true, beta: 0.08 },
    { id: 'req:rescue:thaw', branch: 'rescue', work: 'rescueThaw', star: 'Ross 128', object: { kind: 'colony', id: 'thaw' }, fixed: true, beta: 0.1 },
    { id: 'req:search32:e32', branch: 'contact', work: 'search32', star: 'Epsilon Indi', object: { kind: 'trace', id: 'e32' }, fixed: true, beta: 0.08 },
    { id: 'req:contact:pass', branch: 'contact', work: 'contactColony', star: 'Lacaille 9352 (GJ 887)', object: { kind: 'colony', id: 'pass' }, family: 'colony', beta: 0.08 },
    { id: 'req:trace:e24', branch: 'contact', work: 'trace', star: '61 Cygni', object: { kind: 'trace', id: 'e24' }, family: 'trace', beta: 0.08 },
    { id: 'req:survey:gl338', branch: 'contact', work: 'survey', star: 'Gl 338', object: { kind: 'planet', id: 'GJ 338 B b' }, family: 'planet', beta: 0.08 }
  ];
  const get = id => REQUESTS.find(q => q.id === id) || null;
  // заявка по ветке и звезде (проверки и калибровка: стратегия выбирает заявку, а не звезду)
  const find = (branch, star) => REQUESTS.find(q => q.branch === branch && q.star === star) || null;

  // повестка: постоянные заявки и по одной из каждого семейства мира — колония, след, планета; не больше одной заявки на
  // звезду, только достижимые, без выполненных прошлыми экспедициями. Порядок и состав не зависят от сида партии
  const FAMILIES = ['colony', 'trace', 'planet'];
  function agenda(world) {
    const reach = new Set(M.reachable().map(x => x.name)), done = new Set((world && world.requestsDone) || []);
    const out = REQUESTS.filter(q => q.fixed && !done.has(q.id));
    for (const fam of FAMILIES) {
      const q = REQUESTS.find(x => x.family === fam && !done.has(x.id) && reach.has(x.star) && !out.some(o => o.star === x.star));
      if (q) out.push(q);
    }
    return out.map(q => q.id);
  }

  // оценка пути для карточки заявки: рекомендованная скорость, штатный магнит
  const tripOf = q => Math.round(M.trip(M.star(q.star).d, q.beta, M.stdMag(q.beta)));
  const roadLine = (q, lang) => { const d = M.star(q.star).d, T = tripOf(q);
    return lang === 'ru' ? `${M.nameOf(q.star, 'ru')}, ${f1(d, 'ru')} св. года; на ${sp(q.beta, 'ru')} — около ${years(T, 'ru')} пути.`
      : `${M.nameOf(q.star, 'en')}, ${f1(d, 'en')} ly; at ${sp(q.beta, 'en')} about ${years(T, 'en')} on the road.`; };

  // тексты заявок мира (постоянные заявки — в content.js, рядом со своими сюжетными ветками)
  const ago = (t, lang) => years(Math.round(-t), lang);
  const came = (t, lang) => t > -1 ? (lang === 'ru' ? 'пришёл в этом году' : 'arrived this year') : (lang === 'ru' ? `пришёл ${ago(t, 'ru')} назад` : `arrived ${ago(t, 'en')} ago`);
  const TEXT = {
    'req:contact:pass': {
      label: { ru: 'Перевал: прямая связь и сверка лоции', en: 'The Pass: a direct link and a navigation exchange' },
      known: (q, lang) => { const o = M.knownAtStart().find(x => x.id === 'pass'); return lang === 'ru' ? [roadLine(q, 'ru'),
        'Служба навигации Кольца: установить двустороннюю связь с Перевалом, обменяться лоциями и ведомостями возможностей, передать сверенный отчёт.',
        `Последний отчёт Перевала отправлен ${ago(o.observedAt, 'ru')} назад и ${came(o.receivedAt, 'ru')}: поселение строится, ${o.awake} бодрствующих и ${o.asleep} спящих, навигационная станция и ремонт. Нынешнее состояние неизвестно; приём экспедиции не согласован.`]
        : [roadLine(q, 'en'),
        "The Ring's navigation service: establish a two-way link with the Pass, exchange navigation records and capability lists, transmit a reconciled report.",
        `The Pass's last report was sent ${ago(o.observedAt, 'en')} ago and ${came(o.receivedAt, 'en')}: a settlement under construction, ${o.awake} awake and ${o.asleep} asleep, a navigation station and repairs. Its present state is unknown; taking in the expedition is not agreed.`]; },
      council: {
        ru: '— И служба навигации, — говорит Кассель. — Перевал у Лакайль 9352 строится, лоции у них новее наших. Просят прямую связь и сверку.',
        en: '"And the navigation service," says Kassel. "The Pass at Lacaille 9352 is still building; their navigation records are newer than ours. They ask for a direct link and an exchange."'
      },
      annex: {
        ru: `Служба навигации Кольца предлагает экспедицию к Лакайль 9352. По последнему отчёту Перевал строится: шестьсот двадцать бодрствующих, сто спящих, навигационная станция и ремонтные мастерские. Отчёт шёл до Земли одиннадцать лет.

Задание: установить двустороннюю связь, обменяться лоциями и ведомостями возможностей, передать Кольцу сверенный отчёт. Нынешнее состояние станции неизвестно. Приём всей экспедиции не согласован.

Внешнего срока нет: первый обмен и отчёт — в первый месяц после прибытия. Доставка топлива, деталей и новых жителей в заявку не входит.`,
        en: `The Ring's navigation service proposes an expedition to Lacaille 9352. By the last report the Pass is still building: six hundred and twenty awake, a hundred asleep, a navigation station and repair workshops. The report took eleven years to reach Earth.

The task: establish a two-way link, exchange navigation records and capability lists, and transmit a reconciled report to the Ring. The station's present state is unknown. Taking in the whole expedition is not agreed.

There is no outside deadline: the first exchange and report within the first month after arrival. Fuel, parts and new settlers are not part of the request.`
      }
    },
    'req:trace:e24': {
      label: { ru: '61 Лебедя: след экспедиции №24', en: '61 Cygni: the trace of Expedition No. 24' },
      known: (q, lang) => { const o = M.TRACES.find(x => x.id === 'e24'); return lang === 'ru' ? [roadLine(q, 'ru'),
        'Архивная комиссия Совета: обследовать район последней орбиты двадцать четвёртой, установить состояние следа, запросить доступные записи, передать протокол.',
        `Последнее сообщение автоматики отправлено ${ago(o.observedAt, 'ru')} назад и дошло ${ago(o.receivedAt, 'ru')} назад: пустой корабль доведён до системы. Сохранность корабля, питание автоматики и журнал неизвестны.`]
        : [roadLine(q, 'en'),
        "The Council's archive commission: survey the region of No. 24's last orbit, establish the state of the trace, request any accessible records, transmit a report.",
        `The automation's last message was sent ${ago(o.observedAt, 'en')} ago and arrived ${ago(o.receivedAt, 'en')} ago: the empty ship was brought into the system. The ship's condition, the automation's power and the log are unknown.`]; },
      council: {
        ru: 'Архивная комиссия просит проверить след двадцать четвёртой у 61 Лебедя: автоматика довела туда пустой корабль.',
        en: 'The archive commission asks to check No. 24\'s trace at 61 Cygni: the automation brought the empty ship there.'
      },
      annex: {
        ru: `Архивная комиссия Совета предлагает проверить последнее сообщение автоматики двадцать четвёртой: она довела пустой корабль до системы 61 Лебедя и доложила об этом. Сообщение отправлено тридцать три года назад, Земля приняла его двадцать два года назад.

Задание: обследовать район последней зарегистрированной орбиты, установить состояние следа, запросить доступные записи и передать протокол поиска. Сохранность корабля, питание автоматики и доступ к журналу неизвестны.

Срок сохранности архива неизвестен. Первый протокол — в первый месяц после прибытия. Высадка на корабль и восстановление его систем не требуются.`,
        en: `The Council's archive commission proposes checking No. 24's automation's last message: it brought the empty ship into the 61 Cygni system and reported it. The message was sent thirty-three years ago; Earth received it twenty-two years ago.

The task: survey the region of the last recorded orbit, establish the state of the trace, request any accessible records and transmit a search report. The ship's condition, the automation's power and access to the log are unknown.

How long the archive will last is unknown. The first report within the first month after arrival. Boarding the ship and restoring its systems are not required.`
      }
    },
    'req:survey:gl338': {
      label: { ru: 'Gl 338: обследование планеты GJ 338 B b', en: 'Gl 338: a survey of the planet GJ 338 B b' },
      known: (q, lang) => { const p = M.star(q.star).planets.find(x => x.name === q.object.id); return lang === 'ru' ? [roadLine(q, 'ru'),
        'Научная программа Кольца: уточнить среду системы, свойства известных тел и условия для базы, передать измерения.',
        `${p.name} подтверждена: минимальная масса — ${f1(p.massEarth, 'ru')} земной, ${f2(p.semiMajorAxisAU, 'ru')} а.е. от звезды. Пригодность поверхности и место для поселения не установлены.`]
        : [roadLine(q, 'en'),
        "The Ring's science programme: measure the system's environment, the properties of the known bodies and the conditions for a base, transmit the measurements.",
        `${p.name} is confirmed: minimum mass ${f1(p.massEarth, 'en')} Earths, ${f2(p.semiMajorAxisAU, 'en')} AU from the star. Surface habitability and a settlement site are not established.`]; },
      council: {
        ru: 'Научная программа просит обследовать Gl 338: там подтверждена планета, и это дальше всего, что лежит на столе.',
        en: 'The science programme asks for a survey of Gl 338: a planet is confirmed there, and it is the farthest request on the table.'
      },
      annex: {
        ru: `Научная программа Кольца предлагает обследовать систему с подтверждённой планетой GJ 338 B b. В каталоге — минимальная масса десять с половиной земных и полуось 0,14 а.е. Эпоха исходных наблюдений в архиве экспедиции не указана.

Задание: уточнить среду системы, свойства известных тел и условия размещения базы; передать результаты измерений. Пригодность поверхности и место для поселения не установлены.

Внешнего срока нет. Первая съёмка и отчёт — в первый месяц после прибытия.`,
        en: `The Ring's science programme proposes surveying the system with the confirmed planet GJ 338 B b. The catalogue gives a minimum mass of ten and a half Earths and a semi-major axis of 0.14 AU. The epoch of the original observations is not recorded in the expedition archive.

The task: measure the system's environment, the properties of the known bodies and the conditions for siting a base; transmit the results. Surface habitability and a settlement site are not established.

There is no outside deadline. The first survey and report within the first month after arrival.`
      }
    }
  };

  const api = { REQUESTS, get, find, agenda, tripOf, roadLine, TEXT };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.M31Requests = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
