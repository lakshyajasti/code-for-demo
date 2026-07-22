/* AFSAC Online — Main JS */

document.addEventListener('DOMContentLoaded', () => {
  initGovBanner();
  initUSGModal();
  initToolAccordion();
  initFloatingWidget();
  initChatbot();
  alignApplicationsCards();
  alignHomeApplicationCards();
  alignToolboxApplicationCards();
  initSearch();
  initFooterLegal();
  initMobileNav();
  setActiveNav();

  window.addEventListener('resize', () => {
    alignApplicationsCards();
    alignHomeApplicationCards();
    alignToolboxApplicationCards();
  });

  // Re-run once all assets/fonts are fully loaded to prevent post-render drift.
  window.addEventListener('load', () => {
    alignApplicationsCards();
    alignHomeApplicationCards();
    alignToolboxApplicationCards();
  });
});

/* ── Government banner dismiss ──────────────────────────── */
function initGovBanner() {
  const banner = document.querySelector('.gov-banner');
  const btn = document.querySelector('.gov-banner-dismiss');
  if (!banner || !btn) return;
  if (sessionStorage.getItem('govBannerDismissed')) { banner.classList.add('hidden'); return; }
  btn.addEventListener('click', () => {
    banner.style.transition = 'all .3s ease';
    banner.style.overflow = 'hidden';
    banner.style.maxHeight = banner.offsetHeight + 'px';
    requestAnimationFrame(() => { banner.style.maxHeight = '0'; banner.style.opacity = '0'; });
    setTimeout(() => banner.classList.add('hidden'), 320);
    sessionStorage.setItem('govBannerDismissed', '1');
  });
}

/* ── USG notice modal (first visit per session) ─────────── */
function initUSGModal() {
  const modal = document.getElementById('usg-modal');
  const accept = document.getElementById('usg-accept');
  if (!modal) return;
  if (!sessionStorage.getItem('usgAccepted')) modal.classList.remove('hidden');
  if (accept) accept.addEventListener('click', () => {
    modal.classList.add('hidden');
    sessionStorage.setItem('usgAccepted', '1');
  });
}

/* ── Tool accordion ─────────────────────────────────────── */
function initToolAccordion() {
  document.querySelectorAll('.tool-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const item = trigger.closest('.tool-item');
      const body = item.querySelector('.tool-body');
      const isOpen = trigger.classList.contains('open');

      // close all
      document.querySelectorAll('.tool-trigger.open').forEach(t => {
        t.classList.remove('open');
        t.setAttribute('aria-expanded', 'false');
        t.closest('.tool-item').querySelector('.tool-body').classList.remove('open');
      });

      if (!isOpen) {
        trigger.classList.add('open');
        trigger.setAttribute('aria-expanded', 'true');
        body.classList.add('open');
      }
    });
  });
}

/* ── Chatbot ────────────────────────────────────────────── */
const TOOL_URLS = {
  Requisition: 'toolbox.html#tool-requisition',
  Logistics:   'toolbox.html#tool-logistics',
  Case:        'toolbox.html#tool-case',
  SDR:         'toolbox.html#tool-sdr',
  CLSSA:       'toolbox.html#tool-clssa',
  PROS:        'dashboard.html',
  WWRS:        'wwrs-tools.html',
  Metrics:     'toolbox.html#tool-metrics'
};

const BOT_DATA = [
  {
    kw: ['financial','budget','finance','analyst','accounting','obligation','expenditure','cost'],
    tools: ['Case','Metrics'],
    text: 'For financial analysis and budget tracking I recommend the <strong>Case</strong> module — it provides enhanced case data reporting, obligation tracking, and FMS financial visibility. Pair it with <strong>Metrics</strong> for automated dashboard production.'
  },
  {
    kw: ['ship','shipment','shipping','logistics','catalog','cargo','delivery','track','transit','pipeline'],
    tools: ['Logistics','SDR','WWRS'],
    text: 'Start with <strong>Logistics</strong> for catalog data and detailed insight into your requisitioning pipeline. Use <strong>SDR</strong> if you need to report shipping or packaging discrepancies. <strong>WWRS</strong> handles redistribution of surplus materiel back to the U.S. Government.'
  },
  {
    kw: ['requisition','request','order','submit','purchase','procure','nonstandard','non-standard'],
    tools: ['Requisition','PROS'],
    text: 'The <strong>Requisition</strong> tool handles both standard and non-standard request submissions. For difficult-to-source or nonstandard items requiring a specialized contracting vehicle, <strong>PROS</strong> provides procurement and maintenance support through task orders.'
  },
  {
    kw: ['clssa','cooperative','stock','stockage','arrangement','supply arrangement'],
    tools: ['CLSSA'],
    text: 'The <strong>CLSSA</strong> module (Cooperative Logistics Supply Support Arrangement) is purpose-built for managing cooperative supply arrangements between partner nations and the U.S. Air Force.'
  },
  {
    kw: ['metric','report','dashboard','kpi','performance','analytics','data','summary','executive'],
    tools: ['Metrics'],
    text: 'The <strong>Metrics</strong> tool automates production of regularly scheduled performance reports and gives you quick access to key data — ideal for executive summaries and trend analysis.'
  },
  {
    kw: ['discrepancy','damage','missing','shortage','sdr','packaging','defect'],
    tools: ['SDR'],
    text: 'The <strong>SDR</strong> (Supply Discrepancy Report) tool is designed specifically for reporting shipping and packaging discrepancies attributed to the shipper, managing official responses, and tracking resolution status.'
  },
  {
    kw: ['redistribution','warehouse','wwrs','surplus','excess','materiel'],
    tools: ['WWRS'],
    text: '<strong>WWRS</strong> (World Wide Warehouse Redistribution Services) accepts surplus materiel back on behalf of the U.S. Government and redistributes it to fill other FMS requisitions — reducing excess and improving supply efficiency.'
  },
  {
    kw: ['all','everything','overview','list','show me','available','what tools','which'],
    tools: ['Requisition','Logistics','Case','SDR','CLSSA','PROS','WWRS','Metrics'],
    text: 'AFSAC Online provides 8 core applications for FMS program management. Here\'s the full toolset:'
  }
];

const FALLBACK = 'I can help you find the right tool. Try describing your role or task — for example: <em>"I need to track a shipment"</em> or <em>"I am a program manager reviewing Case data."</em>';

const AUTH_REQUIRED_PREFIXES = [
  'apps.html',
  'toolbox.html',
  'dashboard.html',
  'wwrs.html',
  'wwrs-tools.html',
  'req_input.jsp',
  'logistics.jsp',
  'financial.jsp',
  'sdr.jsp',
  'clssa.jsp',
  'pros.jsp',
  'afsac-metrics'
];

function isUserSignedIn() {
  return !!sessionStorage.getItem('afsacUser');
}

function stripHrefToPath(href) {
  if (!href) return '';
  return href.split('#')[0].split('?')[0].replace(/^\.\//, '').toLowerCase();
}

function linkRequiresSignIn(href) {
  const path = stripHrefToPath(href);
  return AUTH_REQUIRED_PREFIXES.some((prefix) => path.endsWith(prefix) || path.includes('/' + prefix));
}

const KNOWLEDGE_ACRONYMS = {
  WWRS: {
    expansion: 'Worldwide Warehouse Redistribution Services',
    detail: 'Tri-service program that redistributes serviceable excess materiel to support FMS requisitions.',
    tools: ['WWRS']
  },
  PROS: {
    expansion: 'Parts and Repair Ordering System',
    detail: 'Supports procurement and maintenance actions, including non-standard sourcing workflows.',
    tools: ['PROS']
  },
  SDR: {
    expansion: 'Supply Discrepancy Report',
    detail: 'Used to report and resolve shipping and packaging discrepancies.',
    tools: ['SDR']
  },
  CLSSA: {
    expansion: 'Cooperative Logistics Supply Support Arrangement',
    detail: 'Framework for cooperative supply support between partner nations and the U.S. Air Force.',
    tools: ['CLSSA']
  },
  PMO: {
    expansion: 'Program Management Office',
    detail: 'Operational office responsible for program oversight, policy guidance, and support coordination.',
    tools: ['WWRS', 'PROS']
  },
  FMS: {
    expansion: 'Foreign Military Sales',
    detail: 'U.S. government program for defense articles and services to international partners.',
    tools: ['Case', 'Requisition', 'Logistics', 'WWRS']
  },
  NSN: {
    expansion: 'National Stock Number',
    detail: 'Standardized item identifier used across supply and logistics systems.',
    tools: ['Logistics', 'WWRS']
  },
  FSC: {
    expansion: 'Federal Supply Class',
    detail: 'Category code used in the NSN structure to group similar items.',
    tools: ['WWRS', 'Logistics']
  },
  NIIN: {
    expansion: 'National Item Identification Number',
    detail: 'Item identifier segment within an NSN.',
    tools: ['WWRS', 'Logistics']
  },
  CAGE: {
    expansion: 'Commercial and Government Entity',
    detail: 'Code that identifies suppliers and organizations for procurement and logistics records.',
    tools: ['WWRS', 'Logistics']
  },
  MISIL: {
    expansion: 'Management Information System for International Logistics',
    detail: 'Navy-side international logistics system used with WWRS routing workflows.',
    tools: ['WWRS', 'Requisition']
  },
  CISIL: {
    expansion: 'Centralized Information System for International Logistics',
    detail: 'Army-side international logistics system used with WWRS routing workflows.',
    tools: ['WWRS', 'Requisition']
  },
  MILSTRIP: {
    expansion: 'Military Standard Requisitioning and Issue Procedure',
    detail: 'Standard process used to submit requisitions in logistics and FMS systems.',
    tools: ['Requisition', 'WWRS', 'Logistics']
  },
  MIPR: {
    expansion: 'Military Interdepartmental Purchase Request',
    detail: 'Funding document used for interdepartmental support transactions.',
    tools: ['Case', 'WWRS']
  },
  RDO: {
    expansion: 'Redistribution Order',
    detail: 'WWRS order that authorizes sellers to ship selected materiel to the inspection point.',
    tools: ['WWRS']
  },
  RIC: {
    expansion: 'Routing Identifier Code',
    detail: 'Routing code used to direct requisitions. WWRS commonly uses FWW and FNH contexts.',
    tools: ['Requisition', 'WWRS']
  },
  BV: {
    expansion: 'Advice Code BV',
    detail: 'In WWRS buyer guidance, BV is treated as an advice code indicating a specific source requirement; requisitions with this constraint are not handled through standard WWRS fill routing.',
    tools: ['WWRS', 'Requisition']
  },
  BW: {
    expansion: 'Advice Code BW',
    detail: 'Requests supply from an ALC blanket ordering agreement tied to specific contractor support.',
    tools: ['WWRS', 'Requisition']
  },
  '6P': {
    expansion: 'Advice Code 6P',
    detail: 'Requests new and unused materiel; WWRS transfers are generally not treated as new/unused in this context.',
    tools: ['WWRS', 'Requisition']
  },
  '6V': {
    expansion: 'Advice Code 6V',
    detail: 'Identifies sole-source integrity requirements that can limit WWRS routing eligibility.',
    tools: ['WWRS', 'Requisition']
  },
  '6W': {
    expansion: 'Advice Code 6W',
    detail: 'Identifies single-vendor integrity requirements that can limit WWRS routing eligibility.',
    tools: ['WWRS', 'Requisition']
  }
};

const KNOWLEDGE_STATUS_CODES = {
  BZ: 'Research and solicitation phase has begun.',
  BV: 'Contract awarded and estimated ship/delivery date established.',
  IV: 'Task Order contract award with estimated completion date.',
  XQ: 'Customer asked the contractor a question.',
  RQ: 'Contractor response to customer question.',
  X4: 'Delay pending USG decision or guidance.',
  R4: 'USG decision or guidance received.',
  RK: 'Shipment reported through DTS channels (paired with AS3).',
  AS3: 'Shipment action/status posted for movement to customer.',
  RB: 'Administrative/billing progression status.',
  CG: 'Cancellation status (contractor/customer cancellation workflow).',
  CU: 'Cancellation status indicating unsuccessful or terminated effort.',
  CY: 'Cancellation status associated with vendor/supply supportability issues.',
  CA: 'Cancellation of standard or LOA sole source item; research fee may apply.'
};

const KNOWLEDGE_TOPICS = [
  {
    keys: ['requisition', 'what is requisition', 'request submission', 'submit order'],
    text: '<strong>Requisition</strong> supports standard and non-standard request submission workflows. In WWRS context, requisitions may use RIC <strong>FWW</strong> for direct WWRS routing and are processed according to MILSTRIP and buyer guidance rules.',
    tools: ['Requisition', 'WWRS']
  },
  {
    keys: ['logistics', 'shipment tracking', 'catalog', 'pipeline', 'delivery status'],
    text: '<strong>Logistics</strong> is the primary module for shipment visibility, catalog data, and pipeline tracking. For shipping or packaging issues, pair with <strong>SDR</strong>.',
    tools: ['Logistics', 'SDR']
  },
  {
    keys: ['pros', 'pros v', 'parts and repair', 'non-standard supply'],
    text: '<strong>PROS V</strong> supports parts and repair ordering workflows, including non-standard supply support and PMO coordination for sourcing and maintenance actions.',
    tools: ['PROS']
  },
  {
    keys: ['wwrs', 'redistribution', 'surplus', 'excess materiel'],
    text: '<strong>WWRS</strong> accepts excess serviceable materiel on behalf of the U.S. Government and redistributes it to satisfy valid FMS requirements, reducing lead times and excess storage burden.',
    tools: ['WWRS']
  },
  {
    keys: ['broadcast', 'open broadcasts', 'what are broadcasts'],
    text: 'A <strong>broadcast</strong> is an inquiry sent to the WWRS selling community for a particular item so sellers can check inventories for possible surplus and respond to demand.',
    tools: ['WWRS']
  },
  {
    keys: ['help and training', 'training videos', 'documentation', 'user guide'],
    text: 'The WWRS <strong>Help &amp; Training</strong> area covers program overview, documentation, buyer/seller references, and training resources, including Training Videos (currently listed as Coming Soon on legacy pages).',
    tools: ['WWRS']
  },
  {
    keys: ['available applications', 'what tools are available', 'all applications', 'list applications'],
    text: 'AFSAC Online core applications include <strong>Requisition</strong>, <strong>Logistics</strong>, <strong>Case</strong>, <strong>SDR</strong>, <strong>CLSSA</strong>, <strong>PROS</strong>, <strong>WWRS</strong>, and <strong>Metrics</strong>.',
    tools: ['Requisition', 'Logistics', 'Case', 'SDR', 'CLSSA', 'PROS', 'WWRS', 'Metrics']
  }
];

const TOOL_ALIASES = {
  Requisition: ['requisition', 'requisitions', 'request', 'order submission', 'submit order', 'req input'],
  Logistics: ['logistics', 'shipment', 'shipping', 'delivery', 'pipeline', 'catalog', 'track shipment'],
  Case: ['case', 'cases', 'financial', 'finance', 'case data', 'case module', 'budget'],
  SDR: ['sdr', 'discrepancy', 'supply discrepancy', 'packaging issue', 'damage report'],
  CLSSA: ['clssa', 'cooperative logistics', 'stockage arrangement'],
  PROS: ['pros', 'pros v', 'parts and repair', 'non-standard supply'],
  WWRS: ['wwrs', 'warehouse redistribution', 'surplus', 'broadcast'],
  Metrics: ['metrics', 'dashboard', 'kpi', 'performance report', 'executive report']
};

const ACCESS_VERBS = ['find', 'where', 'open', 'access', 'go to', 'take me', 'how to get', 'navigate', 'locate'];

function normalizeUserText(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function detectToolMention(normalizedText) {
  let bestTool = '';
  let bestScore = 0;

  Object.entries(TOOL_ALIASES).forEach(([tool, aliases]) => {
    let score = 0;
    aliases.forEach((alias) => {
      if (normalizedText.includes(alias)) {
        score += alias.includes(' ') ? 3 : 2;
      }
    });

    if (score > bestScore) {
      bestTool = tool;
      bestScore = score;
    }
  });

  return bestScore > 0 ? bestTool : '';
}

function isAccessIntent(normalizedText) {
  return ACCESS_VERBS.some((verb) => normalizedText.includes(verb));
}

function scoreBotEntry(normalizedText, entry) {
  let score = 0;
  entry.kw.forEach((kw) => {
    const n = normalizeUserText(kw);
    if (!n) return;
    if (normalizedText.includes(n)) {
      score += n.includes(' ') ? 3 : 1;
    }
  });
  return score;
}

function extractAcronymQuery(text) {
  const raw = text.trim();
  const normalized = normalizeUserText(raw);

  const standFor = raw.match(/what\s+does\s+([a-z0-9-]{2,10})\s+stand\s+for\??/i);
  if (standFor) return standFor[1].toUpperCase();

  const meaningOf = raw.match(/meaning\s+of\s+([a-z0-9-]{2,10})\??/i);
  if (meaningOf) return meaningOf[1].toUpperCase();

  const whatIs = raw.match(/what\s+is\s+([a-z0-9-]{2,10})\??/i);
  if (whatIs && whatIs[1].toUpperCase() === whatIs[1]) return whatIs[1].toUpperCase();

  const tokenMatch = normalized.match(/\b(bv|bw|6p|6v|6w|wwrs|pros|sdr|clssa|pmo|fms|nsn|fsc|niin|cage|misil|cisil|milstrip|mipr|rdo|ric)\b/i);
  if (tokenMatch && (normalized.includes('stand for') || normalized.includes('acronym') || normalized.includes('mean') || normalized.includes('meaning'))) {
    return tokenMatch[1].toUpperCase();
  }

  return '';
}

function extractStatusCodeQueries(text) {
  const raw = String(text || '');
  const upper = raw.toUpperCase();
  const normalized = normalizeUserText(raw);
  const statusMatches = upper.match(/\b(BZ|BV|IV|XQ|RQ|X4|R4|RK|AS3|RB|CG|CU|CY|CA)\b/g) || [];
  const uniqueCodes = Array.from(new Set(statusMatches));
  if (!uniqueCodes.length) return [];

  const looksLikeMeaningQuestion =
    normalized.includes('what is') ||
    normalized.includes('what does') ||
    normalized.includes('mean') ||
    normalized.includes('meaning') ||
    normalized.includes('stand for') ||
    normalized.includes('code');

  const statusContext =
    normalized.includes('status') ||
    normalized.includes('requisition') ||
    normalized.includes('pros') ||
    normalized.includes('dashboard');

  const acronymContext =
    normalized.includes('stand for') ||
    normalized.includes('acronym') ||
    normalized.includes('abbreviation');

  const adviceContext = normalized.includes('advice code');
  if (adviceContext && uniqueCodes.length === 1 && uniqueCodes[0] === 'BV') return [];
  if (!statusContext && acronymContext && uniqueCodes.length === 1 && uniqueCodes[0] === 'BV') return [];

  return (looksLikeMeaningQuestion || statusContext) ? uniqueCodes : [];
}

function getKnowledgeAnswer(text) {
  const statusCodes = extractStatusCodeQueries(text);
  if (statusCodes.length) {
    const parts = statusCodes
      .filter((code) => KNOWLEDGE_STATUS_CODES[code])
      .map((code) => `<strong>${code}</strong>: ${KNOWLEDGE_STATUS_CODES[code]}`);

    if (parts.length) {
      const intro = parts.length === 1 ? 'Here is the status code meaning:' : 'Here are the status code meanings:';
      return {
        text: `${intro}<br>${parts.join('<br>')}`,
        tools: ['PROS', 'WWRS']
      };
    }
  }

  const acronym = extractAcronymQuery(text);
  if (acronym && KNOWLEDGE_ACRONYMS[acronym]) {
    const item = KNOWLEDGE_ACRONYMS[acronym];
    return {
      text: `<strong>${acronym}</strong> stands for <strong>${item.expansion}</strong>. ${item.detail}`,
      tools: item.tools || []
    };
  }

  const q = normalizeUserText(text);
  const signedIn = isUserSignedIn();
  const mentionedTool = detectToolMention(q);

  if (mentionedTool && isAccessIntent(q)) {
    const href = TOOL_URLS[mentionedTool] || '#';
    const needsLogin = linkRequiresSignIn(href);
    const canOpen = !needsLogin || signedIn;
    const destination = canOpen ? href : 'login.html';
    const label = canOpen ? `Open ${mentionedTool}` : `Open ${mentionedTool} (Sign In Required)`;
    return {
      text: `You can access <strong>${mentionedTool}</strong> directly using the link below.${canOpen ? '' : ' Sign in first to open protected modules.'}`,
      links: [{ label, href: destination, requiresLogin: false }],
      tools: [mentionedTool]
    };
  }

  if (q.includes('sign in') || q.includes('login') || q.includes('log in')) {
    return {
      text: 'Use the sign-in page to access protected applications and page-level tools.',
      links: [
        { label: 'Open Sign In Page', href: 'login.html', requiresLogin: false }
      ],
      tools: []
    };
  }

  if (q.includes('wwrs training') || q.includes('help and training') || q.includes('help training') || q.includes('training videos')) {
    if (!signedIn) {
      return {
        text: 'WWRS training content is in a protected area. Please sign in first, then open Help & Training directly.',
        links: [
          { label: 'Sign In', href: 'login.html', requiresLogin: false }
        ],
        tools: []
      };
    }

    return {
      text: 'You can open WWRS Help & Training directly using the link below.',
      links: [
        { label: 'Open WWRS Help & Training', href: 'wwrs.html#help-training', requiresLogin: true },
        { label: 'Open Legacy Help & Training', href: 'https://afsac4.wpafb.af.mil/WWRS/Home/HelpTraining', requiresLogin: false }
      ],
      tools: ['WWRS']
    };
  }
  let best = null;
  let bestScore = 0;

  KNOWLEDGE_TOPICS.forEach((topic) => {
    const score = topic.keys.reduce((acc, key) => acc + (q.includes(key) ? 1 : 0), 0);
    if (score > bestScore) {
      best = topic;
      bestScore = score;
    }
  });

  if (best && bestScore > 0) {
    return { text: best.text, tools: best.tools || [] };
  }

  if (q.includes('acronym') || q.includes('abbreviation')) {
    const sample = ['WWRS', 'PROS', 'SDR', 'CLSSA', 'PMO', 'FMS', 'NSN', 'FSC', 'NIIN', 'CAGE'];
    return {
      text: `I can explain acronyms used on this site. Try: ${sample.join(', ')}. You can also ask about advice codes like BV, BW, 6P, 6V, and 6W.`,
      tools: ['WWRS', 'Requisition', 'Logistics']
    };
  }

  return null;
}

function initChatbot() {
  const msgs   = document.getElementById('chat-messages');
  const input  = document.getElementById('chat-input');
  const send   = document.getElementById('chat-send');
  if (!msgs) return;

  const dispatch = text => {
    if (!text.trim()) return;
    appendBubble(msgs, escapeHtml(text), 'user');
    if (input) input.value = '';
    const tid = appendTyping(msgs);
    setTimeout(() => {
      removeEl(tid);
      const knowledge = getKnowledgeAnswer(text);
      if (knowledge) {
        appendBotMsg(msgs, knowledge);
        return;
      }
      const normalized = normalizeUserText(text);
      const scored = BOT_DATA
        .map((d) => ({ d, score: scoreBotEntry(normalized, d) }))
        .sort((a, b) => b.score - a.score);
      const match = scored[0] && scored[0].score > 0 ? scored[0].d : null;
      appendBotMsg(msgs, match || { text: FALLBACK, tools: [] });
    }, 750 + Math.random() * 500);
  };

  if (send)  send.addEventListener('click', () => dispatch(input?.value || ''));
  if (input) input.addEventListener('keydown', e => { if (e.key === 'Enter') dispatch(input.value); });

  document.querySelectorAll('.suggestion-chip').forEach(c =>
    c.addEventListener('click', () => dispatch(c.textContent.trim()))
  );
}

function appendBubble(c, html, type) {
  const d = document.createElement('div');
  d.className = `chat-bubble ${type}`;
  d.innerHTML = html;
  c.appendChild(d);
  c.scrollTop = c.scrollHeight;
}

function appendTyping(c) {
  const id = 'typ-' + Date.now();
  const d = document.createElement('div');
  d.id = id;
  d.className = 'chat-bubble bot';
  d.innerHTML = '<span class="typing-dots"><span></span><span></span><span></span></span>';
  c.appendChild(d);
  c.scrollTop = c.scrollHeight;
  return id;
}

function removeEl(id) { const el = document.getElementById(id); if (el) el.remove(); }

function appendBotMsg(c, data) {
  const d = document.createElement('div');
  d.className = 'chat-bubble bot';
  let html = `<p>${data.text}</p>`;

  if (data.links && data.links.length) {
    html += '<div class="chat-tool-chips">';
    data.links.forEach((link) => {
      const needsLogin = !!link.requiresLogin || linkRequiresSignIn(link.href);
      const allowDirect = !needsLogin || isUserSignedIn();
      const targetHref = allowDirect ? link.href : 'login.html';
      const label = allowDirect ? link.label : `${link.label} (Sign In Required)`;
      html += `<a href="${targetHref}" class="chat-tool-chip">${label}</a>`;
    });
    html += '</div>';
  }

  if (data.tools && data.tools.length) {
    html += '<div class="chat-tool-chips">';
    data.tools.forEach(t => {
      const href = TOOL_URLS[t] || '#';
      const needsLogin = linkRequiresSignIn(href);
      const targetHref = (!needsLogin || isUserSignedIn()) ? href : 'login.html';
      const label = (!needsLogin || isUserSignedIn()) ? t : `${t} (Sign In Required)`;
      html += `<a href="${targetHref}" class="chat-tool-chip">${label}</a>`;
    });
    html += '</div>';
  }
  d.innerHTML = html;
  c.appendChild(d);
  c.scrollTop = c.scrollHeight;
}

function escapeHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function alignHomeApplicationCards() {
  const cards = Array.from(document.querySelectorAll('.index-page a[href="toolbox.html"][style*="border-top:4px solid var(--gold)"]'));
  if (!cards.length) return;

  const titleRows = cards.map((card) => card.querySelector(':scope > div')).filter(Boolean);
  const descRows = cards.map((card) => card.querySelector(':scope > p')).filter(Boolean);
  if (!titleRows.length || !descRows.length) return;

  titleRows.forEach((row) => { row.style.minHeight = ''; });
  descRows.forEach((row) => { row.style.minHeight = ''; });

  const maxTitleHeight = Math.max(...titleRows.map((row) => row.getBoundingClientRect().height));
  const maxDescHeight = Math.max(...descRows.map((row) => row.getBoundingClientRect().height));

  titleRows.forEach((row) => { row.style.minHeight = `${Math.ceil(maxTitleHeight)}px`; });
  descRows.forEach((row) => { row.style.minHeight = `${Math.ceil(maxDescHeight)}px`; });
}

function alignApplicationsCards() {
  const cards = Array.from(document.querySelectorAll('.apps-grid .app-card'));
  if (!cards.length) return;

  const titleRows = cards.map((card) => card.querySelector('.app-card-title-wrap')).filter(Boolean);
  const descRows = cards.map((card) => card.querySelector('.app-card-desc')).filter(Boolean);
  if (!titleRows.length || !descRows.length) return;

  titleRows.forEach((row) => {
    row.style.height = 'auto';
    row.style.minHeight = '';
  });
  descRows.forEach((row) => { row.style.minHeight = ''; });

  const maxTitleHeight = Math.max(...titleRows.map((row) => row.getBoundingClientRect().height));
  const maxDescHeight = Math.max(...descRows.map((row) => row.getBoundingClientRect().height));

  titleRows.forEach((row) => {
    row.style.height = `${Math.ceil(maxTitleHeight)}px`;
  });
  descRows.forEach((row) => {
    row.style.minHeight = `${Math.ceil(maxDescHeight)}px`;
  });
}

function alignToolboxApplicationCards() {
  const items = Array.from(document.querySelectorAll('.toolbox-tools .tool-item'));
  if (!items.length) return;

  const triggers = items.map((item) => item.querySelector('.tool-trigger')).filter(Boolean);
  if (!triggers.length) return;

  triggers.forEach((trigger) => {
    trigger.style.minHeight = '';
    trigger.style.height = 'auto';
  });

  const maxTriggerHeight = Math.max(...triggers.map((trigger) => trigger.getBoundingClientRect().height));

  triggers.forEach((trigger) => {
    trigger.style.minHeight = `${Math.ceil(maxTriggerHeight)}px`;
  });
}

/* ── Search (visual feedback only — front-end mock) ─────── */
function initSearch() {
  const inp = document.querySelector('.search-input');
  if (!inp) return;
  inp.addEventListener('keydown', e => {
    if (e.key !== 'Enter' || !inp.value.trim()) return;
    const q = inp.value.trim();
    window.location.href = 'search-results.html?q=' + encodeURIComponent(q);
  });
}

/* ── Footer legal panel toggle ──────────────────────────── */
function initFooterLegal() {
  const btn = document.querySelector('.footer-legal-toggle');
  const panel = document.getElementById('legal-panel');
  if (!btn || !panel) return;
  btn.addEventListener('click', () => {
    panel.classList.toggle('open');
    const label = btn.querySelector('.toggle-text');
    if (label) label.textContent = panel.classList.contains('open') ? 'Hide Legal Framework' : 'View Legal Framework & Privacy';
  });
}

/* ── Mobile nav hamburger ───────────────────────────────── */
function initMobileNav() {
  const ham = document.querySelector('.hamburger');
  const nav = document.querySelector('.mobile-nav');
  if (!ham || !nav) return;
  ham.addEventListener('click', () => nav.classList.toggle('open'));
}

/* ── Active nav highlight ───────────────────────────────── */
function setActiveNav() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.main-nav a').forEach(a => {
    const href = (a.getAttribute('href') || '').split('#')[0].split('/').pop();
    if (href && href === path) a.classList.add('active');
  });
}

/* ── Floating chat widget toggle ────────────────────────── */
function initFloatingWidget() {
  ensureGlobalChatWidget();

  const bubble = document.getElementById('chat-bubble');
  const widget = document.getElementById('chat-widget-window');
  const closeBtn = document.getElementById('chat-close');
  
  if (!bubble || !widget) return;

  const openWidget = () => {
    widget.classList.remove('hidden');
    bubble.setAttribute('aria-expanded', 'true');
  };

  const closeWidget = () => {
    widget.classList.add('hidden');
    bubble.setAttribute('aria-expanded', 'false');
  };

  bubble.addEventListener('click', () => {
    if (widget.classList.contains('hidden')) {
      openWidget();
    } else {
      closeWidget();
    }
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeWidget();
    });
  }

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (!widget.contains(e.target) && !bubble.contains(e.target) && !widget.classList.contains('hidden')) {
      closeWidget();
    }
  });
}

function ensureGlobalChatWidget() {
  const hasBubble = document.getElementById('chat-bubble');
  const hasWindow = document.getElementById('chat-widget-window');
  if (hasBubble && hasWindow) return;

  const container = document.createElement('div');
  container.className = 'chat-widget-container';
  container.innerHTML = `
    <button class="chat-widget-bubble" id="chat-bubble" aria-label="Open AI Assistant" aria-expanded="false">
      <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    </button>

    <div class="chat-widget-window hidden" id="chat-widget-window" aria-label="AI assistant">
      <div class="chat-header">
        <div>
          <div class="chat-header-title">
            <span class="chat-status-dot" aria-hidden="true"></span>
            AI Assistant
          </div>
          <div class="chat-header-sub">Request guidance on AFSAC tools and site information</div>
        </div>
        <button class="chat-widget-close" id="chat-close" aria-label="Close assistant">
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div class="chat-messages" id="chat-messages" aria-live="polite" aria-label="Chat messages">
        <div class="chat-bubble bot">
          Welcome. I provide guidance for authorized users on AFSAC Online applications, processes, and where to find mission-relevant information. Please describe your role or objective.
        </div>
      </div>

      <div class="chat-suggestions">
        <div class="chat-suggestions-label">Suggested questions:</div>
        <div class="suggestion-chips">
          <button class="suggestion-chip">What can I do in PROS V?</button>
          <button class="suggestion-chip">Help me track a shipment</button>
          <button class="suggestion-chip">Where is Case?</button>
          <button class="suggestion-chip">Which applications are available?</button>
        </div>
      </div>

      <div class="chat-input-area">
        <input type="text" id="chat-input" class="chat-input" placeholder="Enter your question or support need..." aria-label="Type your question">
        <button id="chat-send" class="chat-send-btn" aria-label="Send message">
          <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(container);
}
