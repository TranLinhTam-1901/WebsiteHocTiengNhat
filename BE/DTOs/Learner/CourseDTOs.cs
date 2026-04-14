using System;
using System.Collections.Generic;

namespace QuizzTiengNhat.DTOs.Learner
{
    public class CourseListItemDTO
    {
        public Guid CourseID { get; set; }
        public string CourseName { get; set; }
        public string? Description { get; set; }
        public string LevelName { get; set; }

        public int TotalLessons { get; set; }
        public int CompletedLessons { get; set; }
        public double ProgressPercent { get; set; }

        public Guid? ContinueLessonID { get; set; }
        public string? ContinueLessonTitle { get; set; }
    }

    public class LessonListItemDTO
    {
        public Guid LessonID { get; set; }
        public string Title { get; set; }
        public int Difficulty { get; set; }
        public int Priority { get; set; }

        public Guid? TopicID { get; set; }
        public string? TopicName { get; set; }

        public bool IsCompleted { get; set; }
        public bool IsLocked { get; set; }

        // Số lượng item sẽ hiển thị theo template (đã cap theo số lượng)
        public LearnCountsDTO Counts { get; set; }
    }

    public class LearnCountsDTO
    {
        public int Kanji { get; set; }
        public int Vocabulary { get; set; }
        public int Reading { get; set; }
        public int Grammar { get; set; }
        public int Listening { get; set; }
    }

    public class LessonLearnDTO
    {
        public Guid LessonID { get; set; }
        public string LessonTitle { get; set; }

        public List<Guid> TopicIDs { get; set; } = new List<Guid>();
        public List<string> TopicNames { get; set; } = new List<string>();

        public KanjiBlockDTO? KanjiBlock { get; set; }
        public VocabularyBlockDTO? VocabularyBlock { get; set; }
        public GrammarBlockDTO? GrammarBlock { get; set; }
        public ReadingBlockDTO? ReadingBlock { get; set; }
        public ListeningBlockDTO? ListeningBlock { get; set; }
    }

    public class KanjiBlockDTO
    {
        public int DisplayCount { get; set; }
        public List<KanjiItemDTO> Items { get; set; } = new List<KanjiItemDTO>();
    }

    public class KanjiItemDTO
    {
        public Guid KanjiID { get; set; }
        public string Character { get; set; }
        public string Onyomi { get; set; }
        public string Kunyomi { get; set; }
        public string Meaning { get; set; }
        public int StrokeCount { get; set; }

        public RadicalDTO? Radical { get; set; }
    }

    public class RadicalDTO
    {
        public Guid RadicalID { get; set; }
        public string Character { get; set; }
        public string Name { get; set; }
        public string? Meaning { get; set; }
        public int StrokeCount { get; set; }
    }

    public class VocabularyBlockDTO
    {
        public int DisplayCount { get; set; }
        public List<VocabularyItemDTO> Items { get; set; } = new List<VocabularyItemDTO>();
    }

    public class VocabularyItemDTO
    {
        public Guid VocabID { get; set; }
        public string Word { get; set; }
        public string Reading { get; set; }
        public string Meaning { get; set; }

        public string? AudioURL { get; set; }
        public string? ImageURL { get; set; }
        public string? Mnemonics { get; set; }

        public List<string> WordTypes { get; set; } = new List<string>();
        public List<ExampleDTO> Examples { get; set; } = new List<ExampleDTO>();
    }

    public class ExampleDTO
    {
        public string Content { get; set; }
        public string Translation { get; set; }
        public string? AudioURL { get; set; }
    }

    public class GrammarBlockDTO
    {
        public int DisplayCount { get; set; }
        public List<GrammarItemDTO> Items { get; set; } = new List<GrammarItemDTO>();
    }

    public class GrammarItemDTO
    {
        public Guid GrammarID { get; set; }
        public string Title { get; set; }
        public string Structure { get; set; }
        public string Meaning { get; set; }
        public string Explanation { get; set; }
        public string? UsageNote { get; set; }
        public int GrammarType { get; set; }
        public int Formality { get; set; }
        public string? GrammarGroupName { get; set; }
        public List<ExampleDTO> Examples { get; set; } = new List<ExampleDTO>();
    }

    public class ReadingBlockDTO
    {
        public int DisplayCount { get; set; }
        public List<ReadingItemDTO> Items { get; set; } = new List<ReadingItemDTO>();
    }

    public class ReadingItemDTO
    {
        public Guid ReadingID { get; set; }
        public string Title { get; set; }
        public string Content { get; set; }
        public string Translation { get; set; }
        public int WordCount { get; set; }
        public int EstimatedTime { get; set; }
    }

    public class ListeningBlockDTO
    {
        public int DisplayCount { get; set; }
        public List<ListeningItemDTO> Items { get; set; } = new List<ListeningItemDTO>();
    }

    public class ListeningItemDTO
    {
        public Guid ListeningID { get; set; }
        public string Title { get; set; }
        public string AudioURL { get; set; }
        public string? Script { get; set; }
        public string? Transcript { get; set; }
        public int Duration { get; set; }
        public string? SpeedCategory { get; set; }
    }
}

