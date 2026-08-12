import fs from "node:fs";
import path from "node:path";

export const ALLOWED_AUDIENCES = new Set(["usuario", "admin-empresa", "admin-sistema", "interno"]);
export const ALLOWED_CATEGORIES = new Set(["sistema", "solucao"]);
export const ALLOWED_STATUSES = new Set(["publicado", "rascunho"]);

const REQUIRED_FIELDS = ["id", "slug", "titulo", "resumo", "arquivo", "categoria", "audiencia", "status", "ordem", "validadoEm", "palavrasChave"];
const ID_PATTERN = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MARKDOWN_LINK_PATTERN = /!?(?:\[[^\]]*\])\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g;

const normalizeRelativePath = (value) => value.replaceAll("\\", "/").replace(/^\.\//, "");

export function extractRegistryKeys(source) {
  return new Set([...source.matchAll(/^\s*"([a-z0-9-]+\.[a-z0-9-]+)"\s*:/gm)].map((match) => match[1]));
}

function validateLocalLinks({ article, content, docsRoot, errors }) {
  for (const match of content.matchAll(MARKDOWN_LINK_PATTERN)) {
    const rawTarget = match[1];
    if (!rawTarget || rawTarget.startsWith("#") || /^[a-z][a-z0-9+.-]*:/i.test(rawTarget)) continue;

    const decodedTarget = decodeURIComponent(rawTarget.split("#")[0].split("?")[0]);
    if (!decodedTarget) continue;

    const articleDirectory = path.dirname(path.resolve(docsRoot, article.arquivo));
    const target = path.resolve(articleDirectory, decodedTarget);
    const relativeTarget = path.relative(docsRoot, target);
    if (relativeTarget.startsWith("..") || path.isAbsolute(relativeTarget)) {
      errors.push(`${article.id}: link local sai da pasta docs: ${rawTarget}`);
    } else if (!fs.existsSync(target)) {
      errors.push(`${article.id}: link local inexistente: ${rawTarget}`);
    }
  }
}

export function validateCatalog({ catalog, docsRoot, registryKeys, today = new Date() }) {
  const errors = [];
  if (catalog?.versaoContrato !== 1) errors.push("versaoContrato deve ser 1");
  if (!Array.isArray(catalog?.artigos)) return { errors: [...errors, "artigos deve ser uma lista"], manifest: null };

  const uniqueness = { id: new Set(), slug: new Set(), arquivo: new Set() };
  for (const [index, article] of catalog.artigos.entries()) {
    const label = article?.id || `artigos[${index}]`;
    for (const field of REQUIRED_FIELDS) {
      if (article?.[field] === undefined || article?.[field] === null || article?.[field] === "") errors.push(`${label}: campo obrigatório ausente: ${field}`);
    }
    if (!ID_PATTERN.test(article?.id || "")) errors.push(`${label}: id inválido`);
    if (!SLUG_PATTERN.test(article?.slug || "")) errors.push(`${label}: slug inválido`);
    if (!ALLOWED_CATEGORIES.has(article?.categoria)) errors.push(`${label}: categoria inválida`);
    if (!ALLOWED_AUDIENCES.has(article?.audiencia)) errors.push(`${label}: audiencia inválida`);
    if (!ALLOWED_STATUSES.has(article?.status)) errors.push(`${label}: status inválido`);
    if (!Number.isInteger(article?.ordem) || article.ordem < 0) errors.push(`${label}: ordem deve ser um inteiro não negativo`);
    if (!Array.isArray(article?.palavrasChave) || article.palavrasChave.some((item) => typeof item !== "string" || !item.trim())) errors.push(`${label}: palavrasChave deve conter textos não vazios`);

    for (const field of Object.keys(uniqueness)) {
      const value = article?.[field];
      if (!value) continue;
      if (uniqueness[field].has(value)) errors.push(`${label}: ${field} duplicado: ${value}`);
      uniqueness[field].add(value);
    }

    const normalizedFile = normalizeRelativePath(article?.arquivo || "");
    if (normalizedFile !== article?.arquivo || !normalizedFile.endsWith(".md")) errors.push(`${label}: arquivo deve ser um caminho Markdown normalizado`);
    const absoluteFile = path.resolve(docsRoot, normalizedFile);
    const relativeFile = path.relative(docsRoot, absoluteFile);
    if (relativeFile.startsWith("..") || path.isAbsolute(relativeFile)) errors.push(`${label}: arquivo sai da pasta docs`);
    else if (!fs.existsSync(absoluteFile)) errors.push(`${label}: arquivo inexistente: ${normalizedFile}`);
    else validateLocalLinks({ article, content: fs.readFileSync(absoluteFile, "utf8"), docsRoot, errors });

    const validatedDate = /^\d{4}-\d{2}-\d{2}$/.test(article?.validadoEm || "") ? new Date(`${article.validadoEm}T00:00:00Z`) : null;
    if (!validatedDate || Number.isNaN(validatedDate.valueOf())) errors.push(`${label}: validadoEm deve usar YYYY-MM-DD`);
    else if (article.status === "publicado" && validatedDate > today) errors.push(`${label}: artigo publicado não pode ter validadoEm no futuro`);

    const contextualFields = [article?.solucao, article?.funcionalidade, article?.registryKey].filter(Boolean).length;
    if (contextualFields !== 0 && contextualFields !== 3) errors.push(`${label}: solucao, funcionalidade e registryKey devem ser informados juntos`);
    if (contextualFields === 3) {
      if (`${article.solucao}.${article.funcionalidade}` !== article.registryKey) errors.push(`${label}: registryKey não corresponde a solucao e funcionalidade`);
      if (!registryKeys.has(article.registryKey)) errors.push(`${label}: registryKey desconhecida ou inativa: ${article.registryKey}`);
    }
    if (article?.audiencia === "usuario" && contextualFields !== 3) {
      errors.push(`${label}: artigo de usuario deve estar vinculado a uma funcionalidade`);
    }
  }

  if (errors.length) return { errors, manifest: null };
  const published = catalog.artigos
    .filter((article) => article.status === "publicado" && article.audiencia !== "interno")
    .map((article) => ({ ...article, palavrasChave: [...article.palavrasChave].sort((a, b) => a.localeCompare(b, "pt-BR")) }))
    .sort((a, b) => a.ordem - b.ordem || a.titulo.localeCompare(b.titulo, "pt-BR") || a.id.localeCompare(b.id));

  return { errors: [], manifest: { versaoContrato: 1, geradoDe: "docs/catalogo.json", artigos: published } };
}
