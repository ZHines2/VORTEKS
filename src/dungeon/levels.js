// Location data for the descent. Each location has a handcrafted layout,
// palette, and an opponent quota; the exit unlocks once all are defeated.
// Layout legend: '#' wall, '.' floor, 'D' door, 'S' start, 'C' chest,
// 'E' opponent spawn (one per required opponent), 'X' exit.

export const LOCATIONS = [
  {
    id: 'gate', name: 'THE GATE', blurb: 'Cold stone. Something waits in the dark.',
    palette: { ivory: [232, 228, 216], accent: [110, 200, 255], warm: [255, 170, 90] },
    rows: [
      '###########',
      '#S..#C....#',
      '#.#.#.###.#',
      '#E#...#.#.#',
      '#.#####.#.#',
      '#...D...E.X',
      '###########'
    ],
    opponents: [{ kind: 'Bruiser' }, { kind: 'Doctor' }],
    hp: 12, booster: 0
  },
  {
    id: 'ash', name: 'HALL OF ASH', blurb: 'Embers drift through the colonnade.',
    palette: { ivory: [225, 190, 165], accent: [255, 110, 80], warm: [255, 210, 100] },
    rows: [
      '#############',
      '#S..E...#...#',
      '#.####.##.#.#',
      '#...D..E..#.#',
      '###.####.##.#',
      '#..E.....D..X',
      '#############'
    ],
    opponents: [{ kind: 'Trickster' }, { kind: 'Sicko' }, { kind: 'Bruiser' }],
    hp: 16, booster: 2
  },
  {
    id: 'core', name: 'THE CORE', blurb: 'The glyphs here are watching you.',
    palette: { ivory: [205, 170, 255], accent: [255, 90, 200], warm: [120, 255, 200] },
    rows: [
      '##########',
      '#S..D..E.X',
      '##########'
    ],
    opponents: [{ kind: 'Sicko', boss: true }],
    hp: 26, booster: 5
  }
];

export const GLYPHS = { Bruiser: '▣', Doctor: '✚', Trickster: '☽', Sicko: '☣', cat: '◈', robot: '⌘', ghost: '❂' };
