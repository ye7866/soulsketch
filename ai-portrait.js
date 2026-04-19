/**
 * SoulSketch AI Portrait Generator
 * Generates DALL-E 3 pencil sketch portraits via the backend API.
 *
 * Usage:
 *   const result = await generateAIPortrait({ zodiac: 'Leo', gender: 'female' });
 *   // => { imageUrl: 'https://...', prompt: '...', cached: false }
 */
(function (root) {
  'use strict';

  // ============================================================
  // ZODIAC EXPRESSION TRAITS
  // ============================================================
  const ZODIAC_EXPRESSIONS = {
    Aries:      'strong determined gaze, fiery confident energy',
    Taurus:     'warm gentle smile, grounded serene presence',
    Gemini:     'playful curious eyes, lively mischievous spark',
    Cancer:     'soft nurturing expression, tender emotional depth',
    Leo:        'confident radiant smile, regal magnetic charm',
    Virgo:      'composed elegant look, thoughtful refined poise',
    Libra:      'graceful balanced expression, harmonious beauty',
    Scorpio:    'intense mysterious gaze, deep penetrating eyes',
    Sagittarius:'adventurous bright eyes, optimistic free spirit',
    Capricorn:  'focused ambitious look, determined steady presence',
    Aquarius:   'unique visionary stare, unconventional brilliance',
    Pisces:     'dreamy compassionate eyes, ethereal gentle soul',
  };

  // Zodiac-specific accessory/detail
  const ZODIAC_DETAILS = {
    Aries:      'small ram constellation freckle near the temple',
    Taurus:     'delicate flower tucked behind the ear',
    Gemini:     'subtle dual-toned hair highlights',
    Cancer:     'tiny crescent moon earring',
    Leo:        'faint crown-shaped hair accessory',
    Virgo:      'small wheat stalk tucked in the hair',
    Libra:      'elegant dangling scale-shaped earring',
    Scorpio:    'mysterious shadow falling across one eye',
    Sagittarius:'small arrow-shaped hair pin',
    Capricorn:  'subtle horn-shaped hair clips',
    Aquarius:   'flowing water-stream hair detail with tiny waves',
    Pisces:     'small dual fish hair clips with bubble details',
  };

  // ============================================================
  // PROMPT BUILDER
  // ============================================================

  /**
   * Build a DALL-E prompt for a soulmate portrait
   * @param {Object} options
   * @param {string} options.zodiac - Zodiac sign name (e.g. 'Leo')
   * @param {string} options.gender - 'male', 'female', or 'other'
   * @param {string} [options.style] - Override style (default: pencil sketch)
   * @returns {string} The DALL-E prompt
   */
  function buildPrompt(options) {
    const zodiac = options.zodiac || 'Aries';
    const gender = options.gender || 'other';
    const expression = ZODIAC_EXPRESSIONS[zodiac] || ZODIAC_EXPRESSIONS.Aries;
    const detail = ZODIAC_DETAILS[zodiac] || '';

    let personDesc;
    if (gender === 'female') {
      personDesc = 'a young woman, slightly wavy hair, delicate features, wearing a thin chain necklace';
    } else if (gender === 'male') {
      personDesc = 'a young man, short styled hair, strong jawline, wearing a casual collar';
    } else {
      personDesc = 'a young person, androgynous features, flowing textured hair, minimalist jewelry';
    }

    const prompt = [
      `A romantic pencil sketch portrait of ${personDesc},`,
      'soft charcoal drawing style,',
      `${expression},`,
      detail ? `${detail},` : '',
      'drawn on cream textured paper,',
      'artistic portrait illustration,',
      'warm golden lighting,',
      'monochrome with subtle gold accents,',
      'face centered, shoulders visible,',
      'high detail, museum quality sketch',
    ].filter(Boolean).join(' ');

    return prompt;
  }

  // ============================================================
  // CLIENT-SIDE CACHE
  // ============================================================
  const cache = new Map();
  const MAX_CACHE = 24;

  function cacheKey(zodiac, gender) {
    return `${zodiac}:${gender}`;
  }

  function getCached(zodiac, gender) {
    return cache.get(cacheKey(zodiac, gender)) || null;
  }

  function setCached(zodiac, gender, data) {
    const key = cacheKey(zodiac, gender);
    // LRU: delete oldest if at capacity
    if (cache.size >= MAX_CACHE) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    cache.set(key, data);
  }

  // ============================================================
  // API CALL
  // ============================================================

  /**
   * Generate an AI portrait via the backend API
   * @param {Object} options
   * @param {string} options.zodiac - Zodiac sign
   * @param {string} options.gender - 'male', 'female', or 'other'
   * @param {string} [options.age_hint] - Age hint (unused for now)
   * @param {string} [options.style] - Style override
   * @returns {Promise<{imageUrl: string, prompt: string, cached: boolean}>}
   */
  async function generateAIPortrait(options) {
    const zodiac = options.zodiac || 'Aries';
    const gender = options.gender || 'other';

    // Check client-side cache first
    const cached = getCached(zodiac, gender);
    if (cached) {
      return { ...cached, cached: true };
    }

    try {
      const resp = await fetch('/api/generate-portrait', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zodiac, gender }),
      });

      if (!resp.ok) {
        throw new Error(`Portrait API returned ${resp.status}`);
      }

      const data = await resp.json();

      if (data.imageUrl) {
        setCached(zodiac, gender, { imageUrl: data.imageUrl, prompt: data.prompt });
        return { imageUrl: data.imageUrl, prompt: data.prompt, cached: false };
      }

      throw new Error('No imageUrl in response');
    } catch (err) {
      console.warn('[ai-portrait] Generation failed, using SVG fallback:', err.message);
      return { imageUrl: null, prompt: buildPrompt(options), cached: false };
    }
  }

  // ============================================================
  // EXPORT
  // ============================================================
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { generateAIPortrait, buildPrompt, ZODIAC_EXPRESSIONS, ZODIAC_DETAILS };
  } else {
    root.AIPortrait = { generateAIPortrait, buildPrompt };
  }
})(typeof window !== 'undefined' ? window : global);
