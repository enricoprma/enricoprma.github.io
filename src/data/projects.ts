import type { LocalizedText } from "../translation";

export type Project = {
  title: string;
  description: LocalizedText;
  tags: (string | LocalizedText)[];
  links?: {
    label: string | LocalizedText;
    href: string;
  }[];
};

export const PROJECTS: Project[] = [
  {
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
  },
  {
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
  },
];
