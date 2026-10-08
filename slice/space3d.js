/* М31 · срез: живой 3D-вид.
   Корабль (эскиз A, размеры из ART/starship/v3-sketches) — в метрах; звёзды — в световых годах.
   Две сцены рисуются одной камерой с логарифмическим буфером глубины; колесо ведёт масштаб
   от сотен метров до десятков световых лет. three.js r149 (UMD) подключается из CDN;
   без него срез показывает запасные кадры Blender. */
(function () {
  'use strict';
  const LY = 9.4607e15;                       // метров в световом году
  const THREE = window.THREE;
  const api = { ok: false };
  window.M31Space = api;
  if (!THREE) return;

  // Цель задаёт игра (setWorld({ target })); до выбора — ε Индейца, заявленная цель тридцать второй.
  const stars = (window.M31_STARS || []).slice();
  let targetInfo = { star: 'Epsilon Indi', ru: 'ε Индейца', en: 'ε Indi' };
  const T = new THREE.Vector3(), U = new THREE.Vector3(), E2 = new THREE.Vector3(), E3 = new THREE.Vector3();
  function setFrame(name) {
    const st = stars.find(s => s.name === name) || { x: 7.259, y: -3.203, z: -8.825 };
    T.set(st.x, st.y, st.z);
    U.copy(T).normalize();                    // направление полёта
    E2.crossVectors(U, new THREE.Vector3(0, 0, 1)).normalize();
    E3.crossVectors(E2, U).normalize();
  }
  setFrame(targetInfo.star);
  function starInfo(name) { const st = stars.find(s => s.name === name) || {}; return { absmag: st.absmag ?? 4.83, sp: st.sp || 'G' }; }
  Object.assign(targetInfo, starInfo(targetInfo.star));

  // ---------------------------------------------------------------- Солнечная система
  // Планеты по ship-builder/data/solar.js: полные кеплеровы элементы JPL (1800–2050), эклиптика J2000.
  // Эклиптика → экватор (наклон 23,44°) → галактика (матрица J2000): те же оси, что у звёзд каталога.
  const SOLAR = window.M31_SOLAR || { planets: [] };
  const AU_LY = 1 / 63241.077, J2000 = Date.UTC(2000, 0, 1, 12), DEPART = Date.UTC(2026, 8, 30);
  const EPS = 23.4393 * Math.PI / 180;
  const EQ2GAL = [[-0.0548755604, -0.8734370902, -0.4838350155], [0.4941094279, -0.4448296300, 0.7469822445], [-0.8676661490, -0.1980763734, 0.4559837762]];
  function ecl2gal(x, y, z) {
    const ye = y * Math.cos(EPS) - z * Math.sin(EPS), ze = y * Math.sin(EPS) + z * Math.cos(EPS), e = [x, ye, ze];
    return new THREE.Vector3(...EQ2GAL.map(r => r[0] * e[0] + r[1] * e[1] + r[2] * e[2]));
  }
  const centuries = year => (DEPART - J2000) / 864e5 / 36525 + year / 100;
  // Полные кеплеровы элементы JPL (a, e, I, L, ϖ, Ω и их вековой ход): эллипс с наклоном, уравнение Кеплера.
  const D2R = Math.PI / 180;
  function elements(pl, T) {
    const el = pl.el, v = k => el[k][0] + el[k][1] * T;
    return { a: v('a'), e: v('e'), I: v('I') * D2R, L: v('L'), w: v('w'), O: v('O') };
  }
  // точка орбиты по эксцентрической аномалии E, эклиптика J2000, а.е.
  function orbitPoint(k, E) {
    const x1 = k.a * (Math.cos(E) - k.e), y1 = k.a * Math.sqrt(1 - k.e * k.e) * Math.sin(E);
    const om = (k.w - k.O) * D2R, Om = k.O * D2R, cI = Math.cos(k.I), sI = Math.sin(k.I);
    const co = Math.cos(om), so = Math.sin(om), cO = Math.cos(Om), sO = Math.sin(Om);
    return [(co * cO - so * sO * cI) * x1 + (-so * cO - co * sO * cI) * y1,
            (co * sO + so * cO * cI) * x1 + (-so * sO + co * cO * cI) * y1,
            (so * sI) * x1 + (co * sI) * y1];
  }
  // гелиоцентрическое положение планеты в год полёта, св. годы
  function helio(pl, year) {
    const T = centuries(year);
    if (!pl.el) { const L = (pl.L0 + pl.Lrate * T) * D2R; return ecl2gal(pl.a * Math.cos(L), pl.a * Math.sin(L), 0).multiplyScalar(AU_LY); }
    const k = elements(pl, T);
    let M = ((k.L - k.w) % 360 + 540) % 360 - 180; M *= D2R;
    let E = M + k.e * Math.sin(M);
    for (let i = 0; i < 8; i++) E -= (E - k.e * Math.sin(E) - M) / (1 - k.e * Math.cos(E));
    return ecl2gal(...orbitPoint(k, E)).multiplyScalar(AU_LY);
  }
  const EARTH_PL = SOLAR.planets.find(p => p.name === 'Земля') || { a: 1, L0: 100.46, Lrate: 35999.37 };
  const E0 = new THREE.Vector3();                   // Земля в день отлёта (задаётся после сборки кадра)

  // Путь от Солнца по годам — профиль mission.js: разгон 8 лет, дрейф, плазменный магнит tMag лет (β → 0,01c),
  // двигатель ядра 4 года (0,01c → 0); у старых сохранений (tMag = null) — 20 лет равнозамедленно до нуля.
  // Год прибытия округлён — поправка разложена на весь дрейф, чтобы корабль остановился точно у цели, без скачка.
  const brakeYears = () => world.tMag == null ? 20 : world.tMag + 4;
  function distLy(y) { return distLyRaw(y); }
  // излом траектории (совет «Новые сведения»): до года поворота корабль шёл к прежней цели, дальше — от точки поворота
  // к новой; длина пути для профиля — сумма отрезков, и корабль встаёт точно у новой цели, без скачка в точке поворота
  function kneeOf() {
    const k = world.knee; if (!k) return null;
    const st = stars.find(x => x.name === k.from); if (!st) return null;
    const start = E0.clone().addScaledVector(EARTH_OFF, -1 / LY), u0 = new THREE.Vector3(st.x, st.y, st.z).normalize();
    const P = start.clone().addScaledVector(u0, k.x), w = T.clone().sub(P);
    return { start, u0, P, u1: w.clone().normalize(), x: k.x, D: k.x + w.length() };
  }
  // точка пути на расстоянии dist св. лет от старта: прямая к цели или ломаная после поворота
  function pathPoint(dist) {
    const K = kneeOf();
    if (!K) return E0.clone().addScaledVector(EARTH_OFF, -1 / LY).addScaledVector(U, dist);
    return dist <= K.x ? K.start.clone().addScaledVector(K.u0, dist) : K.P.clone().addScaledVector(K.u1, dist - K.x);
  }
  function distLyRaw(y) {
    const b = world.beta || 0.1, A = world.arrive, tm = world.tMag;
    if (y <= 8) return b / 16 * y * y;
    if (!A) return b * 4 + b * (y - 8);
    const K = kneeOf(), D = K ? K.D : T.clone().sub(E0).addScaledVector(EARTH_OFF, 1 / LY).dot(U);
    if (tm == null) {
      const t0 = A - 20;
      if (y <= t0) return b * 4 + b * (y - 8) + (D - 10 * b - b * (t0 - 4)) * (y - 8) / Math.max(1, t0 - 8);
      const tau = Math.min(y, A) - t0;
      return D - b / 40 * (20 - tau) ** 2;
    }
    const tE = A - 4, t0 = tE - tm, Dm = (b + 0.01) / 2 * tm, x0 = D - Dm - 0.02;
    if (y <= t0) return b * 4 + b * (y - 8) + (x0 - b * 4 - b * (t0 - 8)) * (y - 8) / Math.max(1, t0 - 8);
    if (y <= tE) { const tau = y - t0; return x0 + b * tau - (b - 0.01) / (2 * tm) * tau * tau; }
    const tau = Math.min(y, A) - tE;
    return x0 + Dm + 0.01 * tau - 0.01 / 8 * tau * tau;
  }

  let renderer, starScene, shipScene, starCam, shipCam, container, labelsEl, barEl;
  let sunLight, rim, cloudGroup, scoutMark, sectorMarks, distRings = [];
  let distress, shell, incMark, baseMarks = [], rescueLines = [], rescueMarks = [], voyKey = '';
  let colonyMarks, legacyMarks, legacyKey = '';                                  // колонии и следы по архиву Кольца; наследие прошлых партий   // карта сигнала бедствия (партия спасателей)
  let reqMarks, reqKey = '', reqTex = null, catalogPts, targetMark, ship, stage, rings = [], plume, radMat, marker, routeDone, routeAhead, relGroup, starsGroup;
  let visible = false, lang = 'ru', shown = false;   // shown: хоть один кадр уже был на экране
  const world = { relief: null, legacy: null, tMag: null, anim: null, year: 0, worldClass: null, cloudSeen: false, separated: false, burning: true, finalBurn: false, sepT: 0, atEarth: true, scout: 0, scoutV: 0.16, beta: 0.1, arrive: 0, cargo: [], cargoLabels: false };
  const cam = { focus: 'ship', F: new THREE.Vector3(), dist: 4500, yaw: 2.4, pitch: 0.25, pivot: -1400 };
  let tween = null;

  // ---------------------------------------------------------------- корабль
  const M = {};
  function mats() {
    M.hull = new THREE.MeshStandardMaterial({ color: 0xd9d3c6, roughness: 0.55, metalness: 0.05 });
    M.shield = new THREE.MeshStandardMaterial({ color: 0xbdbdbd, roughness: 0.7 });
    M.tank = new THREE.MeshStandardMaterial({ color: 0xa3adb8, roughness: 0.35, metalness: 0.6 });
    M.drop = new THREE.MeshStandardMaterial({ color: 0x86909b, roughness: 0.4, metalness: 0.6 });
    M.truss = new THREE.MeshStandardMaterial({ color: 0x3b3d42, roughness: 0.5, metalness: 0.7 });
    M.copper = new THREE.MeshStandardMaterial({ color: 0xb87350, roughness: 0.3, metalness: 0.9 });
    M.gold = new THREE.MeshStandardMaterial({ color: 0xd8ad5c, roughness: 0.25, metalness: 0.95 });
    radMat = new THREE.MeshStandardMaterial({ color: 0x0b0b0d, roughness: 0.8, metalness: 0.1, emissive: 0x5a1406, emissiveIntensity: 0.35 });
    M.rad = radMat;
    // панели щита (шаг 6): тот же цвет; заменённая — светлее; выбранная — с подсветкой; слои пакета — оттенки серого
    M.panel = M.shield.clone(); M.panel.side = THREE.DoubleSide;
    M.panelNew = M.panel.clone(); M.panelNew.color.set(0xdcdcd6);
    M.panelSel = M.panel.clone(); M.panelSel.color.set(0xd9a24a); M.panelSel.emissive.set(0x2a1704);
    M.layers = [0x8d8a84, 0x5f6266, 0x9aa3a8].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8, side: THREE.DoubleSide }));
  }
  function add(parent, geo, mat, fn) { const m = new THREE.Mesh(geo, mat); if (fn) fn(m); parent.add(m); return m; }
  function cylX(p, x0, x1, r, mat, y = 0, z = 0, seg = 40) {
    return add(p, new THREE.CylinderGeometry(r, r, Math.abs(x1 - x0), seg), mat, m => { m.rotation.z = -Math.PI / 2; m.position.set((x0 + x1) / 2, y, z); });
  }
  function coneX(p, xb, xf, rb, rf, mat, open = false) {
    return add(p, new THREE.CylinderGeometry(rf, rb, Math.abs(xf - xb), 64, 1, open), mat, m => { m.rotation.z = -Math.PI / 2; m.position.set((xb + xf) / 2, 0, 0); });
  }
  function torusX(p, x, R, r, mat, seg = 128) {
    return add(p, new THREE.TorusGeometry(R, r, 14, seg), mat, m => { m.rotation.y = Math.PI / 2; m.position.set(x, 0, 0); });
  }
  function sphere(p, x, y, z, r, mat) {
    return add(p, new THREE.SphereGeometry(r, 28, 18), mat, m => m.position.set(x, y, z));
  }
  function spoke(p, x, r0, r1, a, rad, mat) {
    const mid = (r0 + r1) / 2;
    return add(p, new THREE.CylinderGeometry(rad, rad, r1 - r0, 10), mat, m => { m.rotation.x = a; m.position.set(x, mid * Math.cos(a), mid * Math.sin(a)); });
  }
  function fin(p, x0, x1, r0, r1, a, mat) {
    const mid = (r0 + r1) / 2;
    return add(p, new THREE.BoxGeometry(Math.abs(x1 - x0), r1 - r0, 1.5), mat, m => { m.rotation.x = a; m.position.set((x0 + x1) / 2, mid * Math.cos(a), mid * Math.sin(a)); });
  }
  function tankRings(p, x, n, d, rc, mat) {
    const rings_ = n / 4;
    for (let i = 0; i < rings_; i++) {
      const cx = x - d / 2 - i * (d + 8);
      for (let j = 0; j < 4; j++) {
        const a = Math.PI / 2 * j + (i % 2 ? Math.PI / 4 : 0);
        sphere(p, cx, rc * Math.cos(a), rc * Math.sin(a), d / 2, mat);
      }
    }
    const len = rings_ * (d + 8);
    cylX(p, x, x - len, 10, M.truss, 0, 0, 16);
    return x - len;
  }
  function fusionEngine(p, x, r) {
    // раструб полый: без крышки на срезе, внутренняя поверхность видна — внутри горит плазма
    if (!M.nozzle) M.nozzle = Object.assign(M.copper.clone(), { side: THREE.DoubleSide });
    coneX(p, x - r * 1.1, x, r, r * 0.25, M.nozzle, true);
    torusX(p, x - r * 1.1, r, r * 0.07, M.gold, 96);
    engines.push(engineGlow(p, x - r * 1.1, r));
    return x - r * 1.2;
  }
  // Свечение импульсного термояда: раскалённый срез сопла, горло, гало и голубой свет на корпус.
  const engines = [];
  let glowTex;
  // свечение с экспоненциальным спадом (как рассеяние в оптике): a(d) = e^(−d/r0) + w·e^(−d/r1), d — доля радиуса;
  // у края спрайта плавно в ноль. col — RGB центра и хвоста
  function expGlowCanvas(size, r0, r1, w, c0, c1) {
    const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d'), im = g.createImageData(size, size), h = size / 2;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const d = Math.hypot(x + 0.5 - h, y + 0.5 - h) / h, edge = d >= 1 ? 0 : 1 - Math.pow(Math.max(0, (d - 0.8) / 0.2), 2) * (3 - 2 * Math.max(0, (d - 0.8) / 0.2));
      const core = Math.exp(-d / r0), tail = w * Math.exp(-d / r1), a = Math.min(1, core + tail) * edge, m = core / Math.max(1e-6, core + tail), i = (y * size + x) * 4;
      for (let k = 0; k < 3; k++) im.data[i + k] = Math.round(c1[k] + (c0[k] - c1[k]) * m);
      im.data[i + 3] = Math.round(255 * a);
    }
    g.putImageData(im, 0, 0); return c;
  }
  function engineGlow(p, xe, r) {
    if (!glowTex) glowTex = new THREE.CanvasTexture(expGlowCanvas(256, 0.09, 0.32, 0.18, [235, 248, 255], [60, 120, 255]));
    const grp = new THREE.Group();
    const discMat = new THREE.ShaderMaterial({
      uniforms: { a: { value: 0 } },
      vertexShader: `#include <common>
        #include <logdepthbuf_pars_vertex>
        varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        #include <logdepthbuf_vertex>
        }`,
      fragmentShader: `#include <logdepthbuf_pars_fragment>
        uniform float a; varying vec2 vP;
        void main(){
          #include <logdepthbuf_fragment>
          float d = length(vP) / ${(r * 0.93).toFixed(2)};
          vec3 col = mix(vec3(0.32, 0.72, 1.0), vec3(0.04, 0.2, 0.85), smoothstep(0.0, 0.95, d)) * (0.9 + 0.25 * (1.0 - d));
          gl_FragColor = vec4(col, a);                                   // закрывает медный раструб, пока горит
        }`,
      transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false
    });
    const disc = new THREE.Mesh(new THREE.CircleGeometry(r * 0.93, 64), discMat);
    disc.rotation.y = -Math.PI / 2; disc.position.x = xe + r * 0.12;
    const throat = new THREE.Mesh(new THREE.CircleGeometry(r * 0.3, 32), discMat);
    throat.rotation.y = -Math.PI / 2; throat.position.x = xe + r * 0.8;
    const sprite = k => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffffff, transparent: true,
      depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); sp.scale.set(r * k, r * k, 1); sp.position.x = xe - r * 0.35; return sp; };
    const core = sprite(2.2), halo = sprite(10);
    core.material.color.set(0x3f8cff); halo.material.color.set(0x2f6dff);
    const light = new THREE.PointLight(0x5fa8ff, 0, r * 70, 1); light.position.x = xe - r * 4;
    grp.add(disc, throat, core, halo, light); p.add(grp);
    return { discMat, core, halo, light, r, a: 0, on: false };
  }
  function stepEngines(dt, now) {
    for (const e of engines) {
      e.a += ((e.on ? 1 : 0) - e.a) * (1 - Math.exp(-dt * 2.2));              // разгорается и гаснет плавно
      const a = e.a;                                                          // ровное свечение: 250 Гц глаз не различает
      e.discMat.uniforms.a.value = a;
      e.core.material.opacity = 0.3 * a; e.halo.material.opacity = 0.38 * a;              // ореол приглушён: ярче всего — блики
      e.core.visible = e.halo.visible = a > 0.01;
      e.light.intensity = 1.1 * a;
    }
  }

  function buildShip() {
    ship = new THREE.Group();
    // ядро: щит, кольца, анабиоз, трюм, посадочные аппараты, катушка магнитного паруса
    buildShield();
    cylX(ship, -20, -350, 20, M.hull);
    [-95, -165].forEach((x, k) => {
      const g = new THREE.Group(); g.position.x = x;
      torusX(g, 0, 150, 12, M.hull, 160);
      cylX(g, 12, -12, 32, M.hull);
      for (let s = 0; s < 6; s++) spoke(g, 0, 32, 139, 2 * Math.PI * s / 6 + k * Math.PI / 6, 3.2, M.truss);
      g.userData.dir = k ? -1 : 1;           // кольца вращаются навстречу друг другу
      ship.add(g); rings.push(g);
    });
    cylX(ship, -205, -280, 36, M.hull);
    torusX(ship, -205, 36, 3, M.shield, 64); torusX(ship, -280, 36, 3, M.shield, 64);
    cylX(ship, -290, -345, 30, M.shield);
    for (let s = 0; s < 4; s++) {
      const a = Math.PI / 4 + s * Math.PI / 2, y = 44 * Math.cos(a), z = 44 * Math.sin(a);
      cylX(ship, -295, -330, 7, M.hull, y, z, 20);
      add(ship, new THREE.CylinderGeometry(1.5, 7, 14, 20), M.hull, m => { m.rotation.z = -Math.PI / 2; m.position.set(-288, y, z); });
    }
    cylX(ship, -350, -380, 26, M.gold);
    torusX(ship, -365, 46, 5, M.gold, 64);
    // ступень торможения
    let x = tankRings(ship, -390, 4, 51.747, 38.712, M.tank);
    x = fusionEngine(ship, x - 5, 26);
    // ступень разгона — отдельная группа, отделяется в год 8
    stage = new THREE.Group();
    const xs = x - 30;
    cylX(stage, x, xs, 6, M.truss, 0, 0, 12);
    x = tankRings(stage, xs, 16, 121.892, 88.312, M.drop);
    const L = 1863.3;
    cylX(stage, x, x - L - 20, 10, M.truss, 0, 0, 16);
    for (let k = 0; k < 4; k++) fin(stage, x - 10, x - 10 - L, 12, 154, Math.PI / 4 + k * Math.PI / 2, M.rad);
    x -= L + 20;
    const xe = x;
    fusionEngine(stage, x, 70);
    plume = add(stage, new THREE.CylinderGeometry(45, 380, 2600, 48, 1, true), new THREE.ShaderMaterial({
      uniforms: { color: { value: new THREE.Color(0.45, 0.72, 1.0) }, strength: { value: 0.7 } },
      vertexShader: `#include <common>
        #include <logdepthbuf_pars_vertex>
        varying vec2 vUv; varying vec3 vN; varying vec3 vV;
        void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
          #include <logdepthbuf_vertex>
        }`,
      fragmentShader: `#include <logdepthbuf_pars_fragment>
        uniform vec3 color; uniform float strength; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
        void main(){
          #include <logdepthbuf_fragment>
          float edge = pow(abs(dot(vN, vV)), 1.5);
          float a = pow(vUv.y, 3.0) * edge * strength;
          gl_FragColor = vec4(color * a, a);
        }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide
    }), m => { m.rotation.z = -Math.PI / 2; m.position.set(xe - 1300, 0, 0); });
    { const box = new THREE.Box3(); ship.children.forEach(c => box.expandByObject(c)); if (isFinite(box.min.x)) SHIP_STERN = box.min.x; }   // корма ядра — для тени пыли
    ship.add(stage);
    ship.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), U);
    shipQTo.copy(ship.quaternion); shipQBase.copy(ship.quaternion); rotQ.to.copy(ship.quaternion);
    shipScene.add(ship);
  }

  // ---------------------------------------------------------------- щит: 64 панели и нос H0 (осмотр, шаг 6)
  // Та же поверхность, что у прежнего конуса (x = −28 у кромки r = 172, x = 0 у носа r = 18); радиусы модели щита
  // (shield.js: 18/60/105/142/175) ложатся на неё как r3 = 18 + (r − 18)·154/157 — нос остаётся 18 м. Швы — зазор 0,8 м
  // над тёмной подложкой. Сектор k — центр 2πk/16 по часовой, если смотреть спереди (локальная +y — верх):
  // (y, z) = (r·cos θ, −r·sin θ). Отметки повреждений — условные: размер и место (центр панели) не масштабные.
  const SHG = { R3: r => 18 + (r - 18) * 154 / 157, X: r3 => -28 * (r3 - 18) / 154, K: 28 / 154, GAP: 0.4, SLIDE: 6 };
  const shieldUI = { g: null, panels: {}, marks: [], pack: null, packFor: null, slides: {}, key: '', on: false, k: 0, lamp: null, focus: null, focusT: null, roll: null };
  const panelNormal = th => new THREE.Vector3(1, SHG.K * Math.cos(th), -SHG.K * Math.sin(th)).normalize();
  function panelGeo(r0, r1, k) {
    const a0 = 2 * Math.PI * (k - 0.5) / 16, a1 = 2 * Math.PI * (k + 0.5) / 16, NR = 3, NT = 8, pos = [], idx = [];
    const R0 = SHG.R3(r0) + SHG.GAP, R1 = SHG.R3(r1) - SHG.GAP;
    for (let i = 0; i <= NR; i++) {
      const r = R0 + (R1 - R0) * i / NR, d = SHG.GAP / r;
      for (let j = 0; j <= NT; j++) { const th = a0 + d + (a1 - a0 - 2 * d) * j / NT; pos.push(SHG.X(r), r * Math.cos(th), -r * Math.sin(th)); }
    }
    for (let i = 0; i < NR; i++) for (let j = 0; j < NT; j++) { const a = i * (NT + 1) + j, b = a + NT + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    return g;
  }
  function buildShield() {
    const g = new THREE.Group(); shieldUI.g = g; ship.add(g);
    const SHP = window.M31Shield ? M31Shield.PANELS : [];
    if (!SHP.length) { coneX(g, -28, 0, 172, 18, M.shield); return; }             // без модели щита — прежний конус
    coneX(g, -29.2, -1.2, 172, 18, M.truss);                                       // подложка: швы между панелями — тёмные
    for (const p of SHP) {
      let geo, c, n;
      if (!p.belt) { geo = new THREE.CircleGeometry(18 - SHG.GAP, 48); geo.rotateY(Math.PI / 2); c = new THREE.Vector3(0, 0, 0); n = new THREE.Vector3(1, 0, 0); }
      else {
        const th = 2 * Math.PI * p.az / 16, rc = SHG.R3((p.r0 + p.r1) / 2);
        geo = panelGeo(p.r0, p.r1, p.az); c = new THREE.Vector3(SHG.X(rc), rc * Math.cos(th), -rc * Math.sin(th)); n = panelNormal(th);
      }
      const m = add(g, geo, M.panel); m.userData = { panel: p.id, c, n }; shieldUI.panels[p.id] = m;
    }
  }
  // отметки по наблюдаемому состоянию (world.shield — publicView модели; только правила v5): пятно и контур в центре панели
  const MARK = { scarred: [0x3a3a3a, 0xd6b45a], breached: [0x050505, 0xff6a1a], patched: [0xe8e2d0, 0x8fc8ff] };
  const Z1 = new THREE.Vector3(0, 0, 1), qInvTmp = new THREE.Quaternion();
  function updateShieldMarks() {
    const V = world.shield, key = V ? V.panels.map(p => p.state).join(',') + '|' + (world.shieldSel || '') : '';
    if (key === shieldUI.key) return; shieldUI.key = key;
    for (const o of shieldUI.marks) { o.parent.remove(o); o.geometry.dispose(); o.material.dispose(); }
    shieldUI.marks = [];
    for (const [id, m] of Object.entries(shieldUI.panels)) m.material = id === world.shieldSel && V ? M.panelSel : M.panel;
    if (!V) return;
    for (const p of V.panels) {
      const m = shieldUI.panels[p.id]; if (!m) continue;
      if (p.state === 'new' && p.id !== world.shieldSel) m.material = M.panelNew;
      const col = MARK[p.state]; if (!col) continue;
      const { c, n } = m.userData, q = new THREE.Quaternion().setFromUnitVectors(Z1, n), at = c.clone().addScaledVector(n, 0.6);
      const spot = new THREE.Mesh(new THREE.CircleGeometry(3, 24), new THREE.MeshBasicMaterial({ color: col[0], side: THREE.DoubleSide }));
      const ring = new THREE.Mesh(new THREE.RingGeometry(3.2, 4.1, 32), new THREE.MeshBasicMaterial({ color: col[1], side: THREE.DoubleSide }));
      for (const o of [spot, ring]) { o.position.copy(at); o.quaternion.copy(q); o.userData.panel = p.id; m.add(o); shieldUI.marks.push(o); }
    }
  }
  // выбранная панель выдвигается на 6 м по нормали за 0,6 с; за ней — условный пакет из трёх слоёв
  function stepShield(dt) {
    if (!shieldUI.g || !Object.keys(shieldUI.panels).length) return;
    updateShieldMarks();
    // раскладка панелей повёрнута вокруг оси щита так, чтобы сектор 00 был вверху кадра (верх — E3), как на схеме;
    // щит осесимметричен — меняется только нумерация. После разворота кормой вперёд раскладка поворачивается с кораблём
    const lu = E3.clone().applyQuaternion(qInvTmp.copy(ship.quaternion).invert());
    if (Math.hypot(lu.y, lu.z) > 1e-6) {
      const want = Math.atan2(lu.z, lu.y);
      shieldUI.roll = shieldUI.roll == null ? want : shieldUI.roll + wrapPi(want - shieldUI.roll) * (1 - Math.exp(-dt * 2));
      shieldUI.g.rotation.x = shieldUI.roll;
    }
    // осмотр включается и гаснет плавно: прожектор с камеры (у Тёмной звезды света почти нет) и сдвиг кадра
    const on = shieldUI.on && cam.focus === 'ship' ? 1 : 0;
    shieldUI.k += (on - shieldUI.k) * (1 - Math.exp(-dt * 2));
    if (!shieldUI.lamp) { shieldUI.lamp = new THREE.DirectionalLight(0xfff1dc, 0); shipScene.add(shieldUI.lamp, shieldUI.lamp.target); }
    shieldUI.lamp.intensity = 2.1 * shieldUI.k; shieldUI.lamp.visible = shieldUI.k > 0.01;
    if (shieldUI.lamp.visible) { shieldUI.lamp.position.copy(shipCam.position); shieldUI.g.getWorldPosition(shieldUI.lamp.target.position); }
    if (shieldUI.focusT) {                                                    // точка сдвига кадра — плавно (смена раскладки, размер окна)
      if (!shieldUI.focus || shieldUI.k < 0.01) shieldUI.focus = Object.assign({}, shieldUI.focusT);
      else { const kk = 1 - Math.exp(-dt * 3); shieldUI.focus.x += (shieldUI.focusT.x - shieldUI.focus.x) * kk; shieldUI.focus.y += (shieldUI.focusT.y - shieldUI.focus.y) * kk; }
    }
    const sel = shieldUI.on && world.shield ? world.shieldSel : null;
    if (sel && !(sel in shieldUI.slides)) shieldUI.slides[sel] = 0;
    for (const id of Object.keys(shieldUI.slides)) {
      const m = shieldUI.panels[id]; if (!m) { delete shieldUI.slides[id]; continue; }
      const want = id === sel ? 1 : 0, v = shieldUI.slides[id] = Math.max(0, Math.min(1, shieldUI.slides[id] + Math.sign(want - shieldUI.slides[id]) * dt / 0.6));
      const e = v * v * (3 - 2 * v);
      m.position.copy(m.userData.n).multiplyScalar(SHG.SLIDE * e);
      if (id === shieldUI.packFor && shieldUI.pack) shieldUI.pack.children.forEach((l, k) => l.position.copy(m.userData.n).multiplyScalar(SHG.SLIDE * e * (k + 1) / 4));
      if (!want && v === 0) delete shieldUI.slides[id];
    }
    if (sel !== shieldUI.packFor) {                                                 // пакет слоёв — за выбранной панелью
      if (shieldUI.pack) { shieldUI.g.remove(shieldUI.pack); shieldUI.pack = null; }
      shieldUI.packFor = sel;
      if (sel && shieldUI.panels[sel]) { const P = new THREE.Group(); M.layers.forEach(mt => P.add(new THREE.Mesh(shieldUI.panels[sel].geometry, mt))); shieldUI.pack = P; shieldUI.g.add(P); }
    }
    if (shieldUI.pack) shieldUI.pack.visible = (shieldUI.slides[shieldUI.packFor] || 0) > 0.02;
  }
  // ракурс осмотра: по фактической нормали щита (после разворота кормой вперёд щит смотрит назад)
  function shieldAngles() {
    const a = frameAngles(new THREE.Vector3(1, 0, 0).applyQuaternion(ship.quaternion));
    return { yaw: a.yaw + 0.35, pitch: Math.max(-1.45, Math.min(1.45, a.pitch + 0.22)) };
  }

  // ---------------------------------------------------------------- пыль вокруг корабля: стоит он или летит
  // Условность, не масштаб: на 0,01–0,1c настоящие пылинки пролетают тысячи километров за кадр. Частицы — в кубе вокруг
  // точки взгляда (сторона — три дистанции камеры: плотность в кадре не зависит от приближения), неподвижном в осях
  // курса; летят против курса и вытягиваются в штрихи по скорости: стоит — их нет, малый ход — короткие чёрточки,
  // крейсерская — длинные линии. У граней куба частица гаснет, поэтому переход через грань не виден.
  const STREAK_N = 220;
  // тень корабля: пыль упирается в передний торец (щит, после разворота — корму) и за ним, внутри радиуса щита, не летит
  const STREAK_R = 176, shipAxisW = new THREE.Vector3();
  let SHIP_STERN = -430;                                                  // корма ядра (без ступени разгона), локальная x
  const streaks = { mesh: null, f: null, a: 0, S: 0 };
  function buildStreaks() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(STREAK_N * 6), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(STREAK_N * 6), 3));
    const m = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.frustumCulled = false; m.visible = false; shipScene.add(m);
    const r = mulberry(4141);
    streaks.f = Float32Array.from({ length: STREAK_N * 3 }, () => r());     // положения — доли куба по осям U, E2, E3
    streaks.mesh = m;
  }
  // Показ перемотки: год идёт быстрее — пыль летит быстрее и тянется длиннее. Скорость года сглажена (часы интерфейса
  // и кадры 3D идут в разных вызовах); вне показа (world.anim нет) — ноль: скачок года при смене экрана не в счёт.
  const yRate = { y: NaN, v: 0 };
  function stepTimeRate(dt) {
    const y = world.year, v = world.anim && Number.isFinite(yRate.y) && dt > 0 ? Math.max(0, (y - yRate.y) / dt) : 0;
    yRate.y = y; yRate.v += (v - yRate.v) * (1 - Math.exp(-dt * 4));
  }
  const timeBoost = () => 1 + Math.min(5, 1.1 * Math.log10(1 + yRate.v * 365.25));   // по дням в секунду: 30 — ×2,6, 2000 — ×4,6
  const camOff = new THREE.Vector3(), glareDirS = new THREE.Vector3(), glareDirT = new THREE.Vector3();
  function stepStreaks(dt, look, camPos, dS) {
    if (!streaks.mesh) return;
    const beta = Math.max(0, MI && world.arrive ? MI.speedAt(world.year, world.beta || 0.1, world.arrive, world.tMag)
      : MI ? MI.speedAt(world.year, world.beta || 0.1, 0, world.tMag) : 0);
    // видимость: стоит — 0; появляется с первых сотен км/с, плавно (без скачка при смене скорости промоткой)
    // с удалением камеры пыль гаснет только в маршрутных видах (0,2–2 млн км): на виде сбоку на пузырь магнита
    // (десятки тысяч км) штрихи видны — по ним понятно, что корабль летит; без обрыва на пороге
    const fz = Math.min(1, Math.max(0, Math.log(dS / 2e8) / Math.log(10))), farK = 1 - fz * fz * (3 - 2 * fz);
    const want = world.wreck ? 0 : Math.min(1, Math.sqrt(beta / 0.003)) * (1 - 0.6 * shieldUI.k) * farK;
    streaks.a += (want - streaks.a) * (1 - Math.exp(-dt * 1.5));
    streaks.mesh.visible = streaks.a > 0.004;
    if (!streaks.mesh.visible) return;
    const q = Math.min(1.2, beta / 0.1), sq = Math.sqrt(q);
    const S = streaks.S = streaks.S ? streaks.S + (3 * dS - streaks.S) * (1 - Math.exp(-dt * 3)) : 3 * dS;
    const boost = timeBoost();
    const flow = (0.05 + 0.3 * sq) * dt * boost;                            // доля куба за кадр: на крейсерской — куб за ~3 с, при перемотке — быстрее
    const L = S * (0.006 + 0.11 * sq) * Math.sqrt(boost);                   // длина штриха
    const pos = streaks.mesh.geometry.attributes.position.array, col = streaks.mesh.geometry.attributes.color.array, f = streaks.f;
    const near = 0.08 * S, far = 0.55 * S;
    const front = shipAxisW.set(1, 0, 0).applyQuaternion(ship.quaternion).dot(U) >= 0 ? shipLocal(0) : shipLocal(SHIP_STERN);
    for (let i = 0; i < STREAK_N; i++) {
      let u = f[3 * i] - flow; u -= Math.floor(u); f[3 * i] = u;          // против курса, с переносом через грань
      const v = f[3 * i + 1], w = f[3 * i + 2];
      const x = look.x + (u - 0.5) * S * U.x + (v - 0.5) * S * E2.x + (w - 0.5) * S * E3.x;
      const y = look.y + (u - 0.5) * S * U.y + (v - 0.5) * S * E2.y + (w - 0.5) * S * E3.y;
      const z = look.z + (u - 0.5) * S * U.z + (v - 0.5) * S * E2.z + (w - 0.5) * S * E3.z;
      // гаснет у граней куба и у самой камеры
      const edge = 16 * u * (1 - u) * v * (1 - v) * Math.min(1, 4 * w * (1 - w) * 1.4);
      const d = Math.hypot(x - camPos.x, y - camPos.y, z - camPos.z), fade = Math.min(1, Math.max(0, (d - near) / near)) * Math.max(0, 1 - d / far / 1.6);
      let k = Math.max(0, Math.min(1, edge)) * fade * streaks.a, cut = 0;
      // за передним торцом корабля, в цилиндре радиуса щита — тень: штрих обрезан плоскостью торца или скрыт
      const rx = x - front.x, ry = y - front.y, rz = z - front.z, a = rx * U.x + ry * U.y + rz * U.z;
      if (a < 0 && rx * rx + ry * ry + rz * rz - a * a < STREAK_R * STREAK_R) { if (a + L <= 0) k = 0; else cut = -a; }
      const j = 6 * i;
      pos[j] = x + U.x * cut; pos[j + 1] = y + U.y * cut; pos[j + 2] = z + U.z * cut;   // голова — по ходу пыли (назад по курсу)
      pos[j + 3] = x + U.x * L; pos[j + 4] = y + U.y * L; pos[j + 5] = z + U.z * L;   // хвост — туда, откуда она летит
      col[j] = 0.42 * k; col[j + 1] = 0.49 * k; col[j + 2] = 0.58 * k;
      col[j + 3] = 0; col[j + 4] = 0; col[j + 5] = 0;
    }
    streaks.mesh.geometry.attributes.position.needsUpdate = true; streaks.mesh.geometry.attributes.color.needsUpdate = true;
  }

  // ---------------------------------------------------------------- груз по паспорту (болванки)
  // Всё в тени фронтального щита (радиус 172 м). Комплекты видны по world.cargo.
  const cargo = {};
  function buildCargo() {
    const crate = new THREE.MeshStandardMaterial({ color: 0x9d9282, roughness: 0.85 });
    const lander = new THREE.MeshStandardMaterial({ color: 0xd8d0c0, roughness: 0.45, metalness: 0.15 });
    const green = new THREE.MeshStandardMaterial({ color: 0x4d6a45, roughness: 0.6, emissive: 0x3c8a34, emissiveIntensity: 0.55 });
    const scope = new THREE.MeshStandardMaterial({ color: 0x20252b, roughness: 0.35, metalness: 0.7 });
    const radial = (g, geo, mat, x, r, a) => add(g, geo, mat, m => { m.position.set(x, r * Math.cos(a), r * Math.sin(a)); m.rotation.x = a; });
    const group = (k, anchor) => { const g = new THREE.Group(); g.userData.anchor = anchor; g.visible = false; ship.add(g); cargo[k] = g; return g; };

    // материалы и запчасти, 10 тыс. т: пояс контейнеров сразу за щитом — масса заодно прикрывает кольца
    const m = group('materials', new THREE.Vector3(-54, 0, 112));
    for (let l = 0; l < 2; l++) for (let i = 0; i < 12; i++) {
      const a = (i + l * 0.5) / 12 * Math.PI * 2;
      radial(m, new THREE.BoxGeometry(20, 26, 24), crate, -42 - l * 24, 64 + l * 18, a);
    }
    // расширенная посадка, 15 тыс. т: шесть крупных посадочных модулей вокруг зала анабиоза
    const L = group('landing', new THREE.Vector3(-240, 0, -122));
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2 + Math.PI / 6, y = 96 * Math.cos(a), z = 96 * Math.sin(a);
      cylX(L, -214, -262, 13, lander, y, z, 24);
      add(L, new THREE.CylinderGeometry(3, 13, 18, 24), lander, q => { q.rotation.z = -Math.PI / 2; q.position.set(-205, y, z); });
      cylX(L, -262, -270, 9, scope, y, z, 16);
    }
    // два зонда-разведчика, 3 тыс. т: у кормы, рядом с катушкой паруса
    const P = group('probes', new THREE.Vector3(-365, 0, 88));
    [0, Math.PI].forEach((a, i) => {
      const y = 66 * Math.cos(a + Math.PI / 2), z = 66 * Math.sin(a + Math.PI / 2), pr = new THREE.Group();
      cylX(pr, -352, -384, 3.4, M.copper, y, z, 16);
      add(pr, new THREE.CylinderGeometry(0.2, 3.4, 11, 16), M.copper, q => { q.rotation.z = -Math.PI / 2; q.position.set(-346.5, y, z); });
      add(pr, new THREE.CylinderGeometry(7, 7, 0.8, 24), M.gold, q => { q.rotation.z = -Math.PI / 2; q.position.set(-386, y, z); });
      pr.userData.i = i; P.add(pr);
    });
    // инфракрасная обсерватория, 2 тыс. т: телескоп на штанге с солнцезащитным диском
    const I = group('ir', new THREE.Vector3(-240, 0, 172));
    const ia = Math.PI / 2;
    radial(I, new THREE.CylinderGeometry(2, 2, 100, 8), M.truss, -240, 80, ia);
    radial(I, new THREE.CylinderGeometry(8, 8, 30, 24), scope, -240, 150, ia);
    radial(I, new THREE.CylinderGeometry(16, 16, 1.2, 32), M.gold, -240, 134, ia);
    // второй агромодуль, 5 тыс. т: между задним кольцом и залом анабиоза
    const A = group('agro', new THREE.Vector3(-192, 0, -70));
    cylX(A, -181, -203, 50, green, 0, 0, 48);
    torusX(A, -192, 50, 2.5, M.gold, 64);
  }
  function applyCargo() {
    const kits = world.cargo || [];
    for (const [k, g] of Object.entries(cargo)) g.visible = kits.includes(k);
    // выпущенный зонд из комплекта уходит вперёд — на корабле остаётся один
    if (cargo.probes) {
      const gone = world.scout > 0 && world.year >= world.scout ? 1 : 0;
      cargo.probes.children.forEach(pr => { pr.visible = pr.userData.i >= gone; });
    }
  }

  // ---------------------------------------------------------------- Земля
  let earth;
  const EARTH_OFF = new THREE.Vector3();
  function earthPos() {
    return U.clone().multiplyScalar(0.44).add(E2.clone().multiplyScalar(-0.85)).add(E3.clone().multiplyScalar(-0.5)).normalize().multiplyScalar(4.2e7);
  }
  // Земля по картам Video Copilot (6K, без пережатия): день, облака, огни, маска воды, рельеф.
  // Атмосфера — однократное рассеяние Рэлея и Ми, считается в радиусах Земли (точность float).
  const EARTH_R = 6.371e6;
  let earthTilt, earthSpin, cloudMesh, atmoMesh;
  const earthU = { sunDir: { value: new THREE.Vector3(1, 0, 0) }, lightCol: { value: new THREE.Color(1, 1, 1) },
    look: { value: new THREE.Vector4(1.7, 1, 350, 1) }, haze: { value: 1 } };
  function earthTex(name, srgb, dir = 'earth') {
    const t = new THREE.TextureLoader().load(`assets/${dir}/${name}.jpg`, tex => { if (renderer.initTexture) renderer.initTexture(tex); });
    t.encoding = srgb ? THREE.sRGBEncoding : THREE.LinearEncoding;
    t.wrapS = THREE.RepeatWrapping;                                  // по долготе карта замкнута: сдвиг облаков идёт через шов
    t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    return t;
  }
  // Планета по картам: поверхность с рельефом и бликом воды, облака, атмосфера (однократное рассеяние).
  // Земля и мир у цели — одни шейдеры; различаются карты, направление на звезду и цвет её света.
  function buildWorld(dir, R, U0) {
    const day = earthTex('day', true, dir), night = earthTex('night', true, dir), cl = earthTex('clouds', false, dir),
      gloss = earthTex('gloss', false, dir), nrm = earthTex('normal', false, dir);
    let earth, cloudMesh, atmoMesh;
    const vs = `#include <common>
      #include <logdepthbuf_pars_vertex>
      varying vec2 vUv; varying vec3 vN; varying vec3 vW; varying vec3 vT;
      void main(){ vUv = uv; vN = normalize(mat3(modelMatrix) * normal);
        vT = normalize(mat3(modelMatrix) * vec3(position.z, 0.0, -position.x));   // касательная вдоль долготы
        vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
        #include <logdepthbuf_vertex>
      }`;
    earth = new THREE.Mesh(new THREE.SphereGeometry(R, 192, 128), new THREE.ShaderMaterial({
      uniforms: { sunDir: U0.sunDir, lightCol: U0.lightCol, dayMap: { value: day }, nightMap: { value: night }, cloudMap: { value: cl },
        glossMap: { value: gloss }, normalMap: { value: nrm }, cloudShift: { value: 0 }, look: U0.look },
      vertexShader: vs,
      fragmentShader: `#include <logdepthbuf_pars_fragment>
        uniform sampler2D dayMap, nightMap, cloudMap, glossMap, normalMap; uniform vec3 sunDir, lightCol; uniform float cloudShift;
        uniform vec4 look;                                            // x — яркость дня, y — блик, z — показатель блика, w — насыщенность
        varying vec2 vUv; varying vec3 vN; varying vec3 vW; varying vec3 vT;
        void main(){
          #include <logdepthbuf_fragment>
          vec3 N0 = normalize(vN), T = normalize(vT - N0 * dot(vT, N0)), B = cross(N0, T);
          vec3 nm = texture2D(normalMap, vUv).xyz * 2.0 - 1.0;
          vec3 N = normalize(T * nm.x * 0.7 + B * nm.y * 0.7 + N0 * max(nm.z, 0.2));
          vec3 L = normalize(sunDir), V = normalize(cameraPosition - vW), H = normalize(L + V);
          float NL0 = dot(N0, L), NL = dot(N, L);
          float c = texture2D(cloudMap, vUv + vec2(cloudShift, 0.0)).r;
          vec3 dayc = texture2D(dayMap, vUv).rgb; dayc = mix(vec3(dot(dayc, vec3(0.3, 0.59, 0.11))), dayc, look.w);
          vec3 col = dayc * smoothstep(-0.04, 0.5, NL) * max(NL + 0.04, 0.0) * look.x * (1.0 - 0.25 * c);
          // солнечный блик только на воде: узкий лепесток, френель к краю диска
          float water = texture2D(glossMap, vUv).r / 0.5;
          float fres = 0.02 + 0.98 * pow(1.0 - max(dot(V, H), 0.0), 5.0);
          col += vec3(1.0, 0.93, 0.8) * pow(max(dot(N0, H), 0.0), look.z) * clamp(water, 0.0, 1.0) * (1.0 - c) * (0.8 + 4.0 * fres) * step(0.0, NL0) * 6.0 * look.y;
          col *= lightCol;                                               // цвет света звезды
          // огни городов на ночной стороне, под облаками тусклее
          float night = 1.0 - smoothstep(-0.10, 0.06, NL0);
          col += texture2D(nightMap, vUv).rgb * night * (1.0 - 0.65 * c) * 1.4;
          gl_FragColor = vec4(col, 1.0);
          #include <tonemapping_fragment>
          #include <encodings_fragment>
        }`
    }));
    // облака — своя сфера на ~20 км выше, чуть быстрее поверхности
    cloudMesh = new THREE.Mesh(new THREE.SphereGeometry(R * 1.003, 192, 128), new THREE.ShaderMaterial({
      uniforms: { sunDir: U0.sunDir, lightCol: U0.lightCol, cloudMap: { value: cl }, cloudShift: earth.material.uniforms.cloudShift },
      vertexShader: vs,
      fragmentShader: `#include <logdepthbuf_pars_fragment>
        uniform sampler2D cloudMap; uniform vec3 sunDir, lightCol; uniform float cloudShift;
        varying vec2 vUv; varying vec3 vN; varying vec3 vW; varying vec3 vT;
        void main(){
          #include <logdepthbuf_fragment>
          float c = pow(smoothstep(0.22, 1.0, texture2D(cloudMap, vUv + vec2(cloudShift, 0.0)).r), 1.4);
          float lit = smoothstep(-0.02, 0.28, dot(normalize(vN), normalize(sunDir)));
          gl_FragColor = vec4(vec3(1.0, 0.99, 0.97) * lightCol * (0.01 + 1.05 * lit), c * 0.85);
          #include <tonemapping_fragment>
          #include <encodings_fragment>
        }`,
      transparent: true, depthWrite: false
    }));
    cloudMesh.renderOrder = 1;
    // атмосфера: передняя сторона оболочки, прибавляется к звёздам и к диску (воздушная перспектива)
    atmoMesh = new THREE.Mesh(new THREE.SphereGeometry(R * 1.025, 160, 96), new THREE.ShaderMaterial({
      uniforms: { sunDir: U0.sunDir, lightCol: U0.lightCol, center: { value: new THREE.Vector3() }, haze: U0.haze },
      vertexShader: vs,
      fragmentShader: `#include <logdepthbuf_pars_fragment>
        uniform vec3 sunDir, lightCol; uniform vec3 center; uniform float haze;
        varying vec2 vUv; varying vec3 vN; varying vec3 vW; varying vec3 vT;
        const float RE = ${R.toFixed(1)}, RA = 1.025;                 // радиусы в долях радиуса Земли
        const vec3 BR = vec3(5.8e-6, 13.5e-6, 33.1e-6);                 // рассеяние Рэлея, 1/м
        const float BM = 21e-6, HR = 8000.0, HM = 1200.0, G = 0.76;    // Ми; высоты однородной атмосферы
        vec2 hit(vec3 o, vec3 d, float r){ float b = dot(o, d), c = dot(o, o) - r * r, h = b * b - c;
          if (h < 0.0) return vec2(1.0, -1.0); h = sqrt(h); return vec2(-b - h, -b + h); }
        void main(){
          #include <logdepthbuf_fragment>
          vec3 o = (cameraPosition - center) / RE, d = normalize(vW - cameraPosition), L = normalize(sunDir);
          vec2 ta = hit(o, d, RA); if (ta.x > ta.y) discard;
          vec2 tg = hit(o, d, 1.0);
          float t0 = max(ta.x, 0.0), t1 = (tg.x < tg.y && tg.x > 0.0) ? tg.x : ta.y;
          const int NV = 10; const int NL = 4;
          float ds = (t1 - t0) / float(NV), odR = 0.0, odM = 0.0; vec3 sR = vec3(0.0), sM = vec3(0.0);
          for (int i = 0; i < NV; i++) {
            vec3 p = o + d * (t0 + ds * (float(i) + 0.5));
            float hm = (length(p) - 1.0) * RE, dR = exp(-hm / HR) * ds * RE, dM = exp(-hm / HM) * ds * RE;
            odR += dR; odM += dM;
            vec2 tl = hit(p, L, RA); vec2 tlg = hit(p, L, 1.0);
            if (tlg.x < tlg.y && tlg.x > 0.0) continue;                 // точка в тени Земли
            float dl = tl.y / float(NL), lR = 0.0, lM = 0.0;
            for (int j = 0; j < NL; j++) { vec3 q = p + L * dl * (float(j) + 0.5); float hq = (length(q) - 1.0) * RE;
              lR += exp(-hq / HR) * dl * RE; lM += exp(-hq / HM) * dl * RE; }
            vec3 tau = BR * (odR + lR) + BM * 1.1 * (odM + lM), T = exp(-tau);
            sR += dR * T; sM += dM * T;
          }
          float mu = dot(d, L), pR = 3.0 / (16.0 * 3.14159) * (1.0 + mu * mu);
          float pM = 3.0 / (8.0 * 3.14159) * ((1.0 - G * G) * (1.0 + mu * mu)) / ((2.0 + G * G) * pow(1.0 + G * G - 2.0 * G * mu, 1.5));
          vec3 col = 26.0 * haze * (sR * BR * pR + sM * BM * pM) * lightCol;
          gl_FragColor = vec4(col, 1.0);
          #include <tonemapping_fragment>
          #include <encodings_fragment>
        }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    }));
    atmoMesh.renderOrder = 2;
    const tilt = new THREE.Group(), spin = new THREE.Group();
    spin.add(earth, cloudMesh); tilt.add(spin, atmoMesh);
    return { surface: earth, clouds: cloudMesh, atmo: atmoMesh, tilt, spin };
  }
  function buildEarth() {
    const w = buildWorld('earth', EARTH_R, earthU);
    earth = w.surface; cloudMesh = w.clouds; atmoMesh = w.atmo; earthTilt = w.tilt; earthSpin = w.spin;
    // ось Земли — «вверх» кадра с наклоном 23°
    earthTilt.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), E3.clone().multiplyScalar(0.92).add(E2.clone().multiplyScalar(0.39)).normalize());
    // орбита ~42 тыс. км от центра Земли; место Земли у корабля в день отлёта
    EARTH_OFF.copy(earthPos());
    earthTilt.position.copy(EARTH_OFF);
    earthTilt.visible = false;
    shipScene.add(earthTilt);
  }
  const SUN_EARTH = new THREE.Vector3(), SUN = new THREE.Vector3(), sunTarget = new THREE.Vector3();
  // направление на Солнце — туда, где оно есть: от корабля к центру Солнечной системы
  function sunDirNow() { return sunTarget.copy(shipPos()).negate().normalize(); }

  // Солнечная система в звёздной сцене: Солнце, планеты без текстур, орбиты, спутники, пояса, гелиопауза
  const COLORS = { 'Меркурий': 0xa39a8f, 'Венера': 0xe8d3a2, 'Земля': 0x6f9fd8, 'Марс': 0xc1673e, 'Юпитер': 0xd6b48a,
    'Сатурн': 0xe3cf9c, 'Уран': 0xa7d9dd, 'Нептун': 0x5b7fd6, 'Плутон': 0xcdb8a4 };
  const EN = { 'Меркурий': 'Mercury', 'Венера': 'Venus', 'Земля': 'Earth', 'Марс': 'Mars', 'Юпитер': 'Jupiter', 'Сатурн': 'Saturn',
    'Уран': 'Uranus', 'Нептун': 'Neptune', 'Плутон': 'Pluto', 'Луна': 'Moon' };
  let solar, solarBodies = [], solarOrbits = [], earthOrbit, beltMat, belts = [], sunGlow;
  const KM_LY = 1000 / LY;
  function buildSolar() {
    solar = new THREE.Group();
    // свет Солнца — только в своей системе (0,02 св. года): почти без затухания внутри, ноль за границей
    const light = new THREE.PointLight(0xfff4e6, 1.6, 0.02, 1e-4); solar.add(light, new THREE.AmbientLight(0x8090a0, 0.12));
    // Солнце: шар в настоящий размер и свечение, видимое с любого расстояния
    solar.add(new THREE.Mesh(new THREE.SphereGeometry(696000 * KM_LY, 48, 32), new THREE.MeshBasicMaterial({ color: 0xfff2d6 })));
    sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTexture(true), color: 0xffe2a8, sizeAttenuation: false, depthWrite: false, transparent: true, blending: THREE.AdditiveBlending }));
    sunGlow.scale.set(0.06, 0.06, 1); solar.add(sunGlow);
    const ecl = [...Array(257)].map((_, k) => k / 256 * Math.PI * 2);
    const ringLine = (r, color, op) => new THREE.Line(new THREE.BufferGeometry().setFromPoints(ecl.map(t => ecl2gal(r * Math.cos(t), r * Math.sin(t), 0))),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: op, depthTest: false }));
    SOLAR.planets.forEach(pl => {
      const col = COLORS[pl.name] || 0xb0b8c0, isEarth = pl.name === 'Земля';
      const orbit = pl.el ? (() => { const k = elements(pl, centuries(0));
          return new THREE.Line(new THREE.BufferGeometry().setFromPoints(ecl.map(E => ecl2gal(...orbitPoint(k, E)).multiplyScalar(AU_LY))),
            new THREE.LineBasicMaterial({ color: isEarth ? 0x8fc3e6 : 0x4d6a78, transparent: true, opacity: isEarth ? 0.95 : 0.45, depthTest: false })); })()
        : ringLine(pl.a * AU_LY, isEarth ? 0x8fc3e6 : 0x4d6a78, isEarth ? 0.95 : 0.45);
      orbit.userData.base = isEarth ? 0.95 : 0.45; solar.add(orbit); solarOrbits.push(orbit);
      if (isEarth) earthOrbit = orbit;
      const g = new THREE.Group();
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(pl.radiusKm * KM_LY, 40, 28), new THREE.MeshStandardMaterial({ color: col, roughness: 0.85, metalness: 0 }));
      if (pl.name === 'Сатурн') {                   // кольца без текстуры
        const rg = new THREE.Mesh(new THREE.RingGeometry(pl.radiusKm * 1.24 * KM_LY, pl.radiusKm * 2.27 * KM_LY, 96, 1),
          new THREE.MeshBasicMaterial({ color: 0xd8c8a0, transparent: true, opacity: 0.55, side: THREE.DoubleSide }));
        rg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), ecl2gal(0, Math.sin(0.466), Math.cos(0.466)).normalize()); g.add(rg);
      }
      const dot = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTexture(true), color: col, sizeAttenuation: false, depthTest: false, transparent: true }));
      dot.scale.set(0.012, 0.012, 1);
      g.add(mesh, dot); solar.add(g);
      const moons = (pl.moons || []).map(m => {
        const mm = new THREE.Mesh(new THREE.SphereGeometry(m.R * KM_LY, 20, 14), new THREE.MeshStandardMaterial({ color: 0xb8b4ac, roughness: 0.95 }));
        const mo = ringLine(m.r * KM_LY, 0x4d6a78, 0.35); mo.userData.base = 0.35; mo.userData.moonOf = g;
        solar.add(mo); solarOrbits.push(mo); g.add(mm); return { m, mesh: mm, orbit: mo };
      });
      solarBodies.push({ pl, g, mesh, dot, moons });
    });
    // пояс астероидов и пояс Койпера — облака точек; гелиопауза — кольцо ~120 а.е.
    const beltPts = (n, r0, r1, h) => { const pts = [], rnd = mulberry(n); for (let k = 0; k < n; k++) {
      const r = (r0 + (r1 - r0) * rnd()) * AU_LY, t = rnd() * Math.PI * 2; pts.push(ecl2gal(r * Math.cos(t), r * Math.sin(t), (rnd() - 0.5) * h * AU_LY)); } return pts; };
    beltMat = new THREE.PointsMaterial({ color: 0x9a8f80, size: 1.4, sizeAttenuation: false, transparent: true, opacity: 0.55, depthTest: false });
    belts = [new THREE.Points(new THREE.BufferGeometry().setFromPoints(beltPts(2500, 2.1, 3.3, 0.3)), beltMat),
      new THREE.Points(new THREE.BufferGeometry().setFromPoints(beltPts(3500, 30, 50, 6)), beltMat)];
    solar.add(...belts);
    const hp = ringLine(120 * AU_LY, 0x6d5f7a, 0.5); hp.userData.base = 0.5; solar.add(hp); solarOrbits.push(hp);
    starsGroup.add(solar);
    placeSolar(0);
    // ракурс «Солнце»: над плоскостью эклиптики с наклоном ~35°
    const d = ecl2gal(0, 0, 1).multiplyScalar(0.82).add(ecl2gal(0.2, -0.55, 0)).normalize();
    PRESETS.sun.yaw = Math.atan2(d.y, d.x); PRESETS.sun.pitch = Math.asin(d.z);
  }
  let solarYear = NaN;
  function placeSolar(year) {
    if (year === solarYear) return; solarYear = year;
    for (const b of solarBodies) {
      b.g.position.copy(helio(b.pl, year));
      for (const { m, mesh, orbit } of b.moons) {
        const t = 2 * Math.PI * (year * 365.25 / m.p) + b.pl.a;   // фаза спутника условная
        mesh.position.copy(ecl2gal(Math.cos(t), Math.sin(t), 0).multiplyScalar(m.r * KM_LY));
        orbit.position.copy(b.g.position);
      }
    }
  }
  // Проявление по масштабу: всё гаснет и проявляется плавно по логарифму расстояния, без щелчков.
  // band(x, a, b, c, d): 0 до a, растёт к b, 1 до c, спадает к d (в логарифме, если все > 0)
  function band(x, a, b, c, d) {
    const L = v => Math.log10(Math.max(v, 1e-30)), lx = L(x);
    const up = b > a ? Math.min(1, Math.max(0, (lx - L(a)) / (L(b) - L(a)))) : 1;
    const dn = d > c ? Math.min(1, Math.max(0, (L(d) - lx) / (L(d) - L(c)))) : 1;
    return up * dn;
  }
  function fadeObj(o, a, base) {
    o.visible = a > 0.003;
    const m = o.material; if (!m) return;
    if (m.userData.base === undefined) m.userData.base = base !== undefined ? base : (m.opacity !== undefined ? m.opacity : 1);
    m.transparent = true; m.opacity = m.userData.base * a;
  }
  // видимость по масштабу: орбиты — от ~10⁶ км до ~0,03 св. года; точки планет — пока шар меньше пикселя
  function updateSolar(dly) {
    placeSolar(world.year);
    solar.visible = dly < 0.08;
    const orbitA = band(dly, 3e-8, 2e-7, 0.01, 0.03), moonA = band(dly, 1e-9, 6e-9, 1e-5, 3e-5);
    for (const o of solarOrbits) fadeObj(o, o.userData.moonOf ? moonA : orbitA, o.userData.base);
    const dotA = band(dly, 1e-7, 5e-7, 0.01, 0.03);
    for (const b of solarBodies) fadeObj(b.dot, dotA, 1);
    const beltA = band(dly, 1e-6, 1e-5, 0.01, 0.03);
    belts.forEach(b => { b.visible = beltA > 0.003; }); beltMat.opacity = 0.55 * beltA;   // с корабля поясов так не видно
    const sunD = cam.F.clone().addScaledVector(offsetDir(), dly).length();
    fadeObj(sunGlow, band(sunD, 3e-7, 3e-6, 1e9, 1e9), 1);
    const sg = 0.006 + 0.054 * band(sunD, 3e-6, 3e-5, 3e-3, 0.05); sunGlow.scale.set(sg, sg, 1);
  }
  // ---------------------------------------------------------------- система ε Индейца (данные 2026 и гипотетическая c)
  // Плоскость орбит — по Ab: наклон 102° к картинной плоскости (узел условный); c — в той же плоскости, на 0,5 а.е.
  // Ba + Bb («Тёмная звезда») — 1 460 а.е. от A в проекции на небо; глубина по Gaia неточна.
  const EIND = { name: 'Epsilon Indi', R_km: 0.713 * 696000, c: { a: 0.5, R_km: 6371, P_d: 146 }, Ab: { a: 15.8, e: 0.25, R_km: 74350, P_yr: 85 },
    hz: [0.47, 0.85], B_au: 1460, B_los: 1900 };   // пара Ba/Bb: 1460 а.е. поперёк луча, 1900 — ближе к нам вдоль него (выбор автора, у потока)
  let tsys = null, tsysAx = null;
  const tsysParts = { orbits: [], dots: [] };
  function buildTargetSystem() {
    const st = stars.find(x => x.name === EIND.name); if (!st) return;
    const C0 = new THREE.Vector3(st.x, st.y, st.z), los = C0.clone().normalize();
    const skyA = new THREE.Vector3(0, 0, 1).cross(los).normalize(), skyB = los.clone().cross(skyA).normalize();
    const inc = 102.2 * Math.PI / 180, n = los.clone().multiplyScalar(Math.cos(inc)).addScaledVector(skyA, Math.sin(inc)).normalize();
    const p1 = skyB.clone(), p2 = n.clone().cross(p1).normalize();
    tsysAx = { C0, los, skyA, n, p1, p2 };
    tsys = new THREE.Group(); tsys.position.copy(C0);
    const kcol = 0xffc27a;
    tsys.add(new THREE.Mesh(new THREE.SphereGeometry(EIND.R_km * KM_LY, 48, 32), new THREE.MeshBasicMaterial({ color: 0xffd9a8 })));
    tsysParts.glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTexture(true), color: kcol, sizeAttenuation: false, depthWrite: false, transparent: true, blending: THREE.AdditiveBlending }));
    tsysParts.glow.scale.set(0.06, 0.06, 1); tsys.add(tsysParts.glow);
    const inPlane = (r, t) => p1.clone().multiplyScalar(r * Math.cos(t)).addScaledVector(p2, r * Math.sin(t));
    const line = (pts, color, op) => { const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: op, depthTest: false })); l.userData.base = op; tsys.add(l); tsysParts.orbits.push(l); return l; };
    const T256 = [...Array(257)].map((_, k) => k / 256 * Math.PI * 2);
    line(T256.map(t => inPlane(EIND.c.a * AU_LY, t)), 0xe8b36a, 0.95);                                 // c — наша цель
    const Ab = EIND.Ab;
    line(T256.map(nu => inPlane(Ab.a * (1 - Ab.e * Ab.e) / (1 + Ab.e * Math.cos(nu)) * AU_LY, nu)), 0x4d6a78, 0.5);
    // зона жизни — полупрозрачное кольцо в плоскости орбит
    const hz = new THREE.Mesh(new THREE.RingGeometry(EIND.hz[0] * AU_LY, EIND.hz[1] * AU_LY, 128, 1),
      new THREE.MeshBasicMaterial({ color: 0x6f9f6a, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthTest: false, depthWrite: false }));
    hz.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n); tsys.add(hz); tsysParts.hz = hz;
    const body = (R_km, color, dotCol) => { const g = new THREE.Group();
      g.add(new THREE.Mesh(new THREE.SphereGeometry(R_km * KM_LY, 32, 24), new THREE.MeshStandardMaterial({ color, roughness: 0.8 })));
      const dot = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTexture(true), color: dotCol, sizeAttenuation: false, depthTest: false, transparent: true }));
      dot.scale.set(0.012, 0.012, 1); g.add(dot); tsysParts.dots.push(dot); tsys.add(g); return g; };
    tsysParts.c = body(EIND.c.R_km, 0x3d6f9e, 0x9cc4e8);
    tsysParts.Ab = body(Ab.R_km, 0xc8b89a, 0xd6c3a0);
    tsysParts.B = body(0.08 * 696000, 0x6a3a30, 0xb0604a);
    tsysParts.B.position.copy(skyA).multiplyScalar(EIND.B_au * AU_LY).addScaledVector(los, -EIND.B_los * AU_LY);
    tsys.add(new THREE.PointLight(0xffc890, 1.4, 0.02, 1e-4));                     // свет звезды — только в своей системе
    tsys.traverse(o => { if (o.material) o.material.toneMapped = false; });
    tsys.visible = false; starsGroup.add(tsys);
  }
  // корабль приходит к планете: фаза c на году прибытия — там, куда ведёт прямая траектория
  function tsysArrival() {
    const A = world.arrive, b = world.beta || 0.1;
    const end = pathPoint(distLyRaw(A));                                  // конец пути — и после поворота (излом)
    const v = end.clone().sub(tsysAx.C0), th0 = Math.atan2(v.dot(tsysAx.p2), v.dot(tsysAx.p1));
    return { end, th0 };
  }
  // Фаза планеты c (период ~148 суток). Промотка года идёт 1,8 с — это два-три оборота: звезда облетала бы кадр,
  // а камера, держащая звезду и планету, дёргалась. Пока год анимируется (world.anim), фаза идёт от начальной к итоговой
  // кратчайшим путём; в конце — точно там, где должна быть.
  const cTh = (th0, year) => th0 + 2 * Math.PI * (year - world.arrive) * 365.25 / EIND.c.P_d;
  function cPos(year) {
    const { th0 } = tsysArrival(), A = world.arrive, an = world.anim, r = EIND.c.a * AU_LY;
    let th = cTh(th0, year);
    if (an && year > A) {
      const f = Math.max(A, an.from), t = Math.max(A, an.to);
      if (t !== f && year >= Math.min(f, t) - 1e-9 && year <= Math.max(f, t) + 1e-9) {
        const a = cTh(th0, f), k = (year - f) / (t - f);
        th = a + wrapPi(cTh(th0, t) - a) * k;
      }
    }
    return tsysAx.p1.clone().multiplyScalar(r * Math.cos(th)).addScaledVector(tsysAx.p2, r * Math.sin(th));
  }
  function updateTargetSystem(dly) {
    if (!tsys) return;
    const on = targetInfo.star === EIND.name, nearT = on ? band(cam.F.distanceTo(tsysAx.C0), 0, 0, 0.02, 0.1) : 0;
    tsys.visible = nearT > 0.003;
    if (!tsys.visible) return;
    const orbitA = band(dly, 3e-8, 2e-7, 0.01, 0.03) * nearT;
    tsysParts.orbits.forEach(o => fadeObj(o, orbitA, o.userData.base));
    tsysParts.dots.forEach(d => fadeObj(d, band(dly, 1e-7, 5e-7, 0.01, 0.03) * nearT, 1));
    fadeObj(tsysParts.hz, band(dly, 1e-7, 1e-6, 2e-4, 1e-3) * nearT, 0.12);
    const tD = cam.F.clone().addScaledVector(offsetDir(), dly).distanceTo(tsysAx.C0);
    fadeObj(tsysParts.glow, band(tD, 3e-7, 3e-6, 1e9, 1e9) * nearT, 1);
    const tg = 0.006 + 0.054 * band(tD, 3e-6, 3e-5, 3e-3, 0.05); tsysParts.glow.scale.set(tg, tg, 1);
    if (world.arrive) tsysParts.c.position.copy(cPos(world.year));
    const th = 2 * Math.PI * world.year / EIND.Ab.P_yr + 1.1, Ab = EIND.Ab, r = Ab.a * (1 - Ab.e * Ab.e) / (1 + Ab.e * Math.cos(th)) * AU_LY;
    tsysParts.Ab.position.copy(tsysAx.p1).multiplyScalar(r * Math.cos(th)).addScaledVector(tsysAx.p2, r * Math.sin(th));
  }
  function drawTargetLabels(put, rel, dly) {
    if (!tsys || !tsys.visible) return;
    const at = o => rel(o.position.clone().add(tsysAx.C0)), ru = lang === 'ru';
    if (dly > 1e-7 && dly < 0.01) put(at(tsysParts.c), ru ? 'ε Инд c · 0,5 а.е.' : 'ε Ind c · 0.5 AU', 'star');
    if (dly > 1e-6 && dly < 0.02) put(at(tsysParts.Ab), ru ? 'ε Инд Ab · суперюпитер' : 'ε Ind Ab · super-Jupiter', 'star');
    if (dly > 2e-7 && dly < 3e-5) put(rel(tsysAx.p1.clone().multiplyScalar(0.66 * AU_LY).add(tsysAx.C0)), ru ? 'зона жизни' : 'habitable zone', 'star');
    if (dly > 5e-5 && dly < 0.08) put(at(tsysParts.B), ru ? 'Ba + Bb · Тёмная звезда' : 'Ba + Bb · the Dark Star', 'star');
  }
  function drawSolarLabels(put, rel, dly) {
    if (!solar || !solar.visible || dly > 0.03) return;
    for (const b of solarBodies) {
      if (dly > 1.5e-5 * Math.max(1, b.pl.a) * 40) continue;           // внешние видны раньше внутренних
      if (dly < 3e-7 && b.pl.name !== 'Земля') continue;
      if (b.pl.name === 'Земля' && dly < 1e-7) continue;               // у корабля Землю видно и так
      put(rel(b.g.position), lang === 'ru' ? b.pl.name : EN[b.pl.name] || b.pl.name, 'star');
      if (dly < 3e-5) for (const { m, mesh } of b.moons) put(rel(mesh.position.clone().add(b.g.position)), lang === 'ru' ? m.name : EN[m.name] || m.name, 'star');
    }
    if (dly > 5e-4 && dly < 0.03) put(rel(ecl2gal(120 * AU_LY, 0, 0)), lang === 'ru' ? 'гелиопауза' : 'heliopause', 'star');
    if (dly > 2e-5 && dly < 2e-3) put(rel(ecl2gal(0, -2.7 * AU_LY, 0)), lang === 'ru' ? 'пояс астероидов' : 'asteroid belt', 'star');
  }

  // солнечный блик в кадре: гало и горизонтальная вспышка
  let glare, streak, tglare, tstreak;
  function glareTexture(streakMode) {
    const c = document.createElement('canvas'); c.width = 256; c.height = streakMode ? 32 : 256;
    const g = c.getContext('2d');
    if (streakMode) {
      const gr = g.createLinearGradient(0, 0, 256, 0);
      gr.addColorStop(0, 'rgba(255,220,180,0)'); gr.addColorStop(0.5, 'rgba(255,240,220,0.5)'); gr.addColorStop(1, 'rgba(255,220,180,0)');
      g.fillStyle = gr; g.fillRect(0, 15, 256, 2);
    } else return new THREE.CanvasTexture(expGlowCanvas(256, 0.035, 0.2, 0.12, [255, 255, 250], [255, 200, 140]));
    return new THREE.CanvasTexture(c);
  }
  // ---------------------------------------------------------------- плазменный магнит (торможение)
  // Антенны на корме ядра (x = −365) гонят ток по впрыснутой плазме, поле раздувается в пузырь (calc_life.py §9).
  // Магнитопауза r = 2 584 км · (0,1c / v): чем медленнее поток, тем шире пузырь. У антенн — плотная плазма, светится
  // фиолетовым; на магнитопаузе нейтральный водород возбуждается и светит в Hα — слабо, как бальмеровские фронты
  // остатков сверхновых; в кадре — как на долгой выдержке. Включается за 20 лет до прибытия, гаснет за 4.
  const pm = { a: 0 };
  function glowShader(color, strength, upstream) {
    return new THREE.ShaderMaterial({
      uniforms: { color: { value: new THREE.Color(...color) }, a: { value: 0 } },
      vertexShader: `#include <common>
        #include <logdepthbuf_pars_vertex>
        varying vec3 vN; varying vec3 vV; varying float vX;
        void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); vX = position.x;
          gl_Position = projectionMatrix * mv;
          #include <logdepthbuf_vertex>
        }`,
      fragmentShader: `#include <logdepthbuf_pars_fragment>
        uniform vec3 color; uniform float a; varying vec3 vN; varying vec3 vV; varying float vX;
        void main(){
          #include <logdepthbuf_fragment>
          float rim = pow(1.0 - abs(dot(vN, vV)), 2.2);
          float up = ${upstream ? 'smoothstep(-0.3, 0.8, vX)' : '1.0'};
          float k = (rim * 0.9 + 0.1) * (0.2 + 0.8 * up) * ${strength.toFixed(2)} * a;
          gl_FragColor = vec4(color * k, k);
        }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide
    });
  }
  function buildPlasmaMagnet() {
    pm.near = add(ship, new THREE.TorusGeometry(58, 22, 24, 96), glowShader([0.72, 0.45, 1.0], 1.0, false), m => { m.rotation.y = Math.PI / 2; m.position.x = -365; });
    pm.halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glareTexture(false), color: 0xb98cff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
    pm.halo.scale.set(320, 320, 1); pm.halo.position.x = -365; ship.add(pm.halo);
    // пузырь: нос — на r впереди антенн, хвост вдвое длиннее
    pm.shell = add(ship, new THREE.SphereGeometry(1, 64, 32), glowShader([1.0, 0.36, 0.46], 0.55, true));
    pm.light = new THREE.PointLight(0xb98cff, 0, 700, 1); pm.light.position.x = -365; ship.add(pm.light);
    [pm.near, pm.halo, pm.shell].forEach(o => { o.visible = false; });
  }
  function bubbleR() {                       // магнитопауза, м: 2 584 км на 0,1c, растёт как 1/v
    const v = Math.max(0.005, MI && world.arrive ? MI.speedAt(world.year, world.beta || 0.1, world.arrive, world.tMag) : world.beta || 0.1);
    return 2.584e6 * 0.1 / v;
  }
  function stepPlasmaMagnet(dt, dS) {
    const A = world.arrive, y = world.year, on = !world.wreck && A > 0 && y >= A - brakeYears() - 1e-6 && y < A - 4 && ship.quaternion.angleTo(shipQBase) < 0.05;
    pm.a += ((on ? 1 : 0) - pm.a) * (1 - Math.exp(-dt * 0.6));                 // разгорается и гаснет за секунды
    const vis = pm.a > 0.003;
    [pm.near, pm.halo, pm.shell].forEach(o => { o.visible = vis; });
    pm.light.intensity = 0.5 * pm.a;
    if (!vis) { pm.view = 0; return; }
    const r = bubbleR();
    pm.shell.scale.set(1.5 * r, r, r); pm.shell.position.x = -365 - 0.5 * r;
    // камера дальше радиуса пузыря — свечение у антенн тусклее (до трети): на виде сбоку оно не перекрывает блики звезды.
    // Оболочка (сам парус) — в полную силу на любом удалении: на виде сбоку её и показываем
    const far = Math.min(1, Math.max(0, (Math.log((dS || 0) / r) - Math.log(0.5)) / Math.log(8))), dim = 1 - 0.65 * far * far * (3 - 2 * far);
    pm.near.material.uniforms.a.value = pm.a * dim; pm.shell.material.uniforms.a.value = pm.a;
    pm.halo.material.opacity = 0.28 * pm.a * dim;
    // пузырь в кадре (камера ближе 20 радиусов, к 100 — уже точка): корабль показывает он, свечение-метка корабля уступает.
    // Только на виде сбоку (до 100 тыс. км, к 200 тыс. — нет): маршрутные виды (0,2–2 млн км) — с полной меткой и на малой
    // скорости, когда пузырь велик (ревью Codex)
    const sm = x => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
    const big = 1 - (Math.log((dS || Infinity) / r) - Math.log(20)) / Math.log(5), near = 1 - (Math.log((dS || Infinity) / 1e8)) / Math.log(2);
    pm.view = pm.a * sm(big) * sm(near);
  }

  // ---------------------------------------------------------------- у цели: планета и находка (болванки без текстур)
  // Планета подходит из дали последние два года: на году прибытия она в ~24 000 км, раньше — точкой.
  // Находка у Тёмной звезды (только у источника): диск ~400 м со спиральными выступами и корабль тридцать второй.
  const arrival = {};
  const PLANET = {
    open: { color: 0x2f5f8f, rough: 0.55, rim: [0.45, 0.72, 1.0] },
    dome: { color: 0xc4ccd2, rough: 0.8, rim: [0.8, 0.86, 0.95] },
    hostile: { color: 0xd9c38c, rough: 0.9, rim: [1.0, 0.85, 0.45] },
    ruined: { color: 0x3a3230, rough: 0.95, rim: [1.0, 0.45, 0.2], emissive: 0x5a1a08 }
  };
  // Миры у цели (кроме ε Индейца с собственными картами) — из готовых карт облаков Земли и ε Индейца, подкрашенных по классу:
  // open — океан, суша и облака; dome — приливный захват: пар на дневной стороне, лёд на ночной; hostile — сплошная
  // полосатая облачная крыша; ruined — тёмная кора со светящимися разломами. Свет — цвет звезды цели.
  const planetU = { sunDir: { value: new THREE.Vector3(1, 0, 0) }, lightCol: { value: new THREE.Color(1, 1, 1) }, cloudMap: { value: null },
    mode: { value: 0 }, tint: { value: new THREE.Color() }, tint2: { value: new THREE.Color() }, shift: { value: 0 } };
  const PLANET_LOOK = {
    open: { mode: 0, map: 'eind', tint: 0x1d3f63, tint2: 0x6f6a4e }, dome: { mode: 1, map: 'earth', tint: 0xdfe4e8, tint2: 0x8fa3b8 },
    hostile: { mode: 2, map: 'earth', tint: 0xb89a5a, tint2: 0xf0dca0 }, ruined: { mode: 3, map: 'earth', tint: 0x221c19, tint2: 0xff5a14 }
  };
  let planetMaps = null;
  function planetMaterial() {
    planetMaps = { earth: earthTex('clouds', false, 'earth'), eind: earthTex('clouds', false, 'eind') };
    planetU.cloudMap.value = planetMaps.earth;
    return new THREE.ShaderMaterial({ uniforms: planetU,
      vertexShader: `#include <common>
        #include <logdepthbuf_pars_vertex>
        varying vec2 vUv; varying vec3 vN;
        void main(){ vUv = uv; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
          #include <logdepthbuf_vertex>
        }`,
      fragmentShader: `#include <logdepthbuf_pars_fragment>
        uniform sampler2D cloudMap; uniform vec3 sunDir, lightCol, tint, tint2; uniform float mode, shift;
        varying vec2 vUv; varying vec3 vN;
        void main(){
          #include <logdepthbuf_fragment>
          float NL = dot(normalize(vN), normalize(sunDir)), day = smoothstep(-0.04, 0.3, NL);
          float c = texture2D(cloudMap, vUv + vec2(shift, 0.0)).r;
          vec3 col;
          if (mode < 0.5) {                                          // океан и суша (континенты — другой срез той же карты), облака сверху
            float land = smoothstep(0.58, 0.64, texture2D(cloudMap, vUv * vec2(1.7, 1.3) + vec2(0.37, 0.11)).r);
            float cc = pow(smoothstep(0.25, 1.0, c), 1.3);
            col = mix(mix(tint, tint2, land), vec3(1.0), cc * 0.92) * day * lightCol;
          } else if (mode < 1.5) {                                   // день — пар и облака, ночь — лёд в слабом свете
            vec3 vap = mix(tint * 0.8, vec3(1.0), smoothstep(0.1, 0.8, c));
            vec3 ice = mix(tint2 * 0.6, tint2, c);
            col = vap * day * lightCol + ice * 0.05 * (1.0 - day);
          } else if (mode < 2.5) {                                   // облачная крыша: полосы вдоль широт
            float b = texture2D(cloudMap, vec2(vUv.x * 0.5 + shift * 0.3, vUv.y * 0.35 + 0.3)).r;
            col = mix(tint, tint2, smoothstep(0.15, 0.9, b)) * (0.25 + 0.75 * day) * day * lightCol;
          } else {                                                   // разрушенная кора: разломы светятся и в тени
            float f = smoothstep(0.6, 0.66, c) * (1.0 - smoothstep(0.7, 0.8, c));
            col = tint * (0.4 + 0.6 * c) * day * lightCol + tint2 * f * 1.6;
          }
          gl_FragColor = vec4(col, 1.0);
          #include <tonemapping_fragment>
          #include <encodings_fragment>
        }` });
  }
  function buildArrival() {
    const R = 6.4e6;
    arrival.planet = new THREE.Group();
    arrival.body = new THREE.Mesh(new THREE.SphereGeometry(R, 128, 96), planetMaterial());
    arrival.rim = new THREE.Mesh(new THREE.SphereGeometry(R * 1.03, 96, 64), glowShader([0.45, 0.72, 1.0], 0.9, false));
    arrival.debris = new THREE.Mesh(new THREE.TorusGeometry(R * 2.2, R * 0.04, 8, 180, Math.PI * 1.3),
      new THREE.MeshBasicMaterial({ color: 0xc0622e, transparent: true, opacity: 0.55 }));
    arrival.debris.rotation.x = 1.25;
    arrival.planet.add(arrival.body, arrival.rim, arrival.debris);
    arrival.planet.visible = false; shipScene.add(arrival.planet);
  }
  // ---------------------------------------------------------------- склад Оттепели (спасатель v3) — болванка
  // Орбитальный склад: цилиндр 120 м, два радиатора, 40 огней капсул. До стыковки висит в полукилометре за кораблём
  // (на фоне звезды и планеты), вращается и бьёт струёй теплоносителя; при стыковке плавно подходит к трюму позади колец,
  // вращение гаснет. Стабилизировали — струя гаснет; перенесли в сектор — огни капсул гаснут. Появление и уход — плавные.
  const thaw = { g: null, hull: null, rad: null, lm: null, jet: null, a: 0, dock: 0, spin: 0.12, jetA: 0, litA: 1, q: new THREE.Quaternion(), axis: new THREE.Vector3(0.3, 1, 0.2).normalize(), last: null };
  function buildThawStore() {
    const g = new THREE.Group();
    thaw.hull = new THREE.MeshStandardMaterial({ color: 0x8a867c, roughness: 0.75, metalness: 0.3, transparent: true, opacity: 0 });
    thaw.rad = new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.8, metalness: 0.1, emissive: 0x3a1006, emissiveIntensity: 0.3, transparent: true, opacity: 0 });
    add(g, new THREE.CylinderGeometry(22, 22, 120, 28), thaw.hull, m => { m.rotation.z = Math.PI / 2; });
    add(g, new THREE.CylinderGeometry(12, 22, 16, 28), thaw.hull, m => { m.rotation.z = -Math.PI / 2; m.position.x = 68; });
    for (const s of [-1, 1]) add(g, new THREE.BoxGeometry(84, 1.2, 30), thaw.rad, m => { m.position.set(-4, 0, s * 40); });
    thaw.lm = new THREE.MeshBasicMaterial({ color: 0x9fd4ff, transparent: true, opacity: 0, toneMapped: false });
    for (let r = 0; r < 4; r++) for (let k = 0; k < 10; k++) add(g, new THREE.BoxGeometry(5, 1.4, 1.4), thaw.lm, m => {
      const a = r * Math.PI / 2 + Math.PI / 4; m.position.set(-46 + k * 10, 22.6 * Math.cos(a), 22.6 * Math.sin(a)); });
    // струя теплоносителя: конус от пробоины в протекающей секции, наружу по −z корпуса (вершина у корпуса, расширяется наружу)
    thaw.jet = new THREE.Group(); thaw.jet.position.set(-30, 0, -22); g.add(thaw.jet);
    thaw.jetMats = [0.9, 0.35].map((o, i) => { const m = new THREE.MeshBasicMaterial({ color: i ? 0x9fd0ff : 0xe8f6ff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, side: THREE.DoubleSide });
      const geo = new THREE.ConeGeometry(i ? 34 : 12, i ? 220 : 150, 24, 1, true); geo.translate(0, -(i ? 110 : 75), 0); geo.rotateX(Math.PI / 2);   // вершина в 0, раструб — к −z
      thaw.jet.add(new THREE.Mesh(geo, m)); m.userData.base = o; return m; });
    // маяк на боку корпуса (+y): виден, когда этот борт обращён к камере, — при вращении «пропадает и возвращается»
    thaw.beacon = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xff6a4a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0 }));
    thaw.beacon.scale.set(46, 46, 1); thaw.beacon.position.set(40, 26, 0); g.add(thaw.beacon);
    g.scale.setScalar(1.5);
    g.visible = false; shipScene.add(g); thaw.g = g;
  }
  function stepThaw(dt) {
    const S = world.store || null, k = r => 1 - Math.exp(-dt * r);
    // первое появление (загрузка, другая партия) и шаг назад по журналу — сразу в своём состоянии; анимируются только перемены вперёд
    if (S && thaw.last && (S.key !== thaw.last.key || (thaw.last.docked && !S.docked) || (thaw.last.stable && !S.stable))) thaw.last = null;
    if (S && !thaw.last) { thaw.dock = S.docked ? 1 : 0; thaw.spin = S.docked ? 0 : 0.12; thaw.jetA = !S.stable && !S.safe ? (S.torn ? 1 : 0.55) : 0; thaw.litA = (S.op === 'move' || S.op === 'wake') && S.stable ? 0 : 1;
      if (S.docked) { thaw.g.quaternion.copy(ship.quaternion); } }
    if (S) thaw.last = S;
    const L = thaw.last;
    thaw.a += ((S ? 1 : 0) - thaw.a) * k(0.8);
    if (!L || (!S && thaw.a < 0.01)) { thaw.g.visible = false; if (!S) { thaw.last = null; thaw.dock = 0; thaw.spin = 0.12; thaw.jetA = 0; thaw.litA = 1; } return; }
    thaw.g.visible = true;
    thaw.dock += ((L.docked ? 1 : 0) - thaw.dock) * k(0.45);
    thaw.spin += ((L.docked ? 0 : 0.12) - thaw.spin) * k(0.6);
    thaw.jetA += ((!L.stable && !L.safe ? (L.torn ? 1 : 0.55) : 0) - thaw.jetA) * k(0.7);
    thaw.litA += (((L.op === 'move' || L.op === 'wake') && L.stable ? 0 : 1) - thaw.litA) * k(0.4);   // перенесли или разбудили — склад пуст
    thaw.hull.opacity = thaw.a; thaw.rad.opacity = thaw.a; thaw.lm.opacity = 0.85 * thaw.a * thaw.litA;
    const fl = 0.85 + 0.15 * Math.sin(performance.now() * 0.013) * Math.sin(performance.now() * 0.0071);
    thaw.jetMats.forEach(m => { m.opacity = m.userData.base * thaw.a * thaw.jetA * fl; });
    thaw.jet.scale.setScalar(0.6 + 0.6 * thaw.jetA);
    // маяк: мигает раз в 2 с; виден, когда его борт смотрит на камеру (геометрия, а не таймер)
    const nB = new THREE.Vector3(0, 1, 0).applyQuaternion(thaw.g.quaternion), toCam = shipCam.position.clone().sub(thaw.g.position).normalize();
    const blink = (performance.now() % 2000) < 260 ? 1 : 0.12, face = Math.max(0, Math.min(1, nB.dot(toCam) * 4 + 0.5));
    thaw.beacon.material.opacity = thaw.a * blink * face;
    // место: до стыковки — за кораблём, между ним и звездой с планетой (в кадре прибытия); у трюма — борт о борт
    // склад правее корабля в кадре прибытия — между кораблём и карточками
    const ax = arrivalAxes(), look = ax.st.clone().add(ax.planet).normalize(), right = new THREE.Vector3().crossVectors(look, ax.up).normalize();   // вправо в кадре прибытия (камера смотрит вдоль look, верх — ax.up)
    const hover = shipLocal(-320).addScaledVector(right, 560).addScaledVector(look, 150).addScaledVector(ax.up, -40);
    const yS = new THREE.Vector3(0, 1, 0).applyQuaternion(ship.quaternion), berth = shipLocal(-320).addScaledVector(yS, 92);
    const d = thaw.dock * thaw.dock * (3 - 2 * thaw.dock);
    thaw.g.position.copy(hover).lerp(berth, d);
    // вращение гаснет к стыковке; ось склада доворачивается вдоль корабля
    thaw.q.setFromAxisAngle(thaw.axis, thaw.spin * dt);
    thaw.g.quaternion.premultiply(thaw.q);
    if (thaw.dock > 0.02) thaw.g.quaternion.slerp(ship.quaternion, Math.min(1, k(0.8) * thaw.dock));
  }
  // ---------------------------------------------------------------- форпост Ксилона Ир (снабженец) — болванка
  // Орбитальная станция у непригодной планеты: ствол, два жилых модуля, капсульная секция, большая антенна с ручным
  // приводом. Висит правее корабля в кадре прибытия. Разгрузка — контейнеры из трюма перелетают к станции (связь — к
  // антенне, капсулы — к секции); переселение — челноки людей к кораблю. Установили связь — антенна мигает зелёным;
  // капсулы — секция светится; секцию потеряли — гаснет. Первое появление — сразу в итоговом состоянии.
  const post = { g: null, mats: [], dishLit: null, capsLit: null, a: 0, last: null, ferry: [], relayA: 0, capsA: 0.6, off: null, lightAt: 0 };
  const dropFerry = f => { shipScene.remove(f.m); f.m.geometry.dispose(); f.m.material.dispose(); f.glow.material.dispose(); };
  function buildOutpost() {
    const g = new THREE.Group();
    const hull = new THREE.MeshStandardMaterial({ color: 0x9a948a, roughness: 0.7, metalness: 0.25, transparent: true, opacity: 0 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x3a3c40, roughness: 0.5, metalness: 0.6, transparent: true, opacity: 0 });
    const rad = new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.8, emissive: 0x3a1006, emissiveIntensity: 0.25, transparent: true, opacity: 0 });
    post.mats = [hull, dark, rad];
    add(g, new THREE.CylinderGeometry(10, 10, 260, 20), dark, m => { m.rotation.z = Math.PI / 2; });                 // ствол
    for (const x of [-70, 30]) add(g, new THREE.CylinderGeometry(30, 30, 70, 28), hull, m => { m.rotation.z = Math.PI / 2; m.position.x = x; });   // жилые модули
    add(g, new THREE.CylinderGeometry(24, 24, 60, 24), hull, m => { m.rotation.z = Math.PI / 2; m.position.x = 105; });   // капсульная секция
    for (const s of [-1, 1]) add(g, new THREE.BoxGeometry(150, 1.2, 46), rad, m => { m.position.set(-20, s * 70, 0); m.rotation.x = Math.PI / 2; });
    const dish = new THREE.Mesh(new THREE.SphereGeometry(60, 32, 12, 0, Math.PI * 2, 0, 0.55), dark);              // антенна дальней связи
    dish.material.side = THREE.DoubleSide; dish.rotation.z = Math.PI / 2; dish.position.set(-150, 0, 0); g.add(dish);
    post.dishLit = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0x6dffb0, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0 }));
    post.dishLit.scale.set(50, 50, 1); post.dishLit.position.set(-175, 0, 0); g.add(post.dishLit);
    post.capsLit = new THREE.MeshBasicMaterial({ color: 0x9fd4ff, transparent: true, opacity: 0, toneMapped: false });
    for (let r = 0; r < 4; r++) for (let k = 0; k < 6; k++) add(g, new THREE.BoxGeometry(6, 1.4, 1.4), post.capsLit, m => {
      const a = r * Math.PI / 2 + Math.PI / 4; m.position.set(80 + k * 10, 24.6 * Math.cos(a), 24.6 * Math.sin(a)); });
    g.visible = false; shipScene.add(g); post.g = g;
  }
  // контейнер или челнок: из точки a в точку b по дуге за dur секунд, с задержкой; в конце — уходит в шлюз
  function ferryBox(a, b, delay, kind) {
    const m = new THREE.Mesh(kind === 'pod' ? new THREE.CapsuleGeometry(4, 10, 4, 10) : new THREE.BoxGeometry(18, 10, 10),
      new THREE.MeshStandardMaterial({ color: kind === 'pod' ? 0xd8d2c4 : 0xb87333, roughness: 0.5, metalness: 0.5, transparent: true, opacity: 0 }));
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0x9cc8ff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0 }));
    glow.scale.set(22, 22, 1); m.add(glow);
    shipScene.add(m);
    post.ferry.push({ m, glow, a: a.clone(), b: b.clone(), t: -delay, dur: 9 });
  }
  function stepOutpost(dt) {
    const S = world.outpost || null, k = r => 1 - Math.exp(-dt * r);
    const fresh = S && (!post.last || S.key !== post.last.key);
    if (!S || fresh) { post.ferry.forEach(dropFerry); post.ferry = []; post.lightAt = 0; }   // другая партия или уход — перевозки убраны
    post.a += ((S ? 1 : 0) - post.a) * k(0.8);
    const ax = arrivalAxes(), look = ax.st.clone().add(ax.planet).normalize(), right = new THREE.Vector3().crossVectors(look, ax.up).normalize();   // вправо в кадре прибытия (камера смотрит вдоль look, верх — ax.up)
    // место станции — один раз при появлении (смещение от корабля), дальше неподвижно: груз летит туда, где станция стоит
    if (fresh || !post.off) post.off = new THREE.Vector3().addScaledVector(right, 560).addScaledVector(look, 150).addScaledVector(ax.up, 200);
    post.g.position.copy(shipLocal(-320)).add(post.off);
    if (fresh) { post.g.quaternion.copy(ship.quaternion); post.relayA = S.relay ? 1 : 0; post.capsA = S.capsLost ? 0 : S.caps ? 1 : 0.6; }
    // разгрузка — только перемена на глазах: выбор плана работ в этой же партии
    if (S && post.last && !fresh && !post.last.deliver && S.deliver) {
      const hold = shipLocal(-320).addScaledVector(new THREE.Vector3(0, 1, 0).applyQuaternion(ship.quaternion), 60);
      const toLocal = v => v.clone().applyQuaternion(post.g.quaternion).add(post.g.position);
      const dishP = toLocal(new THREE.Vector3(-150, 0, 0)), capsP = toLocal(new THREE.Vector3(105, 0, 0)), hab = toLocal(new THREE.Vector3(-70, 0, 0));
      // груз — то, что действительно встаёт: передатчик к антенне, капсульный блок к секции (порядок работ — по плану)
      const plan = (S.deliver === 'capsules' ? [S.caps && capsP, S.caps && capsP, S.relay && dishP] : [S.relay && dishP, S.caps && capsP, S.relay && dishP, S.caps && capsP]).filter(Boolean);
      plan.forEach((p, i) => ferryBox(hold, p, i * 1.3, 'box'));
      if (S.deliver === 'shelter') for (let i = 0; i < 4; i++) ferryBox(hab, hold, (plan.length + i) * 1.3, 'pod');
      post.lightAt = performance.now() + ((plan.length - 1) * 1.3 + 9) * 1000;   // огни — когда последний контейнер у станции
    }
    if (S) post.last = S;
    if (!S && post.a < 0.01) { post.g.visible = false; post.last = null; }
    else {
      post.g.visible = true;
      post.mats.forEach(m => { m.opacity = post.a; });
      const L = post.last || {};
      const done = performance.now() >= post.lightAt;
      post.relayA += ((L.relay && done ? 1 : 0) - post.relayA) * k(0.3);
      post.capsA += ((L.capsLost ? 0 : L.caps && done ? 1 : 0.6) - post.capsA) * k(0.3);
      const blink = (performance.now() % 1600) < 220 ? 1 : 0.15;
      post.dishLit.material.opacity = post.a * post.relayA * blink;
      post.capsLit.opacity = 0.85 * post.a * post.capsA;
    }
    for (const f of post.ferry) {
      f.t += dt;
      const u = Math.max(0, Math.min(1, f.t / f.dur)), e = u * u * (3 - 2 * u);
      const mid = f.a.clone().lerp(f.b, 0.5).addScaledVector(ax.up, 90);
      f.m.position.copy(f.a).multiplyScalar((1 - e) * (1 - e)).addScaledVector(mid, 2 * e * (1 - e)).addScaledVector(f.b, e * e);
      const vis = f.t < 0 ? 0 : Math.min(1, f.t / 0.8) * Math.min(1, (f.dur - f.t) / 0.8);
      f.m.material.opacity = vis * post.a; f.glow.material.opacity = 0.8 * vis * post.a * (u < 0.15 || u > 0.85 ? 1 : 0.35);
      f.m.quaternion.copy(ship.quaternion);
    }
    for (const f of post.ferry.filter(f => f.t > f.dur)) dropFerry(f);
    post.ferry = post.ferry.filter(f => f.t <= f.dur);
  }
  // ε Индейца A c: процедурные карты (ART/epsilon-indi/gen_planet.py), свет K5 — оранжевый, наклон оси 18°
  // дымка вдвое слабее земной (с 24 000 км она съедала цвет), блик уже и тусклее, цвета насыщеннее
  const eindU = { sunDir: { value: new THREE.Vector3(1, 0, 0) }, lightCol: { value: new THREE.Color(1.0, 0.8, 0.62) },
    look: { value: new THREE.Vector4(1.85, 0.3, 900, 1.4) }, haze: { value: 0.3 } };
  function buildEind() {
    arrival.eind = buildWorld('eind', 6.371e6, eindU);
    arrival.eind.tilt.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), E3.clone().multiplyScalar(0.95).add(E2.clone().multiplyScalar(0.31)).normalize());
    arrival.eind.tilt.visible = false; shipScene.add(arrival.eind.tilt);
  }
  // Камера всегда в километрах от корабля, так что освещённость планеты в кадре задаёт угол «звезда — планета» с корабля.
  // На прибытии планета в 42° от звезды: обе в кадре, планета в контровом свете — серп. За год ожидания корабль
  // на орбите уходит на дневную сторону: планета в 150° от звезды, освещена почти вся (кадр «дом»).
  function arrivalAxes() {
    const st = lux.dirT.clone();
    let side = st.clone().cross(E3); if (side.lengthSq() < 1e-6) side = st.clone().cross(E2); side.normalize();
    const up = side.clone().cross(st).normalize();
    // звезда в кадре слева (справа — карточки). Сторону выбираем один раз — по геометрии в точке прибытия,
    // иначе на подлёте, пока направление на звезду поворачивается, планета могла бы перескочить на другую сторону.
    const ref = world.arrive && tsysAx && targetInfo.star === EIND.name ? cPos(world.arrive).normalize().negate() : st;
    const refSide = ref.clone().cross(E3).normalize(), refRight = ref.clone().add(refSide).cross(E3);
    if (ref.dot(refRight) > 0) side.negate();
    const A = world.arrive || 0, k = Math.max(0, Math.min(1, world.year - A)), sk = k * k * (3 - 2 * k);
    const phi = 0.73 + (2.62 - 0.73) * sk, beta = 0.6 - 0.4 * sk;           // планета ниже звезды на 34° по кадру
    const dir = side.clone().multiplyScalar(Math.cos(beta)).addScaledVector(up, -Math.sin(beta));
    const planet = st.clone().multiplyScalar(Math.cos(phi)).addScaledVector(dir, Math.sin(phi)).normalize();
    return { st, side, up, planet };
  }
  function arrivalLook(fit) {
    const ax = arrivalAxes();
    const look = fit === 'arrival' ? ax.st.clone().add(ax.planet).normalize()          // между звездой и планетой
      : ax.planet.clone().addScaledVector(ax.up, 0.06).addScaledVector(ax.side, 0.08).normalize();
    return frameAngles(look.negate());
  }
  let arrivalClass = null;
  function stepArrival() {
    const A = world.arrive, y = world.year;
    const pivot = shipLocal(-900);
    // планета
    const cls = world.worldClass, pOn = A > 0 && cls && cls !== 'none' && y >= A - 2;
    const eOn = pOn && targetInfo.star === 'Epsilon Indi' && cls === 'open';      // ε Индейца — по картам, остальные пока болванки
    arrival.eind.tilt.visible = !!eOn;
    arrival.planet.visible = !!pOn && !eOn;
    if (eOn) {
      const k = Math.max(0, Math.min(1, (A - y) / 2)), D = 3.0e7 * (1 + 120 * k * k);
      const ax = arrivalAxes();
      arrival.eind.tilt.position.copy(pivot).addScaledVector(ax.planet, D);
      // ось планеты поперёк взгляда с корабля, наклон 18°: в кадре экватор и обе шапки, а не полюс
      arrival.eind.tilt.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), ax.up.clone().multiplyScalar(Math.cos(0.31)).addScaledVector(ax.side, Math.sin(0.31)).normalize());
      arrival.eind.atmo.material.uniforms.center.value.copy(arrival.eind.tilt.position);
      eindU.sunDir.value.copy(lux.dirT);
      eindU.lightCol.value.set(starColor(targetInfo.sp));
      arrival.eind.spin.rotation.y += 0.00025;                                  // сутки 28 ч — в кадре едва заметно
      arrival.eind.surface.material.uniforms.cloudShift.value += 0.000004;
      arrival.planetD = D;
    } else if (pOn) {
      if (arrivalClass !== cls) {
        arrivalClass = cls; const c = PLANET[cls], k = PLANET_LOOK[cls] || PLANET_LOOK.dome;
        planetU.mode.value = k.mode; planetU.tint.value.set(k.tint); planetU.tint2.value.set(k.tint2); planetU.cloudMap.value = planetMaps[k.map];
        arrival.rim.material.uniforms.color.value.setRGB(...c.rim);
        arrival.debris.visible = cls === 'ruined';
      }
      planetU.sunDir.value.copy(lux.dirT); planetU.lightCol.value.set(starColor(targetInfo.sp));
      planetU.shift.value += 0.000004; arrival.body.rotation.y += cls === 'dome' ? 0 : 0.00012;   // захваченный мир не вращается относительно звезды
      const k = Math.max(0, Math.min(1, (A - y) / 2)), D = 2.4e7 * (1 + 150 * k * k);
      arrival.planet.position.copy(pivot).addScaledVector(arrivalAxes().planet, D);
      arrival.rim.material.uniforms.a.value = 1;
      arrival.planetD = D;
    } else arrival.planetD = 0;
  }

  // ---------------------------------------------------------------- блики объектива
  // По образцу THREE.Lensflare: у источника — лучистая звезда, на прямой от него через центр кадра — «призраки»
  // (шестиугольники диафрагмы, кольцо, диски с разным оттенком), вдоль — анаморфная полоса. Штатный Lensflare
  // проверяет перекрытие по буферу глубины — у нас глубина логарифмическая и две сцены, поэтому перекрытие
  // считаем сами: лучом до планеты (шар) и до корпуса корабля. Рисуется поверх кадра ортокамерой.
  let flareScene, flareCam, flareTexs;
  const flares = [], rayc = new THREE.Raycaster();
  function flareTexture(kind) {
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    const rg = (stops) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); stops.forEach(([o, col]) => gr.addColorStop(o, col)); return gr; };
    if (kind === 'burst') {                                    // лучи: 12 тонких и 6 длинных
      g.fillStyle = rg([[0, 'rgba(255,255,255,1)'], [0.08, 'rgba(255,255,255,0.7)'], [0.25, 'rgba(255,255,255,0.08)'], [1, 'rgba(255,255,255,0)']]);
      g.fillRect(0, 0, 128, 128);
      g.translate(64, 64);
      for (let k = 0; k < 18; k++) {
        const long = k % 3 === 0, L = long ? 64 : 40, w = long ? 1.4 : 0.9;
        g.rotate(Math.PI * 2 / 18);
        const lg = g.createLinearGradient(0, 0, L, 0); lg.addColorStop(0, 'rgba(255,255,255,0.9)'); lg.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = lg; g.beginPath(); g.moveTo(0, -w); g.lineTo(L, 0); g.lineTo(0, w); g.fill();
      }
    } else if (kind === 'hex') {                               // шестиугольник диафрагмы с мягким краем
      g.translate(64, 64); g.beginPath();
      for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2 + Math.PI / 6; g.lineTo(58 * Math.cos(a), 58 * Math.sin(a)); }
      g.closePath(); g.fillStyle = 'rgba(255,255,255,0.55)'; g.filter = 'blur(3px)'; g.fill();
      g.lineWidth = 3; g.strokeStyle = 'rgba(255,255,255,0.9)'; g.stroke();
    } else if (kind === 'ring') {                              // кольцо-гало
      g.fillStyle = rg([[0, 'rgba(255,255,255,0)'], [0.72, 'rgba(255,255,255,0)'], [0.84, 'rgba(255,255,255,0.8)'], [0.93, 'rgba(255,255,255,0)'], [1, 'rgba(255,255,255,0)']]);
      g.fillRect(0, 0, 128, 128);
    } else {                                                    // мягкий диск
      g.fillStyle = rg([[0, 'rgba(255,255,255,0.9)'], [0.55, 'rgba(255,255,255,0.45)'], [1, 'rgba(255,255,255,0)']]);
      g.fillRect(0, 0, 128, 128);
    }
    const t = new THREE.CanvasTexture(c); return t;
  }
  // элементы: t — доля пути от источника к зеркальной точке (0 — источник, 1 — центр кадра, 2 — напротив)
  const FLARE_ELEMS = [
    { tex: 'burst', size: 0.34, t: 0, op: 1.0, tint: null },
    { tex: 'disc', size: 0.05, t: 0.45, op: 0.36, tint: 0x9fd0ff },
    { tex: 'hex', size: 0.07, t: 0.7, op: 0.36, tint: 0xffc890 },
    { tex: 'hex', size: 0.13, t: 0.95, op: 0.22, tint: 0x80e0b0 },
    { tex: 'ring', size: 0.34, t: 1.15, op: 0.22, tint: 0xa0b8ff },
    { tex: 'disc', size: 0.035, t: 1.35, op: 0.45, tint: 0xff9a70 },
    { tex: 'hex', size: 0.2, t: 1.65, op: 0.17, tint: 0xc0a0ff },
    { tex: 'disc', size: 0.09, t: 1.95, op: 0.2, tint: 0x70c0ff }
  ];
  function buildFlares() {
    flareScene = new THREE.Scene(); flareCam = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1);
    flareTexs = { burst: flareTexture('burst'), hex: flareTexture('hex'), ring: flareTexture('ring'), disc: flareTexture('disc') };
    const quad = new THREE.PlaneGeometry(1, 1);
    for (let i = 0; i < 6; i++) {                               // до шести источников в кадре
      const f = { els: [], streak: null, occ: 1, occT: 1, tick: i };
      for (const e of FLARE_ELEMS) {
        const m = new THREE.Mesh(quad, new THREE.MeshBasicMaterial({ map: flareTexs[e.tex], transparent: true, depthTest: false, depthWrite: false,
          blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0 }));
        m.userData = e; m.visible = false; flareScene.add(m); f.els.push(m);
      }
      f.streak = new THREE.Mesh(quad, new THREE.MeshBasicMaterial({ map: flareTexs.disc, transparent: true, depthTest: false, depthWrite: false,
        blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0 }));
      f.streak.visible = false; flareScene.add(f.streak);
      flares.push(f);
    }
  }
  // луч из камеры: перекрыт ли источник планетой (шар) или корпусом
  const spheresBlocking = [];
  function occludedShip(from, dir, maxD) {
    for (const sp of spheresBlocking) {
      const oc = sp.c.clone().sub(from), b = oc.dot(dir); if (b < 0 || b > maxD) continue;
      if (oc.lengthSq() - b * b < sp.r * sp.r) return true;
    }
    rayc.set(from, dir); rayc.far = maxD; rayc.near = 0; rayc.camera = shipCam;   // спрайтам свечения нужна камера
    return rayc.intersectObject(ship, true).some(h => h.object.visible && h.object.material && !h.object.material.transparent);
  }
  // sources: [{ ndc, k, color, occluded() }] — ndc в координатах всего холста
  function drawFlares(sources, center) {
    const w = container.clientWidth || 1, h = container.clientHeight || 1, asp = w / h;
    flareCam.left = -asp; flareCam.right = asp; flareCam.updateProjectionMatrix();
    flares.forEach((f, i) => {
      const src = sources[i];
      if (src && (f.tick++ % 4 === 0)) f.occT = src.occluded ? (src.occluded() ? 0 : 1) : 1;
      f.occ += ((src ? f.occT : 0) - f.occ) * 0.25;                         // перекрытие гаснет за несколько кадров
      const on = src && src.k * f.occ > 0.004;
      f.els.forEach(m => { m.visible = !!on; }); f.streak.visible = !!on;
      if (!on) return;
      const S = new THREE.Vector2(src.ndc.x * asp, src.ndc.y), C = new THREE.Vector2(center.x * asp, center.y);
      const edge = Math.max(0, Math.min(1, (1.25 - Math.max(Math.abs(src.ndc.x), Math.abs(src.ndc.y))) / 0.35));
      const k = src.k * f.occ * edge, ang = Math.atan2(S.y - C.y, S.x - C.x);
      f.els.forEach(m => {
        const e = m.userData, P = S.clone().lerp(C, e.t);
        const sz = e.size * (e.t === 0 ? src.size || 1 : 1);
        m.position.set(P.x, P.y, 0); m.scale.set(sz, sz, 1); m.rotation.z = e.t === 0 ? ang * 0.35 : 0;
        m.material.color.set(e.tint === null ? src.color : e.tint);
        if (e.t !== 0 && src.color) m.material.color.lerp(new THREE.Color(src.color), 0.35);
        m.material.opacity = e.op * k * (e.t === 0 ? 1 : src.ghosts ?? 1);
      });
      f.streak.position.set(S.x, S.y, 0); f.streak.scale.set(0.9 * (src.size || 1), 0.012, 1);
      f.streak.material.color.set(src.color); f.streak.material.opacity = 0.7 * k * (src.streak ?? 1);
    });
    renderer.clearDepth();
    renderer.render(flareScene, flareCam);
  }

  function buildGlare() {
    const mk = (tex, k) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: 0xffffff, sizeAttenuation: false,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); sp.renderOrder = 3; shipScene.add(sp); return sp; };
    glare = mk(glareTexture(false)); streak = mk(glareTexture(true));
    tglare = mk(glareTexture(false)); tstreak = mk(glareTexture(true));
  }

  // ---------------------------------------------------------------- звёзды и маршрут
  function dotTexture(soft) {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'), grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(soft ? 0.25 : 0.18, 'rgba(255,255,255,.75)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }
  function starColor(sp) {
    const c = (sp || 'G')[0];
    return { O: 0x9bb0ff, B: 0xaabfff, A: 0xcad7ff, F: 0xf8f7ff, G: 0xfff4e8, K: 0xffd2a1, M: 0xffb56c, D: 0xdfe8ff, L: 0xc9704a, T: 0xa45a60 }[c] || 0xfff4e8;
  }
  function buildStars() {
    starsGroup = new THREE.Group();
    const tex = dotTexture(false);
    const n = stars.length + 1, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), size = new Float32Array(n);
    const all = [{ x: 0, y: 0, z: 0, sp: 'G2V', absmag: 4.83 }].concat(stars);
    all.forEach((s, i) => {
      pos.set([s.x, s.y, s.z], i * 3);
      const c = new THREE.Color(starColor(s.sp));
      col.set([c.r, c.g, c.b], i * 3);
      size[i] = Math.max(2.2, Math.min(9, 9.5 - 0.5 * (s.absmag == null ? 10 : s.absmag)));
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(size, 1));
    const mat = new THREE.ShaderMaterial({
      uniforms: { map: { value: tex }, ratio: { value: window.devicePixelRatio || 1 }, fade: { value: 1 } },
      vertexShader: `attribute float size; varying vec3 vC; uniform float ratio;
        void main(){ vC = color; gl_PointSize = size * ratio; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform sampler2D map; uniform float fade; varying vec3 vC;
        void main(){ vec4 t = texture2D(map, gl_PointCoord); gl_FragColor = vec4(vC * t.a, t.a) * fade; }`,
      vertexColors: true, transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending
    });
    catalogPts = new THREE.Points(geo, mat);
    starsGroup.add(catalogPts);
    // кольца расстояний в плоскости Галактики
    [5, 10, 20, 40, 60].forEach(r => {
      const pts = []; for (let i = 0; i <= 128; i++) { const t = i / 128 * Math.PI * 2; pts.push(new THREE.Vector3(r * Math.cos(t), r * Math.sin(t), 0)); }
      const ring = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: 0x1d3140, transparent: true, opacity: 0.8, depthTest: false }));
      distRings.push(ring); starsGroup.add(ring);
    });
    // маркер цели
    const ring = targetMark = new THREE.Sprite(new THREE.SpriteMaterial({ map: ringTexture(), color: 0xe7c68f, sizeAttenuation: false, depthTest: false, transparent: true }));
    ring.scale.set(0.05, 0.05, 1); ring.position.copy(T); starsGroup.add(ring);
    sectorMarks = new THREE.Group();
    (MI ? MI.sectorList() : []).forEach(n => {
      const st = stars.find(x => x.name === n), m = new THREE.Sprite(new THREE.SpriteMaterial({ map: ringTexture(), color: 0x8fb3c9, sizeAttenuation: false, depthTest: false, transparent: true, opacity: 0.7 }));
      m.scale.set(0.026, 0.026, 1); m.position.set(st.x, st.y, st.z); m.userData.name = n; sectorMarks.add(m);
    });
    starsGroup.add(sectorMarks);
    colonyMarks = new THREE.Group();
    (MI && MI.knownAtStart ? MI.knownAtStart() : []).forEach(o => {
      const st = stars.find(x => x.name === o.star); if (!st) return;
      const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: o.kind === 'trace' ? shapeTexture('diamond') : shapeTexture('square'), color: STATUS_COL[o.status],
        sizeAttenuation: false, depthTest: false, transparent: true }));
      m.scale.set(0.02, 0.02, 1); m.position.set(st.x, st.y, st.z); m.userData = o; colonyMarks.add(m);
    });
    starsGroup.add(colonyMarks);
    reqMarks = new THREE.Group(); starsGroup.add(reqMarks);              // кольца у звёзд заявок (голосование Совета)
    legacyMarks = new THREE.Group(); starsGroup.add(legacyMarks);
    // Карта сигнала бедствия: сфера света растёт из точки аварии со скоростью света (1 св. год за год),
    // базы вспыхивают, когда сигнал до них дошёл; линия рейса и метка спасателя — после вылета.
    distress = new THREE.Group();
    shell = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32), new THREE.ShaderMaterial({
      uniforms: { col: { value: new THREE.Color(0xff8a5c) }, fade: { value: 0 } },
      vertexShader: `varying vec3 vN; varying vec3 vV;
        void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform vec3 col; uniform float fade; varying vec3 vN; varying vec3 vV;
        void main(){ float r = 1.0 - abs(dot(normalize(vN), normalize(vV))); gl_FragColor = vec4(col * (0.04 + 0.9 * pow(r, 4.0)), 1.0) * fade; }`,
      transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide
    }));
    distress.add(shell);
    const mk = (col, sz) => { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: ringTexture(), color: col, sizeAttenuation: false, depthTest: false, transparent: true })); m.scale.set(sz, sz, 1); distress.add(m); return m; };
    incMark = mk(0xff7a4a, 0.034);
    for (let i = 0; i < 3; i++) baseMarks.push(mk(0x8fb3c9, 0.03));
    for (let i = 0; i < 2; i++) {                                         // рейсы: аппарат Перевала и парус Земли могут идти оба
      const L = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(1, 0, 0)]),
        new THREE.LineDashedMaterial({ color: 0xe7c68f, dashSize: 0.25, gapSize: 0.18, transparent: true, opacity: 0.8, depthTest: false }));
      distress.add(L); rescueLines.push(L); rescueMarks.push(mk(0xffe2a8, 0.022));
    }
    distress.visible = false;
    starsGroup.add(distress);
    starScene.add(starsGroup);

    // группа относительно корабля: маршрут, метка корабля, облако
    relGroup = new THREE.Group();
    const lineMat = c => new THREE.LineBasicMaterial({ color: c, depthTest: false, transparent: true });
    routeDone = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]), lineMat(0xe7c68f));   // через излом
    routeAhead = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]),
      new THREE.LineDashedMaterial({ color: 0x8fb3c9, dashSize: 0.12, gapSize: 0.08, depthTest: false, transparent: true, opacity: 0.8 }));
    relGroup.add(routeDone, routeAhead);
    marker = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTexture(true), color: 0xafd5bd, sizeAttenuation: false, depthTest: false, transparent: true }));
    marker.scale.set(0.03, 0.03, 1); relGroup.add(marker);
    scoutMark = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTexture(true), color: 0xe7c68f, sizeAttenuation: false, depthTest: false, transparent: true }));
    scoutMark.scale.set(0.018, 0.018, 1); scoutMark.visible = false; starsGroup.add(scoutMark);
    starScene.add(relGroup);

    // облако класса D2 на курсе к любой цели: частицы — вокруг центра группы, центр ставит cloudCenter по курсу
    const cloud = cloudGroup = new THREE.Group(), soft = dotTexture(true), rnd = mulberry(7);
    for (let i = 0; i < 90; i++) {
      // облако в кадре — как его восстанавливают приборы: плотный оранжевый газ и пыль
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: soft, color: new THREE.Color().setHSL(0.05 + rnd() * 0.035, 0.85, 0.3 + rnd() * 0.1),
        transparent: true, opacity: 0, depthTest: false, depthWrite: false }));   // обычное смешивание: густеет, не выгорая в жёлтый
      s.renderOrder = 5; s.userData.base = 0.14 + rnd() * 0.12;
      const r = 0.012 * Math.cbrt(rnd());
      s.position.copy(new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize().multiplyScalar(r));
      const sz = 0.004 + rnd() * 0.008; s.scale.set(sz, sz, 1);
      cloud.add(s);
    }
    cloud.userData.a = 0; cloud.visible = false;
    starsGroup.add(cloud);
  }
  // Край облака — место на пути, не год (правила v5, content CLOUD_X): вход в 0,1058 св. года от Солнца, на пути к любой
  // цели. Ядро — на 0,012 дальше края и на 0,006 в сторону от курса: корабль идёт через край. Курс — с поворотом, если он был
  const CLOUD_EDGE = 0.1058;
  function cloudCenter() {
    const x = CLOUD_EDGE + 0.012, p = pathPoint(x), d = pathPoint(x + 0.001).sub(p).normalize();
    return p.addScaledVector(new THREE.Vector3().crossVectors(d, new THREE.Vector3(0, 0, 1)).normalize(), 0.006);
  }
  // ---------------------------------------------------------------- Галактика, Кольцо, экспедиции
  // Координаты галактические, св. годы: +X к центру Галактики (~26 000 св. лет), +Z к северному полюсу.
  const GC = new THREE.Vector3(26000, 0, 0);
  const U_ = { galaxy: { value: 0 }, dust: { value: 0 }, ring: { value: 0 }, local: { value: 1 } };
  let galaxy, ringNet, pulses = [], expeditions = [], signal, hiLine, hiLink, net, trailGeo;
  function pointsMat(uAlpha, px, dark) {
    return new THREE.ShaderMaterial({
      uniforms: { alpha: uAlpha, ratio: { value: window.devicePixelRatio || 1 }, px: { value: px } },
      vertexShader: `attribute float size; varying vec3 vC; uniform float ratio; uniform float px;
        void main(){ vC = color; gl_PointSize = size * px * ratio; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: dark
        ? `uniform float alpha; varying vec3 vC;
           void main(){ vec2 d = gl_PointCoord - 0.5; float a = smoothstep(0.5, 0.0, length(d)) * alpha; gl_FragColor = vec4(vC, a); }`
        : `uniform float alpha; varying vec3 vC;
           void main(){ vec2 d = gl_PointCoord - 0.5; float a = pow(smoothstep(0.5, 0.0, length(d)), 1.6) * alpha; gl_FragColor = vec4(vC * a, a); }`,
      vertexColors: true, transparent: true, depthTest: false, depthWrite: false,
      blending: dark ? THREE.NormalBlending : THREE.AdditiveBlending
    });
  }
  function cloudOf(pos, col, size, uAlpha, px, dark) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    geo.setAttribute('size', new THREE.Float32BufferAttribute(size, 1));
    return new THREE.Points(geo, pointsMat(uAlpha, px, dark));
  }
  function gauss(r) { let u = 0, v = 0; while (!u) u = r(); v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  function buildGalaxy() {
    const r = mulberry(2026);
    const sunAng = Math.PI;                       // Солнце лежит на −X от центра
    // Рукава: логарифмические спирали с шагом ~12,5°; два главных ярче и плотнее двух слабых.
    const TAN = Math.tan(0.22), R0 = 3200;
    const ARMS = [{ off: 0, w: 1.0 }, { off: Math.PI / 2, w: 0.45 }, { off: Math.PI, w: 1.0 }, { off: 3 * Math.PI / 2, w: 0.45 }];
    const armPoint = (arm, R, across, h) => {
      const th = Math.log(R / R0) / TAN + arm.off + sunAng - 0.35;
      const c = new THREE.Vector3(GC.x + R * Math.cos(th), GC.y + R * Math.sin(th), h);
      // поперёк рукава: радиальное смещение даёт ширину и внутренний край для пыли
      return c.add(new THREE.Vector3(Math.cos(th), Math.sin(th), 0).multiplyScalar(across));
    };
    const S = { p: [], c: [], s: [] }, G = { p: [], c: [], s: [] }, D = { p: [], c: [], s: [] };
    const add = (L, v, c, sz) => { if (v.length() < 350) return; L.p.push(v.x, v.y, v.z); L.c.push(c[0], c[1], c[2]); L.s.push(sz); };
    const pickArm = () => { const x = r() * 3; return x < 1.2 ? ARMS[0] : x < 2.4 ? ARMS[2] : x < 2.7 ? ARMS[1] : ARMS[3]; };
    // к концу рукав сужается, редеет и тускнеет: последние ~20 тыс. св. лет из 46 (а не обрывается тупым концом)
    const taper = R => { const t = Math.max(0, Math.min(1, (R - R0 - 26000) / 20000)); return 1 - t * t * (3 - 2 * t); };
    // балдж с перемычкой: приглушённый, чтобы не выгорал в белое пятно; яркость растёт к ядру плавно
    for (let i = 0; i < 22000; i++) {
      const bar = 0.44, x = gauss(r) * 4000, y = gauss(r) * 1400, z = gauss(r) * 1000 * (1 - Math.min(1, Math.abs(x) / 9000) * 0.5);
      const v = new THREE.Vector3(x * Math.cos(bar) - y * Math.sin(bar), x * Math.sin(bar) + y * Math.cos(bar), z).add(GC);
      const w = (0.8 + r() * 0.2) * 0.4;
      add(S, v, [1.0 * w, 0.8 * w, 0.55 * w], 1.0 + r() * 1.0);
    }
    // ядро: компактное тёплое сгущение
    for (let i = 0; i < 2600; i++) {
      const v = new THREE.Vector3(gauss(r) * 700, gauss(r) * 450, gauss(r) * 350).add(GC), w = 0.4 + r() * 0.2;
      add(S, v, [1.0 * w, 0.86 * w, 0.66 * w], 1.2 + r() * 1.2);
    }
    // звёзды рукавов и межрукавья. Радиус — по экспоненциальному диску (шкала DISC_L): плотность спадает к краю плавно,
    // без обрыва на одном радиусе (раньше — равномерно до 46 тыс. св. лет, край читался резким кругом); точек вдвое
    // меньше — зерно уходит, яркость диска держит мягкое свечение ниже
    // поверхностная плотность ∝ exp(−R/L) → радиус точки распределён как R·exp(−R/L): R = −L·ln(u₁u₂) (ревью Codex:
    // простое exp(−R/L) стягивало почти половину точек к балджу)
    const DISC_L = 10000, DISC_MAX = 66000;
    const discR = () => { for (;;) { const R = -DISC_L * Math.log((1 - r()) * (1 - r())); if (R >= R0 && R < DISC_MAX) return R; } };
    // яркость к краю дополнительно тает; у ядра звёзды диска приглушены — иначе там, где диск плотнее всего, балдж выгорает
    const edge = R => { const t = Math.min(1, Math.max(0, (R - R0) / 9000)); return Math.exp(-Math.max(0, R - R0 - 34000) / 10000) * (0.5 + 0.5 * t * t * (3 - 2 * t)); };
    for (let i = 0; i < 48000; i++) {
      const R = discR(), h = gauss(r) * (260 + R * 0.005);
      const tp = taper(R), fe = edge(R);
      if (r() < 0.7 * (0.15 + 0.85 * tp)) {
        const arm = pickArm(), width = (900 + R * 0.025) * (arm.w > 0.5 ? 1 : 0.7) * (0.22 + 0.78 * tp);
        const v = armPoint(arm, R, gauss(r) * width, h);
        const b = arm.w * (0.75 + r() * 0.25) * (0.45 + 0.55 * tp) * fe;
        add(S, v, [0.72 * b + 0.15 * fe, 0.8 * b + 0.12 * fe, 1.0 * b], 1.0 + r() * 1.4 * arm.w);
      } else {
        const th = r() * Math.PI * 2, w = 0.5 * fe;
        const v = new THREE.Vector3(GC.x + R * Math.cos(th), GC.y + R * Math.sin(th), h);
        add(S, v, [1.1 * w, 1.06 * w, w], 0.8 + r() * 0.5);
      }
    }
    // мягкое свечение диска: крупные тусклые пятна по тому же экспоненциальному профилю — заполняют межзвёздную
    // «сетку» точек и растворяют край
    for (let i = 0; i < 1800; i++) {
      const R = discR(), th = r() * Math.PI * 2, fe = edge(R), b = 0.035 * fe;
      add(G, new THREE.Vector3(GC.x + R * Math.cos(th), GC.y + R * Math.sin(th), gauss(r) * 400), [0.62 * b, 0.66 * b, 0.8 * b], 30 + r() * 40);
    }
    // отрог Ориона: короткая перемычка между рукавами, на которой лежит Солнце
    for (let i = 0; i < 5000; i++) {
      const t = gauss(r) * 0.12, R = 26000 + t * 9000;
      const v = new THREE.Vector3(GC.x + R * Math.cos(sunAng + t * 0.9), GC.y + R * Math.sin(sunAng + t * 0.9), gauss(r) * 250);
      v.add(new THREE.Vector3(gauss(r), gauss(r), 0).multiplyScalar(500));
      add(S, v, [0.78, 0.84, 1.0], 0.9 + r() * 0.8);
    }
    // розовые области звездообразования по осям главных рукавов
    for (let i = 0; i < 1600; i++) {
      const arm = r() < 0.5 ? ARMS[0] : ARMS[2], R = R0 * 1.6 + r() * 40000, tp = taper(R);
      if (r() > tp) continue;
      add(S, armPoint(arm, R, gauss(r) * 500 * (0.3 + 0.7 * tp), gauss(r) * 150), [1.0, 0.45, 0.62], 2.2 + r() * 2);
    }
    // туманное свечение вдоль рукавов и ядра
    for (let i = 0; i < 2600; i++) {
      const arm = pickArm(), R = R0 + Math.pow(r(), 0.8) * 42000, tp = taper(R);
      const b = 0.05 * arm.w * (0.3 + 0.7 * tp);
      add(G, armPoint(arm, R, gauss(r) * 1400 * (0.35 + 0.65 * tp), gauss(r) * 300), [0.55 * b, 0.65 * b, 1.0 * b], 16 + r() * 22);
    }
    for (let i = 0; i < 500; i++) {
      const v = new THREE.Vector3(gauss(r) * 3500, gauss(r) * 2200, gauss(r) * 900).add(GC);
      add(G, v, [0.12, 0.09, 0.05], 28 + r() * 40);
    }
    // пылевые прожилки у внутреннего края главных рукавов: начинаются вдали от балджа (иначе ложатся на ядро чёрным
    // пунктиром), крупные мягкие пятна вместо бусин, к концу рукава сходят на нет вместе с ним
    for (let c = 0; c < 520; c++) {
      const arm = r() < 0.5 ? ARMS[0] : ARMS[2], Rc = R0 * 2.4 + Math.pow(r(), 0.9) * 38000, tp = taper(Rc);
      if (r() > tp) continue;
      const width = (900 + Rc * 0.025) * (0.22 + 0.78 * tp), n = 10 + Math.floor(r() * 24);
      for (let k = 0; k < n; k++) {
        const R = Rc + gauss(r) * 1400, fade = Math.min(1, (R - R0 * 2.2) / 3000);
        if (fade <= 0) continue;
        add(D, armPoint(arm, R, -width * (0.5 + gauss(r) * 0.22), gauss(r) * 120), [0.02, 0.016, 0.012], (6 + r() * 9) * fade);
      }
    }
    galaxy = new THREE.Group();
    galaxy.add(cloudOf(G.p, G.c, G.s, U_.galaxy, 1.0, false));
    galaxy.add(cloudOf(S.p, S.c, S.s, U_.galaxy, 1.25, false));
    galaxy.add(cloudOf(D.p, D.c, D.s, U_.dust, 1.0, true));
    starsGroup.add(galaxy);

    // Кольцо: станции вдоль рукава в радиусе ~14 000 св. лет от Солнца, связи с двумя-тремя ближайшими
    const st = [new THREE.Vector3()];
    while (st.length < 240) {
      const R = 26000 + gauss(r) * 5000, phi = sunAng + gauss(r) * 0.42, h = gauss(r) * 400;
      const p = new THREE.Vector3(GC.x + R * Math.cos(phi), GC.y + R * Math.sin(phi), h);
      if (p.length() < 14000 && p.length() > 60) st.push(p);
    }
    const sp = [], sc = [], ss = [], links = [];
    st.forEach((p, i) => { sp.push(p.x, p.y, p.z); const c = i ? [0.55, 0.95, 0.9] : [1, 0.85, 0.5]; sc.push(...c); ss.push(i ? 2.6 : 4); });
    st.forEach((p, i) => {
      const near = st.map((q, j) => [q.distanceTo(p), j]).filter(x => x[1] !== i).sort((a, b) => a[0] - b[0]).slice(0, i ? 2 : 4);
      near.forEach(([, j]) => { if (!links.some(l => (l[0] === j && l[1] === i))) links.push([i, j]); });
    });
    const lp = [];
    links.forEach(([a, b]) => lp.push(st[a].x, st[a].y, st[a].z, st[b].x, st[b].y, st[b].z));
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
    const fromSun = links.filter(l => l[0] === 0 || l[1] === 0).map(l => st[l[0] === 0 ? l[1] : l[0]]).sort((a, b) => b.length() - a.length());
    const far = fromSun[0] || st[1];
    hiLink = { b: far, len: far.length() };
    hiLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), far]),
      new THREE.LineBasicMaterial({ color: 0xe7c68f, transparent: true, opacity: 0.95, depthTest: false }));
    hiLine.visible = false; starsGroup.add(hiLine);
    const netMat = new THREE.ShaderMaterial({ uniforms: { alpha: U_.ring },
      vertexShader: 'void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform float alpha; void main(){ gl_FragColor = vec4(vec3(0.35,0.75,0.72) * alpha * 0.45, alpha * 0.45); }',
      transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending });
    ringNet = new THREE.Group();
    ringNet.add(new THREE.LineSegments(lg, netMat));
    const pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    pg.setAttribute('color', new THREE.Float32BufferAttribute(sc, 3));
    pg.setAttribute('size', new THREE.Float32BufferAttribute(ss, 1));
    ringNet.add(new THREE.Points(pg, pointsMat(U_.ring, 1.0)));
    // Сигналы: эстафета от узла к узлу с одной скоростью, короткий шлейф.
    // Скорость условная (показ); подпись связи называет настоящие сроки.
    const adj = st.map(() => []);
    links.forEach(([a, b], k) => { adj[a].push(k); adj[b].push(k); });
    const pulseTex = dotTexture(true);
    net = { st, links, adj, r };
    const NP = 36;
    trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(NP * 6), 3));
    trailGeo.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(NP * 6), 3));
    ringNet.add(new THREE.LineSegments(trailGeo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true,
      depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending })));
    for (let i = 0; i < NP; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: pulseTex, color: 0xb8fff2, sizeAttenuation: false, depthTest: false, transparent: true, blending: THREE.AdditiveBlending }));
      s.scale.set(0.008, 0.008, 1);
      const from = i < 8 ? 0 : Math.floor(r() * st.length);          // часть сигналов уходит с Земли
      const k = adj[from][Math.floor(r() * adj[from].length)];
      s.userData = { k, from, t: r() * 0.9 };
      pulses.push(s); ringNet.add(s);
    }
    starsGroup.add(ringNet);

    // Экспедиции Земли: тридцать с лишним маршрутов к реальным звёздам каталога
    const pick = stars.filter(s => s.d > 4 && s.d < 45 && s.name !== targetInfo.star);
    const rr = mulberry(32);
    for (let i = 0; i < 34 && pick.length; i++) {
      const s = pick.splice(Math.floor(rr() * pick.length), 1)[0];
      addExpedition(new THREE.Vector3(s.x, s.y, s.z), 0.1 + rr() * 0.8, 0xe7c68f, 0.35, rr() * 0.004);
    }
    // тридцать вторая: дошла до цели и замолчала
    addExpedition(T.clone(), 1.0, 0xef8f7a, 0.8, 0);
    // сигнал от цели к Земле
    signal = new THREE.Sprite(new THREE.SpriteMaterial({ map: pulseTex, color: 0xffe7a8, sizeAttenuation: false, depthTest: false, transparent: true, blending: THREE.AdditiveBlending }));
    signal.scale.set(0.03, 0.03, 1); signal.visible = false; starsGroup.add(signal);
  }
  function addExpedition(to, f, color, opacity, v) {
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), to]),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthTest: false }));
    const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTexture(true), color, sizeAttenuation: false, depthTest: false, transparent: true }));
    m.scale.set(0.014, 0.014, 1);
    m.userData = { to, f, v };
    starsGroup.add(line, m);
    expeditions.push({ line, m });
  }
  const TMP = new THREE.Vector3();
  function animateNet(dt, now) {
    const VIS_C = 260;                               // св. лет в секунду показа
    const tp = trailGeo.attributes.position.array, tc = trailGeo.attributes.color.array;
    const ra = U_.ring.value;
    ringNet.visible = ra > 0.002;
    if (ringNet.visible) pulses.forEach((s, i) => {
      const u = s.userData, L = net.links[u.k];
      const a = net.st[u.from], b = net.st[L[0] === u.from ? L[1] : L[0]];
      const len = Math.max(1, a.distanceTo(b));
      u.t += VIS_C / len * dt;
      if (u.t >= 1) {                                 // эстафета: дальше по другой связи из узла прибытия
        const node = L[0] === u.from ? L[1] : L[0], opts = net.adj[node].filter(k => k !== u.k);
        u.from = node; u.k = opts.length ? opts[Math.floor(net.r() * opts.length)] : u.k; u.t = 0;
        return;
      }
      s.position.lerpVectors(a, b, u.t);
      const fade = Math.min(1, u.t * 8, (1 - u.t) * 8) * ra;
      s.material.opacity = fade;
      const tail = TMP.lerpVectors(a, b, Math.max(0, u.t - Math.min(0.35, 220 / len))), j = i * 6;
      tp[j] = tail.x; tp[j + 1] = tail.y; tp[j + 2] = tail.z;
      tp[j + 3] = s.position.x; tp[j + 4] = s.position.y; tp[j + 5] = s.position.z;
      tc[j] = tc[j + 1] = tc[j + 2] = 0; tc[j + 3] = 0.45 * fade; tc[j + 4] = 0.9 * fade; tc[j + 5] = 0.85 * fade;
    });
    if (ringNet.visible) { trailGeo.attributes.position.needsUpdate = true; trailGeo.attributes.color.needsUpdate = true; }
    expeditions.forEach(({ line, m }) => {
      const u = m.userData; u.f = Math.min(1, u.f + u.v * dt);
      m.position.copy(u.to).multiplyScalar(u.f);
      const a = U_.local.value; line.material.visible = m.visible = a > 0.02;
      const q = 1 - 0.7 * ep3.dim;                                        // ракурс вылета паруса эпохи III — рейсы Кольца тише
      m.material.opacity = a * q; line.material.opacity = (u.v === 0 && u.f === 1 ? 0.9 : 0.16) * a * q;
    });
    if (signal.visible) {
      const t = ((now / 1000) % 6) / 6;
      signal.position.copy(T).multiplyScalar(1 - t);
    }
  }
  // ---------------------------------------------------------------- парус эпохи III (сводка Кольца в начале Акта III)
  // Уходит с Земли по лучу лазерных станций: разгон, крейсерская 0,2c, торможение плазменным магнитом — сроки из
  // content (epoch3), те же, что у вести с Тёмной звезды. Корабль знает о вылете из сводки: раньше паруса на карте нет.
  // Ракурс сводки — показ вылета: камера долетает до Солнца и ждёт, пока читатель дойдёт до сводки (world.epoch3Go);
  // тогда парус уходит, камера идёт за ним, прочие рейсы Кольца приглушены. Время в кадре ускорено и к концу показа
  // догоняет год экрана; вне показа положение — по году (при перемотке парус летит).
  const ep3 = { g: null, mark: null, path: null, ahead: null, beam: null, D: 0, to: new THREE.Vector3(), key: '', show: null, x: 0, d: 0, dim: 0, lock: false };
  const EP3_SHOW = 9000;                                                  // мс показа вылета
  function buildEpoch3() {
    ep3.g = new THREE.Group(); ep3.g.visible = false;
    const line = mat => new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(1, 0, 0)]), mat);
    ep3.path = line(new THREE.LineBasicMaterial({ color: 0xd8f4ff, transparent: true, opacity: 0.5, depthTest: false }));
    ep3.ahead = line(new THREE.LineDashedMaterial({ color: 0xd8f4ff, dashSize: 0.2, gapSize: 0.14, transparent: true, opacity: 0.35, depthTest: false }));
    ep3.beam = line(new THREE.LineBasicMaterial({ color: 0x9fe8ff, transparent: true, opacity: 0, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending }));
    ep3.mark = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTexture(true), color: 0xe8f8ff, sizeAttenuation: false, depthTest: false, transparent: true }));
    ep3.mark.scale.set(0.026, 0.026, 1);
    [ep3.path, ep3.ahead, ep3.beam].forEach(l => { l.frustumCulled = false; });
    ep3.g.add(ep3.path, ep3.ahead, ep3.beam, ep3.mark);
    starsGroup.add(ep3.g);
  }
  function ep3Sync() {                                                    // звезда назначения — при смене сводки
    const e = world.epoch3, k = e ? `${e.star}|${e.launch}` : '';
    if (k === ep3.key) return;
    ep3.key = k; ep3.D = 0;
    const st = e && stars.find(x => x.name === e.star);
    if (st) { ep3.to.set(st.x, st.y, st.z); ep3.D = ep3.to.length(); }
  }
  // путь от Солнца за tau лет: разгон acc лет, крейсерская, торможение dec лет; дальше — у звезды
  function ep3X(tau, e) {
    const b = e.beta, a = e.acc, d = e.dec, D = ep3.D, xa = b * a / 2, xd = b * d / 2, tc = Math.max(0, (D - xa - xd) / b);
    if (tau <= 0) return 0;
    if (tau <= a) return Math.min(D, b * tau * tau / (2 * a));
    if (tau <= a + tc) return xa + b * (tau - a);
    const u = Math.min(d, tau - a - tc); return Math.min(D, xa + b * tc + b * u - b * u * u / (2 * d));
  }
  // годы от вылета в кадре: в показе отстают от года экрана на всю задержку сводки и догоняют его к концу показа
  function ep3Tau(now) {
    const e = world.epoch3, tau = world.year - e.launch, s = ep3.show, lagY = e.news - e.launch;
    if (!s) return Math.max(0, tau);
    if (s.t0 == null) return Math.max(0, tau - lagY);                    // камера ещё летит: парус у Земли
    const p = Math.min(1, (now - s.t0) / EP3_SHOW);
    return Math.max(0, tau - lagY * (1 - Math.sin(p * Math.PI / 2)));     // к концу — плавно, без остановки рывком
  }
  // ракурс показа: сбоку от луча, чуть сверху плоскости Галактики; Солнце справа (слева вверху — приборы), парус уходит влево.
  // В кадре и Солнце, и парус: фокус ближе к парусу, дистанция растёт с его удалением
  function ep3Frame(now) {
    const p = PRESETS.epoch3, e = world.epoch3; ep3Sync();
    if (!e || !ep3.D) return { F: new THREE.Vector3(), d: p.dist / LY, yaw: p.yaw, pitch: p.pitch, x: 0 };
    const D = ep3.to.clone().normalize(), x = ep3X(ep3Tau(now), e), pitch = p.pitch;
    let yaw = Math.atan2(D.y, D.x) + Math.PI / 2;
    const dir = new THREE.Vector3(Math.cos(pitch) * Math.cos(yaw), Math.cos(pitch) * Math.sin(yaw), Math.sin(pitch));
    if (D.dot(new THREE.Vector3().crossVectors(dir.negate(), ZUP)) > 0) yaw += Math.PI;
    return { F: D.multiplyScalar(0.55 * x), d: Math.max(p.dist / LY, 2.2 * x), yaw, pitch, x };
  }
  // камера идёт за парусом: фокус — по показу, дистанция — в той же пропорции (своё приближение колесом сохраняется).
  // Только если перелёт дошёл до кадра (ep3.lock): прерванный колесом или мышью — камера у игрока, парус летит без неё.
  // Сводки уже нет (вернулись назад, ракурс сменится с выдержкой) — камера стоит, без запасного кадра
  function followEpoch3(now) {
    if (!world.epoch3 || !ep3.D) return;
    if (ep3.show && ep3.show.t0 == null && world.epoch3Go !== false) ep3.show.t0 = now;   // сводку читают — парус уходит
    if (!ep3.lock) return;
    const f = ep3Frame(now);
    cam.F.copy(f.F);
    if (ep3.d > 0) cam.dist *= f.d / ep3.d;
    ep3.d = f.d;
  }
  function stepEpoch3(now, dly, dt) {
    ep3.dim += ((cam.focus === 'epoch3' && world.epoch3 ? 1 : 0) - ep3.dim) * (1 - Math.exp(-dt * 1.5));   // прочие рейсы Кольца на ракурсе вылета — тише
    const e = world.epoch3; ep3Sync();
    if (!e || !ep3.D) { ep3.g.visible = false; ep3.show = null; return; }
    if (ep3.show && cam.focus !== 'epoch3') ep3.show = null;             // камеру увели — показ кончился, парус по году
    if (ep3.show && ep3.show.t0 != null && now - ep3.show.t0 >= EP3_SHOW) ep3.show = null;
    const tau = ep3Tau(now), x = ep3.x = ep3X(tau, e), a = band(dly, 0.001, 0.005, 150, 300);
    ep3.g.visible = a > 0.003;
    if (!ep3.g.visible) return;
    const P = ep3.mark.position.copy(ep3.to).multiplyScalar(x / ep3.D);
    const set = (l, A, B) => { const g = l.geometry.attributes.position; g.setXYZ(0, A.x, A.y, A.z); g.setXYZ(1, B.x, B.y, B.z); g.needsUpdate = true; };
    const O = new THREE.Vector3();
    set(ep3.path, O, P); set(ep3.beam, O, P); set(ep3.ahead, P, ep3.to); ep3.ahead.computeLineDistances();
    // луч светит, пока толкает: включается с вылетом, гаснет за полгода после разгона
    const on = Math.min(1, tau / 0.05) * Math.max(0, Math.min(1, 1 - (tau - e.acc) / 0.6));
    ep3.mark.material.opacity = a; ep3.path.material.opacity = 0.6 * a; ep3.beam.material.opacity = 0.9 * on * a;
    ep3.beam.visible = on > 0.003; ep3.ahead.visible = x < ep3.D - 1e-6; ep3.ahead.material.opacity = 0.3 * a;
  }
  function ringTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'); g.strokeStyle = '#fff'; g.lineWidth = 3;
    g.beginPath(); g.arc(32, 32, 26, 0, Math.PI * 2); g.stroke();
    return new THREE.CanvasTexture(c);
  }
  function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  // ---------------------------------------------------------------- камера и ввод
  const PRESETS = {
    depart: { focus: 'ship', dist: 5200, yaw: 2.5, pitch: 0.22, pivot: -1400 },
    cloud: { focus: 'ship', dist: 6200, yaw: -2.75, pitch: 0.16, pivot: -1400 },
    stage: { focus: 'ship', dist: 7000, yaw: 1.75, pitch: 0.32, pivot: -1500 },
    drift: { focus: 'ship', dist: 1500, yaw: 2.3, pitch: 0.25, pivot: -230 },
    dock: { focus: 'ship', dist: 4600, yaw: 2.05, pitch: 0.28, pivot: -1400 },
    rings: { focus: 'ship', dist: 900, yaw: 2.6, pitch: 0.35, pivot: -130 },
    passing: { focus: 'ship', dist: 700, yaw: 1.2, pitch: 0.12, pivot: -60 },
    ship: { focus: 'ship', dist: 5200, yaw: 2.2, pitch: 0.3, pivot: -1400 },
    cargo: { focus: 'ship', dist: 900, yaw: 1.85, pitch: 0.42, pivot: -200 },
    route: { focus: 'route', dist: 15 * LY, yaw: 1.4, pitch: 1.05, pivot: -1400 },
    // карта цели заявки: тот же маршрут с другой стороны — цель слева, у её длинной подписи есть место до карточек
    targetRoute: { focus: 'route', dist: 15 * LY, yaw: 1.4 - Math.PI, pitch: 1.05, pivot: -1400 },
    target: { focus: 'target', dist: 0.8 * LY, yaw: 2.6, pitch: 0.35, pivot: -1400 },
    sun: { focus: 'sun', dist: 0.004 * LY, yaw: 0, pitch: 0, pivot: -1400, frame: 'galactic' },   // углы — от полюса эклиптики, ниже
    map: { focus: 'sun', dist: 95 * LY, yaw: 1.2, pitch: 1.0, pivot: -1400 },
    agenda: { focus: 'sun', dist: 46 * LY, yaw: 1.2, pitch: 0.95, pivot: -1400 },   // голосование Совета: все звёзды заявок вокруг Солнца
    sector: { focus: 'sector', dist: 33 * LY, yaw: 1.15, pitch: 0.32, pivot: -1400, frame: 'galactic' },   // сбоку от луча на сектор
    distress: { focus: 'distress', dist: 20 * LY, yaw: 1.3, pitch: 0.32, pivot: -1400, frame: 'galactic' },   // карта сигнала бедствия
    epoch3: { focus: 'epoch3', dist: 0.02 * LY, yaw: 1.3, pitch: 0.3, pivot: -1400, frame: 'galactic' },   // вылет паруса эпохи III: от Солнца за парусом
    // плазменный магнит: камера медленно отъезжает, пока в кадр не войдёт весь пузырь (дистанция — по его размеру)
    sail: { focus: 'ship', dist: 1.2e7, yaw: 1.95, pitch: 0.38, pivot: -1400, move: 6000, fit: 'bubble' },
    flip: { focus: 'ship', dist: 3000, yaw: 0.45, pitch: 0.28, pivot: -314 },   // взгляд — в центр масс: разворот посреди кадра
    dark: { focus: 'ship', dist: 2600, yaw: 0.75, pitch: 0.2, pivot: -700 },
    relic: { focus: 'ship', dist: 3600, yaw: 1.2, pitch: 0.3, pivot: -900 },
    arrival: { focus: 'ship', dist: 2600, yaw: 2.5, pitch: 0.16, pivot: -900, fit: 'arrival' },
    home: { focus: 'ship', dist: 3200, yaw: 2.5, pitch: 0.16, pivot: -900, fit: 'home' },
    shield: { focus: 'ship', dist: 950, yaw: 0.35, pitch: 0.22, pivot: -14, aim: 'shield' }   // осмотр щита: углы — от нормали щита
  };
  // направление камеры пресета в осях курса — к нему привязаны планета и находка, чтобы они стояли в кадре за кораблём
  const presetDir = (name) => { const p = PRESETS[name], cp = Math.cos(p.pitch);
    return U.clone().multiplyScalar(cp * Math.cos(p.yaw)).add(E2.clone().multiplyScalar(cp * Math.sin(p.yaw))).add(E3.clone().multiplyScalar(Math.sin(p.pitch))); };
  // корабль: орбита Земли в день отлёта + путь вдоль курса
  function shipPos() {
    const p = pathPoint(distLy(world.year)), A = world.arrive;
    // у ε Индейца: последние три года траектория плавно сходит к планете c (0,5 а.е. от звезды), а не к точке прямой
    if (A && tsysAx && targetInfo.star === EIND.name && world.year > A - 3) {
      const k = Math.min(1, (world.year - (A - 3)) / 3), sk = k * k * (3 - 2 * k), ar = tsysArrival();
      p.addScaledVector(tsysAx.C0.clone().add(cPos(Math.max(A, world.year))).sub(ar.end), sk);
    }
    return p;
  }
  // Свет звёзд. Освещённость: 127 000 лк на 1 а.е. от Солнца, падает как 1/d². Глаз и камера привыкают к темноте,
  // поэтому ключевой свет идёт по логарифму освещённости: 1 а.е. — полный день; ~700 а.е., где Солнце слабее
  // полной Луны (0,25 лк), — ноль. Это второй год пути. Дальше корабль освещают только свои прожекторы и окна колец.
  // У цели светит её звезда: цвет по спектральному классу, светимость по абсолютной величине; ближе зоны жизни
  // (√L а.е.) корабль не подходит. Ключ один и с тенями: между звёздами, где оба света на нуле, он сменяет направление.
  const LUX_1AU = 127000, LUX_OFF = 0.25;
  const adapt = E => Math.pow(Math.max(0, Math.min(1, Math.log10(Math.max(E, 1e-12) / LUX_OFF) / Math.log10(LUX_1AU / LUX_OFF))), 1.3);
  const KEY = new THREE.Vector3(1, 0, 0), keyTo = new THREE.Vector3(), SUN_COL = new THREE.Color(0xfff4e6), tgtCol = new THREE.Color();
  const lux = { sun: LUX_1AU, tgt: 0, auSun: 1, auT: 1e9, lumT: 1, dirT: new THREE.Vector3(), own: 0 };
  function starLux() {
    const sp = shipPos();
    lux.auSun = Math.max(0.3, sp.length() / AU_LY);
    lux.sun = LUX_1AU / lux.auSun ** 2;
    lux.dirT.copy(T).sub(sp); const dT = lux.dirT.length() / AU_LY; lux.dirT.normalize();
    lux.lumT = Math.pow(10, (4.83 - targetInfo.absmag) / 2.5);
    lux.auT = Math.max(dT, Math.sqrt(lux.lumT));
    lux.tgt = LUX_1AU * lux.lumT / lux.auT ** 2;
  }
  function aimLights(k = 1) {
    SUN.lerp(sunDirNow(), k).normalize();
    earthU.sunDir.value.copy(SUN);
    starLux();
    const E = lux.sun + lux.tgt, wt = lux.tgt / E, a = adapt(E);
    keyTo.copy(SUN).multiplyScalar(1 - wt).addScaledVector(lux.dirT, wt).normalize();
    KEY.lerp(keyTo, k).normalize();
    tgtCol.set(starColor(targetInfo.sp));
    sunLight.color.copy(SUN_COL).lerp(tgtCol, wt);
    sunLight.intensity = 3.4 * a;
    hemi.intensity = 0.04 + 0.21 * a;                  // рассеянный — от звезды; вдали остаётся лишь звёздный фон
    lux.own = 1 - 0.85 * a;                            // привыкание: чем темнее снаружи, тем заметнее свои огни
    floods.forEach(f => { f.intensity = f.userData.base * lux.own; });
    windowMat.color.setRGB(1.0, 0.78, 0.5).multiplyScalar((0.25 + 0.95 * lux.own) * (world.wreck ? 0.03 : world.dark === 'empty' ? 0.2 : world.dark === 'sleep' ? 0.45 : 1));
    const c = shipLocal(-1400);
    sunLight.target.position.copy(c);
    sunLight.position.copy(c).addScaledVector(KEY, 4500);
  }
  // Свои огни: прожекторы на тыльной кромке щита светят назад вдоль корпуса, два на корме — вперёд;
  // окна жилых колец (болванки). Прожекторы горят всегда; заметны, когда гаснет Солнце.
  const floods = [];
  let hemi, windowMat;
  function buildOwnLights() {
    const spot = (from, to, base, angle) => {
      const l = new THREE.SpotLight(0xfff1dc, 0, 1400, angle, 0.7, 1);
      l.position.copy(from); l.target.position.copy(to); l.userData.base = base;
      ship.add(l, l.target); floods.push(l);
    };
    for (let k = 0; k < 4; k++) {
      const a = Math.PI / 4 + k * Math.PI / 2, c = Math.cos(a), sn = Math.sin(a);
      spot(new THREE.Vector3(-34, 160 * c, 160 * sn), new THREE.Vector3(-260, 70 * c, 70 * sn), 1.9, 0.55);
    }
    spot(new THREE.Vector3(-372, 52, 0), new THREE.Vector3(-200, 150, 0), 1.3, 0.6);
    spot(new THREE.Vector3(-372, -52, 0), new THREE.Vector3(-200, -150, 0), 1.3, 0.6);
    windowMat = new THREE.MeshBasicMaterial({ color: 0xffc780 });
    const geo = new THREE.BoxGeometry(2.2, 1.2, 5), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    rings.forEach(g => {
      const N = 72, lat = [-0.5, 0.5], inst = new THREE.InstancedMesh(geo, windowMat, N * lat.length);
      let i = 0;
      for (const b of lat) for (let j = 0; j < N; j++) {
        const t = (j + (b > 0 ? 0.5 : 0)) / N * Math.PI * 2, rr = 150 + 12.3 * Math.cos(b);
        e.set(t, 0, 0); q.setFromEuler(e);
        m.compose(new THREE.Vector3(12.3 * Math.sin(b), rr * Math.cos(t), rr * Math.sin(t)), q, new THREE.Vector3(1, 1, 1));
        inst.setMatrixAt(i++, m);
      }
      g.add(inst);
    });
  }
  const shipQTo = new THREE.Quaternion(), shipQBase = new THREE.Quaternion(), shipQWant = new THREE.Quaternion();
  // Поворот корпуса: плавный старт и остановка (без рывка в первый кадр), время — по углу: 180° за ~4,5 с.
  // Новая цель поворота — новый отрезок от текущей ориентации. До первого кадра ориентация ставится сразу.
  const rotQ = { from: new THREE.Quaternion(), to: new THREE.Quaternion(), t: 1, dur: 1 };
  function stepRotation(dt) {
    if (!shown) { ship.quaternion.copy(shipQTo); rotQ.to.copy(shipQTo); rotQ.t = 1; return; }
    if (rotQ.to.angleTo(shipQTo) > 1e-4) {
      rotQ.from.copy(ship.quaternion); rotQ.to.copy(shipQTo); rotQ.t = 0;
      rotQ.dur = Math.max(1.2, 4.5 * rotQ.from.angleTo(rotQ.to) / Math.PI);
    }
    if (rotQ.t >= 1) { ship.quaternion.copy(rotQ.to); return; }
    rotQ.t = Math.min(1, rotQ.t + dt / rotQ.dur);
    const k = rotQ.t, e = k * k * k * (k * (k * 6 - 15) + 10);
    ship.quaternion.copy(rotQ.from).slerp(rotQ.to, e);
  }
  const QFLIP = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI);   // кормой вперёд
  // Запуск зонда — событие, а не исчезновение груза: аппарат отходит от кормы толкателями, затем включает свой двигатель
  // и уходит вперёд по курсу. Показывается, когда запуск появился в партии на глазах (решение, перемотка); при загрузке
  // уже выпущенные зонды не запускаются заново. world.launches = [{ id, at }] — от интерфейса.
  const launch = { init: false, known: new Set(), live: [] };
  function spawnProbe(id) {
    const g = new THREE.Group(), mat = new THREE.MeshStandardMaterial({ color: 0xb87333, roughness: 0.4, metalness: 0.7 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 32, 16), mat); body.rotation.z = -Math.PI / 2; g.add(body);
    const nose = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 3.4, 11, 16), mat); nose.rotation.z = -Math.PI / 2; nose.position.x = 21.5; g.add(nose);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0x9cc8ff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0 }));
    glow.scale.set(60, 60, 1); glow.position.x = -20; g.add(glow);
    // после отделения зонд — сам по себе: летит по курсу на момент запуска, разворот корабля его не уводит
    ship.updateMatrixWorld(true);
    g.position.copy(ship.localToWorld(new THREE.Vector3(-368, 0, 100)));
    g.quaternion.copy(ship.quaternion);
    shipScene.add(g);
    launch.live.push({ id, g, glow, t: 0, v: 0, dir: new THREE.Vector3(1, 0, 0).applyQuaternion(ship.quaternion),
      side: new THREE.Vector3(0, 0, 1).applyQuaternion(ship.quaternion), out: 0 });
  }
  const dropProbe = p => { shipScene.remove(p.g); p.g.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); };
  function stepLaunches(dt) {
    const list = world.launches || [], ids = new Set(list.map(L => L.id));
    for (const id of [...launch.known]) if (!ids.has(id)) launch.known.delete(id);   // новая партия — зонды снова свои
    for (const p of launch.live.filter(p => !ids.has(p.id))) { dropProbe(p); p.t = 1e9; }   // и летящий зонд прежней партии убран
    if (!launch.init || !shown) { list.forEach(L => { if (world.year + 1e-6 >= L.at) launch.known.add(L.id); }); launch.init = shown; }
    else for (const L of list) if (!launch.known.has(L.id) && world.year + 1e-6 >= L.at) { launch.known.add(L.id); spawnProbe(L.id); }
    for (const p of launch.live) {
      p.t += dt;
      // 0–5 с: толкатели уводят вбок за габарит (щит — 172 м от оси), чтобы струя прошла мимо корабля; время в кадре ускорено;
      // затем двигатель — 20 м/с² (два g, малый аппарат); к 18 с — за два километра впереди, гаснет
      const out = 180 * Math.min(1, p.t / 5) ** 2 * (3 - 2 * Math.min(1, p.t / 5));
      p.g.position.addScaledVector(p.side, out - p.out); p.out = out;
      const burn = p.t > 5 ? Math.min(1, (p.t - 5) / 1.5) : 0;
      p.v += 20 * burn * dt;
      p.g.position.addScaledVector(p.dir, p.v * dt);
      p.glow.material.opacity = 0.9 * burn * Math.max(0, Math.min(1, (18 - p.t) / 3));
    }
    for (const p of launch.live.filter(p => p.t > 18 && p.t < 1e9)) dropProbe(p);
    launch.live = launch.live.filter(p => p.t <= 18);
  }
  // Гибель корабля: остов не исчезает — кувыркается и идёт дальше. Раскрутка плавная (без рывка), вращение — вокруг
  // центра масс (его держит placeShipAboutCom); обломки щита расходятся медленно и сами вращаются. Новая партия — всё убрано.
  const wreck = { t: 0, ang: 0, axis: new THREE.Vector3(0.35, 1, 0.55).normalize(), q: new THREE.Quaternion(), debris: null, ringK: 1 };
  function stepWreck(dt) {
    if (!world.wreck) {
      if (wreck.debris) { wreck.debris.forEach(d => { d.parent && d.parent.remove(d); d.geometry.dispose(); }); wreck.debris[0].material.dispose(); wreck.debris = null; }   // освободить память видеокарты
      wreck.t = 0; wreck.ang = 0; wreck.ringK += (1 - wreck.ringK) * (1 - Math.exp(-dt * 0.5)); return;
    }
    wreck.t += dt;
    const ramp = Math.min(1, wreck.t / 8), w = 0.07 * ramp * ramp * (3 - 2 * ramp);
    wreck.ang += w * dt;
    wreck.q.setFromAxisAngle(wreck.axis, wreck.ang);
    ship.quaternion.multiply(wreck.q);
    // кольца без питания крутятся дальше по инерции: в пустоте их тормозит лишь трение в подшипниках — месяцы
    if (!wreck.debris) {
      const mat = new THREE.MeshStandardMaterial({ color: 0x8a857c, roughness: 0.7, metalness: 0.2 });
      wreck.debris = [];
      for (let i = 0; i < 12; i++) {
        const h = k => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
        const m = new THREE.Mesh(new THREE.BoxGeometry(6 + 14 * h(1), 2 + 4 * h(2), 5 + 10 * h(3)), mat);
        m.position.copy(shipLocal(120 + 60 * h(4))).add(new THREE.Vector3(h(5) - 0.5, h(6) - 0.5, h(7) - 0.5).multiplyScalar(80));
        m.userData.v = new THREE.Vector3(h(8) - 0.5, h(9) - 0.5, h(10) - 0.5).normalize().multiplyScalar(4 + 10 * h(11));
        m.userData.w = new THREE.Vector3(h(12), h(13), h(14)).multiplyScalar(0.6);
        shipScene.add(m); wreck.debris.push(m);
      }
    }
    for (const d of wreck.debris) { d.position.addScaledVector(d.userData.v, dt); d.rotation.x += d.userData.w.x * dt; d.rotation.y += d.userData.w.y * dt; d.rotation.z += d.userData.w.z * dt; }
  }
  // Корабль поворачивается вокруг центра масс, а не вокруг носа модели. Ядро 34,9 тыс. т (центр ~−237 м:
  // щит, кольца, зал, трюм) и ступень торможения 24,1 тыс. т (~−425 м) → ~−314 м. Со ступенью разгона
  // (1,26 млн т топлива в баках ~−500…−1000 м) центр масс ~−760 м.
  const COM = new THREE.Vector3(), comTmp = new THREE.Vector3();
  let shipFarM = Infinity;                                               // расстояние камеры до корабля (прошлый кадр), м
  function placeShipAboutCom() {
    COM.set(world.separated ? -314 : -760, 0, 0);
    ship.position.copy(COM).applyQuaternion(shipQBase).sub(comTmp.copy(COM).applyQuaternion(ship.quaternion));
  }
  const shipLocal = (x) => new THREE.Vector3(x, 0, 0).applyQuaternion(ship.quaternion).add(ship.position);
  // Точка взгляда камеры у корабля: центр масс плюс смещение вдоль корпуса. Смещение догоняет поворот корпуса плавно,
  // а не жёстко: иначе на развороте камера ходит по кругу за точкой модели, и корабль в кадре крутится вокруг неё,
  // а не вокруг центра масс. При 180° смещение проходит через сам центр масс — корабль разворачивается посреди кадра.
  // Пока корпус поворачивается, точка взгляда стоит на месте: центр масс неподвижен в кадре, и видно, что корабль
  // крутится вокруг него. Если бы взгляд шёл за кормой, корабль в кадре вращался бы вокруг кормы.
  // Поворот кончился — взгляд переезжает к новой точке корпуса плавным отрезком (smootherstep), без рывка скорости.
  const pivOff = new THREE.Vector3(), pivWant = new THREE.Vector3(), pivFrom = new THREE.Vector3();
  let pivInit = false, pivCom = 0, pivLast = 0, pivTurn = false, pivGlide = 1;
  function camPivot(dt) {
    pivWant.set(world.wreck ? 0 : cam.pivot - COM.x, 0, 0).applyQuaternion(ship.quaternion);   // остов — взгляд в центр масс
    const now = performance.now(), turning = rotQ.t < 1;
    // камера вернулась к кораблю из дальнего ракурса — старое смещение не тянем
    if (!pivInit || now - pivLast > 500) { pivOff.copy(pivWant); pivInit = true; pivGlide = 1; }
    else {
      // отделение ступени сдвигает центр масс: точка взгляда остаётся на месте, смещение пересчитано
      if (COM.x !== pivCom) { const d = new THREE.Vector3(COM.x - pivCom, 0, 0).applyQuaternion(shipQBase); pivOff.sub(d); pivFrom.sub(d); }
      if (turning) pivGlide = 1;                                     // взгляд стоит
      else if (pivTurn) { pivFrom.copy(pivOff); pivGlide = 0; }      // поворот кончился — переезд
      if (!turning && pivGlide < 1) {
        pivGlide = Math.min(1, pivGlide + dt / 2.5);
        const k = pivGlide, e = k * k * k * (k * (k * 6 - 15) + 10);
        pivOff.copy(pivFrom).lerp(pivWant, e);
      } else if (!turning) pivOff.lerp(pivWant, 1 - Math.exp(-dt * 1.2));
    }
    pivTurn = turning;
    pivCom = COM.x; pivLast = now;
    return COM.clone().applyQuaternion(shipQBase).add(pivOff);      // центр масс там, где его держит placeShipAboutCom
  }
  const MI = window.M31Mission;
  function setTarget(name) {
    if (!name || name === targetInfo.star || !stars.some(s => s.name === name)) return;
    targetInfo = { star: name, ru: MI ? MI.nameOf(name, 'ru') : name, en: MI ? MI.nameOf(name, 'en') : name, ...starInfo(name) };
    const d = offsetDir();
    setFrame(name);
    if (cam.frame === 'ship') {                     // тот же взгляд в новых осях курса
      const a = frameAngles(d); cam.yaw = a.yaw; cam.pitch = a.pitch;
      if (tween) { tween.from = { F: cam.F.clone(), dist: cam.dist, yaw: cam.yaw, pitch: cam.pitch, pivot: cam.pivot, focus: tween.from.focus }; tween.t0 = performance.now(); }
    }
    shipQBase.setFromUnitVectors(new THREE.Vector3(1, 0, 0), U);   // корабль доворачивает за несколько секунд
    targetMark.position.copy(T);
    lastSp.set(NaN, 0, 0);
    if (!tween && cam.focus === 'ship') cam.F.copy(shipPos());
  }
  const SECTOR_C = new THREE.Vector3(7.259, -3.203, -8.825).multiplyScalar(0.85);   // середина сектора сигнала
  // колонии и следы: цвет — состояние по архиву Кольца (в подписи дублируется символом и текстом)
  const STATUS_COL = { viable: 0x6fd0c0, establishing: 0x8fc4ff, declining: 0xe0a858, dead: 0x9aa0a6, trace: 0xc3a4ff };
  const shapeTex = {};
  function shapeTexture(kind) {
    if (shapeTex[kind]) return shapeTex[kind];
    const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
    g.translate(32, 32); if (kind === 'diamond') g.rotate(Math.PI / 4);
    g.strokeStyle = '#fff'; g.lineWidth = 6; g.strokeRect(-17, -17, 34, 34);
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(-11, -11, 22, 22);
    return (shapeTex[kind] = new THREE.CanvasTexture(c));
  }
  const objStars = () => new Set((MI && MI.knownAtStart ? MI.knownAtStart() : []).map(o => o.star));
  let OBJ_STARS = null;
  // наследие прошлых партий: поселения спасённых — фиолетовое кольцо у звезды (перестраивается при смене мира)
  let legacyTex = null, legacyDirty = false;
  function updateLegacy() {
    if (!legacyDirty) return; legacyDirty = false;
    while (legacyMarks.children.length) { const m = legacyMarks.children[0]; legacyMarks.remove(m); m.material.dispose(); }
    const byStar = {};
    ((world.legacy && world.legacy.settled) || []).forEach(x => { byStar[x.star] = (byStar[x.star] || 0) + x.people; });
    if (!legacyTex) legacyTex = ringTexture();
    Object.entries(byStar).forEach(([name, people]) => {
      const st = stars.find(y => y.name === name); if (!st) return;
      const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: legacyTex, color: 0xc8a0ff, sizeAttenuation: false, depthTest: false, transparent: true }));
      m.scale.set(0.034, 0.034, 1); m.position.set(st.x, st.y, st.z); m.userData = { star: name, people }; legacyMarks.add(m);
    });
  }
  // базы спасателей: Земля — у Солнца, колонии — у своих звёзд
  function basePos(b) {
    if (b.id === 'earth') return new THREE.Vector3();
    const st = stars.find(x => x.name === MI.colony(b.id === 'pass' ? 'pass' : b.colony).star);
    return new THREE.Vector3(st.x, st.y, st.z);
  }
  const baseName = b => b.id === 'earth' ? TXT[lang].earthL : MI.colony(b.id === 'pass' ? 'pass' : b.colony)[lang];
  // В кадре — точка аварии, цель и совет, услышавший первым. Камера смотрит поперёк отрезка «авария — база»,
  // чуть сверху плоскости Галактики, так что база слева, а место под карточками справа остаётся за целью.
  function distressFrame() {
    const R = world.relief, p = PRESETS.distress; if (!R) return { F: SECTOR_C.clone(), d: 33, yaw: p.yaw, pitch: p.pitch };
    const P = new THREE.Vector3(...R.P), c = R.list.find(b => b.id === R.council) || R.list[0], B = basePos(c);
    const F = P.clone().lerp(B, 0.5), D = B.clone().sub(P), pitch = p.pitch;
    let yaw = p.yaw;
    if (Math.hypot(D.x, D.y) > 0.05) {
      yaw = Math.atan2(D.y, D.x) + Math.PI / 2;
      const dir = new THREE.Vector3(Math.cos(pitch) * Math.cos(yaw), Math.cos(pitch) * Math.sin(yaw), Math.sin(pitch));
      if (D.dot(new THREE.Vector3().crossVectors(dir.clone().negate(), ZUP)) > 0) yaw += Math.PI;
    }
    return { F, d: Math.max(6, 2.1 * D.length()), yaw, pitch };
  }
  function focusPoint(kind) {
    if (kind === 'sector') return SECTOR_C.clone();
    if (kind === 'distress') return distressFrame().F;
    if (kind === 'epoch3') return ep3Frame(performance.now()).F;
    if (kind === 'ship') return shipPos();
    if (kind === 'target') return T.clone();
    if (kind === 'route') return T.clone().multiplyScalar(0.5);
    return new THREE.Vector3();
  }
  // Углы камеры в новой системе отсчёта для того же направления взгляда: смена осей без скачка.
  function frameAngles(d) {
    if (cam.frame === 'galactic') return { yaw: Math.atan2(d.y, d.x), pitch: Math.asin(Math.max(-1, Math.min(1, d.z))) };
    return { yaw: Math.atan2(d.dot(E2), d.dot(U)), pitch: Math.asin(Math.max(-1, Math.min(1, d.dot(E3)))) };
  }
  function go(name, instant, dur) {
    const p = PRESETS[name]; if (!p) return;
    goLog.push([Math.round(performance.now()), name, !!instant]); if (goLog.length > 60) goLog.shift();   // отладка: журнал перелётов
    if (name === 'epoch3') { ep3.show = world.epoch3 ? { t0: null } : null; ep3.d = 0; ep3.lock = !!instant; }   // показ вылета — с начала, когда камера долетит
    const d = offsetDir();
    cam.frame = p.frame || 'ship';
    const a = frameAngles(d); cam.yaw = a.yaw; cam.pitch = a.pitch;
    const from = { F: cam.F.clone(), dist: cam.dist, yaw: cam.yaw, pitch: cam.pitch, pivot: cam.pivot, focus: cam.focus };
    cam.focus = p.focus;
    // маршрут целиком: масштаб по расстоянию до цели
    const dist = name === 'route' || name === 'targetRoute' ? T.length() * 1.55 * LY : p.fit === 'bubble' ? 4.2 * bubbleR()
      : name === 'target' && targetInfo.star === EIND.name ? 40 * AU_LY * LY : name === 'distress' ? distressFrame().d * LY
      : name === 'epoch3' ? ep3Frame(performance.now()).d * LY : p.dist;
    const to = { F: focusPoint(p.focus), dist, yaw: p.yaw, pitch: p.pitch, pivot: p.pivot };
    if (p.fit === 'arrival' || p.fit === 'home') Object.assign(to, arrivalLook(p.fit));
    if (name === 'distress') { const f = distressFrame(); to.yaw = f.yaw; to.pitch = f.pitch; }
    if (name === 'epoch3') { const f = ep3Frame(performance.now()); to.yaw = f.yaw; to.pitch = f.pitch; }
    shieldUI.on = p.aim === 'shield';                                     // осмотр — только в ракурсе щита
    if (p.aim === 'shield') { Object.assign(to, shieldAngles()); to.aim = 'shield'; }
    if (name === 'target' && tsysAx && targetInfo.star === EIND.name) Object.assign(to, frameAngles(tsysAx.n.clone().multiplyScalar(0.8).addScaledVector(tsysAx.p1, 0.6).normalize()));
    cam.fit = p.fit === 'arrival' || p.fit === 'home' ? p.fit : null;
    if (instant) { Object.assign(cam, to, { F: to.F }); tween = null; viewUpInit = false; return; }   // мгновенно — и верх кадра заново
    let dy = to.yaw - from.yaw; while (dy > Math.PI) dy -= 2 * Math.PI; while (dy < -Math.PI) dy += 2 * Math.PI;
    to.yaw = from.yaw + dy;
    if (!dur) dur = p.move || Math.min(7000, Math.max(1600, 1200 + 380 * pathLength(from, to)));
    tween = { from, to, t0: performance.now(), dur, upFrom: camUp.clone(), upTo: cam.fit ? arrivalAxes().up : frameUp(cam.frame), fit: cam.fit };
    highlight(name);
  }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  // Перелёт с приближением и панорамой по оптимальному пути (van Wijk & Nuij, 2003):
  // смещение точки фокуса привязано к масштабу — цель не «пролетает» через кадр, как бы ни менялась дистанция.
  const RHO = 1.4;
  function zoomPath(c0, c1, w0, w1) {                     // c — точки фокуса, w — дистанции, всё в св. годах
    const u1 = c0.distanceTo(c1);
    if (u1 < 1e-9 * Math.min(w0, w1)) {                   // чистое приближение без панорамы
      const L = Math.log(w1 / w0);
      return { S: Math.abs(L) / RHO, u1: 0, u: () => 0, w: s => w0 * Math.exp(Math.sign(L) * RHO * s) };
    }
    const B = (wi, sg) => (w1 * w1 - w0 * w0 + sg * RHO ** 4 * u1 * u1) / (2 * wi * RHO * RHO * u1);
    const r0 = -Math.asinh(B(w0, 1)), r1 = -Math.asinh(B(w1, -1)), S = (r1 - r0) / RHO;
    const ch = Math.cosh(r0), sh = Math.sinh(r0);
    return { S, u1, u: s => w0 / (RHO * RHO) * (ch * Math.tanh(RHO * s + r0) - sh), w: s => w0 * ch / Math.cosh(RHO * s + r0) };
  }
  // тот же путь в «длине» S: из него выводится длительность перелёта
  function pathLength(a, b) { return zoomPath(a.F, b.F, a.dist / LY, b.dist / LY).S; }
  const wrapPi = x => { while (x > Math.PI) x -= 2 * Math.PI; while (x < -Math.PI) x += 2 * Math.PI; return x; };
  function stepTween(now) {
    if (!tween) { if (cam.focus === 'ship') cam.F.copy(shipPos()); else if (cam.focus === 'epoch3') followEpoch3(now); return; }
    const k = ease(Math.max(0, Math.min(1, (now - tween.t0) / tween.dur))), a = tween.from, b = tween.to;   // кадр мог начаться чуть раньше перелёта
    if (tween.fit) { const f = arrivalLook(tween.fit); b.yaw = a.yaw + wrapPi(f.yaw - a.yaw); b.pitch = f.pitch; tween.upTo = arrivalAxes().up; }   // звезда движется — ракурс вслед
    if (b.aim === 'shield') { const f = shieldAngles(); b.yaw = a.yaw + wrapPi(f.yaw - a.yaw); b.pitch = f.pitch; }   // корабль поворачивается — ракурс вслед
    if (cam.focus === 'ship') b.F = shipPos();
    if (cam.focus === 'ship' && a.focus === 'ship') {
      // с корабля на корабль фокус не отстаёт: корабль может двигаться во время промотки
      cam.F.copy(b.F); cam.dist = Math.exp(Math.log(a.dist) + (Math.log(b.dist) - Math.log(a.dist)) * k);
    } else {
      const P = zoomPath(a.F, b.F, a.dist / LY, b.dist / LY), sp = P.S * k;
      if (P.u1 > 0) cam.F.copy(a.F).lerp(b.F, Math.min(1, P.u(sp) / P.u1)); else cam.F.copy(b.F);
      cam.dist = P.w(sp) * LY;
    }
    cam.yaw = a.yaw + (b.yaw - a.yaw) * k; cam.pitch = a.pitch + (b.pitch - a.pitch) * k;
    cam.pivot = a.pivot + (b.pivot - a.pivot) * k;
    if (tween.upFrom) camUp.copy(tween.upFrom).lerp(tween.upTo, k).normalize();   // верх — по ходу перелёта
    if (k >= 1) { cam.dist = b.dist; tween = null; if (cam.focus === 'epoch3') ep3.lock = true; }   // долетели до вылета паруса — слежение
  }
  const ZUP = new THREE.Vector3(0, 0, 1);
  const camUp = E3.clone();
  function upVec() { return camUp; }
  // Верх кадра без закрутки у полюсов. Камера задана рысканием и наклоном и смотрит через lookAt; когда взгляд почти
  // совпадает с верхом осей (полюс), малое изменение рыскания поворачивало картинку вокруг оси взгляда — кадр крутило.
  // Теперь верх прошлого кадра переносится на новое направление взгляда и поворачивается к верху осей (camUp) тем
  // слабее, чем ближе взгляд к полюсу: вдали от полюса — ровно верх осей, как прежде; у полюса кадр не крутится,
  // при отходе от него плавно выравнивается. Смешивание — поворотом вокруг оси взгляда (устойчиво и при 180°).
  const viewUp = new THREE.Vector3(), vuPrev = new THREE.Vector3(), vuWant = new THREE.Vector3(), vuX = new THREE.Vector3();
  let viewUpInit = false;
  function stableUp(fwd, dt) {
    const up = upVec(), pole = Math.abs(up.dot(fwd));
    vuWant.copy(up).addScaledVector(fwd, -up.dot(fwd));                  // верх осей в плоскости кадра
    const hasWant = vuWant.lengthSq() > 1e-12; if (hasWant) vuWant.normalize();
    const x = Math.max(0, Math.min(1, (pole - 0.9) / 0.095)), w = 1 - x * x * (3 - 2 * x);   // 1 — далеко от полюса, 0 — у полюса
    vuPrev.copy(viewUp).addScaledVector(fwd, -viewUp.dot(fwd));          // прошлый верх, перенесённый на новый взгляд
    if (!viewUpInit || vuPrev.lengthSq() < 1e-12) {
      if (!hasWant) {                                                    // взгляд строго вдоль верха: наименее параллельная ось
        const a = Math.abs(fwd.x) <= Math.abs(fwd.y) && Math.abs(fwd.x) <= Math.abs(fwd.z) ? vuWant.set(1, 0, 0) : Math.abs(fwd.y) <= Math.abs(fwd.z) ? vuWant.set(0, 1, 0) : vuWant.set(0, 0, 1);
        a.addScaledVector(fwd, -a.dot(fwd)).normalize();
      }
      viewUp.copy(vuWant); viewUpInit = true; return viewUp;
    }
    vuPrev.normalize();
    if (!hasWant || w <= 0) return viewUp.copy(vuPrev);
    if (w >= 0.999) return viewUp.copy(vuWant);
    const ang = Math.atan2(vuX.crossVectors(vuPrev, vuWant).dot(fwd), vuPrev.dot(vuWant));
    return viewUp.copy(vuPrev).applyAxisAngle(fwd, ang * (1 - Math.exp(-dt * 10 * w * w)));   // по времени: у полюса медленно, дальше быстрее
  }
  // верх камеры идёт к верху текущих осей плавно: смена осей не даёт крена скачком
  function stepUp(dt) {
    if (tween && tween.upFrom) return;
    const target = cam.fit ? arrivalAxes().up : cam.frame === 'galactic' ? ZUP : E3;   // у цели верх кадра — от звезды
    camUp.lerp(target, 1 - Math.exp(-dt * 1.2)).normalize();
  }
  const frameUp = f => (f === 'galactic' ? ZUP : E3).clone();
  function offsetDir() {
    const cp = Math.cos(cam.pitch);
    if (cam.frame === 'galactic') return new THREE.Vector3(cp * Math.cos(cam.yaw), cp * Math.sin(cam.yaw), Math.sin(cam.pitch));
    return U.clone().multiplyScalar(cp * Math.cos(cam.yaw)).add(E2.clone().multiplyScalar(cp * Math.sin(cam.yaw))).add(E3.clone().multiplyScalar(Math.sin(cam.pitch)));
  }

  let dragging = false, lastInput = 0;
  function pick(e) {
    // панель щита: луч по кораблю, первым должен попасться щит (не корпус и не прозрачные факел и ореолы)
    if (api.onPartPick && world.shield && cam.focus === 'ship' && cam.dist < 2e4 && shieldUI.g) {
      const r0 = renderer.domElement.getBoundingClientRect();
      rayc.setFromCamera(new THREE.Vector2((e.clientX - r0.left) / r0.width * 2 - 1, -((e.clientY - r0.top) / r0.height) * 2 + 1), shipCam);
      rayc.near = 0; rayc.far = Infinity; rayc.camera = shipCam;
      const hit = rayc.intersectObject(ship, true).find(h => h.object.visible && h.object.isMesh && !(h.object.material && h.object.material.transparent));
      if (hit && hit.object.userData.panel) { api.onPartPick({ part: 'shield', panel: hit.object.userData.panel }); return; }
    }
    if (!api.onPick || cam.dist < 0.5 * LY) return;
    const r = renderer.domElement.getBoundingClientRect(), v = new THREE.Vector3();
    // звёзды сектора и подписанные ловятся с большего расстояния, чем фоновые
    let best = null, bestD = Infinity;
    for (const s of stars) {
      if (s.d > 30) continue;
      v.set(s.x, s.y, s.z).sub(cam.F).project(starCam);
      if (v.z > 1 || v.z < -1) continue;
      const px = (v.x + 1) / 2 * r.width + r.left, py = (1 - v.y) / 2 * r.height + r.top;
      const big = world.preview ? (world.requestStars || []).includes(s.name) : sectorNames.has(s.name);
      const d = Math.hypot(px - e.clientX, py - e.clientY) / (big ? 2 : LABELED.includes(s) ? 1.4 : 1);
      if (d < bestD && d < 12) { bestD = d; best = s.name; }
    }
    if (best) api.onPick(best);
  }
  function bindInput(el) {
    let drag = null;
    // перелёт обрывает только настоящее перетаскивание (сдвиг больше 4 пикселей), а не клик — клик выбирает панель щита
    el.addEventListener('pointerdown', e => { el.setPointerCapture(e.pointerId); drag = { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, live: false }; lastInput = performance.now(); el.classList.add('dragging'); });
    el.addEventListener('pointermove', e => {
      if (!drag) return;
      if (!drag.live) { if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 4) return; drag.live = true; dragging = true; tween = null; cam.fit = null; if (down) down.dragged = true; }
      cam.yaw -= (e.clientX - drag.x) * 0.006;
      cam.pitch = Math.max(-1.45, Math.min(1.45, cam.pitch + (e.clientY - drag.y) * 0.006));
      drag.x = e.clientX; drag.y = e.clientY;                         // признаки начала (x0, y0, live) сохраняются
    });
    let down = null;
    el.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
    const up = e => {
      drag = null; dragging = false; lastInput = performance.now(); el.classList.remove('dragging');
      if (e && e.type === 'pointerup' && down && !down.dragged && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 5 && performance.now() - down.t < 500) pick(e);
      down = null;
    };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    el.addEventListener('wheel', e => {
      e.preventDefault(); tween = null; lastInput = performance.now();
      cam.dist = Math.max(80, Math.min(160 * LY, cam.dist * Math.exp(e.deltaY * 0.0016)));
    }, { passive: false });
  }

  // ---------------------------------------------------------------- подписи и шкала
  const TXT = {
    ru: { ship: 'Корабль', route: 'Маршрут', target: 'Цель', sun: 'Солнце', map: 'Карта', hint: 'тянуть — вращать · колесо — масштаб',
      sunL: 'Солнце', gcL: 'центр Галактики', linkL: d => `${Math.round(d)} св. лет: вопрос идёт ${Math.round(d)} лет, ответ приходит через ${Math.round(2 * d)}`, targetL: 'цель', requestL: 'заявка', shipL: 'Сорок первая', scoutL: 'зонд', kits: { materials: 'материалы и запчасти', landing: 'расширенная посадка', probes: 'зонды-разведчики', ir: 'ИК-обсерватория', agro: 'второй агромодуль' }, cloudL: 'облако D2', scale: 'до камеры',
      sosL: 'сорок первая · сигнал бедствия', hearL: y => `сигнал — год ${y}`, rescuerL: 'спасатель', earthL: 'Земля', epoch3L: 'парус эпохи III · 0,2c',
      legacyL: n => `спасённые прошлой экспедиции · ${n}` },
    en: { ship: 'Ship', route: 'Route', target: 'Target', sun: 'Sun', map: 'Map', hint: 'drag — rotate · wheel — zoom',
      sunL: 'Sun', gcL: 'Galactic centre', linkL: d => `${Math.round(d)} ly: a question takes ${Math.round(d)} years, the answer comes after ${Math.round(2 * d)}`, targetL: 'target', requestL: 'request', shipL: 'Forty-First', scoutL: 'probe', kits: { materials: 'materials and spares', landing: 'extended landing kit', probes: 'scout probes', ir: 'IR observatory', agro: 'second agro module' }, cloudL: 'D2 cloud', scale: 'to camera',
      sosL: 'Forty-First · distress signal', hearL: y => `signal in year ${y}`, rescuerL: 'rescuer', earthL: 'Earth', epoch3L: 'epoch III sail · 0.2c',
      legacyL: n => `rescued by a past expedition · ${n}` }
  };
  function fmtDist(m) {
    const ru = lang === 'ru', f = (x, d) => ru ? x.toFixed(d).replace('.', ',') : x.toFixed(d);
    if (m < 1e4) return `${f(m, 0)} ${ru ? 'м' : 'm'}`;
    if (m < 1.5e11) return `${f(m / 1e3, m < 1e6 ? 1 : 0)} ${ru ? 'км' : 'km'}`;
    if (m < 0.05 * LY) return `${f(m / 1.496e11, 0)} ${ru ? 'а.е.' : 'AU'}`;
    return `${f(m / LY, m < LY ? 2 : 1)} ${ru ? 'св. года' : 'ly'}`;
  }
  function buildBar() {
    barEl.innerHTML = ['ship', 'route', 'target', 'sun', 'map'].map(k =>
      `<button type="button" data-go="${k}">${TXT[lang][k]}</button>`).join('') + `<span class="scale" id="spaceScale"></span><span class="hint">${TXT[lang].hint}</span>`;
  }
  function highlight(name) {
    barEl.querySelectorAll('[data-go]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.go === name)));
  }
  const sectorNames = new Set(MI ? MI.sectorList() : []);
  const LABELED = stars.filter(s => s.d < 9 || /Sirius|Procyon|Altair|Vega|Tau Ceti|61 Cygni/.test(s.name));
  let labelsHtml = '';
  function drawLabels() {
    const w = container.clientWidth, h = container.clientHeight, out = [];
    const put = (vecRel, text, cls) => {
      const v = vecRel.clone().project(starCam);
      if (v.z > 1 || v.z < -1 || Math.abs(v.x) > 1.05 || Math.abs(v.y) > 1.05) return;
      out.push(`<span class="l3 ${cls}" style="left:${((v.x + 1) / 2 * w).toFixed(1)}px;top:${((1 - v.y) / 2 * h).toFixed(1)}px">${text}</span>`);
    };
    const far = cam.dist > 0.02 * LY, dly = cam.dist / LY, galactic = dly > 300;
    const rel = p => p.clone().sub(cam.F);
    // корабль у самой цели на карте сигнала — одна подпись «цель · Сорок первая» вместо двух наложенных
    const shipAtT = distress.visible && shipPos().distanceTo(T) < 0.02 * cam.dist / LY;
    if (!galactic && !shipAtT && (far || cam.focus !== 'ship') && distLy(world.year) > 0.02 * cam.dist / LY) put(rel(shipPos()), TXT[lang].shipL, 'ship');
    drawSolarLabels(put, rel, dly);
    drawTargetLabels(put, rel, dly);
    if (dly > 3e-7 && !(distress.visible && world.relief.list.some(b => b.id === 'earth'))) put(rel(new THREE.Vector3()), TXT[lang].sunL, 'sun');
    if (!OBJ_STARS) OBJ_STARS = objStars();
    const tgtObj = colonyMarks.visible ? colonyMarks.children.find(m => m.userData.star === targetInfo.star) : null;
    const CC = window.M31Content;
    const localBase = distress.visible ? world.relief.list.find(b => b.id === 'local') : null;
    const tFree = world.preview && !world.inspect;                       // до выбора звезды цели нет: её подписывают как любую другую
    const tSuffix = world.preview ? ((world.requestStars || []).includes(targetInfo.star) ? ` · ${TXT[lang].requestL}` : '') : ` · ${shipAtT ? TXT[lang].shipL : TXT[lang].targetL}`;
    if (!galactic && (!world.preview || world.inspect)) put(rel(T), `${targetInfo[lang]}${tSuffix}`
      + (localBase ? ` · ${baseName(localBase)} · ${TXT[lang].hearL(Math.round(localBase.hear))}` : tgtObj && CC && !distress.visible ? ` · ${CC.archiveShort(tgtObj.userData, lang, world.year, true)}` : ''), 'target');
    // на карте сигнала бедствия подписи — у баз; здесь только метки
    if (colonyMarks.visible && CC && !distress.visible) colonyMarks.children.forEach(m => { const o = m.userData; if (o.star !== targetInfo.star || tFree) put(rel(m.position), CC.archiveShort(o, lang, world.year, true), 'colony st-' + o.status); });
    if (reqMarks.visible) reqMarks.children.forEach(m => { const n = m.userData.name; if ((n !== targetInfo.star || tFree) && !(colonyMarks.visible && OBJ_STARS.has(n))) put(rel(m.position), `${MI ? MI.nameOf(n, lang) : n} · ${TXT[lang].requestL}`, 'star'); });
    if (legacyMarks.visible) legacyMarks.children.forEach(m => put(rel(m.position), TXT[lang].legacyL(m.userData.people), 'legacy'));   // ниже звезды — сдвиг в CSS
    if (!galactic && far && scoutMark.visible) put(rel(scoutMark.position), TXT[lang].scoutL, 'ship');
    if (ep3.g && ep3.g.visible && ep3.x > 0.03 * dly) put(rel(ep3.mark.position), TXT[lang].epoch3L, 'ship');   // отошёл от Солнца — своя подпись
    if (galactic) { put(rel(GC), TXT[lang].gcL, 'star'); }
    if (hiLine && hiLine.visible) put(rel(hiLink.b.clone().multiplyScalar(0.5)), TXT[lang].linkL(hiLink.len), 'target');
    if (dly > 0.3 && dly < 150) LABELED.forEach(s => { if ((s.name !== targetInfo.star || tFree) && !sectorNames.has(s.name) && !(colonyMarks.visible && OBJ_STARS.has(s.name))) put(rel(new THREE.Vector3(s.x, s.y, s.z)), MI ? MI.nameOf(s.name, lang) : s.name, 'star'); });
    // на карте сигнала звезда базы подписана именем колонии — без повтора каталожного имени
    const baseStar = n => distress.visible && world.relief.list.some(b => b.id !== 'earth' && MI.colony(b.id === 'pass' ? 'pass' : b.colony).star === n);
    if (sectorMarks.visible) sectorMarks.children.forEach(m => { if ((m.userData.name !== targetInfo.star || tFree) && !baseStar(m.userData.name) && !(colonyMarks.visible && OBJ_STARS.has(m.userData.name))) put(rel(m.position), MI.nameOf(m.userData.name, lang), 'sector'); });
    if (distress.visible) drawDistressLabels(put, rel);
    if (world.cargoLabels && cam.focus === 'ship' && cam.dist < 4000) {
      const w2 = container.clientWidth, h2 = container.clientHeight;
      for (const [k, g] of Object.entries(cargo)) {
        if (!g.visible) continue;
        const v = g.userData.anchor.clone().applyMatrix4(ship.matrixWorld).project(shipCam);
        if (v.z > 1 || Math.abs(v.x) > 1 || Math.abs(v.y) > 1) continue;
        out.push(`<span class="l3 cargo" style="left:${((v.x + 1) / 2 * w2).toFixed(1)}px;top:${((1 - v.y) / 2 * h2).toFixed(1)}px">${TXT[lang].kits[k]}</span>`);
      }
    }
    if (shieldUI.on && world.shield && cam.focus === 'ship' && cam.dist < 4000) {
      const w2 = container.clientWidth, h2 = container.clientHeight, PS = { scarred: '•', patched: '▣', breached: '✕', new: '◇' };
      for (const p of world.shield.panels) {
        if (p.state === 'ok' && p.id !== world.shieldSel) continue;
        const m = shieldUI.panels[p.id]; if (!m) continue;
        const v = m.userData.c.clone().addScaledVector(m.userData.n, 2).applyMatrix4(m.matrixWorld).project(shipCam);
        if (v.z > 1 || Math.abs(v.x) > 1 || Math.abs(v.y) > 1) continue;
        out.push(`<span class="l3 spn st-${p.state}${p.id === world.shieldSel ? ' sel' : ''}" style="left:${((v.x + 1) / 2 * w2).toFixed(1)}px;top:${((1 - v.y) / 2 * h2).toFixed(1)}px">${PS[p.state] ? PS[p.state] + ' ' : ''}${p.id}</span>`);
      }
    }
    const html = out.join('');
    if (html !== labelsHtml) { labelsHtml = html; labelsEl.innerHTML = html; }
    const sc = document.getElementById('spaceScale');
    if (sc) sc.textContent = `${fmtDist(cam.dist)} ${TXT[lang].scale}`;
  }

  // ---------------------------------------------------------------- карта сигнала бедствия
  function stepDistress(dly) {
    const R = world.relief, a = R ? band(dly, 0.15, 0.6, 400, 800) : 0;
    distress.visible = a > 0.003;
    if (!distress.visible) return;
    const P = new THREE.Vector3(...R.P), age = world.year - R.sent;
    shell.visible = age > 0; shell.position.copy(P); shell.scale.setScalar(Math.max(1e-4, age));
    shell.material.uniforms.fade.value = a * 0.85;
    incMark.position.copy(P); incMark.material.opacity = a;
    baseMarks.forEach((m, i) => {
      const b = R.list[i]; m.visible = !!b; if (!b) return;
      const heard = world.year >= b.hear - 1e-6;
      m.position.copy(basePos(b)); m.material.color.set(heard ? 0xffc27a : 0x8fb3c9); m.material.opacity = a * (heard ? 1 : 0.55);
    });
    // рейсы: от базы к цели, после вылета; линия пересчитывается только при смене маршрута, метка — по доле пути
    const vs = R.voyages || [], key = vs.map(v => `${v.id}:${v.launch}:${v.arrive}`).join('|') + '|' + targetInfo.star;
    if (key !== voyKey) {
      voyKey = key;
      vs.forEach((v, i) => { const L = rescueLines[i]; if (!L) return; const B = basePos(v), pos = L.geometry.attributes.position;
        pos.setXYZ(0, B.x, B.y, B.z); pos.setXYZ(1, T.x, T.y, T.z); pos.needsUpdate = true; L.geometry.computeBoundingSphere(); L.computeLineDistances(); });
    }
    rescueLines.forEach((L, i) => {
      const v = vs[i], on = !!(v && world.year >= v.launch); L.visible = rescueMarks[i].visible = on;
      if (!on) return;
      const k = Math.max(0, Math.min(1, (world.year - v.launch) / Math.max(1e-6, v.arrive - v.launch))), sk = k * k * (3 - 2 * k);
      L.material.opacity = 0.8 * a; rescueMarks[i].position.copy(basePos(v)).lerp(T, sk); rescueMarks[i].material.opacity = a;
    });
  }
  function drawDistressLabels(put, rel) {
    const R = world.relief, L = TXT[lang];
    const P = new THREE.Vector3(...R.P);
    if (P.distanceTo(shipPos()) > 0.02 * cam.dist / LY) put(rel(P), L.sosL, 'target');   // корабль ушёл от точки сигнала — подписать её отдельно
    R.list.forEach(b => { if (b.id !== 'local') put(rel(basePos(b)), `${baseName(b)} · ${L.hearL(Math.round(b.hear))}`, 'sector'); });   // местная база — в подписи цели
    (R.voyages || []).forEach((v, i) => { if (rescueMarks[i] && rescueMarks[i].visible) put(rel(rescueMarks[i].position), `${L.rescuerL} · ${baseName(v)}`, 'ship'); });
  }

  // ---------------------------------------------------------------- кадр
  let last = performance.now();
  const lastSp = new THREE.Vector3(NaN, 0, 0);
  function frame(now, manual) {
    if (!manual) requestAnimationFrame(frame);
    if (!visible) { last = now; return; }
    // затянувшийся кадр (компиляция, загрузка) не должен давать скачка: часы перелёта на это время стоят
    if (now - last > 80 && tween) tween.t0 += now - last - 16;
    const dt = Math.max(0, Math.min(0.1, (now - last) / 1000)); last = now;   // не отрицательный: часы отладочной прокрутки могут уйти вперёд
    if (shiftTween) { const k = Math.min(1, (now - shiftTween.t0) / 900), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(2 - 2 * k, 2) / 2;
      viewShift = shiftTween.from + (shiftTween.to - shiftTween.from) * e; if (k >= 1) shiftTween = null; applyShift(); }
    stepTimeRate(dt);
    const turnK = 1 - Math.exp(-dt * 1.2);
    // Последние 4 года — кормой вперёд: двигатель ядра гасит остаток скорости. Порядок манёвра строгий:
    // магнит гаснет → корабль разворачивается → двигатель включается; назад — двигатель гаснет → разворот → магнит.
    // Пока магнит или двигатель работают, корабль не поворачивается (тяга во время поворота шла бы вбок).
    const A = world.arrive, lastLeg = A > 0 && world.year >= A - 4 - 1e-6;
    shipQWant.copy(shipQBase); if (lastLeg) shipQWant.multiply(QFLIP);
    const busy = pm.a > 0.08 || (engines[0] && engines[0].a > 0.05 && !lastLeg);
    if (!busy || !shown) shipQTo.copy(shipQWant);
    // корабль вне кадра (камера далеко и смотрит не на него — заставка, карта): поворот сразу, без анимации. Иначе новый
    // круг (корабль из прошлой партии развёрнут кормой вперёд), смена цели или разворот на карте доезжали бы в кадр
    // вторым движением: разворот и переезд точки взгляда сразу после перелёта камеры к кораблю
    if (shipFarM > 1e7 && cam.focus !== 'ship') { rotQ.to.copy(shipQTo); rotQ.t = 1; ship.quaternion.copy(shipQTo); }
    stepRotation(dt); stepShield(dt);
    stepWreck(dt);
    stepLaunches(dt);
    world.finalBurn = !world.wreck && lastLeg && world.year < A - 0.02 && ship.quaternion.angleTo(shipQWant) < 0.035;   // довернулся — меньше 2°
    placeShipAboutCom();
    aimLights(turnK);
    stepTween(now);
    stepUp(dt);
    // кольца: 2,4 об/мин, навстречу друг другу
    const w = 2.4 * 2 * Math.PI / 60 * wreck.ringK;
    rings.forEach(g => { g.rotation.x += g.userData.dir * w * dt; });
    // ступень разгона после отделения: отходит назад и уводится вбок (калибр — calc_life.py §8);
    // при промотке уходит быстрее, за кадром — прячется. Партия, загруженная позже, ступени уже не видит.
    if (world.separated) {
      world.sepT += dt;
      const p = Math.min(1, Math.max(world.sepT / 45, (world.year - 8) / 0.3));
      const sm = x => x * x * (3 - 2 * x);
      stage.position.set(-900 * sm(Math.min(1, p / 0.5)), p > 0.25 ? 3e6 * ((p - 0.25) / 0.75) ** 4 : 0, 0);
      stage.visible = p < 1;
    } else { world.sepT = 0; stage.position.set(0, 0, 0); stage.visible = true; }
    plume.visible = world.burning && !world.separated;
    if (engines.length > 1) { engines[0].on = !!world.finalBurn; engines[1].on = world.burning && !world.separated; }
    stepEngines(dt, now);
    stepPlasmaMagnet(dt, Number.isFinite(shipFarM) ? shipFarM : cam.dist);   // фактическая дальность камеры до корабля (прошлый кадр): тускнеет плавно при любом перелёте
    stepArrival();
    stepThaw(dt); stepOutpost(dt);
    // Облако на курсе: с Земли его не видно — маленькое и ничем не освещено. Появляется, когда его находят приборы
    // корабля на подлёте (год 4, world.cloudSeen), и проявляется плавно. Курс сменился (цель, поворот) — облако
    // переходит на новый курс плавно, без скачка; невидимое — сразу
    const cOn = world.cloudSeen, cg = cloudGroup, cWas = cg.visible;
    cg.userData.a += ((cOn ? 1 : 0) - cg.userData.a) * (1 - Math.exp(-dt * 0.5));
    cg.visible = cg.userData.a > 0.003;
    if (cg.visible) {
      const cc = cloudCenter();
      if (cWas) cg.position.lerp(cc, 1 - Math.exp(-dt * 0.8)); else cg.position.copy(cc);
      cg.children.forEach(sp => { sp.material.opacity = sp.userData.base * cg.userData.a; });
    }
    applyCargo();
    radMat.emissiveIntensity += ((world.separated ? 0.08 : 0.35) - radMat.emissiveIntensity) * (1 - Math.exp(-dt * 0.8));

    const dir = offsetDir();
    const vUp = stableUp(dir.clone().negate(), dt);                           // верх кадра (без закрутки у полюсов)
    // звёздная сцена: начало координат в точке фокуса
    const dly = cam.dist / LY, lg = Math.log10(Math.max(dly, 1e-12));
    const clamp01 = x => Math.max(0, Math.min(1, x));
    U_.galaxy.value = clamp01((lg - 2.2) / 1.0);
    U_.dust.value = 0.15 * clamp01((lg - 3.2) / 0.8);
    U_.ring.value = Math.max(shotRing, clamp01((lg - 2.8) / 0.8));
    U_.local.value = clamp01(1 - (lg - 2.2) / 0.8) * clamp01((lg + 2.0) / 1.0);   // у корабля (< 0,01 св. года) — скрыты
    galaxy.children[0].visible = galaxy.children[1].visible = U_.galaxy.value > 0.002;
    galaxy.children[2].visible = U_.dust.value > 0.002;
    animateNet(dt, now);
    fadeObj(targetMark, band(dly, 0, 0, 150, 300), 1);
    catalogPts.visible = dly < 400; catalogPts.material.uniforms.fade.value = band(dly, 0, 0, 200, 400);
    updateSolar(dly);
    updateTargetSystem(dly);
    const ringA = band(dly, 0.3, 2, 1e9, 1e9); distRings.forEach(r => fadeObj(r, ringA, 0.8));   // кольца расстояний — только на масштабе карты
    const secA = band(dly, 1.5, 4, 100, 200); sectorMarks.children.forEach(m => fadeObj(m, secA, 0.7)); sectorMarks.visible = secA > 0.003;
    stepDistress(dly);
    stepEpoch3(now, dly, dt);
    updateLegacy();
    const colA = band(dly, 1.5, 4, 100, 200);
    colonyMarks.children.forEach(m => fadeObj(m, colA, 0.95)); colonyMarks.visible = colA > 0.003;
    const rk = (world.requestStars || []).join('|');
    if (rk !== reqKey) { reqKey = rk;
      while (reqMarks.children.length) { const m = reqMarks.children[0]; reqMarks.remove(m); m.material.dispose(); }
      (world.requestStars || []).forEach(n => { const st = stars.find(x => x.name === n); if (!st) return;
        const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: reqTex || (reqTex = ringTexture()), color: 0xe7c68f, sizeAttenuation: false, depthTest: false, transparent: true, opacity: 0.75 }));   // текстура — общая
        m.scale.set(0.034, 0.034, 1); m.position.set(st.x, st.y, st.z); m.userData.name = n; reqMarks.add(m); }); }
    reqMarks.children.forEach(m => fadeObj(m, colA, 0.75)); reqMarks.visible = colA > 0.003 && reqMarks.children.length > 0;
    routeDone.visible = routeAhead.visible = !world.preview;              // до голосования курса нет
    targetMark.visible = !world.preview || !!world.inspect;              // и цели нет: кольцо — только у звезды, которую осматривают
    legacyMarks.children.forEach(m => fadeObj(m, colA, 0.9)); legacyMarks.visible = colA > 0.003 && legacyMarks.children.length > 0;
    if (!tween && cam.fit && !dragging) {                     // держим звезду и планету в кадре
      const f = arrivalLook(cam.fit), kk = 1 - Math.exp(-dt * 0.8);
      cam.yaw += wrapPi(f.yaw - cam.yaw) * kk; cam.pitch += (f.pitch - cam.pitch) * kk;
    } else if (!tween && !dragging && shieldUI.on) {         // осмотр щита: без дрейфа; корабль повернулся — ракурс за щитом
      if (now - lastInput > 2500) { const f = shieldAngles(), kk = 1 - Math.exp(-dt * 0.8); cam.yaw += wrapPi(f.yaw - cam.yaw) * kk; cam.pitch += (f.pitch - cam.pitch) * kk; }
    } else if (!tween && !dragging && now - lastInput > 2500) cam.yaw += (cam.focus === 'free' ? 0.012 : 0.0045) * dt;
    starsGroup.position.copy(cam.F).multiplyScalar(-1);
    const sp = shipPos();
    scoutMark.visible = world.scout > 0 && world.year >= world.scout;
    if (scoutMark.visible) scoutMark.position.copy(E0).addScaledVector(U, distLy(world.scout) + world.scoutV * (world.year - world.scout));
    relGroup.position.copy(sp).sub(cam.F);
    if (sp.x !== lastSp.x || sp.y !== lastSp.y || sp.z !== lastSp.z) {
      lastSp.copy(sp);
      const d = routeDone.geometry.attributes.position, a = routeAhead.geometry.attributes.position;
      const K = kneeOf(), kp = K ? K.P : E0;                             // пройденный путь — через точку поворота
      d.setXYZ(0, E0.x - sp.x, E0.y - sp.y, E0.z - sp.z); d.setXYZ(1, kp.x - sp.x, kp.y - sp.y, kp.z - sp.z); d.setXYZ(2, 0, 0, 0); d.needsUpdate = true;
      a.setXYZ(0, 0, 0, 0); a.setXYZ(1, T.x - sp.x, T.y - sp.y, T.z - sp.z); a.needsUpdate = true;
      routeDone.geometry.computeBoundingSphere(); routeAhead.geometry.computeBoundingSphere();
      routeAhead.computeLineDistances();
    }
    starCam.position.copy(dir).multiplyScalar(dly);
    starCam.up.copy(vUp); starCam.near = Math.max(dly * 1e-3, 1e-12); starCam.far = 1e6;
    starCam.lookAt(0, 0, 0); starCam.updateProjectionMatrix();
    // свечение корабля вдали: вблизи его нет (виден сам корабль), с отъездом проявляется, дальше сжимается в точку
    const camLy = cam.F.clone().addScaledVector(dir, dly), shipM = camLy.distanceTo(shipPos()) * LY;
    shipFarM = shipM;
    // на виде сбоку на пузырь магнита свечение слабее и меньше: не перекрывает пузырь и блики (pm.view)
    const pmK = 1 - 0.65 * (pm.view || 0);
    const mA = band(shipM, 4e4, 4e5, 1e30, 1e30) * pmK, mS = (0.005 + 0.085 * band(shipM, 4e5, 4e6, 3e7, 3e10)) * pmK;
    marker.scale.set(mS, mS, 1); fadeObj(marker, mA, 1);
    marker.material.color.set(engines.some(e => e.a > 0.2) ? 0x9cc8ff : 0xafd5bd);

    renderer.clear(); shown = true;
    renderer.render(starScene, starCam);
    // Корабль рисуется, пока он может быть в кадре, а не только при фокусе на нём: перелёт с корабля на маршрут или карту
    // уводит камеру плавно — корабль уменьшается и сменяется далёким огоньком (marker), а не пропадает в первом кадре.
    // Камера корабля стоит там же, где звёздная: смещение фокуса от корабля (cam.F − shipPos) — в метрах; при фокусе на
    // корабле оно нулевое, и ракурс прежний. Дальность dS — до корабля (плоскости отсечения, блики, пыль).
    if (shipM < 2e11) {
      const dS = cam.focus === 'ship' ? cam.dist : Math.max(1, shipM);
      const pivot = camPivot(dt);
      if (shieldUI.k > 0.001 && shieldUI.focus) {                 // осмотр щита: центр щита — в свободной части кадра (точку даёт интерфейс)
        const w = container.clientWidth || 1, h = container.clientHeight || 1, fwd = dir.clone().negate();
        const R = new THREE.Vector3().crossVectors(fwd, vUp).normalize(), Up = new THREE.Vector3().crossVectors(R, fwd);
        const m = 2 * dS * Math.tan(shipCam.fov * Math.PI / 360) / h;          // метров на пиксель у точки взгляда
        const dx = shieldUI.focus.x - (w / 2 - viewShift), dy = h / 2 - shieldUI.focus.y;
        pivot.addScaledVector(R, -dx * m * shieldUI.k).addScaledVector(Up, -dy * m * shieldUI.k);
      }
      shipCam.position.copy(dir).multiplyScalar(cam.dist).add(pivot).add(camOff.copy(cam.F).sub(shipPos()).multiplyScalar(LY));
      earthTilt.position.copy(helio(EARTH_PL, world.year)).sub(shipPos()).multiplyScalar(LY);
      const earthD = earthTilt.position.length();
      earthTilt.visible = earthD < 5e13; earthSpin.rotation.y += dt * 0.004;
      earth.material.uniforms.cloudShift.value += dt * 0.00012;
      atmoMesh.material.uniforms.center.value.copy(earthTilt.position);
      const near = Math.min(1, (4.2e7 / earthD) ** 2);
      rim.intensity = 0.35 * near; rim.position.copy(earthTilt.position).normalize();
      // блик Солнца: у Земли — слепящий, дальше — звезда среди звёзд
      const glareA = band(dS, 0, 0, 2e10, 1.5e11);
      // Ореол звезды — мягкий порог (soft knee), как у bloom: при экспоненциальном профиле I(r) = L·e^(−r/r0) видимый
      // радиус там, где яркость выше порога, R = r0·ln(L/T); у порога рост сглажен коленом K. Порог — тот же, на котором
      // гаснут блики (LUX_OFF): у оптики один порог. R нормирован на Солнце у Земли и ограничен вблизи звезды
      const GLOW_LN = Math.log(LUX_1AU / LUX_OFF), GLOW_K = 1.5, GLOW_MAX = 0.5;
      const glowR = E => { const x = Math.log(Math.max(E, 1e-30) / LUX_OFF), c = Math.max(0, Math.min(2 * GLOW_K, x + GLOW_K));
        return Math.min(1.6, Math.max(c * c / (4 * GLOW_K), x) / GLOW_LN); };
      const flare = (g, st, dir, E) => {
        const R = Math.max(0, glowR(E)), w = Math.min(1, R * GLOW_LN / GLOW_K) * adapt(E), gpos = shipCam.position.clone().addScaledVector(dir, 1e9);
        g.position.copy(gpos); st.position.copy(gpos);
        g.scale.set(GLOW_MAX * R, GLOW_MAX * R, 1); st.scale.set(1.8 * GLOW_MAX * R, 0.12 * GLOW_MAX * R, 1);
        fadeObj(g, glareA * w, 0.6); fadeObj(st, glareA * w, 0.45);         // та же адаптация, что у бликов: блики всегда ярче ореола
      };
      // направления бликов — от камеры (вне фокуса на корабле она смещена от него); освещение корабля — прежнее, от корабля
      const sunC = cam.focus === 'ship' ? SUN : glareDirS.copy(camLy).negate().normalize();
      const tgtC = cam.focus === 'ship' ? lux.dirT : glareDirT.copy(T).sub(camLy).normalize();
      flare(glare, streak, sunC, lux.sun);
      tglare.material.color.set(starColor(targetInfo.sp)); tstreak.material.color.copy(tglare.material.color);
      flare(tglare, tstreak, tgtC, lux.tgt);
      shipCam.up.copy(vUp); shipCam.near = Math.max(1, dS * 1e-3); shipCam.far = Math.max(dS * 10 + 2e4, earthTilt.visible ? dS + earthD + 1e7 : 0, arrival.planetD ? dS + arrival.planetD + 1e7 : 0, 2e9);
      shipCam.lookAt(camOff.copy(shipCam.position).sub(dir)); shipCam.updateProjectionMatrix();   // взгляд — по направлению камеры
      stepStreaks(dt, pivot, shipCam.position, dS);
      renderer.clearDepth();
      renderer.render(shipScene, shipCam);
      // блики: звёзды (Солнце, цель), горящий двигатель
      spheresBlocking.length = 0;
      if (earthTilt.visible) spheresBlocking.push({ c: earthTilt.position, r: EARTH_R * 1.01 });
      if (arrival.eind.tilt.visible) spheresBlocking.push({ c: arrival.eind.tilt.position, r: 6.371e6 * 1.01 });
      if (arrival.planet.visible) spheresBlocking.push({ c: arrival.planet.position, r: 6.4e6 });
      const src = [], cen = shipLocal(cam.pivot).project(shipCam);
      const starSrc = (dirv, E, color) => {
        const k = adapt(E) * glareA; if (k < 0.01) return;
        const v = shipCam.position.clone().addScaledVector(dirv, 1e9).project(shipCam); if (v.z > 1) return;
        src.push({ ndc: v, k: 0.9 * k, color, size: 1, occluded: () => occludedShip(shipCam.position, dirv, 1e12) });
      };
      starSrc(sunC, lux.sun, 0xfff0d8);
      starSrc(tgtC, lux.tgt, starColor(targetInfo.sp));
      for (const e of engines) {
        if (e.a < 0.03) continue;
        const wp = e.core.getWorldPosition(new THREE.Vector3()), v = wp.clone().project(shipCam); if (v.z > 1) continue;
        const toE = wp.clone().sub(shipCam.position), dE = toE.length(); toE.normalize();
        const far = band(dS, 0, 0, 3e4, 3e7);                                // вдали — меньше и тусклее
        src.push({ ndc: v, k: 0.75 * e.a * (0.35 + 0.65 * far), color: 0x7fb6ff, size: 0.45 + 0.55 * far, ghosts: 0.8,
          occluded: () => occludedShip(shipCam.position, toE, dE - e.r * 1.6) });
      }
      drawFlares(src, cen);
    } else if (marker.visible) {
      // корабль вдали — мягкая звезда без призраков
      const v = relGroup.position.clone().add(marker.position).project(starCam);
      if (v.z < 1) drawFlares([{ ndc: v, k: 0.3 * marker.material.opacity, color: marker.material.color.getHex(), size: 0.35, ghosts: 0.25, streak: 0.4 }],
        new THREE.Vector3(0, 0, 0).project(starCam));
      else drawFlares([], new THREE.Vector3());
    } else drawFlares([], new THREE.Vector3());
    drawLabels();
  }

  function resize() {
    const w = container.clientWidth || 1, h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    [starCam, shipCam].forEach(c => { c.aspect = w / h; });
    applyShift();
  }
  // карточки справа закрывают часть карты — центр кадра сдвигается в видимую часть (только камеры, без перестройки холста)
  function applyShift() {
    const w = container.clientWidth || 1, h = container.clientHeight || 1;
    [starCam, shipCam].forEach(c => { if (viewShift) c.setViewOffset(w, h, viewShift, 0, w, h); else c.clearViewOffset(); c.updateProjectionMatrix(); });
  }
  let viewShift = 0, shiftTween = null;
  api.setViewShift = function (px) {
    if (Math.abs(px - viewShift) < 1 && !shiftTween) return;
    shiftTween = { from: viewShift, to: px, t0: performance.now() };   // плавно, как и всё в кадре
  };

  // ---------------------------------------------------------------- API
  api.mount = function (el) {
    container = el;
    renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.autoClear = false;
    renderer.setClearColor(0x03060a, 1);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    el.appendChild(renderer.domElement);
    labelsEl = document.createElement('div'); labelsEl.className = 'labels3d'; el.appendChild(labelsEl);
    barEl = document.createElement('div'); barEl.className = 'spacebar'; el.appendChild(barEl);
    // ручной ракурс: сообщаем интерфейсу — его отложенная смена ракурса не перехватит камеру
    barEl.addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) { go(b.dataset.go); if (api.onManual) api.onManual(b.dataset.go); } });
    starScene = new THREE.Scene(); shipScene = new THREE.Scene();
    starCam = new THREE.PerspectiveCamera(45, 1, 1e-9, 1e4);
    shipCam = new THREE.PerspectiveCamera(45, 1, 1, 1e6);
    mats(); buildStars(); buildGalaxy(); buildEpoch3(); buildShip(); buildCargo(); buildEarth(); buildSolar(); buildStreaks();
    starScene.traverse(o => { if (o.material) o.material.toneMapped = false; });
    E0.copy(helio(EARTH_PL, 0));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    sunLight = new THREE.DirectionalLight(0xfff4e6, 3.4);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    Object.assign(sunLight.shadow.camera, { left: -1700, right: 1700, top: 1700, bottom: -1700, near: 10, far: 9000 });
    sunLight.shadow.bias = -0.0004; sunLight.shadow.normalBias = 2;
    rim = new THREE.DirectionalLight(0x86a8ff, 0);                  // отсвет Земли
    hemi = new THREE.HemisphereLight(0x8a9bb0, 0x1a1c22, 0.25);   // общий рассеянный свет
    shipScene.add(sunLight, sunLight.target, rim, hemi);
    ship.traverse(o => { if (o.isMesh && o.material && o.material.isMeshStandardMaterial) { o.castShadow = true; o.receiveShadow = true; } });
    buildOwnLights();
    buildPlasmaMagnet();
    buildArrival(); buildThawStore(); buildOutpost();
    buildTargetSystem();
    buildEind();
    buildGlare();
    buildFlares();
    SUN.copy(sunDirNow()); aimLights();
    bindInput(renderer.domElement);
    buildBar();
    new ResizeObserver(resize).observe(el); resize();
    // шейдеры Земли, атмосферы, облаков и корабля — компилируются заранее, а не в момент, когда попадают в кадр
    try { renderer.compile(starScene, starCam); renderer.compile(shipScene, shipCam); } catch (e) { /* не критично */ }
    requestAnimationFrame(frame);
    api.ok = true;
  };
  api.show = function (view, on) {
    visible = on !== false;
    if (visible && view) go(view, !shown);      // до первого кадра перелетать неоткуда — ставим ракурс сразу
  };
  api.hide = function () { visible = false; };
  api.debugJump = function (view) { go(view, true); };                 // отладка: ракурс без перелёта (снимки в скрытой панели)
  // отладка: где центр масс в кадре (−1…1) и как идёт поворот корпуса — проверка «поворот вокруг центра масс»
  api.debugView = function () { const c = COM.clone().applyQuaternion(shipQBase).project(shipCam); return { x: +c.x.toFixed(3), y: +c.y.toFixed(3), turn: +rotQ.t.toFixed(3), deg: +(ship.quaternion.angleTo(shipQBase) * 180 / Math.PI).toFixed(1), year: +world.year.toFixed(3), pm: +pm.a.toFixed(3), dist: Math.round(cam.dist), focus: cam.focus, arrive: world.arrive, tMag: world.tMag, probes: launch.live.map(p => Math.round(p.g.position.distanceTo(ship.position))) }; };
  const goLog = []; api.debugGoLog = () => goLog.slice();
  api.debugTick = function (ms) { let t = Math.max(last, performance.now()); const end = t + ms; while (t < end) { t += 16; frame(t, true); } };   // отладка: прокрутить кадры
  // Кадры заявочного плана: точка фокуса в св. годах, дистанция, ракурс, эффекты
  let shotRing = 0;
  api.shot = function (p) {
    visible = true;
    shotRing = p.ring || 0; signal.visible = !!p.signal; hiLine.visible = !!p.link;
    if (p.ship) { go(p.ship, false, p.move || 5000); return; }
    const d = offsetDir();
    cam.frame = p.frame || 'ship';
    const ang = frameAngles(d); cam.yaw = ang.yaw; cam.pitch = ang.pitch;   // смена осей без скачка
    const from = { F: cam.F.clone(), dist: cam.dist, yaw: cam.yaw, pitch: cam.pitch, pivot: cam.pivot };
    const F = p.F === 'target' ? T.clone() : p.F === 'sun' ? new THREE.Vector3() : new THREE.Vector3(...p.F);
    cam.focus = 'free'; cam.fit = null; shieldUI.on = false;               // кадр заставки — свой ракурс: слежение «у цели» и осмотр щита выключены
    const to = { F, dist: p.dist * LY, yaw: p.yaw, pitch: p.pitch, pivot: cam.pivot };
    let dy = to.yaw - from.yaw; while (dy > Math.PI) dy -= 2 * Math.PI; while (dy < -Math.PI) dy += 2 * Math.PI;
    to.yaw = from.yaw + dy;                                                 // поворот кратчайшим путём
    if (p.cut && (!shown || freshCut)) { Object.assign(cam, to); tween = null; freshCut = false; camUp.copy(frameUp(cam.frame)); viewUpInit = false; }   // начало круга — кадр, как при загрузке (и верх кадра сразу)
    else if (p.cut) tween = { from, to, t0: performance.now(), dur: 4500, upFrom: camUp.clone(), upTo: frameUp(cam.frame) };
    else tween = { from, to, t0: performance.now(), dur: p.move || 4000, upFrom: camUp.clone(), upTo: frameUp(cam.frame) };
    shotRing = p.ring || 0;
    signal.visible = !!p.signal;
    highlight('');
  };
  // новый круг (новый мир): сцена гаснет в чёрное (интерфейс), вступление начинается кадром, как при загрузке страницы —
  // без перелёта от корабля прошлой партии; состояние корабля — начальное, без доворотов и переездов взгляда
  let freshCut = false;
  api.resetVoyage = function () {
    freshCut = true; tween = null; cam.fit = null; shieldUI.on = false; viewUpInit = false; pivInit = false; world.sepT = 0; streaks.a = 0; pm.a = 0;
    viewShift = 0; shiftTween = null; applyShift();                       // сдвиг под карточки — сразу (заставка во весь экран), без скольжения
    engines.forEach(e => { e.a = 0; });
  };
  api.endShots = function () { shotRing = 0; signal.visible = false; hiLine.visible = false; };
  // отладка кадров: встать камерой так, чтобы за кораблём была Земля или Солнце
  // отладка плавности: состояние камеры в мировых осях звёздной сцены
  api.debugStore = function () { const c = thaw.g.position.clone().project(shipCam); return { store: world.store, vis: thaw.g.visible, a: +thaw.a.toFixed(3), dock: +thaw.dock.toFixed(3), dist: Math.round(thaw.g.position.distanceTo(shipCam.position)), scr: [+c.x.toFixed(2), +c.y.toFixed(2), +c.z.toFixed(3)] }; };
  api.debugEngines = function () {
    return engines.map(e => { const d = e.discMat; const disc = e.core.parent.children[0]; const wp = new THREE.Vector3(); disc.getWorldPosition(wp);
      return { a: e.a, on: e.on, uA: d.uniforms.a.value, visible: disc.visible, parentVisible: e.core.parent.visible, world: [wp.x, wp.y, wp.z].map(v => Math.round(v)), cam: [shipCam.position.x, shipCam.position.y, shipCam.position.z].map(v => Math.round(v)) }; });
  };
  api.debugState = function () {
    const d = offsetDir();
    return { dist: cam.dist, dir: [d.x, d.y, d.z], up: [camUp.x, camUp.y, camUp.z], viewUp: [viewUp.x, viewUp.y, viewUp.z], F: [cam.F.x, cam.F.y, cam.F.z], frame: cam.frame, focus: cam.focus, shift: viewShift, tween: !!tween,
      starNdc: (() => { const v = shipCam.position.clone().addScaledVector(lux.dirT, 1e9).project(shipCam); return [v.x, v.y, v.z]; })(),
      glare: tglare ? [tglare.visible, tglare.material.opacity, tglare.scale.x] : null,
      shipAt: shipPos().toArray().map(v => +v.toFixed(6)), targetAt: T.toArray(),
      preview: !!world.preview, routeVis: !!(routeAhead && routeAhead.visible), reqMarks: reqMarks ? reqMarks.children.length : 0,
      streaks: +streaks.a.toFixed(3), boost: +timeBoost().toFixed(2), yRate: +yRate.v.toFixed(3),
      ep3: world.epoch3 ? { x: +ep3.x.toFixed(4), show: ep3.show ? (ep3.show.t0 == null ? 'wait' : 'run') : null, vis: !!(ep3.g && ep3.g.visible), beam: ep3.beam ? +ep3.beam.material.opacity.toFixed(3) : 0 } : null,
      pmShell: pm.shell ? +pm.shell.material.uniforms.a.value.toFixed(3) : null, pmA: +pm.a.toFixed(3), pmView: +(pm.view || 0).toFixed(3), markerA: +marker.material.opacity.toFixed(3),
      fit: cam.fit, yawPitch: [cam.yaw, cam.pitch], fitTo: cam.fit ? arrivalLook(cam.fit) : null, tweenOn: !!tween,
      tw: tween ? { fromF: tween.from.F.toArray(), fromDist: tween.from.dist, fromFocus: tween.from.focus, toF: tween.to.F.toArray(), toDist: tween.to.dist, dur: tween.dur, age: performance.now() - tween.t0 } : null,
      planetNdc: arrival.eind && arrival.eind.tilt.visible ? (() => { const v = arrival.eind.tilt.position.clone().project(shipCam); return [v.x, v.y]; })() : null,
      light: { auSun: lux.auSun, sunLux: lux.sun, auT: lux.auT, tgtLux: lux.tgt, key: sunLight.intensity, own: lux.own, toTargetLy: T.distanceTo(shipPos()) } };
  };
  api.debugLook = function (what, dist) {
    if (PRESETS[what]) { go(what, true); if (dist) cam.dist = dist * LY; lastInput = performance.now() + 1e9; return; }
    if (what === 'stern') { cam.frame = 'ship'; cam.focus = 'ship'; const a2 = frameAngles(U.clone().negate().add(E2.clone().multiplyScalar(0.55)).add(E3.clone().multiplyScalar(0.3)).normalize());
      cam.yaw = a2.yaw; cam.pitch = a2.pitch; cam.dist = dist || 900; cam.pivot = -2950; tween = null; lastInput = performance.now() + 1e9; return; }
    const d = what.startsWith('sunward') ? SUN.clone().negate().applyAxisAngle(E3, Number(what.split(':')[1] || 0)) : what === 'star' ? lux.dirT.clone().negate() : EARTH_OFF.clone().negate().normalize();
    cam.frame = 'ship'; cam.focus = 'ship'; const a = frameAngles(d); cam.yaw = a.yaw; cam.pitch = a.pitch;
    if (dist) cam.dist = dist; cam.pivot = -300; tween = null; lastInput = performance.now() + 1e9;
  };
  // отладка: произвольный ракурс на корабль (снимки для концептов) — { dist, yaw, pitch, pivot } как в PRESETS
  api.debugCamera = function (p) { PRESETS.debugCamera = Object.assign({ focus: 'ship' }, p); go('debugCamera', true); lastInput = performance.now() + 1e9; };
  api.setWorld = function (w) {
    const { target, ...rest } = w;
    if ('legacy' in rest) { const k = JSON.stringify(rest.legacy || null); if (k !== legacyKey) { legacyKey = k; legacyDirty = true; } }
    Object.assign(world, rest); if (target) setTarget(target);
  };
  // осмотр щита: где на экране (px в контейнере) держать центр щита, чтобы его не закрывали карточки; null — по центру
  api.setShieldFocus = function (p) { if (p && isFinite(p.x) && isFinite(p.y)) shieldUI.focusT = { x: p.x, y: p.y }; };   // null — прежняя точка: сдвиг гаснет вместе с осмотром
  api.setLang = function (l) { if (l === lang) return; lang = l; if (barEl) buildBar(); };
})();
