import { useCallback, useState } from 'react';
import { getGameUuid } from './game-id';
import { createMediaRequestId, generateImageMedia, MediaServiceError } from './media';

const referenceMode = 'edit' as const;

export interface GenImageOptions { prompt: string; ref_url?: string; }
export interface UseGenImage {
  generate: (opts: GenImageOptions) => Promise<string>;
  loading: boolean;
  error: Error | null;
  lastUrl: string | null;
}

function delay(ms: number) { return new Promise<void>(resolve => window.setTimeout(resolve, ms)); }

export function useGenImage(): UseGenImage {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUrl, setLastUrl] = useState<string | null>(null);
  const generate = useCallback(async (opts: GenImageOptions) => {
    if (!opts.prompt.trim()) throw new Error('daily-arcana media: prompt is required');
    if (opts.ref_url && !/^https:\/\//i.test(opts.ref_url)) throw new Error('daily-arcana media: reference must be a public HTTPS URL');
    const sessionId = getGameUuid();
    if (!sessionId) throw new Error('daily-arcana media: game UUID is unavailable');
    setLoading(true); setError(null);
    try {
      const request = {
        sessionId,
        requestId: createMediaRequestId(),
        mode: opts.ref_url ? referenceMode : 'text' as const,
        prompt: opts.prompt,
        referenceUrls: opts.ref_url ? [opts.ref_url] : [],
        size: { width: 1024, height: 1024 },
      };
      let task;
      try {
        task = await generateImageMedia(request, { timeoutMs: 280_000 });
      } catch (cause) {
        if (cause instanceof MediaServiceError) {
          if (!cause.retryable) throw cause;
          await delay(Math.max(1, cause.retryAfterSeconds ?? 1) * 1000);
          task = await generateImageMedia(
            { ...request, requestId: cause.code === 'TIMEOUT' ? request.requestId : createMediaRequestId() },
            { timeoutMs: 280_000 },
          );
        } else {
          task = await generateImageMedia(request, { timeoutMs: 280_000 });
        }
      }
      setLastUrl(task.media.url);
      return task.media.url;
    } catch (cause) {
      const next = cause instanceof Error ? cause : new Error(String(cause));
      setError(next); throw next;
    } finally { setLoading(false); }
  }, []);
  return { generate, loading, error, lastUrl };
}
