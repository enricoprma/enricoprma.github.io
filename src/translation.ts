export type Locale = "de" | "en";

export type LocalizedText = Record<Locale, string>;

export type LocalizedTextTree = {
  [key: string]: LocalizedText | LocalizedTextTree;
};

export function createLocalizer(locale: Locale) {
  return (text: LocalizedText) => text[locale];
}
