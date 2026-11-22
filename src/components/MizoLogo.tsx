import React from 'react';

interface MizoAppIconProps {
  size?: number;
  className?: string;
}

export const MizoAppIcon: React.FC<MizoAppIconProps> = ({ size = 38, className = '' }) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative shrink-0 rounded-xl overflow-hidden shadow-lg shadow-purple-900/50 border border-amber-400/50 flex items-center justify-center bg-gradient-to-br from-[#2B0E54] via-[#130629] to-[#080312] ${className}`}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-[88%] h-[88%]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="mizoGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="45%" stopColor="#FACC15" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>
          <linearGradient id="mizoWing" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E879F9" />
            <stop offset="50%" stopColor="#9333EA" />
            <stop offset="100%" stopColor="#FACC15" />
          </linearGradient>
        </defs>
        {/* Left & Right Stylized Wings */}
        <path
          d="M27 57 C14 52, 8 41, 10 30 C16 35, 22 38, 28 39 C20 42, 19 47, 27 51 Z"
          fill="url(#mizoWing)"
          opacity="0.95"
        />
        <path
          d="M73 57 C86 52, 92 41, 90 30 C84 35, 78 38, 72 39 C80 42, 81 47, 73 51 Z"
          fill="url(#mizoWing)"
          opacity="0.95"
        />
        {/* Royal Crown */}
        <path
          d="M32 32 L28 17 L41 25 L50 12 L59 25 L72 17 L68 32 Z"
          fill="url(#mizoGold)"
          stroke="#FEF08A"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <circle cx="50" cy="11" r="2.8" fill="#FEF08A" />
        <circle cx="28" cy="16" r="2.2" fill="#FEF08A" />
        <circle cx="72" cy="16" r="2.2" fill="#FEF08A" />
        {/* Faceted Crowned M */}
        <path
          d="M24 79 L29 37 L42 37 L50 56 L58 37 L71 37 L76 79 L63 79 L61 55 L50 74 L39 55 L37 79 Z"
          fill="url(#mizoGold)"
          stroke="#4C1D95"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Inner Purple Jewel Highlight */}
        <path
          d="M44 45 L50 59 L56 45 L50 51 Z"
          fill="#9333EA"
        />
      </svg>
    </div>
  );
};

export const MizoWordmark: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span className={`font-display font-extrabold tracking-tight select-none whitespace-nowrap ${className}`}>
    <span className="text-white">Mizo</span>{' '}
    <span className="italic mizo-gold-text pr-0.5">Live</span>
  </span>
);

export const MizoHeroEmblem: React.FC<{ size?: number; className?: string }> = ({
  size = 112,
  className = '',
}) => (
  <svg
    width={size}
    height={size * 0.85}
    viewBox="0 0 220 180"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`drop-shadow-[0_0_24px_rgba(168,85,247,0.65)] ${className}`}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="heroGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FEF9C3" />
        <stop offset="35%" stopColor="#FACC15" />
        <stop offset="75%" stopColor="#EAB308" />
        <stop offset="100%" stopColor="#92400E" />
      </linearGradient>
      <linearGradient id="heroWingL" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FDE047" />
        <stop offset="45%" stopColor="#C026D3" />
        <stop offset="100%" stopColor="#581C87" />
      </linearGradient>
      <linearGradient id="heroWingR" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FDE047" />
        <stop offset="45%" stopColor="#C026D3" />
        <stop offset="100%" stopColor="#581C87" />
      </linearGradient>
    </defs>

    {/* Outer Golden Halo Ring */}
    <circle cx="110" cy="100" r="52" stroke="url(#heroGold)" strokeWidth="4" fill="#120626" fillOpacity="0.82" />
    <circle cx="110" cy="100" r="46" stroke="#A855F7" strokeWidth="1.5" strokeOpacity="0.7" />

    {/* Left Wings */}
    <path d="M58 95 C32 82, 12 58, 8 36 C28 45, 44 54, 62 66 Z" fill="url(#heroWingL)" />
    <path d="M60 112 C34 106, 18 92, 14 75 C32 82, 46 88, 63 97 Z" fill="url(#heroWingL)" opacity="0.88" />
    <path d="M66 127 C46 126, 32 118, 28 106 C42 110, 54 114, 68 119 Z" fill="url(#heroGold)" opacity="0.85" />

    {/* Right Wings */}
    <path d="M162 95 C188 82, 208 58, 212 36 C192 45, 176 54, 158 66 Z" fill="url(#heroWingR)" />
    <path d="M160 112 C186 106, 202 92, 206 75 C188 82, 174 88, 157 97 Z" fill="url(#heroWingR)" opacity="0.88" />
    <path d="M154 127 C174 126, 188 118, 192 106 C178 110, 166 114, 152 119 Z" fill="url(#heroGold)" opacity="0.85" />

    {/* Royal Crown */}
    <path
      d="M72 55 L64 26 L88 40 L110 14 L132 40 L156 26 L148 55 Z"
      fill="url(#heroGold)"
      stroke="#FEF08A"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <circle cx="110" cy="12" r="5" fill="#FEF08A" />
    <circle cx="64" cy="24" r="4" fill="#FEF08A" />
    <circle cx="156" cy="24" r="4" fill="#FEF08A" />
    <circle cx="110" cy="40" r="4.5" fill="#A855F7" stroke="#FEF08A" strokeWidth="1.5" />

    {/* Faceted Golden M */}
    <path
      d="M73 134 L81 74 L98 74 L110 103 L122 74 L139 74 L147 134 L129 134 L125 99 L110 128 L95 99 L91 134 Z"
      fill="url(#heroGold)"
      stroke="#3B0764"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
  </svg>
);

export const CrownOrnament: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 240 90"
    className={`w-48 h-16 mx-auto ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="ornamentGold" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.2" />
        <stop offset="30%" stopColor="#FACC15" />
        <stop offset="50%" stopColor="#FEF08A" />
        <stop offset="70%" stopColor="#FACC15" />
        <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.2" />
      </linearGradient>
    </defs>
    <path d="M12 72 Q70 50 120 62 Q170 50 228 72" stroke="url(#ornamentGold)" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M35 80 Q85 60 120 69 Q155 60 205 80" stroke="#A855F7" strokeOpacity="0.45" strokeWidth="1.5" strokeLinecap="round" />
    <path
      d="M92 52 L84 26 L104 38 L120 14 L136 38 L156 26 L148 52 Z"
      fill="url(#ornamentGold)"
      stroke="#FEF08A"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <circle cx="120" cy="12" r="3.5" fill="#FEF08A" />
    <circle cx="120" cy="39" r="3.5" fill="#9333EA" stroke="#FEF08A" strokeWidth="1.2" />
  </svg>
);

export const ProfileFrameOverlay: React.FC<{
  frameId: string | null;
  size?: number;
}> = ({ frameId, size = 104 }) => {
  if (!frameId) {
    return (
      <div
        style={{ width: size, height: size }}
        className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-amber-400/70 shadow-[0_0_20px_rgba(250,204,21,0.35)]"
      />
    );
  }

  return (
    <svg
      width={size + 26}
      height={size + 26}
      viewBox="0 0 120 120"
      className="pointer-events-none absolute -top-[13px] -left-[13px] z-10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="frameGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="50%" stopColor="#FACC15" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
        <linearGradient id="framePurpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E879F9" />
          <stop offset="50%" stopColor="#9333EA" />
          <stop offset="100%" stopColor="#FACC15" />
        </linearGradient>
      </defs>

      {frameId === 'frame-gold-wreath' && (
        <>
          <circle cx="60" cy="60" r="50" stroke="url(#frameGoldGrad)" strokeWidth="4" />
          <circle cx="60" cy="60" r="54" stroke="#A855F7" strokeWidth="1.2" strokeDasharray="4 4" />
          <path d="M44 13 L41 4 L52 10 L60 1 L68 10 L79 4 L76 13 Z" fill="url(#frameGoldGrad)" />
          <path d="M20 92 Q38 110 60 110 Q82 110 100 92" stroke="url(#frameGoldGrad)" strokeWidth="3" strokeLinecap="round" />
        </>
      )}

      {frameId === 'frame-royal-wings' && (
        <>
          <circle cx="60" cy="60" r="49" stroke="url(#framePurpleGrad)" strokeWidth="4" />
          <path d="M12 64 C2 54, 1 40, 6 30 C13 38, 17 45, 16 56 Z" fill="url(#framePurpleGrad)" />
          <path d="M108 64 C118 54, 119 40, 114 30 C107 38, 103 45, 104 56 Z" fill="url(#framePurpleGrad)" />
          <path d="M48 12 L46 4 L54 9 L60 2 L66 9 L74 4 L72 12 Z" fill="url(#frameGoldGrad)" />
        </>
      )}

      {(frameId === 'frame-neon-halo' || frameId === 'frame-neon-galaxy' || frameId === 'frame-animated-halo') && (
        <>
          <circle cx="60" cy="60" r="51" stroke="#C026D3" strokeWidth="3.5" />
          <circle cx="60" cy="60" r="47" stroke="#FACC15" strokeWidth="1.5" strokeDasharray="6 4" />
          <circle cx="60" cy="9" r="4.5" fill="#FEF08A" />
          <circle cx="60" cy="111" r="3.5" fill="#C026D3" />
        </>
      )}

      {(frameId === 'frame-diamond-crown' || frameId === 'frame-diamond-aura') && (
        <>
          <circle cx="60" cy="60" r="50" stroke="url(#frameGoldGrad)" strokeWidth="3.5" />
          <polygon points="60,2 66,11 60,18 54,11" fill="#60A5FA" stroke="#FEF08A" strokeWidth="1.2" />
          <polygon points="10,60 17,55 17,65" fill="#E879F9" />
          <polygon points="110,60 103,55 103,65" fill="#E879F9" />
        </>
      )}

      {(frameId === 'frame-vip-crest' || frameId === 'frame-royal-flame') && (
        <>
          <circle cx="60" cy="60" r="51" stroke="url(#frameGoldGrad)" strokeWidth="4.5" />
          <circle cx="60" cy="60" r="45" stroke="#E879F9" strokeWidth="1.5" strokeDasharray="6 3" />
          <path d="M40 13 L37 3 L50 10 L60 1 L70 10 L83 3 L80 13 Z" fill="url(#frameGoldGrad)" />
          <circle cx="60" cy="110" r="4" fill="#FACC15" />
        </>
      )}
    </svg>
  );
};

export const EntryShowcaseArt: React.FC<{
  styleType: string;
  size?: number;
  animate?: boolean;
}> = ({ styleType, size = 72, animate = false }) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative flex items-center justify-center ${animate ? 'animate-mizo-float' : ''}`}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_16px_rgba(250,204,21,0.45)]" fill="none">
        <defs>
          <linearGradient id="entryG" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="50%" stopColor="#FACC15" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>
          <linearGradient id="entryP" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E879F9" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
        </defs>

        {styleType === 'royal-crown' && (
          <>
            <circle cx="50" cy="54" r="34" fill="url(#entryP)" fillOpacity="0.22" stroke="url(#entryG)" strokeWidth="2" />
            <path d="M22 68 L17 34 L36 46 L50 22 L64 46 L83 34 L78 68 Z" fill="url(#entryG)" stroke="#FEF9C3" strokeWidth="1.8" strokeLinejoin="round" />
            <circle cx="50" cy="20" r="4" fill="#FEF9C3" />
            <circle cx="50" cy="52" r="6" fill="#9333EA" stroke="#FEF08A" strokeWidth="1.5" />
          </>
        )}

        {styleType === 'golden-wings' && (
          <>
            <path d="M46 66 C20 62, 8 44, 10 24 C24 34, 34 40, 46 50 Z" fill="url(#entryG)" />
            <path d="M54 66 C80 62, 92 44, 90 24 C76 34, 66 40, 54 50 Z" fill="url(#entryG)" />
            <polygon points="50,30 64,50 50,74 36,50" fill="url(#entryP)" stroke="#FEF08A" strokeWidth="2" />
          </>
        )}

        {styleType === 'diamond-aura' && (
          <>
            <circle cx="50" cy="50" r="36" stroke="#A855F7" strokeWidth="1.5" strokeDasharray="5 4" />
            <polygon points="28,36 72,36 84,52 50,84 16,52" fill="#38BDF8" fillOpacity="0.85" stroke="#BAE6FD" strokeWidth="2" />
            <polygon points="36,36 64,36 50,84" fill="#818CF8" fillOpacity="0.65" />
            <line x1="16" y1="52" x2="84" y2="52" stroke="#E0F2FE" strokeWidth="1.5" />
          </>
        )}

        {styleType === 'amethyst-flame' && (
          <>
            <circle cx="50" cy="52" r="34" fill="url(#entryP)" fillOpacity="0.28" stroke="#E879F9" strokeWidth="2" />
            <path d="M50 18 C64 34, 76 48, 68 70 C62 82, 38 82, 32 70 C24 48, 36 34, 50 18 Z" fill="url(#entryP)" stroke="url(#entryG)" strokeWidth="2" />
            <path d="M50 38 C58 48, 60 60, 50 70 C40 60, 42 48, 50 38 Z" fill="url(#entryG)" />
          </>
        )}
      </svg>
    </div>
  );
};
