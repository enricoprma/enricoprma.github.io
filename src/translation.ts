export type Locale = "de" | "en";

export type Translation = {
  de: string;
  en: string;
};

export function createTranslator(lang: Locale) {
  return (value: Translation) => value[lang];
}
