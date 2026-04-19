/**
 * SoulSketch Portrait Engine
 * 12 unique zodiac SVG avatars in pencil-sketch line-art style
 * Monochrome purple/gold tones matching the app theme
 */
(function(global){
  'use strict';

  const COLORS = {
    stroke: '#c084fc',      // purple accent
    accent: '#d4a574',      // gold
    dim: 'rgba(192,132,252,0.3)',
    highlight: 'rgba(212,165,116,0.6)'
  };

  // SVG templates - stroke-based line art, NOT filled shapes
  const avatars = {
    Aries: (c) => `
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <!-- Ram horns -->
        <path d="M55 85 Q45 50 60 30 Q68 22 72 35 Q65 55 68 80" stroke="${c.accent}" stroke-width="1.8" fill="none" opacity="0.8"/>
        <path d="M145 85 Q155 50 140 30 Q132 22 128 35 Q135 55 132 80" stroke="${c.accent}" stroke-width="1.8" fill="none" opacity="0.8"/>
        <!-- Face outline -->
        <ellipse cx="100" cy="105" rx="42" ry="50" stroke="${c.stroke}" stroke-width="1.5" fill="none"/>
        <!-- Eyes -->
        <path d="M78 95 Q83 88 90 95" stroke="${c.stroke}" stroke-width="1.5" fill="none"/>
        <path d="M110 95 Q115 88 122 95" stroke="${c.stroke}" stroke-width="1.5" fill="none"/>
        <circle cx="84" cy="94" r="2" fill="${c.stroke}" opacity="0.6"/>
        <circle cx="116" cy="94" r="2" fill="${c.stroke}" opacity="0.6"/>
        <!-- Eyebrows - bold, angular -->
        <path d="M76 86 Q84 80 92 85" stroke="${c.stroke}" stroke-width="1.2" fill="none"/>
        <path d="M108 85 Q116 80 124 86" stroke="${c.stroke}" stroke-width="1.2" fill="none"/>
        <!-- Nose -->
        <path d="M100 98 L97 110 Q100 113 103 110" stroke="${c.dim}" stroke-width="1" fill="none"/>
        <!-- Lips -->
        <path d="M85 118 Q93 112 100 115 Q107 112 115 118" stroke="${c.stroke}" stroke-width="1.3" fill="none"/>
        <path d="M87 118 Q100 125 113 118" stroke="${c.dim}" stroke-width="0.8" fill="none"/>
        <!-- Hair - wild, flame-like -->
        <path d="M58 85 Q55 60 65 45 Q72 35 80 50 Q75 55 70 65" stroke="${c.stroke}" stroke-width="1.3" fill="none"/>
        <path d="M65 70 Q60 50 75 35 Q85 28 88 45" stroke="${c.stroke}" stroke-width="1.2" fill="none"/>
        <path d="M142 85 Q145 60 135 45 Q128 35 120 50 Q125 55 130 65" stroke="${c.stroke}" stroke-width="1.3" fill="none"/>
        <path d="M135 70 Q140 50 125 35 Q115 28 112 45" stroke="${c.stroke}" stroke-width="1.2" fill="none"/>
        <path d="M75 55 Q85 30 100 28 Q115 30 125 55" stroke="${c.stroke}" stroke-width="1.3" fill="none"/>
        <!-- Forehead mark - ram symbol -->
        <path d="M95 72 Q100 65 105 72" stroke="${c.accent}" stroke-width="1" fill="none" opacity="0.5"/>
        <!-- Neck -->
        <line x1="88" y1="152" x2="88" y2="170" stroke="${c.dim}" stroke-width="1"/>
        <line x1="112" y1="152" x2="112" y2="170" stroke="${c.dim}" stroke-width="1"/>
      </svg>`,

    Taurus: (c) => `
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <!-- Flower crown -->
        <circle cx="72" cy="48" r="6" stroke="${c.accent}" stroke-width="1.2" fill="none" opacity="0.7"/>
        <circle cx="72" cy="48" r="3" stroke="${c.accent}" stroke-width="0.8" fill="none" opacity="0.5"/>
        <circle cx="100" cy="38" r="7" stroke="${c.accent}" stroke-width="1.2" fill="none" opacity="0.7"/>
        <circle cx="100" cy="38" r="3.5" stroke="${c.accent}" stroke-width="0.8" fill="none" opacity="0.5"/>
        <circle cx="128" cy="48" r="6" stroke="${c.accent}" stroke-width="1.2" fill="none" opacity="0.7"/>
        <circle cx="128" cy="48" r="3" stroke="${c.accent}" stroke-width="0.8" fill="none" opacity="0.5"/>
        <path d="M66 52 Q85 42 100 35 Q115 42 134 52" stroke="${c.accent}" stroke-width="1" fill="none" opacity="0.5"/>
        <!-- Face -->
        <ellipse cx="100" cy="105" rx="44" ry="52" stroke="${c.stroke}" stroke-width="1.5" fill="none"/>
        <!-- Eyes - gentle, rounded -->
        <ellipse cx="82" cy="93" rx="7" ry="5" stroke="${c.stroke}" stroke-width="1.3" fill="none"/>
        <ellipse cx="118" cy="93" rx="7" ry="5" stroke="${c.stroke}" stroke-width="1.3" fill="none"/>
        <circle cx="82" cy="93" r="2.5" fill="${c.stroke}" opacity="0.5"/>
        <circle cx="118" cy="93" r="2.5" fill="${c.stroke}" opacity="0.5"/>
        <!-- Eyelashes -->
        <path d="M75 89 L73 86" stroke="${c.dim}" stroke-width="0.8"/>
        <path d="M125 89 L127 86" stroke="${c.dim}" stroke-width="0.8"/>
        <!-- Nose -->
        <path d="M100 97 L97 109 Q100 112 103 109" stroke="${c.dim}" stroke-width="1" fill="none"/>
        <!-- Soft smile -->
        <path d="M86 118 Q100 128 114 118" stroke="${c.stroke}" stroke-width="1.3" fill="none"/>
        <!-- Hair - flowing, luscious -->
        <path d="M56 90 Q50 65 60 50 Q70 40 80 55" stroke="${c.stroke}" stroke-width="1.3" fill="none"/>
        <path d="M58 100 Q52 75 58 55" stroke="${c.stroke}" stroke-width="1" fill="none"/>
        <path d="M144 90 Q150 65 140 50 Q130 40 120 55" stroke="${c.stroke}" stroke-width="1.3" fill="none"/>
        <path d="M142 100 Q148 75 142 55" stroke="${c.stroke}" stroke-width="1" fill="none"/>
        <path d="M60 55 Q80 35 100 32 Q120 35 140 55" stroke="${c.stroke}" stroke-width="1.3" fill="none"/>
        <!-- Neck -->
        <line x1="88" y1="154" x2="88" y2="172" stroke="${c.dim}" stroke-width="1"/>
        <line x1="112" y1="154" x2="112" y2="172" stroke="${c.dim}" stroke-width="1"/>
      </svg>`,

    Gemini: (c) => `
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <!-- Face -->
        <ellipse cx="100" cy="105" rx="40" ry="48" stroke="${c.stroke}" stroke-width="1.5" fill="none"/>
        <!-- Dual-toned hair part line -->
        <line x1="100" y1="35" x2="100" y2="80" stroke="${c.accent}" stroke-width="0.8" opacity="0.4" stroke-dasharray="3,3"/>
        <!-- Eyes - lively, expressive -->
        <path d="M76 92 Q82 84 90 92" stroke="${c.stroke}" stroke-width="1.4" fill="none"/>
        <path d="M110 92 Q116 84 124 92" stroke="${c.stroke}" stroke-width="1.4" fill="none"/>
        <circle cx="83" cy="91" r="2.5" fill="${c.stroke}" opacity="0.6"/>
        <circle cx="117" cy="91" r="2.5" fill="${c.stroke}" opacity="0.6"/>
        <!-- Wink - one eye winking -->
        <path d="M78 95 Q83 92 88 95" stroke="${c.accent}" stroke-width="0.8" fill="none" opacity="0.4"/>
        <!-- Eyebrows - playful -->
        <path d="M75 83 Q82 78 90 82" stroke="${c.stroke}" stroke-width="1.1" fill="none"/>
        <path d="M110 82 Q118 78 125 83" stroke="${c.stroke}" stroke-width="1.1" fill="none"/>
        <!-- Nose -->
        <path d="M100 95 L97 107 Q100 110 103 107" stroke="${c.dim}" stroke-width="1" fill="none"/>
        <!-- Playful smirk -->
        <path d="M84 116 Q94 122 100 118 Q106 122 116 116" stroke="${c.stroke}" stroke-width="1.3" fill="none"/>
        <!-- Hair - two distinct styles blended -->
        <path d="M60 88 Q54 60 65 42 Q75 32 85 50" stroke="${c.stroke}" stroke-width="1.3" fill="none"/>
        <path d="M140 88 Q146 60 135 42 Q125 32 115 50" stroke="${c.stroke}" stroke-width="1.3" fill="none"/>
        <path d="M65 55 Q80 32 100 30 Q120 32 135 55" stroke="${c.stroke}" stroke-width="1.3" fill="none"/>
        <!-- Left side waves -->
        <path d="M62 70 Q58 55 68 45" stroke="${c.stroke}" stroke-width="1" fill="none"/>
        <path d="M60 82 Q55 68 62 55" stroke="${c.stroke}" stroke-width="0.8" fill="none"/>
        <!-- Right side straight -->
        <path d="M138 70 Q142 55 132 45" stroke="${c.accent}" stroke-width="1" fill="none" opacity="0.7"/>
        <path d="M140 82 Q145 68 138 55" stroke="${c.accent}" stroke-width="0.8" fill="none" opacity="0.7"/>
        <!-- III symbol (Gemini) on forehead -->
        <line x1="96" y1="70" x2="96" y2="76" stroke="${c.accent}" stroke-width="0.8" opacity="0.4"/>
        <line x1="100" y1="70" x2="100" y2="76" stroke="${c.accent}" stroke-width="0.8" opacity="0.4"/>
        <line x1="104" y1="70" x2="104" y2="76" stroke="${c.accent}" stroke-width="0.8" opacity="0.4"/>
        <!-- Neck -->
        <line x1="90" y1="150" x2="90" y2="170" stroke="${c.dim}" stroke-width="1"/>
        <line x1="110" y1="150" x2="110" y2="170" stroke="${c.dim}" stroke-width="1"/>
      </svg>`,

    Cancer: (c) => `
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <!-- Face -->
        <ellipse cx="100" cy="105" rx="42" ry="50" stroke="${c.stroke}" stroke-width="1.5" fill="none"/>
        <!-- Eyes - soft, emotional -->
        <ellipse cx="82" cy="93" rx="6" ry="5" stroke="${c.stroke}" stroke-width="1.3" fill="none"/>
        <ellipse cx="118" cy="93" rx="6" ry="5" stroke="${c.stroke}" stroke-width="1.3" fill="none"/>
        <circle cx="82" cy="93" r="2" fill="${c.stroke}" opacity="0.5"/>
        <circle cx="118" cy="93" r="2" fill="${c.stroke}" opacity="0.5"/>
        <!-- Dreamy eyebrows -->
        <path d="M76 85 Q83 80 90 84" stroke="${c.stroke}" stroke-width="1" fill="none"/>
        <path d="M110 84 Q117 80 124 85" stroke="${c.stroke}" stroke-width="1" fill="none"/>
        <!-- Nose -->
        <path d="M100 96 L97 108 Q100 111 103 108" stroke="${c.dim}" stroke-width="1" fill="none"/>
        <!-- Gentle smile -->
        <path d="M88 117 Q100 124 112 117" stroke="${c.stroke}" stroke-width="1.2" fill="none"/>
        <!-- Hair - soft, wavy, flowing -->
        <path d="M58 90 Q52 65 62 48 Q72 38 82 55 Q70 60 60 75" stroke="${c.stroke}" stroke-width="1.3" fill="none"/>
        <path d="M142 90 Q148 65 138 48 Q128 38 118 55 Q130 60 140 75" stroke="${c.stroke}" stroke-width="1.3" fill="none"/>
        <path d="M62 55 Q80 35 100 32 Q120 35 138 55" stroke="${c.stroke}" stroke-width="1.3" fill="none"/>
        <path d="M58 95 Q55 80 58 65" stroke="${c.stroke}" stroke-width="1" fill="none"/>
        <path d="M142 95 Q145 80 142 65" stroke="${c.stroke}" stroke-width="1" fill="none"/>
        <!-- Moon earring -->
        <path d="M148 100 Q155 95 152 88 Q148 82 144 88" stroke="${c.accent}" stroke-width="1.3" fill="none"/>
        <circle cx="150" cy="88" r="1.5" fill="${c.accent}" opacity="0.4"/>
        <!-- Moon on forehead -->
        <path d="M96 68 Q100 60 104 68" stroke="${c.accent}" stroke-width="0.8" fill="none" opacity="0.4"/>
        <!-- Neck -->
        <line x1="88" y1="152" x2="88" y2="172" stroke="${c.dim}" stroke-width="1"/>
        <line x1="112" y1="152" x2="112" y2="172" stroke="${c.dim}" stroke-width="1"/>
      </svg>`,

    Leo: (c) => `
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <!-- Lion mane hair -->
        <path d="M45 95 Q35 65 50 40 Q60 28 72 42" stroke="${c.stroke}" stroke-width="1.2" fill="none"/>
        <path d="M42 80 Q38 55 52 35 Q58 28 65 38" stroke="${c.stroke}" stroke-width="1" fill="none"/>
        <path d="M155 95 Q165 65 150 40 Q140 28 128 42" stroke="${c.stroke}" stroke-width="1.2" fill="none"/>
        <path d="M158 80 Q162 55 148 35 Q142 28 135 38" stroke="${c.stroke}" stroke-width="1" fill="none"/>
        <!-- Mane layers -->
        <path d="M48 105 Q38 80 45 55 Q52 38 65 45" stroke="${c.accent}" stroke-width="0.8" fill="none" opacity="0.5"/>
        <path d="M152 105 Q162 80 155 55 Q148 38 135 45" stroke="${c.accent}" stroke-width="0.8" fill="none" opacity="0.5"/>
        <path d="M50 115 Q42 90 48 65" stroke="${c.stroke}" stroke-width="0.8" fill="none"/>
        <path d="M150 115 Q158 90 152 65" stroke="${c.stroke}" stroke-width="0.8" fill="none"/>
        <!-- Top mane -->
        <path d="M55 50 Q65 25 85 20 Q100 18 115 20 Q135 25 145 50" stroke="${c.stroke}" stroke-width="1.4" fill="none"/>
        <path d="M60 42 Q75 22 100 18 Q125 22 140 42" stroke="${c.stroke}" stroke-width="1" fill="none"/>
        <!-- Face -->
        <ellipse cx="100" cy="108" rx="38" ry="46" stroke="${c.stroke}" stroke-width="1.5" fill="none"/>
        <!-- Eyes - confident, regal -->
        <path d="M78 95 Q84 88 92 95" stroke="${c.stroke}" stroke-width="1.5" fill="none"/>
        <path d="M108 95 Q114 88 122 95" stroke="${c.stroke}" stroke-width="1.5" fill="none"/>
        <circle cx="85" cy="94" r="2.5" fill="${c.stroke}" opacity="0.6"/>
        <circle cx="115" cy="94" r="2.5" fill="${c.stroke}" opacity="0.6"/>
        <!-- Bold eyebrows -->
        <path d="M76 86 Q84 80 93 85" stroke="${c.stroke}" stroke-width="1.3" fill="none"/>
        <path d="M107 85 Q116 80 124 86" stroke="${c.stroke}" stroke-width="1.3" fill="none"/>
        <!-- Nose -->
        <path d="M100 98 L97 110 Q100 113 103 110" stroke="${c.dim}" stroke-width="1" fill="none"/>
        <!-- Regal smile -->
        <path d="M84 118 Q93 113 100 116 Q107 113 116 118" stroke="${c.stroke}" stroke-width="1.3" fill="none"/>
        <path d="M86 118 Q100 126 114 118" stroke="${c.dim}" stroke-width="0.8" fill="none"/>
        <!-- Crown hint -->
        <path d="M88 22 L92 15 L96 20 L100 12 L104 20 L108 15 L112 22" stroke="${c.accent}" stroke-width="1.2" fill="none" opacity="0.6"/>
        <!-- Neck -->
        <line x1="90" y1="152" x2="90" y2="172" stroke="${c.dim}" stroke-width="1"/>
        <line x1="110" y1="152" x2="110" y2="172" stroke="${c.dim}" stroke-width="1"/>
      </svg>`,

    Virgo: (c) => `
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <!-- Face -->
        <ellipse cx="100" cy="105" rx="40" ry="48" stroke="${c.stroke}" stroke-width="1.5" fill="none"/>
        <!-- Eyes - analytical, calm -->
        <path d="M78 93 Q83 88 90 93" stroke="${c.stroke}" stroke-width="1.3" fill="none"/>
        <path d="M110 93 Q115 88 122 93" stroke="${c.stroke}" stroke-width="1.3" fill="none"/>
        <circle cx="84" cy="92" r="2" fill="${c.stroke}" opacity="0.5"/>
        <circle cx="116" cy="92" r="2" fill="${c.stroke}" opacity="0.5"/>
        <!-- Neat eyebrows -->
        <path d="M77 85 Q84 81 91 84" stroke="${c.stroke}" stroke-width="1" fill="none"/>
        <path d="M109 84 Q116 81 123 85" stroke="${c.stroke}" stroke-width="1" fill="none"/>
        <!-- Nose -->
        <path d="M100 96 L97 108 Q100 111 103 108" stroke="${c.dim}" stroke-width="1" fill="none"/>
        <!-- Modest smile -->
        <path d="M88 116 Q100 122 112 116" stroke="${c.stroke}" stroke-width="1.2" fill="none"/>
        <!-- Hair - neat, tidy, with braid detail -->
        <path d="M60 88 Q55 62 65 45 Q75 35 85 50" stroke="${c.stroke}" stroke-width="1.3" fill="none"/>
        <path d="M140 88 Q145 62 135 45 Q125 35 115 50" stroke="${c.stroke}" stroke-width="1.3" fill="none"/>
        <path d="M65 55 Q80 35 100 32 Q120 35 135 55" stroke="${c.stroke}" stroke-width="1.3" fill="none"/>
        <!-- Braids -->
        <path d="M60 90 Q58 75 62 60 Q64 50 60 40" stroke="${c.stroke}" stroke-width="1" fill="none"/>
        <path d="M58 80 Q56 72 60 65" stroke="${c.dim}" stroke-width="0.8" fill="none"/>
        <path d="M140 90 Q142 75 138 60 Q136 50 140 40" stroke="${c.stroke}" stroke-width="1" fill="none"/>
        <path d="M142 80 Q144 72 140 65" stroke="${c.dim}" stroke-width="0.8" fill="none"/>
        <!-- Wheat stalk accessory -->
        <path d="M138 55 Q145 40 148 28" stroke="${c.accent}" stroke-width="1" fill="none" opacity="0.7"/>
        <ellipse cx="148" cy="28" rx="3" ry="6" stroke="${c.accent}" stroke-width="0.8" fill="none" opacity="0.5" transform="rotate(20,148,28)"/>
        <ellipse cx="146" cy="32" rx="3" ry="5" stroke="${c.accent}" stroke-width="0.8" fill="none" opacity="0.4" transform="rotate(-10,146,32)"/>
        <!-- Neck -->
        <line x1="90" y1="150" x2="90" y2="170" stroke="${c.dim}" stroke-width="1"/>
        <line x1="110" y1="150" x2="110" y2="170" stroke="${c.dim}" stroke-width="1"/>
      </svg>`,

    Libra: (c) => `
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <!-- Face -->
        <ellipse cx="100" cy="105" rx="41" ry="49" stroke="${c.stroke}" stroke-width="1.5" fill="none"/>
        <!-- Eyes - balanced, serene -->
        <path d="M78 93 Q83 87 90 93" stroke="${c.stroke}" stroke-width="1.3" fill="none"/>
        <path d="M110 93 Q115 87 122 93" stroke="${c.stroke}" stroke-width="1.3" fill="none"/>
        <circle cx="84" cy="92" r="2" fill="${c.stroke}" opacity="0.5"/>
        <circle cx="116" cy="92" r="2" fill="${c.stroke}" opacity="0.5"/>
        <!-- Graceful eyebrows -->
        <path d="M77 85 Q84 80 91 84" stroke="${c.stroke}" stroke-width="1.1" fill="none"/>
        <path d="M109 84 Q116 80 123 85" stroke="${c.stroke}" stroke-width="1.1" fill="none"/>
        <!-- Nose -->
        <path d="M100 96 L97 108 Q100 111 103 108" stroke="${c.dim}" stroke-width="1" fill="none"/>
        <!-- Poised smile -->
        <path d="M86 116 Q100 124 114 116" stroke="${c.stroke}" stroke-width="1.2" fill="none"/>
        <!-- Hair - elegant, styled -->
        <path d="M58 88 Q52 60 64 42 Q74 32 85 48" stroke="${c.stroke}" stroke-width="1.3" fill="none"/>
        <path d="M142 88 Q148 60 136 42 Q126 32 115 48" stroke="${c.stroke}" stroke-width="1.3" fill="none"/>
        <path d="M64 50 Q80 30 100 28 Q120 30 136 50" stroke="${c.stroke}" stroke-width="1.3" fill="none"/>
        <!-- Side swept detail -->
        <path d="M65 55 Q72 40 82 42" stroke="${c.stroke}" stroke-width="0.8" fill="none"/>
        <path d="M135 55 Q128 40 118 42" stroke="${c.stroke}" stroke-width="0.8" fill="none"/>
        <!-- Scales earring -->
        <line x1="52" y1="95" x2="52" y2="100" stroke="${c.accent}" stroke-width="0.8"/>
        <line x1="44" y1="104" x2="60" y2="104" stroke="${c.accent}" stroke-width="1"/>
        <path d="M44 104 Q44 112 48 112" stroke="${c.accent}" stroke-width="0.8" fill="none"/>
        <path d="M60 104 Q60 112 56 112" stroke="${c.accent}" stroke-width="0.8" fill="none"/>
        <line x1="52" y1="100" x2="52" y2="104" stroke="${c.accent}" stroke-width="0.8"/>
        <!-- Neck -->
        <line x1="90" y1="151" x2="90" y2="172" stroke="${c.dim}" stroke-width="1"/>
        <line x1="110" y1="151" x2="110" y2="172" stroke="${c.dim}" stroke-width="1"/>
      </svg>`,

    Scorpio: (c) => `
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <!-- Mysterious veil / shadow -->
        <path d="M50 70 Q60 50 80 42 Q100 38 120 42 Q140 50 150 70" stroke="${c.dim}" stroke-width="0.8" fill="none" stroke-dasharray="4,3"/>
        <!-- Face -->
        <ellipse cx="100" cy="105" rx="40" ry="48" stroke="${c.stroke}" stroke-width="1.5" fill="none"/>
        <!-- Eyes - intense, penetrating -->
        <path d="M76 92 Q83 86 92 93" stroke="${c.stroke}" stroke-width="1.5" fill="none"/>
        <path d="M108 93 Q117 86 124 92" stroke="${c.stroke}" stroke-width="1.5" fill="none"/>
        <circle cx="84" cy="92" r="3" fill="${c.stroke}" opacity="0.7"/>
        <circle cx="116" cy="92" r="3" fill="${c.stroke}" opacity="0.7"/>
        <circle cx="84" cy="91" r="1" fill="#0a0a12"/>
        <circle cx="116" cy="91" r="1" fill="#0a0a12"/>
        <!-- Intense eyebrows -->
        <path d="M75 84 Q83 78 93 83" stroke="${c.stroke}" stroke-width="1.4" fill="none"/>
        <path d="M107 83 Q117 78 125 84" stroke="${c.stroke}" stroke-width="1.4" fill="none"/>
        <!-- Nose -->
        <path d="M100 96 L97 108 Q100 111 103 108" stroke="${c.dim}" stroke-width="1" fill="none"/>
        <!-- Mysterious half-smile -->
        <path d="M86 116 Q95 120 100 117" stroke="${c.stroke}" stroke-width="1.3" fill="none"/>
        <path d="M100 117 Q108 122 116 116" stroke="${c.stroke}" stroke-width="1" fill="none"/>
        <!-- Hair - dark, dramatic, angular -->
        <path d="M56 90 Q48 60 60 38 Q72 25 85 45" stroke="${c.stroke}" stroke-width="1.4" fill="none"/>
        <path d="M144 90 Q152 60 140 38 Q128 25 115 45" stroke="${c.stroke}" stroke-width="1.4" fill="none"/>
        <path d="M60 42 Q78 22 100 20 Q122 22 140 42" stroke="${c.stroke}" stroke-width="1.4" fill="none"/>
        <!-- Sharp hair strands -->
        <path d="M62 50 Q55 35 68 28" stroke="${c.stroke}" stroke-width="1" fill="none"/>
        <path d="M138 50 Q145 35 132 28" stroke="${c.stroke}" stroke-width="1" fill="none"/>
        <path d="M70 40 Q78 25 90 30" stroke="${c.stroke}" stroke-width="0.8" fill="none"/>
        <!-- Scorpio stinger mark -->
        <path d="M95 72 Q100 66 105 72 Q103 68 100 65 Q97 68 95 72" stroke="${c.accent}" stroke-width="0.8" fill="none" opacity="0.4"/>
        <!-- Neck -->
        <line x1="90" y1="150" x2="90" y2="172" stroke="${c.dim}" stroke-width="1"/>
        <line x1="110" y1="150" x2="110" y2="172" stroke="${c.dim}" stroke-width="1"/>
      </svg>`,

    Sagittarius: (c) => `
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <!-- Arrow hairpin -->
        <line x1="130" y1="30" x2="145" y2="55" stroke="${c.accent}" stroke-width="1.5"/>
        <path d="M145 55 L140 48 L148 50 Z" stroke="${c.accent}" stroke-width="1" fill="none"/>
        <path d="M130 30 L126 36 L133 34" stroke="${c.accent}" stroke-width="1" fill="none"/>
        <!-- Face -->
        <ellipse cx="100" cy="105" rx="42" ry="50" stroke="${c.stroke}" stroke-width="1.5" fill="none"/>
        <!-- Eyes - bright, adventurous -->
        <path d="M77 93 Q83 86 91 93" stroke="${c.stroke}" stroke-width="1.4" fill="none"/>
        <path d="M109 93 Q115 86 123 93" stroke="${c.stroke}" stroke-width="1.4" fill="none"/>
        <circle cx="84" cy="92" r="2.5" fill="${c.stroke}" opacity="0.6"/>
        <circle cx="116" cy="92" r="2.5" fill="${c.stroke}" opacity="0.6"/>
        <!-- Optimistic eyebrows -->
        <path d="M75 84 Q83 79 92 84" stroke="${c.stroke}" stroke-width="1.2" fill="none"/>
        <path d="M108 84 Q117 79 125 84" stroke="${c.stroke}" stroke-width="1.2" fill="none"/>
        <!-- Nose -->
        <path d="M100 96 L97 108 Q100 111 103 108" stroke="${c.dim}" stroke-width="1" fill="none"/>
        <!-- Wide grin -->
        <path d="M82 116 Q92 126 100 124 Q108 126 118 116" stroke="${c.stroke}" stroke-width="1.3" fill="none"/>
        <!-- Hair - free, windswept -->
        <path d="M58 88 Q50 58 62 38 Q74 25 86 48" stroke="${c.stroke}" stroke-width="1.3" fill="none"/>
        <path d="M142 88 Q150 58 138 38 Q126 25 114 48" stroke="${c.stroke}" stroke-width="1.3" fill="none"/>
        <path d="M62 45 Q80 25 100 22 Q120 25 138 45" stroke="${c.stroke}" stroke-width="1.3" fill="none"/>
        <!-- Wind-blown strands -->
        <path d="M55 75 Q48 55 58 40" stroke="${c.stroke}" stroke-width="1" fill="none"/>
        <path d="M148 80 Q155 60 145 42" stroke="${c.stroke}" stroke-width="1" fill="none"/>
        <path d="M50 90 Q45 72 52 55" stroke="${c.stroke}" stroke-width="0.8" fill="none"/>
        <!-- Neck -->
        <line x1="88" y1="152" x2="88" y2="172" stroke="${c.dim}" stroke-width="1"/>
        <line x1="112" y1="152" x2="112" y2="172" stroke="${c.dim}" stroke-width="1"/>
      </svg>`,

    Capricorn: (c) => `
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <!-- Goat horn tiara -->
        <path d="M75 55 Q70 35 78 22 Q82 18 84 28 Q80 40 82 52" stroke="${c.accent}" stroke-width="1.3" fill="none" opacity="0.7"/>
        <path d="M125 55 Q130 35 122 22 Q118 18 116 28 Q120 40 118 52" stroke="${c.accent}" stroke-width="1.3" fill="none" opacity="0.7"/>
        <!-- Tiara band -->
        <path d="M78 52 Q100 44 122 52" stroke="${c.accent}" stroke-width="1" fill="none" opacity="0.5"/>
        <circle cx="100" cy="46" r="3" stroke="${c.accent}" stroke-width="0.8" fill="none" opacity="0.5"/>
        <!-- Face -->
        <ellipse cx="100" cy="105" rx="40" ry="48" stroke="${c.stroke}" stroke-width="1.5" fill="none"/>
        <!-- Eyes - determined, wise -->
        <path d="M78 93 Q83 87 90 93" stroke="${c.stroke}" stroke-width="1.3" fill="none"/>
        <path d="M110 93 Q115 87 122 93" stroke="${c.stroke}" stroke-width="1.3" fill="none"/>
        <circle cx="84" cy="92" r="2" fill="${c.stroke}" opacity="0.5"/>
        <circle cx="116" cy="92" r="2" fill="${c.stroke}" opacity="0.5"/>
        <!-- Structured eyebrows -->
        <path d="M76 85 Q84 80 92 84" stroke="${c.stroke}" stroke-width="1.2" fill="none"/>
        <path d="M108 84 Q116 80 124 85" stroke="${c.stroke}" stroke-width="1.2" fill="none"/>
        <!-- Nose -->
        <path d="M100 96 L97 108 Q100 111 103 108" stroke="${c.dim}" stroke-width="1" fill="none"/>
        <!-- Controlled smile -->
        <path d="M87 116 Q100 122 113 116" stroke="${c.stroke}" stroke-width="1.2" fill="none"/>
        <!-- Hair - sleek, professional -->
        <path d="M60 88 Q55 60 65 42 Q75 32 85 48" stroke="${c.stroke}" stroke-width="1.3" fill="none"/>
        <path d="M140 88 Q145 60 135 42 Q125 32 115 48" stroke="${c.stroke}" stroke-width="1.3" fill="none"/>
        <path d="M65 48 Q80 30 100 28 Q120 30 135 48" stroke="${c.stroke}" stroke-width="1.3" fill="none"/>
        <!-- Slicked back detail -->
        <path d="M70 45 Q85 32 100 30 Q115 32 130 45" stroke="${c.stroke}" stroke-width="0.8" fill="none"/>
        <!-- Neck -->
        <line x1="90" y1="150" x2="90" y2="172" stroke="${c.dim}" stroke-width="1"/>
        <line x1="110" y1="150" x2="110" y2="172" stroke="${c.dim}" stroke-width="1"/>
      </svg>`,

    Aquarius: (c) => `
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <!-- Face -->
        <ellipse cx="100" cy="105" rx="41" ry="49" stroke="${c.stroke}" stroke-width="1.5" fill="none"/>
        <!-- Eyes - visionary, dreamy -->
        <ellipse cx="82" cy="93" rx="7" ry="5" stroke="${c.stroke}" stroke-width="1.3" fill="none"/>
        <ellipse cx="118" cy="93" rx="7" ry="5" stroke="${c.stroke}" stroke-width="1.3" fill="none"/>
        <circle cx="82" cy="93" r="2.5" fill="${c.stroke}" opacity="0.4"/>
        <circle cx="118" cy="93" r="2.5" fill="${c.stroke}" opacity="0.4"/>
        <!-- Wide-set eyebrows -->
        <path d="M74 85 Q82 79 91 84" stroke="${c.stroke}" stroke-width="1" fill="none"/>
        <path d="M109 84 Q118 79 126 85" stroke="${c.stroke}" stroke-width="1" fill="none"/>
        <!-- Nose -->
        <path d="M100 96 L97 108 Q100 111 103 108" stroke="${c.dim}" stroke-width="1" fill="none"/>
        <!-- Open smile -->
        <path d="M84 116 Q94 125 100 123 Q106 125 116 116" stroke="${c.stroke}" stroke-width="1.3" fill="none"/>
        <!-- Water-stream flowing hair -->
        <path d="M55 90 Q48 60 60 38 Q72 25 85 45" stroke="${c.stroke}" stroke-width="1.3" fill="none"/>
        <path d="M145 90 Q152 60 140 38 Q128 25 115 45" stroke="${c.stroke}" stroke-width="1.3" fill="none"/>
        <path d="M60 42 Q80 22 100 20 Q120 22 140 42" stroke="${c.stroke}" stroke-width="1.3" fill="none"/>
        <!-- Water streams -->
        <path d="M50 80 Q46 65 52 50 Q55 42 50 35" stroke="${c.accent}" stroke-width="1" fill="none" opacity="0.5"/>
        <path d="M48 85 Q44 70 50 55 Q53 48 48 40" stroke="${c.accent}" stroke-width="0.8" fill="none" opacity="0.4"/>
        <path d="M150 80 Q154 65 148 50 Q145 42 150 35" stroke="${c.accent}" stroke-width="1" fill="none" opacity="0.5"/>
        <path d="M152 85 Q156 70 150 55 Q147 48 152 40" stroke="${c.accent}" stroke-width="0.8" fill="none" opacity="0.4"/>
        <!-- Zigzag waves in hair -->
        <path d="M62 55 L66 48 L70 55 L74 48 L78 55" stroke="${c.accent}" stroke-width="0.8" fill="none" opacity="0.3"/>
        <path d="M122 55 L126 48 L130 55 L134 48 L138 55" stroke="${c.accent}" stroke-width="0.8" fill="none" opacity="0.3"/>
        <!-- Neck -->
        <line x1="88" y1="151" x2="88" y2="172" stroke="${c.dim}" stroke-width="1"/>
        <line x1="112" y1="151" x2="112" y2="172" stroke="${c.dim}" stroke-width="1"/>
      </svg>`,

    Pisces: (c) => `
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <!-- Face -->
        <ellipse cx="100" cy="105" rx="42" ry="50" stroke="${c.stroke}" stroke-width="1.5" fill="none"/>
        <!-- Dreamy eyes -->
        <ellipse cx="82" cy="93" rx="7" ry="6" stroke="${c.stroke}" stroke-width="1.3" fill="none"/>
        <ellipse cx="118" cy="93" rx="7" ry="6" stroke="${c.stroke}" stroke-width="1.3" fill="none"/>
        <circle cx="82" cy="93" r="3" fill="${c.stroke}" opacity="0.4"/>
        <circle cx="118" cy="93" r="3" fill="${c.stroke}" opacity="0.4"/>
        <!-- Soft eyebrows -->
        <path d="M75 85 Q83 80 91 84" stroke="${c.stroke}" stroke-width="1" fill="none"/>
        <path d="M109 84 Q117 80 125 85" stroke="${c.stroke}" stroke-width="1" fill="none"/>
        <!-- Nose -->
        <path d="M100 96 L97 108 Q100 111 103 108" stroke="${c.dim}" stroke-width="1" fill="none"/>
        <!-- Gentle, dreamy smile -->
        <path d="M86 117 Q100 126 114 117" stroke="${c.stroke}" stroke-width="1.2" fill="none"/>
        <!-- Flowing, ethereal hair -->
        <path d="M56 90 Q48 60 60 40 Q72 28 85 48" stroke="${c.stroke}" stroke-width="1.3" fill="none"/>
        <path d="M144 90 Q152 60 140 40 Q128 28 115 48" stroke="${c.stroke}" stroke-width="1.3" fill="none"/>
        <path d="M60 45 Q80 25 100 22 Q120 25 140 45" stroke="${c.stroke}" stroke-width="1.3" fill="none"/>
        <!-- Flowing strands -->
        <path d="M52 95 Q46 72 52 52 Q55 40 48 30" stroke="${c.stroke}" stroke-width="0.8" fill="none"/>
        <path d="M148 95 Q154 72 148 52 Q145 40 152 30" stroke="${c.stroke}" stroke-width="0.8" fill="none"/>
        <path d="M55 100 Q48 80 54 60" stroke="${c.stroke}" stroke-width="0.6" fill="none"/>
        <path d="M145 100 Q152 80 146 60" stroke="${c.stroke}" stroke-width="0.6" fill="none"/>
        <!-- Dual fish hair clips -->
        <path d="M62 50 Q58 44 62 38 Q66 44 62 50" stroke="${c.accent}" stroke-width="1" fill="none" opacity="0.6"/>
        <circle cx="60" cy="42" r="1" fill="${c.accent}" opacity="0.4"/>
        <path d="M138 50 Q134 44 138 38 Q142 44 138 50" stroke="${c.accent}" stroke-width="1" fill="none" opacity="0.6"/>
        <circle cx="140" cy="42" r="1" fill="${c.accent}" opacity="0.4"/>
        <!-- Small bubbles / water droplets -->
        <circle cx="55" cy="65" r="2" stroke="${c.accent}" stroke-width="0.6" fill="none" opacity="0.3"/>
        <circle cx="148" cy="70" r="1.5" stroke="${c.accent}" stroke-width="0.6" fill="none" opacity="0.3"/>
        <circle cx="50" cy="80" r="1" stroke="${c.accent}" stroke-width="0.5" fill="none" opacity="0.2"/>
        <!-- Neck -->
        <line x1="88" y1="152" x2="88" y2="172" stroke="${c.dim}" stroke-width="1"/>
        <line x1="112" y1="152" x2="112" y2="172" stroke="${c.dim}" stroke-width="1"/>
      </svg>`
  };

  /**
   * Generate portrait for a zodiac sign
   * @param {string} zodiac - zodiac name (e.g., 'Aries')
   * @param {string} gender - 'male' | 'female' | 'other'
   * @returns {Promise<{imageUrl: string, isAI: boolean, svgString: string}>}
   */
  async function generatePortrait(zodiac, gender) {
    const z = zodiac || 'Aries';
    const generator = avatars[z] || avatars.Aries;
    const svgString = generator(COLORS);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const imageUrl = URL.createObjectURL(blob);
    return { imageUrl, isAI: false, svgString };
  }

  /**
   * Get SVG string for a zodiac (for inline embedding)
   */
  function getZodiacSVG(zodiac) {
    const generator = avatars[zodiac] || avatars.Aries;
    return generator(COLORS);
  }

  /**
   * Get all zodiac SVGs for gallery
   */
  function getAllZodiacSVGs() {
    return Object.keys(avatars).map(name => ({
      name,
      svg: avatars[name](COLORS)
    }));
  }

  // Export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { generatePortrait, getZodiacSVG, getAllZodiacSVGs, avatars };
  } else {
    global.PortraitEngine = { generatePortrait, getZodiacSVG, getAllZodiacSVGs };
  }
})(typeof window !== 'undefined' ? window : global);
