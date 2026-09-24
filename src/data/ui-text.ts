import type { LocalizedText, LocalizedTextTree } from "../translation";

export const uiText = {
  hero: {
    aboutMe: {
      de: "Über mich",
      en: "About me",
    },
    headline: {
      de: "Ich entwerfe und entwickle digitale Produkte, die komplexe Dinge einfach wirken lassen.",
      en: "I design and build digital products that make complex things feel simple.",
    },
    intro: {
      de: "Student der Mensch-Technik-Interaktion mit Schwerpunkt auf Frontend-Entwicklung, Software Engineering und UX.",
      en: "Human-Technology Interaction student focused on frontend development, software engineering and UX.",
    },
    metadata: {
      focus: {
        de: "Fokus:",
        en: "Focus:",
      },
      projects: {
        de: "Projekte:",
        en: "Projects:",
      },
      contact: {
        de: "Kontakt:",
        en: "Contact:",
      },
      email: {
        de: "E-Mail↗",
        en: "E-Mail↗",
      },
    },
  },

  projects: {
    label: {
      de: "AUSGEWÄHLTE PROJEKTE",
      en: "SELECTED PROJECTS",
    },
    heading: {
      de: "Was ich gebaut habe.",
      en: "What I built.",
    },
    itemLabel: {
      de: "PROJEKTE /",
      en: "PROJECTS /",
    },
  },

  experience: {
    label: {
      de: "ERFAHRUNG",
      en: "EXPERIENCE",
    },
    heading: {
      de: "Was ich gemacht habe.",
      en: "Where I worked.",
    },
  },
} satisfies LocalizedTextTree;
