import React, { useState } from 'react';

const ListeningEditorPage: React.FC = () => {
  const [formData, setFormData] = useState({
    title: '',
    level: 'N5',
    duration: 0,
    transcript: '田中さんは[公園]{こうえん}で[走]{はし}っています。',
    questions: [
      {
        id: '1',
        content: 'What is Tanaka doing?',
        answers: [
          { answerText: 'Running in the park', isCorrect: true },
          { answerText: 'Eating at home', isCorrect: false },
          { answerText: 'Sleeping in a library', isCorrect: false },
          { answerText: 'Working in an office', isCorrect: false },
        ]
      }
    ]
  });

  // Hàm render Furigana cho bản xem trước transcript
  const renderFurigana = (text: string) => {
    const regex = /\[(.*?)\]\{(.*?)\}/g; // Dùng {} theo template của bạn
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      parts.push(
        <ruby key={match.index} className="mx-0.5">
          {match[1]}
          <rt className="text-[0.6em] text-primary">{match[2]}</rt>
        </ruby>
      );
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    return parts.length > 0 ? parts : text;
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-light font-['Lexend'] text-slate-900">
      {/* Top Navigation */}
      <header className="flex items-center justify-between border-b border-[#f287b6]/20 bg-white/80 backdrop-blur-md px-6 md:px-10 py-3 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="size-8 bg-[#f287b6] rounded-lg flex items-center justify-center text-white">
            <span className="material-symbols-outlined">headset</span>
          </div>
          <h2 className="text-lg font-bold">KotoAdmin</h2>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex bg-[#f287b6]/10 rounded-full px-4 py-2 items-center gap-2">
            <span className="material-symbols-outlined text-slate-500 text-xl">search</span>
            <input className="bg-transparent border-none focus:ring-0 text-sm w-40 lg:w-64" placeholder="Search lessons..." />
          </div>
          <div className="size-10 rounded-full bg-[#f287b6]/30 border-2 border-[#f287b6]"></div>
        </div>
      </header>

      <div className="flex flex-1">

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-10 max-w-6xl mx-auto w-full">
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight">Create Listening Exercise</h1>
              <p className="text-slate-500">Configure audio, transcripts, and quiz questions.</p>
            </div>
            <div className="flex gap-3">
              <button className="px-6 py-2.5 rounded-full border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50">Discard</button>
              <button className="px-6 py-2.5 rounded-full bg-[#f287b6] text-white font-semibold hover:bg-[#f287b6]/90 shadow-lg shadow-[#f287b6]/20">Save Exercise</button>
            </div>
          </div>

          <div className="space-y-8">
            {/* General Info */}
            <section className="bg-white rounded-xl p-6 border border-[#f287b6]/10 shadow-sm">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#f287b6]">info</span> General Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-semibold">Exercise Title</label>
                  <input 
                    className="w-full rounded-xl border-slate-200 focus:border-[#f287b6] focus:ring-[#f287b6]/20" 
                    type="text" 
                    placeholder="Morning Routine"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">JLPT Level</label>
                  <select className="w-full rounded-xl border-slate-200 focus:border-[#f287b6] focus:ring-[#f287b6]/20">
                    <option>N5</option><option>N4</option><option>N3</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Audio Upload */}
            <section className="bg-white rounded-xl p-6 border border-[#f287b6]/10 shadow-sm">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#f287b6]">audiotrack</span> Audio Configuration
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="border-2 border-dashed border-[#f287b6]/30 rounded-xl p-10 flex flex-col items-center justify-center bg-[#f287b6]/5 hover:bg-[#f287b6]/10 cursor-pointer group transition-all">
                  <div className="size-16 rounded-full bg-white flex items-center justify-center text-[#f287b6] shadow-sm group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-3xl">upload_file</span>
                  </div>
                  <p className="mt-4 font-bold">Upload audio file</p>
                  <p className="text-slate-500 text-sm">MP3, WAV (Max 20MB)</p>
                </div>
                <div className="space-y-6">
                  <div className="p-4 bg-background-light rounded-xl border border-[#f287b6]/10">
                    <div className="flex items-center gap-3">
                      <button className="size-8 rounded-full bg-[#f287b6] text-white flex items-center justify-center shadow-sm">
                        <span className="material-symbols-outlined text-sm">play_arrow</span>
                      </button>
                      <div className="flex-1 h-1 bg-slate-200 rounded-full relative overflow-hidden">
                        <div className="absolute inset-y-0 left-0 w-1/3 bg-[#f287b6]"></div>
                      </div>
                      <span className="text-xs font-mono text-slate-500">0:45 / 2:30</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Transcript & Preview */}
            <section className="bg-white rounded-xl p-6 border border-[#f287b6]/10 shadow-sm">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#f287b6]">description</span> Transcript
              </h2>
              <textarea 
                className="w-full rounded-xl border-slate-200 focus:border-[#f287b6] focus:ring-[#f287b6]/20 p-4 min-h-37.5"
                value={formData.transcript}
                onChange={(e) => setFormData({...formData, transcript: e.target.value})}
              />
              <div className="mt-4 p-4 bg-[#f287b6]/5 rounded-xl border border-dashed border-[#f287b6]/30">
                <p className="text-xs font-bold text-[#f287b6] uppercase mb-2">Live Preview</p>
                <div className="text-lg leading-[2.5] text-slate-800">
                  {renderFurigana(formData.transcript)}
                </div>
              </div>
            </section>

            {/* Questions */}
            <section className="bg-white rounded-xl p-6 border border-[#f287b6]/10 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#f287b6]">quiz</span> Questions
                </h2>
                <button className="flex items-center gap-1 px-4 py-2 bg-[#f287b6]/10 text-[#f287b6] rounded-full text-sm font-bold hover:bg-[#f287b6]/20">
                  <span className="material-symbols-outlined text-sm">add</span> Add Question
                </button>
              </div>
              
              {formData.questions.map((q, idx) => (
                <div key={q.id} className="border border-slate-100 rounded-xl p-5 bg-background-light/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="size-6 bg-slate-900 text-white text-xs font-bold flex items-center justify-center rounded-full">{idx + 1}</span>
                      <h3 className="font-bold">{q.content}</h3>
                    </div>
                    <div className="flex gap-2">
                      <button className="text-slate-400 hover:text-[#f287b6]"><span className="material-symbols-outlined">edit</span></button>
                      <button className="text-slate-400 hover:text-red-500"><span className="material-symbols-outlined">delete</span></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {q.answers.map((ans, aIdx) => (
                      <div 
                        key={aIdx} 
                        className={`flex items-center gap-3 p-3 bg-white border-2 rounded-xl text-sm ${
                          ans.isCorrect ? 'border-[#f287b6]' : 'border-slate-200 text-slate-500'
                        }`}
                      >
                        <span className={`material-symbols-outlined ${ans.isCorrect ? 'text-[#f287b6]' : 'text-slate-200'}`}>
                          {ans.isCorrect ? 'check_circle' : 'circle'}
                        </span>
                        {ans.answerText}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ListeningEditorPage;