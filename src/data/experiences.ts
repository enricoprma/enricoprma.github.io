import type { LocalizedText } from "../translation";

export type Experience = {
  company: string;
  role: LocalizedText;
  startDate: string;
  endDate: string;
  description: LocalizedText[];
  technologies: string[];
};

export const EXPERIENCES: Experience[] = [
  {
    company: "weiyu digital",
    role: {
      de: "Werkstudent Full-Stack-Entwicklung",
      en: "Working Student in Full-Stack Development",
    },
    startDate: "04.2025",
    endDate: "09.2025",
    description: [
      {
        de: "Weiterentwicklung einer Webanwendung mit Angular, TypeScript, Spring Boot und PostgreSQL.",
        en: "Developed web application features with Angular, TypeScript, Spring Boot and PostgreSQL.",
      },
      {
        de: "Entwurf und Implementierung von responsiven UI-Komponenten.",
        en: "Designed and implemented responsive UI components.",
      },
      {
        de: "Erstellung und Pflege von End-to-End-Tests mit Cypress.",
        en: "Created and maintained end-to-end tests with Cypress.",
      },
    ],
    technologies: [
      "Angular",
      "TypeScript",
      "Spring Boot",
      "PostgreSQL",
      "Cypress",
    ],
  },
  {
    company: "Becker UG",
    role: {
      de: "Werkstudent Web- & Media-Design",
      en: "Working Student Web & Media Design",
    },
    startDate: "06.2023",
    endDate: "01.2025",
    description: [
      {
        de: "Neugestaltung der Firmenwebseite in Figma und Umsetzung in WordPress.",
        en: "Redesign of the company website in Figma and implementation in WordPress.",
      },
      {
        de: "Fokus auf Informationsarchitektur, Nutzerführung und responsive Layouts.",
        en: "Worked on information architecture, user guidance and responsive layouts.",
      },
      {
        de: 'Erstellung von Print- und Digitalmedien, darunter das Unternehmensmagazin "ABRISS".',
        en: "Created print and digital media, including the employee magazine 'ABRISS'.",
      },
    ],
    technologies: ["Figma", "WordPress", "CSS", "PHP", "UX/UI Design"],
  },
];
