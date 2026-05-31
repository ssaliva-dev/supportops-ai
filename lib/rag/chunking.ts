import type { Article, Chunk } from "@/types/domain";
import { RAG_CONFIG } from "@/lib/config";
import { approximateTokenCount } from "@/lib/utils/text";

export type ChunkingOptions = {
  chunkSize?: number;
  overlap?: number;
};

export function splitIntoChunks(content: string, options: ChunkingOptions = {}): Array<{ content: string; startChar: number; endChar: number }> {
  const chunkSize = options.chunkSize ?? RAG_CONFIG.chunkSize;
  const overlap = options.overlap ?? RAG_CONFIG.chunkOverlap;

  if (content.length <= chunkSize) {
    return [{ content, startChar: 0, endChar: content.length }];
  }

  const chunks: Array<{ content: string; startChar: number; endChar: number }> = [];
  let start = 0;

  while (start < content.length) {
    const targetEnd = Math.min(start + chunkSize, content.length);
    let end = targetEnd;

    if (targetEnd < content.length) {
      const windowStart = Math.max(start + Math.floor(chunkSize * 0.7), start);
      const breakPoint = content.lastIndexOf("\n", targetEnd);
      const sentenceBreak = Math.max(content.lastIndexOf(". ", targetEnd), content.lastIndexOf("? ", targetEnd));
      if (breakPoint > windowStart) {
        end = breakPoint;
      } else if (sentenceBreak > windowStart) {
        end = sentenceBreak + 1;
      }
    }

    const chunk = content.slice(start, end).trim();
    if (chunk.length > 0) {
      chunks.push({
        content: chunk,
        startChar: start,
        endChar: end,
      });
    }

    if (end >= content.length) {
      break;
    }

    start = Math.max(0, end - overlap);
  }

  return chunks;
}

export function chunkArticle(article: Article, options: ChunkingOptions = {}): Chunk[] {
  const chunks = splitIntoChunks(article.body, options);

  return chunks.map((item, index) => ({
    id: `${article.id}_chunk_${index + 1}`,
    articleId: article.id,
    content: item.content,
    tokenCount: approximateTokenCount(item.content),
    startChar: item.startChar,
    endChar: item.endChar,
    metadata: {
      title: article.title,
      sourceUrl: article.sourceUrl,
      tags: article.tags,
    },
  }));
}

export function chunkArticles(articles: Article[], options: ChunkingOptions = {}): Chunk[] {
  return articles.flatMap((article) => chunkArticle(article, options));
}
