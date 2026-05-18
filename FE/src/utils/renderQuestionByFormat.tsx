import React from 'react';
import { QuestionDisplayDTO, AnswerOptionDTO } from '../interfaces/Learner/Exam';
import { QuestionFormat } from '../interfaces/Admin/QuestionBank';

interface RenderQuestionProps {
  question: QuestionDisplayDTO;
  currentIndex?: number;
  totalQuestions?: number;
  selectedAnswerId?: string | null;
  onSelectAnswer: (questionID: string, answerID: string) => void;
}

/**
 * Renders a question based on its QuestionFormat
 * 
 * Formats supported:
 * - StandardChoice: Regular multiple choice question
 * - StarSentence: Question with highlighted ★ character (JLPT grammar pattern)
 * - Passage: Reading comprehension (passage on left, question on right)
 * - AudioChoice: Audio-based multiple choice
 */
export const renderQuestionByFormat = ({
  question,
  selectedAnswerId,
  onSelectAnswer
}: RenderQuestionProps): React.ReactNode => {
  const handleAnswerChange = (answerId: string) => {
    onSelectAnswer(question.questionID, answerId);
  };

  // Common answer options component
  const AnswerOptions = () => (
    <div className="space-y-2.5">
      {question.options.map((option) => (
        <label
          key={option.answerID}
          className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#f4f0f2] p-3.5 transition-all hover:border-primary/30 hover:bg-[#fbf9fa]"
        >
          <input
            type="radio"
            name={`question-${question.questionID}`}
            value={option.answerID}
            checked={selectedAnswerId === option.answerID}
            onChange={() => handleAnswerChange(option.answerID)}
            className="size-4 cursor-pointer accent-primary"
          />
          <span className="text-sm text-[#181114]">{option.answerText}</span>
        </label>
      ))}
    </div>
  );

  switch (question.questionFormat) {
    // Standard multiple choice question
    case QuestionFormat.StandardChoice:
      return (
        <div className="space-y-5">
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap text-base font-medium leading-relaxed text-[#181114]">
              {question.content}
            </p>
          </div>
          {question.imageURL && (
            <img
              src={question.imageURL}
              alt="Question visual"
              className="max-h-60 w-full rounded-lg object-cover"
            />
          )}
          <AnswerOptions />
        </div>
      );

    // Star sentence format (JLPT grammar pattern)
    case QuestionFormat.StarSentence:
      return (
        <div className="space-y-5">
          <div className="rounded-lg bg-[#fbf9fa] p-4">
            <p className="whitespace-pre-wrap text-base leading-relaxed text-[#181114]">
              {question.content.split('★').map((part, idx) => (
                <React.Fragment key={idx}>
                  {part}
                  {idx < question.content.split('★').length - 1 && (
                    <span className="inline-block bg-yellow-100 px-2 py-1 text-lg font-bold text-yellow-700">
                      ★
                    </span>
                  )}
                </React.Fragment>
              ))}
            </p>
          </div>
          <div className="text-xs font-medium text-[#886373]">
            Chọn từ/cụm từ phù hợp điền vào vị trí dấu ★
          </div>
          <AnswerOptions />
        </div>
      );

    // Passage/Reading comprehension format
    case QuestionFormat.Passage:
      return (
        <div className="space-y-5">
          {question.readingContent && (
            <div className="grid gap-5 lg:grid-cols-2">
              {/* Left: Passage */}
              <div className="rounded-lg border border-[#f4f0f2] bg-[#fbf9fa] p-5">
                <div className="mb-3 text-xs font-bold uppercase text-[#886373]">
                  <span className="material-symbols-outlined mr-2 inline-block text-sm">
                    description
                  </span>
                  Bài đọc
                </div>
                <div className="prose prose-sm max-w-none text-sm leading-relaxed text-[#181114]">
                  <p className="whitespace-pre-wrap">{question.readingContent}</p>
                </div>
              </div>

              {/* Right: Question and options */}
              <div className="space-y-4">
                <div>
                  <div className="mb-3 text-xs font-bold uppercase text-[#886373]">
                    <span className="material-symbols-outlined mr-2 inline-block text-sm">
                      help_outline
                    </span>
                    Câu hỏi
                  </div>
                  <p className="whitespace-pre-wrap text-sm font-medium text-[#181114]">
                    {question.content}
                  </p>
                </div>
                <AnswerOptions />
              </div>
            </div>
          )}

          {!question.readingContent && (
            <div className="space-y-5">
              <p className="whitespace-pre-wrap text-base font-medium text-[#181114]">
                {question.content}
              </p>
              <AnswerOptions />
            </div>
          )}
        </div>
      );

    // Audio choice format
    case QuestionFormat.AudioChoice:
      return (
        <div className="space-y-5">
          {question.audioURL && (
            <div className="flex items-center gap-4 rounded-lg border border-[#f4f0f2] bg-[#fbf9fa] p-5">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <span className="material-symbols-outlined text-primary">headphones</span>
              </div>
              <audio
                controls
                src={question.audioURL}
                className="flex-1"
                controlsList="nodownload"
              />
            </div>
          )}

          {question.listeningScript && (
            <details className="rounded-lg border border-[#f4f0f2]">
              <summary className="flex cursor-pointer items-center gap-2 bg-[#fbf9fa] p-4 font-medium text-[#181114] hover:bg-[#f4f0f2]">
                <span className="material-symbols-outlined text-sm">expand_more</span>
                Xem bản phiên âm (Transcript)
              </summary>
              <div className="border-t border-[#f4f0f2] p-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#181114]">
                  {question.listeningScript}
                </p>
              </div>
            </details>
          )}

          <div>
            <div className="mb-3 text-xs font-bold uppercase text-[#886373]">
              Câu hỏi
            </div>
            <p className="whitespace-pre-wrap text-sm font-medium text-[#181114]">
              {question.content}
            </p>
          </div>

          <AnswerOptions />
        </div>
      );

    // Fallback
    default:
      return (
        <div className="space-y-5">
          <p className="whitespace-pre-wrap text-base font-medium text-[#181114]">
            {question.content}
          </p>
          <AnswerOptions />
        </div>
      );
  }
};

export default renderQuestionByFormat;
