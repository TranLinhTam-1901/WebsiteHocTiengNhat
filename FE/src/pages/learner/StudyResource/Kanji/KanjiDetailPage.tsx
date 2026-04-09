import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import LearnerHeader from '../../../../components/layout/learner/LearnerHeader';
import { learnerKanjiService } from '../../../../services/Learner/learnerKanjiService';
import { LearnerKanjiDetail } from '../../../../interfaces/Learner/StudyResource';
import { resolveMediaUrl } from '../../../../utils/resolveMediaUrl';

const StudyKanjiDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<LearnerKanjiDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('Thiếu mã kanji.');
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        setLoading(true);
        const d = await learnerKanjiService.getById(id);
        setData(d);
        setError(null);
      } catch {
        setError('Không tải được kanji.');
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const gifSrc = resolveMediaUrl(data?.strokeGif);

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
            <h2 className="text-xl font-bold text-[#181114]">Chi tiết Kanji</h2>
            <nav className="flex text-[10px] text-[#886373] font-medium gap-1 uppercase tracking-wider">
              <Link to="/learner/studyresource/kanji" className="hover:text-primary no-underline text-inherit">
                Kanji
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
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-2xl border border-[#f4f0f2] shadow-sm">
                <div className="flex flex-col sm:flex-row gap-8 items-start">
                  <div className="size-36 shrink-0 rounded-2xl border-2 border-dashed border-[#f4f0f2] flex items-center justify-center">
                    <span className="text-7xl font-japanese font-black text-[#181114]">{data.character}</span>
                  </div>
                  <div className="flex-1 space-y-4 w-full">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-bold text-[#886373] uppercase mb-1">Số nét</p>
                        <p className="text-lg font-black">{data.strokeCount}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#886373] uppercase mb-1">Độ phổ biến</p>
                        <p className="text-lg font-bold">{data.popularity}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#886373] uppercase mb-1">Bộ thủ</p>
                      {data.radical ? (
                        <p className="text-base font-japanese font-bold">
                          <span className="text-primary text-2xl mr-2">{data.radical.character}</span>
                          {data.radical.name}{' '}
                          <span className="text-[#886373] font-medium text-sm">({data.radical.stroke} nét)</span>
                        </p>
                      ) : (
                        <p className="text-[#886373]">—</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#886373] uppercase mb-1">JLPT · Chủ đề · Bài</p>
                      <p className="text-sm font-bold">
                        {data.levelName} · {data.topicName} · {data.lessonName}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-2xl border border-[#f4f0f2] shadow-sm space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-bold text-[#886373] uppercase mb-2">On-yomi</p>
                    <p className="font-japanese text-lg text-[#181114]">{data.onyomi || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#886373] uppercase mb-2">Kun-yomi</p>
                    <p className="font-japanese text-lg text-[#181114]">{data.kunyomi || '—'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-[#886373] uppercase mb-2">Nghĩa</p>
                  <p className="text-lg font-bold text-[#5a434d] leading-relaxed">{data.meaning}</p>
                </div>
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

              {data.note && (
                <div className="bg-white rounded-2xl border border-[#f4f0f2] shadow-sm p-8">
                  <h3 className="text-base font-bold mb-4">Ghi chú</h3>
                  <p className="text-sm text-[#5a434d] leading-relaxed whitespace-pre-wrap">{data.note}</p>
                </div>
              )}

              <div className="bg-white p-8 rounded-2xl border border-[#f4f0f2] shadow-sm">
                <h3 className="text-base font-bold mb-4">Từ vựng liên quan</h3>
                {data.relatedVocabs?.length ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {data.relatedVocabs.map((v) => (
                      <Link
                        key={v.vocabID}
                        to={`/learner/studyresource/vocabulary/${v.vocabID}`}
                        className="flex items-center gap-4 p-4 rounded-2xl bg-[#fbf9fa] border border-[#f4f0f2] hover:border-primary/30 hover:shadow-md transition-all no-underline text-inherit"
                      >
                        <div className="size-14 rounded-xl bg-white border border-[#f4f0f2] flex items-center justify-center font-japanese font-bold text-lg shrink-0">
                          {v.word}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-[#886373] font-japanese font-semibold truncate">{v.reading}</p>
                          <p className="text-sm font-bold text-[#181114] truncate">{v.meaning}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#886373]">Chưa có từ vựng liên kết.</p>
                )}
              </div>
            </div>

            <div className="space-y-6">
              {gifSrc && (
                <div className="bg-white rounded-2xl border border-[#f4f0f2] shadow-sm overflow-hidden p-4">
                  <p className="text-sm font-bold text-[#886373] mb-3">Trình tự nét</p>
                  <img src={gifSrc} alt={`${data.character} stroke`} className="w-full rounded-xl bg-[#fbf9fa]" />
                </div>
              )}

              {data.radicalVariants?.length > 0 && (
                <div className="bg-white rounded-2xl border border-[#f4f0f2] shadow-sm p-6">
                  <h3 className="text-sm font-bold text-[#886373] mb-4 uppercase tracking-wider">
                    Biến thể bộ thủ
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {data.radicalVariants.map((v) => (
                      <span
                        key={v.variantID}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#fbf9fa] border border-[#f4f0f2] text-sm font-japanese"
                        title={v.name || undefined}
                      >
                        {v.character}
                        {v.name && <span className="text-xs text-[#886373] font-sans">{v.name}</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyKanjiDetailPage;
