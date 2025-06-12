import test from 'ava';
import { InteractionHistory } from './interaction-history.js';

test.serial.beforeEach(() => {
  // Clear the history before each test
  InteractionHistory.clear();
});

test.serial.afterEach(() => {
  // Clean up after each test
  InteractionHistory.clear();
});

test.serial('records interaction entries', t => {
  InteractionHistory.record('input', 'Repository Name', 'test-repo');
  
  const history = InteractionHistory.getHistory();
  
  t.is(history.length, 1);
  t.is(history[0].type, 'input');
  t.is(history[0].label, 'Repository Name');
  t.is(history[0].value, 'test-repo');
  t.true(history[0].timestamp instanceof Date);
});

test.serial('records multiple interactions in order', t => {
  InteractionHistory.record('input', 'Name', 'test');
  InteractionHistory.record('selection', 'Visibility', 'Private');
  InteractionHistory.record('action', 'Created', 'Repository');
  
  const history = InteractionHistory.getHistory();
  
  t.is(history.length, 3);
  t.is(history[0].label, 'Name');
  t.is(history[1].label, 'Visibility');
  t.is(history[2].label, 'Created');
});

test.serial('clear removes all history entries', t => {
  InteractionHistory.record('input', 'Test', 'value');
  InteractionHistory.record('selection', 'Test2', 'value2');
  
  t.is(InteractionHistory.getHistory().length, 2);
  
  InteractionHistory.clear();
  
  t.is(InteractionHistory.getHistory().length, 0);
});

test.serial('getHistory returns copy of internal array', t => {
  InteractionHistory.record('input', 'Test', 'value');
  
  const history1 = InteractionHistory.getHistory();
  const history2 = InteractionHistory.getHistory();
  
  // Should be equal but not the same reference
  t.deepEqual(history1, history2);
  t.not(history1, history2);
  
  // Modifying returned array should not affect internal state
  history1.push({
    timestamp: new Date(),
    type: 'input',
    label: 'External',
    value: 'external'
  });
  
  t.is(InteractionHistory.getHistory().length, 1);
});