import assert from 'node:assert/strict';
import test from 'node:test';
import { LOGICAL_VIEW, SPAWN_MARGIN, classicViewFrame, logicalViewFrame, spawnFrameOrigin } from './viewPolicy.ts';

test('the camera shows 900 world units vertically at every supported window size', () => {
  assert.deepEqual({ ...logicalViewFrame(1440, 900) }, { zoom: 1, width: 1440, height: 900, offsetX: 0, offsetY: 0 });
  const small = logicalViewFrame(1024, 720);
  assert.equal(small.zoom, 0.8);
  assert.equal(small.width, 1280);
  assert.equal(small.height, 900);
  const large = logicalViewFrame(1920, 1080);
  assert.equal(large.zoom, 1.2);
  assert.equal(large.width, 1600);
  assert.equal(large.offsetX, 0);
});

test('windows wider than 16:9 are pillarboxed to 1600 world units', () => {
  const ultrawide = logicalViewFrame(2560, 1080);
  assert.equal(ultrawide.width, LOGICAL_VIEW.width);
  assert.equal(ultrawide.zoom, 1.2);
  assert.equal(ultrawide.offsetX, (2560 - 1600 * 1.2) / 2);
  assert.equal(logicalViewFrame(0, Number.NaN).zoom, 1, 'invalid sizes fall back to the logical frame');
  assert.deepEqual({ ...classicViewFrame(1280, 720) }, { zoom: 1, width: 1280, height: 720, offsetX: 0, offsetY: 0 });
});

test('D-28: the view stops zooming at 1.2x and never shows fewer than 1200 units across, letterboxing the rest', () => {
  // A window larger than 1920x1080 shows the 1920x1080 frame with bars round it.
  assert.deepEqual({ ...logicalViewFrame(2560, 1440) }, { zoom: 1.2, width: 1600, height: 900, offsetX: (2560 - 1920) / 2, offsetY: (1440 - 1080) / 2 });
  // A window narrower than 4:3 keeps 1200 units across, with bars above and below.
  const tall = logicalViewFrame(768, 1024);
  assert.equal(tall.zoom, 0.64);
  assert.deepEqual([tall.width, tall.height, tall.offsetX, tall.offsetY], [1200, 900, 0, (1024 - 900 * 0.64) / 2]);
  // 4:3 itself and every supported size are unchanged.
  assert.deepEqual({ ...logicalViewFrame(1200, 900) }, { zoom: 1, width: 1200, height: 900, offsetX: 0, offsetY: 0 });
  for (const [w, h] of [[1024, 720], [1280, 720], [1440, 900], [1920, 1080]]) assert.equal(logicalViewFrame(w, h).offsetY, 0, `${w}x${h}`);
});

test('spawns sit outside the visible area for every supported window size', () => {
  for (const [w, h] of [[1024, 720], [1280, 720], [1440, 900], [1920, 1080], [2560, 1080], [2560, 1440], [768, 1024]]) {
    const view = logicalViewFrame(w, h);
    const frame = spawnFrameOrigin(2100, 1500, 4200, 3000);
    const centreX = 2100;
    const centreY = 1500;
    assert.ok(frame.left - SPAWN_MARGIN < centreX - view.width / 2, `${w}x${h} left spawn line is off screen`);
    assert.ok(frame.left + frame.width + SPAWN_MARGIN > centreX + view.width / 2, `${w}x${h} right spawn line is off screen`);
    assert.ok(frame.top - SPAWN_MARGIN < centreY - view.height / 2, `${w}x${h} top spawn line is off screen`);
    assert.ok(frame.top + frame.height + SPAWN_MARGIN > centreY + view.height / 2, `${w}x${h} bottom spawn line is off screen`);
  }
  const corner = spawnFrameOrigin(50, 50, 4200, 3000);
  assert.equal(corner.left, 40);
  assert.equal(corner.top, 40);
});
