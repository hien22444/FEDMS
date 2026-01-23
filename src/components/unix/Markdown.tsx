import React, { forwardRef } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface IProps {
  content: string;
  components?: Components;
}

const Markdown = forwardRef<
  HTMLDivElement,
  IProps & React.ComponentPropsWithRef<'div'>
>(({ content, components, ...rest }, ref) => {
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
});

Markdown.displayName = 'Markdown';

export { Markdown };
