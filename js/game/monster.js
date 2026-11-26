// Monstres originaux dessinés en SVG (formes simples, couleurs par boss).

function eyes(cx, cy, gap, r = 9, angry = true) {
  const brow = angry
    ? `<path d="M${cx - gap - r} ${cy - r - 6} L${cx - gap + r} ${cy - r + 2}" stroke="#111" stroke-width="5" stroke-linecap="round"/>
       <path d="M${cx + gap + r} ${cy - r - 6} L${cx + gap - r} ${cy - r + 2}" stroke="#111" stroke-width="5" stroke-linecap="round"/>`
    : '';
  return `${brow}
    <circle cx="${cx - gap}" cy="${cy}" r="${r}" fill="#fff"/><circle cx="${cx + gap}" cy="${cy}" r="${r}" fill="#fff"/>
    <circle cx="${cx - gap + 2}" cy="${cy + 2}" r="${r * 0.5}" fill="#111"/><circle cx="${cx + gap - 2}" cy="${cy + 2}" r="${r * 0.5}" fill="#111"/>`;
}

function mouth(cx, cy, w, teeth = true) {
  const t = teeth
    ? Array.from({ length: 4 }, (_, i) => `<path d="M${cx - w / 2 + 6 + i * (w - 12) / 3} ${cy - 1} l4 7 l4 -7" fill="#fff"/>`).join('')
    : '';
  return `<path d="M${cx - w / 2} ${cy} Q${cx} ${cy + 16} ${cx + w / 2} ${cy}" fill="#2a0d0d" stroke="#111" stroke-width="3"/>${t}`;
}

const SHAPES = {
  slime: (c, d) => `
    <ellipse cx="100" cy="182" rx="70" ry="10" fill="rgba(0,0,0,.25)"/>
    <path d="M30 175 C20 120 55 60 100 60 C145 60 180 120 170 175 Q150 168 135 178 Q118 168 100 178 Q82 168 65 178 Q48 168 30 175Z" fill="url(#g)" stroke="${d}" stroke-width="4"/>
    <ellipse cx="75" cy="90" rx="14" ry="8" fill="rgba(255,255,255,.45)"/>
    ${eyes(100, 118, 24, 11)} ${mouth(100, 145, 40)}
    <circle cx="160" cy="170" r="8" fill="${c}" stroke="${d}" stroke-width="3"/><circle cx="38" cy="176" r="6" fill="${c}" stroke="${d}" stroke-width="3"/>`,
  golem: (c, d) => `
    <ellipse cx="100" cy="186" rx="72" ry="9" fill="rgba(0,0,0,.25)"/>
    <rect x="18" y="80" width="32" height="70" rx="8" fill="url(#g)" stroke="${d}" stroke-width="4"/>
    <rect x="150" y="80" width="32" height="70" rx="8" fill="url(#g)" stroke="${d}" stroke-width="4"/>
    <rect x="12" y="140" width="44" height="34" rx="10" fill="${d}"/><rect x="144" y="140" width="44" height="34" rx="10" fill="${d}"/>
    <rect x="50" y="70" width="100" height="100" rx="14" fill="url(#g)" stroke="${d}" stroke-width="4"/>
    <rect x="62" y="22" width="76" height="56" rx="10" fill="url(#g)" stroke="${d}" stroke-width="4"/>
    <path d="M70 100 L90 120 L80 140 M130 95 L118 118" stroke="${d}" stroke-width="4" fill="none"/>
    <rect x="70" y="40" width="20" height="10" rx="3" fill="#fde047"/><rect x="110" y="40" width="20" height="10" rx="3" fill="#fde047"/>
    <rect x="80" y="60" width="40" height="8" rx="3" fill="#111"/>
    <rect x="55" y="168" width="30" height="16" rx="5" fill="${d}"/><rect x="115" y="168" width="30" height="16" rx="5" fill="${d}"/>`,
  ogre: (c, d) => `
    <ellipse cx="100" cy="186" rx="72" ry="9" fill="rgba(0,0,0,.25)"/>
    <ellipse cx="100" cy="125" rx="62" ry="58" fill="url(#g)" stroke="${d}" stroke-width="4"/>
    <ellipse cx="100" cy="150" rx="34" ry="24" fill="rgba(255,255,255,.18)"/>
    <circle cx="100" cy="58" r="30" fill="url(#g)" stroke="${d}" stroke-width="4"/>
    <path d="M78 36 L72 18 L86 30 M122 36 L128 18 L114 30" stroke="#f8fafc" stroke-width="5" stroke-linecap="round"/>
    ${eyes(100, 56, 12, 7)} ${mouth(100, 72, 26)}
    <circle cx="30" cy="120" r="26" fill="#dc2626" stroke="#7f1d1d" stroke-width="4"/><circle cx="170" cy="120" r="26" fill="#dc2626" stroke="#7f1d1d" stroke-width="4"/>
    <rect x="22" y="96" width="16" height="8" rx="3" fill="#fff"/><rect x="162" y="96" width="16" height="8" rx="3" fill="#fff"/>
    <rect x="60" y="170" width="26" height="16" rx="6" fill="${d}"/><rect x="114" y="170" width="26" height="16" rx="6" fill="${d}"/>`,
  hydra: (c, d) => `
    <ellipse cx="100" cy="186" rx="76" ry="9" fill="rgba(0,0,0,.25)"/>
    <path d="M60 130 C40 90 30 60 40 40" stroke="${d}" stroke-width="22" fill="none" stroke-linecap="round"/>
    <path d="M60 130 C40 90 30 60 40 40" stroke="${c}" stroke-width="15" fill="none" stroke-linecap="round"/>
    <path d="M100 125 C100 80 100 50 100 28" stroke="${d}" stroke-width="22" fill="none" stroke-linecap="round"/>
    <path d="M100 125 C100 80 100 50 100 28" stroke="${c}" stroke-width="15" fill="none" stroke-linecap="round"/>
    <path d="M140 130 C160 90 170 60 160 40" stroke="${d}" stroke-width="22" fill="none" stroke-linecap="round"/>
    <path d="M140 130 C160 90 170 60 160 40" stroke="${c}" stroke-width="15" fill="none" stroke-linecap="round"/>
    <ellipse cx="40" cy="38" rx="20" ry="15" fill="url(#g)" stroke="${d}" stroke-width="3"/>${eyes(40, 34, 7, 5)}
    <ellipse cx="100" cy="26" rx="22" ry="16" fill="url(#g)" stroke="${d}" stroke-width="3"/>${eyes(100, 22, 8, 6)}
    <ellipse cx="160" cy="38" rx="20" ry="15" fill="url(#g)" stroke="${d}" stroke-width="3"/>${eyes(160, 34, 7, 5)}
    <path d="M30 180 Q35 120 100 115 Q165 120 170 180Z" fill="url(#g)" stroke="${d}" stroke-width="4"/>
    <rect x="62" y="140" width="76" height="26" rx="12" fill="rgba(0,0,0,.18)"/>
    <text x="100" y="158" text-anchor="middle" font-size="13" font-weight="800" fill="#fff">ZZZ</text>`,
  specter: (c, d) => `
    <ellipse cx="100" cy="188" rx="50" ry="7" fill="rgba(0,0,0,.2)"/>
    <path d="M45 170 C40 100 55 30 100 30 C145 30 160 100 155 170 Q140 155 128 172 Q114 155 100 172 Q86 155 72 172 Q58 155 45 170Z" fill="url(#g)" stroke="${d}" stroke-width="4" opacity=".92"/>
    <ellipse cx="78" cy="88" rx="12" ry="18" fill="#0b1020"/><ellipse cx="122" cy="88" rx="12" ry="18" fill="#0b1020"/>
    <circle cx="78" cy="92" r="4" fill="#7dd3fc"/><circle cx="122" cy="92" r="4" fill="#7dd3fc"/>
    <ellipse cx="100" cy="128" rx="14" ry="20" fill="#0b1020"/>
    <path d="M40 110 Q20 120 22 140 M160 110 Q180 120 178 140" stroke="${d}" stroke-width="6" fill="none" stroke-linecap="round"/>`,
  titan: (c, d) => `
    <ellipse cx="100" cy="188" rx="74" ry="8" fill="rgba(0,0,0,.25)"/>
    <path d="M60 70 L140 70 L150 130 L50 130Z" fill="url(#g)" stroke="${d}" stroke-width="4"/>
    <path d="M70 130 L130 130 L125 160 L75 160Z" fill="${d}"/>
    <rect x="66" y="158" width="26" height="28" rx="5" fill="url(#g)" stroke="${d}" stroke-width="3"/><rect x="108" y="158" width="26" height="28" rx="5" fill="url(#g)" stroke="${d}" stroke-width="3"/>
    <path d="M60 72 L28 90 L22 140 L40 140 L48 100" fill="url(#g)" stroke="${d}" stroke-width="4"/>
    <path d="M140 72 L172 90 L178 140 L160 140 L152 100" fill="url(#g)" stroke="${d}" stroke-width="4"/>
    <rect x="72" y="18" width="56" height="54" rx="12" fill="url(#g)" stroke="${d}" stroke-width="4"/>
    <rect x="78" y="38" width="44" height="10" rx="4" fill="#111"/><rect x="82" y="40" width="36" height="6" rx="3" fill="#ef4444"/>
    <path d="M100 4 L100 20" stroke="${d}" stroke-width="6" stroke-linecap="round"/>
    <circle cx="100" cy="98" r="12" fill="#38bdf8" stroke="${d}" stroke-width="3"/>`,
  dragon: (c, d) => `
    <ellipse cx="100" cy="188" rx="80" ry="9" fill="rgba(0,0,0,.25)"/>
    <path d="M60 100 L5 60 L25 110 L0 120 L45 135Z" fill="${d}" opacity=".9"/>
    <path d="M140 100 L195 60 L175 110 L200 120 L155 135Z" fill="${d}" opacity=".9"/>
    <ellipse cx="100" cy="135" rx="55" ry="48" fill="url(#g)" stroke="${d}" stroke-width="4"/>
    <ellipse cx="100" cy="148" rx="30" ry="28" fill="#fde68a" opacity=".8"/>
    <path d="M100 148 m-22 -10 h44 M100 148 m-24 4 h48 M100 148 m-20 18 h40" stroke="${d}" stroke-width="2" opacity=".5"/>
    <path d="M70 70 Q100 20 130 70 Q100 95 70 70Z" fill="url(#g)" stroke="${d}" stroke-width="4"/>
    <path d="M78 46 L66 18 L88 40 M122 46 L134 18 L112 40" fill="#fef3c7" stroke="${d}" stroke-width="3"/>
    ${eyes(100, 58, 13, 6)}
    <path d="M86 76 Q100 86 114 76" stroke="#111" stroke-width="3" fill="none"/>
    <path d="M150 165 Q185 170 190 140" stroke="${d}" stroke-width="10" fill="none" stroke-linecap="round"/>
    <rect x="66" y="172" width="22" height="14" rx="5" fill="${d}"/><rect x="112" y="172" width="22" height="14" rx="5" fill="${d}"/>`,
};

export function monsterSvg(boss, { size = 160, className = '' } = {}) {
  const shape = SHAPES[boss.shape] || SHAPES.slime;
  const id = `g-${boss.id}-${Math.random().toString(36).slice(2, 7)}`;
  return `<svg class="monster ${className}" width="${size}" height="${size}" viewBox="0 0 200 200" role="img" aria-label="${boss.name}">
    <defs><radialGradient id="${id}" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="#ffffff" stop-opacity=".55"/><stop offset=".35" stop-color="${boss.color}"/><stop offset="1" stop-color="${boss.color2}"/></radialGradient></defs>
    ${shape(boss.color, boss.color2).replaceAll('url(#g)', `url(#${id})`)}
  </svg>`;
}
