import React, { forwardRef } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';

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
      className={`${rest.className}  prose max-w-none text-black `}
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
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});

Markdown.displayName = 'Markdown';

export { Markdown };
