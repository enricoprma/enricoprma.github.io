import type { Translation } from "../translation";

export type Experience = {
  company: string;
  role: Translation;
  startDate: string;
  endDate: string;
  description: Translation[];
  technologies: string[];
};

export const EXPERIENCES: Experience[] = [
  {
    company: "weiyu digital",
    role: {
      de: "Werkstudent Full-Stack-Entwicklung",
      en: "Working Student Full-Stack Development",
    },
    startDate: "04.2025",
    endDate: "09.2025",
    description: [
      {
        de: "",
        en: "Developed web application features with Angular, TypeScript, Spring Boot and PostgreSQL.",
      },
      { de: "", en: "Designed and implemented responsive UI components." },
      { de: "", en: "Created and maintained end-to-end tests with Cypress." },
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
        de: "",
        en: "Redesigned web interfaces in Figma and implemented them in WordPress.",
      },
      {
        de: "",
        en: "Worked on information architecture, user guidance and responsive layouts.",
      },
      {
        de: "",
        en: "Created print and digital media, including the employee magazine ABRISS.",
      },
    ],
    technologies: ["Figma", "WordPress", "CSS", "PHP", "UX/UI Design"],
  },
];
