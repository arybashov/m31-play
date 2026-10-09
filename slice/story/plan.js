// М31 · срез — сюжет: заявочный план. Сцены по порядку (движок идёт по массиву content.beats); собираются в content.js:
// Общих имён content.js этому акту не нужно — фабрика без них.
(function (root) {
  'use strict';
  const plan = () => {
    return [
    // ------------------------------------------------------------ ЗАЯВОЧНЫЙ ПЛАН
    {
      id: 'p.opening', kind: 'cinematic', scene: 'space',
      label: { ru: 'Заявочный план', en: 'Opening' },
      // F — точка фокуса в св. годах (галактические координаты), dist — в св. годах; ship — ракурс корабля
      shots: [
        { F: [13000, 0, 0], dist: 140000, yaw: -2.3, pitch: 1.2, frame: 'galactic', cut: true, dur: 6000, ru: '', en: '' },
        { F: [1500, 0, 0], dist: 32000, yaw: -2.0, pitch: 0.8, frame: 'galactic', move: 5500, ring: 1, dur: 6500,
          ru: 'Кольцо. Сеть цивилизаций.', en: 'The Ring. A network of civilisations.' },
        { F: [300, 0, 0], dist: 2600, yaw: -1.7, pitch: 0.6, frame: 'galactic', move: 5000, ring: 1, link: true, dur: 8500,
          ru: 'Между вопросом и ответом проходят жизни.', en: 'Lifetimes pass between a question and its answer.' },
        { F: 'sun', dist: 55, yaw: -1.0, pitch: 0.9, frame: 'galactic', move: 5000, dur: 6500,
          ru: 'Земные экспедиции.', en: "Earth's expeditions." },
        { ship: 'depart', dur: 7500, move: 6500, ru: '', en: '' },
        { ship: 'passing', dur: 7500, ru: 'Путь в один конец.', en: 'A one-way road.' }
      ]
    },

    ];
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = plan;
  else (root.M31Story = root.M31Story || {}).plan = plan;
})(typeof globalThis !== 'undefined' ? globalThis : this);
