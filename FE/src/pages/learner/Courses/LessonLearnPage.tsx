import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import LearnerHeader from '../../../components/layout/learner/LearnerHeader';
import { LearnerCourseService } from '../../../services/Learner/learnerCourseService';
import type { ExampleDTO, LessonLearnDTO } from '../../../interfaces/Learner/Course';
import { resolveMediaUrl } from '../../../utils/resolveMediaUrl';
import {
  firstReadingChunk,
  hasJapaneseVoice,
  preloadJapaneseVoices,
  speakJapanese,
} from '../../../utils/japaneseTts';

type LocationState = { courseId?: string };

type SectionKey = 'kanji' | 'vocabulary' | 'grammar' | 'reading' | 'listening';

type PlayPayload = {
  audioUrl?: string | null;
  ttsText?: string;
};

function useLessonAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    window.speechSynthesis.cancel();
    setPlayingId(null);
  }, []);

  const play = useCallback(
    async (id: string, payload: PlayPayload) => {
      if (playingId === id) {
        stop();
        return;
      }

      stop();

      const speakTts = (ttsId: string, text: string) => {
        setPlayingId(ttsId);
        const ok = speakJapanese(text, {
          onEnd: () => setPlayingId(null),
          onError: () => {
            setPlayingId(null);
            if (!hasJapaneseVoice()) {
              toast.error('Trình duyệt chưa có giọng tiếng Nhật. Hãy cài voice ja-JP hoặc dùng Chrome/Edge.');
            }
          },
        });
        if (!ok) {
          setPlayingId(null);
          toast.error('Không thể phát âm. Vui lòng thử lại.');
        }
      };

      const src = resolveMediaUrl(payload.audioUrl);
      if (src) {
        try {
          const audio = new Audio(src);
          audioRef.current = audio;
          setPlayingId(id);
          audio.onended = () => setPlayingId(null);
          audio.onerror = () => {
            setPlayingId(null);
            if (payload.ttsText?.trim()) {
              speakTts(id, payload.ttsText.trim());
            }
          };
          await audio.play();
          return;
        } catch {
          /* fallback TTS below */
        }
      }

      if (payload.ttsText?.trim()) {
        speakTts(id, payload.ttsText.trim());
      }
    },
    [playingId, stop]
  );

  useEffect(() => () => stop(), [stop]);

  return { play, stop, playingId };
}

const AudioButton: React.FC<{
  id: string;
  playingId: string | null;
  onPlay: (id: string, payload: PlayPayload) => void;
  payload: PlayPayload;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ id, playingId, onPlay, payload, size = 'md', className = '' }) => {
  const isPlaying = playingId === id;
  const sizeClass =
    size === 'sm' ? 'size-8' : size === 'lg' ? 'size-11' : 'size-9';
  const iconClass = size === 'lg' ? 'text-xl' : 'text-lg';

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onPlay(id, payload);
      }}
      className={`${sizeClass} shrink-0 rounded-full flex items-center justify-center transition-all active:scale-90 ${
        isPlaying
          ? 'bg-primary text-white shadow-md shadow-primary/25'
          : 'bg-white border border-[#f4f0f2] text-[#886373] hover:border-primary/40 hover:text-primary hover:bg-primary/5'
      } ${className}`}
      title={isPlaying ? 'Dừng phát âm' : 'Nghe phát âm'}
      aria-label={isPlaying ? 'Dừng phát âm' : 'Nghe phát âm'}
    >
      <span className={`material-symbols-outlined ${iconClass}`}>
        {isPlaying ? 'stop_circle' : 'volume_up'}
      </span>
    </button>
  );
};

const ExampleCard: React.FC<{
  example: ExampleDTO;
  id: string;
  playingId: string | null;
  onPlay: (id: string, payload: PlayPayload) => void;
}> = ({ example, id, playingId, onPlay }) => (
  <div className="flex gap-3 items-start p-4 bg-[#fbf9fa] rounded-xl border border-[#f4f0f2]">
    <AudioButton
      id={id}
      playingId={playingId}
      onPlay={onPlay}
      payload={{ audioUrl: example.audioURL, ttsText: example.content }}
      size="sm"
    />
    <div className="min-w-0 flex-1">
      <p className="font-japanese text-[#181114] leading-relaxed">{example.content}</p>
      {example.translation && (
        <p className="text-sm text-[#886373] mt-1.5 leading-relaxed">{example.translation}</p>
      )}
    </div>
  </div>
);

const SectionHeading: React.FC<{
  icon: string;
  title: string;
  count: number;
  colorClass?: string;
}> = ({ icon, title, count, colorClass = 'text-primary' }) => (
  <div className="flex items-center gap-3 mb-6">
    <div className={`size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 ${colorClass}`}>
      <span className="material-symbols-outlined">{icon}</span>
    </div>
    <div>
      <h3 className="text-base font-black text-[#181114]">{title}</h3>
      <p className="text-xs text-[#886373] font-medium">{count} mục trong bài</p>
    </div>
  </div>
);

const LessonLearnPage: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const courseId = (location.state as LocationState | null)?.courseId;

  const [data, setData] = useState<LessonLearnDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionKey>('kanji');
  const { play, playingId } = useLessonAudio();

  useEffect(() => {
    preloadJapaneseVoices();
  }, []);

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

  const sections = useMemo(() => {
    if (!data) return [];
    const list: { key: SectionKey; label: string; icon: string }[] = [];
    if (data.kanjiBlock?.items.length) list.push({ key: 'kanji', label: 'Hán tự', icon: 'translate' });
    if (data.vocabularyBlock?.items.length) list.push({ key: 'vocabulary', label: 'Từ vựng', icon: 'book_4' });
    if (data.grammarBlock?.items.length) list.push({ key: 'grammar', label: 'Ngữ pháp', icon: 'edit_note' });
    if (data.readingBlock?.items.length) list.push({ key: 'reading', label: 'Đọc hiểu', icon: 'menu_book' });
    if (data.listeningBlock?.items.length) list.push({ key: 'listening', label: 'Nghe hiểu', icon: 'headphones' });
    return list;
  }, [data]);

  useEffect(() => {
    if (sections.length > 0 && !sections.some((s) => s.key === activeSection)) {
      setActiveSection(sections[0].key);
    }
  }, [sections, activeSection]);

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
      <div className="flex flex-col h-full bg-background-light">
        <LearnerHeader title="Đang học" />
        <div className="flex-1 flex items-center justify-center">
          <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background-light font-display">
      <LearnerHeader>
      <div className= "flex items-center w-full gap-234">
        <div className="flex items-center gap-4 flex-1">
          <button
            type="button"
            onClick={() =>
              courseId ? navigate(`/learner/courses/${courseId}`) : navigate('/learner/courses')
            }
            className="size-10 rounded-full border border-[#f4f0f2] flex items-center justify-center text-[#886373] hover:bg-[#f4f0f2] shrink-0"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-[#181114] line-clamp-2">{data.lessonTitle}</h2>
            {data.topicNames.length > 0 && (
              <p className="text-[10px] text-[#886373] font-medium mt-0.5">
                {data.topicNames.join(' · ')}
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          disabled={completing}
          onClick={handleComplete}
          className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20 active:scale-95 no-underline"
          >
          <span className="material-symbols-outlined text-base">
            {completing ? 'hourglass_top' : 'check_circle'}
          </span>
          {completing ? 'Đang lưu…' : 'Hoàn thành'}
        </button>
      </div>
      </LearnerHeader>

      <main className="flex-1 overflow-y-auto">
        {sections.length > 1 && (
          <div className="sticky top-0 z-10 bg-background-light/95 backdrop-blur-sm border-b border-[#f4f0f2] px-4 py-3">
            <div className="max-w-4xl mx-auto flex gap-2 overflow-x-auto no-scrollbar">
              {sections.map((section) => (
                <button
                  key={section.key}
                  type="button"
                  onClick={() => setActiveSection(section.key)}
                  className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                    activeSection === section.key
                      ? 'bg-primary text-white shadow-md shadow-primary/20'
                      : 'bg-white border border-[#f4f0f2] text-[#886373] hover:border-primary/30'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">{section.icon}</span>
                  {section.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-8">
          {data.kanjiBlock && (sections.length <= 1 || activeSection === 'kanji') && (
            <section className="bg-white rounded-3xl border border-[#f4f0f2] shadow-sm overflow-hidden">
              <div className="p-6 md:p-8 border-b border-[#f4f0f2] bg-[#fbf9fa]/50">
                <SectionHeading
                  icon="translate"
                  title={`Hán tự · ${data.kanjiBlock.displayCount}`}
                  count={data.kanjiBlock.items.length}
                />
              </div>
              <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.kanjiBlock.items.map((k) => (
                  <article
                    key={k.kanjiID}
                    className="p-5 rounded-2xl border border-[#f4f0f2] bg-white hover:border-primary/20 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-5xl font-japanese font-black text-[#181114] leading-none">
                        {k.character}
                      </p>
                      <AudioButton
                        id={`kanji-${k.kanjiID}`}
                        playingId={playingId}
                        onPlay={play}
                        payload={{
                          ttsText:
                            firstReadingChunk(k.kunyomi) ||
                            firstReadingChunk(k.onyomi) ||
                            k.character,
                        }}
                        size="md"
                      />
                    </div>
                    <div className="mt-4 space-y-1.5">
                      <p className="text-sm text-[#886373]">
                        <span className="font-bold text-[#181114]">On:</span> {k.onyomi || '—'}
                      </p>
                      <p className="text-sm text-[#886373]">
                        <span className="font-bold text-[#181114]">Kun:</span> {k.kunyomi || '—'}
                      </p>
                      <p className="text-sm font-bold text-[#181114] pt-1">{k.meaning}</p>
                      <p className="text-xs text-[#886373]">Số nét: {k.strokeCount}</p>
                      {k.radical && (
                        <p className="text-xs text-[#886373]">
                          Bộ thủ: {k.radical.character} ({k.radical.name})
                        </p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {data.vocabularyBlock && (sections.length <= 1 || activeSection === 'vocabulary') && (
            <section className="bg-white rounded-3xl border border-[#f4f0f2] shadow-sm overflow-hidden">
              <div className="p-6 md:p-8 border-b border-[#f4f0f2] bg-[#fbf9fa]/50">
                <SectionHeading
                  icon="book_4"
                  title={`Từ vựng · ${data.vocabularyBlock.displayCount}`}
                  count={data.vocabularyBlock.items.length}
                />
              </div>
              <div className="divide-y divide-[#f4f0f2]">
                {data.vocabularyBlock.items.map((v) => {
                  const imageSrc = resolveMediaUrl(v.imageURL);
                  const ttsText = v.reading?.trim() || v.word;

                  return (
                    <article key={v.vocabID} className="p-6 md:p-8 space-y-4">
                      <div className="flex flex-wrap items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="text-3xl font-japanese font-black text-[#181114]">{v.word}</span>
                            {v.reading && (
                              <span className="text-base text-[#886373] font-japanese">{v.reading}</span>
                            )}
                            <AudioButton
                              id={`vocab-${v.vocabID}`}
                              playingId={playingId}
                              onPlay={play}
                              payload={{ audioUrl: v.audioURL, ttsText }}
                              size="lg"
                            />
                          </div>
                          <p className="font-bold text-[#181114] mt-2 text-lg">{v.meaning}</p>
                          {v.wordTypes.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {v.wordTypes.map((type) => (
                                <span
                                  key={type}
                                  className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg bg-primary/10 text-primary"
                                >
                                  {type}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        {imageSrc && (
                          <img
                            src={imageSrc}
                            alt={v.word}
                            className="w-28 h-28 object-cover rounded-xl border border-[#f4f0f2] shrink-0"
                          />
                        )}
                      </div>

                      {v.mnemonics && (
                        <div className="flex gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100">
                          <span className="material-symbols-outlined text-amber-500 text-lg shrink-0">lightbulb</span>
                          <p className="text-sm text-amber-900 leading-relaxed italic">{v.mnemonics}</p>
                        </div>
                      )}

                      {v.examples.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-[10px] font-black uppercase tracking-widest text-[#886373]">
                            Ví dụ ({v.examples.length})
                          </p>
                          {v.examples.map((ex, i) => (
                            <ExampleCard
                              key={`${v.vocabID}-ex-${i}`}
                              example={ex}
                              id={`vocab-${v.vocabID}-ex-${i}`}
                              playingId={playingId}
                              onPlay={play}
                            />
                          ))}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {data.grammarBlock && (sections.length <= 1 || activeSection === 'grammar') && (
            <section className="bg-white rounded-3xl border border-[#f4f0f2] shadow-sm overflow-hidden">
              <div className="p-6 md:p-8 border-b border-[#f4f0f2] bg-[#fbf9fa]/50">
                <SectionHeading
                  icon="edit_note"
                  title={`Ngữ pháp · ${data.grammarBlock.displayCount}`}
                  count={data.grammarBlock.items.length}
                />
              </div>
              <div className="divide-y divide-[#f4f0f2]">
                {data.grammarBlock.items.map((g) => (
                  <article key={g.grammarID} className="p-6 md:p-8 space-y-4">
                    <div>
                      <h4 className="text-xl font-black text-[#181114]">{g.title}</h4>
                      {g.grammarGroupName && (
                        <p className="text-xs font-bold text-primary mt-1">{g.grammarGroupName}</p>
                      )}
                    </div>

                    <div className="p-4 rounded-xl bg-[#fbf9fa] border border-[#f4f0f2]">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#886373] mb-2">
                        Cấu trúc
                      </p>
                      <p className="text-sm font-mono text-[#181114] leading-relaxed">{g.structure}</p>
                    </div>

                    <p className="text-sm font-bold text-[#181114]">{g.meaning}</p>
                    <p className="text-sm text-[#886373] leading-relaxed">{g.explanation}</p>

                    {g.usageNote && (
                      <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                        {g.usageNote}
                      </p>
                    )}

                    {g.examples.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#886373]">
                          Ví dụ ({g.examples.length})
                        </p>
                        {g.examples.map((ex, i) => (
                          <ExampleCard
                            key={`${g.grammarID}-ex-${i}`}
                            example={ex}
                            id={`grammar-${g.grammarID}-ex-${i}`}
                            playingId={playingId}
                            onPlay={play}
                          />
                        ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}

          {data.readingBlock && (sections.length <= 1 || activeSection === 'reading') && (
            <section className="bg-white rounded-3xl border border-[#f4f0f2] shadow-sm overflow-hidden">
              <div className="p-6 md:p-8 border-b border-[#f4f0f2] bg-[#fbf9fa]/50">
                <SectionHeading
                  icon="menu_book"
                  title={`Đọc hiểu · ${data.readingBlock.displayCount}`}
                  count={data.readingBlock.items.length}
                />
              </div>
              <div className="divide-y divide-[#f4f0f2]">
                {data.readingBlock.items.map((r) => (
                  <article key={r.readingID} className="p-6 md:p-8 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <h4 className="text-lg font-black text-[#181114]">{r.title}</h4>
                      <AudioButton
                        id={`reading-${r.readingID}`}
                        playingId={playingId}
                        onPlay={play}
                        payload={{ ttsText: r.content }}
                        size="md"
                      />
                    </div>

                    <div className="p-5 rounded-2xl bg-[#fbf9fa] border border-[#f4f0f2]">
                      <p className="text-base leading-loose font-japanese whitespace-pre-wrap text-[#181114]">
                        {r.content}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-[#f4f0f2] bg-white">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#886373] mb-2">
                        Dịch nghĩa
                      </p>
                      <p className="text-sm text-[#886373] leading-relaxed">{r.translation}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {data.listeningBlock && (sections.length <= 1 || activeSection === 'listening') && (
            <section className="bg-white rounded-3xl border border-[#f4f0f2] shadow-sm overflow-hidden">
              <div className="p-6 md:p-8 border-b border-[#f4f0f2] bg-[#fbf9fa]/50">
                <SectionHeading
                  icon="headphones"
                  title={`Nghe hiểu · ${data.listeningBlock.displayCount}`}
                  count={data.listeningBlock.items.length}
                />
              </div>
              <div className="divide-y divide-[#f4f0f2]">
                {data.listeningBlock.items.map((l) => {
                  const audioSrc = resolveMediaUrl(l.audioURL);
                  return (
                    <article key={l.listeningID} className="p-6 md:p-8 space-y-4">
                      <div>
                        <h4 className="text-lg font-black text-[#181114]">{l.title}</h4>
                        {l.speedCategory && (
                          <p className="text-xs text-[#886373] mt-1">{l.speedCategory}</p>
                        )}
                      </div>

                      {audioSrc && (
                        <div className="p-4 rounded-xl bg-[#fbf9fa] border border-[#f4f0f2]">
                          <p className="text-[10px] font-black uppercase tracking-widest text-[#886373] mb-3">
                            File nghe
                          </p>
                          <audio controls className="w-full" src={audioSrc}>
                            <track kind="captions" />
                          </audio>
                        </div>
                      )}

                      {l.script && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#886373]">
                              Script
                            </p>
                            <AudioButton
                              id={`listening-script-${l.listeningID}`}
                              playingId={playingId}
                              onPlay={play}
                              payload={{ ttsText: l.script }}
                              size="sm"
                            />
                          </div>
                          <p className="text-sm font-japanese whitespace-pre-wrap leading-relaxed text-[#181114] p-4 rounded-xl bg-[#fbf9fa] border border-[#f4f0f2]">
                            {l.script}
                          </p>
                        </div>
                      )}

                      {l.transcript && (
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-[#886373] mb-2">
                            Phiên âm / Dịch
                          </p>
                          <p className="text-xs text-[#886373] whitespace-pre-wrap leading-relaxed">
                            {l.transcript}
                          </p>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default LessonLearnPage;
