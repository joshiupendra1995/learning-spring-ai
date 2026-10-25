import { useEffect, useRef, useState } from 'react';
import MarkdownMessage from './MarkdownMessage.jsx';
import { useEventStream } from './useEventStream.js';

const initialMessages = [
  { id: 1, sender: 'Gemma', content: 'Hello! Ask me anything', isUser: false },
];

export default function ChatPage() {
  const [messages, setMessages] = useState(initialMessages);
  const [message, setMessage] = useState('');
  const { error, isLoading, streamResponse } = useEventStream();
  const messageListRef = useRef(null);
  const inputRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);

  useEffect(() => {
    const list = messageListRef.current;
    if (list && shouldAutoScrollRef.current) list.scrollTop = list.scrollHeight;
  }, [messages, error, isLoading]);

  useEffect(() => {
    if (!isLoading) inputRef.current?.focus();
  }, [isLoading]);

  async function submitMessage(event) {
    event.preventDefault();
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isLoading) return;

    setMessages((current) => [
      ...current,
      { id: Date.now(), sender: 'You', content: trimmedMessage, isUser: true },
      { id: Date.now() + 1, sender: 'Gemma', content: '', isUser: false },
    ]);
    setMessage('');
    await streamResponse('/api/ai/chat', { message: trimmedMessage }, (chunk) => {
      setMessages((current) =>
        current.map((item, index) =>
          index === current.length - 1
            ? { ...item, content: item.content + chunk }
            : item,
        ),
      );
    });
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form.requestSubmit();
    }
  }

  return (
    <div className="app-shell">
      <header className="site-header centered-header">
        <h1>Spring AI — Assistant</h1>
        <a href="/pr-review">PR Code Review</a>
      </header>
      <main
        className="message-list"
        ref={messageListRef}
        onScroll={(event) => {
          const list = event.currentTarget;
          shouldAutoScrollRef.current =
            list.scrollHeight - list.scrollTop - list.clientHeight < 160;
        }}
      >
        {messages.map((item) => (
          <article className={`message ${item.isUser ? 'user-message' : 'assistant-message'}`} key={item.id}>
            <span className="message-sender">{item.sender}</span>
            {item.isUser ? (
              <div className="plain-content">{item.content}</div>
            ) : (
              <MarkdownMessage
                content={item.content}
                streaming={isLoading && item.id === messages.at(-1)?.id}
              />
            )}
          </article>
        ))}
        {error && <p className="error-message">Error: {error}</p>}
      </main>
      <footer className="input-footer">
        <form className="input-form" onSubmit={submitMessage}>
          <textarea
            ref={inputRef}
            rows="3"
            value={message}
            placeholder="Ask Me Anything... (Shift + Enter for new line)"
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            required
          />
          <button type="submit" disabled={isLoading || !message.trim()}>
            {isLoading ? 'Sending…' : 'Send'}
          </button>
        </form>
      </footer>
    </div>
  );
}
