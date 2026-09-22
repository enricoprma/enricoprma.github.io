export type Project = {
  title: string;
  description: string;
  tags: string[];
  links?: {
    label: string;
    href: string;
  }[];
};

export const projects: Project[] = [
  {
    title: "Wahl-Navi",
    description:
      "Data-driven Angular election-orientation app with weighted party matching, local progress saving, and an Excel-to-YAML pipeline. Includes a fictional demo dataset.",
    tags: ["Angular", "Python", "Elections", "Neutrality"],
    links: [
      {
        label: "Live Demo",
        href: "https://enricoprma.github.io/wahl-navi",
      },
      {
        label: "GitHub",
        href: "https://github.com/enricoprma/wahl-navi",
      },
    ],
  },
  {
    title: "Local-Remote",
    description: "A browser-based wireless touchpad and keyboard for Windows.",
    tags: ["NodeJS", "Express", "Electron", "Remote-Control"],
    links: [
      {
        label: "Latest Release",
        href: "https://github.com/enricoprma/local-remote/releases/latest",
      },
      {
        label: "GitHub",
        href: "https://github.com/enricoprma/local-remote",
      },
    ],
  },
];
