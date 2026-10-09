// Folds GameEngine's rule-flag reads to the shipped rule set (TEC-05). The app never changes rule sets (only tests,
// the balance harness, and benches call setRuleSet), so in an app build `this.rules.<flag>` is a constant: written
// as a literal, the minifier drops the other rule set's branches. Tests and tools build the engine without this and
// keep both rule sets. scripts/verify-folded-rules.mjs checks that a folded engine plays the remaster rules exactly
// as the unfolded one.

const FLAG_READ = /\bthis\.rules\.(\w+)\b(?!\s*(?:=(?!=)|\+\+|--|\())/g;
const DESTRUCTURE = /const\s*\{([^}]*)\}\s*=\s*this\.rules\s*;/g;

const literal = (value) => (typeof value === 'boolean' || typeof value === 'number' ? `(${JSON.stringify(value)})` : null);

/** Returns the code with every foldable read of `this.rules` replaced by its value in `rules`, and how many. */
export function foldRuleReads(code, rules) {
  let count = 0;
  const destructured = code.replace(DESTRUCTURE, (match, names) => {
    const flags = names.split(',').map((name) => name.trim()).filter(Boolean);
    if (!flags.every((flag) => /^\w+$/.test(flag) && literal(rules[flag]) !== null)) return match;
    count += flags.length;
    return `const ${flags.map((flag) => `${flag} = ${literal(rules[flag])}`).join(', ')};`;
  });
  const folded = destructured.replace(FLAG_READ, (match, flag) => {
    const value = literal(rules[flag]);
    if (value === null) return match;
    count += 1;
    return value;
  });
  return { code: folded, count };
}
