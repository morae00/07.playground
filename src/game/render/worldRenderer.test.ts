import assert from 'node:assert/strict';
import test from 'node:test';
import { SpriteAtlas } from './assets/spriteAtlas.ts';
import { WorldRenderer } from './worldRenderer.ts';

/** An atlas that counts the listeners subscribed and not yet unsubscribed. */
class CountingAtlas extends SpriteAtlas {
  listening = 0;

  onChange(listener: () => void) {
    const stop = super.onChange(listener);
    this.listening += 1;
    return () => {
      this.listening -= 1;
      return stop();
    };
  }
}

test('disposed renderers leave the app-lifetime atlas with no listeners (BUG-21)', () => {
  const atlas = new CountingAtlas();
  const renderers = Array.from({ length: 5 }, () => {
    const renderer = new WorldRenderer();
    renderer.setSprites(atlas);
    return renderer;
  });
  assert.equal(atlas.listening, 5, 'each run renderer listens for pack changes');
  for (const renderer of renderers) renderer.dispose();
  assert.equal(atlas.listening, 0, 'nothing keeps a finished run reachable from the atlas');
  renderers[0].dispose();
  assert.equal(atlas.listening, 0, 'a second dispose unsubscribes nothing twice');
});

test('a renderer listens to one atlas at a time', () => {
  const first = new CountingAtlas();
  const second = new CountingAtlas();
  const renderer = new WorldRenderer();
  renderer.setSprites(first);
  renderer.setSprites(second);
  assert.equal(first.listening, 0);
  assert.equal(second.listening, 1);
  renderer.setSprites(null);
  assert.equal(second.listening, 0);
});
