import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Terminal, 
  Upload, 
  CheckCircle, 
  Check, 
  Mic, 
  Volume2, 
  Sparkles, 
  Layers, 
  Flame, 
  FileCheck, 
  ChevronRight,
  Sliders,
  HelpCircle
} from 'lucide-react';

export default function SetupView({
  metadata,
  onStartInterview,
  onTestSpeaker,
  isTestingSpeaker
}) {
  const [interviewType, setInterviewType] = useState('cv'); // 'cv' or 'technical'
  
  // CV State
  const [cvFile, setCvFile] = useState(null);
  const [cvExtractedText, setCvExtractedText] = useState('');
  const [cvStats, setCvStats] = useState(null);
  const [isUploadingCv, setIsUploadingCv] = useState(false);
  const [cvUploadError, setCvUploadError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Technical State
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState(['easy', 'medium', 'hard']);
  const [questionCount, setQuestionCount] = useState(5);

  // Device Readiness
  const [micTested, setMicTested] = useState(false);
  const [isTestingMic, setIsTestingMic] = useState(false);

  // Handle PDF file upload
  const processPdfFile = async (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setCvUploadError('Please upload a PDF document.');
      return;
    }

    setIsUploadingCv(true);
    setCvUploadError('');
    setCvFile(file);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/cv/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to extract text from PDF');
      }

      const data = await res.json();
      setCvExtractedText(data.extracted_text);
      setCvStats({
        words: data.word_count,
        chars: data.character_count,
        preview: data.preview,
      });
    } catch (err) {
      console.error(err);
      setCvUploadError(err.message || 'Error parsing PDF document.');
    } finally {
      setIsUploadingCv(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processPdfFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      processPdfFile(e.target.files[0]);
    }
  };

  // Load sample CV for quick evaluation
  const handleLoadSampleCv = () => {
    const sampleText = `Aryan Mishra - AI & Full Stack Machine Learning Engineer
Experience:
- Built real-time LLM agents with RAG pipelines, FastAPI, and Coqui TTS voice generation.
- Designed distributed training pipelines using PyTorch, Hugging Face transformers, and Docker.
- Integrated OpenAI, Ollama, and Whisper for speech-to-text automated interviews.
Skills: Python, PyTorch, LangChain, FastAPI, Docker, Streamlit, React, Node.js, NLP, LLMs.
Education: Bachelor of Technology in Computer Science & Engineering.`;
    setCvExtractedText(sampleText);
    setCvStats({
      words: 62,
      chars: 420,
      preview: sampleText,
    });
    setCvFile({ name: 'Aryan_Mishra_Sample_Resume.pdf' });
    setCvUploadError('');
  };

  // Filter Toggles
  const toggleCategory = (cat) => {
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const toggleSubject = (sub) => {
    setSelectedSubjects(prev => 
      prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub]
    );
  };

  const toggleDifficulty = (diff) => {
    setSelectedDifficulties(prev => 
      prev.includes(diff) ? (prev.length > 1 ? prev.filter(d => d !== diff) : prev) : [...prev, diff]
    );
  };

  // Test Microphone
  const testMicrophone = async () => {
    setIsTestingMic(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setTimeout(() => {
        stream.getTracks().forEach(track => track.stop());
        setMicTested(true);
        setIsTestingMic(false);
      }, 1500);
    } catch (err) {
      console.warn("Mic access error:", err);
      setIsTestingMic(false);
      alert("Microphone permission was not granted or microphone is not plugged in. You can still type your answers manually!");
    }
  };

  // Validation
  const canStart = interviewType === 'cv' ? !!cvExtractedText : true;

  const handleStart = () => {
    if (!canStart) return;
    onStartInterview({
      type: interviewType,
      cvText: cvExtractedText,
      categories: selectedCategories,
      subjects: selectedSubjects,
      difficulties: selectedDifficulties,
      count: questionCount
    });
  };

  return (
    <section className="app-container" style={{ paddingBottom: '4rem' }}>
      {/* Hero Header */}
      <div className="hero-section">
        <div className="hero-pill">
          <Sparkles size={14} />
          <span>Next-Gen Voice-Enabled Mock Interview Platform</span>
        </div>
        <h1>Master Your Next AI Job Interview</h1>
        <p className="hero-subtitle">
          Experience hyper-realistic interview simulations powered by LLMs and intelligent voice assistants. 
          Upload your resume for customized questioning, or dive into technical AI problem sets.
        </p>
      </div>

      {/* Mode Selection Cards */}
      <div className="mode-grid">
        {/* Card 1: CV-based Interview */}
        <article 
          className={`glass-card mode-card ${interviewType === 'cv' ? 'active' : ''}`}
          onClick={() => setInterviewType('cv')}
        >
          <div className="card-glow-top" />
          <div>
            <div className="mode-card-header">
              <div className="mode-icon">
                <FileText size={26} />
              </div>
              <div className="mode-check">
                {interviewType === 'cv' && <Check size={16} />}
              </div>
            </div>

            <h2 className="mode-title">CV-Based Interview</h2>
            <p style={{ fontSize: '0.92rem', marginBottom: '1.25rem' }}>
              Personalized behavioral and deep technical questioning tailored directly to your projects, skills, and work history.
            </p>

            <ul className="mode-features">
              <li><Check size={14} /> Intelligent resume parsing & skill extraction</li>
              <li><Check size={14} /> Dynamic project drill-down questions</li>
              <li><Check size={14} /> Real-time natural speech dialogue</li>
            </ul>

            {/* Dropzone area */}
            {interviewType === 'cv' && (
              <div style={{ marginTop: '1.5rem' }} onClick={(e) => e.stopPropagation()}>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".pdf"
                  style={{ display: 'none' }}
                />

                <div 
                  className={`dropzone ${isDragOver ? 'dragover' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="dropzone-icon" />
                  <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                    {isUploadingCv ? 'Analyzing PDF resume...' : (cvFile ? cvFile.name : 'Click or drag & drop your CV (PDF)')}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    Extracts projects, tools, and technical experience
                  </div>
                </div>

                {cvUploadError && (
                  <div style={{ color: 'var(--accent-rose)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                    {cvUploadError}
                  </div>
                )}

                {cvStats && (
                  <div style={{ 
                    marginTop: '0.85rem', 
                    padding: '0.85rem', 
                    background: 'rgba(16, 185, 129, 0.08)', 
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                      <FileCheck size={16} />
                      <span>Resume Parsed Successfully</span>
                    </div>
                    <div style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      {cvStats.words} words extracted. Josh is ready to interview you on your background!
                    </div>
                  </div>
                )}

                {!cvExtractedText && (
                  <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
                    <button 
                      type="button"
                      className="btn btn-secondary" 
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                      onClick={handleLoadSampleCv}
                    >
                      Use Sample AI Candidate Profile
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </article>

        {/* Card 2: Technical Interview */}
        <article 
          className={`glass-card mode-card ${interviewType === 'technical' ? 'active' : ''}`}
          onClick={() => setInterviewType('technical')}
        >
          <div className="card-glow-top" />
          <div>
            <div className="mode-card-header">
              <div className="mode-icon cyan">
                <Terminal size={26} />
              </div>
              <div className="mode-check">
                {interviewType === 'technical' && <Check size={16} />}
              </div>
            </div>

            <h2 className="mode-title">Technical AI Interview</h2>
            <p style={{ fontSize: '0.92rem', marginBottom: '1.25rem' }}>
              Practice core AI/ML conceptual and architectural questions from a verified database of industry interview problems.
            </p>

            <ul className="mode-features">
              <li><Check size={14} /> Generative AI, GANs, Deep Learning & Transformers</li>
              <li><Check size={14} /> Difficulty levels: Easy, Medium, and Hard</li>
              <li><Check size={14} /> Conversational verbal reformulation & answer scoring</li>
            </ul>

            {/* Technical Filters */}
            {interviewType === 'technical' && (
              <div style={{ marginTop: '1.25rem' }} onClick={(e) => e.stopPropagation()}>
                {/* Difficulties */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                    Difficulty Levels:
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {['easy', 'medium', 'hard'].map(d => (
                      <span
                        key={d}
                        className={`chip difficulty-${d} ${selectedDifficulties.includes(d) ? 'active' : ''}`}
                        onClick={() => toggleDifficulty(d)}
                      >
                        {d.charAt(0).toUpperCase() + d.slice(1)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Popular Categories */}
                {metadata?.categories && metadata.categories.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                      Categories (Optional filter):
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', maxHeight: '110px', overflowY: 'auto' }}>
                      {metadata.categories.slice(0, 8).map(c => (
                        <span
                          key={c}
                          className={`chip ${selectedCategories.includes(c) ? 'active' : ''}`}
                          onClick={() => toggleCategory(c)}
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ fontSize: '0.82rem', color: 'var(--accent-cyan)', fontWeight: 500 }}>
                  ✓ Standard session: 2 Easy, 2 Medium, 1 Hard question
                </div>
              </div>
            )}
          </div>
        </article>
      </div>

      {/* Device Readiness & Sound Check Bar */}
      <div className="glass-card" style={{ padding: '1.5rem 2rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '1rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sliders size={18} style={{ color: 'var(--primary-light)' }} />
              <span>Interactive Audio Setup</span>
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Ensure your microphone and speakers are ready for full two-way voice conversation.
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <button
              type="button"
              className={`btn ${micTested ? 'btn-secondary' : 'btn-secondary'}`}
              style={{ 
                borderColor: micTested ? 'var(--accent-emerald)' : undefined, 
                color: micTested ? 'var(--accent-emerald)' : undefined 
              }}
              onClick={testMicrophone}
            >
              <Mic size={16} />
              <span>{isTestingMic ? 'Checking mic...' : (micTested ? 'Microphone Ready ✓' : 'Test Microphone')}</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={onTestSpeaker}
              disabled={isTestingSpeaker}
            >
              <Volume2 size={16} />
              <span>{isTestingSpeaker ? 'Playing Voice Sample...' : 'Test Speaker Voice'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Start Interview CTA */}
      <div style={{ textAlign: 'center' }}>
        <button
          type="button"
          className="btn btn-primary"
          style={{ 
            fontSize: '1.15rem', 
            padding: '1rem 2.8rem', 
            borderRadius: 'var(--radius-pill)',
            opacity: canStart ? 1 : 0.6
          }}
          onClick={handleStart}
          disabled={!canStart}
        >
          <span>Launch Mock Interview</span>
          <ChevronRight size={20} />
        </button>

        {!canStart && (
          <div style={{ marginTop: '0.75rem', fontSize: '0.88rem', color: 'var(--text-dim)' }}>
            Please upload a PDF resume or click "Use Sample AI Candidate Profile" above to begin.
          </div>
        )}
      </div>
    </section>
  );
}
