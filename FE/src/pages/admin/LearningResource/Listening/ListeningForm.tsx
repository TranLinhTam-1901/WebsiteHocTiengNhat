import React, { useState, useEffect } from 'react';
import AdminHeader from '../../../../components/layout/admin/AdminHeader';
import { useParams, useNavigate } from 'react-router-dom';
import { listeningService } from '../../../../services/Admin/listeningService';
import { CreateUpdateListeningDTO, ListeningQuestionDTO } from '../../../../interfaces/Admin/Listening';
import { QuestionDTO, QuestionType, QuestionStatus } from '../../../../interfaces/Admin/Question';

const ListenEditor: React.FC = () => {
  const [jlptLevel, setJlptLevel] = useState('');
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const API_URL = "https://localhost:7055";
  
  // 1. Khai báo thêm State để lưu danh sách từ DB
  const [metadata, setMetadata] = useState({
      levels: [] as any[],
      topics: [] as any[],
      lessons: [] as any[]
  });

  // 1. Thêm State để quản lý việc tìm kiếm Topic
  const [topicSearch, setTopicSearch] = useState('');
  const [isTopicMenuOpen, setIsTopicMenuOpen] = useState(false);
  const filteredTopics = (metadata?.topics || []).filter(t => {
    const name = t?.name || t?.topicName || ""; 
    const search = topicSearch?.toLowerCase() || "";
    return name.toLowerCase().includes(search);
  });

  const [isLessonMenuOpen, setIsLessonMenuOpen] = useState(false);
  const [isVisibilityMenuOpen, setIsVisibilityMenuOpen] = useState(false);
  const [visibility, setVisibility] = useState('Published');

  const [dropUp, setDropUp] = useState({ lesson: false, visibility: false , speed: false});
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = async () => {
    if (audioRef.current && formData.audioURL) {
      try {
        if (isPlaying) {
          audioRef.current.pause();
        } else {
          await audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
      } catch (err) {
        console.error("Trình duyệt chặn tự động phát hoặc file lỗi:", err);
      }
    }
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleAudioChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Dùng hàm convert ở đây để lấy chuỗi Base64 nhanh gọn
        const base64 = await convertFileToBase64(file); 
        setFormData({ ...formData, audioURL: base64 });
      } catch (error) {
        console.error("Lỗi khi chuyển đổi file audio:", error);
      }
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Hàm cập nhật tiến trình khi audio đang chạy
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  // Hàm lấy tổng thời gian khi file audio đã tải xong
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      // Cập nhật duration vào formData nếu bạn cần lưu vào database
      setFormData(prev => ({ ...prev, duration: Math.floor(audioRef.current!.duration) }));
    }
  };

  // Hàm nhảy đến thời gian khi kéo thanh trượt
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Hàm định dạng giây thành mm:ss
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // 1. Định nghĩa các option cho tốc độ
  const speedOptions = [
    { value: "0", label: 'Chậm', color: 'bg-blue-400' },
    { value: "1", label: 'Bình thường', color: 'bg-green-400' },
    { value: "2", label: 'Nhanh', color: 'bg-red-400' },
  ];

  // State quản lý menu tốc độ (thêm vào cùng chỗ với các menu khác)
  const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState(false);

  // 2. Hàm định dạng giây thành Phút:Giây (VD: 135 -> 2:15)
  const formatDurationDisplay = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOpenDropdown = (type: 'lesson' | 'visibility' | 'speed', e: React.MouseEvent) => {
  const rect = e.currentTarget.getBoundingClientRect();
  const windowHeight = window.innerHeight;
  const isCloseToBottom = windowHeight - rect.bottom < 500;
  
  setDropUp(prev => ({ ...prev, [type]: isCloseToBottom }));
    if(type === 'lesson') setIsLessonMenuOpen(!isLessonMenuOpen);
    if(type === 'visibility') setIsVisibilityMenuOpen(!isVisibilityMenuOpen);
    if(type === 'speed') setIsSpeedMenuOpen(!isSpeedMenuOpen);
  };

  // 1. Khởi tạo State (Không set cứng ID, để trống để người dùng chọn)
  const [formData, setFormData] = useState<CreateUpdateListeningDTO>({
      title: '',
      audioURL: '',     
      script: '', 
      transcript: '',
      duration: 0,
      speedCategory: '',
      levelID: '', 
      topicIDs: [] as string[],
      lessonID: '',
      status: 1,
      questions: []
  });

  // Hàm render Furigana cho Live Preview
  const renderFurigana = (text: string) => {
    const regex = /\[(.*?)\]\((.*?)\)/g;
    const flexibleRegex = /[\[［]([^\]］]+)[\]］][\(（]([^\)）]+)[\)）]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = flexibleRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      parts.push(
        <ruby key={match.index} className="mx-0.5">
          {match[1]} {/* Phần Kanji */}
          <rt className="text-[0.55em] text-primary select-none opacity-90 pb-1">
            {match[2]}
          </rt>
        </ruby>
      );
      lastIndex = flexibleRegex.lastIndex;
    }
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    return parts.length > 0 ? parts : text;
  };

  const handleSave = async () => {
    // 1. Định nghĩa hàm kiểm tra GUID (Regex chuẩn)
    const isGuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    const statusMap: Record<string, number> = { 'Draft': 0, 'Published': 1, 'Archived': 2 };

    try {
      // 1. Tạo Payload (Vì dùng Base64 nên không cần upload riêng)
      const payload = {
        title: formData.title,
        audioURL: formData.audioURL, // Đây là chuỗi Base64
        script: formData.script,
        transcript: formData.transcript,
        duration: Number(formData.duration),
        speedCategory: formData.speedCategory, 
        levelID: formData.levelID,
       topicIDs: formData.topicIDs,
        lessonID: formData.lessonID,
        status: statusMap[visibility] ?? 1,
        
        questions: formData.questions.map((q, index) => ({
          // --- GIẢI QUYẾT LỖI THIẾU lessonID ---
          lessonID: formData.lessonID, 
          
          content: q.content,
          imageURL: q.imageURL, // Đã là Base64 từ hàm handleQuestionImageChange
          mediaTimestamp: q.mediaTimestamp,
          explanation: q.explanation || "",
          difficulty: Number(q.difficulty) || 1,
          displayOrder: index + 1,
          questionType: q.questionType,
          status: statusMap[visibility] ?? 0, 
          answers: q.answers.map((a) => ({
            answerText: a.answerText,
            isCorrect: a.isCorrect,
          }))
        }))
      };

      // 3. KIỂM TRA TỪNG TRƯỜNG ID
      const isLevelValid = isGuid(payload.levelID);
      
      // Kiểm tra từng ID trong mảng Topic
      const areTopicsValid = payload.topicIDs.length > 0 && 
                            payload.topicIDs.every((tid: string) => isGuid(tid));
      
      // LessonID có thể để trống (tùy nghiệp vụ), nếu có thì phải là GUID
      const isLessonValid = payload.lessonID ? isGuid(payload.lessonID) : true;

      if (!isLevelValid || !areTopicsValid || !isLessonValid) {
        alert("Lỗi: Level, Topic (ít nhất 1) hoặc Lesson không đúng định dạng GUID hoặc chưa được chọn!");
        console.log("Check Level:", isLevelValid, payload.levelID);
        console.log("Check Topics:", areTopicsValid, payload.topicIDs);
        console.log("Check Lesson:", isLessonValid, payload.lessonID);
        return;
      }

      // 3. Gọi API
      if (isEditMode && id) {
        await listeningService.update(id, payload);
        alert("Cập nhật Bài nghe thành công!");
      } else {
        await listeningService.create(payload);
        alert("Thêm mới Bài nghe thành công!");
      }
      navigate("/admin/resource/listening");
    } catch (error: any) {
      console.error("Save failed:", error);
      
      // Xử lý lỗi từ Backend trả về (C# Validation hoặc Exception)
      const serverError = error.response?.data;
      let errorMessage = "Vui lòng kiểm tra lại dữ liệu!";

      if (typeof serverError === 'string') {
          errorMessage = serverError;
      } else if (serverError?.errors) {
          // Trường hợp trả về FluentValidation hoặc ModelState
          errorMessage = Object.values(serverError.errors).flat().join("\n");
      } else if (serverError?.message) {
          errorMessage = serverError.message;
      }

      alert(`Lưu thất bại:\n${errorMessage}`);
    }
  };

  useEffect(() => {
    const initPage = async () => {
      try {
        // 1. Tải toàn bộ Metadata trước
        const [levels, topics, lessons] = await Promise.all([
          listeningService.getLevels(),
          listeningService.getTopics(),
          listeningService.getLessons()
        ]);
        
        setMetadata({ levels, topics, lessons });

        // 2. Nếu ở chế độ Edit, mới tiến hành lấy chi tiết bài nghe
        if (isEditMode && id) {
          const data = await listeningService.getById(id);
          
          // --- SỬA TẠI ĐÂY: Xử lý audioURL ---
          let formattedAudioURL = data.audioURL || '';
          if (formattedAudioURL && !formattedAudioURL.startsWith('http') && !formattedAudioURL.startsWith('data:')) {
            // Nối API_URL vào nếu là đường dẫn tương đối từ server
            formattedAudioURL = `${API_URL}${formattedAudioURL.startsWith('/') ? '' : '/'}${formattedAudioURL}`;
          }

          // Cập nhật FormData
          setFormData({
            title: data.title || '',
            audioURL: formattedAudioURL, // Dùng URL đã format
            script: data.script || '',
            transcript: data.transcript || '',
            duration: data.duration || 0,
            speedCategory: data.speedCategory?.toString() || '1',
            levelID: data.levelID || '',
            topicIDs: data.topicIDs || [],
            lessonID: data.lessonID || '',
            status: data.status ?? 0, 
            questions: (data.questions || []).map((q: any) => ({
              ...q,
              // Xử lý imageURL (Bạn đã làm đúng, giữ nguyên hoặc tối ưu nhẹ)
              imageURL: q.imageURL && !q.imageURL.startsWith("data:") && !q.imageURL.startsWith("http")
                ? `${API_URL}${q.imageURL.startsWith('/') ? '' : '/'}${q.imageURL}` 
                : q.imageURL
            }))
          });

          // SỬA LỖI LOGIC: Dùng biến 'levels' vừa lấy được thay vì dùng 'metadata.levels' 
          // (Vì setMetadata là async, lúc này metadata.levels có thể vẫn đang rỗng)
          const currentLevel = levels.find((l: any) => (l.id === data.levelID || l.levelID === data.levelID));
          if (currentLevel) {
            setJlptLevel(currentLevel.name || currentLevel.levelName);
          }

          const statusMap: Record<number, string> = { 0: 'Draft', 1: 'Published', 2: 'Archived' };
          setVisibility(statusMap[data.status] || 'Published');
        }
      } catch (error) {
        console.error("Lỗi khởi tạo trang:", error);
      }
    };

    initPage();
  }, [id, isEditMode]);

  return (
    /* Đổi flex-row thành flex-col để Header nằm trên cùng */
    <div className="flex flex-col h-screen bg-background-light font-['Lexend',sans-serif] text-slate-900">
      
      {/* Header section - Nằm ở top */}
      <AdminHeader>
          <div className={isEditMode ? 'flex items-center w-full gap-250' : 'flex items-center w-full gap-259.5'}>
            <div className="flex items-center gap-4 flex-1">
                <button
                    onClick={() => navigate(-1)}
                    className="size-10 rounded-full border border-[#f4f0f2] flex items-center justify-center text-[#886373] hover:bg-[#f4f0f2] transition-colors active:scale-90"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div className="flex flex-col text-left">
                    <h2 className="text-xl font-bold text-[#181114] uppercase">
                        {isEditMode ? 'Chỉnh sửa bài nghe' : 'Thêm bài nghe'}
                    </h2>
                    <nav className="flex text-[10px] text-[#886373] font-medium gap-1 uppercase tracking-wider">
                        <span>Quản lý</span>
                        <span>/</span>
                        <span className="text-primary font-bold">
                            {isEditMode ? 'Chỉnh sửa' : 'Thêm mới'}
                        </span>
                    </nav>
                </div>
            </div>

            {/* Phần Header - Nút Lưu */}
            <div className="flex items-center gap-3">
                <button 
                    type="button" // Đảm bảo có type="button"
                    onClick={handleSave} // BỎ DẤU COMMENT Ở ĐÂY
                    className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20 active:scale-95 no-underline"
                >
                    <span className="material-symbols-outlined text-sm">save</span>
                    {isEditMode ? 'Cập nhật' : 'Lưu bài nghe'}
                </button>
            </div>
        </div>
      </AdminHeader>
      
      {/* Main Content Area - Scrollable */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-396 mx-auto grid grid-cols-12 gap-8">
          
          {/* Form Content */}
          <div className="col-span-8 space-y-6 text-left">
            <section className="bg-white p-6 rounded-xl border border-[#f287b6]/5 shadow-sm">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#f287b6]">info</span>
                Thông tin chung
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Tiêu đề bài nghe</label>
                  <input 
                    className="w-full rounded-xl border-slate-200 focus:ring-[#f287b6] focus:border-[#f287b6] px-4 py-3 outline-none border transition-all" 
                    placeholder="e.g., 公園での一日 (Một ngày ở công viên)" 
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Trình độ JLPT</label>
                    <div className="flex gap-2">
                      {['N5', 'N4', 'N3', 'N2', 'N1'].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => {
                          setJlptLevel(level);
                          // Sửa: Tìm level trong metadata có name trùng với nút vừa bấm
                          const foundLevel = metadata.levels.find(l => l.name === level || l.levelName === level);
                          if (foundLevel) {
                            setFormData({ ...formData, levelID: foundLevel.id || foundLevel.levelID });
                          }
                        }}
                        className={`flex-1 py-2 rounded-full border-2 font-bold transition-all ${
                          jlptLevel === level 
                          ? 'border-[#f287b6] bg-[#f287b6]/10 text-[#f287b6]' 
                          : 'border-slate-100 text-slate-400 hover:border-[#f287b6]/50'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white p-6 rounded-xl border border-[#f287b6]/5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2 text-left">
                  <span className="material-symbols-outlined text-[#f287b6]">edit_note</span>
                  Nội dung bài nghe (Tiếng Nhật)
                </h3>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-medium bg-slate-100 px-3 py-1 rounded-full text-slate-500">
                    Số ký tự Nhật: {formData.script?.length ?? 0}
                  </span>
                </div>
              </div>
              <div className="relative">
                <textarea 
                  className="w-full rounded-xl border-slate-200 focus:ring-[#f287b6] focus:border-[#f287b6] p-4 leading-relaxed text-lg border outline-none min-h-75" 
                  placeholder="Nhập tiếng Nhật... Sử dụng [漢字](かんじ)" 
                  value={formData.script || ""}
                  onChange={(e) => setFormData({ ...formData, script: e.target.value })}
                ></textarea>
                <div className="absolute bottom-4 right-4 text-[10px] text-slate-400 italic">
                  Furigana rendering: Enabled
                </div>
              </div>
              <div className="mt-4 p-4 bg-[#f287b6]/5 rounded-xl border border-dashed border-[#f287b6]/30 text-left">
                <p className="text-xs font-bold text-[#f287b6] uppercase mb-2">Live Preview (Xem trước)</p>
                <div className="text-lg leading-[2.5] text-slate-800">
                  {formData.script ? renderFurigana(formData.script) : <span className="text-slate-400 italic">Văn bản xem trước sẽ hiện ở đây...</span>}
                </div>
              </div>
            </section>

            <section className="bg-white p-6 rounded-xl border border-[#f287b6]/5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2 text-left">
                  <span className="material-symbols-outlined text-[#f287b6]">translate</span>
                  Bản dịch (Tiếng Việt)
                </h3>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-medium bg-blue-50 px-3 py-1 rounded-full text-slate-500">
                    Số ký tự Việt: {formData.transcript?.length ?? 0} 
                  </span>
                </div>
              </div>
              <div className="relative">
                <textarea 
                  className="w-full rounded-xl border-slate-200 focus:ring-[#f287b6] focus:border-[#f287b6] p-4 leading-relaxed text-lg border outline-none min-h-75" 
                  placeholder="Nhập bản dịch tiếng Việt..." 
                  value={formData.transcript || ""}
                  onChange={(e) => setFormData({ ...formData, transcript: e.target.value })}
                ></textarea>
              </div>
            </section>

            <QuestionsSection
              formData={formData}
              setFormData={setFormData}
            />
          </div>

          {/* Right Sidebar */}
          <div className="col-span-4 space-y-6 text-left">

            <div className="bg-white rounded-2xl border border-[#f4f0f2] shadow-sm p-8">
              <h3 className="text-base font-bold mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">graphic_eq</span> File Audio
              </h3>

              {/* Input file ẩn & Audio thực thi */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleAudioChange} 
                className="hidden" 
                accept="audio/*" 
              />
              
              {formData.audioURL && formData.audioURL !== "" ? (
                <audio 
                  key={formData.audioURL.substring(0, 100)} // Dùng 1 đoạn base64 làm key để reset audio
                  ref={audioRef} 
                  src={formData.audioURL} 
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={() => setIsPlaying(false)}
                  onError={(e) => console.error("Audio Load Error:", e)}
                />
              ) : null}

              {/* Khung Upload */}
              <div 
                onClick={() => fileInputRef.current?.click()} 
                className={`flex flex-col items-center justify-center border-2 rounded-2xl p-4 min-h-27.5 transition-all cursor-pointer
                  ${formData.audioURL 
                    ? "border-primary bg-primary/5 shadow-inner" 
                    : "border-dashed border-[#d1ced0] bg-[#fbf9fa] hover:border-primary"
                  }`}
              >
                {formData.audioURL ? (
                  <>
                    <span className="material-symbols-outlined text-2xl text-primary mb-1">check_circle</span>
                    <p className="text-[11px] font-bold text-primary uppercase text-center">Đã nhận file</p>
                    <p className="text-[9px] text-[#886373] mt-0.5 opacity-60 italic text-center">Click để thay đổi</p>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-2xl text-[#886373] mb-1">cloud_upload</span>
                    <p className="text-[11px] font-bold text-[#886373] uppercase text-center">Upload MP3/WAV</p>
                  </>
                )}
              </div>

              {/* Thanh điều khiển Nâng cao - Gọn gàng & Tinh tế */}
              <div className="grid grid-cols-1 gap-8 mt-4">
                <div className="space-y-6">
                  <div className="p-4 bg-background-light rounded-xl border border-[#f287b6]/10">
                    <div className="flex items-center gap-3">
                      {/* Nút Play/Pause */}
                      <button 
                        type="button"
                        onClick={togglePlay}
                        disabled={!formData.audioURL}
                        className={`size-8 shrink-0 rounded-full flex items-center justify-center shadow-sm transition-all ${
                          formData.audioURL ? 'bg-[#f287b6] text-white' : 'bg-slate-200 text-slate-400'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {isPlaying ? 'pause' : 'play_arrow'}
                        </span>
                      </button>

                      {/* Thanh Seekbar có thể kéo (Input Range) */}
                      <div className="flex-1 flex items-center relative">
                        <input
                          type="range"
                          min="0"
                          max={duration || 0}
                          value={currentTime}
                          onChange={handleSeek}
                          disabled={!formData.audioURL}
                          style={{
                            // Tạo màu hồng cho phần đã chạy qua
                            background: `linear-gradient(to right, #f287b6 ${(currentTime / duration) * 100}%, #e2e8f0 ${(currentTime / duration) * 100}%)`
                          }}
                          className="audio-seekbar transition-all"
                        />
                      </div>

                      {/* Thời lượng */}
                      <span className="text-[11px] font-mono text-slate-500 tabular-nums shrink-0">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#f4f0f2] shadow-sm space-y-4">
              <label className="block text-xs font-bold text-[#886373] uppercase tracking-wider mb-1">Thông số bài nghe</label>
              <div className="grid grid-cols-2 gap-4">
                
                {/* TỐC ĐỘ (DROPDOWN) */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Tốc độ</span>
                  <div className="relative">
                    <button 
                      type="button"
                      onClick={(e) => {
                        handleOpenDropdown('speed', e); // Sử dụng hàm handleOpenDropdown chung của bạn
                        setIsSpeedMenuOpen(!isSpeedMenuOpen);
                      }}
                      className="w-full bg-[#fbf9fa] border border-[#f4f0f2] rounded-xl px-3 py-2 text-sm flex items-center justify-between hover:border-primary/30 transition-all outline-none"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`size-2 rounded-full ${speedOptions.find(opt => opt.value === formData.speedCategory)?.color || 'bg-slate-300'}`} />
                        <span className="font-bold">
                          {speedOptions.find(opt => opt.value === formData.speedCategory)?.label || "Chọn tốc độ"}
                        </span>
                      </div>
                      <span className={`material-symbols-outlined text-[#886373] text-sm transition-transform duration-300 ${isSpeedMenuOpen ? 'rotate-180' : ''}`}>
                        expand_more
                      </span>
                    </button>

                    {isSpeedMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsSpeedMenuOpen(false)} />
                        <div className={`absolute left-0 right-0 z-20 bg-white border border-[#f4f0f2] rounded-xl shadow-2xl p-1 animate-in fade-in duration-200
                            ${dropUp.speed ? "bottom-full mb-2 slide-in-from-bottom-2" : "top-full mt-2 slide-in-from-top-2"}`}
                        >
                          {speedOptions.map((opt) => (
                            <button 
                              key={opt.value}
                              type="button"
                              onClick={() => { 
                                setFormData({...formData, speedCategory: opt.value}); 
                                setIsSpeedMenuOpen(false); 
                              }}
                              className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-primary/5 hover:text-primary transition-colors flex items-center gap-2"
                            >
                              <span className={`size-2 rounded-full ${opt.color}`} />
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* THỜI GIAN (DISPLAY ONLY) */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Thời gian</span>
                  <div className="relative">
                    <div className="w-full bg-[#fbf9fa] border border-[#f4f0f2] rounded-xl px-3 py-2 text-sm font-bold text-slate-700 flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-slate-400">schedule</span>
                      {formatDurationDisplay(formData.duration)}
                      <span className="ml-auto text-[10px] text-slate-400 font-medium">Phút</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#f4f0f2] shadow-sm space-y-6">
              {/* 1. SECTION TOPIC (Giữ nguyên logic Searchable của bạn) */}
              <div>
                <label className="block text-xs font-bold text-[#886373] uppercase tracking-wider mb-2">
                  Topic Assignment
                </label>
                <div className="relative">
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#886373]">
                      search
                    </span>
                    <input
                      type="text"
                      placeholder="Tìm và chọn Topic..."
                      value={topicSearch}
                      onChange={(e) => {
                        setTopicSearch(e.target.value);
                        setIsTopicMenuOpen(true);
                      }}
                      onFocus={() => setIsTopicMenuOpen(true)}
                      className="w-full bg-[#fbf9fa] border border-[#f4f0f2] rounded-xl pl-9 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                    />
                  </div>

                  {isTopicMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsTopicMenuOpen(false)} />
                      <div className="absolute left-0 right-0 mt-2 bg-white border border-[#f4f0f2] rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto p-1 custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                        {/* Sử dụng filteredTopics đã khai báo ở trên để đồng nhất, 
                            nhưng thêm điều kiện lọc những cái ĐÃ CHỌN */}
                        {filteredTopics
                          .filter(t => !formData.topicIDs.includes(t.id || t.topicID)) 
                          .map((t) => {
                            const id = t.id || t.topicID; // Đảm bảo lấy đúng ID dù là field nào
                            const name = t.name || t.topicName;
                            return (
                              <button
                                key={id}
                                type="button"
                                onClick={() => {
                                  setFormData({ 
                                    ...formData, 
                                    topicIDs: [...formData.topicIDs, id] 
                                  });
                                  setTopicSearch("");
                                  setIsTopicMenuOpen(false);
                                }}
                                className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-primary/5 hover:text-primary transition-colors flex items-center justify-between group"
                              >
                                {name}
                                <span className="material-symbols-outlined text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                  add
                                </span>
                              </button>
                            );
                          })}
                        
                        {/* Logic kiểm tra rỗng dựa trên danh sách đã lọc */}
                        {filteredTopics.filter(t => !formData.topicIDs.includes(t.id || t.topicID)).length === 0 && (
                          <div className="p-3 text-center text-xs text-gray-400 italic">
                            Không còn topic nào phù hợp
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Tags Display */}
                <div className="mt-3 flex flex-wrap gap-2 min-h-8">
                  {formData.topicIDs.map((id) => {
                    // Tìm topic trong metadata để lấy tên hiển thị
                    const topicObj = metadata.topics.find(t => (t.id === id || t.topicID === id));
                    return (
                      <div key={id} className="inline-flex group relative animate-in zoom-in duration-200">
                        <div className="pl-3 pr-8 py-1.5 bg-primary/5 border border-primary/20 text-primary text-[11px] font-bold rounded-full flex items-center">
                          <span className="material-symbols-outlined text-[14px] mr-1.5 text-primary/60">
                            label
                          </span>
                          {topicObj?.name || topicObj?.topicName || "Unknown Topic"}
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData({ 
                            ...formData, 
                            topicIDs: formData.topicIDs.filter(tid => tid !== id) 
                          })}
                          className="absolute right-1 top-1/2 -translate-y-1/2 size-5 rounded-full bg-primary/20 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all scale-75 group-hover:scale-100"
                        >
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. SECTION LESSON */}
              <div className="pt-5 border-t border-[#f4f0f2]">
                  <label className="block text-xs font-bold text-[#886373] uppercase tracking-wider mb-2">Lesson Assign</label>
                  <div className="relative">
                      <button 
                          onClick={(e) => handleOpenDropdown('lesson', e)}
                          className="w-full bg-[#fbf9fa] border border-[#f4f0f2] rounded-xl px-4 py-2.5 text-sm flex items-center justify-between hover:border-primary/30 transition-all outline-none"
                      >
                          <span className={formData.lessonID ? "text-[#181114]" : "text-[#886373]/60"}>
                              {metadata.lessons.find(l => l.lessonID === formData.lessonID)?.title || "-- Chọn bài học --"}
                          </span>
                          <span className={`material-symbols-outlined text-[#886373] transition-transform duration-300 ${isLessonMenuOpen ? 'rotate-180' : ''}`}>
                              expand_more
                          </span>
                      </button>

                      {isLessonMenuOpen && (
                          <>
                              <div className="fixed inset-0 z-10" onClick={() => setIsLessonMenuOpen(false)} />
                              <div className={`absolute left-0 right-0 z-20 bg-white border border-[#f4f0f2] rounded-xl shadow-2xl p-1 animate-in fade-in duration-200 
                                  ${dropUp.lesson 
                                      ? "bottom-full mb-2 slide-in-from-bottom-2" // Đưa lên trên
                                      : "top-full mt-2 slide-in-from-top-2"      // Đưa xuống dưới
                                  }`}
                              >
                                  <div className="max-h-84 overflow-y-auto custom-scrollbar">
                                      <button 
                                          onClick={() => { setFormData({ ...formData, lessonID: '' }); setIsLessonMenuOpen(false); }}
                                          className="w-full text-left px-3 py-2 text-xs rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                                      >
                                          Không chọn bài học
                                      </button>
                                      <div className="h-px bg-[#f4f0f2] my-1" />
                                      {metadata.lessons.map(l => (
                                          <button 
                                              key={l.lessonID} 
                                              onClick={() => { setFormData({ ...formData, lessonID: l.lessonID }); setIsLessonMenuOpen(false); }}
                                              className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-between ${formData.lessonID === l.lessonID ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-primary/5 hover:text-primary'}`}
                                          >
                                              {l.title}
                                              {formData.lessonID === l.lessonID && <span className="material-symbols-outlined text-sm">check</span>}
                                          </button>
                                      ))}
                                  </div>
                              </div>
                          </>
                      )}
                  </div>
              </div>

              {/* 3. SECTION VISIBILITY */}
              <div className="pt-5 border-t border-[#f4f0f2]">
                  <label className="block text-xs font-bold text-[#886373] uppercase tracking-wider mb-2">Visibility</label>
                  <div className="relative">
                      <button 
                          onClick={(e) => handleOpenDropdown('visibility', e)}
                          className="w-full bg-[#fbf9fa] border border-[#f4f0f2] rounded-xl px-4 py-2.5 text-sm flex items-center justify-between hover:border-primary/30 transition-all outline-none"
                      >
                          <div className="flex items-center gap-2">
                              <span className={`size-2 rounded-full ${visibility === 'Published' ? 'bg-green-500' : visibility === 'Draft' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                              <span className="font-bold">{visibility}</span>
                          </div>
                          <span className={`material-symbols-outlined text-[#886373] transition-transform duration-300 ${isVisibilityMenuOpen ? 'rotate-180' : ''}`}>
                              expand_more
                          </span>
                      </button>

                      {isVisibilityMenuOpen && (
                          <>
                              <div className="fixed inset-0 z-10" onClick={() => setIsVisibilityMenuOpen(false)} />
                              <div className={`absolute left-0 right-0 z-20 bg-white border border-[#f4f0f2] rounded-xl shadow-2xl p-1 animate-in fade-in duration-200
                                  ${dropUp.visibility 
                                      ? "bottom-full mb-2 slide-in-from-bottom-2" 
                                      : "top-full mt-2 slide-in-from-top-2"
                                  }`}
                              >
                                  {['Published', 'Draft', 'Archived'].map((status) => (
                                      <button 
                                          key={status}
                                          onClick={() => { setVisibility(status); setIsVisibilityMenuOpen(false); }}
                                          className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-primary/5 hover:text-primary transition-colors flex items-center gap-2"
                                      >
                                          <span className={`size-2 rounded-full ${status === 'Published' ? 'bg-green-500' : status === 'Draft' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                                          {status}
                                      </button>
                                  ))}
                              </div>
                          </>
                      )}
                  </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

  const QuestionsSection: React.FC<{
    formData: CreateUpdateListeningDTO;
    setFormData: React.Dispatch<React.SetStateAction<CreateUpdateListeningDTO>>;
  }> = ({ formData, setFormData }) => {

  const addQuestion = () => {
      const currentLessonID = formData.lessonID; 

      // SỬA TẠI ĐÂY: Đổi CreateUpdateListeningDTO thành ListeningQuestionDTO
      const newQuestion: ListeningQuestionDTO = {
        content: '',
        imageURL: null,           // Khởi tạo null cho đúng interface
        mediaTimestamp: null,     // Khởi tạo null
        explanation: '',
        difficulty: 1,
        displayOrder: formData.questions.length + 1, // Tự động tính thứ tự
        lessonID: currentLessonID || '', 
        questionType: QuestionType.MultipleChoice, 
        status: QuestionStatus.Published,
        answers: [
          { answerText: '', isCorrect: false },
          { answerText: '', isCorrect: false },
          { answerText: '', isCorrect: false },
          { answerText: '', isCorrect: false }
        ]
      };

      setFormData(prev => ({
        ...prev,
        questions: [...prev.questions, newQuestion]
      }));
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleQuestionImageChange = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await convertFileToBase64(file);
        // Cập nhật ảnh cho câu hỏi cụ thể
        updateQuestion(index, "imageURL" as any, base64);
      } catch (error) {
        console.error("Lỗi khi chuyển đổi ảnh câu hỏi:", error);
      }
    }
  };

  const removeQuestion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const updateQuestion = (
    index: number,
    field: keyof QuestionDTO,
    value: any
  ) => {
    setFormData(prev => {
      const newQuestions = [...prev.questions];
      newQuestions[index] = { ...newQuestions[index], [field]: value };
      return { ...prev, questions: newQuestions };
    });
  };

  const updateAnswer = (
    qIndex: number,
    aIndex: number,
    value: string
  ) => {
    setFormData(prev => {
      const newQuestions = [...prev.questions];
      const newAnswers = [...newQuestions[qIndex].answers];

      newAnswers[aIndex] = {
        ...newAnswers[aIndex],
        answerText: value
      };

      newQuestions[qIndex].answers = newAnswers;

      return { ...prev, questions: newQuestions };
    });
  };

  const setCorrectAnswer = (qIndex: number, aIndex: number) => {
    setFormData(prev => {
      const newQuestions = [...prev.questions];

      const newAnswers = newQuestions[qIndex].answers.map((a, i) => ({
        ...a,
        isCorrect: i === aIndex
      }));

      newQuestions[qIndex].answers = newAnswers;

      return { ...prev, questions: newQuestions };
    });
  };

  return (
    <section className="bg-white rounded-2xl border border-[#f287b6]/10 shadow-sm overflow-hidden">
      {/* HEADER: Nằm bên trong khung lớn */}
      <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/30">
        <div className="flex items-center gap-2">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary">quiz</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Danh sách câu hỏi</h3>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
              Tổng số: {formData.questions.length} câu hỏi
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={addQuestion}
          className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-primary/20"
        >
          <span className="material-symbols-outlined text-sm">add_circle</span>
          Thêm câu hỏi mới
        </button>
      </div>

      {/* BODY: Danh sách các câu hỏi */}
      <div className="p-6 space-y-8">
        {formData.questions.map((q, qIndex) => (
          <div
            key={qIndex}
            className={`relative space-y-5 ${
              qIndex !== formData.questions.length - 1 ? "pb-8 border-b-2 border-dashed border-slate-100" : ""
            }`}
          >
            {/* QUESTION HEADER */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-50">
            <div className="flex items-center gap-3">
              <span className="bg-primary text-white size-8 flex items-center justify-center rounded-lg font-bold text-sm shadow-sm shadow-primary/30">
                {qIndex + 1}
              </span>
              <span className="font-bold text-slate-700 uppercase tracking-wider text-sm">
                Nội dung câu hỏi
              </span>
            </div>

            <button
                type="button"
                onClick={() => removeQuestion(qIndex)}
                className="size-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
                title="Xóa câu hỏi"
              >
                <span className="material-symbols-outlined text-lg">delete</span>
              </button>
          </div>

            {/* QUESTION CONTENT - Giao diện hình ở trên bài tập nghe */}
            <div className="flex flex-col gap-4">
              
              {/* KHU VỰC HÌNH ẢNH (BỰ NẰM TRÊN) */}
              <div className="w-full flex flex-col items-center space-y-2">
                
                <div className="relative group w-150 h-120">
                  <input
                    type="file"
                    id={`q-img-${qIndex}`}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleQuestionImageChange(qIndex, e)}
                  />
                  
                  {q.imageURL && q.imageURL !== "" ? (
                    <div className="relative w-150 h-120 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 group shadow-sm">
                      <img 
                        src={q.imageURL} 
                        alt="Question illustration" 
                        className="w-full h-full object-contain bg-white"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-[2px]">
                        <label 
                          htmlFor={`q-img-${qIndex}`} 
                          className="cursor-pointer px-4 py-2 rounded-xl bg-white text-slate-800 text-xs font-bold flex items-center gap-2 hover:bg-primary hover:text-white transition-all transform translate-y-2 group-hover:translate-y-0"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span> Thay đổi ảnh
                        </label>
                        <button 
                          type="button"
                          // Chuyển về chuỗi rỗng để đồng nhất
                          onClick={() => updateQuestion(qIndex, "imageURL" as any, "")}
                          className="px-4 py-2 rounded-xl bg-white text-red-500 text-xs font-bold flex items-center gap-2 hover:bg-red-500 hover:text-white transition-all transform translate-y-2 group-hover:translate-y-0"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span> Xóa ảnh
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Khung Upload khi chưa có ảnh (Bự ngang bằng ảnh)
                    <label 
                      htmlFor={`q-img-${qIndex}`}
                      className="flex flex-col items-center justify-center w-150 h-120 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 hover:bg-primary/5 hover:border-primary/30 cursor-pointer transition-all group"
                    >
                      <div className="size-12 rounded-full bg-white flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-3xl text-slate-300 group-hover:text-primary">add_a_photo</span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-400 group-hover:text-primary uppercase tracking-widest">
                        Tải lên hình ảnh cho câu hỏi này
                      </span>
                      <span className="text-[9px] text-slate-300 mt-1 italic">Khuyên dùng tỷ lệ 16:9 hoặc ảnh vuông</span>
                    </label>
                  )}
                </div>
              </div>

              {/* KHU VỰC VĂN BẢN (NẰM DƯỚI) */}
              <div className="w-full space-y-2">
                <textarea
                  value={q.content}
                  onChange={(e) => updateQuestion(qIndex, "content", e.target.value)}
                  placeholder="Nhập nội dung câu hỏi..."
                  className="w-full border-slate-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all min-h-22.5 bg-slate-50/50 border hover:border-slate-300"
                />
              </div>

            </div>

            {/* ANSWERS GRID */}
            <div className="grid grid-cols-2 gap-4">
              {q.answers.map((answer, aIndex) => (
                <div
                  key={aIndex}
                  className={`group border-2 rounded-xl p-3 flex items-center gap-3 transition-all ${
                    answer.isCorrect
                      ? "border-green-500 bg-green-50/30 ring-4 ring-green-500/5"
                      : "border-slate-100 hover:border-slate-200 bg-white shadow-sm"
                  }`}
                >
                  {/* TỰ ĐỘNG A. B. C. D. */}
                  <div className={`size-7 flex items-center justify-center rounded-lg font-bold text-xs shrink-0 transition-colors ${
                    answer.isCorrect 
                      ? "bg-green-500 text-white shadow-sm" 
                      : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                  }`}>
                    {String.fromCharCode(65 + aIndex)}
                  </div>

                  {/* ANSWER INPUT */}
                  <input
                    value={answer.answerText}
                    onChange={(e) => updateAnswer(qIndex, aIndex, e.target.value)}
                    placeholder={`Đáp án ${String.fromCharCode(65 + aIndex)}...`}
                    className="flex-1 bg-transparent outline-none text-sm font-medium text-slate-700"
                  />

                  {/* CUSTOM RADIO CHỌN ĐÚNG */}
                  <label className="relative flex items-center cursor-pointer p-1">
                    <input
                      type="radio"
                      name={`correct-${qIndex}`}
                      checked={answer.isCorrect}
                      onChange={() => setCorrectAnswer(qIndex, aIndex)}
                      className="sr-only"
                    />
                    <div className={`size-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      answer.isCorrect 
                        ? "border-green-500 bg-green-500 scale-110 shadow-sm" 
                        : "border-slate-200 bg-white group-hover:border-primary"
                    }`}>
                      {answer.isCorrect && (
                        <span className="material-symbols-outlined text-[16px] text-white font-bold">check</span>
                      )}
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* EMPTY STATE */}
        {formData.questions.length === 0 && (
          <div className="text-center py-12 flex flex-col items-center">
            <div className="size-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-4xl text-slate-200">draft_orders</span>
            </div>
            <p className="text-slate-400 text-sm font-medium">Chưa có câu hỏi nào được tạo cho bài nghe này.</p>
          </div>
        )}
      </div>
    </section>
  );
};

// Các Sub-components hỗ trợ
const ToolbarButton: React.FC<{ icon: string; active?: boolean }> = ({ icon, active }) => (
  <button className={`p-1 px-2 border-r last:border-0 ${active ? 'bg-[#f287b6] text-white' : 'bg-slate-50 text-slate-600'}`}>
    <span className="material-symbols-outlined text-sm">{icon}</span>
  </button>
);

const Tag: React.FC<{ label: string }> = ({ label }) => (
  <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-medium text-slate-600 flex items-center gap-1">
    {label} <button className="hover:text-red-500 transition-colors"><span className="material-symbols-outlined text-xs">close</span></button>
  </span>
);

export default ListenEditor;