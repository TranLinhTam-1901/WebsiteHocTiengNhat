declare module 'kuroshiro' {
  export default class Kuroshiro {
    init(analyzer: unknown): Promise<void>;
    convert(text: string, options: unknown): Promise<string>;
  }
}

declare module 'kuroshiro-analyzer-kuromoji' {
  const KuromojiAnalyzer: new (opts: { dictPath: string }) => unknown;
  export default KuromojiAnalyzer;
}
