import { useEffect, useRef, useState } from 'react';
import { createPatch } from 'diff';
import MarkdownMessage from './MarkdownMessage.jsx';
import { useEventStream } from './useEventStream.js';

function extractFindings(content) {
  const headingPattern = /^#{2,4}\s+(?:\[(CRITICAL|HIGH|MEDIUM|LOW)\]\s*)?(.+)$/gm;
  const headings = [...content.matchAll(headingPattern)];
  const findings = headings.map((heading, index) => {
    const start = heading.index;
    const end = headings[index + 1]?.index ?? content.length;
    return {
      id: `${heading[1] ?? 'REVIEW'}:${heading[2]}:${index}`,
      severity: heading[1] ?? 'REVIEW',
      title: heading[2].trim(),
      text: content.slice(start, end).trim(),
    };
  });

  if (findings.length > 0) return findings;
  return [{
    id: 'REVIEW:all-feedback',
    severity: 'REVIEW',
    title: 'Apply fixes based on the full review',
    text: content.trim(),
  }];
}

export default function PrReviewPage() {
  const [prUrl, setPrUrl] = useState('');
  const [reviews, setReviews] = useState([]);
  const [actionBusyId, setActionBusyId] = useState(null);
  const [actionError, setActionError] = useState('');
  const [fixStatus, setFixStatus] = useState(null);
  const { error, isLoading, streamResponse } = useEventStream();
  const messageListRef = useRef(null);
  const inputRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);

  useEffect(() => {
    const list = messageListRef.current;
    if (list && shouldAutoScrollRef.current) list.scrollTop = list.scrollHeight;
  }, [reviews, error, isLoading]);

  useEffect(() => {
    if (!isLoading) inputRef.current?.focus();
  }, [isLoading]);

  useEffect(() => {
    fetch('/api/ai/pr-review/fixes/status')
      .then((result) => {
        if (!result.ok) throw new Error(`HTTP Error: ${result.status}`);
        return result.json();
      })
      .then(setFixStatus)
      .catch((requestError) => {
        setActionError(
          `Could not check whether PR fixes are enabled: ${
            requestError instanceof Error ? requestError.message : String(requestError)
          }`,
        );
      });
  }, []);

  async function submitReview(event) {
    event.preventDefault();
    const trimmedUrl = prUrl.trim();
    if (!trimmedUrl || isLoading || actionBusyId !== null) return;

    const reviewId = Date.now();
    setReviews((current) => [
      ...current,
      { id: reviewId, prUrl: trimmedUrl, content: '', selectedFindings: [], preview: null },
    ]);
    await streamResponse('/api/ai/pr-review', { prUrl: trimmedUrl }, (chunk) => {
      setReviews((current) =>
        current.map((review, index) =>
          review.id === reviewId
            ? { ...review, content: review.content + chunk }
            : review,
        ),
      );
    });
  }

  function toggleFinding(reviewId, findingId) {
    setReviews((current) => current.map((review) => {
      if (review.id !== reviewId) return review;
      const selected = new Set(review.selectedFindings);
      if (selected.has(findingId)) selected.delete(findingId);
      else selected.add(findingId);
      return { ...review, selectedFindings: [...selected] };
    }));
  }

  async function prepareFixes(review) {
    const findings = extractFindings(review.content)
      .filter((finding) => review.selectedFindings.includes(finding.id));
    if (!findings.length) return;

    setActionBusyId(review.id);
    setActionError('');
    try {
      const result = await fetch('/api/ai/pr-review/fixes/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prUrl: review.prUrl,
          findings: findings.map((finding) => finding.text),
        }),
      });
      if (!result.ok) {
        const details = await result.text();
        throw new Error(details || `HTTP Error: ${result.status}`);
      }
      const preview = await result.json();
      setReviews((current) => current.map((item) =>
        item.id === review.id ? { ...item, preview, committed: null } : item,
      ));
    } catch (requestError) {
      setActionError(requestError instanceof Error ? requestError.message : String(requestError));
      setReviews((current) => current.map((item) =>
        item.id === review.id ? { ...item, preview: null } : item,
      ));
    } finally {
      setActionBusyId(null);
    }
  }

  async function commitFixes(review) {
    if (!review.preview || !window.confirm('Push this proposed fix to the pull request branch?')) return;

    setActionBusyId(review.id);
    setActionError('');
    try {
      const result = await fetch('/api/ai/pr-review/fixes/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ previewId: review.preview.previewId }),
      });
      if (!result.ok) {
        const details = await result.text();
        throw new Error(details || `HTTP Error: ${result.status}`);
      }
      const committed = await result.json();
      setReviews((current) => current.map((item) =>
        item.id === review.id ? { ...item, committed } : item,
      ));
    } catch (requestError) {
      setActionError(requestError instanceof Error ? requestError.message : String(requestError));
      setReviews((current) => current.map((item) =>
        item.id === review.id ? { ...item, preview: null } : item,
      ));
    } finally {
      setActionBusyId(null);
    }
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
            disabled={isLoading || actionBusyId !== null}
            required
          />
          <button type="submit" disabled={isLoading || actionBusyId !== null || !prUrl.trim()}>
            {isLoading ? 'Reviewing…' : 'Review PR'}
          </button>
        </form>
      </section>
      <main
        className="message-list review-messages"
        ref={messageListRef}
        onScroll={(event) => {
          const list = event.currentTarget;
          shouldAutoScrollRef.current =
            list.scrollHeight - list.scrollTop - list.clientHeight < 160;
        }}
      >
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
                streaming={isLoading && index === reviews.length - 1}
              />
              {!isLoading && review.content && (
                <section className="fix-options" aria-label="Apply review fixes">
                  <h2>Apply review findings</h2>
                  {!fixStatus && !actionError && (
                    <p className="fix-disabled">Checking whether PR fix actions are enabled…</p>
                  )}
                  <div className="finding-list">
                    {extractFindings(review.content).map((finding) => (
                      <label className="finding-option" key={finding.id}>
                        <input
                          type="checkbox"
                          checked={review.selectedFindings.includes(finding.id)}
                          onChange={() => toggleFinding(review.id, finding.id)}
                          disabled={actionBusyId !== null || Boolean(review.committed)}
                        />
                        <span>
                          <strong className={`severity severity-${finding.severity.toLowerCase()}`}>
                            {finding.severity}
                          </strong>{' '}
                          {finding.title}
                        </span>
                      </label>
                    ))}
                  </div>
                  {fixStatus && !fixStatus.enabled && (
                    <p className="fix-disabled">
                      {fixStatus.writeEnabled && !fixStatus.tokenConfigured
                        ? 'A GitHub token is required to prepare and push fixes. Public repositories are readable without a token, but pushing requires Contents: Read and write access.'
                        : !fixStatus.writeEnabled && !fixStatus.tokenConfigured
                          ? 'Fixes are disabled. Set GITHUB_WRITE_ENABLED=true and configure GITHUB_TOKEN with write access to the PR branch.'
                          : !fixStatus.writeEnabled
                            ? 'Fixes are disabled. Set GITHUB_WRITE_ENABLED=true and restart the backend.'
                            : 'A GitHub token with write access to the PR branch is required. Configure GITHUB_TOKEN and restart the backend.'}
                    </p>
                  )}
                  {fixStatus?.enabled && review.content.length > 20_000 && (
                    <p className="fix-disabled">
                      This review is too long for a safe fix request. Use a shorter review before preparing fixes.
                    </p>
                  )}
                  <button
                    type="button"
                    className="action-button"
                    onClick={() => prepareFixes(review)}
                    disabled={
                      !fixStatus?.enabled ||
                      review.content.length > 20_000 ||
                      !review.selectedFindings.length ||
                      actionBusyId !== null ||
                      Boolean(review.committed)
                    }
                  >
                    {actionBusyId === review.id && !review.preview ? 'Preparing…' : 'Prepare selected fixes'}
                  </button>
                  {review.preview && (
                    <div className="fix-preview">
                      <h3>Proposed changes</h3>
                      <p>Review this patch carefully. Nothing is pushed until you confirm below.</p>
                      {review.preview.files.map((file) => (
                        <section className="file-preview" key={file.path}>
                          <h4>{file.path}</h4>
                          <pre>{createPatch(
                            file.path,
                            file.originalContent,
                            file.updatedContent,
                            'PR head',
                            'Proposed fix',
                          )}</pre>
                        </section>
                      ))}
                      {review.committed ? (
                        <p className="success-message">
                          Fix pushed in commit{' '}
                          <a href={review.committed.commitUrl} target="_blank" rel="noreferrer">
                            {review.committed.commitSha.slice(0, 7)}
                          </a>
                          .
                        </p>
                      ) : (
                        <button
                          type="button"
                          className="action-button push-button"
                          onClick={() => commitFixes(review)}
                          disabled={actionBusyId !== null}
                        >
                          {actionBusyId === review.id ? 'Pushing…' : 'Confirm and push to PR'}
                        </button>
                      )}
                    </div>
                  )}
                </section>
              )}
            </article>
          </div>
        ))}
        {(error || actionError) && <p className="error-message">Error: {error || actionError}</p>}
      </main>
    </div>
  );
}
