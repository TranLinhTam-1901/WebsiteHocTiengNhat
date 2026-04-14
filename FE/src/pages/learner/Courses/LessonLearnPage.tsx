import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import LearnerHeader from '../../../components/layout/learner/LearnerHeader';
import { LearnerCourseService } from '../../../services/Learner/learnerCourseService';
import type { LessonLearnDTO } from '../../../interfaces/Learner/Course';

type LocationState = { courseId?: string };

// Sub-component cho nút phát âm
const TTSButton: React.FC<{ 
  text: string; 
  className?: string; 
  iconSize?: string;
}> = ({ text, className, iconSize = "text-xl" }) => {
  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Dừng âm thanh đang phát trước đó
    window.speechSynthesis.cancel();
    
    if (text && text.trim().length > 0) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <button
      type="button"
      onClick={handlePlay}
      className={`inline-flex items-center justify-center rounded-full hover:bg-primary/10 text-[#886373] hover:text-primary transition-all active:scale-90 ${className}`}
      title="Nghe phát âm"
    >
      <span className={`material-symbols-outlined ${iconSize}`}>volume_up</span>
    </button>
  );
};

const LessonLearnPage: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const courseId = (location.state as LocationState | null)?.courseId;

  const [data, setData] = useState<LessonLearnDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (!lessonId) return;
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const dto = await LearnerCourseService.getLessonLearn(lessonId);
        if (alive) setData(dto);
      } catch (e: unknown) {
        const status = (e as { response?: { status?: number } })?.response?.status;
        if (status === 404) toast.error('Không tìm thấy bài học.');
        else toast.error('Không tải được nội dung bài.');
        if (alive) setData(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [lessonId]);

  const handleComplete = async () => {
    if (!lessonId) return;
    setCompleting(true);
    try {
      await LearnerCourseService.completeLesson(lessonId);
      toast.success('Đã hoàn thành bài.');
      window.dispatchEvent(new Event('learner-profile-refresh'));
      if (courseId) navigate(`/learner/courses/${courseId}`, { replace: true });
      else navigate('/learner/courses', { replace: true });
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Không ghi được tiến độ.';
      toast.error(msg);
    } finally {
      setCompleting(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex flex-col h-full bg-[#fbf9fa]">
        <LearnerHeader title="Đang học" />
        <div className="flex-1 flex items-center justify-center">
          <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full bg-[#fbf9fa] font-display">
      <LearnerHeader>
        <div className="flex items-center gap-4 flex-wrap">
          <button
            type="button"
            onClick={() =>
              courseId ? navigate(`/learner/courses/${courseId}`) : navigate('/learner/courses')
            }
            className="size-10 rounded-full border border-[#f4f0f2] flex items-center justify-center text-[#886373] hover:bg-[#f4f0f2]"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h2 className="text-lg font-bold text-[#181114] line-clamp-2">{data.lessonTitle}</h2>
            {data.topicNames.length > 0 && (
              <p className="text-[10px] text-[#886373] font-medium mt-0.5">
                {data.topicNames.join(' · ')}
              </p>
            )}
          </div>
        </div>
      </LearnerHeader>

      <main className="flex-1 overflow-y-auto p-8 pb-28">
        <div className="max-w-3xl mx-auto space-y-10">
          {data.kanjiBlock && (
            <section className="bg-white rounded-[2rem] border-2 border-[#f4f0f2] p-8 shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-widest text-primary mb-6">
                Hán tự ({data.kanjiBlock.displayCount})
              </h3>
              <div className="space-y-6">
                {data.kanjiBlock.items.map((k) => (
                  <div key={k.kanjiID} className="border-b border-[#f4f0f2] last:border-0 pb-6 last:pb-0">
                    <div className='flex items-center'> 
                      <p className="text-4xl font-japanese font-black text-[#181114]">{k.character}</p>
                      <TTSButton text={k.character} iconSize="text-xs" />
                    </div>
                    
                    <p className="text-sm text-[#886373] mt-1">
                      On: {k.onyomi} · Kun: {k.kunyomi}
                    </p>
                    <p className="text-sm font-bold text-[#181114] mt-2">{k.meaning}</p>
                    <p className="text-xs text-[#886373]">Nét: {k.strokeCount}</p>
                    {k.radical && (
                      <p className="text-xs text-[#886373] mt-2">
                        Bộ: {k.radical.character} ({k.radical.name})
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {data.vocabularyBlock && (
            <section className="bg-white rounded-[2rem] border-2 border-[#f4f0f2] p-8 shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-widest text-primary mb-6">
                Từ vựng ({data.vocabularyBlock.displayCount})
              </h3>
              <div className="space-y-8">
                {data.vocabularyBlock.items.map((v) => (
                  <div key={v.vocabID} className="space-y-3">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="text-2xl font-japanese font-black">{v.word}</span>

                      <span className="text-sm text-[#886373]">{v.reading}</span>
                      <TTSButton text={v.word} iconSize="text-lg" />
                    </div>
                    <p className="font-bold text-[#181114]">{v.meaning}</p>
                    {v.wordTypes.length > 0 && (
                      <p className="text-xs text-primary font-bold">{v.wordTypes.join(', ')}</p>
                    )}
                    {v.audioURL && (
                      <audio controls className="w-full max-w-md mt-2" src={v.audioURL}>
                        <track kind="captions" />
                      </audio>
                    )}
                    {v.imageURL && (
                      <img src={v.imageURL} alt="" className="max-h-40 rounded-xl border border-[#f4f0f2]" />
                    )}
                    {v.mnemonics && <p className="text-sm italic text-[#886373]">{v.mnemonics}</p>}
                    {v.examples.length > 0 && (
                      <ul className="text-sm space-y-2 mt-2">
                        {v.examples.map((ex, i) => (
                          <li key={i} className="pl-4 border-l-2 border-primary/30">
                            <p className="font-japanese">{ex.content}</p>
                            <TTSButton text={ex.content} iconSize="text-xs" />
                            <p className="text-[#886373] text-xs">{ex.translation}</p>
                            {ex.audioURL && (
                              <audio controls className="w-full max-w-sm mt-1 h-8" src={ex.audioURL} />
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {data.grammarBlock && (
            <section className="bg-white rounded-[2rem] border-2 border-[#f4f0f2] p-8 shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-widest text-primary mb-6">
                Ngữ pháp ({data.grammarBlock.displayCount})
              </h3>
              <div className="space-y-8">
                {data.grammarBlock.items.map((g) => (
                  <div key={g.grammarID} className="space-y-2">
                    <h4 className="text-lg font-black text-[#181114]">{g.title}</h4>
                    {g.grammarGroupName && (
                      <p className="text-xs font-bold text-primary">{g.grammarGroupName}</p>
                    )}
                    <p className="text-sm font-mono bg-[#fbf9fa] p-3 rounded-xl">{g.structure}</p>
                    <p className="text-sm text-[#181114] font-medium">{g.meaning}</p>
                    <p className="text-sm text-[#886373] leading-relaxed">{g.explanation}</p>
                    {g.usageNote && <p className="text-xs text-amber-700">{g.usageNote}</p>}
                    {g.examples.length > 0 && (
                      <ul className="text-sm space-y-2 mt-2">
                        {g.examples.map((ex, i) => (
                          <li key={i} className="pl-4 border-l-2 border-amber-200">
                            <div className="flex items-center ">
                            <p className="font-japanese">{ex.content}</p>
                            <TTSButton text={ex.content} iconSize="text-xs" />
                            </div>
                            <p className="text-[#886373] text-xs">{ex.translation}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {data.readingBlock && (
            <section className="bg-white rounded-[2rem] border-2 border-[#f4f0f2] p-8 shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-widest text-primary mb-6">
                Đọc hiểu ({data.readingBlock.displayCount})
              </h3>
              {data.readingBlock.items.map((r) => (
                <div key={r.readingID} className="space-y-4">
                  <h4 className="font-black text-[#181114]">{r.title}</h4>
                  {/* <p className="text-xs text-[#886373]">
                    ~{r.wordCount} từ · {r.estimatedTime} phút
                  </p> */}
                  <div className="flex items-center ">
                    <div className="text-base leading-relaxed font-japanese whitespace-pre-wrap text-[#181114]">
                    {r.content}
                    </div>
                    <TTSButton text={r.content} iconSize="text-xs" />
                  </div>
                  
                  <p className="text-sm text-[#886373] border-t border-[#f4f0f2] pt-4">{r.translation}</p>
                </div>
              ))}
            </section>
          )}

          {data.listeningBlock && (
            <section className="bg-white rounded-[2rem] border-2 border-[#f4f0f2] p-8 shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-widest text-primary mb-6">
                Nghe hiểu ({data.listeningBlock.displayCount})
              </h3>
              {data.listeningBlock.items.map((l) => (
                <div key={l.listeningID} className="space-y-3">
                  <h4 className="font-black text-[#181114]">{l.title}</h4>
                  {l.speedCategory && (
                    <p className="text-xs text-[#886373]">{l.speedCategory}</p>
                  )}
                  <audio controls className="w-full" src={l.audioURL}>
                    <track kind="captions" />
                  </audio>
                  {l.script && (
                    <p className="text-sm font-japanese whitespace-pre-wrap">{l.script}</p>
                  )}
                  {l.transcript && (
                    <p className="text-xs text-[#886373] whitespace-pre-wrap">{l.transcript}</p>
                  )}
                </div>
              ))}
            </section>
          )}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 border-t border-[#f4f0f2] backdrop-blur-sm flex justify-center z-20">
        <div className="max-w-3xl w-full flex gap-3 justify-end px-4">
          <button
            type="button"
            disabled={completing}
            onClick={handleComplete}
            className="px-8 py-3 rounded-2xl bg-primary text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {completing ? 'Đang lưu…' : 'Hoàn thành bài'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LessonLearnPage;
