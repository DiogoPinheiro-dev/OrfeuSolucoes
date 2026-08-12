// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import DocumentationMarkdown from "../../components/DocumentationMarkdown";
import { extractDocumentationHeadings } from "../../utils/documentationHeadings";

describe("renderização da documentação", () => {
    afterEach(cleanup);

    it("renderiza GFM, links externos seguros e cabeçalhos navegáveis", () => {
        const { container } = render(<DocumentationMarkdown content={`# Artigo\n\n## Pré-requisitos\n\n| Campo | Valor |\n|---|---|\n| A | B |\n\n[Referência](https://example.com)`} />);
        expect(screen.getByRole("heading", { name: "Pré-requisitos" })).toHaveAttribute("id", "user-content-pré-requisitos");
        expect(screen.getByRole("table")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /Referência/ })).toHaveAttribute("target", "_blank");
        expect(screen.getByRole("link", { name: /Referência/ })).toHaveAttribute("rel", "noreferrer");
        expect(container.querySelector("script")).not.toBeInTheDocument();
    });

    it("não executa HTML incluído no Markdown", () => {
        const { container } = render(<DocumentationMarkdown content={'# Seguro\n\n<script>alert("xss")</script>\n\n<img src="x" onerror="alert(1)">'} />);
        expect(container.querySelector("script")).not.toBeInTheDocument();
        expect(container.querySelector("img")).not.toBeInTheDocument();
    });

    it("gera sumário com os mesmos slugs, inclusive títulos repetidos e acentuados", () => {
        expect(extractDocumentationHeadings("# Título\n## Pré-requisitos\n### Detalhes\n## Pré-requisitos")).toEqual([
            { depth: 2, title: "Pré-requisitos", id: "user-content-pré-requisitos" },
            { depth: 3, title: "Detalhes", id: "user-content-detalhes" },
            { depth: 2, title: "Pré-requisitos", id: "user-content-pré-requisitos-1" }
        ]);
    });
});
