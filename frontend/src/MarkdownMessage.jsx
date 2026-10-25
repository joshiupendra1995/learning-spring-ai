import { useEffect, useMemo, useRef } from 'react';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js/lib/common';
import { marked } from 'marked';

marked.setOptions({ breaks: false, gfm: true });

export default function MarkdownMessage({ content }) {
  const contentRef = useRef(null);
  const sanitizedHtml = useMemo(
    () => DOMPurify.sanitize(marked.parse(content)),
    [content],
  );

  useEffect(() => {
    contentRef.current?.querySelectorAll('pre code').forEach((block) => {
      hljs.highlightElement(block);
    });
  }, [sanitizedHtml]);

  return (
    <div
      ref={contentRef}
      className="prose message-content"
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}
