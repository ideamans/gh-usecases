import test from 'ava';
import { formatErrorDisplay } from './error-messages.js';
import { InteractionHistory } from '../services/interaction-history.js';

test.beforeEach(() => {
  InteractionHistory.clear();
});

test('formats simple error message', t => {
  const error = new Error('Test error message');
  
  const result = formatErrorDisplay(error);
  
  t.true(result.some(line => line.includes('❌ An Error Occurred')));
  t.true(result.some(line => line.includes('Test error message')));
});

test('includes interaction history when available', t => {
  InteractionHistory.record('input', 'Repository Name', 'test-repo');
  InteractionHistory.record('selection', 'Visibility', 'Private');
  
  const error = new Error('Creation failed');
  
  const result = formatErrorDisplay(error);
  
  t.true(result.some(line => line.includes('❌ An Error Occurred')));
  t.true(result.some(line => line.includes('Interaction History:')));
  t.true(result.some(line => line.includes('Repository Name: test-repo')));
  t.true(result.some(line => line.includes('Visibility: Private')));
});

test('handles error without message', t => {
  const error = new Error();
  
  const result = formatErrorDisplay(error);
  
  t.true(result.some(line => line.includes('❌ An Error Occurred')));
});

test('handles non-Error objects', t => {
  const error = 'String error';
  
  const result = formatErrorDisplay(error as any);
  
  t.true(result.some(line => line.includes('❌ An Error Occurred')));
  t.true(result.some(line => line.includes('String error')));
});

test('includes all interaction history entries', t => {
  // Add multiple interactions
  for (let i = 0; i < 5; i++) {
    InteractionHistory.record('input', `Field ${i}`, `value ${i}`);
  }
  
  const error = new Error('Test error');
  
  const result = formatErrorDisplay(error);
  
  // Should include all 5 interactions
  const interactionLines = result.filter(line => line.includes('Field'));
  t.is(interactionLines.length, 5);
});