// Content tables (TEC-05): the data modules in this folder, by file name. They are content, not code, so built apps
// do not carry them in the app JS: the build (vite.config.ts, contentTables) evaluates this index, writes it as
// assets/content/tables.json, and swaps each module for a read of that file (src/content/tableRuntime.ts). Tests,
// tools, and the dev server import the modules directly. Each module holds one default export of plain JSON data.
import bossPhaseMoves from './bossPhaseMoves.ts';
import buildDepth from './buildDepth.ts';
import catalog from './catalog.ts';
import codex from './codex.ts';
import encounterGrammars from './encounterGrammars.ts';
import objectives from './objectives.ts';
import skillNumbers from './skillNumbers.ts';
import soundCues from './soundCues.ts';

const CONTENT_TABLES = { bossPhaseMoves, buildDepth, catalog, codex, encounterGrammars, objectives, skillNumbers, soundCues };

export type ContentTables = typeof CONTENT_TABLES;
export default CONTENT_TABLES;
