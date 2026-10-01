// Story beats (CON-06): the prologue, the chapter intros and outros, and the ending, from the lore bible's drafts
// (docs/lore §7). Their words are data outside the app JS (public/assets/content/story.json), fetched when a beat
// plays, and their art is baked into public/assets/packs/story (art/ui-art-spec.mjs STORY_PANELS). A beat plays once
// per save (profile.storySeen) and never over play: before a run, after a clear, or from the codex. The same file
// holds the narrated line a round boss's phase change shows over the boss bar.
import { CAMPAIGN_CHAPTER_COUNT, STAGES_PER_CHAPTER } from '../content/campaign.ts';

export type StoryBeatId = 'prologue' | 'ending' | `intro-${number}` | `outro-${number}`;

/** One panel: its art, the chapter it names, the narration, the hero's line, and whether it hints at the next chapter. */
export type StoryPanel = { art: string; chapter?: number; lines: string[]; quote?: string; next?: boolean };

export type StoryData = {
  beats: Partial<Record<StoryBeatId, StoryPanel[]>>;
  /** A round boss's narrated line for phase 2 and phase 3, by boss id. */
  phases: Record<string, Partial<Record<'2' | '3', string>>>;
};

export const STORY_URL = 'assets/content/story.json';
export const storyArt = (art: string) => `assets/packs/story/${art}.webp`;

let story: Promise<StoryData> | undefined;

/** The story text; without the file, beats are skipped and phase changes show no line. */
export function loadStory(): Promise<StoryData> {
  story ??= fetch(STORY_URL)
    .then((response) => (response.ok ? response.json() : {}))
    .then((data: Partial<StoryData>) => ({ beats: data.beats ?? {}, phases: data.phases ?? {} }), () => ({ beats: {}, phases: {} }));
  return story;
}

/** The beat a campaign run plays before it starts: the prologue before the first chapter, a chapter's intro before its first run. */
export function beatsBeforeRun(seen: readonly string[], chapter: number): StoryBeatId[] {
  const beat: StoryBeatId = chapter === 1 ? 'prologue' : `intro-${chapter}`;
  return seen.includes(beat) ? [] : [beat];
}

type Clear = { runMode: string; cleared: boolean; practice: boolean; chapter: number; stage: number };

/** The beats a clear plays before its settlement: a chapter's outro after its final stage, then the ending after the last. */
export function beatsAfterClear(seen: readonly string[], result: Clear): StoryBeatId[] {
  if (result.runMode !== 'campaign' || !result.cleared || result.practice || result.stage !== STAGES_PER_CHAPTER) return [];
  const beats: StoryBeatId[] = [`outro-${result.chapter}`];
  if (result.chapter === CAMPAIGN_CHAPTER_COUNT) beats.push('ending');
  return beats.filter((beat) => !seen.includes(beat));
}

/** The beats the codex can play again from a chapter's entry, in story order. */
export function chapterBeats(chapter: number): StoryBeatId[] {
  return [
    chapter === 1 ? 'prologue' : `intro-${chapter}`,
    `outro-${chapter}`,
    ...(chapter === CAMPAIGN_CHAPTER_COUNT ? ['ending' as const] : []),
  ];
}

/** A beat's kind and chapter, for its title (story.beat.*). */
export function beatTitle(beat: StoryBeatId): { kind: 'prologue' | 'intro' | 'outro' | 'ending'; chapter: number } {
  if (beat === 'prologue') return { kind: 'prologue', chapter: 1 };
  if (beat === 'ending') return { kind: 'ending', chapter: CAMPAIGN_CHAPTER_COUNT };
  const [kind, chapter] = beat.split('-');
  return { kind: kind as 'intro' | 'outro', chapter: Number(chapter) };
}
