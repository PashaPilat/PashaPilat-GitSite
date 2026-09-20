import { createTranslator } from "./translator.mjs";

const files = require.context("./data", true, /^\.\/[a-z]+\/[a-z][a-z0-9-]*\.json$/);
const translations = {};
for (const file of files.keys()) {
  const [, lang, filename] = file.split("/");
  (translations[lang] ??= {})[filename.slice(0, -5)] = files(file);
}
export const availableLangs = Object.keys(translations);
export const t = createTranslator(translations);
