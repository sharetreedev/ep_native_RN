import { colors, fonts, fontSizes, spacing, borderRadius } from '../theme';

describe('theme tokens', () => {
  it('exposes the core brand colour', () => {
    expect(colors.primary).toBe('#91A27D');
  });

  it('includes chart colour tokens referenced by OutlookChart and PulseChart', () => {
    expect(colors.chartOutlookFrom).toBeDefined();
    expect(colors.chartPulseFrom).toBeDefined();
  });

  it('includes a warning token for inactive/pending states', () => {
    expect(colors.warning).toBeDefined();
  });

  it('includes MHFR gradient tokens used by EmergencyServicesScreen', () => {
    expect(colors.mhfrGradientFrom).toBeDefined();
    expect(colors.mhfrGradientTo).toBeDefined();
  });

  it('exposes heading and body font families', () => {
    expect(fonts.heading).toMatch(/Quicksand/);
    expect(fonts.body).toMatch(/Manrope/);
  });

  it('defines a base spacing scale', () => {
    expect(spacing.base).toBe(16);
    expect(spacing.xl).toBe(24);
  });

  it('defines a base border-radius scale', () => {
    expect(borderRadius.button).toBe(16);
    expect(borderRadius.full).toBeGreaterThanOrEqual(999);
  });

  it('has matching text sizes on the fontSize scale', () => {
    expect(fontSizes.base).toBe(16);
    expect(fontSizes['2xl']).toBe(24);
  });
});
