/**
 * SoulSketch AI Reading Engine
 * Generates personalized soulmate readings via OpenAI or local template fallback.
 *
 * Usage (browser):
 *   const result = await SoulSketchAI.generate({ userName, userZodiac, soulmateName, soulmateZodiac, priority });
 *   // => { reading, traits, compatibility, advice }
 *
 * Usage (Node / api-proxy):
 *   const engine = require('./ai-engine');
 *   const result = await engine.generate({ ... });
 */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.SoulSketchAI = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ================================================================
     ZODIAC DATA
     ================================================================ */
  const ZODIAC = {
    Aries:      { element:'fire',  symbol:'♈', traits:['bold','passionate','impulsive','courageous'] },
    Taurus:     { element:'earth', symbol:'♉', traits:['grounded','sensual','stubborn','reliable'] },
    Gemini:     { element:'air',   symbol:'♊', traits:['curious','witty','adaptable','restless'] },
    Cancer:     { element:'water', symbol:'♋', traits:['nurturing','intuitive','protective','moody'] },
    Leo:        { element:'fire',  symbol:'♌', traits:['magnetic','generous','proud','dramatic'] },
    Virgo:      { element:'earth', symbol:'♍', traits:['analytical','devoted','modest','critical'] },
    Libra:      { element:'air',   symbol:'♎', traits:['harmonious','charming','diplomatic','indecisive'] },
    Scorpio:    { element:'water', symbol:'♏', traits:['intense','loyal','mysterious','possessive'] },
    Sagittarius:{ element:'fire',  symbol:'♐', traits:['free-spirited','philosophical','blunt','restless'] },
    Capricorn:  { element:'earth', symbol:'♑', traits:['ambitious','disciplined','patient','guarded'] },
    Aquarius:   { element:'air',   symbol:'♒', traits:['visionary','independent','eccentric','detached'] },
    Pisces:     { element:'water', symbol:'♓', traits:['dreamy','compassionate','artistic','escapist'] },
  };

  const ELEMENT_COMPAT = {
    fire:  { fire:0.85, air:0.95, earth:0.55, water:0.50 },
    earth: { earth:0.85, water:0.95, fire:0.55, air:0.50 },
    air:   { air:0.85, fire:0.95, water:0.55, earth:0.50 },
    water: { water:0.85, earth:0.95, fire:0.50, air:0.55 },
  };

  // Traditional zodiac-pair harmony (trines & sextiles get a boost)
  const TRINE  = [['Aries','Leo','Sagittarius'],['Taurus','Virgo','Capricorn'],['Gemini','Libra','Aquarius'],['Cancer','Scorpio','Pisces']];
  const SEXTILE = [['Aries','Gemini'],['Aries','Aquarius'],['Taurus','Cancer'],['Taurus','Pisces'],
    ['Gemini','Leo'],['Gemini','Aries'],['Cancer','Virgo'],['Cancer','Taurus'],
    ['Leo','Libra'],['Leo','Gemini'],['Virgo','Scorpio'],['Virgo','Cancer'],
    ['Libra','Sagittarius'],['Libra','Leo'],['Scorpio','Capricorn'],['Scorpio','Virgo'],
    ['Sagittarius','Aquarius'],['Sagittarius','Libra'],['Capricorn','Pisces'],['Capricorn','Scorpio'],
    ['Aquarius','Aries'],['Aquarius','Sagittarius'],['Pisces','Taurus'],['Pisces','Capricorn']];

  function pairInList(a, b, list) {
    return list.some(g => g.includes(a) && g.includes(b));
  }

  function zodiacCompatibility(a, b) {
    if (a === b) return 0.82;
    const elA = ZODIAC[a]?.element;
    const elB = ZODIAC[b]?.element;
    let base = ELEMENT_COMPAT[elA]?.[elB] ?? 0.65;
    if (pairInList(a, b, TRINE)) base = Math.min(base + 0.08, 0.99);
    else if (pairInList(a, b, SEXTILE)) base = Math.min(base + 0.04, 0.97);
    // Add controlled randomness
    base += (seededRand(hashStr(a + b)) - 0.5) * 0.06;
    return Math.max(0.55, Math.min(0.98, base));
  }

  /* ================================================================
     DETERMINISTIC HELPERS
     ================================================================ */
  function hashStr(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  }
  function seededRand(seed) {
    let s = seed || 1;
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  }
  function pick(arr, seed) { return arr[seed % arr.length]; }

  /* ================================================================
     PRIORITY CONTENT POOLS
     ================================================================ */
  const PRIORITY_CONTENT = {
    passion: {
      openers: [
        'There is a fire between you that the stars themselves envy.',
        'The chemistry between you is electric — the kind that rearranges molecules.',
        'Your souls burn with a shared flame that time cannot diminish.',
      ],
      middles: [
        'When you are together, the air itself seems to crackle with anticipation. {sm} will look at {obj} in a way that makes the rest of the world dissolve — a gaze so intent it feels like being seen for the first time.',
        'The physical magnetism between you defies rational explanation. {sm} will reach for {obj} hand with a tenderness that belies the wildfire underneath, and in that touch, entire universes will ignite.',
        'Your connection operates on a frequency of desire that most people only read about. {sm} will memorize the shape of {obj} laughter, the way light catches {obj} eyes — cataloguing every detail like sacred scripture.',
      ],
      closers: [
        'Let this fire consume you. Some connections are not meant to be managed — they are meant to be surrendered to, completely and without apology.',
        'This is the love that poets lose sleep over. Do not temper it. Do not explain it. Simply let it burn.',
      ],
    },
    stability: {
      openers: [
        'In {sm}, you will find a harbor — still, deep, and unshakable.',
        'The foundation you build together will be the kind that weatherproofs against any storm.',
        'Your souls recognize in each other a rare constancy that most spend lifetimes searching for.',
      ],
      middles: [
        '{sm} will become {obj} safe place — not through grand declarations, but through the quiet reliability of showing up, every single day. When the world spins too fast, {sm} will be the axis that keeps {obj} grounded.',
        'Together, you will create rituals that anchor you: morning coffee in comfortable silence, hands finding each other under dinner tables, the unspoken agreement that home is not a place but a person.',
        'Where others offer excitement that fades, {sm} offers something rarer — a love that deepens with routine, that finds magic in the mundane, that turns Tuesday evenings into something sacred.',
      ],
      closers: [
        'Build slowly, build honestly. What you are creating together is not a fleeting spark — it is a hearth fire that will warm you both for decades.',
        'This is the love that survives the parts of life no one posts about. Cherish its steadiness — it is the rarest thing in the universe.',
      ],
    },
    adventure: {
      openers: [
        '{sm} is the co-author of the wildest chapter yet to be written in {obj} story.',
        'The universe paired you with someone who will never let {obj} world grow small.',
        'In {sm}, you find not just a partner but a fellow explorer of everything this life has to offer.',
      ],
      middles: [
        '{sm} will challenge {obj} to say yes when instinct says no — to book the flight, to take the detour, to eat the thing {pron} cannot pronounce. Together, you will collect stories the way others collect furniture.',
        'Your relationship will be a series of "remember when" moments strung together like constellations: midnight drives to nowhere, foreign cities navigated by instinct, conversations at 3am that rearrange {obj} entire worldview.',
        'With {sm}, growth is not optional — it is the air you breathe. {pron_c} will hold up mirrors {pron} did not know existed, revealing versions of {obj}self that are braver, bolder, and more alive than {pron} ever imagined.',
      ],
      closers: [
        'Pack light, love hard, and never stop exploring — together, the map has no edges.',
        'The best stories come from the detours. With {sm}, every wrong turn becomes the adventure of a lifetime.',
      ],
    },
    intellect: {
      openers: [
        'In {sm}, you have found the rarest thing: a mind that matches and challenges {obj} own.',
        'Your souls connect first through the electric thrill of being truly understood.',
        '{sm} will be the conversation {pron} never want to end — the one that starts over dinner and finishes at dawn.',
      ],
      middles: [
        'Together, you will build a private world of references, debates, and shared curiosities. {sm} will send {obj} articles at midnight, will argue passionately about things that matter and things that do not, will make {obj} feel intellectually alive in ways that feel almost physical.',
        'Where small talk exhausts {obj}, {sm} energizes. You will discuss philosophy over takeout, deconstruct films in bed, challenge each other\'s assumptions with the gentle ferocity of people who believe the other is capable of more.',
        '{sm} sees the world through a lens that both mirrors and contradicts {obj} own — and that tension is where the magic lives. You will never run out of things to talk about, because the world itself is your shared syllabus.',
      ],
      closers: [
        'Never stop asking each other hard questions. The minds that challenge us are the minds that change us.',
        'A meeting of minds is its own kind of romance. Protect this intellectual sanctuary — it will sustain you when nothing else can.',
      ],
    },
    humor: {
      openers: [
        '{sm} is the person who will make {obj} stomach hurt from laughing — the kind of joy that catches you off guard.',
        'In {sm}, you find someone who speaks the secret language of {obj} absurdity.',
        'The universe has a sense of humor, and it paired you with someone who shares it perfectly.',
      ],
      middles: [
        '{sm} will find {obj} funny in ways {pron} did not know {pron} was funny — will laugh at the exact moments {pron} were being unintentionally ridiculous, will send memes at precisely the right moment, will turn arguments into inside jokes before {pron} even realize the fight is over.',
        'Together, you will develop a comedic shorthand that alienates everyone around you: a look across a room that says everything, running bits that evolve over months, the ability to make each other cry-laugh in the most inappropriate settings.',
        'Life with {sm} is lighter — not because you avoid the hard stuff, but because you face it together with the radical absurdity of people who know that laughter is its own form of survival.',
      ],
      closers: [
        'Never lose the ability to make each other laugh. It is the glue that holds every other beautiful thing together.',
        'A shared sense of humor is a shared worldview. Hold onto this joy — it is your superpower as a couple.',
      ],
    },
  };

  /* ================================================================
     ELEMENT-SPECIFIC FLAVOUR TEXT
     ================================================================ */
  const ELEMENT_TEXT = {
    fire: {
      bond: 'a combustion — sudden, bright, impossible to ignore',
      dynamic: 'You amplify each other, feeding a flame that demands attention.',
      caution: 'Remember to give each other oxygen; even the brightest fires need air.',
    },
    earth: {
      bond: 'a rootedness — slow-growing, deeply anchored, enduring',
      dynamic: 'You build together, brick by patient brick, something that will last.',
      caution: 'Allow each other to wander; even the strongest roots need room to spread.',
    },
    air: {
      bond: 'a current — invisible, everywhere, utterly essential',
      dynamic: 'You move together in intellectual and emotional currents that carry you both forward.',
      caution: 'Stay present with each other; even the wind must sometimes be still.',
    },
    water: {
      bond: 'a tide — deep, feeling, gravitational',
      dynamic: 'You feel each other across distances, a pull that defies explanation.',
      caution: 'Maintain your own shores; even the deepest waters need boundaries.',
    },
  };

  /* ================================================================
     TRAIT GENERATION
     ================================================================ */
  const TRAIT_POOL = {
    fire:  ['Passionate','Bold','Magnetic','Fearless','Charismatic','Fiery Spirit','Trailblazer'],
    earth: ['Grounded','Reliable','Patient','Devoted','Sensual','Rock-Solid','Nurturing Provider'],
    air:   ['Witty','Curious','Visionary','Communicative','Free-Thinking','Eloquent','Stimulating'],
    water: ['Intuitive','Deep Feelings','Empathetic','Romantic','Soulful','Mystical','Healer'],
  };

  function generateTraits(uZod, sZod, priority, seed) {
    const elU = ZODIAC[uZod]?.element || 'fire';
    const elS = ZODIAC[sZod]?.element || 'air';
    const pool = [...new Set([
      ...(TRAIT_POOL[elS] || []),
      ...(TRAIT_POOL[elU] || []),
      ...(ZODIAC[sZod]?.traits || []),
    ])];
    // Deterministic shuffle from seed
    const shuffled = pool.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(seededRand(seed + i) * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, 5);
  }

  /* ================================================================
     ADVICE GENERATION
     ================================================================ */
  function generateAdvice(uZod, sZod, priority, seed) {
    const elU = ZODIAC[uZod]?.element || 'fire';
    const elS = ZODIAC[sZod]?.element || 'air';
    const et = ELEMENT_TEXT[elS] || ELEMENT_TEXT.air;
    const bondNoun = et.bond.split('—')[0].replace(/^a /, '').trim();
    const advices = [
      `${et.caution} When conflict arises — and it will — lead with curiosity instead of certainty.`,
      `${et.dynamic} Schedule intentional time for each other; even cosmic connections need maintenance in the physical world.`,
      `Trust the ${bondNoun} between you. ${et.caution}`,
      `Remember that ${uZod} energy can sometimes clash with ${sZod} energy. Lean into the differences — they are where the growth lives.`,
    ];
    return pick(advices, seed);
  }

  /* ================================================================
     READING TEMPLATE ENGINE (LOCAL FALLBACK)
     ================================================================ */
  function templateGenerate(params) {
    const { userName, userZodiac, soulmateName, soulmateZodiac, priority } = params;
    const uZod = userZodiac || 'Aries';
    const sZod = soulmateZodiac || 'Libra';
    const uName = userName || 'Seeker';
    const sName = soulmateName || 'Your Soulmate';
    const pri = priority || 'passion';
    const seed = hashStr(uName + sName + uZod + sZod + pri);

    const compat = zodiacCompatibility(uZod, sZod);
    const score = Math.round(compat * 100);
    const elU = ZODIAC[uZod]?.element || 'fire';
    const elS = ZODIAC[sZod]?.element || 'air';
    const et = ELEMENT_TEXT[elS] || ELEMENT_TEXT.air;
    const content = PRIORITY_CONTENT[pri] || PRIORITY_CONTENT.passion;

    // Pronoun handling
    const pronouns = { he:'he', she:'she', they:'they', him:'him', her:'her', them:'them', his:'his', their:'their' };
    const pron = 'you';
    const obj = 'your';
    const sm = sName;
    const pron_c = sName;

    function fill(tpl) {
      return tpl
        .replace(/\{sm\}/g, sm)
        .replace(/\{obj\}/g, obj)
        .replace(/\{pron\}/g, pron)
        .replace(/\{pron_c\}/g, pron_c)
        .replace(/\{uName\}/g, uName);
    }

    // Build 3 paragraphs
    const opener = fill(pick(content.openers, seed));
    const middle = fill(pick(content.middles, seed + 1));
    const closer = fill(pick(content.closers, seed + 2));

    // Weave in zodiac & element specifics
    const zodiacDetail = `As a ${sZod} (${ZODIAC[sZod]?.element} sign), ${sName} carries ${ZODIAC[sZod]?.traits.slice(0, 2).join(' and ')} energy that ${elU === elS ? 'mirrors and magnifies' : 'complements and tempers'} your own ${uZod} nature.`;
    const elementDetail = `The bond between a ${elU} sign and a ${elS} sign is ${et.bond}. ${et.dynamic}`;

    // Compose reading
    const para1 = `${uName}, ${opener} ${zodiacDetail}`;
    const para2 = `${middle} ${elementDetail}`;
    const para3 = `${closer}`;

    const reading = [para1, para2, para3].join('\n\n');
    const traits = generateTraits(uZod, sZod, pri, seed);
    const advice = generateAdvice(uZod, sZod, pri, seed);

    return { reading, traits, compatibility: score, advice };
  }

  /* ================================================================
     OPENAI API CALL (browser & Node)
     ================================================================ */
  async function openAIGenerate(params, apiKey) {
    const { userName, userZodiac, soulmateName, soulmateZodiac, priority } = params;

    const systemPrompt = `You are an elite psychic reader and astrologer writing soulmate readings. Your readings feel deeply personal, warm, and emotionally resonant — like a gifted intuitive speaking directly to someone's soul. You blend astrology, emotional intelligence, and poetic language.

Rules:
- Write exactly 3 paragraphs (separated by \\n\\n).
- Be specific: use the names, zodiac signs, and priority provided. Reference actual zodiac traits and element dynamics.
- Avoid generic horoscope language. Each reading must feel uniquely crafted for this person.
- Use warm, intimate tone — second person ("you", "your").
- Include subtle astrological details (element dynamics, planetary influences, sign traits).
- Do NOT use bullet points, headers, or lists in the reading.
- End with something that lingers — a line they'll remember at 2am.`;

    const userMsg = `Generate a soulmate reading for:
- Name: ${userName}
- Zodiac: ${userZodiac}
- Soulmate's name: ${soulmateName || 'unknown (the universe will reveal)'}
- Soulmate's zodiac: ${soulmateZodiac || 'unknown'}
- What matters most: ${priority}

Also return, as a JSON object after the reading:
1. "traits": array of 5 personality traits for the soulmate (based on their zodiac sign)
2. "compatibility": number 55-98 (based on zodiac element compatibility)
3. "advice": one sentence of relationship advice (warm, specific)

Format your response as:
READING:
[3 paragraphs]

JSON:
\`\`\`json
{ "traits": [...], "compatibility": N, "advice": "..." }
\`\`\``;

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMsg },
        ],
        temperature: 0.85,
        max_tokens: 800,
      }),
    });

    if (!resp.ok) throw new Error(`OpenAI ${resp.status}`);
    const data = await resp.json();
    const text = data.choices?.[0]?.message?.content || '';

    // Parse reading
    let reading = text;
    let traits = null, compatibility = null, advice = null;

    const readingMatch = text.match(/READING:\s*([\s\S]*?)(?=JSON:|$)/i);
    if (readingMatch) reading = readingMatch[1].trim();

    const jsonMatch = text.match(/```json\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        traits = parsed.traits;
        compatibility = parsed.compatibility;
        advice = parsed.advice;
      } catch(e) { /* fallback below */ }
    }

    // Fallbacks if parsing incomplete
    if (!traits || !compatibility || !advice) {
      const fallback = templateGenerate(params);
      traits = traits || fallback.traits;
      compatibility = compatibility || fallback.compatibility;
      advice = advice || fallback.advice;
    }

    return { reading, traits, compatibility, advice };
  }

  /* ================================================================
     MAIN EXPORT
     ================================================================ */
  async function generate(params) {
    // Normalize
    const p = {
      userName:       params.userName || 'Seeker',
      userZodiac:     params.userZodiac || 'Aries',
      soulmateName:   params.soulmateName || '',
      soulmateZodiac: params.soulmateZodiac || 'Libra',
      priority:       params.priority || 'passion',
      apiKey:         params.apiKey || null,
    };

    // Try OpenAI if key available
    if (p.apiKey) {
      try {
        return await openAIGenerate(p, p.apiKey);
      } catch (err) {
        console.warn('[SoulSketchAI] OpenAI failed, using template:', err.message);
      }
    }

    // Local template fallback
    return templateGenerate(p);
  }

  /* ================================================================
     NODE API PROXY HELPER (used by api-proxy.js)
     ================================================================ */
  async function generateViaProxy(baseUrl, params) {
    try {
      const resp = await fetch(`${baseUrl}/api/reading`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!resp.ok) throw new Error(`Proxy ${resp.status}`);
      return await resp.json();
    } catch (err) {
      console.warn('[SoulSketchAI] Proxy failed, local fallback:', err.message);
      return templateGenerate(params);
    }
  }

  return { generate, generateViaProxy, templateGenerate, ZODIAC, zodiacCompatibility };
});
