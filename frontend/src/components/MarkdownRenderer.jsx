import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

export default function MarkdownRenderer({ content }) {
    const { t } = useTranslation();
    const markdown = (content ?? "").toString();

    if (!markdown.trim()) {
        return (
            <p className="text-sm italic text-text-muted">
                {t("markdown.empty")}
            </p>
        );
    }

    return (
        <div className="markdown-body">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSanitize]}
                components={{
                    a: (props) => (
                        <a
                            {...props}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                        />
                    ),
                    img: (props) => {
                        const src = (props.src || "").toString();
                        if (!src.startsWith("https://")) return null;

                        return (
                            <img
                                {...props}
                                alt={props.alt || ""}
                                loading="lazy"
                                className="max-w-full rounded border"
                            />
                        );
                    },
                }}
            >
                {markdown}
            </ReactMarkdown>
        </div>
    );
}
