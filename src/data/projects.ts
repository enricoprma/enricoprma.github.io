import type { Translation } from "../translation";

export type Project = {
  title: string;
  description: Translation;
  tags: string[];
  links?: {
    label: string;
    href: string;
  }[];
};

export const PROJECTS: Project[] = [
  {
    title: "Wahl-Navi",
    description: {
      de: "Datengesteuerte Angular-App zur Wahlorientierung mit gewichteter Parteizuweisung, lokaler Speicherung des Fortschritts und einer Excel-zu-YAML-Pipeline. Enthält einen fiktiven Demo-Datensatz.",
      en: "Data-driven Angular election-orientation app with weighted party matching, local progress saving, and an Excel-to-YAML pipeline. Includes a fictional demo dataset.",
    },
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
    description: {
      de: "Ein browserbasiertes drahtloses Touchpad und Tastatur für Windows.",
      en: "A browser-based wireless touchpad and keyboard for Windows.",
    },
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
