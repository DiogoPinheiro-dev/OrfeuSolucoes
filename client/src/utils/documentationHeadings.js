import GithubSlugger from "github-slugger";

export function extractDocumentationHeadings(content = "") {
    const slugger = new GithubSlugger();
    return content
        .split(/\r?\n/)
        .map((line) => line.match(/^(#{2,3})\s+(.+?)\s*#*$/))
        .filter(Boolean)
        .map((match) => {
            const title = match[2].replace(/[*_`[\]]/g, "").trim();
            return { depth: match[1].length, title, id: `user-content-${slugger.slug(title)}` };
        });
}
