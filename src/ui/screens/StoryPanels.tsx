// Story panels (CON-06): a beat's panels one after another: the art, the chapter it names, the narration, and the
// hero's line. Enter, Space, →, a click, or A goes on; Esc, B, or 건너뛰기 skips the rest. Beats play before a run,
// after a clear, or from the codex, never over play (G15), and the dialog's input guard keeps a key meant for the
// game from skipping a panel unseen (BUG-05).
import { useEffect, useMemo, useState } from 'react';
import { FINAL_CHAPTER } from '../../content/campaign';
import type { ChapterId } from '../../content/schema';
import { t } from '../../i18n/strings';
import { ModalDialog } from '../ModalDialog';
import { beatTitle, loadStory, storyArt, type StoryBeatId, type StoryData } from '../story';

const STORY_GUARD_MS = 350;

function title(beat: StoryBeatId) {
  const { kind, chapter } = beatTitle(beat);
  return t(`story.beat.${kind}`, { chapter });
}

export function StoryPanels({ beats, onDone }: { beats: readonly StoryBeatId[]; onDone: () => void }) {
  const [data, setData] = useState<StoryData | null>(null);
  const [index, setIndex] = useState(0);
  useEffect(() => {
    let live = true;
    void loadStory().then((loaded) => { if (live) setData(loaded); });
    return () => { live = false; };
  }, []);
  const panels = useMemo(() => (data ? beats.flatMap((beat) => (data.beats[beat] ?? []).map((panel) => ({ beat, ...panel }))) : []), [beats, data]);
  const ready = data !== null;
  const empty = ready && panels.length === 0;
  const last = index >= panels.length - 1;
  // Without the story file there is nothing to show, so the beat ends at once.
  useEffect(() => {
    if (empty) onDone();
  }, [empty, onDone]);
  useEffect(() => {
    const following = panels[index + 1];
    if (following) new Image().src = storyArt(following.art);
  }, [index, panels]);
  useEffect(() => {
    if (!ready || empty) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || !['Enter', ' ', 'ArrowRight'].includes(event.key)) return;
      // A focused button takes Enter and Space itself.
      if (event.target instanceof HTMLElement && event.target.closest('button')) return;
      event.preventDefault();
      if (last) onDone();
      else setIndex((current) => current + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [empty, last, onDone, ready]);
  if (!ready || empty) return null;
  const panel = panels[Math.min(index, panels.length - 1)];
  return (
    <ModalDialog className="storyPanels" labelledBy="story-beat" describedBy="story-lines" onEscape={onDone} inputGuardMs={STORY_GUARD_MS}>
      <p className="eyebrow" id="story-beat">{title(panel.beat)}</p>
      <figure className="storyFigure" key={`${panel.beat}-${index}`}>
        <img src={storyArt(panel.art)} alt="" width={480} height={270} />
        <figcaption id="story-lines">
          {panel.chapter !== undefined && <b className="storyChapter">{t('chapter.name', { n: panel.chapter, theme: t(`chapter.${panel.chapter as ChapterId}`) })}</b>}
          {panel.lines.map((line) => <p key={line}>{line}</p>)}
          {panel.quote && <blockquote className={panel.quote.length === 1 ? 'storyQuote glyph' : 'storyQuote'}>{panel.quote}</blockquote>}
          {panel.next && <span className="soonStrip">{t('settle.comingSoon', { chapter: FINAL_CHAPTER + 1 })}</span>}
        </figcaption>
      </figure>
      <div className="modalActions">
        <span className="storyCount">{t('story.count', { n: index + 1, total: panels.length })}</span>
        <button className="ghost" type="button" onClick={onDone}>{t('story.skip')}</button>
        <button className="primary" type="button" onClick={() => (last ? onDone() : setIndex(index + 1))}>{t(last ? 'story.done' : 'story.next')}</button>
      </div>
    </ModalDialog>
  );
}
