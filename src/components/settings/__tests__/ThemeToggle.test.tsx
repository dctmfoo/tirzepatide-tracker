import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ThemeToggle } from '../ThemeToggle';

// Mock next-themes
const mockSetTheme = vi.fn();
let mockThemeValue = 'system';

vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: mockThemeValue,
    setTheme: mockSetTheme,
  }),
}));

describe('ThemeToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockThemeValue = 'system';
  });

  describe('initial render (skeleton state)', () => {
    it('renders placeholder elements before hydration', () => {
      const { container } = render(<ThemeToggle />);

      // Should render 3 icon placeholders
      const icons = container.querySelectorAll('svg');
      expect(icons).toHaveLength(3);
    });

    it('renders flex container with gap', () => {
      const { container } = render(<ThemeToggle />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('flex');
      expect(wrapper.className).toContain('gap-2');
    });
  });

  describe('after hydration', () => {
    // Wrap in act() to trigger useEffect mount
    const renderAndMount = () => {
      let result: ReturnType<typeof render>;
      act(() => {
        result = render(<ThemeToggle />);
      });
      return result!;
    };

    it('renders three theme buttons', () => {
      renderAndMount();

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3);
    });

    it('renders light button with label', () => {
      renderAndMount();
      expect(screen.getByRole('button', { name: /light/i })).toBeInTheDocument();
    });

    it('renders system button with label', () => {
      renderAndMount();
      expect(screen.getByRole('button', { name: /system/i })).toBeInTheDocument();
    });

    it('renders dark button with label', () => {
      renderAndMount();
      expect(screen.getByRole('button', { name: /dark/i })).toBeInTheDocument();
    });

    it('all buttons have type="button" attribute', () => {
      renderAndMount();

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });

    it('calls setTheme("light") when clicking light button', () => {
      renderAndMount();

      const lightButton = screen.getByRole('button', { name: /light/i });
      fireEvent.click(lightButton);

      expect(mockSetTheme).toHaveBeenCalledWith('light');
    });

    it('calls setTheme("system") when clicking system button', () => {
      renderAndMount();

      const systemButton = screen.getByRole('button', { name: /system/i });
      fireEvent.click(systemButton);

      expect(mockSetTheme).toHaveBeenCalledWith('system');
    });

    it('calls setTheme("dark") when clicking dark button', () => {
      renderAndMount();

      const darkButton = screen.getByRole('button', { name: /dark/i });
      fireEvent.click(darkButton);

      expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });
  });

  describe('active state styling', () => {
    it('highlights light button when theme is light', () => {
      mockThemeValue = 'light';
      act(() => {
        render(<ThemeToggle />);
      });

      const lightButton = screen.getByRole('button', { name: /light/i });
      expect(lightButton.className).toContain('bg-primary');
    });

    it('highlights system button when theme is system', () => {
      mockThemeValue = 'system';
      act(() => {
        render(<ThemeToggle />);
      });

      const systemButton = screen.getByRole('button', { name: /system/i });
      expect(systemButton.className).toContain('bg-primary');
    });

    it('highlights dark button when theme is dark', () => {
      mockThemeValue = 'dark';
      act(() => {
        render(<ThemeToggle />);
      });

      const darkButton = screen.getByRole('button', { name: /dark/i });
      expect(darkButton.className).toContain('bg-primary');
    });

    it('inactive buttons have muted styling', () => {
      mockThemeValue = 'dark';
      act(() => {
        render(<ThemeToggle />);
      });

      const lightButton = screen.getByRole('button', { name: /light/i });
      expect(lightButton.className).toContain('bg-card');
      expect(lightButton.className).toContain('text-muted-foreground');
    });
  });

  describe('icons', () => {
    it('renders Sun icon in light button', () => {
      act(() => {
        render(<ThemeToggle />);
      });

      const lightButton = screen.getByRole('button', { name: /light/i });
      const icon = lightButton.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('renders Monitor icon in system button', () => {
      act(() => {
        render(<ThemeToggle />);
      });

      const systemButton = screen.getByRole('button', { name: /system/i });
      const icon = systemButton.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('renders Moon icon in dark button', () => {
      act(() => {
        render(<ThemeToggle />);
      });

      const darkButton = screen.getByRole('button', { name: /dark/i });
      const icon = darkButton.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });
});
