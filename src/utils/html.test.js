import { describe, it, expect } from 'vitest';
import { escaparHtml } from './html';

describe('escaparHtml', () => {
  it('neutraliza marcado HTML', () => {
    expect(escaparHtml('<img src=x onerror="alert(1)">')).toBe('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
    expect(escaparHtml("<script>alert('x')</script>")).toBe('&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;');
  });

  it('conserva el texto normal y escapa &', () => {
    expect(escaparHtml('Rigor metodológico')).toBe('Rigor metodológico');
    expect(escaparHtml('I+D & innovación')).toBe('I+D &amp; innovación');
  });

  it('acepta valores vacíos o no textuales', () => {
    expect(escaparHtml(null)).toBe('');
    expect(escaparHtml(undefined)).toBe('');
    expect(escaparHtml(7.5)).toBe('7.5');
  });
});
