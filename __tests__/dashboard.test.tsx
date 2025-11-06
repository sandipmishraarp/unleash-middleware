import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from '@/pages/index';

const mockProbes = [
  {
    key: 'products',
    label: 'Products',
    status: 'success',
    lastSuccessAt: new Date().toISOString(),
    lastErrorAt: null,
    lastErrorMessage: null,
    errorCount24h: 0,
    lastRunAt: new Date().toISOString(),
  },
];

describe('Dashboard page', () => {
  const globalWithFetch = global as typeof global & { fetch?: typeof fetch } & { [key: string]: any };
  const originalFetch = globalWithFetch.fetch;

  afterEach(() => {
    globalWithFetch.fetch = originalFetch;
  });

  it('renders probe cards and runs manual probes', async () => {
    const fetchMock = jest.fn((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('/api/probe/status')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ probes: mockProbes }),
        });
      }

      if (url.includes('/api/probe/products')) {
        return Promise.resolve({
          ok: false,
          status: 500,
          json: async () => ({
            error: 'Manual failure',
            probes: [
              {
                ...mockProbes[0],
                errorCount24h: 1,
                status: 'error',
                lastErrorMessage: 'Manual failure',
              },
            ],
          }),
        });
      }

      return Promise.reject(new Error(`Unexpected fetch: ${url}`));
    });

    globalWithFetch.fetch = fetchMock as unknown as typeof fetch;

    render(<Home />);

    expect(await screen.findByText(/Unleashed Health Probes/)).toBeInTheDocument();
    const button = await screen.findByRole('button', { name: /Run Probe/i });
    const user = userEvent.setup();
    await act(async () => {
      await user.click(button);
    });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Manual failure');
    });
    expect(fetchMock).toHaveBeenCalledWith('/api/probe/status');
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/probe/products',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
