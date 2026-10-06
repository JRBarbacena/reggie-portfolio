export const PORTFOLIO_KNOWLEDGE = Object.freeze({
  owner: {
    fullName: "John Reggie M. Barbacena",
    displayName: "Reggie Barbacena",
    role: "Computer Science student specializing in Software Engineering",
    school: "FEU Institute of Technology",
    focus: ["frontend development", "UI/UX", "software foundations", "system design", "AI-assisted development"],
    location: "San Mateo, Rizal, Philippines",
    timezone: "GMT+8 · Manila",
    status: "Building & learning",
    openTo: ["collaborations", "coffee chats", "talks", "volleyball", "ride and chats"],
  },
  contact: {
    email: "iggybarbacena@gmail.com",
    socials: {
      Facebook: "johnreggie.barbacena.7",
      Instagram: "@jjstr.rgg",
      TikTok: "@gieoverheaven",
      LinkedIn: "John Reggie Barbacena",
    },
    options: ["temporary live chat", "secure contact form", "direct email", "social links"],
  },
  home: {
    greeting: "Hello there! I am John Reggie Barbacena",
    heading: "Welcome to my little space on the internet",
    destinations: ["Tech", "Travel", "Life"],
    interestDetails: {
      Laptop: "Acer Nitro 5 | Macbook M4",
      Coffee: "White Chocolate Mocha",
      Volleyball: "Opposite Hitter",
      Agents: "Claude Code | Cursor | Codex | Kiro",
      Motorcycle: "NMAX | Vespa Classic",
    },
    interactions: [
      "Braille-style name scramble and lifting curtain on a fresh Home load or refresh",
      "48-sphere Three.js Ballpit with cursor interaction and no cursor-following sphere",
      "photo windows styled with macOS controls",
      "destination carousel whose side card centers before a second click navigates",
      "social links that slide in after the visitor starts scrolling",
    ],
  },
  tech: {
    heading: "Turning ideas into thoughtful digital experiences.",
    terminal: {
      command: "whoami",
      output: "Software Engineer | Philanthropist | System Design & AI",
    },
    sections: ["terminal hero", "Experience & Academic Background", "Tools I build with", "Certifications & Awards", "Photo Album", "technology philosophy and footer"],
    education: {
      degree: "BS Computer Science, major in Software Engineering",
      school: "FEU Institute of Technology",
      community: "ACM school community activities and events",
    },
    stack: {
      web: ["HTML", "CSS", "JavaScript", "TypeScript", "React", "Next.js", "Tailwind CSS"],
      designAndMotion: ["Figma", "GSAP", "Lenis"],
      backendAndData: ["Node.js", "PHP", "Laravel", "MySQL", "PostgreSQL", "MongoDB", "Supabase"],
      languages: ["Python", "Java", "Bash"],
      graphics: ["Three.js", "WebGL", "Blender"],
      workflow: ["Git", "Docker"],
    },
    certificates: [
      { title: "Python", issuer: "Certiport" },
      { title: "MATLAB", issuer: "LinkedIn Learning" },
      { title: "Project Management Ready", issuer: "PMI" },
      { title: "Agile Software Development", issuer: "LinkedIn Learning" },
      { title: "AI Fluency: Frameworks & Foundations", issuer: "Anthropic" },
    ],
    builtInAlbum: {
      title: "DevDays at Microsoft",
      location: "Microsoft Philippines",
      description: "A day of developer conversations, community connections, and learning inside Microsoft Philippines.",
      photoCount: 11,
      cover: "IMG_3994.JPG",
    },
    closing: "Build useful things. Make them feel human.",
  },
  travel: {
    heading: "Drifting around the world",
    description: "A growing travel journal of local escapes, international chapters, and hidden gems found along the way.",
    terminal: {
      command: "Get-Content Destination",
      output: "Journey, Passport, & Hidden Gems",
    },
    collections: {
      international: "Passport stamps, unfamiliar streets, and stories gathered farther from home.",
      local: "Nearby escapes, island routes, and hidden gems discovered around the Philippines.",
    },
  },
  life: {
    heading: "Life feels better in motion.",
    description: "Life beyond code through sport, open roads, familiar coffee, friends, and ordinary moments.",
    rhythms: {
      volleyball: "Opposite hitter; fast rallies, close games, teamwork, and a championship memory.",
      motorcycles: "NMAX and Vespa Classic; rides are time to think, reset, and notice the route.",
      coffee: "White Chocolate Mocha; a dependable order best paired with a slower pace and good conversation.",
      basketball: "An occasional open-court game alongside volleyball.",
    },
    homeBase: "San Mateo, Rizal—where Reggie grew up, resets, and begins every route.",
    closing: "Not every moment has to be productive to be worth remembering.",
  },
  experience: {
    framework: "React 19 with React Router and Vite",
    backend: "Supabase for authentication, database records, row-level security, and private album media",
    hosting: "Vercel with serverless functions for protected contact and temporary chat operations",
    motion: ["Anime.js", "GSAP", "Lenis", "CSS viewport reveals", "Three.js"],
    visualStyle: "Bright-white glassmorphism and neumorphism with a red identity accent",
    accessibility: ["keyboard navigation", "focus management", "reduced-motion support", "save-data safeguards", "semantic dialogs", "responsive layouts"],
    pwa: ["web manifest", "service worker", "offline fallback", "route-based code splitting", "responsive image delivery"],
  },
  privacy: {
    liveChat: "Temporary visitor chat uses an unguessable session token and expires one hour after the latest message; it can also be ended and erased immediately.",
    albums: "Only published albums are readable by public visitors. Draft and private albums stay behind Supabase row-level security.",
    admin: "The dashboard requires Supabase authentication plus membership in the administrator allow list; knowing its route does not grant access.",
    boundaries: "Zenith may describe public portfolio content but must not reveal secrets, private drafts, visitor records, authentication data, or admin credentials.",
  },
});

export function flattenedTechStack() {
  return Object.values(PORTFOLIO_KNOWLEDGE.tech.stack).flat();
}
