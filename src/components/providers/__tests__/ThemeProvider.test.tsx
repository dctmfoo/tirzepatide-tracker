import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '../ThemeProvider';

// Mock next-themes
const mockThemeProviderProps = vi.fn();
vi.mock('next-themes', () => ({
  ThemeProvider: ({ children, ...props }: { children: React.ReactNode }) => {
    mockThemeProviderProps(props);
    return <div data-testid="theme-provider">{children}</div>;
  },
}));

describe('ThemeProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children correctly', () => {
    render(
      <ThemeProvider>
        <div data-testid="child">Test Child</div>
      </ThemeProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Test Child')).toBeInTheDocument();
  });

  it('wraps children with NextThemesProvider', () => {
    render(
      <ThemeProvider>
        <span>Wrapped Content</span>
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-provider')).toBeInTheDocument();
  });

  it('configures NextThemesProvider with correct props', () => {
    render(
      <ThemeProvider>
        <span>Content</span>
      </ThemeProvider>
    );

    expect(mockThemeProviderProps).toHaveBeenCalledWith(
      expect.objectContaining({
        attribute: 'class',
        defaultTheme: 'system',
        enableSystem: true,
        disableTransitionOnChange: true,
        themes: ['light', 'dark', 'system'],
      })
    );
  });

  it('uses class attribute for Tailwind CSS compatibility', () => {
    render(
      <ThemeProvider>
        <span>Content</span>
      </ThemeProvider>
    );

    const props = mockThemeProviderProps.mock.calls[0][0];
    expect(props.attribute).toBe('class');
  });

  it('enables system theme detection', () => {
    render(
      <ThemeProvider>
        <span>Content</span>
      </ThemeProvider>
    );

    const props = mockThemeProviderProps.mock.calls[0][0];
    expect(props.enableSystem).toBe(true);
  });

  it('sets system as default theme', () => {
    render(
      <ThemeProvider>
        <span>Content</span>
      </ThemeProvider>
    );

    const props = mockThemeProviderProps.mock.calls[0][0];
    expect(props.defaultTheme).toBe('system');
  });

  it('supports light, dark, and system themes', () => {
    render(
      <ThemeProvider>
        <span>Content</span>
      </ThemeProvider>
    );

    const props = mockThemeProviderProps.mock.calls[0][0];
    expect(props.themes).toContain('light');
    expect(props.themes).toContain('dark');
    expect(props.themes).toContain('system');
  });

  it('disables theme transition on change', () => {
    render(
      <ThemeProvider>
        <span>Content</span>
      </ThemeProvider>
    );

    const props = mockThemeProviderProps.mock.calls[0][0];
    expect(props.disableTransitionOnChange).toBe(true);
  });
});
