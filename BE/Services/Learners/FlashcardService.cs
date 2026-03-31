using Microsoft.EntityFrameworkCore;
using QuizzTiengNhat.Controllers.Learners;
using QuizzTiengNhat.DTOs.Learner;
using QuizzTiengNhat.Models;
using QuizzTiengNhat.Models.Enums;

namespace QuizzTiengNhat.Services.Learners
{
    public class FlashcardService : IFlashcardService
    {
        private readonly ApplicationDbContext _context;

        public FlashcardService(ApplicationDbContext context)
        {
            _context = context;
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

            // Lấy danh sách ID theo từng loại
            var vocabIds = flashcards.Where(f => f.ItemType == SkillType.Vocabulary).Select(f => f.EntityID).ToList();
            var kanjiIds = flashcards.Where(f => f.ItemType == SkillType.Kanji).Select(f => f.EntityID).ToList();
            var grammarIds = flashcards.Where(f => f.ItemType == SkillType.Grammar).Select(f => f.EntityID).ToList();

            // Query 1 lần duy nhất cho mỗi bảng
            var vocabs = await _context.Vocabularies.Where(v => vocabIds.Contains(v.VocabID)).ToDictionaryAsync(v => v.VocabID);
            var kanjis = await _context.Kanjis.Where(k => kanjiIds.Contains(k.KanjiID)).ToDictionaryAsync(k => k.KanjiID);
            var grammars = await _context.Grammars.Where(g => grammarIds.Contains(g.GrammarID)).ToDictionaryAsync(g => g.GrammarID);

            return flashcards.Select(f => {
                FlashcardContentDTO content = null;

                if (f.ItemType == SkillType.Vocabulary && vocabs.TryGetValue(f.EntityID, out var v))
                    content = new FlashcardContentDTO { Kanji = v.Word, Furigana = v.Reading, Meaning = v.Meaning };

                else if (f.ItemType == SkillType.Kanji && kanjis.TryGetValue(f.EntityID, out var k))
                    content = new FlashcardContentDTO { Kanji = k.Character, Furigana = k.Onyomi, Meaning = k.Meaning };

                else if (f.ItemType == SkillType.Grammar && grammars.TryGetValue(f.EntityID, out var g))
                    content = new FlashcardContentDTO { Kanji = g.Title, Furigana = g.Structure, Meaning = g.Meaning };

                return new FlashcardReviewDTO
                {
                    ItemID = f.ItemID,
                    ItemType = f.ItemType,
                    NextReview = f.NextReview,
                    Entity = content
                };
            }).Where(x => x.Entity != null).ToList();
        }

        public async Task<FlashcardDeck> CreateDeckAsync(string userId, string name, string description)
        {
            var deck = new FlashcardDeck
            {
                DeckID = Guid.NewGuid(),
                UserID = userId,
                Name = name,
                Description = description,
                CreatedAt = DateTime.UtcNow
            };

            _context.FlashcardDecks.Add(deck);
            await _context.SaveChangesAsync();
            return deck;
        }

        // Trong FlashcardService.cs
        public async Task<IEnumerable<FlashcardItemDTO>> GetItemsInDeckAsync(Guid deckId)
        {
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

        public async Task<FlashcardItem> UpdateReviewProgress(Guid itemId, int quality)
        {
            var item = await _context.FlashcardItems.FindAsync(itemId);
            if (item == null) return null;

            // Thuật toán SM-2 rút gọn
            if (quality >= 3) // Trả lời Đúng (3: Khó, 4: Bình thường, 5: Dễ)
            {
                if (item.Repetitions == 0) item.Interval = 1;
                else if (item.Repetitions == 1) item.Interval = 6;
                else item.Interval = (int)Math.Round(item.Interval * item.EF);

                item.Repetitions++;
                // Điều chỉnh Ease Factor (Độ dễ)
                item.EF = item.EF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
            }
            else // Trả lời Sai (0, 1, 2)
            {
                item.Repetitions = 0;
                item.Interval = 1; // Học lại vào ngày mai
                item.EF = Math.Max(1.3, item.EF - 0.2); // Giảm độ dễ vì câu này khó
            }

            if (item.EF < 1.3) item.EF = 1.3;

            item.NextReview = DateTime.UtcNow.AddDays(item.Interval);
            item.LastReviewed = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return item;
        }

        public async Task<bool> AddToDeckAsync(string userId, AddFlashcardDto model)
        {
            // 1. Tìm hoặc tạo Deck mặc định cho User (ví dụ tên là "My Main Deck")
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
                await _context.SaveChangesAsync(); // Lưu để lấy DeckID
            }

            // 2. Kiểm tra xem Item này đã tồn tại trong Deck chưa (tránh trùng)
            var exists = await _context.FlashcardItems
                .AnyAsync(f => f.DeckID == deck.DeckID
                            && f.EntityID == model.EntityId
                            && f.ItemType == model.ItemType);

            if (exists) return true; // Đã có rồi thì không thêm nữa

            // 3. Tạo mới FlashcardItem với thông số SRS mặc định
            var newItem = new FlashcardItem
            {
                ItemID = Guid.NewGuid(),
                DeckID = deck.DeckID,
                EntityID = model.EntityId,
                ItemType = model.ItemType,
                // Thông số mặc định cho thẻ mới học
                EF = 2.5,
                Interval = 0,
                Repetitions = 0,
                NextReview = DateTime.UtcNow, // Học ngay lập tức
                IsMastered = false
            };

            _context.FlashcardItems.Add(newItem);
            return await _context.SaveChangesAsync() > 0;
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

            bool hasDecks = await _context.FlashcardDecks.AnyAsync(d => d.UserID == userId && d.LevelID == targetLevelId);

            if (!hasDecks)
            {
                await InitializeDefaultDecks(userId, targetLevelId);
            }

            var result = await _context.FlashcardDecks
                .Where(d => d.UserID == userId && d.LevelID == targetLevelId)
                .OrderBy(d => d.Name) // SỬA LỖI THỨ TỰ P.1, P.2 Ở ĐÂY
                .Select(d => new UserDeckDTO
                {
                    DeckID = d.DeckID,
                    SkillType = d.SkillType,
                    SkillName = d.Name,
                    TopicName = d.Name, // GÁN TÊN DECK VÀO ĐÂY ĐỂ UI HIỆN ĐÚNG CHỦ ĐỀ
                    LevelName = d.Level.LevelName,
                    TotalCards = d.Items.Count,
                    DueCount = d.Items.Count(i => i.NextReview <= now),
                    NewCards = d.Items.Count(i => i.Repetitions == 0)
                })
                .ToListAsync();

            return result;
        }

        private async Task InitializeDefaultDecks(string userId, Guid? levelId)
        {
            if (levelId == null) return;

            // --- PHẦN 1: KHỞI TẠO TỪ VỰNG (VOCABULARY) ---
            var allVocabs = await _context.Vocabularies
                .Where(v => v.LevelID == levelId)
                .Select(v => new
                {
                    v.VocabID,
                    Topic = v.VocabTopics.Select(vt => vt.Topic).FirstOrDefault()
                })
                .Where(x => x.Topic != null)
                .ToListAsync();

            await CreateDecksFromGroups(userId, levelId, allVocabs.GroupBy(x => x.Topic.TopicID),
                g => g.First().Topic.TopicName,
                item => item.VocabID,
                SkillType.Vocabulary);


            // --- PHẦN 2: KHỞI TẠO HÁN TỰ (KANJI) ---
            var allKanjis = await _context.Kanjis
                .Where(k => k.LevelID == levelId)
                .Select(k => new
                {
                    k.KanjiID,
                    // Giả sử Kanji dùng Radicals (Bộ thủ) hoặc một bảng Topic riêng
                    Topic = k.Radical // Hoặc k.KanjiTopics... tùy DB của ông
                })
                .Where(x => x.Topic != null)
                .ToListAsync();

            await CreateDecksFromGroups(userId, levelId, allKanjis.GroupBy(x => x.Topic.RadicalID),
                g => $"Hán tự nhóm {g.First().Topic.Character}",
                item => item.KanjiID,
                SkillType.Kanji);


            // --- PHẦN 3: KHỞI TẠO NGỮ PHÁP (GRAMMAR) ---
            var allGrammars = await _context.Grammars
                .Where(g => g.LevelID == levelId)
                .Select(g => new
                {
                    g.GrammarID,
                    Group = g.GrammarGroup
                })
                .Where(x => x.Group != null)
                .ToListAsync();

            await CreateDecksFromGroups(userId, levelId, allGrammars.GroupBy(x => x.Group.GrammarGroupID),
                g => $"Ngữ pháp {g.First().Group.GroupName}",
                item => item.GrammarID,
                SkillType.Grammar);

            // Lưu tất cả thay đổi vào Database
            await _context.SaveChangesAsync();
        }

        private async Task CreateDecksFromGroups<T, TKey>(
            string userId,
            Guid? levelId,
            IEnumerable<IGrouping<TKey, T>> groups,
            Func<IGrouping<TKey, T>, string> nameSelector,
            Func<T, Guid> idSelector,
            SkillType type)
        {
            foreach (var group in groups)
            {
                var itemsInGroup = group.ToList();
                int total = itemsInGroup.Count;

                // Quy tắc 1: Nếu dưới 10 card thì không tạo deck
                if (total < 1) continue;

                // Quy tắc 2: Chia phần nếu > 20 card
                int pageSize = 20;
                int numberOfParts = (int)Math.Ceiling((double)total / pageSize);

                for (int i = 0; i < numberOfParts; i++)
                {
                    var pagedItems = itemsInGroup.Skip(i * pageSize).Take(pageSize).ToList();
                    string partSuffix = numberOfParts > 1 ? $" (P.{i + 1})" : "";

                    var deck = new FlashcardDeck
                    {
                        DeckID = Guid.NewGuid(),
                        Name = $"{nameSelector(group)}{partSuffix}",
                        UserID = userId,
                        LevelID = levelId,
                        SkillType = type,
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.FlashcardDecks.Add(deck);

                    foreach (var item in pagedItems)
                    {
                        _context.FlashcardItems.Add(new FlashcardItem
                        {
                            ItemID = Guid.NewGuid(),
                            DeckID = deck.DeckID,
                            EntityID = idSelector(item),
                            ItemType = type,
                            NextReview = DateTime.UtcNow,
                            Repetitions = 0,
                            Interval = 0,
                            EF = 2.5f
                        });
                    }
                }
            }
        }

        public async Task<List<FlashcardReviewDTO>> GetReviewsByDeckAsync(string userId, Guid deckId)
        {
            var now = DateTime.UtcNow.AddMinutes(1);

            // 1. Chỉ lấy những thẻ thuộc đúng bộ (Deck) này và đến hạn (NextReview <= now)
            var flashcards = await _context.FlashcardItems
                .Where(f => f.DeckID == deckId && f.Deck.UserID == userId && f.NextReview <= now)
                .OrderBy(f => f.NextReview)
                .ToListAsync();

            if (!flashcards.Any()) return new List<FlashcardReviewDTO>();

            // 2. Gom IDs để query thông tin chi tiết (tránh query trong vòng lặp)
            var vocabIds = flashcards.Where(f => f.ItemType == SkillType.Vocabulary).Select(f => f.EntityID).ToList();
            var kanjiIds = flashcards.Where(f => f.ItemType == SkillType.Kanji).Select(f => f.EntityID).ToList();
            var grammarIds = flashcards.Where(f => f.ItemType == SkillType.Grammar).Select(f => f.EntityID).ToList();

            var vocabs = await _context.Vocabularies.Where(v => vocabIds.Contains(v.VocabID)).ToDictionaryAsync(v => v.VocabID);
            var kanjis = await _context.Kanjis.Where(k => kanjiIds.Contains(k.KanjiID)).ToDictionaryAsync(k => k.KanjiID);
            var grammars = await _context.Grammars.Where(g => grammarIds.Contains(g.GrammarID)).ToDictionaryAsync(g => g.GrammarID);

            // 3. Map sang DTO để trả về cho Frontend
            return flashcards.Select(f => {
                FlashcardContentDTO content = null;

                if (f.ItemType == SkillType.Vocabulary && vocabs.TryGetValue(f.EntityID, out var v))
                    content = new FlashcardContentDTO { Kanji = v.Word, Furigana = v.Reading, Meaning = v.Meaning };

                else if (f.ItemType == SkillType.Kanji && kanjis.TryGetValue(f.EntityID, out var k))
                    content = new FlashcardContentDTO { Kanji = k.Character, Furigana = k.Onyomi, Meaning = k.Meaning };

                else if (f.ItemType == SkillType.Grammar && grammars.TryGetValue(f.EntityID, out var g))
                    content = new FlashcardContentDTO { Kanji = g.Title, Furigana = g.Structure, Meaning = g.Meaning };

                return new FlashcardReviewDTO
                {
                    ItemID = f.ItemID,
                    ItemType = f.ItemType,
                    NextReview = f.NextReview,
                    Entity = content
                };
            }).Where(x => x.Entity != null).ToList();
        }

        public async Task<object> GetAvailableEntitiesAsync(string userId, Guid levelId, SkillType type)
        {
            // 1. Lấy danh sách EntityID mà User ĐÃ có trong flashcard (để loại trừ)
            var ownedEntityIds = await _context.FlashcardItems
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
    public int DueCount { get; set; }
    public int NewCards { get; set; }
}