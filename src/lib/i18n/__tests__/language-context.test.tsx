/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, test, describe, beforeEach, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { LanguageProvider, useLanguage } from '../LanguageContext';

describe('LanguageContext rendering', () => {
  let store: Record<string, string> = {};
  
  beforeEach(() => {
    store = {};
    global.localStorage = {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
      removeItem: vi.fn((key: string) => { delete store[key]; }),
      clear: vi.fn(() => { store = {}; }),
      length: 0,
      key: vi.fn()
    } as any;
  });

  function TestComponent() {
    const { t, language } = useLanguage();
    return <div data-lang={language}>{t('nav.home' as any)}</div>;
  }

  test('renders with default english', () => {
    const html = renderToString(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );
    expect(html).toContain('Home');
    expect(html).toContain('data-lang="en"');
  });
});
