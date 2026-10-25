import { useState } from 'react';

export function useEventStream() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function streamResponse(url, body, onChunk) {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream, text/plain, */*',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const details = await response.text();
        throw new Error(details || `HTTP Error: ${response.status}`);
      }
      if (!response.body) {
        throw new Error('The response did not include a readable stream.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      function consumeEvent(event) {
        const data = event
          .split(/\r?\n/)
          .filter((line) => line.startsWith('data:'))
          .map((line) => line.slice(5))
          .join('\n');
        if (data) onChunk(data);
      }

      while (true) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const events = buffer.split(/\r?\n\r?\n/);
        buffer = events.pop() ?? '';
        events.forEach(consumeEvent);
        if (done) break;
      }

      if (buffer.trim()) consumeEvent(buffer);
    } catch (streamError) {
      setError(streamError instanceof Error ? streamError.message : String(streamError));
    } finally {
      setIsLoading(false);
    }
  }

  return { error, isLoading, streamResponse };
}
