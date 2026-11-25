import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SEED_LEADERBOARD_ENTRIES,
  createLocalLeaderboardEntry,
  sortAndTrimEntries,
} from './leaderboard';

test('static-host leaderboard creates validated entries and sorts highest score first', () => {
  const newEntry = createLocalLeaderboardEntry({
    name: '  Persepolis Guest  ',
    score: 2500.4,
    clearTime: 36.44,
    heartsRemaining: 3,
    heightPercent: 100,
    victory: true,
    controlMode: 'keyboard',
  });

  assert.equal(newEntry.name, 'Persepolis Guest');
  assert.equal(newEntry.score, 2500);
  assert.equal(newEntry.clearTime, 36.4);

  const sorted = sortAndTrimEntries([...SEED_LEADERBOARD_ENTRIES, newEntry]);
  assert.equal(sorted[0].name, 'Shahr-e Sukhteh');
  assert.equal(sorted[1].name, 'Persepolis Guest');
  assert.ok(sorted.length <= 15);
});

test('static-host leaderboard rejects empty names and invalid scores', () => {
  assert.throws(() =>
    createLocalLeaderboardEntry({
      name: '   ',
      score: 500,
      clearTime: 20,
      heartsRemaining: 1,
      heightPercent: 50,
      victory: false,
      controlMode: 'keyboard',
    })
  );

  assert.throws(() =>
    createLocalLeaderboardEntry({
      name: 'Visitor',
      score: -10,
      clearTime: 20,
      heartsRemaining: 1,
      heightPercent: 50,
      victory: false,
      controlMode: 'keyboard',
    })
  );
});
