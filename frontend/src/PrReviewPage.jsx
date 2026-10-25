import { useEffect, useRef, useState } from 'react';
import MarkdownMessage from './MarkdownMessage.jsx';
import { useEventStream } from './useEventStream.js';

export default function PrReviewPage() {
  const [prUrl, setPrUrl] = useState('');
  const [reviews, setReviews] = useState([]);
  const { error, isLoading, streamResponse } = useEventStream();
  const endOfMessagesRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [reviews, error]);

  useEffect(() => {
    if (!isLoading) inputRef.current?.focus();
  }, [isLoading]);

  async function submitReview(event) {
    event.preventDefault();
    const trimmedUrl = prUrl.trim();
    if (!trimmedUrl || isLoading) return;

    setReviews((current) => [
      ...current,
      { id: Date.now(), prUrl: trimmedUrl, content: '' },
    ]);
    await streamResponse('/api/ai/pr-review', { prUrl: trimmedUrl }, (chunk) => {
      setReviews((current) =>
        current.map((review, index) =>
          index === current.length - 1
            ? { ...review, content: review.content + chunk }
            : review,
        ),
      );
    });
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <h1>Spring AI — PR Code Review Assistant</h1>
        <a href="/">← Back to Chat</a>
      </header>
      <section className="review-input">
        <form className="input-form review-form" onSubmit={submitReview}>
          <input
            ref={inputRef}
            type="url"
            value={prUrl}
            onChange={(event) => setPrUrl(event.target.value)}
            placeholder="Paste GitHub PR URL (e.g., https://github.com/owner/repo/pull/123)"
            disabled={isLoading}
            required
          />
          <button type="submit" disabled={isLoading || !prUrl.trim()}>
            {isLoading ? 'Reviewing…' : 'Review PR'}
          </button>
        </form>
      </section>
      <main className="message-list review-messages">
        {reviews.length === 0 && (
          <article className="message assistant-message">
            <span className="message-sender">AI Reviewer</span>
            <div className="prose message-content">
              Paste a GitHub Pull Request URL above and click <strong>Review PR</strong> to start.
            </div>
          </article>
        )}
        {reviews.map((review, index) => (
          <div className="review-group" key={review.id}>
            <article className="message user-message">
              <span className="message-sender">You requested review for</span>
              <div className="plain-content">{review.prUrl}</div>
            </article>
            <article className="message assistant-message review-result">
              <span className="message-sender">AI Reviewer</span>
              <MarkdownMessage
                content={
                  review.content ||
                  (isLoading && index === reviews.length - 1
                    ? 'Fetching PR diff and analyzing code changes…'
                    : '')
                }
              />
            </article>
          </div>
        ))}
        {error && <p className="error-message">Error: {error}</p>}
        <div ref={endOfMessagesRef} />
      </main>
    </div>
  );
}
