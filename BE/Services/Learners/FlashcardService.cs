using Microsoft.EntityFrameworkCore;
using QuizzTiengNhat.Controllers.Learners;
using QuizzTiengNhat.DTOs.Learner;
using QuizzTiengNhat.Models;
using QuizzTiengNhat.Models.Enums;
using System.Text.Json;

namespace QuizzTiengNhat.Services.Learners
{
    public class FlashcardService : IFlashcardService
    {
        private readonly ApplicationDbContext _context;

        private static readonly TimeSpan StudySessionTtl = TimeSpan.FromHours(36);

        public FlashcardService(ApplicationDbContext context)
        {
            _context = context;
        }

        private static void ShuffleList<T>(IList<T> list)
        {
            for (var i = list.Count - 1; i > 0; i--)
            {
                var j = Random.Shared.Next(i + 1);
                (list[i], list[j]) = (list[j], list[i]);
            }
        }

        private static int AdjustQualityByTime(int quality, int timeTakenSeconds)
        {
            if (quality >= 3)
            {
                if (timeTakenSeconds > 75) quality = Math.Max(3, quality - 2);
                else if (timeTakenSeconds > 40) quality = Math.Max(3, quality - 1);
            }
            return Math.Clamp(quality, 0, 5);
        }

        /// <summary>Bước SM-2 (Anki-style): quality 0–5.</summary>
        private static void ApplySm2Step(FlashcardItem item, int quality)
        {
            if (quality >= 3)
            {
                if (item.Repetitions == 0) item.Interval = 1;
                else if (item.Repetitions == 1) item.Interval = 6;
                else item.Interval = Math.Max(1, (int)Math.Round(item.Interval * item.EF));

                item.Repetitions++;
                item.EF = item.EF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
            }
            else
            {
                item.Repetitions = 0;
                item.Interval = 0;
                item.EF = Math.Max(1.3, item.EF - 0.2);
            }

            if (item.EF < 1.3) item.EF = 1.3;

            item.NextReview = item.Interval < 1 ? DateTime.UtcNow : DateTime.UtcNow.AddDays(item.Interval);
            item.LastReviewed = DateTime.UtcNow;
        }

        private void AdvanceStudySession(FlashcardDeck deck, Guid itemId)
        {
            if (string.IsNullOrEmpty(deck.ActiveStudyQueueJson) || deck.ActiveStudyMode == null) return;

            var queue = JsonSerializer.Deserialize<List<Guid>>(deck.ActiveStudyQueueJson) ?? new List<Guid>();
            if (queue.Count == 0) return;

            if (deck.ActiveStudyCursor < queue.Count && queue[deck.ActiveStudyCursor] == itemId)
                deck.ActiveStudyCursor++;
            else
            {
                for (var i = deck.ActiveStudyCursor; i < queue.Count; i++)
                {
                    if (queue[i] != itemId) continue;
                    deck.ActiveStudyCursor = i + 1;
                    break;
                }
            }

            deck.ActiveStudyUpdatedAt = DateTime.UtcNow;

            if (deck.ActiveStudyCursor >= queue.Count)
            {
                deck.ActiveStudyQueueJson = null;
                deck.ActiveStudyMode = null;
                deck.ActiveStudyCursor = 0;
            }
        }

        private void ClearDeckStudySession(FlashcardDeck deck)
        {
            deck.ActiveStudyQueueJson = null;
            deck.ActiveStudyMode = null;
            deck.ActiveStudyCursor = 0;
            deck.ActiveStudyUpdatedAt = null;
        }

        private async Task<List<Guid>> SyncSessionQueueAsync(FlashcardDeck deck, string mode, List<Guid> targetOrderedIds)
        {
            var now = DateTime.UtcNow;
            var expired = !string.Equals(deck.ActiveStudyMode, mode, StringComparison.OrdinalIgnoreCase)
                || string.IsNullOrEmpty(deck.ActiveStudyQueueJson)
                || !deck.ActiveStudyUpdatedAt.HasValue
                || now - deck.ActiveStudyUpdatedAt.Value > StudySessionTtl;

            List<Guid> ordered;
            if (!expired && deck.ActiveStudyQueueJson != null)
            {
                var saved = JsonSerializer.Deserialize<List<Guid>>(deck.ActiveStudyQueueJson) ?? new List<Guid>();
                var set = targetOrderedIds.ToHashSet();
                ordered = saved.Where(id => set.Contains(id)).ToList();
                foreach (var id in targetOrderedIds)
                {
                    if (!ordered.Contains(id)) ordered.Add(id);
                }

                if (deck.ActiveStudyCursor > ordered.Count) deck.ActiveStudyCursor = 0;
                deck.ActiveStudyUpdatedAt = now;
                deck.ActiveStudyQueueJson = JsonSerializer.Serialize(ordered);
            }
            else
            {
                ordered = targetOrderedIds.ToList();
                ShuffleList(ordered);
                deck.ActiveStudyMode = mode;
                deck.ActiveStudyQueueJson = JsonSerializer.Serialize(ordered);
                deck.ActiveStudyCursor = 0;
                deck.ActiveStudyUpdatedAt = now;
            }

            await _context.SaveChangesAsync();
            return ordered;
        }

        private async Task<List<FlashcardReviewDTO>> MapToReviewDtosAsync(List<FlashcardItem> flashcards)
        {
            if (!flashcards.Any()) return new List<FlashcardReviewDTO>();

            var vocabIds = flashcards.Where(f => f.ItemType == SkillType.Vocabulary).Select(f => f.EntityID).ToList();
            var kanjiIds = flashcards.Where(f => f.ItemType == SkillType.Kanji).Select(f => f.EntityID).ToList();
            var grammarIds = flashcards.Where(f => f.ItemType == SkillType.Grammar).Select(f => f.EntityID).ToList();

            var vocabs = await _context.Vocabularies
                .Include(v => v.Examples)
                .Where(v => vocabIds.Contains(v.VocabID))
                .ToDictionaryAsync(v => v.VocabID);
            var kanjis = await _context.Kanjis
                .Include(k => k.RelatedVocabularies)
                    .ThenInclude(rv => rv.Vocabulary)
                .Where(k => kanjiIds.Contains(k.KanjiID))
                .ToDictionaryAsync(k => k.KanjiID);
            var grammars = await _context.Grammars
                .Include(g => g.Examples)
                .Where(g => grammarIds.Contains(g.GrammarID))
                .ToDictionaryAsync(g => g.GrammarID);

            return flashcards.Select(f =>
            {
                FlashcardContentDTO content = null;

                if (f.ItemType == SkillType.Vocabulary && vocabs.TryGetValue(f.EntityID, out var v))
                    content = new FlashcardContentDTO
                    {
                        Kanji = v.Word,
                        Furigana = v.Reading,
                        Meaning = v.Meaning,
                        Examples = v.Examples.Select(e => new FlashcardExampleDTO { Content = e.Content, Translation = e.Translation }).ToList()
                    };

                else if (f.ItemType == SkillType.Kanji && kanjis.TryGetValue(f.EntityID, out var k))
                    content = new FlashcardContentDTO
                    {
                        Kanji = k.Character,
                        Furigana = k.Onyomi,
                        Meaning = k.Meaning,
                        Kunyomi = k.Kunyomi,
                        Onyomi = k.Onyomi,
                        Examples = k.RelatedVocabularies.Select(rv => new FlashcardExampleDTO { Content = rv.Vocabulary.Word, Translation = rv.Vocabulary.Meaning }).Take(3).ToList()
                    };

                else if (f.ItemType == SkillType.Grammar && grammars.TryGetValue(f.EntityID, out var g))
                    content = new FlashcardContentDTO
                    {
                        Kanji = g.Title,
                        Furigana = g.Structure,
                        Meaning = g.Meaning,
                        Explanation = g.Explanation,
                        Examples = g.Examples.Select(e => new FlashcardExampleDTO { Content = e.Content, Translation = e.Translation }).ToList()
                    };

                return new FlashcardReviewDTO
                {
                    ItemID = f.ItemID,
                    ItemType = f.ItemType,
                    NextReview = f.NextReview,
                    Entity = content
                };
            }).Where(x => x.Entity != null).ToList();
        }

        // Hàm lấy các thẻ cần học trong ngày hôm nay (AI-Ready)
        public async Task<List<FlashcardReviewDTO>> GetDailyReviews(string userId, SkillType? skillType)
        {
            var now = DateTime.UtcNow.AddMinutes(1);

            var flashcards = await _context.FlashcardItems
                .Where(f => f.Deck.UserID == userId && f.NextReview <= now)
                .Where(f => !skillType.HasValue || f.ItemType == skillType)
                .OrderBy(f => f.NextReview)
                .Take(30)
                .ToListAsync();

            if (!flashcards.Any()) return new List<FlashcardReviewDTO>();

            return await MapToReviewDtosAsync(flashcards);
        }

        private async Task<bool> EntityExistsAtLevelAsync(Guid entityId, SkillType skillType, Guid levelId) =>
            skillType switch
            {
                SkillType.Vocabulary => await _context.Vocabularies.AnyAsync(v => v.VocabID == entityId && v.LevelID == levelId),
                SkillType.Kanji => await _context.Kanjis.AnyAsync(k => k.KanjiID == entityId && k.LevelID == levelId),
                SkillType.Grammar => await _context.Grammars.AnyAsync(g => g.GrammarID == entityId && g.LevelID == levelId),
                _ => false
            };

        public async Task<FlashcardDeck?> CreateDeckAsync(string userId, string name, string? description, SkillType skillType, IReadOnlyList<Guid>? entityIds)
        {
            if (skillType != SkillType.Vocabulary && skillType != SkillType.Kanji && skillType != SkillType.Grammar)
                return null;

            var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
            if (user?.LevelID == null)
                return null;

            var levelId = user.LevelID.Value;
            var requested = entityIds?.Where(g => g != Guid.Empty).Distinct().ToList() ?? new List<Guid>();
            if (requested.Count == 0)
                return null;

            var validIds = new List<Guid>();
            foreach (var entityId in requested)
            {
                if (await EntityExistsAtLevelAsync(entityId, skillType, levelId))
                    validIds.Add(entityId);
            }

            validIds = validIds.Distinct().ToList();
            if (validIds.Count == 0)
                return null;

            var deck = new FlashcardDeck
            {
                DeckID = Guid.NewGuid(),
                UserID = userId,
                Name = name.Trim(),
                Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim(),
                SkillType = skillType,
                LevelID = levelId,
                IsUserCustomDeck = true,
                CreatedAt = DateTime.UtcNow
            };
            _context.FlashcardDecks.Add(deck);

            foreach (var entityId in validIds)
            {
                _context.FlashcardItems.Add(new FlashcardItem
                {
                    ItemID = Guid.NewGuid(),
                    DeckID = deck.DeckID,
                    EntityID = entityId,
                    ItemType = skillType,
                    EF = 2.5,
                    Interval = 0,
                    Repetitions = 0,
                    NextReview = DateTime.UtcNow,
                    IsMastered = false
                });
            }

            await _context.SaveChangesAsync();
            return deck;
        }

        public async Task<IEnumerable<FlashcardItemDTO>> GetItemsInDeckAsync(Guid deckId, string userId)
        {
            var deckOk = await _context.FlashcardDecks.AnyAsync(d => d.DeckID == deckId && d.UserID == userId);
            if (!deckOk)
                return Enumerable.Empty<FlashcardItemDTO>();

            var items = await _context.FlashcardItems
                .Where(i => i.DeckID == deckId)
                .ToListAsync();

            var vocabIds = items.Where(f => f.ItemType == SkillType.Vocabulary).Select(f => f.EntityID).ToList();
            var kanjiIds = items.Where(f => f.ItemType == SkillType.Kanji).Select(f => f.EntityID).ToList();
            var grammarIds = items.Where(f => f.ItemType == SkillType.Grammar).Select(f => f.EntityID).ToList();

            var vocabs = await _context.Vocabularies.Where(v => vocabIds.Contains(v.VocabID)).ToDictionaryAsync(v => v.VocabID);
            var kanjis = await _context.Kanjis.Where(k => kanjiIds.Contains(k.KanjiID)).ToDictionaryAsync(k => k.KanjiID);
            var grammars = await _context.Grammars.Where(g => grammarIds.Contains(g.GrammarID)).ToDictionaryAsync(g => g.GrammarID);

            return items.Select(i => {
                string kanji = "", meaning = "";
                if (i.ItemType == SkillType.Vocabulary && vocabs.TryGetValue(i.EntityID, out var v)) { kanji = v.Word; meaning = v.Meaning; }
                else if (i.ItemType == SkillType.Kanji && kanjis.TryGetValue(i.EntityID, out var k)) { kanji = k.Character; meaning = k.Meaning; }
                else if (i.ItemType == SkillType.Grammar && grammars.TryGetValue(i.EntityID, out var g)) { kanji = g.Title; meaning = g.Meaning; }

                return new FlashcardItemDTO
                {
                    ItemID = i.ItemID,
                    EntityID = i.EntityID,
                    ItemType = i.ItemType,
                    NextReview = i.NextReview,
                    EF = i.EF,
                    Interval = i.Interval,
                    IsMastered = i.IsMastered,
                    Kanji = kanji,
                    Meaning = meaning
                };
            });
        }

        public async Task<List<FlashcardItem>> GetWeakFlashcards(string userId, SkillType? skillType)
        {
            return await _context.FlashcardItems
                .Where(f => f.Deck.UserID == userId)
                .Where(f => skillType == null || f.ItemType == skillType)
                // Lọc những thẻ có Ease Factor thấp (càng thấp càng khó nhớ) 
                // Hoặc những thẻ bị sai nhiều (Repetitions thấp dù đã học lâu)
                .Where(f => f.EF < 2.0 || (f.Repetitions == 0 && f.Interval > 0))
                .OrderBy(f => f.EF)
                .Take(20)
                .ToListAsync();
        }

        public async Task<FlashcardItem?> UpdateReviewProgress(Guid itemId, string userId, int quality, int timeTakenSeconds)
        {
            var item = await _context.FlashcardItems
                .Include(i => i.Deck)
                .FirstOrDefaultAsync(i => i.ItemID == itemId);

            if (item == null || item.Deck.UserID != userId) return null;

            var q = AdjustQualityByTime(quality, Math.Max(0, timeTakenSeconds));
            ApplySm2Step(item, q);

            item.LastReviewQuality = q;
            item.LastTimeTakenSeconds = Math.Max(0, timeTakenSeconds);

            if (q >= 4) item.IsMastered = true;
            else if (q <= 2) item.IsMastered = false;

            AdvanceStudySession(item.Deck, itemId);

            await _context.SaveChangesAsync();
            return item;
        }

        public async Task ApplyPracticeOutcomeAsync(string userId, Guid entityId, SkillType skillType, bool isCorrect, int timeTakenSeconds, bool persist = true)
        {
            if (skillType != SkillType.Vocabulary && skillType != SkillType.Kanji && skillType != SkillType.Grammar)
                return;

            var items = await _context.FlashcardItems
                .Include(f => f.Deck)
                .Where(f => f.EntityID == entityId && f.ItemType == skillType && f.Deck.UserID == userId)
                .ToListAsync();

            if (!items.Any()) return;

            var t = Math.Max(0, timeTakenSeconds);
            var clearedDecks = new HashSet<Guid>();
            foreach (var item in items)
            {
                if (!isCorrect)
                {
                    item.IsMastered = false;
                    item.Repetitions = 0;
                    item.Interval = 0;
                    item.EF = Math.Max(1.3, item.EF - 0.25);
                    item.NextReview = DateTime.UtcNow;
                    item.LastReviewed = DateTime.UtcNow;
                    item.LastReviewQuality = 1;
                    item.LastTimeTakenSeconds = t;
                }
                else
                {
                    int q = t <= 10 ? 5 : t <= 24 ? 4 : 3;
                    q = AdjustQualityByTime(q, t);
                    ApplySm2Step(item, q);
                    item.LastReviewQuality = q;
                    item.LastTimeTakenSeconds = t;
                    if (q >= 4) item.IsMastered = true;
                }

                if (clearedDecks.Add(item.DeckID))
                    ClearDeckStudySession(item.Deck);
            }

            if (persist) await _context.SaveChangesAsync();
        }

        public async Task<bool> AddToDeckAsync(string userId, AddFlashcardDto model, bool persist = true)
        {
            var deck = await _context.FlashcardDecks
                .FirstOrDefaultAsync(d => d.UserID == userId);

            if (deck == null)
            {
                deck = new FlashcardDeck
                {
                    DeckID = Guid.NewGuid(),
                    UserID = userId,
                    Name = "Bộ thẻ mặc định",
                    Description = "Kho lưu trữ từ vựng và Kanji cá nhân",
                    CreatedAt = DateTime.UtcNow
                };
                _context.FlashcardDecks.Add(deck);
                if (persist) await _context.SaveChangesAsync();
            }

            var exists = await _context.FlashcardItems
                .AnyAsync(f => f.DeckID == deck.DeckID
                            && f.EntityID == model.EntityId
                            && f.ItemType == model.ItemType);

            if (exists) return true;

            var newItem = new FlashcardItem
            {
                ItemID = Guid.NewGuid(),
                DeckID = deck.DeckID,
                EntityID = model.EntityId,
                ItemType = model.ItemType,
                EF = 2.5,
                Interval = 0,
                Repetitions = 0,
                NextReview = DateTime.UtcNow,
                IsMastered = false
            };

            _context.FlashcardItems.Add(newItem);
            if (persist) return await _context.SaveChangesAsync() > 0;
            return true;
        }

        public async Task<object> GetFlashcardDetailsAsync(Guid itemId)
        {
            var item = await _context.FlashcardItems.FindAsync(itemId);
            if (item == null) return null;

            object info = null;
            string type = string.Empty;

            switch (item.ItemType)
            {
                case SkillType.Kanji:
                    info = await _context.Kanjis
                        .Include(k => k.Radical)
                        .Include(k => k.JLPTLevel)
                        .FirstOrDefaultAsync(k => k.KanjiID == item.EntityID);
                    type = "Kanji";
                    break;

                case SkillType.Vocabulary:
                    info = await _context.Vocabularies
                        .Include(v => v.Examples)
                        .Include(v => v.JLPTLevel)
                        .FirstOrDefaultAsync(v => v.VocabID == item.EntityID);
                    type = "Vocabulary";
                    break;

                case SkillType.Grammar:
                    info = await _context.Grammars
                        .Include(g => g.Examples)
                        .Include(g => g.GrammarGroup)
                        .FirstOrDefaultAsync(g => g.GrammarID == item.EntityID);
                    type = "Grammar";
                    break;
            }

            if (info == null) return null;

            return new
            {
                info = info,
                cardStats = item,
                type = type
            };
        }

        public async Task<IEnumerable<UserDeckDTO>> GetUserDecksAsync(string userId)
        {
            var now = DateTime.UtcNow;
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            var targetLevelId = user?.LevelID;

            if (user?.LevelID != null)
            {
                var customsToUpdate = await _context.FlashcardDecks
                    .Where(d => d.UserID == userId && d.IsUserCustomDeck && d.LevelID != user.LevelID)
                    .ToListAsync();
                foreach (var d in customsToUpdate)
                    d.LevelID = user.LevelID;
                if (customsToUpdate.Count > 0)
                    await _context.SaveChangesAsync();
            }

            if (targetLevelId.HasValue)
                await SyncDefaultDecksAsync(userId, targetLevelId.Value);

            var decks = await _context.FlashcardDecks
                .Include(d => d.Items)
                .Include(d => d.Level)
                .Where(d => d.UserID == userId && d.LevelID == targetLevelId)
                .OrderBy(d => d.Name)
                .ToListAsync();

            return decks.Select(d =>
            {
                var total = d.Items.Count;
                var mastered = d.Items.Count(i => i.IsMastered);
                var due = d.Items.Count(i => i.NextReview <= now);
                DateTime? nextFuture = d.Items.Any(i => i.NextReview > now)
                    ? d.Items.Where(i => i.NextReview > now).Min(i => i.NextReview)
                    : null;

                string suggested;
                if (total == 0) suggested = "empty";
                else if (mastered == 0) suggested = "learn";
                else if (mastered < total) suggested = "continue";
                else if (due > 0) suggested = "review";
                else suggested = "complete";

                return new UserDeckDTO
                {
                    DeckID = d.DeckID,
                    SkillType = d.SkillType,
                    SkillName = d.Name,
                    TopicName = d.Name,
                    LevelName = d.Level?.LevelName,
                    TotalCards = total,
                    MasteredCount = mastered,
                    ProgressPercent = total == 0 ? 0 : Math.Round(100.0 * mastered / total, 2),
                    DueCount = due,
                    NewCards = d.Items.Count(i => i.Repetitions == 0),
                    SuggestedAction = suggested,
                    EarliestNextReviewUtc = nextFuture
                };
            }).ToList();
        }

        private bool TrackedFlashcardExistsOnDeck(Guid deckId, Guid entityId, SkillType skillType) =>
            _context.ChangeTracker.Entries<FlashcardItem>()
                .Where(e => e.State != EntityState.Deleted)
                .Select(e => e.Entity)
                .Any(i => i.DeckID == deckId && i.EntityID == entityId && i.ItemType == skillType);

        private sealed record DeckSyncPlan(string SyncKey, string DisplayName, SkillType SkillType, HashSet<Guid> EntityIds);

        private static string BuildDeckSyncKey(Guid levelId, SkillType skillType, Guid groupId, int pageIndex)
            => $"lvl:{levelId:N}:t:{(int)skillType}:g:{groupId:N}:p{pageIndex}";

        private async Task<List<DeckSyncPlan>> BuildVocabularyPlansAsync(Guid levelId)
        {
            const int pageSize = 20;
            var rows = await _context.Vocabularies
                .Where(v => v.LevelID == levelId)
                .Select(v => new
                {
                    v.VocabID,
                    Topic = v.VocabTopics.Select(vt => vt.Topic).FirstOrDefault()
                })
                .Where(x => x.Topic != null)
                .ToListAsync();

            var plans = new List<DeckSyncPlan>();
            foreach (var group in rows.GroupBy(x => x.Topic!.TopicID))
            {
                var ordered = group.OrderBy(x => x.VocabID).ToList();
                var nameBase = group.First().Topic!.TopicName;
                var parts = (int)Math.Ceiling(ordered.Count / (double)pageSize);
                for (var p = 0; p < parts; p++)
                {
                    var chunk = ordered.Skip(p * pageSize).Take(pageSize).Select(x => x.VocabID).ToHashSet();
                    var suffix = parts > 1 ? $" (P.{p + 1})" : "";
                    plans.Add(new DeckSyncPlan(
                        BuildDeckSyncKey(levelId, SkillType.Vocabulary, group.Key, p),
                        $"{nameBase}{suffix}",
                        SkillType.Vocabulary,
                        chunk));
                }
            }

            return plans;
        }

        private async Task<List<DeckSyncPlan>> BuildKanjiPlansAsync(Guid levelId)
        {
            const int pageSize = 20;
            var rows = await _context.Kanjis
                .Where(k => k.LevelID == levelId)
                .Select(k => new
                {
                    k.KanjiID,
                    Radical = k.Radical
                })
                .Where(x => x.Radical != null)
                .ToListAsync();

            var plans = new List<DeckSyncPlan>();
            foreach (var group in rows.GroupBy(x => x.Radical!.RadicalID))
            {
                var ordered = group.OrderBy(x => x.KanjiID).ToList();
                var ch = group.First().Radical!.Character;
                var parts = (int)Math.Ceiling(ordered.Count / (double)pageSize);
                for (var p = 0; p < parts; p++)
                {
                    var chunk = ordered.Skip(p * pageSize).Take(pageSize).Select(x => x.KanjiID).ToHashSet();
                    var suffix = parts > 1 ? $" (P.{p + 1})" : "";
                    plans.Add(new DeckSyncPlan(
                        BuildDeckSyncKey(levelId, SkillType.Kanji, group.Key, p),
                        $"Hán tự nhóm {ch}{suffix}",
                        SkillType.Kanji,
                        chunk));
                }
            }

            return plans;
        }

        private async Task<List<DeckSyncPlan>> BuildGrammarPlansAsync(Guid levelId)
        {
            const int pageSize = 20;
            var rows = await _context.Grammars
                .Where(g => g.LevelID == levelId)
                .Select(g => new
                {
                    g.GrammarID,
                    Group = g.GrammarGroup
                })
                .Where(x => x.Group != null)
                .ToListAsync();

            var plans = new List<DeckSyncPlan>();
            foreach (var group in rows.GroupBy(x => x.Group!.GrammarGroupID))
            {
                var ordered = group.OrderBy(x => x.GrammarID).ToList();
                var groupName = group.First().Group!.GroupName;
                var parts = (int)Math.Ceiling(ordered.Count / (double)pageSize);
                for (var p = 0; p < parts; p++)
                {
                    var chunk = ordered.Skip(p * pageSize).Take(pageSize).Select(x => x.GrammarID).ToHashSet();
                    var suffix = parts > 1 ? $" (P.{p + 1})" : "";
                    plans.Add(new DeckSyncPlan(
                        BuildDeckSyncKey(levelId, SkillType.Grammar, group.Key, p),
                        $"Ngữ pháp {groupName}{suffix}",
                        SkillType.Grammar,
                        chunk));
                }
            }

            return plans;
        }

        /// <summary>Đồng bộ deck theo level: thêm/bớt thẻ, chuyển thẻ khi đổi chủ đề, không tạo deck trùng (theo DeckSyncKey).</summary>
        private async Task SyncDefaultDecksAsync(string userId, Guid levelId)
        {
            var plans = new List<DeckSyncPlan>();
            plans.AddRange(await BuildVocabularyPlansAsync(levelId));
            plans.AddRange(await BuildKanjiPlansAsync(levelId));
            plans.AddRange(await BuildGrammarPlansAsync(levelId));

            var activeKeys = plans.Select(p => p.SyncKey).ToHashSet(StringComparer.Ordinal);
            var entityTargetKey = new Dictionary<(Guid EntityId, SkillType Type), string>();
            foreach (var plan in plans)
            {
                foreach (var eid in plan.EntityIds)
                    entityTargetKey[(eid, plan.SkillType)] = plan.SyncKey;
            }

            var decksForLevel = await _context.FlashcardDecks
                .Include(d => d.Items)
                .Where(d => d.UserID == userId && d.LevelID == levelId)
                .ToListAsync();

            var existingDecks = decksForLevel.Where(d => d.DeckSyncKey != null).ToList();
            var legacyDecks = decksForLevel.Where(d => d.DeckSyncKey == null).ToList();

            var deckByKey = existingDecks.ToDictionary(d => d.DeckSyncKey!, StringComparer.Ordinal);

            foreach (var plan in plans)
            {
                if (!deckByKey.TryGetValue(plan.SyncKey, out var deck))
                {
                    deck = new FlashcardDeck
                    {
                        DeckID = Guid.NewGuid(),
                        UserID = userId,
                        LevelID = levelId,
                        SkillType = plan.SkillType,
                        Name = plan.DisplayName,
                        DeckSyncKey = plan.SyncKey,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.FlashcardDecks.Add(deck);
                    deckByKey[plan.SyncKey] = deck;
                }
                else if (deck.Name != plan.DisplayName)
                    deck.Name = plan.DisplayName;
            }

            var userCustomDeckIds = decksForLevel.Where(d => d.IsUserCustomDeck).Select(d => d.DeckID).ToHashSet();

            var allItems = deckByKey.Values.SelectMany(d => d.Items)
                .Concat(legacyDecks.SelectMany(d => d.Items))
                .ToList();
            foreach (var item in allItems)
            {
                // Bộ thẻ do học viên tự tạo: không xóa / không chuyển sang deck đồng bộ theo chủ đề.
                if (userCustomDeckIds.Contains(item.DeckID))
                    continue;

                if (!entityTargetKey.TryGetValue((item.EntityID, item.ItemType), out var targetKey))
                {
                    var fromDeck = item.Deck;
                    _context.FlashcardItems.Remove(item);
                    if (fromDeck != null)
                        ClearDeckStudySession(fromDeck);
                    continue;
                }

                if (string.Equals(item.Deck.DeckSyncKey, targetKey, StringComparison.Ordinal))
                    continue;

                var targetDeck = deckByKey[targetKey];
                var dup = targetDeck.Items.FirstOrDefault(i => i.EntityID == item.EntityID && i.ItemType == item.ItemType);
                var sourceDeck = item.Deck;
                if (dup != null)
                    _context.FlashcardItems.Remove(item);
                else
                    item.DeckID = targetDeck.DeckID;

                ClearDeckStudySession(sourceDeck);
                ClearDeckStudySession(targetDeck);
            }

            foreach (var plan in plans)
            {
                var deck = deckByKey[plan.SyncKey];
                foreach (var eid in plan.EntityIds)
                {
                    if (TrackedFlashcardExistsOnDeck(deck.DeckID, eid, plan.SkillType))
                        continue;

                    _context.FlashcardItems.Add(new FlashcardItem
                    {
                        ItemID = Guid.NewGuid(),
                        DeckID = deck.DeckID,
                        EntityID = eid,
                        ItemType = plan.SkillType,
                        NextReview = DateTime.UtcNow,
                        Repetitions = 0,
                        Interval = 0,
                        EF = 2.5,
                        IsMastered = false
                    });
                    ClearDeckStudySession(deck);
                }
            }

            var staleDecks = await _context.FlashcardDecks
                .Include(d => d.Items)
                .Where(d => d.UserID == userId && d.LevelID == levelId && d.DeckSyncKey != null && !activeKeys.Contains(d.DeckSyncKey))
                .ToListAsync();

            foreach (var d in staleDecks)
            {
                if (d.Items.Any())
                    continue;
                _context.FlashcardDecks.Remove(d);
            }

            foreach (var leg in legacyDecks)
            {
                if (leg.IsUserCustomDeck)
                    continue;
                if (leg.Items.Any())
                    continue;
                _context.FlashcardDecks.Remove(leg);
            }

            await _context.SaveChangesAsync();
        }

        public async Task<List<FlashcardReviewDTO>> GetReviewsByDeckAsync(string userId, Guid deckId, string? mode = null)
        {
            var deck = await _context.FlashcardDecks
                .Include(d => d.Items)
                .FirstOrDefaultAsync(d => d.DeckID == deckId && d.UserID == userId);

            if (deck == null || deck.Items == null || !deck.Items.Any())
                return new List<FlashcardReviewDTO>();

            var nowBuf = DateTime.UtcNow.AddMinutes(1);
            var normalizedMode = string.IsNullOrWhiteSpace(mode) ? "due" : mode.Trim().ToLowerInvariant();

            List<FlashcardItem> pool = normalizedMode switch
            {
                "learn" => deck.Items.OrderByDescending(i => i.Repetitions == 0).ThenBy(i => i.NextReview).ToList(),
                "continue" => BuildContinuePool(deck.Items.ToList()),
                "review" => deck.Items.OrderBy(i => i.NextReview).ThenBy(i => i.EntityID).ToList(),
                _ => deck.Items.Where(f => f.NextReview <= nowBuf).OrderBy(f => f.NextReview).ToList()
            };

            if (!pool.Any())
                return new List<FlashcardReviewDTO>();

            var targetOrderedIds = pool.Select(p => p.ItemID).ToList();
            var fullQueue = await SyncSessionQueueAsync(deck, normalizedMode, targetOrderedIds);

            if (deck.ActiveStudyCursor >= fullQueue.Count)
                return new List<FlashcardReviewDTO>();

            var remainingIds = fullQueue.Skip(deck.ActiveStudyCursor).ToList();
            var itemById = pool.ToDictionary(i => i.ItemID);
            var ordered = remainingIds.Where(id => itemById.ContainsKey(id)).Select(id => itemById[id]).ToList();

            return await MapToReviewDtosAsync(ordered);
        }

        private static List<FlashcardItem> BuildContinuePool(List<FlashcardItem> items)
        {
            var weak = items
                .Where(i => !i.IsMastered || (i.LastReviewQuality.HasValue && i.LastReviewQuality < 3))
                .OrderBy(i => i.NextReview)
                .ToList();
            return weak.Any()
                ? weak
                : items.OrderByDescending(i => i.Repetitions == 0).ThenBy(i => i.NextReview).ToList();
        }

        public async Task<object> GetAvailableEntitiesAsync(string userId, Guid levelId, SkillType type, bool includeOwned = false)
        {
            // 1. Lấy danh sách EntityID mà User ĐÃ có trong flashcard (để loại trừ) — khi tạo bộ tùy chỉnh có thể gồm mục đã có ở deck khác
            var ownedEntityIds = includeOwned
                ? new List<Guid>()
                : await _context.FlashcardItems
                    .Where(f => f.Deck.UserID == userId && f.ItemType == type)
                    .Select(f => f.EntityID)
                    .ToListAsync();

            // 2. Tùy theo loại (Vocabulary/Kanji/Grammar) mà lấy dữ liệu tương ứng
            switch (type)
            {
                case SkillType.Vocabulary:
                    return await _context.Vocabularies
                        .Where(v => v.LevelID == levelId && !ownedEntityIds.Contains(v.VocabID))
                        .Select(v => new {
                            Id = v.VocabID,
                            Text = v.Word,
                            SubText = v.Reading,
                            Meaning = v.Meaning
                        })
                        .ToListAsync();

                case SkillType.Kanji:
                    return await _context.Kanjis
                        .Where(k => k.LevelID == levelId && !ownedEntityIds.Contains(k.KanjiID))
                        .Select(k => new {
                            Id = k.KanjiID,
                            Text = k.Character,
                            SubText = k.Onyomi,
                            Meaning = k.Meaning
                        })
                        .ToListAsync();

                case SkillType.Grammar:
                    return await _context.Grammars
                        .Where(g => g.LevelID == levelId && !ownedEntityIds.Contains(g.GrammarID))
                        .Select(g => new {
                            Id = g.GrammarID,
                            Text = g.Title,
                            SubText = g.Structure,
                            Meaning = g.Meaning
                        })
                        .ToListAsync();

                default:
                    return new List<object>();
            }
        }
    }
}

public class UserDeckDTO
{
    public Guid DeckID { get; set; }
    public SkillType SkillType { get; set; }
    public string SkillName { get; set; }
    public string? TopicName { get; set; }
    public string? LevelName { get; set; }
    public int TotalCards { get; set; }
    public int MasteredCount { get; set; }
    public double ProgressPercent { get; set; }
    public int DueCount { get; set; }
    public int NewCards { get; set; }

    /// <summary>learn | continue | review | complete | empty</summary>
    public string SuggestedAction { get; set; } = "learn";

    public DateTime? EarliestNextReviewUtc { get; set; }
}