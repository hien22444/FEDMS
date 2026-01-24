import React, { forwardRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

const Markdown = forwardRef(
  ({ content, components, ...rest }, ref) => {
    return (
      <div
        {...rest}
        className={`${rest.className}  prose prose-headings:font-bold prose-strong:font-bold font-sans  max-w-none list-disc `}
        ref={ref}
      >
        <ReactMarkdown
          components={{
            a: props => (
              <a {...props} target='_blank' rel='noopener noreferrer' />
            ),
            ...(components ? components : {}),
          }}
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  },
);

Markdown.displayName = 'Markdown';

export { Markdown };
