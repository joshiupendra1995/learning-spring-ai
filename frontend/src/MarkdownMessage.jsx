import { memo, useEffect, useMemo, useRef } from 'react';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js/lib/common';
import { marked } from 'marked';

marked.setOptions({ breaks: false, gfm: true });

function MarkdownMessage({ content, streaming = false }) {
  const contentRef = useRef(null);
  const sanitizedHtml = useMemo(
    () => DOMPurify.sanitize(marked.parse(content)),
    [content],
  );

  useEffect(() => {
    if (streaming) return;
    contentRef.current?.querySelectorAll('pre code').forEach((block) => {
      if (!block.classList.contains('hljs')) {
        hljs.highlightElement(block);
      }
    });
  }, [sanitizedHtml, streaming]);

  return (
    <div
      ref={contentRef}
      className="prose message-content"
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}

export default memo(MarkdownMessage);
