using System.Linq.Expressions;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using QuizzTiengNhat.Models;
using QuizzTiengNhat.Models.Enums;

namespace QuizzTiengNhat.Services.Learners;

/// <summary>
/// Kết quả tra cứu kiến thức trong DB cho gia sư AI.
/// </summary>
public sealed class TutorKnowledgeContext
{
    /// <summary>Câu hỏi của học viên có vẻ hỏi về kiến thức (ngữ pháp/từ vựng/kanji) hay chỉ là trò chuyện.</summary>
    public bool IsKnowledgeQuery { get; init; }

    /// <summary>Có tìm thấy bản ghi phù hợp trong DB hay không.</summary>
    public bool HasResults { get; init; }

    /// <summary>Khối dữ liệu trích từ DB để nạp cho mô hình (chỉ dùng khi HasResults = true).</summary>
    public string ContextText { get; init; } = string.Empty;
}

public interface ITutorKnowledgeRetriever
{
    Task<TutorKnowledgeContext> RetrieveAsync(string? userQuery, string? learnerJlptLevel, CancellationToken cancellationToken = default);
}

/// <summary>
/// Tra cứu nhanh ngữ pháp / từ vựng / kanji liên quan tới câu hỏi của học viên để nạp ngữ cảnh (RAG)
/// cho Ollama, tránh bịa đặt. Tối ưu: trích xuất từ khóa, mỗi loại 1 truy vấn gộp OR, giới hạn số dòng.
/// </summary>
public sealed class TutorKnowledgeRetriever : ITutorKnowledgeRetriever
{
    private const int PublishedStatus = (int)Status.Published;
    private const int MaxTerms = 6;
    private const int MaxGrammar = 4;
    private const int MaxVocab = 6;
    private const int MaxKanji = 5;
    private const int MaxContextChars = 3600;

    // Từ chức năng tiếng Việt + từ "meta" hỏi đáp — bỏ để không nhiễu khi tìm theo nghĩa.
    private static readonly HashSet<string> Stopwords = new(StringComparer.OrdinalIgnoreCase)
    {
        "là", "của", "và", "có", "không", "trong", "cho", "khi", "gì", "này", "kia", "đó",
        "như", "thế", "nào", "sao", "tại", "vì", "được", "bạn", "tôi", "mình", "em", "ạ",
        "ơi", "cái", "một", "các", "những", "ý", "hỏi", "giải", "thích", "ví", "dụ", "về",
        "cách", "dùng", "nghĩa", "ngữ", "pháp", "từ", "vựng", "câu", "tiếng", "nhật", "kanji",
        "hán", "tự", "cấu", "trúc", "với", "hay", "thì", "phải", "muốn", "biết", "giúp",
        "the", "is", "of", "and", "to", "a", "an", "what", "how", "mean", "means", "meaning",
    };

    private static readonly Regex CjkRunRegex = new(
        @"[\p{IsHiragana}\p{IsKatakana}\p{IsCJKUnifiedIdeographs}ー々〆]+",
        RegexOptions.Compiled);

    private static readonly Regex LatinWordRegex = new(@"[\p{L}]{2,}", RegexOptions.Compiled);

    // Dấu hiệu cho thấy học viên đang hỏi kiến thức (để biết khi nào nên xin lỗi nếu DB rỗng).
    private static readonly Regex KnowledgeIntentRegex = new(
        @"ngữ\s*pháp|từ\s*vựng|kanji|hán\s*tự|bộ\s*thủ|trợ\s*từ|động\s*từ|tính\s*từ|cấu\s*trúc|cách\s*dùng|cách\s*đọc|âm\s*on|âm\s*kun|onyomi|kunyomi|ý\s*nghĩa|nghĩa\s*(của|là)|phân\s*biệt|khác\s*nhau",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    private readonly ApplicationDbContext _db;

    public TutorKnowledgeRetriever(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<TutorKnowledgeContext> RetrieveAsync(string? userQuery, string? learnerJlptLevel, CancellationToken cancellationToken = default)
    {
        var query = userQuery?.Trim() ?? string.Empty;
        if (query.Length == 0)
            return new TutorKnowledgeContext { IsKnowledgeQuery = false, HasResults = false };

        var hasCjk = CjkRunRegex.IsMatch(query);
        var isKnowledgeQuery = hasCjk || KnowledgeIntentRegex.IsMatch(query);

        // Câu chỉ trò chuyện (chào hỏi, cảm ơn, hỏi linh tinh không liên quan bài học)
        // → BỎ QUA hoàn toàn việc đọc DB để trả lời nhanh nhất có thể.
        if (!isKnowledgeQuery)
            return new TutorKnowledgeContext { IsKnowledgeQuery = false, HasResults = false };

        var terms = BuildSearchTerms(query);
        if (terms.Count == 0)
            return new TutorKnowledgeContext { IsKnowledgeQuery = true, HasResults = false };

        var grammarPred = BuildGrammarPredicate(terms);
        var vocabPred = BuildVocabPredicate(terms);
        var kanjiPred = BuildKanjiPredicate(terms);

        // EF Core DbContext không thread-safe — phải await tuần tự, không dùng Task.WhenAll trên cùng _db.
        var grammars = await _db.Grammars.AsNoTracking()
            .Where(g => g.Status == PublishedStatus)
            .Where(grammarPred)
            .OrderBy(g => g.Title)
            .Take(MaxGrammar)
            .Select(g => new GrammarHit
            {
                Title = g.Title,
                Structure = g.Structure,
                Meaning = g.Meaning,
                Explanation = g.Explanation,
                UsageNote = g.UsageNote,
                Level = g.JLPTLevel != null ? g.JLPTLevel.LevelName : null,
                Examples = g.Examples.Take(2).Select(e => new ExampleHit { Content = e.Content, Translation = e.Translation }).ToList(),
            })
            .ToListAsync(cancellationToken);

        var vocabs = await _db.Vocabularies.AsNoTracking()
            .Where(v => v.Status == PublishedStatus)
            .Where(vocabPred)
            .OrderBy(v => v.Word)
            .Take(MaxVocab)
            .Select(v => new VocabHit
            {
                Word = v.Word,
                Reading = v.Reading,
                Meaning = v.Meaning,
                Level = v.JLPTLevel != null ? v.JLPTLevel.LevelName : null,
                Example = v.Examples.Select(e => new ExampleHit { Content = e.Content, Translation = e.Translation }).FirstOrDefault(),
            })
            .ToListAsync(cancellationToken);

        var kanjis = await _db.Kanjis.AsNoTracking()
            .Where(k => k.Status == PublishedStatus)
            .Where(kanjiPred)
            .OrderBy(k => k.Character)
            .Take(MaxKanji)
            .Select(k => new KanjiHit
            {
                Character = k.Character,
                Onyomi = k.Onyomi,
                Kunyomi = k.Kunyomi,
                Meaning = k.Meaning,
                StrokeCount = k.StrokeCount,
                Level = k.JLPTLevel != null ? k.JLPTLevel.LevelName : null,
            })
            .ToListAsync(cancellationToken);

        var hasResults = grammars.Count > 0 || vocabs.Count > 0 || kanjis.Count > 0;
        if (!hasResults)
            return new TutorKnowledgeContext { IsKnowledgeQuery = isKnowledgeQuery, HasResults = false };

        var contextText = BuildContextText(grammars, vocabs, kanjis);
        return new TutorKnowledgeContext
        {
            IsKnowledgeQuery = true,
            HasResults = true,
            ContextText = contextText,
        };
    }

    private static List<string> BuildSearchTerms(string query)
    {
        var terms = new List<string>();

        foreach (Match m in CjkRunRegex.Matches(query))
        {
            var t = m.Value.Trim();
            if (t.Length >= 1 && !terms.Contains(t))
                terms.Add(t);
        }

        foreach (Match m in LatinWordRegex.Matches(query.ToLowerInvariant()))
        {
            var t = m.Value;
            if (Stopwords.Contains(t) || terms.Contains(t))
                continue;
            terms.Add(t);
        }

        return terms.Take(MaxTerms).ToList();
    }

    private static Expression<Func<Grammars, bool>> BuildGrammarPredicate(IReadOnlyList<string> terms)
    {
        Expression<Func<Grammars, bool>> pred = _ => false;
        foreach (var term in terms)
        {
            var pattern = "%" + term + "%";
            Expression<Func<Grammars, bool>> one = g =>
                EF.Functions.ILike(g.Title, pattern) ||
                EF.Functions.ILike(g.Structure, pattern) ||
                EF.Functions.ILike(g.Meaning, pattern) ||
                EF.Functions.ILike(g.Explanation, pattern);
            pred = PredicateBuilder.Or(pred, one);
        }
        return pred;
    }

    private static Expression<Func<Vocabularies, bool>> BuildVocabPredicate(IReadOnlyList<string> terms)
    {
        Expression<Func<Vocabularies, bool>> pred = _ => false;
        foreach (var term in terms)
        {
            var pattern = "%" + term + "%";
            Expression<Func<Vocabularies, bool>> one = v =>
                EF.Functions.ILike(v.Word, pattern) ||
                EF.Functions.ILike(v.Reading, pattern) ||
                EF.Functions.ILike(v.Meaning, pattern);
            pred = PredicateBuilder.Or(pred, one);
        }
        return pred;
    }

    private static Expression<Func<Kanjis, bool>> BuildKanjiPredicate(IReadOnlyList<string> terms)
    {
        Expression<Func<Kanjis, bool>> pred = _ => false;
        foreach (var term in terms)
        {
            var pattern = "%" + term + "%";
            Expression<Func<Kanjis, bool>> one = k =>
                EF.Functions.ILike(k.Character, pattern) ||
                EF.Functions.ILike(k.Onyomi, pattern) ||
                EF.Functions.ILike(k.Kunyomi, pattern) ||
                EF.Functions.ILike(k.Meaning, pattern);
            pred = PredicateBuilder.Or(pred, one);
        }
        return pred;
    }

    private static string BuildContextText(IReadOnlyList<GrammarHit> grammars, IReadOnlyList<VocabHit> vocabs, IReadOnlyList<KanjiHit> kanjis)
    {
        var sb = new StringBuilder();

        if (grammars.Count > 0)
        {
            sb.AppendLine("# NGỮ PHÁP");
            foreach (var g in grammars)
            {
                sb.Append("- Mẫu câu: ").Append(g.Title);
                if (!string.IsNullOrWhiteSpace(g.Level)) sb.Append(" [").Append(g.Level).Append(']');
                sb.AppendLine();
                if (!string.IsNullOrWhiteSpace(g.Structure)) sb.Append("  Cấu trúc: ").AppendLine(g.Structure.Trim());
                if (!string.IsNullOrWhiteSpace(g.Meaning)) sb.Append("  Nghĩa: ").AppendLine(g.Meaning.Trim());
                if (!string.IsNullOrWhiteSpace(g.Explanation)) sb.Append("  Giải thích: ").AppendLine(Shorten(g.Explanation, 320));
                if (!string.IsNullOrWhiteSpace(g.UsageNote)) sb.Append("  Lưu ý: ").AppendLine(Shorten(g.UsageNote!, 200));
                foreach (var e in g.Examples)
                {
                    if (string.IsNullOrWhiteSpace(e.Content)) continue;
                    sb.Append("  Ví dụ: ").Append(e.Content.Trim());
                    if (!string.IsNullOrWhiteSpace(e.Translation)) sb.Append(" → ").Append(e.Translation.Trim());
                    sb.AppendLine();
                }
            }
        }

        if (vocabs.Count > 0)
        {
            sb.AppendLine("# TỪ VỰNG");
            foreach (var v in vocabs)
            {
                sb.Append("- ").Append(v.Word);
                if (!string.IsNullOrWhiteSpace(v.Reading)) sb.Append(" (").Append(v.Reading.Trim()).Append(')');
                if (!string.IsNullOrWhiteSpace(v.Meaning)) sb.Append(": ").Append(v.Meaning.Trim());
                if (!string.IsNullOrWhiteSpace(v.Level)) sb.Append(" [").Append(v.Level).Append(']');
                sb.AppendLine();
                if (v.Example != null && !string.IsNullOrWhiteSpace(v.Example.Content))
                {
                    sb.Append("  Ví dụ: ").Append(v.Example.Content.Trim());
                    if (!string.IsNullOrWhiteSpace(v.Example.Translation)) sb.Append(" → ").Append(v.Example.Translation.Trim());
                    sb.AppendLine();
                }
            }
        }

        if (kanjis.Count > 0)
        {
            sb.AppendLine("# KANJI");
            foreach (var k in kanjis)
            {
                sb.Append("- ").Append(k.Character);
                if (!string.IsNullOrWhiteSpace(k.Meaning)) sb.Append(": ").Append(k.Meaning.Trim());
                if (!string.IsNullOrWhiteSpace(k.Onyomi)) sb.Append(" | On: ").Append(k.Onyomi.Trim());
                if (!string.IsNullOrWhiteSpace(k.Kunyomi)) sb.Append(" | Kun: ").Append(k.Kunyomi.Trim());
                sb.Append(" | Số nét: ").Append(k.StrokeCount);
                if (!string.IsNullOrWhiteSpace(k.Level)) sb.Append(" [").Append(k.Level).Append(']');
                sb.AppendLine();
            }
        }

        var text = sb.ToString().Trim();
        return text.Length > MaxContextChars ? text[..MaxContextChars] : text;
    }

    private static string Shorten(string s, int max)
    {
        s = s.Trim();
        return s.Length <= max ? s : s[..max] + "…";
    }

    private sealed class ExampleHit
    {
        public string Content { get; init; } = string.Empty;
        public string Translation { get; init; } = string.Empty;
    }

    private sealed class GrammarHit
    {
        public string Title { get; init; } = string.Empty;
        public string Structure { get; init; } = string.Empty;
        public string Meaning { get; init; } = string.Empty;
        public string Explanation { get; init; } = string.Empty;
        public string? UsageNote { get; init; }
        public string? Level { get; init; }
        public List<ExampleHit> Examples { get; init; } = new();
    }

    private sealed class VocabHit
    {
        public string Word { get; init; } = string.Empty;
        public string Reading { get; init; } = string.Empty;
        public string Meaning { get; init; } = string.Empty;
        public string? Level { get; init; }
        public ExampleHit? Example { get; init; }
    }

    private sealed class KanjiHit
    {
        public string Character { get; init; } = string.Empty;
        public string Onyomi { get; init; } = string.Empty;
        public string Kunyomi { get; init; } = string.Empty;
        public string Meaning { get; init; } = string.Empty;
        public int StrokeCount { get; init; }
        public string? Level { get; init; }
    }

    /// <summary>Gộp OR các biểu thức cùng tham số mà không dùng Invoke (EF Core dịch được).</summary>
    private static class PredicateBuilder
    {
        public static Expression<Func<T, bool>> Or<T>(Expression<Func<T, bool>> a, Expression<Func<T, bool>> b)
        {
            var param = Expression.Parameter(typeof(T), "x");
            var left = new ReplaceParameterVisitor(a.Parameters[0], param).Visit(a.Body)!;
            var right = new ReplaceParameterVisitor(b.Parameters[0], param).Visit(b.Body)!;
            return Expression.Lambda<Func<T, bool>>(Expression.OrElse(left, right), param);
        }

        private sealed class ReplaceParameterVisitor : ExpressionVisitor
        {
            private readonly ParameterExpression _from;
            private readonly ParameterExpression _to;

            public ReplaceParameterVisitor(ParameterExpression from, ParameterExpression to)
            {
                _from = from;
                _to = to;
            }

            protected override Expression VisitParameter(ParameterExpression node)
                => node == _from ? _to : base.VisitParameter(node);
        }
    }
}
