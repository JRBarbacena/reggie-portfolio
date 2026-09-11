const DIRECT_CHAT_HINT = "If you want a personal answer, say “talk to Reggie.”";
const FALLBACK = `I’m sorry, I didn’t understand that yet. Try asking about Reggie’s background, pages, tech stack, certificates, albums, travel, interests, or how this portfolio works. ${DIRECT_CHAT_HINT}`;
const PROFANITY_TERMS = [
  "fuck", "fucking", "fucked", "shit", "bullshit", "bitch", "asshole", "bastard",
  "gago", "tanga", "ulol", "puta", "putang ina", "tangina", "tarantado",
];
const PROFANITY_RESPONSE = "Please stop swearing and keep the conversation respectful. I’m happy to help when we speak kindly.";

const FAQ_RULES = [
  {
    intent: "handoff",
    priority: 50,
    terms: ["talk to reggie", "chat with reggie", "speak to reggie", "reggie directly", "real person", "human support", "contact reggie", "message reggie", "reach reggie", "talk to john"],
    answer: "Of course. I can connect you to Reggie in a temporary private chat. You may share your name before the conversation starts.",
    offerHandoff: true,
  },
  {
    intent: "greeting",
    terms: ["hello zenith", "hi zenith", "hey zenith", "hello", "hi", "hey", "good morning", "good afternoon", "good evening"],
    answer: `Hello! I’m Zenith, Reggie’s portfolio guide. You can ask me about his work, tools, certificates, travel, interests, or this website. ${DIRECT_CHAT_HINT}`,
  },
  { intent: "wellbeing", terms: ["how are you", "how is it going", "whats up", "what is up"], answer: `I’m ready to help. What would you like to know about Reggie or his portfolio? ${DIRECT_CHAT_HINT}` },
  { intent: "thanks", terms: ["thank you", "thanks", "helpful", "got it"], answer: `You’re welcome! Ask me anything else about the portfolio. ${DIRECT_CHAT_HINT}` },
  { intent: "goodbye", terms: ["goodbye", "bye", "see you", "later"], answer: "See you around! I’ll be here whenever you want to explore more." },
  {
    intent: "capabilities",
    terms: ["what can you do", "help me", "your purpose", "how can you help", "what do you know"],
    answer: `I can explain Reggie’s background, every public page, tech stack, certificates, albums, travel journals, interests, portfolio interactions, and private contact options. I use reviewed local facts instead of a paid AI service. ${DIRECT_CHAT_HINT}`,
  },
  {
    intent: "navigation",
    terms: ["where should i start", "where do i start", "best place to start", "navigate", "navigation", "pages", "sections"],
    answer: `The portfolio has Home, Tech, Travel, and Life. Start with Tech for Reggie’s developer journey, Travel for journals, or Life for the person beyond the work. The logo and top navigation return you to Home. ${DIRECT_CHAT_HINT}`,
  },
  {
    intent: "about",
    terms: ["who is reggie", "about reggie", "john reggie", "reggie barbacena", "tell me about him", "portfolio owner"],
    answer: `John Reggie M. Barbacena is a Computer Science student specializing in Software Engineering at FEU Institute of Technology. He focuses on frontend development and UI/UX, and this portfolio documents his technical journey, travels, and life beyond code. ${DIRECT_CHAT_HINT}`,
  },
  {
    intent: "location",
    terms: ["where is reggie", "where does reggie live", "location", "home base", "san mateo", "rizal", "philippines"],
    answer: `Reggie’s home base is San Mateo, Rizal, Philippines. The portfolio describes it as where he grew up, resets, and begins every route. ${DIRECT_CHAT_HINT}`,
  },
  {
    intent: "home",
    terms: ["home page", "homepage", "little space", "hello there", "carousel", "where should we go next"],
    answer: `Home welcomes visitors to Reggie’s “little space on the internet.” Its interactive hero combines the Zenith launcher, a Ballpit background, personal photo windows, interest icons, and a carousel leading to Tech, Travel, and Life. ${DIRECT_CHAT_HINT}`,
  },
  {
    intent: "preloader",
    terms: ["preloader", "loading screen", "scramble text", "braille", "reggie barbacena animation", "curtain"],
    answer: `On a fresh visit or browser refresh, Home opens with a Braille-style “Reggie Barbacena” scramble. The curtain then lifts into the hero; internal navigation back to Home skips that introduction. ${DIRECT_CHAT_HINT}`,
  },
  {
    intent: "ballpit",
    terms: ["ballpit", "balls", "hero background", "three js", "webgl", "cursor interaction"],
    answer: `The Home hero uses a Three.js Ballpit with 65 softly shaded spheres. It prepares during the entry sequence, moves beneath the lifting curtain, responds to cursor movement without a cursor-following ball, and pauses when it is genuinely off-screen to save work. ${DIRECT_CHAT_HINT}`,
  },
  {
    intent: "design",
    terms: ["design style", "visual design", "glassmorphism", "neumorphism", "color palette", "bright white", "red accent"],
    answer: `The interface uses a bright-white hybrid of glassmorphism and neumorphism with soft depth, translucent surfaces, restrained shadows, and a red identity accent. Motion is progressive and respects reduced-motion preferences. ${DIRECT_CHAT_HINT}`,
  },
  {
    intent: "tech",
    terms: ["tech page", "technology page", "developer journey", "software engineering", "technical experience"],
    answer: `The Tech page is organized into a terminal hero, experience and education, the moving “Tools I build with” stack, a certificate shelf, Tech albums, a closing callout, and the footer. ${DIRECT_CHAT_HINT}`,
  },
  {
    intent: "work",
    terms: ["what kind of work", "what does he build", "reggie work", "work", "experience", "project", "developer"],
    answer: `The Tech page presents Reggie’s development journey across software foundations, frontend development, UI/UX, system design, education, tools, certificates, and technology-community experiences. ${DIRECT_CHAT_HINT}`,
  },
  {
    intent: "education",
    terms: ["education", "school", "university", "college", "degree", "course", "feu", "student", "computer science"],
    answer: `Reggie is taking BS Computer Science, major in Software Engineering, at FEU Institute of Technology. He is developing reliable software foundations while leaning into frontend development, UI/UX, and ACM community activities. ${DIRECT_CHAT_HINT}`,
  },
  {
    intent: "terminal",
    terms: ["terminal", "whoami", "get content destination", "portfolio terminal"],
    answer: `Tech’s terminal runs “whoami” and returns “Software Engineer | Philanthropist | System Design & AI.” Travel’s terminal runs “Get-Content Destination” and returns “Journey, Passport, & Hidden Gems.” ${DIRECT_CHAT_HINT}`,
  },
  {
    intent: "stack",
    terms: ["tech stack", "technology stack", "tools", "framework", "language", "build with", "drift wall", "react", "javascript", "typescript"],
    answer: `On the Tech page, the drift wall includes HTML, CSS, JavaScript, TypeScript, React, Next.js, Tailwind CSS, Figma, Node.js, Python, Java, PHP, Laravel, MySQL, PostgreSQL, MongoDB, Supabase, GSAP, Lenis, Three.js, WebGL, Blender, Git, Docker, and Bash. ${DIRECT_CHAT_HINT}`,
  },
  {
    intent: "certificates",
    terms: ["certificate", "certification", "credential", "python certificate", "matlab", "project management", "agile", "ai fluency", "anthropic"],
    answer: `The Tech shelf contains Python, MATLAB, Project Management Ready, Agile Software Development, and AI Fluency: Frameworks & Foundations. Select a certificate to open its full modal preview. ${DIRECT_CHAT_HINT}`,
  },
  {
    intent: "tech-albums",
    terms: ["tech album", "devdays", "dev days", "microsoft photos", "build nights", "tech photos", "community photos"],
    answer: `Tech’s “Albums from the field” collects community and event moments. It includes a built-in DevDays gallery from Microsoft Philippines and can also show published Tech albums managed through Reggie’s dashboard. ${DIRECT_CHAT_HINT}`,
  },
  {
    intent: "travel",
    terms: ["travel page", "travel", "journey", "destination", "passport", "hidden gems", "international travel", "local travel", "travel journal"],
    answer: `The Travel page is a growing journal titled “Drifting around the world.” It separates International Travel from Local Travel around the Philippines; selecting a published cover opens its full journal and story images. Each collection keeps a “More coming soon” card. ${DIRECT_CHAT_HINT}`,
  },
  {
    intent: "life",
    terms: ["life page", "life beyond code", "hobby", "interest", "what keeps him moving", "outside software"],
    answer: `Life covers Reggie beyond the screen: volleyball, open-road rides, coffee, friends, and everyday moments. Its theme is “Life feels better in motion.” ${DIRECT_CHAT_HINT}`,
  },
  {
    intent: "volleyball",
    terms: ["volleyball", "opposite hitter", "opposite", "sport", "court", "basketball"],
    answer: `Reggie plays volleyball as an opposite hitter. The Life page highlights rallies, teamwork, his volleyball crew and championship moment, plus an occasional basketball game. ${DIRECT_CHAT_HINT}`,
  },
  {
    intent: "rides",
    terms: ["motorcycle", "motorbike", "vespa", "nmax", "ride", "open road"],
    answer: `Reggie’s rides are the NMAX and Vespa Classic. He treats time on the road as space to think, reset, and notice the route. ${DIRECT_CHAT_HINT}`,
  },
  {
    intent: "coffee",
    terms: ["coffee", "mocha", "white chocolate mocha", "coffee order", "cafe"],
    answer: `Reggie’s dependable coffee order is a White Chocolate Mocha—usually enjoyed at a slower pace and with good conversation. ${DIRECT_CHAT_HINT}`,
  },
  {
    intent: "albums",
    terms: ["album", "photo", "picture", "gallery", "published content", "media collection"],
    answer: `Published database albums appear only in their selected Tech, Travel, or Life destination. Tech and Life use photo galleries; Travel uses journal-style stories with covers and supporting images. ${DIRECT_CHAT_HINT}`,
  },
  {
    intent: "live-chat",
    terms: ["live chat", "temporary chat", "chat privacy", "message retention", "deleted after hour", "one hour", "talk online"],
    answer: `Visitor-to-Reggie chat is private and temporary. It uses an unguessable browser token, expires one hour after the latest message, and can be ended and erased immediately. If Reggie’s dashboard is open, visitors can also see whether he is online. ${DIRECT_CHAT_HINT}`,
  },
  {
    intent: "contact",
    terms: ["contact form", "send a message", "email reggie", "inbox", "collaboration", "coffee chat", "speaking event"],
    answer: `Visitors can send Reggie a private contact inquiry for a general question, project collaboration, coffee chat, speaking or an event. Those inquiries go to the authenticated dashboard inbox; temporary live chat is available when a visitor asks to talk to Reggie. ${DIRECT_CHAT_HINT}`,
  },
  {
    intent: "admin",
    terms: ["admin", "dashboard", "private dashboard", "manage content", "publish album", "private draft"],
    answer: `The private dashboard lets an allow-listed administrator manage Tech and Life albums, Travel journals, publication privacy, covers and photos, contact inquiries, live conversations, and chat alerts. Knowing the /admin address does not grant access—Supabase authentication and row-level policies enforce it. ${DIRECT_CHAT_HINT}`,
  },
  {
    intent: "backend",
    terms: ["backend", "supabase", "database", "storage", "vercel function", "api", "authentication", "security"],
    answer: `Supabase provides authentication, private media storage, album data, inbox records, live-chat tables, row-level security, and automatic chat cleanup. Vercel Functions protect server-only chat and contact credentials; public React code receives only Supabase’s publishable key. ${DIRECT_CHAT_HINT}`,
  },
  {
    intent: "pwa",
    terms: ["pwa", "progressive web app", "mobile", "responsive", "device", "offline", "install"],
    answer: `The portfolio is a responsive React/Vite PWA designed for desktop, tablet, and mobile. It includes a web manifest, service worker, offline fallback, lazy loading, and reduced-motion and save-data safeguards. ${DIRECT_CHAT_HINT}`,
  },
  {
    intent: "status",
    terms: ["current status", "what is reggie doing", "available", "building and learning"],
    answer: `Reggie’s current portfolio status is “Building & learning.” For availability, a project, or a personal answer, ask to talk to Reggie.`,
  },
  {
    intent: "zenith",
    terms: ["who are you", "your name", "zenith", "chatbot", "bot", "are you ai"],
    answer: `I’m Zenith, Reggie’s portfolio guide. I use reviewed answers and typo-tolerant keyword matching, so I can explain this portfolio without a paid AI service. I’ll say when I do not understand instead of inventing an answer. ${DIRECT_CHAT_HINT}`,
  },
];

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function editDistance(left, right) {
  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const replaceCost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + replaceCost,
      );
      if (
        leftIndex > 1
        && rightIndex > 1
        && left[leftIndex - 1] === right[rightIndex - 2]
        && left[leftIndex - 2] === right[rightIndex - 1]
      ) {
        current[rightIndex] = Math.min(current[rightIndex], previous[rightIndex - 2] + 1);
      }
    }
    previous = current;
  }
  return previous[right.length];
}

function allowedDistance(length) {
  if (length <= 3) return 0;
  if (length <= 7) return 1;
  if (length <= 14) return 2;
  return 3;
}

function tokenMatches(queryToken, termToken) {
  if (queryToken === termToken) return true;
  if (Math.abs(queryToken.length - termToken.length) > allowedDistance(termToken.length)) return false;
  return editDistance(queryToken, termToken) <= allowedDistance(termToken.length);
}

function compactTokenFuzzyMatches(queryTokens, term) {
  const distanceLimit = allowedDistance(term.length);
  if (!distanceLimit || term.length < 4) return false;
  return queryTokens.some((token) => (
    Math.abs(token.length - term.length) <= distanceLimit
    && editDistance(token, term) <= distanceLimit
  ));
}

function scoreTerm(normalized, queryTokens, compactQuery, term) {
  const normalizedTerm = normalizeText(term);
  const termTokens = normalizedTerm.split(" ");
  const compactTerm = termTokens.join("");
  if (` ${normalized} `.includes(` ${normalizedTerm} `)) return 120 + compactTerm.length;
  if (compactTerm.length >= 4 && compactQuery.includes(compactTerm)) return 105 + compactTerm.length;
  if (termTokens.length > 1 && compactTokenFuzzyMatches(queryTokens, compactTerm)) return 92 + compactTerm.length;

  if (termTokens.length === 1) {
    return queryTokens.some((queryToken) => tokenMatches(queryToken, termTokens[0])) ? 70 + compactTerm.length : 0;
  }

  const everyTokenMatches = termTokens.every((termToken) => queryTokens.some((queryToken) => tokenMatches(queryToken, termToken)));
  if (everyTokenMatches) return 82 + compactTerm.length;

  const wholeDistance = editDistance(compactQuery, compactTerm);
  return wholeDistance <= allowedDistance(compactTerm.length) ? 75 + compactTerm.length - wholeDistance : 0;
}

function containsProfanity(normalized, queryTokens, compactQuery) {
  return PROFANITY_TERMS.some((term) => {
    const normalizedTerm = normalizeText(term);
    const compactTerm = normalizedTerm.replaceAll(" ", "");
    if (` ${normalized} `.includes(` ${normalizedTerm} `) || compactQuery.includes(compactTerm)) return true;
    if (normalizedTerm.includes(" ")) return false;
    return queryTokens.some((token) => tokenMatches(token, normalizedTerm));
  });
}

export function getPortfolioFaqResponse(question) {
  const normalized = normalizeText(question);
  if (!normalized) return { answer: FALLBACK, intent: "fallback", offerHandoff: false };
  const queryTokens = normalized.split(" ");
  const compactQuery = queryTokens.join("");
  if (containsProfanity(normalized, queryTokens, compactQuery)) {
    return { answer: PROFANITY_RESPONSE, intent: "profanity", offerHandoff: false };
  }

  let best = null;
  let bestScore = 0;
  for (const rule of FAQ_RULES) {
    const termScore = Math.max(...rule.terms.map((term) => scoreTerm(normalized, queryTokens, compactQuery, term)));
    const score = termScore > 0 ? termScore + (rule.priority ?? 0) : 0;
    if (score > bestScore) {
      best = rule;
      bestScore = score;
    }
  }

  return {
    answer: best?.answer ?? FALLBACK,
    intent: best?.intent ?? "fallback",
    offerHandoff: best?.offerHandoff === true,
  };
}

export function answerPortfolioFaq(question) {
  return getPortfolioFaqResponse(question).answer;
}
