// site-config.js — single source of truth for owner info + social/contact
// links. Consumed by the shared <site-footer> component so contact details
// live in exactly one place.

export const OWNER = {
  name: "John Reggie M. Barbacena",
  nickname: "Reggie",
  location: "San Mateo, Rizal, Philippines",
  email: "iggybarbacena@gmail.com",
};

// NOTE: Behance is a placeholder link until the account is ready.
export const SOCIALS = [
  { label: "Email", handle: "iggybarbacena@gmail.com", href: "mailto:iggybarbacena@gmail.com" },
  { label: "Facebook", handle: "John Reggie Barbacena", href: "https://www.facebook.com/johnreggie.barbacena.7" },
  { label: "Instagram", handle: "@jjstr.rgg", href: "https://instagram.com/jjstr.rgg" },
  { label: "TikTok", handle: "@gieoverheaven", href: "https://www.tiktok.com/@gieoverheaven" },
  { label: "LinkedIn", handle: "@JRBarbacena", href: "https://www.linkedin.com/in/john-reggie-barbacena-a011b5368/" },
  { label: "Behance", handle: "coming soon", href: "#", placeholder: true },
];
