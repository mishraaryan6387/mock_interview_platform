import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Send, 
  RotateCcw, 
  SkipForward, 
  Play, 
  Pause,
  Bot, 
  User, 
  Sparkles,
  Clock,
  CheckCircle2,
  ListFilter,
  MessageSquare
} from 'lucide-react';

export default function InterviewView({
  sessionData,
  chatHistory,
  currentQuestionIndex,
  totalQuestions,
  currentQuestionText,
  currentQuestionMeta,
  interviewerState, // 'speaking', 'listening', 'thinking', 'idle'
  onSubmitAnswer,
  onReplayAudio,
  onEndInterview,
  isAudioPlaying,
  onStopAudio
}) {
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [interimTranscript, setInterimTranscript] = useState('');

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const transcriptEndRef = useRef(null);

  // Initialize Web Speech API for real-time speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let currentInterim = '';
      let finalChunk = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalChunk += transcriptPart + ' ';
        } else {
          currentInterim += transcriptPart;
        }
      }

      if (finalChunk) {
        setTranscript(prev => (prev ? prev + ' ' : '') + finalChunk.trim());
      }
      setInterimTranscript(currentInterim);
    };

    recognition.onerror = (event) => {
      console.warn("Speech recognition error:", event.error);
      if (event.error === 'not-allowed') {
        alert("Microphone permission was denied. Please allow microphone access or type your answer in the box.");
      }
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch (e) {}
    };
  }, []);

  // Timer for recording duration
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setRecordingDuration(0);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  // Scroll to bottom of chat history when it updates
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Toggle Recording
  const toggleRecording = () => {
    if (isAudioPlaying) {
      onStopAudio();
    }

    if (isRecording) {
      try {
        recognitionRef.current?.stop();
      } catch (e) {}
      setIsRecording(false);
    } else {
      try {
        setInterimTranscript('');
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch (e) {
        console.error("Could not start speech recognition:", e);
        setIsRecording(false);
      }
    }
  };

  const handleSubmit = () => {
    const fullAnswer = (transcript + ' ' + interimTranscript).trim();
    if (!fullAnswer) return;

    if (isRecording) {
      try {
        recognitionRef.current?.stop();
      } catch (e) {}
      setIsRecording(false);
    }

    onSubmitAnswer(fullAnswer);
    setTranscript('');
    setInterimTranscript('');
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const formatSeconds = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = Math.min(100, Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100));

  return (
    <div className="app-container">
      {/* Top Progress Bar */}
      <div style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>
            Session Progress: <strong style={{ color: 'white' }}>Question {currentQuestionIndex + 1} of {totalQuestions}</strong>
          </span>
          <span style={{ color: 'var(--primary-light)', fontWeight: 600 }}>
            {progressPercent}% Completed
          </span>
        </div>
        <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
          <div 
            style={{ 
              height: '100%', 
              width: `${progressPercent}%`, 
              background: 'linear-gradient(90deg, var(--primary) 0%, var(--accent-cyan) 100%)',
              transition: 'width 0.4s ease'
            }} 
          />
        </div>
      </div>

      <div className="interview-layout">
        {/* Main Stage */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Interviewer Box */}
          <div className="glass-card interviewer-box">
            <div className="card-glow-top" />
            
            <div className="interviewer-header">
              <div className="avatar-wrapper">
                <div className={`avatar-disc ${interviewerState}`}>
                  <Bot size={34} style={{ color: '#ffffff' }} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem' }}>Josh</h3>
                    <span style={{ 
                      fontSize: '0.72rem', 
                      background: 'rgba(99, 102, 241, 0.2)', 
                      color: 'var(--primary-light)',
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-pill)',
                      fontWeight: 600
                    }}>
                      AI Interviewer
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                    {interviewerState === 'speaking' && 'Speaking question...'}
                    {interviewerState === 'listening' && 'Listening attentively to your answer...'}
                    {interviewerState === 'thinking' && 'Analyzing response and formulating next query...'}
                    {interviewerState === 'idle' && 'Waiting for your response'}
                  </div>
                </div>
              </div>

              {/* Sound wave visualizer */}
              <div className={`soundwave-container ${interviewerState}`}>
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="soundwave-bar" />
                ))}
              </div>
            </div>

            {/* Question Card */}
            <div className="question-content">
              <div className="question-meta">
                <span className="chip active" style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
                  Question {currentQuestionIndex + 1} / {totalQuestions}
                </span>
                {currentQuestionMeta?.difficulty && (
                  <span className={`chip difficulty-${currentQuestionMeta.difficulty} active`} style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
                    {currentQuestionMeta.difficulty.toUpperCase()}
                  </span>
                )}
                {currentQuestionMeta?.main_subject && (
                  <span className="chip" style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
                    {currentQuestionMeta.main_subject}
                  </span>
                )}
              </div>

              <div className="question-text">
                {currentQuestionText || 'Loading question...'}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '1.25rem' }}>
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}
                  onClick={onReplayAudio}
                  title="Replay interviewer voice"
                >
                  <Volume2 size={15} />
                  <span>Replay Voice</span>
                </button>

                {isAudioPlaying && (
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}
                    onClick={onStopAudio}
                    title="Stop speaking"
                  >
                    <VolumeX size={15} />
                    <span>Mute</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Candidate Response Station */}
          <div className="glass-card response-station" style={{ padding: '2rem' }}>
            <div className="card-glow-top" />
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <User size={18} style={{ color: 'var(--accent-cyan)' }} />
                  <span>Your Answer</span>
                </h3>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Speak using your microphone or type/edit your response below.
                </span>
              </div>

              {isRecording && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  color: 'var(--accent-rose)',
                  fontWeight: 600,
                  fontSize: '0.88rem' 
                }}>
                  <div className="status-dot" style={{ background: 'var(--accent-rose)', boxShadow: '0 0 10px red' }} />
                  <span>Recording {formatSeconds(recordingDuration)}</span>
                </div>
              )}
            </div>

            {/* Central Voice Action Hero */}
            <div className="voice-action-hero">
              <button
                type="button"
                className={`mic-button-big ${isRecording ? 'recording' : ''}`}
                onClick={toggleRecording}
                title={isRecording ? 'Click to stop recording' : 'Click to start speaking'}
              >
                {isRecording ? <MicOff size={36} /> : <Mic size={36} />}
              </button>
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '-0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: isRecording ? 'var(--accent-rose)' : 'var(--text-muted)' }}>
                {isRecording ? 'Listening... Click button when done speaking' : 'Tap to Speak Your Answer'}
              </span>
            </div>

            {/* Editable Transcript Area */}
            <div>
              <textarea
                className="transcript-textarea"
                placeholder="Your spoken words will appear here in real-time. You can also type or edit directly..."
                value={transcript + (interimTranscript ? (transcript ? ' ' : '') + interimTranscript : '')}
                onChange={(e) => {
                  setTranscript(e.target.value);
                  setInterimTranscript('');
                }}
                onKeyDown={handleKeyDown}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                <span>Tip: Press Ctrl + Enter to submit answer</span>
                {transcript && (
                  <button 
                    type="button" 
                    style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => { setTranscript(''); setInterimTranscript(''); }}
                  >
                    Clear text
                  </button>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => onEndInterview()}
                  title="Conclude interview early and generate evaluation"
                >
                  End & Evaluate Early
                </button>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                style={{ padding: '0.75rem 1.75rem', fontSize: '1rem' }}
                onClick={handleSubmit}
                disabled={!(transcript.trim() || interimTranscript.trim()) || interviewerState === 'thinking'}
              >
                <span>Submit Answer</span>
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Live Transcript Timeline */}
        <aside className="glass-card timeline-card">
          <div className="card-glow-top" />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.95rem' }}>
              <MessageSquare size={16} style={{ color: 'var(--primary-light)' }} />
              <span>Session Timeline</span>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
              {chatHistory.length} turns
            </span>
          </div>

          <div className="timeline-list">
            {chatHistory.map((item, idx) => (
              <div 
                key={idx} 
                className={`timeline-item ${item.role === 'interviewer' ? 'interviewer' : 'candidate'}`}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginBottom: '0.3rem',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: item.role === 'interviewer' ? 'var(--primary-light)' : 'var(--accent-emerald)'
                }}>
                  <span>{item.role === 'interviewer' ? 'Josh (Interviewer)' : 'You (Candidate)'}</span>
                </div>
                <div style={{ color: 'var(--text-main)', fontSize: '0.88rem', lineHeight: '1.45', wordBreak: 'break-word' }}>
                  {item.content}
                </div>
              </div>
            ))}
            <div ref={transcriptEndRef} />
          </div>
        </aside>
      </div>
    </div>
  );
}
