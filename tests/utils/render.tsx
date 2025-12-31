import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Wrapper component for providers
// Add any global providers your app needs here (e.g., ThemeProvider, QueryClientProvider)
type ProvidersProps = {
  children: ReactNode;
};

const AllProviders = ({ children }: ProvidersProps) => {
  // If you add providers in the future, wrap children here
  // Example:
  // return (
  //   <ThemeProvider>
  //     <QueryClientProvider client={queryClient}>
  //       {children}
  //     </QueryClientProvider>
  //   </ThemeProvider>
  // );
  return <>{children}</>;
};

// Extended render result with user event
type CustomRenderResult = RenderResult & {
  user: ReturnType<typeof userEvent.setup>;
};

// Custom render function with providers and userEvent
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): CustomRenderResult => {
  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: AllProviders, ...options }),
  };
};

// Re-export everything from testing-library
export * from '@testing-library/react';

// Override render with custom render
export { customRender as render };

// Export userEvent for convenience
export { userEvent };

// Helper to wait for async updates
export const waitForLoadingToFinish = () =>
  new Promise((resolve) => setTimeout(resolve, 0));

// Helper to create a mock form submission event
export const createMockFormEvent = () => ({
  preventDefault: () => {},
  stopPropagation: () => {},
});
