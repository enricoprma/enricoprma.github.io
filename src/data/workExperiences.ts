export type WorkExperience = {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string[];
  technologies: string[];
};

export const workExperiences: WorkExperience[] = [
  {
    company: "weiyu digital",
    role: "Working Student Full-Stack Development",
    startDate: "04.2025",
    endDate: "09.2025",
    description: [
      "Developed web application features with Angular, TypeScript, Spring Boot and PostgreSQL.",
      "Designed and implemented responsive UI components.",
      "Created and maintained end-to-end tests with Cypress.",
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
    role: "Working Student Web & Media Design",
    startDate: "06.2023",
    endDate: "01.2025",
    description: [
      "Redesigned web interfaces in Figma and implemented them in WordPress.",
      "Worked on information architecture, user guidance and responsive layouts.",
      "Created print and digital media, including the employee magazine ABRISS.",
    ],
    technologies: ["Figma", "WordPress", "CSS", "PHP", "UX/UI Design"],
  },
];
