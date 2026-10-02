// Scope guard for the project subagents (.claude/agents/*.md), run as their PreToolUse hook:
//   node .claude/hooks/scope-guard.mjs <profile>
// It reads the hook event (JSON on stdin) and blocks a tool call outside the profile's scope with exit code 2; the
// reason on stderr goes back to the agent. Anything unexpected (bad input, an unknown profile or tool) blocks too,
// because any other non-zero exit lets the call through.
//
// This keeps a cooperating agent inside its lane. It is not a sandbox: an allowed build command runs repository code.
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import path from 'node:path';

/** A Bash command must match one of these whole, after the shell-syntax check below. */
const PROFILES = {
  // Edits only the audio folders: the SFX recipes, the baked sound pack, music deliveries, and its own working notes.
  'sound-designer': {
    write: ['art/audio/', 'art/sfx-spec.mjs', 'public/assets/packs/sfx-common/', 'public/assets/packs/music/'],
    // The recipes are data that scripts/build-sfx.mjs imports and runs, so they may not reach for the system.
    code: { 'art/sfx-spec.mjs': /\b(?:import|require|process|globalThis|eval|Function|fetch|child_process)\b|node:/ },
    bash: [
      /^npm run build:sfx$/,
      /^node scripts\/build-sfx\.mjs$/,
      /^npm run test:unit$/,
      /^node --test(?: (?:src\/game\/audioPolicy\.test\.ts|src\/game\/audio\/[\w*.-]+\.test\.ts|test\/[\w*.-]*audio[\w*.-]*\.test\.mjs))+$/,
      /^afinfo(?: [\w./*@+-]+)+$/,
    ],
  },
  // Read-only: renders review images outside the repository and nothing else.
  'art-director': {
    write: [],
    code: {},
    bash: [/^node scripts\/art-review-sheet\.mjs(?: (?!.*--out\b).*)?$/],
  },
};

const WRITE_TOOLS = new Set(['Write', 'Edit', 'MultiEdit', 'NotebookEdit']);

function block(reason) {
  process.stderr.write(`scope-guard: ${reason}\n`);
  process.exit(2);
}

/** The real path of a file that may not exist yet: the nearest existing ancestor resolved, the rest appended. */
function realTarget(file) {
  let existing = file;
  const rest = [];
  while (!existsSync(existing)) {
    rest.unshift(path.basename(existing));
    const parent = path.dirname(existing);
    if (parent === existing) break;
    existing = parent;
  }
  return path.join(realpathSync(existing), ...rest);
}

/** Rejects command chaining, redirection, substitution, and expansion; quoted text may hold any of them literally. */
function shellSyntaxProblem(command) {
  let quote = null;
  for (const char of command) {
    if (quote === "'") {
      if (char === "'") quote = null;
      continue;
    }
    if (quote === '"') {
      if (char === '"') quote = null;
      else if (char === '$' || char === '`' || char === '\\') return `"${char}" inside double quotes`;
      continue;
    }
    if (char === "'" || char === '"') quote = char;
    else if (';&|<>`$\\\n\r'.includes(char)) return `"${char === '\n' ? '\\n' : char}"`;
  }
  return quote ? 'an unclosed quote' : null;
}

function check(profileName, event) {
  const profile = PROFILES[profileName];
  if (!profile) block(`unknown profile "${profileName}"`);
  const root = realTarget(process.env.CLAUDE_PROJECT_DIR || event.cwd || process.cwd());
  const tool = event.tool_name;
  const input = event.tool_input ?? {};

  if (WRITE_TOOLS.has(tool)) {
    const file = input.file_path ?? input.notebook_path;
    if (typeof file !== 'string' || !file) block(`${tool} without a file path`);
    const target = realTarget(path.resolve(event.cwd || root, file));
    const relative = path.relative(root, target).split(path.sep).join('/');
    const inside = !relative.startsWith('../') && relative !== '..' && !path.isAbsolute(relative);
    const allowed = inside && profile.write.some((scope) => (scope.endsWith('/') ? relative.startsWith(scope) : relative === scope));
    if (!allowed) {
      block(profile.write.length
        ? `${profileName} may change only ${profile.write.join(', ')}; "${relative}" is outside that scope. Put the proposal in your report instead.`
        : `${profileName} is read-only; put the proposed change in your report instead of writing "${relative}".`);
    }
    const pattern = profile.code[relative];
    if (pattern) {
      const text = [input.content, input.file_text, input.new_string, input.new_str, ...(input.edits ?? []).flatMap((edit) => [edit.new_string, edit.new_str])].filter((value) => typeof value === 'string').join('\n');
      const found = text.match(pattern);
      if (found) block(`${relative} holds recipe data only; "${found[0]}" is not allowed there.`);
    }
    return;
  }

  if (tool === 'Bash') {
    const command = String(input.command ?? '').trim();
    const problem = shellSyntaxProblem(command);
    if (problem) block(`run one plain command at a time; ${problem} is not allowed.`);
    if (!profile.bash.some((pattern) => pattern.test(command))) {
      block(`${profileName} may run only: ${profile.bash.map((pattern) => pattern.source).join('  |  ')}. Use Read, Grep, and Glob to look around.`);
    }
    return;
  }

  // The agents' tool lists decide everything else; a guard matched to another tool has nothing to add.
}

try {
  const event = JSON.parse(readFileSync(0, 'utf8'));
  check(process.argv[2], event);
} catch (error) {
  block(`could not check this call (${error.message})`);
}
