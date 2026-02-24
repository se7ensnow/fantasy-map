import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

export default function MarkdownRenderer({ content }) {
  const md = (content ?? "").toString();

  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          a: ({ node, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer nofollow" />
          ),
          img: ({ node, ...props }) => {
            const src = (props.src || "").toString();
            if (!src.startsWith("https://")) return null;

            return (
              <img
                {...props}
                alt={props.alt || ""}
                loading="lazy"
                className="rounded border max-w-full"
              />
            );
          },
        }}
      >
        {md || "_No description yet._"}
      </ReactMarkdown>
    </div>
  );
}