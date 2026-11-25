import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DIFFICULTY_CONFIGS,
  PHYSICS,
  calculateScore,
  createInitialState,
  stepSimulation,
  updateCamera,
} from './physics';
import { DAMAGE_ZONES, JUMP_PADS, MAP_HEIGHT, MAP_WIDTH, TREE_GOAL } from './levelData';

const IDLE_INPUT = { jumpPressed: false, jumpHeld: false, headbuttPressed: false };

test('goat auto-runs right and turns around when reaching map boundary or solid wall', () => {
  const state = createInitialState('playing');
  assert.equal(state.goat.dir, 1);
  const startX = state.goat.x;

  // Run forward for 0.5 seconds (30 frames)
  for (let i = 0; i < 30; i++) {
    stepSimulation(state, IDLE_INPUT, 1 / 60);
  }
  assert.ok(state.goat.x > startX + 150, 'goat should auto-run to the right');

  // Place goat near left edge running left and verify turnaround to right
  state.goat.x = 6;
  state.goat.dir = -1;
  const events = stepSimulation(state, IDLE_INPUT, 1 / 30);
  assert.equal(state.goat.dir, 1, 'goat should rotate to face right at left boundary');
  assert.ok(events.some((e) => e.type === 'turn'), 'turn event emitted');
});

test('jump triggers single-shot jump animation, responsive arc, and input buffering', () => {
  const state = createInitialState('playing');
  const groundY = state.goat.y;

  // Trigger jump
  const events = stepSimulation(
    state,
    { jumpPressed: true, jumpHeld: true, headbuttPressed: false },
    1 / 60
  );
  assert.ok(events.some((e) => e.type === 'jump'));
  assert.equal(state.goat.grounded, false);
  assert.equal(state.goat.jumpAnimActive, true);
  assert.ok(state.goat.vy < -1400);

  // Measure apex height across full jump arc
  let minY = state.goat.y;
  for (let i = 0; i < 90; i++) {
    stepSimulation(state, { jumpPressed: false, jumpHeld: true, headbuttPressed: false }, 1 / 60);
    if (state.goat.y < minY) minY = state.goat.y;
  }
  const jumpHeight = groundY - minY;
  assert.ok(
    jumpHeight >= 420 && jumpHeight <= 520,
    `jump height ${jumpHeight.toFixed(1)} should clear bottom stepping platform (406px)`
  );
  assert.equal(state.goat.grounded, true, 'goat should land back on floor');
  assert.equal(state.goat.jumpAnimActive, false, 'one-shot jump animation resets on landing');
});

test('blue wave jump pad bounces goat high enough to reach the middle floor', () => {
  const state = createInitialState('playing');
  const pad = JUMP_PADS[0];
  state.goat.x = pad.x + 40;
  state.goat.y = pad.y - state.goat.h + 10;
  state.goat.vy = 100;
  state.goat.grounded = false;

  const events = stepSimulation(state, IDLE_INPUT, 1 / 60);
  assert.ok(events.some((e) => e.type === 'spring'), 'spring event triggered');

  let minFeetY = state.goat.y + state.goat.h;
  for (let i = 0; i < 65; i++) {
    stepSimulation(state, { jumpPressed: false, jumpHeld: true, headbuttPressed: false }, 1 / 60);
    const feetY = state.goat.y + state.goat.h;
    if (feetY < minFeetY) minFeetY = feetY;
  }
  assert.ok(
    minFeetY < 2350,
    `spring apex feetY=${minFeetY.toFixed(0)} must clear Middle Floor (y=2375)`
  );
});

test('headbutt knocks out evil character and awards points without losing hearts', () => {
  const state = createInitialState('playing');
  const bird = state.enemies.find((e) => e.kind === 'evilBird')!;
  // Position goat immediately to the left of EvilBird facing right
  state.goat.x = bird.x - state.goat.w + 10;
  state.goat.y = bird.y + 20;
  state.goat.dir = 1;
  state.goat.vy = 0;

  // Initiate headbutt and collect events across active frames
  const firstEvents = stepSimulation(
    state,
    { jumpPressed: false, jumpHeld: false, headbuttPressed: true },
    1 / 60
  );
  let koEventFound = firstEvents.some((e) => e.type === 'enemyKo');
  for (let i = 0; i < 8; i++) {
    const evs = stepSimulation(state, IDLE_INPUT, 1 / 60);
    if (evs.some((e) => e.type === 'enemyKo')) koEventFound = true;
  }

  assert.equal(koEventFound, true, 'headbutt should KO enemy');
  assert.equal(bird.alive, false, 'enemy should be defeated');
  assert.equal(state.hearts, 3, 'goat should not lose hearts during successful headbutt');
  assert.ok(state.bonusPoints >= bird.points, 'score bonus should increase');
});

test('hitting spikes deducts hearts with invulnerability frames and triggers defeat at 0 hearts', () => {
  const state = createInitialState('playing');
  const spike = DAMAGE_ZONES[0];

  // Force 3 separate hits (advancing past invulnerability & hitstop between each)
  for (let hit = 1; hit <= 3; hit++) {
    state.goat.x = spike.x - 10;
    state.goat.y = spike.y + 10;
    state.goat.invulnTimer = 0;
    state.hitstopTimer = 0;
    const evs = stepSimulation(state, IDLE_INPUT, 1 / 60);
    assert.ok(evs.some((e) => e.type === 'hurt'), `hurt event on hit ${hit}`);
    assert.equal(state.hearts, 3 - hit, `hearts should be ${3 - hit}`);

    // Immediately overlapping again during invulnerability should NOT lose another heart
    state.hitstopTimer = 0;
    state.goat.x = spike.x - 10;
    state.goat.y = spike.y + 10;
    stepSimulation(state, IDLE_INPUT, 1 / 60);
    assert.equal(state.hearts, 3 - hit, 'invulnerability frames prevent instant drain');
  }

  // Advance past brief defeat delay beat
  state.hitstopTimer = 0;
  for (let i = 0; i < 40; i++) {
    stepSimulation(state, IDLE_INPUT, 1 / 60);
  }
  assert.equal(state.phase, 'defeat', 'game should transition to defeat at 0 hearts');
});

test('reaching sacred tree at top triggers victory with heart and speed bonus', () => {
  const state = createInitialState('playing');
  state.goat.x = TREE_GOAL.x + 20;
  state.goat.y = TREE_GOAL.y + 20;
  state.elapsedTime = 35;

  const events = stepSimulation(state, IDLE_INPUT, 1 / 60);
  assert.equal(state.phase, 'victory');
  assert.equal(state.heightPercent, 100);
  assert.ok(events.some((e) => e.type === 'victory'));
  const expectedMin = calculateScore({
    heightPercent: 100,
    bonusPoints: 0,
    hearts: 3,
    elapsedTime: 35.1,
    victory: true,
  });
  assert.ok(state.score >= expectedMin - 5, 'victory score includes bonuses');
});

test('camera locks on bottom third initially and follows goat upward', () => {
  const state = createInitialState('playing');
  const viewH = MAP_HEIGHT / 3;
  updateCamera(state, MAP_WIDTH, viewH, 1 / 60, true);
  assert.ok(
    Math.abs(state.cameraY - (MAP_HEIGHT - viewH)) < 2,
    'camera starts locked at bottom third of map'
  );

  // Move goat to top floor and let camera follow
  state.goat.y = 520;
  for (let i = 0; i < 60; i++) {
    updateCamera(state, MAP_WIDTH, viewH, 1 / 60, false);
  }
  assert.ok(state.cameraY < 200, `cameraY=${state.cameraY.toFixed(1)} should follow goat to top`);
});

test('physics constants remain within responsive platforming bounds', () => {
  assert.ok(PHYSICS.COYOTE_TIME >= 0.08 && PHYSICS.COYOTE_TIME <= 0.14);
  assert.ok(PHYSICS.JUMP_BUFFER_TIME >= 0.1 && PHYSICS.JUMP_BUFFER_TIME <= 0.16);
  assert.ok(PHYSICS.FALL_GRAVITY > PHYSICS.GRAVITY);
});

test('easy, medium, and hard levels apply 3 distinct increasing goat speeds', () => {
  const easyState = createInitialState('playing', 'easy');
  const mediumState = createInitialState('playing', 'medium');
  const hardState = createInitialState('playing', 'hard');

  const startX = easyState.goat.x;
  for (let i = 0; i < 60; i++) {
    stepSimulation(easyState, IDLE_INPUT, 1 / 60);
    stepSimulation(mediumState, IDLE_INPUT, 1 / 60);
    stepSimulation(hardState, IDLE_INPUT, 1 / 60);
  }

  const easyDist = easyState.goat.x - startX;
  const mediumDist = mediumState.goat.x - startX;
  const hardDist = hardState.goat.x - startX;

  assert.ok(
    Math.abs(easyDist - DIFFICULTY_CONFIGS.easy.runSpeed) < 5,
    `easy distance ${easyDist.toFixed(1)} should match easy runSpeed`
  );
  assert.ok(
    Math.abs(mediumDist - DIFFICULTY_CONFIGS.medium.runSpeed) < 5,
    `medium distance ${mediumDist.toFixed(1)} should match medium runSpeed`
  );
  assert.ok(
    Math.abs(hardDist - DIFFICULTY_CONFIGS.hard.runSpeed) < 5,
    `hard distance ${hardDist.toFixed(1)} should match hard runSpeed`
  );
  assert.ok(easyDist < mediumDist && mediumDist < hardDist, 'speeds must strictly increase from easy to medium to hard');
  assert.equal(DIFFICULTY_CONFIGS.hard.runSpeed, DIFFICULTY_CONFIGS.easy.runSpeed * 2);
});
