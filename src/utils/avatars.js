// High-tech SVG Avatars and Image Helper

export const TECH_AVATARS = [
  {
    id: 'cyber-neural',
    name: 'Neural Mind',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00f0ff" />
          <stop offset="100%" stop-color="#7000ff" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="#0d111e" stroke="url(#g1)" stroke-width="3"/>
      <circle cx="50" cy="38" r="18" fill="url(#g1)" opacity="0.8"/>
      <path d="M 26 78 C 26 62, 38 56, 50 56 C 62 56, 74 62, 74 78 Z" fill="url(#g1)" opacity="0.85"/>
      <circle cx="43" cy="37" r="3" fill="#ffffff"/>
      <circle cx="57" cy="37" r="3" fill="#ffffff"/>
      <line x1="38" y1="30" x2="28" y2="20" stroke="#00f0ff" stroke-width="2"/>
      <line x1="62" y1="30" x2="72" y2="20" stroke="#7000ff" stroke-width="2"/>
      <circle cx="28" cy="20" r="3" fill="#00f0ff"/>
      <circle cx="72" cy="20" r="3" fill="#7000ff"/>
    </svg>`
  },
  {
    id: 'quantum-hacker',
    name: 'Quantum Hacker',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#10b981" />
          <stop offset="100%" stop-color="#00f0ff" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="#09141a" stroke="url(#g2)" stroke-width="3"/>
      <rect x="25" y="32" width="50" height="24" rx="8" fill="#032b2f" stroke="#10b981" stroke-width="2"/>
      <rect x="30" y="38" width="40" height="12" rx="4" fill="#00f0ff" opacity="0.9"/>
      <line x1="50" y1="38" x2="50" y2="50" stroke="#09141a" stroke-width="2"/>
      <path d="M 22 84 C 22 66, 36 62, 50 62 C 64 62, 78 66, 78 84 Z" fill="url(#g2)" opacity="0.8"/>
      <path d="M 50 14 L 50 26" stroke="#00f0ff" stroke-width="3" stroke-linecap="round"/>
      <circle cx="50" cy="14" r="3" fill="#10b981"/>
    </svg>`
  },
  {
    id: 'ai-core',
    name: 'AI Core',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f43f5e" />
          <stop offset="100%" stop-color="#8b5cf6" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="#150a1e" stroke="url(#g3)" stroke-width="3"/>
      <polygon points="50,22 74,38 74,68 50,84 26,68 26,38" fill="none" stroke="url(#g3)" stroke-width="2"/>
      <circle cx="50" cy="53" r="14" fill="url(#g3)"/>
      <circle cx="50" cy="53" r="6" fill="#ffffff"/>
      <circle cx="50" cy="22" r="3" fill="#f43f5e"/>
      <circle cx="74" cy="38" r="3" fill="#f43f5e"/>
      <circle cx="74" cy="68" r="3" fill="#8b5cf6"/>
      <circle cx="50" cy="84" r="3" fill="#8b5cf6"/>
      <circle cx="26" cy="68" r="3" fill="#8b5cf6"/>
      <circle cx="26" cy="38" r="3" fill="#f43f5e"/>
    </svg>`
  },
  {
    id: 'synth-pilot',
    name: 'Synth Pilot',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g4" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f59e0b" />
          <stop offset="100%" stop-color="#ef4444" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="#180e07" stroke="url(#g4)" stroke-width="3"/>
      <circle cx="50" cy="40" r="18" fill="#3b1f0c"/>
      <path d="M 28 42 Q 50 32 72 42 Q 50 56 28 42 Z" fill="url(#g4)"/>
      <path d="M 24 82 C 24 64, 36 60, 50 60 C 64 60, 76 64, 76 82 Z" fill="#2d1506" stroke="url(#g4)" stroke-width="2"/>
      <line x1="50" y1="60" x2="50" y2="82" stroke="#f59e0b" stroke-width="2"/>
    </svg>`
  },
  {
    id: 'cloud-architect',
    name: 'Cloud Architect',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g5" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#38bdf8" />
          <stop offset="100%" stop-color="#6366f1" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="#08101e" stroke="url(#g5)" stroke-width="3"/>
      <path d="M 32 46 A 14 14 0 0 1 58 36 A 18 18 0 0 1 74 52 A 12 12 0 0 1 68 64 L 32 64 A 12 12 0 0 1 32 46 Z" fill="url(#g5)" opacity="0.9"/>
      <circle cx="42" cy="52" r="3" fill="#ffffff"/>
      <circle cx="58" cy="52" r="3" fill="#ffffff"/>
      <line x1="50" y1="64" x2="50" y2="76" stroke="#38bdf8" stroke-width="2" stroke-dasharray="3,3"/>
      <polygon points="50,82 45,74 55,74" fill="#6366f1"/>
    </svg>`
  },
  {
    id: 'matrix-wizard',
    name: 'Code Wizard',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g6" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#06b6d4" />
          <stop offset="100%" stop-color="#10b981" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="#0a1917" stroke="url(#g6)" stroke-width="3"/>
      <polygon points="50,15 72,42 28,42" fill="url(#g6)" opacity="0.8"/>
      <ellipse cx="50" cy="42" rx="28" ry="7" fill="#042f2e" stroke="#10b981" stroke-width="1.5"/>
      <circle cx="50" cy="56" r="14" fill="#0d3d38"/>
      <path d="M 28 85 C 28 72, 38 68, 50 68 C 62 68, 72 72, 72 85 Z" fill="url(#g6)" opacity="0.7"/>
      <text x="44" y="59" fill="#00f0ff" font-family="monospace" font-size="10" font-weight="bold">&lt;/&gt;</text>
    </svg>`
  }
];

export function getAvatarDataUrl(avatarId) {
  const avatar = TECH_AVATARS.find(a => a.id === avatarId) || TECH_AVATARS[0];
  const encoded = encodeURIComponent(avatar.svg);
  return `data:image/svg+xml;utf8,${encoded}`;
}

export function generateInitialsAvatar(name) {
  const initials = (name || 'TM')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0].toUpperCase())
    .join('');
  
  // Deterministic gradient hue based on name
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue1 = Math.abs(hash % 360);
  const hue2 = (hue1 + 60) % 360;

  const svg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="initGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="hsl(${hue1}, 85%, 55%)" />
        <stop offset="100%" stop-color="hsl(${hue2}, 90%, 45%)" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="48" fill="#0e1322" stroke="url(#initGrad)" stroke-width="3"/>
    <text x="50" y="61" fill="url(#initGrad)" font-family="system-ui, sans-serif" font-size="34" font-weight="800" text-anchor="middle">${initials || '?'}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function compressImageFile(file, maxWidth = 400, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
