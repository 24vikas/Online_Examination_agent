/**
 * Recursive Character Text Splitter for Academic Syllabus & Curriculum Documents.
 * Splits text into 800-1200 token chunks with a 150-token overlap,
 * preserving semantic structure (Units, Chapters, Sections, Paragraphs).
 */

export interface ChunkMetadata {
  id: string;
  docId: string;
  topic: string;
  section: string;
  pageNumber: number;
  tokenCount: number;
  charCount: number;
  chunkIndex: number;
  totalChunks: number;
}

export interface DocumentChunk {
  text: string;
  metadata: ChunkMetadata;
}

export class RecursiveCharacterTextSplitter {
  private minTokens: number;
  private maxTokens: number;
  private overlapTokens: number;
  private separators: string[];

  constructor(options?: {
    minTokens?: number;
    maxTokens?: number;
    overlapTokens?: number;
    chunkSize?: number;
    chunkOverlap?: number;
    separators?: string[];
  }) {
    const chunkTokens = options?.chunkSize ? Math.ceil(options.chunkSize / 4) : undefined;
    const overlapTokens = options?.chunkOverlap ? Math.ceil(options.chunkOverlap / 4) : undefined;

    this.minTokens = options?.minTokens ?? (chunkTokens ? Math.max(100, chunkTokens - 100) : 800);
    this.maxTokens = options?.maxTokens ?? (chunkTokens ?? 1200);
    this.overlapTokens = options?.overlapTokens ?? (overlapTokens ?? 150);
    this.separators = options?.separators ?? [
      '\n\nUnit ',
      '\n\nModule ',
      '\n\nChapter ',
      '\n\nSection ',
      '\n\n',
      '\n',
      '. ',
      '? ',
      '! ',
      '; ',
      ' ',
      '',
    ];
  }

  // Rough estimation: 1 token ≈ 4 characters for academic English
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  public async splitText(text: string): Promise<string[]> {
    const docChunks = this.splitDocument('auto', text);
    return docChunks.map((c) => c.text);
  }

  public splitDocument(
    docId: string,
    rawText: string,
    defaultTopic: string = 'General Curriculum'
  ): DocumentChunk[] {
    const rawChunks = this.recursiveSplit(rawText, this.separators);
    const merged = this.mergeWithOverlap(rawChunks);

    let currentPage = 1;
    let currentSection = 'Introduction';
    let currentTopic = defaultTopic;

    return merged.map((text, idx) => {
      // Detect section/unit headers within the chunk
      const sectionMatch = text.match(/(?:Unit|Module|Chapter|Section)\s+(\d+[:.\s][^\n]+)/i);
      if (sectionMatch) {
        currentSection = sectionMatch[0].trim().replace(/\n/g, ' ');
      }

      const topicMatch = text.match(/Topic:\s*([^\n]+)|Subject:\s*([^\n]+)/i);
      if (topicMatch) {
        currentTopic = (topicMatch[1] || topicMatch[2]).trim();
      }

      // Page estimation: roughly 3500 chars per standard textbook page
      currentPage = Math.floor((idx * this.minTokens * 4) / 3500) + 1;

      const tokenCount = this.estimateTokens(text);

      return {
        text,
        metadata: {
          id: `chunk_${docId}_${idx + 1}`,
          docId,
          topic: currentTopic,
          section: currentSection,
          pageNumber: currentPage,
          tokenCount,
          charCount: text.length,
          chunkIndex: idx + 1,
          totalChunks: merged.length,
        },
      };
    });
  }

  private recursiveSplit(text: string, separators: string[]): string[] {
    if (separators.length === 0 || this.estimateTokens(text) <= this.maxTokens) {
      return [text.trim()].filter(Boolean);
    }

    const separator = separators[0];
    const nextSeparators = separators.slice(1);

    const parts = text.split(separator);
    const result: string[] = [];

    for (const part of parts) {
      if (this.estimateTokens(part) <= this.maxTokens) {
        if (part.trim().length > 0) {
          result.push(part.trim());
        }
      } else {
        const subParts = this.recursiveSplit(part, nextSeparators);
        result.push(...subParts);
      }
    }

    return result;
  }

  private mergeWithOverlap(splits: string[]): string[] {
    const chunks: string[] = [];
    let currentChunk = '';

    for (let i = 0; i < splits.length; i++) {
      const split = splits[i];
      const combined = currentChunk ? `${currentChunk}\n\n${split}` : split;

      if (this.estimateTokens(combined) <= this.maxTokens) {
        currentChunk = combined;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }

        // Calculate overlap from end of previous chunk
        if (this.overlapTokens > 0 && currentChunk) {
          const overlapChars = this.overlapTokens * 4;
          const overlapSlice = currentChunk.slice(-overlapChars);
          currentChunk = `${overlapSlice}\n\n${split}`;
        } else {
          currentChunk = split;
        }
      }
    }

    if (currentChunk && currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }
}
