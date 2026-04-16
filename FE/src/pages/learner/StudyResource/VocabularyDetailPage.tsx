import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import LearnerHeader from '../../../components/layout/learner/LearnerHeader';
import { learnerVocabService } from '../../../services/Learner/learnerVocabService';
import { LearnerVocabDetail } from '../../../interfaces/Learner/StudyResource';
import { resolveMediaUrl } from '../../../utils/resolveMediaUrl';

const StudyVocabularyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<LearnerVocabDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('Thiếu mã từ vựng.');
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        setLoading(true);
        const d = await learnerVocabService.getById(id);
        setData(d);
        setError(null);
      } catch {
        setError('Không tải được từ vựng.');
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const imageSrc = resolveMediaUrl(data?.imageURL);
  const audioSrc = resolveMediaUrl(data?.audioURL);

  return (
    <div className="flex flex-col h-full bg-background-light font-display text-[#181114]">
      <LearnerHeader>
        <div className="flex items-center gap-4 w-full flex-wrap">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="size-10 rounded-full border border-[#f4f0f2] flex items-center justify-center text-[#886373] hover:bg-[#f4f0f2] transition-colors active:scale-90"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex flex-col min-w-0">
            <h2 className="text-xl font-bold text-[#181114] truncate">Chi tiết từ vựng</h2>
            <nav className="flex text-[10px] text-[#886373] font-medium gap-1 uppercase tracking-wider">
              <Link to="/learner/studyresource/vocabulary" className="hover:text-primary no-underline text-inherit">
                Từ vựng
              </Link>
              <span>/</span>
              <span className="text-primary font-bold">Chi tiết</span>
            </nav>
          </div>
        </div>
      </LearnerHeader>

      <div className="flex-1 overflow-y-auto p-8">
        {loading && (
          <div className="py-20 text-center text-[#886373] font-bold">Đang tải...</div>
        )}
        {error && !loading && (
          <div className="py-20 text-center text-red-500 font-bold">{error}</div>
        )}
        {data && !loading && (
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-[#f4f0f2] shadow-sm p-8">
                <h3 className="text-base font-bold mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">translate</span>
                  Thông tin chính
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-bold text-[#886373] uppercase mb-2">Từ</p>
                    <p className="text-3xl font-japanese font-black text-[#181114]">{data.word}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#886373] uppercase mb-2">Furigana</p>
                    <p className="text-lg font-japanese text-primary font-bold">{data.reading || '—'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs font-bold text-[#886373] uppercase mb-2">Nghĩa</p>
                    <p className="text-lg font-bold text-[#5a434d] leading-relaxed">{data.meaning}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#886373] uppercase mb-2">JLPT / Bài học</p>
                    <p className="text-sm font-bold">
                      {data.levelName} · {data.lessonName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#886373] uppercase mb-2">Thông dụng</p>
                    <p className="text-sm font-bold">{data.isCommon ? 'Từ thông dụng' : 'Từ hiếm gặp'}</p>
                  </div>
                </div>
                {(data.wordTypes?.length ?? 0) > 0 && (
                  <div className="mt-6 pt-6 border-t border-[#f4f0f2]">
                    <p className="text-xs font-bold text-[#886373] uppercase mb-3">Loại từ</p>
                    <div className="flex flex-wrap gap-2">
                      {data.wordTypes.map((wt) => (
                        <span
                          key={wt.id}
                          className="px-3 py-1.5 bg-primary/5 border border-primary/20 text-primary text-xs font-bold rounded-full"
                        >
                          {wt.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {data.topics?.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-bold text-[#886373] uppercase mb-3">Chủ đề</p>
                    <div className="flex flex-wrap gap-2">
                      {data.topics.map((t) => (
                        <span
                          key={t.topicID}
                          className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold rounded-full"
                        >
                          {t.topicName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {data.mnemonics && (
                <div className="bg-white rounded-2xl border border-[#f4f0f2] shadow-sm p-8">
                  <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">psychology</span>
                    Gợi nhớ
                  </h3>
                  <p className="text-sm text-[#5a434d] leading-relaxed whitespace-pre-wrap">{data.mnemonics}</p>
                </div>
              )}

              <div className="bg-white rounded-2xl border border-[#f4f0f2] shadow-sm p-8">
                <h3 className="text-base font-bold mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">format_quote</span>
                  Ví dụ
                </h3>
                {data.examples?.length ? (
                  <div className="space-y-4">
                    {data.examples.map((ex, i) => (
                      <div key={i} className="p-5 bg-[#fbf9fa] rounded-xl border border-[#f4f0f2]">
                        <p className="font-japanese text-[#181114] font-medium mb-2">{ex.content}</p>
                        <p className="text-sm text-[#886373]">{ex.translation}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#886373]">Chưa có ví dụ.</p>
                )}
              </div>
            </div>

            <div className="space-y-6">
              {imageSrc && (
                <div className="bg-white rounded-2xl border border-[#f4f0f2] shadow-sm overflow-hidden">
                  <p className="text-sm font-bold text-[#886373] px-6 pt-6 pb-2">Hình minh họa</p>
                  <img src={imageSrc} alt={data.word} className="w-full aspect-video object-contain bg-[#fbf9fa]" />
                </div>
              )}
              {audioSrc && (
                <div className="bg-white rounded-2xl border border-[#f4f0f2] shadow-sm p-6">
                  <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">graphic_eq</span>
                    Phát âm
                  </h3>
                  <audio controls className="w-full" src={audioSrc}>
                    Trình duyệt không hỗ trợ audio.
                  </audio>
                </div>
              )}

              <div className="bg-white rounded-2xl border border-[#f4f0f2] shadow-sm p-6">
                <h3 className="text-base font-bold mb-4">Kanji liên quan</h3>
                {data.relatedKanjis?.length ? (
                  <ul className="space-y-3">
                    {data.relatedKanjis.map((k) => (
                      <li key={k.kanjiID}>
                        <Link
                          to={`/learner/studyresource/kanji/${k.kanjiID}`}
                          className="flex items-center gap-3 p-3 rounded-xl border border-[#f4f0f2] hover:border-primary/30 hover:bg-primary/5 transition-all no-underline text-inherit"
                        >
                          <span className="text-2xl font-japanese font-black text-primary w-10 text-center">
                            {k.character}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-[#886373] font-japanese truncate">
                              On {k.onyomi || '—'} · Kun {k.kunyomi || '—'}
                            </p>
                            <p className="text-sm font-bold text-[#181114] truncate">{k.meaning}</p>
                          </div>
                          <span className="material-symbols-outlined text-[#886373] text-sm">chevron_right</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-[#886373]">Chưa có kanji liên kết.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyVocabularyDetailPage;
