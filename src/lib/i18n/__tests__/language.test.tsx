/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { expect, test, describe, beforeEach } from 'vitest';
import { en } from '../dictionaries/en';
import { hi } from '../dictionaries/hi';
import { or } from '../dictionaries/or';

// Simulate the language logic outside React
function getTranslation(lang: string, key: string) {
  const dicts: Record<string, any> = { en, hi, or };
  const dict = dicts[lang] || dicts["en"];
  const translation = dict[key];
  if (translation === undefined) {
    return dicts["en"][key] || key;
  }
  return translation;
}

describe('Language System Core', () => {
  test('defaults to english', () => {
    expect(getTranslation('en', 'nav.home')).toBe('Home');
  });

  test('switches to hindi', () => {
    expect(getTranslation('hi', 'nav.home')).toBe('होम');
  });

  test('switches to odia', () => {
    expect(getTranslation('or', 'nav.home')).toBe('ହୋମ୍');
  });

  test('falls back to english for missing keys', () => {
    expect(getTranslation('hi', 'fake.key')).toBe('fake.key');
  });

  test('handles invalid language gracefully (falls back to en)', () => {
    expect(getTranslation('invalid_lang', 'nav.home')).toBe('Home');
  });

  test('translates status labels', () => {
    expect(getTranslation('en', 'status.PENDING')).toBe('Pending');
    expect(getTranslation('hi', 'status.PENDING')).toBe('लंबित');
    expect(getTranslation('or', 'status.PENDING')).toBe('ବିଚାରାଧୀନ');
  });
});
