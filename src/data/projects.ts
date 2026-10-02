import type { LocalizedText } from "../translation";

export type Project = {
  slug: string;
  title: string;
  description: LocalizedText;
  tags: (string | LocalizedText)[];
  technologies: string[];
  links?: {
    label: string | LocalizedText;
    href: string;
  }[];
  imgSrc?: string;
};

export const PROJECTS: Project[] = [
  {
    slug: "wahl-navi",
    title: "Wahl-Navi",
    description: {
      de: "Eigene Antworten mit kommunalen Parteipositionen vergleichen. Eine Demo mit fiktiven Wahldaten.",
      en: "Data-driven Angular voting advice app with weighted party matching, local progress saving, and an Excel-to-YAML pipeline. Includes a fictional demo dataset.",
    } satisfies LocalizedText,
    tags: [
      "Angular",
      "Python",
      {
        de: "Wahlen",
        en: "Elections",
      } satisfies LocalizedText,
      {
        de: "Neutralität",
        en: "Neutrality",
      } satisfies LocalizedText,
    ],
    technologies: ["Angular", "TypeScript", "Python"],
    links: [
      {
        label: { de: "Live-Demo", en: "Live Demo" } satisfies LocalizedText,
        href: "https://enricoprma.github.io/wahl-navi",
      },
      {
        label: "GitHub",
        href: "https://github.com/enricoprma/wahl-navi",
      },
    ],
    imgSrc: "/illustrations/project-wahl-navi.svg",
  },
  {
    slug: "local-remote",
    title: "Local-Remote",
    description: {
      de: "Lautstärke, Maus und Tastatur am Windows-PC vom Smartphone aus steuern.",
      en: "A browser-based wireless touchpad and keyboard for Windows.",
    } satisfies LocalizedText,
    tags: [
      "NodeJS",
      "Express",
      "Electron",
      { de: "Fernsteuerung", en: "Remote-Control" } satisfies LocalizedText,
    ],
    technologies: ["TypeScript", "Electron", "Node.js", "Express", "RobotJS"],
    links: [
      {
        label: {
          de: "Neueste Version",
          en: "Latest Release",
        } satisfies LocalizedText,
        href: "https://github.com/enricoprma/local-remote/releases/latest",
      },
      {
        label: "GitHub",
        href: "https://github.com/enricoprma/local-remote",
      },
    ],
    imgSrc: "/illustrations/project-local-remote.svg",
  },
  {
    slug: "ar-artenarchiv",
    title: "AR-Artenarchiv",
    description: {
      de: "Fünf Tierdarstellungen mit Handinteraktion und Artinformationen in der realen Umgebung entdecken.",
      en: "A mixed-reality application for Meta Quest 3 that brings five extinct or possibly extinct animal species into the real environment through hand tracking and information panels.",
    } satisfies LocalizedText,
    tags: ["Godot", "GDScript", "OpenXR", "Meta Quest 3"],
    technologies: ["Godot", "GDScript", "OpenXR", "Meta Quest 3"],
    imgSrc: "/illustrations/project-ar-artenarchiv.svg",
  },
];
