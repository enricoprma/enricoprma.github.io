import type { LocalizedText } from "../translation";

export type Project = {
  slug: string;
  title: string;
  description: LocalizedText;
  tags: (string | LocalizedText)[];
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
      de: "Datengesteuerte Angular-App zur Wahlorientierung mit gewichteter Parteizuweisung, lokaler Speicherung des Fortschritts und einer Excel-zu-YAML-Pipeline. Enthält einen fiktiven Demo-Datensatz.",
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
      de: "Ein browserbasiertes drahtloses Touchpad und Tastatur für Windows.",
      en: "A browser-based wireless touchpad and keyboard for Windows.",
    } satisfies LocalizedText,
    tags: [
      "NodeJS",
      "Express",
      "Electron",
      { de: "Fernsteuerung", en: "Remote-Control" } satisfies LocalizedText,
    ],
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
    title: "AR-Arten-Archiv",
    description: {
      de: "Mixed-Reality-Anwendung für die Meta Quest 3, die fünf ausgestorbene oder möglicherweise ausgestorbene Tierarten mit Handtracking und Informationspanels in die reale Umgebung bringt.",
      en: "A mixed-reality application for Meta Quest 3 that brings five extinct or possibly extinct animal species into the real environment through hand tracking and information panels.",
    } satisfies LocalizedText,
    tags: ["Godot", "GDScript", "OpenXR", "Meta Quest 3"],
    imgSrc: "/illustrations/project-ar-artenarchiv.svg",
  },
];
