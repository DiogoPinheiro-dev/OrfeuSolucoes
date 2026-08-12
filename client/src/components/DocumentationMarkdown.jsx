import { ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

const MarkdownLink = ({ href = "", children, ...props }) => {
    const external = /^https?:\/\//i.test(href);
    return (
        <a {...props} href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined}>
            {children}
            {external && <ExternalLink size={14} aria-label="Abre em uma nova janela" />}
        </a>
    );
};

export default function DocumentationMarkdown({ content }) {
    return (
        <div className="documentation-markdown">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSlug, rehypeSanitize]}
                components={{ a: MarkdownLink }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
