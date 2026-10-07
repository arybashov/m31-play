/* М31 · срез: интерфейс. Слева всегда корабль в 3D и приборы «на поверхностях»,
   справа — текущие записи архива с иллюстрациями мест. Всё строится заново из ответов игрока. */
(function () {
  'use strict';
  const C = window.M31Content, E = window.M31Engine, M = window.M31Mission;
  const KEY = 'm31-slice-v1';
  const $ = id => document.getElementById(id);

  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify({ tokens, lang, world, relief, exp, riskVersion, riskSeed, agenda })); } catch (e) { /* без сохранения */ } }
  // сохранение, которое не удалось восстановить, не стираем молча — откладываем копию
  function backup(why) { try { localStorage.setItem(KEY + '-bak', localStorage.getItem(KEY) || ''); console.warn('Сохранение отложено:', why); } catch (e) { /* нет */ } }

  const saved = load();
  let tokens = Array.isArray(saved.tokens) ? saved.tokens : [];
  // отладка: #tokens=[...] в адресе задаёт ходы (снимки кадров без прохождения)
  const hashArg = k => (location.hash.slice(1).split('&').find(x => x.startsWith(k + '=')) || '').slice(k.length + 1);
  let fromHash = false;
  try { if (hashArg('tokens')) { const h = JSON.parse(decodeURIComponent(hashArg('tokens'))); if (Array.isArray(h)) { tokens = h; fromHash = true; } } } catch (e) { /* нет */ }
  let lang = saved.lang === 'en' ? 'en' : 'ru';
  // Память мира между партиями (аппарат Перевала, новые поселения) и партия спасателей после аварии с живыми:
  // relief = { incident, world, tokens } — снимки на её старте, чтобы повторный проход давал тот же итог.
  let world = Object.assign({ passTug: true }, saved.world || {});
  if (!world.seed) world.seed = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);   // сид мира: события Кольца
  // снимок аварии из сохранения проверяем целиком; ходы из адреса — всегда основная партия
  let relief = !fromHash && saved.relief && C.validIncident(saved.relief.incident) && saved.relief.world && Array.isArray(saved.relief.tokens) ? saved.relief : null;
  if (saved.relief && !relief && !fromHash) backup('снимок аварии повреждён');
  // экспедиция — своя у каждой партии: id аварии включает её, чтобы одинаковые аварии разных партий не сливались в мире
  const newExp = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  let exp = typeof saved.exp === 'string' ? saved.exp : newExp();
  // правила цены ошибки: новая экспедиция — версия C.RISK, сид — её id; старая партия без версии — версия 0 до конца
  // (уже сыгранное не получает задним числом погибших); версия без сида — повреждение: копия и новая экспедиция
  const fresh0 = tokens.every(t => t === 'go');                      // ни одного решения — прошлого, которое могло бы измениться, нет
  const seedOK = x => typeof x === 'string' && x.length > 0;
  let riskVersion, riskSeed, hashWorld = null;
  if (fresh0) { riskVersion = C.RISK; riskSeed = seedOK(saved.riskSeed) ? saved.riskSeed : exp; }   // без решений — прошлого нет: новые правила
  else if (saved.riskVersion >= 1) { riskVersion = saved.riskVersion; riskSeed = saved.riskSeed; }   // заданные правила не перезаписываем
  else { riskVersion = 0; riskSeed = null; }
  if (fromHash) { let sd = ''; try { sd = decodeURIComponent(hashArg('seed') || ''); } catch (e) { sd = ''; }
    const v = Number(hashArg('risk')) || 0; riskVersion = v >= 1 && seedOK(sd) ? v : 0; riskSeed = riskVersion ? sd : null;
    try { hashWorld = decodeURIComponent(hashArg('world') || '') || null; } catch (e) { hashWorld = null; } }   // сид мира партии из адреса: те же события Кольца
  // повестка Совета — снимок мира на старт экспедиции: итог партии меняет мир, но не её собственное голосование
  let agenda = Array.isArray(saved.agenda) ? saved.agenda : null;      // снимок меняется только с новой экспедицией
  if (riskVersion >= 1 && !seedOK(riskSeed)) { backup('сид экспедиции повреждён'); tokens = []; relief = null; exp = newExp(); riskVersion = C.RISK; riskSeed = exp; agenda = C.requests.agenda(world); }
  if (!agenda) agenda = C.requests.agenda(world);
  const ctx = () => ({ riskVersion, riskSeed, agenda, worldSeed: hashWorld || world.seed });
  C.setWorld(world);
  const cur = () => relief ? relief.tokens : tokens;                      // ходы текущей партии
  const story = () => relief ? C.relief(relief.incident, relief.world) : C;
  let filter = 'all';
  let shownTokens = -1;
  let sceneId = null, layer = 0;
  let mapPick = null, draft = null, votePick = null;   // черновики экрана: звезда на карте, паспорт, выделенный вариант — не ходы

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const paras = s => s.split(/\n\n+/).map(p => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('');

  // Портреты: первое упоминание персонажа в записи получает круглый портрет рядом с именем.
  const L = 'A-Za-zА-Яа-яЁё';
  // Одна регулярка на все формы всех имён (длинные раньше), форма → персонаж.
  const nameRe = {};
  function nameIndex() {
    if (nameRe[lang]) return nameRe[lang];
    const byForm = {};
    for (const [id, p] of Object.entries(C.people || {})) for (const n of p[lang]) byForm[n] = id;
    const alts = Object.keys(byForm).sort((x, y) => y.length - x.length).join('|');
    return (nameRe[lang] = { byForm, re: new RegExp(`(^|[^${L}])(${alts})(?=[^${L}]|$)`, 'g') });
  }
  function faceHtml(id) {
    const p = C.people[id], full = esc(p[lang][0]);
    return (window.M31_PORTRAITS || []).includes(id)
      ? `<span class="face" title="${full}" style="background-image:url('assets/portraits/${id}.jpg')"></span>`
      : `<span class="face ini" title="${full}" style="--pc:${p.color}">${esc(p.ini[lang])}</span>`;
  }
  // Лицо получает первое по тексту упоминание каждого персонажа; внутри тегов не ищем.
  function withFaces(html) {
    if (!C.people) return html;
    const { byForm, re } = nameIndex(), seen = new Set();
    const parts = html.split(/(<[^>]*>)/);
    for (let i = 0; i < parts.length; i += 2) {
      parts[i] = parts[i].replace(re, (all, pre, name) => {
        const id = byForm[name];
        if (seen.has(id)) return all;
        seen.add(id);
        return `${pre}<span class="who">${faceHtml(id)}${name}</span>`;
      });
    }
    return parts.join('');
  }
  const parasP = s => withFaces(paras(s));
  const t = (v, snap) => E.text(v, lang, snap);
  const num = (x, d) => lang === 'ru' ? x.toFixed(d).replace('.', ',') : x.toFixed(d);

  function fmtYear(y) {
    const u = C.ui[lang];
    let whole = Math.floor(y + 1e-9), month = Math.round((y - whole) * 12);
    if (month === 12) { whole++; month = 0; }
    return month ? `${u.year} ${whole} · ${lang === 'ru' ? 'месяц' : 'month'} ${month}` : `${u.year} ${whole}`;
  }

  // ---------------------------------------------------------------- записи
  // Иллюстрация места — в тексте, в начале первой записи новой сцены.
  function illusHtml(b) {
    const sc = C.scenes[b.scene];
    return sc && sc.img ? `<figure class="illus"><img src="${sc.img}" alt="${esc(t(sc.label))}" loading="lazy"><figcaption>${esc(t(sc.label))}</figcaption></figure>` : '';
  }
  // картинка события (арт Codex, assets/events): над записью, вместо общей картинки сцены;
  // illus — id или функция состояния (картинка только для своего варианта мира)
  const eventImg = item => { const v = item.beat.illus, id = typeof v === 'function' ? v(item.state) : v;
    return id && (window.M31_EVENTS || []).includes(id) ? id : null; };
  function eventHtml(item, id) {
    const b = item.beat, sc = C.scenes[b.scene], label = sc ? t(sc.label) : '';
    return `<figure class="illus event"><img src="assets/events/${id}.jpg" alt="${esc((b.title && t(b.title, item.state)) || label)}" loading="lazy"><figcaption>${esc(label)}</figcaption></figure>`;
  }
  function withIllus(items) {
    let last = null;
    return items.map(item => {
      const sc = item.beat.scene, ev = eventImg(item), show = !ev && sc && sc !== last && C.scenes[sc] && C.scenes[sc].img;
      if (sc) last = sc;
      return (ev ? eventHtml(item, ev) : show ? illusHtml(item.beat) : '') + entryHtml(item);
    });
  }
  function entryHtml(item) {
    const b = item.beat, u = C.ui[lang], s = item.state;
    let head = '', pre = '';
    if (b.act) pre = `<h2 class="act">${esc(t(b.act, s))}</h2>`;
    if (b.kind === 'cinematic') return '';                            // заставка в стопке карточек не подписывается
    if (b.kind === 'skip') return `<div class="divider" data-kind="skip"><span>${esc(t(b.label, s))}</span></div>`;
    if (b.kind === 'decision') {
      const o = item.option;
      return `<article class="entry decision-done" data-kind="decision">
        <header>${esc(u.decision)} · ${esc(fmtYear(s.year))}</header>
        <h3>${esc(t(b.title, s))}</h3><p class="chosen">${esc(u.decided)}: <b>${esc(t(o.label, s))}</b></p>
        ${parasP(t(o.record, s))}</article>`;
    }
    if (b.kind === 'archive') head = `${u.archive} · ${fmtYear(s.year)} · ${t(b.place, s)}`;
    else if (b.kind === 'transcript') head = `${u.transcript} · ${t(b.title, s)} · ${fmtYear(s.year)}`;
    else if (b.kind === 'note') head = `${u.note} · ${t(b.author, s)} · ${fmtYear(s.year)}`;
    else if (b.kind === 'bulletin') head = `${u.bulletin} · ${t(b.title, s)}`;
    else if (b.kind === 'instrument') head = `${t(b.title, s)} · ${fmtYear(b.at != null ? b.at : s.year)}`;   // события v1 — дата события
    else if (b.kind === 'watch') head = t(b.title, s);                // отчёт вахты: годы периода — в заголовке
    else if (b.kind === 'document') head = `${u.document} · ${t(b.title, s)}`;
    else if (b.kind === 'end') head = t(b.title, s);
    // ведомость (отчёт вахты): потери с отлёта, все изменения запасов, сводки износа щита — раскрывается по клику
    const ved = b.details ? `<details class="ved"><summary>${esc(u.ved)}</summary>${paras(t(b.details, s))}</details>` : '';
    const inl = b.inline === 'probe' ? probeSvg(item, true) : '';      // прибор внутри записи (у экрана карты панель занята картой)
    return `${pre}<article class="entry k-${b.kind}" data-kind="${b.kind}"><header>${esc(head)}</header>${parasP(t(b.text, s))}${inl}${ved}</article>`;
  }

  function stopHtml(result) {
    const u = C.ui[lang], stop = result.stop;
    if (!stop) return '';
    if (stop.ending) {
      return `<section class="card ending">${paras(t(stop.ending.record, stop.state))}
        <button class="action" data-act="back">${esc(u.back)}</button></section>`;
    }
    if (stop.end) {
      const rows = result.log.filter(i => i.beat.kind === 'decision')
        .map(i => `<li><span>${esc(t(i.beat.title))}</span><b>${esc(t(i.option.label, i.state))}</b></li>`).join('');
      const inc = !relief && C.incidentLines ? C.incidentLines(stop.state, lang) : [];
      const sum = `<section class="summary"><h2>${esc(relief ? u.reliefSummary : u.summary)}</h2><ul>${rows}</ul></section>`
        + (inc.length ? `<section class="summary incidents"><h2>${esc(u.incidentsTitle)}</h2><ul>${inc.map(x => `<li>${esc(x)}</li>`).join('')}</ul></section>` : '')
        + (() => { if (relief || !stop.state.eq) return '';                       // оснащение в пути: помогло / не понадобилось / не хватило
          const q = C.eq.eqSummary(stop.state, lang, new Set(result.log.map(i => i.beat.id)));
          const list = (h, xs) => `<h3>${esc(h)}</h3><ul>${(xs.length ? xs : [u.eqNone]).map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
          return `<section class="summary eqsum"><h2>${esc(u.eqSumTitle)}</h2>${list(u.eqHelped, q.help)}${list(u.eqIdle, q.idle)}${list(u.eqMissing, q.miss)}${q.cost ? `<p>${esc(q.cost)}</p>` : ''}</section>`; })();
      const worldSec = `<section class="summary worldafter"><h2>${esc(u.worldTitle)}</h2><ul>${C.worldLines(world, lang).map(x => `<li>${esc(x)}</li>`).join('')}</ul></section>`;
      if (stop.state.incident && !relief) return `${sum}<button class="action" data-act="relief">${esc(C.reliefButton(stop.state.incident, world, lang))} →</button>
        <button class="action ghost" data-act="newWorld">${esc(u.newWorld)}</button>`;
      return `${sum}${worldSec}<button class="action" data-act="newWorld">${esc(u.newWorld)}</button>`;
    }
    const b = stop.beat;
    if (b.kind === 'cinematic') return '';
    if (b.kind === 'skip') return `<button class="action skip" data-act="go">${esc(t(b.label, stop.state))} →</button>`;
    if (b.ui === 'passport') return passportHtml(stop);
    // карточка решения — по публичному состоянию: скрытое (сид) экипажу неизвестно и в текст не попадает
    const pub = C.publicOf ? C.publicOf(stop.state) : stop.state;
    // «После»: известная цена варианта (cost); без неё — эффект на публичной копии с preview (исходы случая закрыты)
    const afterOf = o => {
      if (relief || !stop.state.eq) return '';
      let next; try { next = E.clone(pub); next.preview = true; next.choices[b.id] = o.id; if (o.cost) o.cost(next); else if (o.effect) o.effect(next); } catch (e) { return ''; }
      const d = C.gaugeDiff(pub, next, lang);
      return d.length ? `<p class="after"><b>${esc(u.after)}:</b> ${esc(d.join(' · '))}</p>` : `<p class="after muted">${esc(u.noChange)}</p>`;
    };
    // рекомендация Совета: по известному, с основанием и допущением — это не обещание безопасности
    const rec = b.rec ? b.rec(pub) : null;
    const recHtml = o => rec && rec.id === o.id ? `<p class="rec"><b>${esc(u.recTitle)}</b> — ${esc(t(rec.why, pub))}${rec.assume ? `; ${esc(u.recAssume)}: ${esc(t(rec.assume, pub))}` : ''}.</p>` : '';
    // выбор — списком, как архив Кольца: строка варианта — метка, название, пояснение справа; нажатие выделяет вариант
    // и открывает его карточку ниже, голосование — кнопкой карточки. Голосование по заявкам: в строке — звезда и
    // расстояние, метка — по объекту заявки (как в архиве), нажатие подводит камеру к системе
    const agenda = b.ui === 'agenda';
    const sel = stop.options.find(o => o.id === votePick) || (rec && stop.options.find(o => o.id === rec.id)) || stop.options[0];
    const reqOf = o => agenda ? C.requests.get(o.id) : null;
    const rowNote = o => { const q = reqOf(o); return q ? `${M.nameOf(q.star, lang)} · ${num(M.star(q.star).d, 1)}` : ''; };
    const rowCls = o => { const q = reqOf(o); return q ? `st-${reqStatus(q)}` : rec && rec.id === o.id ? 'st-viable' : 'st-plain'; };
    const rows = stop.options.map(o => `<button class="colrow optrow ${rowCls(o)}" data-sel="${esc(o.id)}" aria-pressed="${o === sel}"><span class="dot"></span>${esc(t(o.label, pub))}${rec && rec.id === o.id ? ` <b class="recmark">${esc(u.recShort)}</b>` : ''}<i>${esc(rowNote(o))}</i></button>`).join('');
    const q = reqOf(sel);
    const detail = `<div class="option${rec && rec.id === sel.id ? ' rec' : ''}"><h4>${esc(t(sel.label, pub))}</h4>${recHtml(sel)}<p class="knownlabel">${esc(u.known)}</p>
        <ul>${knownOf(sel, pub).map(k => `<li>${esc(k)}</li>`).join('')}</ul>${afterOf(sel)}${q ? starFacts(q.star) : ''}
        <button class="action" data-act="vote" data-option="${esc(sel.id)}">${esc(u.vote)}</button></div>`;
    return `<section class="card vote"><header>${esc(u.decision)} · ${esc(fmtYear(stop.state.year))}</header>
      <h3>${esc(t(b.title, pub))}</h3><p class="muted">${esc(t(b.context, pub))}</p><div class="colrows optrows">${rows}</div>${detail}</section>`
      + (agenda ? chartHtml(stop, q) : '');                           // голосование по заявкам — с архивом и справкой о звёздах
  }

  const knownOf = (o, st) => (typeof o.known[lang] === 'function' ? o.known[lang](st) : o.known[lang]);
  const voteHead = (stop, b) => `<header>${esc(C.ui[lang].decision)} · ${esc(fmtYear(stop.state.year))}</header>
      <h3>${esc(t(b.title, stop.state))}</h3><p class="muted">${esc(t(b.context, stop.state))}</p>`;
  const lyWord = () => (lang === 'ru' ? 'св. года' : 'ly');
  function yearsWord(n) {
    if (lang !== 'ru') return n === 1 ? 'year' : 'years';
    const a = n % 100, b = n % 10;
    return a > 10 && a < 20 ? 'лет' : b === 1 ? 'год' : b >= 2 && b <= 4 ? 'года' : 'лет';
  }

  // ---------------------------------------------------------------- карта-обзор при голосовании Совета
  // Выбора звезды нет — курс задаёт заявка (DOC «Повороты по обстановке Кольца», «Заявки из мира»). Карту можно вращать
  // и приближать; строка заявки или архива, щелчок по звезде — камера подлетает к системе, ниже — справка: расстояние,
  // класс, подтверждённые планеты, архив Кольца
  const mapPickName = st => mapPick || (st && st.target) || null;
  // метка заявки — по её объекту, как в архиве: колония — её состояние, след экспедиции — ромб, планета — своя
  const reqStatus = q => q.object.kind === 'colony' ? M.colony(q.object.id).status : q.object.kind === 'trace' ? 'trace' : 'planet';
  function starFacts(name) {
    const u = C.ui[lang], st = M.star(name), pl = (st.planets || []).filter(p => p.status === 'confirmed');
    const plText = pl.length ? `${u.planetsKnown}: ${pl.map(p => p.name + (p.massEarth != null ? ` (${num(p.massEarth, p.massEarth < 10 ? 1 : 0)} ${u.mEarth})` : '')).join(', ')}.` : u.noPlanets;
    const info = M.objectsAtStar(name).map(o => C.archiveLines(o, lang, 0, world)).concat([C.legacyLines(name, lang, world)]).flat();
    return `<p class="knownlabel">${esc(M.nameOf(name, lang))} · ${num(st.d, 1)} ${lyWord()} · ${esc(st.sp || '')}</p><p class="small">${esc(plText)}</p>
      ${info.length ? `<ul class="colarch">${info.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}`;
  }
  function chartHtml(stop, sel) {
    const u = C.ui[lang], pickName = mapPickName(stop.state);
    const objs = M.knownAtStart(), here = pickName ? M.objectsAtStar(pickName) : [];
    const rows = objs.map(o => `<button class="colrow st-${o.status}" data-pick="${esc(o.star)}" aria-pressed="${o.star === pickName}"><span class="dot"></span>${esc(C.archiveShort(o, lang, 0))}<i>${esc(M.nameOf(o.star, lang))} · ${num(M.star(o.star).d, 1)}</i></button>`).join('');
    const legacy = (world.settled || []).length || world.passTug === false;
    const colBlock = `<details class="colonies"${here.length ? ' open' : ''}><summary class="knownlabel">${esc(u.colonies(objs.length))}</summary>
      <p class="muted small">${esc(u.archiveNote)} ${esc(u.road(M.ROAD.flying, M.ROAD.done))}</p><div class="colrows">${rows}</div>${legacy ? `<p class="muted small">${esc(u.legacyNote)}</p>` : ''}</details>`;
    // справка — о звезде без заявки (у звезды заявки она в карточке заявки)
    const other = pickName && !(sel && sel.star === pickName);
    const card = other ? `<div class="starcard">${starFacts(pickName)}<p class="muted small">${esc(u.noRequest)}</p></div>` : `<p class="muted small">${esc(u.mapHint)}</p>`;
    return `<section class="card chart">${colBlock}${card}</section>`;
  }
  // строки выбора перерисовываются целиком — клавиатурный фокус возвращается на ту же строку
  function refocus(kind, v) { const el = [...document.querySelectorAll(`#stop [data-${kind}]`)].find(x => x.dataset[kind] === v); if (el) el.focus({ preventScroll: true }); }
  // камера подлетает к системе (вид «цель»), плавно — как кнопка «Цель» на панели камеры
  function flyTo(name) {
    mapPick = name; refreshStop();
    if (window.M31Space && M31Space.ok) applyView('target');
  }
  // выбор заявки или звезды при голосовании: строка заявки, строка архива, щелчок по звезде на карте
  function agendaPick(name, reqId) {
    const st = view && view.result.stop, q = reqId ? C.requests.get(reqId) : st ? st.options.map(o => C.requests.get(o.id)).find(x => x && x.star === name) : null;
    if (q) votePick = q.id;
    flyTo(q ? q.star : name);
  }

  // ---------------------------------------------------------------- паспорт экспедиции: три рычага
  function passportHtml(stop) {
    const u = C.ui[lang], b = stop.beat, st = stop.state, d = M.star(st.target).d;
    // черновик: рычаги, комплекты и оснащение (с рекомендации Совета для миссии); утверждает разбор id — тот же, что в движке
    // рекомендация Совета: снабженцу — груз заявки; спасателю — 0,1c и спасательный сектор (иначе к сроку не успеть)
    if (!draft) draft = { b: st.mission === 'rescue' ? 0.1 : 0.08, r: 0.005, kits: st.mission === 'supply' ? ['request'] : st.mission === 'rescue' ? ['berths'] : [], eq: M.eqDefault(st.mission, st.riskVersion) };
    const eqMass = M.eqMass(draft.eq), cap = M.capacity(draft.b, draft.r), used = M.kitMass(draft.kits) + eqMass;
    const tMag = M.magYears(M.brakeMass(draft.b, draft.r, used), draft.b), Tx = M.trip(d, draft.b, tMag), T = Math.round(Tx), aw = M.awake(T, 48, M.crewOf(draft.kits));
    const swaps = M.eqSwaps(draft.eq, st.mission, st.riskVersion), def = M.eqDefault(st.mission, st.riskVersion), E = C.eq;
    const id = `${draft.b}|${draft.r}|${M.kitsFor(st.mission).filter(k => draft.kits.includes(k)).join('+')}|${M.eqCode(draft.eq)}`;
    const ok = !!b.option(st, id), fits = cap >= 0 && used <= cap + 1e-9;
    const seg = (key, vals, fmt) => vals.map(v => `<button class="seg" data-draft="${key}" data-v="${v}" aria-pressed="${draft[key] === v}">${fmt(v)}</button>`).join('');
    const say = k => `<p class="say"><b>${esc(u.say[k][0])}:</b> «${esc(u.say[k][1])}»</p>`;
    const kits = M.kitsFor(st.mission).map(k => {
      const on = draft.kits.includes(k), wouldFit = cap >= 0 && used + (on ? 0 : M.KITS[k].t) <= cap + 1e-9;
      return `<button class="kit" data-kit="${k}" aria-pressed="${on}" ${!on && !wouldFit ? 'disabled' : ''}>${esc(M.KITS[k][lang])} <i>${M.KITS[k].crew ? `${M.KITS[k].crew < 0 ? "−" : "+"}${Math.abs(M.KITS[k].crew)} ${esc(u.ownPeople)}` : `${M.KITS[k].t} ${u.kt}`}</i></button>`;
    }).join('');
    const capTxt = cap < 0 ? `<span class="warn">${esc(u.over)}</span>` : `${num(used, 1)} / ${num(cap, 1)} ${u.kt} · ${u.free} ${num(Math.max(0, cap - used), 1)}`;
    // оснащение — анкета: вопрос позиции, варианты (польза — в подсказке), карточка выбранного варианта и цена замены.
    // Штатные позиции и варианты без применения в этой миссии скрыты; паспорт со старым id остаётся валидным.
    const diffNames = M.EQUIP.filter(p => draft.eq[p.id] !== def[p.id]).map(p => p[lang].toLowerCase());
    const eqRows = M.EQUIP.filter(p => !p.fixed && !E.eqPosHidden(st, p.id)).map(p => {
      const cur = draft.eq[p.id], opts = p.opts.filter(o => !o.era && (!E.eqHidden(st, p.id, o.id) || o.id === cur)).map(o => {
        const on = cur === o.id, can = M.eqSwaps(Object.assign({}, draft.eq, { [p.id]: o.id }), st.mission, st.riskVersion) <= M.SWAPS;
        const tag = o.t ? ` +${num(o.t, o.t % 1 ? 2 : 0)}` : '';
        return `<button class="seg eqopt${o.id === def[p.id] ? ' rec' : ''}" data-eq="${p.id}" data-v="${o.id}" aria-pressed="${on}" title="${esc(E.eqCard(st, o.id, lang)[0] || '')}" ${on || can ? '' : 'disabled'}>${esc(o[lang])}<i>${esc(tag)}</i></button>`;
      }).join('');
      const card = E.eqCard(st, cur, lang), iff = E.eqIf(st, cur, lang, draft), cost = E.eqCost(st, draft, p.id, lang);
      return `<div class="eqrow"><p class="eqpos">${esc(p[lang])} · <span class="eqq">${esc(E.eqQuestion(st, p.id, lang))}</span></p><div class="segs">${opts}</div>
        <div class="eqcard">${card.map((x, i) => `<p><b>${esc([u.eqBenefit, u.eqCondition, u.eqBasis][i])}:</b> ${esc(x)}</p>`).join('')}${iff ? `<p class="eqif">${esc(iff)}</p>` : ''}${cost.map(x => `<p class="eqcost">${esc(x)}</p>`).join('')}${cur === def[p.id] ? `<p class="eqrecnote">${esc(u.eqRec)}</p>` : ''}</div></div>`;
    }).join('');
    // скрытые позиции с нештатным вариантом — строкой; отличие от рекомендации можно вернуть (освобождает замену)
    const kept = M.EQUIP.filter(p => !p.fixed && E.eqPosHidden(st, p.id) && draft.eq[p.id] !== M.EQ_BASE[p.id]).map(p => { const o = M.eqOpt(p.id, draft.eq[p.id]);
      return `${esc(p[lang])} — ${esc(o[lang].toLowerCase())} (+${num(o.t, o.t % 1 ? 2 : 0)} ${u.kt})${draft.eq[p.id] !== def[p.id] ? ` <button class="seg eqopt" data-eq="${p.id}" data-v="${def[p.id]}">${esc(u.eqBack)}</button>` : ''}`; });
    const dos = E.missionDossier(st, draft, lang);
    const eqHead = `${esc(u.pEquip)} · ${esc(u.swaps(swaps, M.SWAPS))} · +${num(eqMass, eqMass % 1 ? 2 : 0)} ${u.kt}`;
    const check = (good, txt) => `<li class="${good ? 'ok' : 'no'}">${good ? '✓' : '✗'} ${esc(txt)}</li>`;
    return `<section class="card vote passport">${voteHead(stop, b)}
      <p class="ptarget">${esc(u.pTarget)}: <b>${esc(M.nameOf(st.target, lang))}</b> · ${num(d, 1)} ${lyWord()}</p>
      ${dos ? `<div class="dossier"><p class="knownlabel">${esc(u.eqDossier)}</p>${dos.map(([h, x]) => `<p><b>${esc(h)}:</b> ${esc(x)}</p>`).join('')}</div>` : ''}
      <div class="lever"><p class="knownlabel">${esc(u.pSpeed)}</p><div class="segs">${seg('b', M.SPEEDS, v => num(v, 2) + 'c')}</div>${say('speed')}</div>
      <div class="lever"><p class="knownlabel">${esc(u.pReserve)}</p><div class="segs">${seg('r', M.RESERVES, v => num(v * 100, v < 0.01 ? 1 : 0) + '% c')}</div>${say('reserve')}</div>
      <div class="lever"><p class="knownlabel">${esc(u.pCargo)} · ${capTxt}</p><div class="kits">${kits}</div>${say('cargo')}${say('cargo2')}</div>
      <details class="lever equip" open><summary class="knownlabel">${eqHead}</summary>
        <p class="eqcouncil">${esc(E.eqCouncil(st, lang))}</p>
        <p class="eqlimit">${esc(swaps >= M.SWAPS ? u.eqFull(diffNames.join(', ')) : u.eqLimit)}</p>
        ${eqRows}${kept.length ? `<p class="eqhid">${kept.join('; ')}. ${esc(u.eqKeep)}</p>` : ''}<p class="eqstd">${esc(u.eqStd)}</p></details>
      <div class="readout"><p>${esc(u.pPath)}: <b>${T} ${yearsWord(T)}</b> · ${esc(u.pArrive)} <b>${T}</b></p>
        <p>${esc(u.pBrake(tMag))} · ${esc(u.pBrakeMass)} <b>${num(M.brakeMass(draft.b, draft.r, used), 0)} ${u.kt}</b></p>
        <p>${esc(u.pAwake)}: <b>≈ ${Math.round(aw)} ${yearsWord(Math.round(aw))}</b> ${esc(u.pAwakeTail)}</p></div>
      <p class="knownlabel">${esc(u.pChecks)}</p>
      <ul class="checks">${check(fits, u.cFit)}${check(swaps <= M.SWAPS, u.cSwaps)}${check(aw <= 25, u.cAwake)}${aw > 20 && aw <= 25 ? `<li class="warn">! ${esc(u.cThin)}</li>` : ''}${(() => { const mc = C.missionCheck && C.missionCheck(st, Tx, lang); return !mc ? '' : mc.warn ? `<li class="warn">! ${esc(mc.text)}</li>` : check(mc.good, mc.text); })()}</ul>
      <button class="action" data-act="vote" data-option="${esc(id)}" ${ok ? '' : 'disabled'}>${esc(u.approve)} →</button></section>`;
  }
  const atStop = kind => !!(view && view.result.stop && view.result.stop.beat && view.result.stop.beat.ui === kind);
  // грузы на корпусе в 3D: комплекты плюс зонды и ИК-обсерватория из оснащения
  const cargo3d = x => (x.kits || []).concat(x.eq && x.eq.probes === 'scout2' ? ['probes'] : [], x.eq && x.eq.sensors === 'ir' ? ['ir'] : []);
  function refreshStop() { if (view) { $('stop').innerHTML = stopHtml(view.result); syncScene(); } }

  // ---------------------------------------------------------------- сцена
  function currentBeat(result) {
    if (result.stop && result.stop.beat && result.stop.beat.scene) return result.stop.beat;
    for (let i = result.log.length - 1; i >= 0; i--) if (result.log[i].beat.scene) return result.log[i].beat;
    return story().beats[0];
  }

  // Ракурс камеры меняется с выдержкой: новая сцена должна продержаться VIEW_HOLD (выехала карточка решения,
  // прокрутили колонку туда-обратно — камера не мечется), и не чаще, чем раз в VIEW_GAP. Тот же ракурс — без перелёта.
  const VIEW_HOLD = 700, VIEW_GAP = 2000;
  let camView = null, camAt = 0, viewWant = null, viewTimer = null;
  function applyView(v) { clearTimeout(viewTimer); camView = v; camAt = performance.now(); M31Space.show(v); }
  // ручной выбор кнопками камеры: отложенный ракурс отменён; следующая сцена истории вернёт свой ракурс (с выдержкой)
  if (window.M31Space) M31Space.onManual = v => { clearTimeout(viewTimer); camView = 'manual:' + v; camAt = performance.now(); };
  function requestView(v) {
    viewWant = v; clearTimeout(viewTimer);
    if (!v || v === camView) return;
    if (!camView) { applyView(v); return; }                              // первый ракурс и после заставки — сразу
    const wait = Math.max(VIEW_HOLD, camAt + VIEW_GAP - performance.now());
    viewTimer = setTimeout(() => { if (viewWant === v && v !== camView) applyView(v); }, wait);
  }
  function setScene(id) {
    if (id === sceneId) return;
    sceneId = id;
    const sc = C.scenes[id];
    // Слева всегда корабль в 3D; сцена задаёт только ракурс. Без WebGL или сети — кадр Blender.
    const live = !!(window.M31Space && M31Space.ok);
    $('space').classList.toggle('on', live);
    if (live) { if (!insp) requestView(sc.view); return; }               // ручной осмотр щита держит камеру до закрытия
    layer = 1 - layer;
    const next = $('bg' + layer), prev = $('bg' + (1 - layer));
    next.style.backgroundImage = `url("${sc.fallback || sc.img}")`;
    next.classList.remove('drift'); void next.offsetWidth; next.classList.add('drift');
    next.classList.add('on'); prev.classList.remove('on');
  }

  function hudHtml(result, beat, y) {
    const u = C.ui[lang];
    const ids = new Set(result.log.map(i => i.beat.id));
    const sc = C.scenes[beat.scene];
    const place = sc && sc.label ? t(sc.label) : u.earth;
    let lines = [`<b>${esc(fmtYear(y))}</b>`, esc(place)];
    if (ids.has('a1.depart')) {
      const B = result.state.beta, A = C.arriveView(result.state), tm = result.state.tMag, beta = M.speedAt(y, B, A, tm);
      const ly = M.distLy(y, B, A, tm, M.star(result.state.target).d);   // разгон 8 лет, дрейф, магнит, 4 года двигателя
      lines.push(`${u.speed} <b>${num(beta, 3)}c</b>`);
      lines.push(ly < 2 ? `${u.lag} <b>${num(ly * 12, 1)} ${u.months}</b>` : `${u.lag} <b>${num(ly, 1)} ${lang === 'ru' ? 'г.' : 'yr'}</b>`);
    }
    const gs = relief ? [] : C.gauges(result.state, lang, ids);
    const canInspect = shieldOf(result.state);
    const gHtml = gs.length ? `<div class="gauges"><span class="gt">${esc(u.gaugesTitle)}</span>${gs.map(g => g.id === 'shield' && canInspect
      ? `<button type="button" class="gbtn" data-act="inspect" aria-pressed="${!!insp}" title="${esc(SI[lang].open)}">${esc(g.label)} <b>${esc(g.value)}</b></button>`
      : `<span>${esc(g.label)} <b>${esc(g.value)}</b></span>`).join('')}</div>` : '';
    return lines.map(l => `<span>${l}</span>`).join('') + gHtml;
  }
  // таймлайн — полоса внизу экрана во всю ширину; до отлёта и у спасателей его нет
  function setTimeline(result, y) {
    const ids = new Set(result.log.map(i => i.beat.id));
    const html = relief || !ids.has('a1.depart') || !result.state.arrive ? '' : timelineHtml(result, y);
    setHtml('timeline', html); $('timeline').hidden = !html;
    document.querySelector('.app').classList.toggle('tl-on', !!html);
  }
  // Таймлайн пути: фазы (разгон, дрейф, магнит, двигатель, у цели), «сейчас», принятые решения, сроки миссии.
  // Шкала — от отлёта до прибытия с запасом; после прибытия растёт вместе с годом.
  function timelineHtml(result, y) {
    const u = C.ui[lang], s = result.state, A = s.arrive, tm = s.tMag;
    const marks = C.missionMarks ? C.missionMarks(s, lang) : [];
    const end = Math.max(A + 6, y + 1, ...marks.map(m => m.at + 3));
    const pc = x => `${(Math.max(0, Math.min(end, x)) / end * 100).toFixed(2)}%`;
    const b0 = M.brakeStart(A, tm), e0 = tm == null ? A : A - M.ENGINE;
    const ph = [['acc', 0, M.ACC], ['drift', M.ACC, b0], ['mag', b0, e0], ['eng', e0, A], ['home', A, end]].filter(p => p[2] > p[1]);
    const segs = ph.map(([k, a, b]) => `<i class="tl-ph ${k}" style="left:${pc(a)};width:${pc(b - a)}"></i>`).join('');
    // точка и отметка — кнопка: подсказка по наведению, фокусу и касанию (CSS ::before); --p прижимает подсказку к краю шкалы
    const pin = (cls, at, tip) => `<button type="button" class="${cls}" style="left:${pc(at)};--p:${pc(at)}" aria-label="${esc(tip)}" data-tip="${esc(tip)}"></button>`;
    // решения в одном месте шкалы (≤1%) — одна точка с общей подсказкой
    const groups = [];
    for (const i of result.log) {
      if (i.beat.kind !== 'decision' || !i.option || i.state.year < 1 || i.state.year > y + 1e-6) continue;
      const line = `${fmtYear(i.state.year)} · ${t(i.beat.title, i.state)}: ${t(i.option.label, i.state)}`, g = groups[groups.length - 1];
      if (g && (i.state.year - g.at) / end < 0.01) g.tips.push(line); else groups.push({ at: i.state.year, tips: [line] });
    }
    const dots = groups.map(g => pin('tl-dot', g.at, g.tips.join('\n'))).join('');
    const mk = marks.map(m => pin(`tl-mk ${m.c}`, m.at, m.title)).join('');
    const ax = s.arriveExact != null ? s.arriveExact : A;
    const cap = [`${u.tlArrive} ${num(ax, ax % 1 ? 1 : 0)}`].concat(marks.map(m => m.short)).join(' · ');
    // корабль на шкале: силуэт по ходу движения; на последнем участке — кормой вперёд, как в 3D
    const now = (ph.find(p => y >= p[1] - 1e-9 && y < p[2]) || ph[ph.length - 1])[0], flip = now === 'eng' || (now === 'home' && tm != null);
    const ship = `<button type="button" class="tl-now${flip ? ' flip' : ''}" style="left:${pc(y)};--p:${pc(y)}" aria-label="${esc(`${u.tlShip} · ${fmtYear(y)} · ${u.tlPhase[now]}`)}" data-tip="${esc(`${u.tlShip} · ${fmtYear(y)} · ${u.tlPhase[now]}`)}">`
      + '<svg viewBox="0 0 26 14" aria-hidden="true"><path d="M2 7H21" stroke="currentColor" stroke-width="1.6"/><ellipse cx="8.5" cy="7" rx="1.8" ry="5.6" fill="none" stroke="currentColor" stroke-width="1.4"/>'
      + '<ellipse cx="13.5" cy="7" rx="1.8" ry="5.6" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M20.5 3.6Q25 7 20.5 10.4Z" fill="currentColor"/></svg></button>';
    return `<div class="tl"><div class="tl-bar">${segs}${pin('tl-mk arr', ax, `${u.tlArrive} — ${num(ax, 2)}`)}${mk}${dots}${ship}</div>
      <div class="tl-cap"><span>0</span><span>${esc(cap)}</span><span>${num(end, 0)}</span></div></div>`;
  }

  // Карта спящих: 20 групп по 25 капсул, как на стене зала анабиоза.
  const NAMED = [
    { i: 0, ru: 'Дассер', en: 'Dasser' }, { i: 1, ru: 'Дал', en: 'Dal' }, { i: 50, ru: 'Лорн', en: 'Lorn' },
    { i: 162, ru: 'Ландис', en: 'Landis' }, { i: 282, ru: 'Осгер', en: 'Osger' }
  ];
  function namedAwake(result) {
    const y = result.state.year, ids = new Set(result.log.map(i => i.beat.id)), s = result.state;
    const handover = ids.has('a1.handover');
    return {
      0: !handover, 1: !handover, 50: !handover,
      162: y < 2 || (s.koraYear && y < 3),
      282: y < 2
    };
  }
  function shuffled() {
    const a = [...Array(500).keys()].filter(i => !NAMED.some(n => n.i === i));
    let seed = 41;
    for (let i = a.length - 1; i > 0; i--) { seed = (seed * 16807) % 2147483647; const j = seed % (i + 1); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  const ORDER = shuffled();

  function sleepersSvg(result) {
    const u = C.ui[lang], y = result.state.year, ids = new Set(result.log.map(i => i.beat.id));
    const total = C.awakeOf(result.state, ids);                       // тот же счёт, что у прибора «на вахте» и в отчёте вахты
    const na = namedAwake(result);
    const awake = new Set(Object.keys(na).filter(k => na[k] || total >= (result.state.crew || 500)).map(Number));
    for (const i of ORDER) { if (awake.size >= total) break; awake.add(i); }
    // погибшие в пути — погасшие капсулы (медицинский журнал Акта III)
    const lost = result.state.lost || 0, dead = new Set(), crew = result.state.crew || 500;
    const thaw = result.state.rescueOp === 'move' ? result.state.rescued : 0;   // спасённые Оттепели в спасательном секторе
    for (const i of [...awake]) if (i >= crew) awake.delete(i);
    for (const i of ORDER) { if (awake.size >= total) break; if (i < crew) awake.add(i); }
    for (let j = ORDER.length - 1; j >= 0 && dead.size < lost; j--) if (!awake.has(ORDER[j]) && ORDER[j] < crew) dead.add(ORDER[j]);
    const pos = i => { const g = Math.floor(i / 25), k = i % 25, gx = g % 5, gy = Math.floor(g / 5);
      return [24 + gx * 84 + (k % 5) * 13, 58 + gy * 76 + Math.floor(k / 5) * 13]; };
    let dots = '';
    for (let i = 0; i < 500; i++) {
      const [x, yy] = pos(i), on = awake.has(i);
      dots += i >= crew ? `<circle cx="${x}" cy="${yy}" r="2.6" class="${i - crew < thaw ? 'thaw' : 'rsv'}"/>`
        : dead.has(i) ? `<circle cx="${x}" cy="${yy}" r="2.6" class="dead"/>` : `<circle cx="${x}" cy="${yy}" r="${on ? 3.4 : 2.6}" class="${on ? 'aw' : 'sl'}"/>`;
    }
    let labels = '';
    NAMED.forEach((n, k) => {
      const [x, yy] = pos(n.i), lx = 452, ly = 70 + k * 26;
      labels += `<path d="M${x + 4} ${yy} L${lx - 6} ${ly - 4}" class="lead"/><text x="${lx}" y="${ly}" class="${awake.has(n.i) ? 'aw' : 'sl'}t">${esc(n[lang])}</text>`;
    });
    return `<svg viewBox="0 0 560 360" class="panel-svg sleepers"><text x="16" y="28" class="ttl">${esc(u.sleepers.toUpperCase())}</text>
      <text x="16" y="44" class="sub">${crew - total - lost} ${esc(u.asleep)} · ${total} ${esc(u.onWatch)}${lost ? ` · ${lost} ${esc(u.lost)}` : ''}${crew < 500 ? ` · ${thaw ? `${thaw} ${esc(u.thawIn)}` : `${500 - crew} ${esc(u.thawBerths)}`}` : ''}</text>${dots}${labels}</svg>`;
  }

  function trajectorySvg(result) {
    const u = C.ui[lang], s = result.state, ch = s.choices['d.cloud'], y = s.year;
    const cls = k => !ch ? 'path' : (ch === k ? 'path chosen' : 'path dim');
    let res = '';
    // правила v5: исход прохода — из модели щита (удар крупного зерна), а не прежние «×1,4 и полтора года щита»
    const modelMsg = () => { const h = s.cloudHit, ru = lang === 'ru';
      if (!h) return ru ? 'край чистый · удары пыли в прогнозе' : 'clean edge · dust within forecast';
      return ru ? `полоса крупной пыли · ${h.panel}: ${h.breached ? 'пробой' : 'выбоина'}` : `coarse-dust band · ${h.panel}: ${h.breached ? 'breach' : 'scar'}`; };
    const passed = s.riskVersion >= 5 ? (ch === 'trust' && !!s.cloudHit) || (!!s.beta && y >= C.edgeOut(s) - 1e-9) : y >= 4.5;
    const msg = ch && passed ? (ch === 'trust' ? (s.riskVersion >= 5 ? modelMsg() : u.edgeTrust) : (s.measured ? u.measured : u.edgeMan)) : (s.measured ? u.measured : '');
    if (msg) res = `<text x="16" y="222" class="res">${esc(msg)}</text>`;
    return `<svg viewBox="0 0 520 240" class="panel-svg traj">
      <defs><radialGradient id="cl" cx="70%" cy="50%" r="60%"><stop offset="0" stop-color="#c4895f" stop-opacity=".55"/><stop offset="1" stop-color="#c4895f" stop-opacity="0"/></radialGradient></defs>
      <ellipse cx="400" cy="112" rx="150" ry="92" fill="url(#cl)"/>
      <path d="M280 60 Q300 112 282 170" class="edge"/>
      <path d="M40 112 L480 112" class="${cls('trust')}"/>
      <path d="M40 112 C180 112 220 40 330 36 S470 60 480 70" class="${cls('manoeuvre')}"/>
      <polygon points="40,104 56,112 40,120" class="ship"/>
      <text x="16" y="24" class="ttl">${esc(u.model)}</text>
      <text x="16" y="194" class="sub">${esc(u.manual)}</text>
      <text x="150" y="132" class="lbl">${esc(u.pathStraight)}</text>
      <text x="150" y="70" class="lbl">${esc(u.pathAround)}</text>${res}</svg>`;
  }

  function lifelinesSvg(result) {
    const u = C.ui[lang], s = result.state;
    const rows = [
      [lang === 'ru' ? 'Дассер' : 'Dasser', [[0, 8]]], [lang === 'ru' ? 'Дал' : 'Dal', [[0, 8]]],
      [lang === 'ru' ? 'Лорн' : 'Lorn', [[0, 8]]],
      [lang === 'ru' ? 'Ландис' : 'Landis', s.koraYear ? [[0, 3]] : [[0, 2]]],
      [lang === 'ru' ? 'Осгер' : 'Osger', [[0, 2]]]];
    const X = yv => 110 + yv * 46;
    let g = '';
    rows.forEach(([name, spans], k) => {
      const yy = 64 + k * 30;
      g += `<text x="16" y="${yy + 4}" class="lbl">${esc(name)}</text><line x1="${X(0)}" y1="${yy}" x2="${X(8)}" y2="${yy}" class="sleepline"/>`;
      spans.forEach(([a, b]) => { g += `<line x1="${X(a)}" y1="${yy}" x2="${X(b)}" y2="${yy}" class="awakeline"/>`; });
    });
    let axis = '';
    for (let yv = 0; yv <= 8; yv += 2) axis += `<text x="${X(yv)}" y="222" class="sub" text-anchor="middle">${yv}</text>`;
    return `<svg viewBox="0 0 520 236" class="panel-svg lives"><text x="16" y="28" class="ttl">${esc(u.lives.toUpperCase())}</text>${g}${axis}</svg>`;
  }

  // Две записи станции связи (приложение к исследовательской заявке): направления сопоставлены, метки совпадают.
  function probeSvg(result, matched) {
    const u = C.ui[lang], done = !!matched;
    const bx = done ? 300 : 360, by = done ? 96 : 150;
    return `<svg viewBox="0 0 520 220" class="panel-svg probe"><text x="16" y="26" class="ttl">${esc(u.probeTitle.toUpperCase())}</text>
      <circle cx="260" cy="118" r="70" class="sky"/><circle cx="260" cy="118" r="40" class="sky"/>
      <path d="M190 118 H330 M260 48 V188" class="sky"/>
      <circle cx="300" cy="96" r="7" class="mA"/><text x="16" y="60" class="lbl">${esc(u.probeA)}</text>
      <circle cx="${bx}" cy="${by}" r="11" class="mB"/><text x="16" y="206" class="lbl">${esc(u.probeB)}</text>
      ${done ? `<text x="16" y="44" class="res">${esc(u.probeMatch)}</text>` : ''}</svg>`;
  }
  // Прибор паспорта поверх 3D: полосы меняют длину плавно, рядом — разница с прошлым выбором.
  // Разметка строится один раз на экране паспорта; дальше меняются только ширины и тексты (иначе переходы не видны).
  let ppPrev = {};
  function ppRows() {
    const stop = view && view.result.stop;
    if (!stop || !draft || !stop.beat || stop.beat.ui !== 'passport') return null;
    return C.passportMetrics(stop.state, draft, lang);
  }
  const ppDelta = (k, n) => { const p = ppPrev[k]; if (n == null || p == null || p === n) return ''; const d = Math.round((n - p) * 10) / 10; return d ? ` (${d > 0 ? '+' : '−'}${num(Math.abs(d), d % 1 ? 1 : 0)})` : ''; };
  function ppHtml(rows) {
    const pct = x => `${Math.max(0, Math.min(100, x * 100)).toFixed(2)}%`;
    const bar = r => {
      if (r.type === 'probs') return `<div class="pp-probs">${r.items.map((it, i) => `<span><i>${esc(it.t)}</i><b><span data-pp="${r.k}-v${i}">${esc(it.v)}</span> <q class="flash" data-pp="${r.k}-d${i}"></q></b><em><u data-pp="${r.k}-f${i}" style="width:${pct(it.f)}"></u></em></span>`).join('')}</div>`;
      const segs = r.segs ? r.segs.map((g, i) => `<u class="sg ${g.c}" data-pp="${r.k}-s${i}" style="width:${pct(g.w)}"></u>`).join('') : `<u class="fill ${r.c}" data-pp="${r.k}-f" style="width:${pct(r.fill)}"></u>`;
      const ticks = (r.ticks || []).map(t => `<s style="left:${pct(t.at)}">${t.t ? `<span>${esc(t.t)}</span>` : ''}</s>`).join('');
      return `<div class="pp-bar">${segs}${ticks}</div>`;
    };
    return `<div class="pp"><div class="pp-h">${esc(C.ui[lang].ppTitle)}</div>${rows.map(r => `<div class="pp-row" data-row="${r.k}">
      <div class="pp-l"><span data-pp="${r.k}-l">${esc(r.label)}</span><b data-pp="${r.k}-d"></b></div>${bar(r)}${r.note ? `<div class="pp-n" data-pp="${r.k}-n">${esc(r.note)}</div>` : ''}</div>`).join('')}</div>`;
  }
  function applyPassportPanel() {
    const el = $('overlay'), rows = ppRows();
    if (!rows) { ppPrev = {}; return false; }
    const keys = lang + ':' + rows.map(r => r.k).join(',');            // язык в ключе: подписи и отметки перестраиваются
    if (!el.querySelector('.pp') || el.dataset.pp !== keys) { el.innerHTML = ppHtml(rows); el.dataset.pp = keys; shown.overlay = el.innerHTML; }
    const set = (k, f) => { const n = el.querySelector(`[data-pp="${k}"]`); if (n) f(n); };
    const pct = x => `${Math.max(0, Math.min(100, x * 100)).toFixed(2)}%`;
    for (const r of rows) {
      set(`${r.k}-l`, n => { n.textContent = r.label; });
      const flash = (n, d) => { n.textContent = d; n.className = 'flash'; if (d) { void n.offsetWidth; n.className = 'flash on'; } };
      set(`${r.k}-d`, n => { if (r.n != null && ppPrev[r.k] != null && ppPrev[r.k] !== r.n) flash(n, ppDelta(r.k, r.n)); });
      if (r.note) set(`${r.k}-n`, n => { n.textContent = r.note; });
      if (r.segs) r.segs.forEach((g, i) => set(`${r.k}-s${i}`, n => { n.style.width = pct(g.w); }));
      else if (r.items) r.items.forEach((it, i) => {
        set(`${r.k}-v${i}`, n => { n.textContent = it.v; }); set(`${r.k}-f${i}`, n => { n.style.width = pct(it.f); });
        const key = `${r.k}-${i}`, prev = ppPrev[key], dpp = prev == null ? 0 : Math.round((it.p - prev) * 1000) / 10;
        if (prev != null && prev !== it.p) set(`${r.k}-d${i}`, n => flash(n, dpp ? `${dpp > 0 ? '+' : '−'}${num(Math.abs(dpp), 1)} ${lang === 'ru' ? 'п.п.' : 'pp'}` : ''));
        ppPrev[key] = it.p;
      });
      else set(`${r.k}-f`, n => { n.style.width = pct(r.fill); n.className = `fill ${r.c}`; });
      ppPrev[r.k] = r.n;
    }
    return true;
  }
  // ---------------------------------------------------------------- осмотр щита (правила v5, шаг 6)
  // Отдельное состояние экрана: открыт вручную (прибор, клик по щиту в 3D) — держится при прокрутке, камера стоит
  // на щите, пока осмотр не закрыт; у решения о панели (оверлей 'shield') — открыт с повреждённой панелью, Esc и
  // «Закрыть» убирают его на этом экране. Схема 2D — она же запасной вид без WebGL.
  const SI = {
    ru: { title: 'Щит · осмотр', open: 'Осмотреть щит', close: 'Закрыть', hist: 'История', last: 'Последняя запись прибора',
      legend: '✕ пробой · ▣ заплата · • выбоина · ◇ заменена', note: 'Вид спереди, сектора 00–15 по часовой. Отметки условные: размер и место на панели не в масштабе.' },
    en: { title: 'Shield · inspection', open: 'Inspect the shield', close: 'Close', hist: 'History', last: 'Latest instrument record',
      legend: '✕ breach · ▣ patch · • scar · ◇ replaced', note: 'Front view, sectors 00–15 clockwise. Marks are schematic: size and position on the panel are not to scale.' }
  };
  let insp = null, shieldSel = null, selFor = null, inspClosed = null, inspKey = null;
  const shieldOf = st => !relief && st && st.riskVersion >= 5 && st.shield ? st.shield : null;
  const shieldScreen = beat => beat && beat.overlay === 'shield' && inspClosed !== beat.id;
  const screenStop = result => result && result.stop && result.stop.beat;           // решение экрана (осмотр — по нему, не по прокрутке)
  const inspOn = result => !!(insp || shieldScreen(screenStop(result)));
  // выбранная панель: у решения о панели — она (один раз на экран), иначе — прежний выбор или худшая
  function ensureSel(result) {
    const sb = screenStop(result);
    if (!insp && shieldScreen(sb) && sb.inspect && selFor !== sb.id) { selFor = sb.id; shieldSel = sb.inspect; }
    if (!shieldSel) shieldSel = worstPanel(result.state);
  }
  function worstPanel(st) {
    const V = C.shield.publicView(st.shield), bad = V.panels.filter(p => p.state !== 'ok' && p.state !== 'new').sort((a, b) => a.residual - b.residual);
    return bad.length ? bad[0].id : 'H0';
  }
  function shieldInspHtml(result, beat) {
    const st = result.state, ru = lang === 'ru', T = SI[lang];
    ensureSel(result);
    const info = C.shieldInspect(st, shieldSel, lang); if (!info) return '';
    const V = info.view, cx = 130, cy = 130, K = 106 / 175, SYM = { scarred: '•', patched: '▣', breached: '✕', new: '◇' };
    const pt = (r, a) => `${(cx + r * Math.sin(a)).toFixed(2)} ${(cy - r * Math.cos(a)).toFixed(2)}`;
    let g = '';
    for (const p of V.panels) {
      const sel = p.id === shieldSel ? ' sel' : '';
      if (!p.belt) { g += `<circle cx="${cx}" cy="${cy}" r="${(p.r1 * K - 0.6).toFixed(2)}" class="pn st-${p.state}${sel}" data-panel="${p.id}"><title>${p.id}</title></circle>`; }
      else {
        const a0 = 2 * Math.PI * (p.az - 0.5) / 16 + 0.012, a1 = 2 * Math.PI * (p.az + 0.5) / 16 - 0.012, r0 = p.r0 * K + 0.6, r1 = p.r1 * K - 0.6;
        g += `<path d="M${pt(r1, a0)} A${r1.toFixed(2)} ${r1.toFixed(2)} 0 0 1 ${pt(r1, a1)} L${pt(r0, a1)} A${r0.toFixed(2)} ${r0.toFixed(2)} 0 0 0 ${pt(r0, a0)} Z" class="pn st-${p.state}${sel}" data-panel="${p.id}"><title>${p.id}</title></path>`;
      }
      if (SYM[p.state]) { const a = p.belt ? 2 * Math.PI * p.az / 16 : 0, r = p.belt ? (p.r0 + p.r1) / 2 * K : 0;
        g += `<text x="${(cx + r * Math.sin(a)).toFixed(1)}" y="${(cy - r * Math.cos(a) + 3.5).toFixed(1)}" class="sym" text-anchor="middle">${SYM[p.state]}</text>`; }
    }
    for (let k = 0; k < 16; k++) { const a = 2 * Math.PI * k / 16; g += `<text x="${(cx + 117 * Math.sin(a)).toFixed(1)}" y="${(cy - 117 * Math.cos(a) + 3).toFixed(1)}" class="sec" text-anchor="middle">${String(k).padStart(2, '0')}</text>`; }
    [['A', 39], ['B', 82.5], ['C', 123.5], ['D', 158.5]].forEach(([b, r]) => { const a = -Math.PI / 16; g += `<text x="${(cx + r * K * Math.sin(a)).toFixed(1)}" y="${(cy - r * K * Math.cos(a) + 3).toFixed(1)}" class="belt" text-anchor="middle">${b}</text>`; });
    const last = [...result.log].reverse().find(e => /^sim\.shield\./.test(String(e.beat.id)));
    const lastTxt = last ? E.text(last.beat.text, lang, last.state) : '';
    return `<div class="shield-insp" role="region" aria-label="${esc(T.title)}">
      <div class="si-head"><span>${esc(T.title)}</span><button type="button" class="pill" data-act="inspect-close">${esc(T.close)}</button></div>
      <div class="si-body"><svg viewBox="0 0 260 260" class="si-map" role="img" aria-label="${esc(T.legend)}">${g}</svg>
        <div class="si-card"><h3>${esc(info.title)}</h3><p class="si-where">${esc(info.where)}</p>${info.lines.map(l => `<p>${esc(l)}</p>`).join('')}
          <h4>${esc(T.hist)}</h4><ul>${info.history.map(h => `<li>${esc(h)}</li>`).join('')}</ul>
          ${lastTxt ? `<h4>${esc(T.last)}</h4><p class="si-note">${esc(lastTxt)}</p>` : ''}</div></div>
      <p class="si-foot">${esc(T.legend)}. ${esc(T.note)}</p></div>`;
  }
  function openInspect(panel) {
    if (!view || !shieldOf(view.result.state) || yearAnim) return;
    insp = {}; if (panel) shieldSel = panel; else if (!shieldSel) shieldSel = worstPanel(view.result.state);
    if (window.M31Space && M31Space.ok) { clearTimeout(viewTimer); camView = 'manual:shield'; camAt = performance.now(); M31Space.show('shield'); }
    shown.hud = null; syncScene();
  }
  // ---------------------------------------------------------------- важное — крупно, по центру кадра
  // Итог экспедиции у концовки (держится, пока не закрыт: клик или Esc) и новое происшествие этого хода (гаснет само
  // через 8 с). Один раз на экран: закрытое не возвращается; при загрузке старые происшествия не объявляются.
  const HL = { ru: { close: 'нажмите, чтобы закрыть' }, en: { close: 'click to close' } };
  let incSeen = null, incFor = null, hlKey = null, hlLang = null, hlTimer = null, hlMake = null;
  const hlDone = new Set();
  function hideHeadline() {
    clearTimeout(hlTimer); $('headline').classList.remove('on'); document.querySelector('.app').classList.remove('hl-on');
    if (hlKey) hlDone.add(hlKey);
  }
  function showHeadline(result, isNew) {
    const st = result.state, stop = result.stop, list = st.incidents || [], n = list.length, story = `${exp}|${relief ? 'r' : 'm'}`;
    const scr = `${story}|${cur().join('')}`, el = $('headline');            // экран — весь путь ходов: «назад» и другой выбор — другой экран
    if (incFor !== story || incSeen === null) { incFor = story; incSeen = n; }          // загрузка или другая партия — без объявлений
    let key = null, sticky = false, make = null;
    if (stop && stop.end) { key = `${scr}|end`; sticky = true;
      make = () => Object.assign({ title: t(stop.beat.title, stop.state) }, C.endHeadline(stop.state, stop.beat.id, lang)); }
    else if (isNew && n > incSeen) { key = `${scr}|inc`; const inc = list[n - 1]; make = () => C.incidentHeadline(inc, lang); }
    else if (hlKey && hlKey.startsWith(scr + '|') && el.classList.contains('on')) key = hlKey;   // тот же экран (смена языка) — заголовок остаётся
    incSeen = n;
    if (!key || hlDone.has(key)) { if (hlKey && key !== hlKey) hideHeadline(); return; }
    if (make) hlMake = make;
    const h = hlMake(), html = `<div class="hl-k">${esc(h.kicker)}</div><div class="hl-t">${esc(h.title)}</div>${h.lines.map(l => `<div class="hl-l">${esc(l)}</div>`).join('')}<div class="hl-x">${esc(HL[lang].close)}</div>`;
    if (key === hlKey && el.classList.contains('on')) { if (hlLang !== lang) { el.innerHTML = html; hlLang = lang; } return; }   // смена языка — без повтора появления
    hlKey = key; hlLang = lang; el.innerHTML = html;
    el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); document.querySelector('.app').classList.add('hl-on');   // приборы — приглушены
    clearTimeout(hlTimer); if (!sticky) hlTimer = setTimeout(hideHeadline, 8000);
  }

  function closeInspect() {
    if (yearAnim) return;                                              // Esc во время показа перемотки — не трогает скрытое решение
    const beat = view && screenStop(view.result), was = !!insp || shieldScreen(beat);
    if (!was) return;
    insp = null; if (beat && beat.overlay === 'shield') inspClosed = beat.id;   // и ручной, и автоматический осмотр этого решения
    // ракурс экрана — явно: сцена могла не смениться (setScene пропускает тот же sceneId)
    if (window.M31Space && M31Space.ok && sceneId && C.scenes[sceneId]) applyView(C.scenes[sceneId].view);
    shown.hud = null; syncScene();
  }

  function overlayHtml(result, beat) {
    if (shieldOf(result.state) && inspOn(result)) return shieldInspHtml(result, beat);
    const o = beat.overlay;
    if (o === 'sleepers') return sleepersSvg(result);
    if (o === 'trajectory') return trajectorySvg(result);
    if (o === 'lifelines') return lifelinesSvg(result);
    return '';
  }

  // Сцена следует за чтением: верхняя видимая запись колонки задаёт кадр и прибор.
  let view = null;
  // ---------------------------------------------------------------- перемотка как процесс (DOC «Симулятор v2 — видимость», шаг 2)
  // Новый экран после перемотки открывается не сразу: курсор времени идёт от прежнего года к новому, HUD, таймлайн и 3D
  // показывают корабль по снимкам журнала на этот год (люди, запасы, щит меняются в момент записи, без промежуточных
  // вымышленных значений), события периода всплывают, когда курсор проходит их дату. Записи экрана, решение и крупный
  // заголовок — в конце; ракурс до конца показа — прежний. Длительность — по длине участка, «К результату» — сразу.
  const FF = {
    ru: { toEnd: 'К результату', pass: 'перемотка', cut: 'Перемотка прервана: нужно решение совета', hit: p => `удар в панель ${p}`, breach: p => `пробита панель ${p}`,
      bul: 'принята сводка Кольца', phase: 'фаза полёта' },
    en: { toEnd: 'To the result', pass: 'skipping ahead', cut: 'The skip is interrupted: the council must decide', hit: p => `an impact on panel ${p}`, breach: p => `panel ${p} breached`,
      bul: 'a Ring bulletin received', phase: 'flight phase' }
  };
  const FF_HOLD = 0.7, FF_MAX = 7, FF_FAST = 0.3;
  const ease = k => k < 0.5 ? 2 * k * k : 1 - Math.pow(2 - 2 * k, 2) / 2;
  let yearAnim = null;                                                 // идущий показ перемотки (план ffPlan + время)
  const shownYear = y => yearAnim ? yearAnim.y : y;
  const storyKey = () => `${exp}|${relief ? 'r' : 'm'}`;
  // фаза полёта на год y — как на таймлайне
  function phaseOf(s, y) {
    if (!s.arrive) return null;
    const A = C.arriveView(s), b0 = M.brakeStart(A, s.tMag);
    return y < M.ACC ? 'acc' : y >= A ? 'home' : y < b0 ? 'drift' : s.tMag != null && y >= A - M.ENGINE ? 'eng' : 'mag';
  }
  // план показа: снимки журнала нового экрана по годам и события периода (не больше трёх сообщений, две паузы)
  function ffPlan(prev, result) {
    if (!prev || prev.story !== storyKey()) return null;
    const p0 = prev.result, n0 = p0.log.length, y0 = p0.state.year, y1 = result.state.year;
    if (!(y1 > y0 + 1e-9) || result.log.length < n0) return null;
    const tail = result.log.slice(n0);
    if (!tail.some(i => i.beat.kind === 'skip' || i.beat.kind === 'watch')) return null;
    const snaps = [{ at: y0, n: n0, state: p0.state }], evs = [];
    let ps = p0.state;
    tail.forEach((it, k) => {
      const s = it.state, at = Math.max(y0, s.year);
      for (const inc of (s.incidents || []).slice((ps.incidents || []).length)) evs.push({ at: Math.min(at, Math.max(y0, inc.year)), w: 3, k: 'inc', inc });
      if (s.shield && ps.shield) for (const h of s.shield.hits.slice(ps.shield.hits.length)) evs.push({ at: Math.min(at, Math.max(y0, h.at)), w: 2, k: h.first === 'breached' ? 'breach' : 'hit', panel: h.panel });
      if (it.beat.kind === 'bulletin') evs.push({ at, w: 1, k: 'bul' });
      if (it.beat.ev) evs.push({ at: Math.max(y0, Math.min(at, it.beat.at)), w: 2, k: 'note', title: it.beat.title });
      if (it.beat.kind === 'watch' && it.beat.data && it.beat.data.interrupted) evs.push({ at, w: 4, k: 'cut' });
      snaps.push({ at, n: n0 + k + 1, state: s });
      ps = s;
    });
    // смена фазы полёта (разгон → дрейф → магнит → двигатель → у цели) — по годам границ
    const s1 = result.state, ph0 = phaseOf(s1, y0), ph1 = phaseOf(s1, y1);
    if (ph0 && ph0 !== ph1 && !relief) {
      const A = C.arriveView(s1), cuts = [M.ACC, M.brakeStart(A, s1.tMag), s1.tMag != null ? A - M.ENGINE : null, A].filter(c => c != null && c > y0 && c <= y1);
      for (const c of cuts) evs.push({ at: c, w: 1, k: 'phase', phase: phaseOf(s1, c + 1e-9) });
    }
    for (const e of evs) if (e.w === 2) { const inc = evs.find(x => x.w === 3 && Math.abs(x.at - e.at) < 1e-6 && !x.with);
      if (inc) { inc.with = e; e.drop = true; } }
    const msgs = evs.filter(e => !e.drop).sort((a, b) => b.w - a.w || a.at - b.at).slice(0, 3).sort((a, b) => a.at - b.at || a.w - b.w);
    const days = (y1 - y0) * 365.25, still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const T = still ? 0.4 : Math.min(5.5, Math.max(1.5, 1.2 + 1.1 * Math.log10(1 + days)));
    // паузы на значимых событиях: время базового хода, когда курсор доходит до года события (обратная к ease)
    const uAt = f => { let a = 0, b = 1; for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if (ease(m) < f) a = m; else b = m; } return b; };
    const nh = still ? 0 : Math.min(3, Math.floor((FF_MAX - T) / FF_HOLD));
    const holds = msgs.filter(m => m.w >= 2).sort((a, b) => b.w - a.w).slice(0, nh).map(m => ({ tb: uAt((m.at - y0) / (y1 - y0)) * T })).sort((a, b) => a.tb - b.tb);
    return { y0, y1, from: y0, y: y0, T, still, holds, total: T + holds.length * FF_HOLD, snaps, msgs, log: result.log, n0, next: 0, cur: null, msg: null, sn: -1 };
  }
  // текст сообщения — на языке вывода (смена языка посреди показа переводит и текущую строку)
  function ffText(e) {
    const F = FF[lang], one = x => x.k === 'inc' ? C.incidentHeadline(x.inc, lang).title : x.k === 'hit' ? F.hit(x.panel) : x.k === 'breach' ? F.breach(x.panel)
      : x.k === 'bul' ? F.bul : x.k === 'cut' ? F.cut : x.k === 'note' ? t(x.title) : `${F.phase}: ${C.ui[lang].tlPhase[x.phase]}`;
    return `<b>${esc(fmtYear(e.at))}</b> · ${esc(one(e) + (e.with ? ` — ${one(e.with)}` : ''))}`;
  }
  // базовое время хода курсора (без пауз) по реальному времени показа
  function ffBase(a, t) {
    let tb = t;
    for (const h of a.holds) { if (tb <= h.tb) break; if (tb < h.tb + FF_HOLD) return h.tb; tb -= FF_HOLD; }
    return tb;
  }
  function ffStart(plan) {
    hideHeadline();
    yearAnim = Object.assign(plan, { t0: performance.now() });
    document.querySelector('.app').classList.add('ff');
    $('ffEnd').textContent = `${FF[lang].toEnd} →`;
    requestAnimationFrame(ffTick);
  }
  function ffTick() {
    const a = yearAnim;
    if (!a || !view) return;
    const now = performance.now();
    let done;
    const t = (now - a.t0) / 1000;
    if (a.fast) { const k = Math.min(1, (now - a.fast.t0) / (FF_FAST * 1000)); a.y = a.fast.y + (a.y1 - a.fast.y) * ease(k); done = k >= 1; }
    else { a.y = a.y0 + (a.y1 - a.y0) * ease(Math.min(1, ffBase(a, t) / a.T)); done = t >= a.total; }
    if (done) a.y = a.y1;
    const y = a.y;
    // снимок журнала на год y: приборы и щит — каким корабль был на эту дату
    let k = 0; while (k + 1 < a.snaps.length && a.snaps[k + 1].at <= y + 1e-9) k++;
    const sn = a.snaps[k], pr = { log: a.log.slice(0, sn.n), state: sn.state };
    if (window.M31Space && M31Space.ok) {
      const w = { year: y, atEarth: y < 0.5, anim: { from: a.y0, to: a.y1 } };
      if (k !== a.sn && sn.state.shield && !relief) w.shield = C.shield.publicView(sn.state.shield);
      M31Space.setWorld(w);
    }
    a.sn = k;
    if (hudBeat) {
      const ph = phaseOf(sn.state, y), line = `<span class="ffl">${esc(FF[lang].pass)}${ph && !relief ? ` · ${esc(C.ui[lang].tlPhase[ph])}` : ''}</span>`;
      setHtml('hud', hudHtml(pr, hudBeat, y).replace('</span>', `</span>${line}`)); setTimeline(pr, y);
    }
    // сообщения — по очереди: пройденное событие ждёт, пока предыдущее провисит FF_HOLD (одновременные не затирают друг друга)
    const ready = a.next < a.msgs.length && a.msgs[a.next].at <= y + 1e-9;
    if (ready && (!a.cur || now - a.cur >= FF_HOLD * 1000 || a.fast)) {
      const e = a.msgs[a.next++], el = $('ffmsg'); a.cur = now; a.msg = e;
      el.innerHTML = ffText(e); el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
    }
    // досказать очередь — но не дольше общего потолка показа; при reduced motion не ждём
    if (done && !a.fast && !a.still && t < FF_MAX && (a.next < a.msgs.length || (a.cur && now - a.cur < FF_HOLD * 1000))) done = false;
    if (done) ffDone(); else requestAnimationFrame(ffTick);
  }
  function ffFast() { const a = yearAnim; if (a && !a.fast) a.fast = { t0: performance.now(), y: a.y }; }
  // конец показа: экран целиком — записи, решение, ракурс, заголовок
  function ffStop() {
    yearAnim = null;
    document.querySelector('.app').classList.remove('ff');
    $('ffmsg').classList.remove('on');
  }
  function ffDone() {
    ffStop();
    if (!view) return;
    const c = $('current'); c.classList.remove('fresh'); void c.offsetWidth; c.classList.add('fresh');
    syncScene();
    showHeadline(view.result, true);
    fillArchive(view.result.log);
    if (view.result.stop && view.result.stop.beat && view.result.stop.beat.kind === 'cinematic') startCinematic(view.result.stop.beat);
  }
  // архив — весь журнал; во время показа перемотки — только до неё (иначе архив раскрыл бы период раньше курсора)
  function fillArchive(log) {
    $('log').innerHTML = withIllus(log).map(html => html ? `<div class="item">${html}</div>` : '').join('');
    $('log').dataset.filter = filter;
  }

  // DOM меняется, только когда меняется содержимое: прокрутка не пересобирает приборы
  const shown = {};
  function setHtml(id, html) { if (shown[id] !== html) { shown[id] = html; $(id).innerHTML = html; } }
  let hudBeat = null;

  // Одна позиция камеры на экран (на каждый ход игрока): решение со своей сценой — его ракурс, иначе — первое
  // новое событие экрана. Прокрутка колонки камеру не двигает: по чтению меняются только приборы и подписи.
  function screenBeat(result, group) {
    const sb = result.stop && result.stop.beat;
    if (sb && sb.kind === 'decision' && sb.scene) return sb;
    const first = group.find(i => i.beat.scene && i.beat.kind !== 'decision');
    return first ? first.beat : currentBeat(result);
  }
  function syncScene() {
    if (!view || yearAnim) return;                                      // идёт показ перемотки: экран откроется в конце
    const y = shownYear(view.result.state.year);
    const box = $('panelScroll'), top = box.getBoundingClientRect().top + 60;
    // всё видно без прокрутки или дочитано до конца — показываем последнее событие
    const atEnd = box.scrollHeight <= box.clientHeight + 10 || box.scrollTop + box.clientHeight >= box.scrollHeight - 10;
    let beat = null;
    for (const el of $('current').querySelectorAll('.item')) {
      const item = view.group[+el.dataset.g];
      if (item && item.beat.scene) beat = item.beat;
      if (!atEnd && el.getBoundingClientRect().bottom > top) break;
    }
    const stopEl = $('stop').firstElementChild;
    if (stopEl && stopEl.getBoundingClientRect().top < top + 40 && view.result.stop && view.result.stop.beat && view.result.stop.beat.scene) {
      beat = view.result.stop.beat;
    }
    if (!beat) beat = currentBeat(view.result);
    if (atStop('agenda') || atStop('passport')) beat = view.result.stop.beat;   // голосование с картой и паспорт — сцена решения
    const y2 = view.result.state.year;
    if (window.M31Space && M31Space.ok && relief) {
      const st = view.result.state, inc = relief.incident, R = M.rescuers(inc, relief.world), res = st.res;
      M31Space.setWorld({ shield: null, shieldSel: null, store: null, outpost: null, wreck: false, dark: 'sleep', year: y, anim: yearAnim ? { from: yearAnim.from, to: y2 } : null, separated: true, cloudSeen: inc.sent > 4, worldClass: M.worldOf(inc.target),
        burning: false, atEarth: false, target: inc.target, beta: inc.beta, arrive: inc.arrive, cargo: [], cargoLabels: false, scout: 0,
        relief: { P: R.P, sent: inc.sent, council: R.council.id, list: R.list.map(r => ({ id: r.id, colony: r.colony || null, hear: r.hear, launch: r.launch, complete: r.complete })),
          voyages: res ? res.voyages : [] }, legacy: { passTug: relief.world.passTug !== false, settled: relief.world.settled || [] } });
    } else if (window.M31Space && M31Space.ok) {
      const ids = new Set(view.result.log.map(i => i.beat.id));
      const st = view.result.state;
      const sh = shieldOf(st);
      if (sh && inspOn(view.result)) ensureSel(view.result);
      M31Space.setWorld({ shield: sh ? C.shield.publicView(sh) : null, shieldSel: sh && inspOn(view.result) ? shieldSel : null,
        launches: [st.scout > 0 ? { id: 'scout', at: st.scout } : null, st.choices['d.stream'] === 'probe' ? { id: 'stream', at: st.arrive - 5 } : null].filter(Boolean),
        wreck: !!st.lostShip, dark: st.dutchman ? 'empty' : st.outcome === 'sos' ? 'sleep' : null, relief: null, anim: yearAnim ? { from: yearAnim.from, to: y2 } : null, legacy: { passTug: world.passTug !== false, settled: world.settled || [] }, year: y, separated: ids.has('a1.stage'), cloudSeen: ids.has('a1.cloud'),
        worldClass: st.target ? M.worldOf(st.target) : null,
        burning: ids.has('a1.depart') && !ids.has('a1.stage'), atEarth: y < 0.5,
        target: st.target || (atStop('agenda') && mapPick) || M.DECLARED, beta: st.beta, arrive: st.target ? C.arriveView(st) : 0,
        // голосование по заявкам: курса ещё нет — звезда только осматривается; кольца у звёзд заявок повестки
        knee: st.route ? st.route.knee : null,                          // излом траектории после поворота (совет «Новые сведения»)
        preview: atStop('agenda') && !st.target, inspect: !!(atStop('agenda') && mapPick), requestStars: atStop('agenda') ? view.result.stop.options.map(o => (C.requests.get(o.id) || {}).star).filter(Boolean) : [],
        cargo: cargo3d(atStop('passport') && draft ? draft : st), cargoLabels: atStop('passport'), tMag: st.tMag,
        scout: st.scout, scoutV: st.scout === 6 ? st.beta * 0.75 + 0.085 : st.beta + 0.07,
        // склад Оттепели (спасатель v3): с ближней диагностики до перехода к дому
        store: st.riskVersion >= 3 && st.mission === 'rescue' && st.sectionEnd != null && !ids.has('s.e6') && !st.lostShip
          ? { key: st.riskSeed, docked: !!st.dockMethod, stable: !!st.thawStable, safe: !!st.sectionSafe, torn: !!st.pipeTorn, op: st.rescueOp || null } : null,
        // форпост Ксилона Ир (снабженец): от первой связи у звезды Барнарда до перехода к дому
        outpost: st.mission === 'supply' && (ids.has('a3s.outpost2') || ids.has('a3s.outpost')) && !ids.has('s.e6') && !st.lostShip
          ? { key: st.riskSeed || 'v0', deliver: st.deliver || null, relay: !!st.relayOK, caps: !!st.capsOK, capsLost: !!st.capsLost } : null });
    }
    const cam = view.cam || beat;
    setScene((cam.sceneOf ? cam.sceneOf(view.result.state) : cam.scene) || 'council');   // сцена может зависеть от партии (цель заявки)
    hudBeat = cam;                                                      // место в приборах — то же, что показывает камера
    setHtml('hud', hudHtml(view.result, cam, y)); setTimeline(view.result, y);
    if (!applyPassportPanel()) { delete $('overlay').dataset.pp; setHtml('overlay', overlayHtml(view.result, beat)); }
    $('overlay').dataset.side = (C.scenes[beat.scene] || {}).side || 'left';
    // осмотр щита: центр щита в 3D — между карточкой осмотра и колонкой записей (на узком экране — по центру свободной части)
    if (window.M31Space && M31Space.setShieldFocus) {
      const box = $('space').getBoundingClientRect(), ins = document.querySelector('.shield-insp'), col = $('panelScroll').getBoundingClientRect();
      if (!ins) M31Space.setShieldFocus(null);
      else { const o = ins.getBoundingClientRect(), right = Math.min(box.right, col.left > box.left + 200 ? col.left : box.right);
        const x = right - o.right > 260 ? (o.right + right) / 2 : (box.left + right) / 2;
        M31Space.setShieldFocus({ x: x - box.left, y: (o.top - box.top) > 0.5 * box.height ? 0.36 * box.height : 0.42 * box.height }); }
    }
  }
  let ticking = false;
  document.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; syncScene(); });
  }, true);


  // ---------------------------------------------------------------- заявочный план
  let cine = null;
  function startCinematic(beat) {
    if (cine && cine.beat.id === beat.id) { showCaption(); return; }
    cine = { beat, i: -1, timer: null };
    document.body.classList.add('cine');
    nextShot();
  }
  function nextShot() {
    if (!cine) return;
    clearTimeout(cine.timer);
    cine.i++;
    const shots = cine.beat.shots;
    if (cine.i >= shots.length) return endCinematic();
    const sh = shots[cine.i];
    if (window.M31Space && M31Space.ok) M31Space.shot(sh);
    showCaption();
    cine.timer = setTimeout(nextShot, sh.dur);
  }
  function showCaption() {
    const sh = cine && cine.beat.shots[cine.i];
    $('caption').innerHTML = sh ? `<p>${esc(sh[lang])}</p>` : '';
    const u = C.ui[lang];
    $('cineNext').textContent = u.nextShot; $('cineSkip').textContent = u.skipIntro;
  }
  function endCinematic() {
    if (!cine) return;
    camView = null; sceneId = null;
    clearTimeout(cine.timer);
    if (window.M31Space && M31Space.endShots) M31Space.endShots();
    document.body.classList.remove('cine');
    $('caption').innerHTML = '';
    cine = null;
    cur().push('go'); save(); render(true);
  }

  // ---------------------------------------------------------------- отрисовка
  function render(fresh) {
    const u = C.ui[lang];
    if (window.M31Space && M31Space.setLang) M31Space.setLang(lang);
    document.documentElement.lang = lang;
    document.title = u.title;
    $('title').textContent = u.title;
    $('lang').textContent = u.lang; $('lang').setAttribute('aria-label', u.langLabel);
    $('settingsBtn').textContent = u.settings; $('settingsTitle').textContent = u.settings; $('closeSettings').textContent = u.close;
    $('settingsBody').innerHTML = settingsHtml(u);
    $('archiveBtn').textContent = u.archiveBtn; $('encBtn').textContent = u.encBtn; $('closeArchive').textContent = u.close;

    let result;
    try { result = E.run(story(), cur(), ctx()); } catch (err) {
      // старое сохранение: новые решения — вариантом по умолчанию, лишнее после конца — прочь; иначе копия и новая партия
      const fixed = relief ? null : E.migrate(C, tokens, C.INSERTED, ctx());
      if (fixed) tokens = fixed;
      // сброс основной партии — новая экспедиция целиком: новые правила и сид, а не прежние версии старого сохранения
      else { backup(err.message); if (relief) relief = null; else { tokens = []; exp = newExp(); riskVersion = C.RISK; riskSeed = exp; agenda = C.requests.agenda(world); mapPick = null; draft = null; votePick = null; } }
      save(); result = E.run(story(), cur(), ctx());
    }
    // интерфейс видит только публичные снимки (журнал, HUD, таймлайн, 3D, итог): сид — в ctx() партии, не в состоянии
    const hide = st => { if (st) st.riskSeed = null; };
    hide(result.state); result.log.forEach(i => hide(i.state)); if (result.stop) hide(result.stop.state);
    // осмотр щита — состояние экрана: новый ход, «назад», спасатель или новая экспедиция — новый экран, осмотр закрыт;
    // камера возвращается к ракурсу сцены нового экрана (setScene пропускает тот же sceneId — сбрасываем)
    const screenKey = `${exp}|${relief ? 'r' : 'm'}|${cur().length}`;
    if (screenKey !== inspKey) { if (insp && sceneId) sceneId = null; insp = null; inspClosed = null; selFor = null; shieldSel = null; inspKey = screenKey; }
    // итог основной партии — в мир, один раз по id экспедиции (повторное открытие финала не дублирует);
    // старое сохранение, где спасатели начаты до записи, — из сохранённых ходов основной партии (снимок спасателей не трогаем)
    const main = !relief ? result : (world.applied || []).includes(`${exp}|done`) ? null : (() => { try { return E.run(C, tokens, ctx()); } catch (e) { return null; } })();
    if (main && main.stop && main.stop.end && main.state.target) {
      const w2 = C.applyEvents(world, [C.expeditionEvent(main.state, exp)]);
      if (JSON.stringify(w2) !== JSON.stringify(world)) { world = w2; C.setWorld(world); save(); }
    }
    // партия спасателей меняет мир событиями, каждое — один раз и поверх текущего мира:
    // аппарат Перевала списан, когда вылетел; спасённые — новое поселение, когда помощь закончена
    if (relief) {
      const w2 = C.applyEvents(world, C.reliefEvents(result.state));
      if (JSON.stringify(w2) !== JSON.stringify(world)) { world = w2; C.setWorld(world); save(); }
    }

    // текущая группа — всё после последнего действия игрока
    let from = 0;
    result.log.forEach((item, i) => { if (['decision', 'skip', 'cinematic'].includes(item.beat.kind)) from = i; });
    const group = result.log.slice(from);
    const isNew = fresh && cur().length !== shownTokens;
    $('current').innerHTML = withIllus(group).map((html, i) => html ? `<div class="item" data-g="${i}">${html}</div>` : '').join('');
    $('stop').innerHTML = stopHtml(result);
    const sb = result.stop && result.stop.beat, canSkip = !!(sb && sb.kind === 'skip');
    $('sceneSkip').hidden = !canSkip;
    if (canSkip) $('sceneSkip').textContent = `${t(sb.label, result.stop.state)} →`;
    if (isNew) { $('current').classList.remove('fresh'); void $('current').offsetWidth; $('current').classList.add('fresh'); $('panelScroll').scrollTop = 0; }
    shownTokens = cur().length;
    const prevView = view;
    view = { result, group, cam: screenBeat(result, group), story: storyKey() };
    // новый ход с перемоткой — показ процесса; экран, заголовок и заставка — в его конце (ffDone)
    if (isNew) { if (yearAnim) ffStop(); const plan = ffPlan(prevView, result); if (plan) ffStart(plan); }
    else if (yearAnim) { $('ffEnd').textContent = `${FF[lang].toEnd} →`; if (yearAnim.msg) $('ffmsg').innerHTML = ffText(yearAnim.msg); }   // смена языка посреди показа
    syncScene();
    if (!yearAnim) {
      showHeadline(result, isNew);
      if (result.stop && result.stop.beat && result.stop.beat.kind === 'cinematic') startCinematic(result.stop.beat);
    }

    $('filters').innerHTML = Object.entries(u.filters).map(([k, v]) =>
      `<button data-filter="${k}" aria-pressed="${k === filter}">${esc(v)}</button>`).join('');
    fillArchive(yearAnim ? result.log.slice(0, yearAnim.n0) : result.log);
  }

  // настройки: язык, звук (в срезе пока нет), прогресс — новый мир и полный сброс
  function settingsHtml(u) {
    const sec = (h, body) => `<section class="set-sec"><h3>${esc(h)}</h3>${body}</section>`;
    return sec(u.setLang, `<div class="set-row">${[['ru', 'Русский'], ['en', 'English']].map(([k, n]) => `<button class="pill" data-setlang="${k}" aria-pressed="${lang === k}">${n}</button>`).join('')}</div>`)
      + sec(u.setSound, `<p class="set-note">${esc(u.soundNone)}</p>`)
      + sec(u.setProgress, `<div class="set-item"><button class="pill" data-act="newWorld">${esc(u.newWorld)}</button><p class="set-note">${esc(u.newWorldHint)}</p></div>
        <div class="set-item"><button class="pill danger" data-act="wipe">${esc(u.wipe)}</button><p class="set-note">${esc(u.wipeHint)}</p></div>`);
  }
  const openSettings = () => { $('settings').hidden = false; $('closeSettings').focus(); };
  const closeSettings = () => { if ($('settings').hidden) return; $('settings').hidden = true; $('settingsBtn').focus(); };
  function startOver() {
    if (cine) { clearTimeout(cine.timer); cine = null; document.body.classList.remove('cine'); }
    // новый круг начинается как при загрузке: 3D гаснет и проявляется, вступление — с кадра, а не перелётом от прошлой партии
    if (window.M31Space && M31Space.ok && M31Space.resetVoyage) { M31Space.resetVoyage(); const sp = $('space'); sp.classList.remove('fresh'); void sp.offsetWidth; sp.classList.add('fresh'); }
    camView = null; sceneId = null; clearTimeout(viewTimer);
    world = { passTug: true, seed: newExp() }; C.setWorld(world);                        // повтор сорок первой — только в новом мире
    tokens = []; relief = null; exp = newExp(); riskVersion = C.RISK; riskSeed = exp; agenda = C.requests.agenda(world); ffStop(); mapPick = null; draft = null; votePick = null;
  }

  document.addEventListener('click', e => {
    if (e.target.closest('#headline')) { hideHeadline(); return; }
    const pn = e.target.closest('[data-panel]');
    if (pn && pn.closest('.shield-insp')) { shieldSel = pn.dataset.panel; syncScene(); return; }
    const btn = e.target.closest('button');
    if (!btn) return;
    const act = btn.dataset.act;
    if (yearAnim && (act === 'inspect' || act === 'inspect-close')) return;          // осмотр — после показа перемотки
    if (act === 'inspect') { if (insp) closeInspect(); else openInspect(); return; }
    if (act === 'inspect-close') { closeInspect(); return; }
    if (act === 'ffEnd') { ffFast(); return; }
    if (act === 'go') { if (yearAnim) return; cur().push('go'); save(); render(true); }
    else if (act === 'vote') { cur().push(btn.dataset.option); mapPick = null; draft = null; votePick = null; save(); render(true); }
    else if (btn.dataset.sel) { const id = btn.dataset.sel; if (atStop('agenda')) agendaPick(null, id); else { votePick = id; refreshStop(); } refocus('sel', id); }
    else if (btn.dataset.pick) { const n = btn.dataset.pick; if (atStop('agenda')) agendaPick(n); else { mapPick = n; refreshStop(); } refocus('pick', n); }
    else if (btn.dataset.draft) { draft[btn.dataset.draft] = Number(btn.dataset.v); refreshStop(); }
    else if (btn.dataset.eq) { draft.eq = Object.assign({}, draft.eq, { [btn.dataset.eq]: btn.dataset.v }); const det = btn.closest('details'); refreshStop(); if (det) { const d2 = document.querySelector('details.equip'); if (d2) d2.open = true; } }
    else if (btn.dataset.kit) { const k = btn.dataset.kit; draft.kits = draft.kits.includes(k) ? draft.kits.filter(x => x !== k) : draft.kits.concat(k); refreshStop(); }
    else if (act === 'back') { cur().pop(); ffStop(); mapPick = null; draft = null; votePick = null; save(); render(true); }
    else if (act === 'relief') {                                          // авария с живыми → совет, услышавший первым
      const st = view.result.state, incident = JSON.parse(JSON.stringify(st.incident));
      incident.id = `${exp}|${incident.id}`;
      relief = { incident, world: JSON.parse(JSON.stringify(world)), tokens: [] }; ffStop();
      mapPick = null; draft = null; votePick = null; save(); render(true);
    }
    else if (act === 'restart' || act === 'newWorld') {
      // из настроек посреди партии — с подтверждением; прежнее сохранение — в резервную копию
      if (btn.closest('#settings') && (tokens.length || relief) && !window.confirm(C.ui[lang].newWorldAsk)) return;
      backup('new world'); startOver(); closeSettings(); save(); render(true);
    }
    else if (act === 'wipe') {                                            // всё: партия, память мира, резервная копия; язык остаётся
      if (!window.confirm(C.ui[lang].wipeAsk)) return;
      try { localStorage.removeItem(KEY); localStorage.removeItem(KEY + '-bak'); } catch (err) { /* нет */ }
      startOver(); closeSettings(); save(); render(true);
    }
    else if (btn.dataset.setlang) {                                      // перерисовка пересоздаёт кнопки — фокус возвращаем на выбранный язык
      if (btn.dataset.setlang !== lang) { lang = btn.dataset.setlang; save(); render(false); const b2 = document.querySelector(`#settings [data-setlang="${lang}"]`); if (b2) b2.focus(); } }
    else if (btn.id === 'settingsBtn') openSettings();
    else if (btn.id === 'closeSettings') closeSettings();
    else if (btn.id === 'cineNext') nextShot();
    else if (btn.id === 'cineSkip') endCinematic();
    else if (btn.id === 'lang') { lang = lang === 'ru' ? 'en' : 'ru'; save(); render(false); }
    else if (btn.id === 'archiveBtn') { $('archive').hidden = false; $('closeArchive').focus(); }
    else if (btn.id === 'closeArchive') { $('archive').hidden = true; $('archiveBtn').focus(); }
    else if (btn.dataset.filter) { filter = btn.dataset.filter; render(false); }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { $('archive').hidden = true; closeSettings(); closeInspect(); hideHeadline(); } });

  if (window.M31Space && M31Space.mount) {
    try { M31Space.mount($('space')); } catch (err) { M31Space.ok = false; console.warn('3D недоступно:', err); }
    M31Space.onPick = name => { if (atStop('agenda')) agendaPick(name); };   // справка о звезде (и её заявка), курс не меняется
    M31Space.onPartPick = ({ part, panel }) => {
      if (part !== 'shield' || !view || !shieldOf(view.result.state) || yearAnim) return;
      const beat = view.result.stop && view.result.stop.beat;
      if (inspOn(view.result)) { shieldSel = panel; syncScene(); } else openInspect(panel);
    };
    const shiftForCards = () => { if (!M31Space.setViewShift) return;
      const wide = innerWidth > 900 && !document.body.classList.contains('cine');
      M31Space.setViewShift(wide ? $('panelScroll').getBoundingClientRect().width / 2 + 9 : 0); };
    window.addEventListener('resize', shiftForCards); new MutationObserver(shiftForCards).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    setTimeout(shiftForCards, 0);
    if (hashArg('look')) { window.__look = () => M31Space.debugLook(hashArg('look'), Number(hashArg('dist')) || 0); }
  }
  render(false);
  if (window.__look) { window.__look(); setTimeout(window.__look, 300); }
})();
