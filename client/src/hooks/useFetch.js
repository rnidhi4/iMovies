import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Runs `fetcher()` when the component mounts and whenever a value in `deps` changes.
 * Returns { data, error, loading, refetch }.
 * refetch(true) reloads quietly in the background (no loading spinner, old data stays visible).
 */
export default function useFetch(fetcher, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const [request, setRequest] = useState({ count: 0, silent: false });
  const lastRequest = useRef(request);

  useEffect(() => {
    let active = true;
    const silent = request !== lastRequest.current && request.silent;
    lastRequest.current = request;

    if (!silent) setState((previous) => ({ ...previous, loading: true, error: null }));

    fetcher()
      .then((data) => {
        if (active) setState({ data, error: null, loading: false });
      })
      .catch((error) => {
        if (!active) return;
        setState((previous) =>
          silent ? { ...previous, loading: false } : { data: null, error, loading: false }
        );
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, request]);

  const refetch = useCallback(
    (silent = false) => setRequest((previous) => ({ count: previous.count + 1, silent: silent === true })),
    []
  );

  return { ...state, refetch };
}
