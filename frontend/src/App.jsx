import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import SetupView from './components/SetupView';
import InterviewView from './components/InterviewView';
import EvaluationView from './components/EvaluationView';
import SettingsModal from './components/SettingsModal';

export default function App() {
  const [view, setView] = useState('setup'); // 'setup' | 'interview' | 'evaluation'
  const [config, setConfig] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTestingSpeaker, setIsTestingSpeaker] = useState(false);

  // Interview state
  const [interviewSession, setInterviewSession] = useState({
    type: 'cv',
    cvText: '',
    selectedQuestions: [],
    currentQuestionIndex: 0,
    totalQuestions: 4,
    currentQuestionText: '',
    currentQuestionMeta: null,
    chatHistory: [],
    interviewData: []
  });

  const [interviewerState, setInterviewerState] = useState('idle'); // 'speaking' | 'listening' | 'thinking' | 'idle'
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [reportText, setReportText] = useState('');

  const currentAudioRef = useRef(null);

  // Load initial backend config and question metadata
  useEffect(() => {
    fetchConfig();
    fetchMetadata();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (err) {
      console.warn("Could not reach backend config endpoint:", err);
    }
  };

  const fetchMetadata = async () => {
    try {
      const res = await fetch('/api/questions/metadata');
      if (res.ok) {
        const data = await res.json();
        setMetadata(data);
      }
    } catch (err) {
      console.warn("Could not load questions metadata:", err);
    }
  };

  // Stop any active audio
  const stopAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsAudioPlaying(false);
    if (interviewerState === 'speaking') {
      setInterviewerState('idle');
    }
  };

  // Text-To-Speech Playback with Coqui TTS and high-quality Browser Fallback
  const playTextAudio = async (text) => {
    stopAudio();
    if (!text) return;

    setInterviewerState('speaking');
    setIsAudioPlaying(true);

    try {
      // 1. Try Coqui TTS from backend
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text,
          speaker_id: config?.preferred_speaker || 'p230'
        })
      });

      const contentType = res.headers.get('content-type') || '';

      if (res.ok && contentType.includes('audio/wav')) {
        const blob = await res.blob();
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        currentAudioRef.current = audio;

        audio.onended = () => {
          setIsAudioPlaying(false);
          setInterviewerState('idle');
          currentAudioRef.current = null;
        };

        audio.onerror = () => {
          fallbackBrowserSpeech(text);
        };

        await audio.play();
        return;
      }
    } catch (e) {
      console.warn("TTS API unavailable; switching to browser SpeechSynthesis:", e);
    }

    // 2. Fallback to Browser SpeechSynthesis API
    fallbackBrowserSpeech(text);
  };

  const fallbackBrowserSpeech = (text) => {
    if (!('speechSynthesis' in window)) {
      setIsAudioPlaying(false);
      setInterviewerState('idle');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = parseFloat(config?.voice_speed || '1.0');
    utterance.pitch = 1.0;

    // Pick a natural English voice if available
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Guy') || v.name.includes('Male')));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onend = () => {
      setIsAudioPlaying(false);
      setInterviewerState('idle');
    };

    utterance.onerror = () => {
      setIsAudioPlaying(false);
      setInterviewerState('idle');
    };

    window.speechSynthesis.speak(utterance);
  };

  // Test Speaker button
  const handleTestSpeaker = async () => {
    setIsTestingSpeaker(true);
    const testPhrase = "Hello! I am Josh, your virtual AI interviewer. My audio is configured and ready.";
    await playTextAudio(testPhrase);
    setTimeout(() => setIsTestingSpeaker(false), 2000);
  };

  // Start Interview Flow
  const handleStartInterview = async (setupOptions) => {
    const { type, cvText, categories, subjects, difficulties, count } = setupOptions;

    stopAudio();

    if (type === 'cv') {
      const introPrompt = "Hello dear candidate, I am Josh, your virtual voice assistant for this AI role interview. Please introduce yourself briefly and mention the highlights of your experience. When you finish speaking, submit your answer and we'll dive in.";

      const initialHistory = [
        { role: 'interviewer', content: introPrompt }
      ];

      setInterviewSession({
        type: 'cv',
        cvText: cvText,
        selectedQuestions: [],
        currentQuestionIndex: 0,
        totalQuestions: 4,
        currentQuestionText: introPrompt,
        currentQuestionMeta: { difficulty: 'behavioral', main_subject: 'CV Introduction' },
        chatHistory: initialHistory,
        interviewData: []
      });

      setView('interview');
      playTextAudio(introPrompt);

    } else {
      // Technical Interview
      setInterviewerState('thinking');
      try {
        const filterRes = await fetch('/api/questions/filter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            categories: categories.length ? categories : undefined,
            subjects: subjects.length ? subjects : undefined,
            difficulties: difficulties.length ? difficulties : undefined,
            count: count || 5
          })
        });

        const filterData = await filterRes.json();
        const selected = filterData.selected_questions || [];

        const introPrompt = "Hello dear candidate, I am Josh, your virtual voice assistant for this technical interview for an AI role. I'll be asking you a series of technical questions to assess your knowledge and problem-solving skills. Let's start with a brief introduction. Please tell me about your background in AI and machine learning.";

        const initialHistory = [
          { role: 'interviewer', content: introPrompt }
        ];

        setInterviewSession({
          type: 'technical',
          cvText: '',
          selectedQuestions: selected,
          currentQuestionIndex: 0,
          totalQuestions: selected.length + 1, // Intro + tech questions
          currentQuestionText: introPrompt,
          currentQuestionMeta: { difficulty: 'easy', main_subject: 'AI Introduction' },
          chatHistory: initialHistory,
          interviewData: []
        });

        setView('interview');
        playTextAudio(introPrompt);
      } catch (err) {
        console.error("Error setting up technical interview:", err);
        setInterviewerState('idle');
      }
    }
  };

  // Submit Answer Handlers
  const handleSubmitAnswer = async (candidateAnswer) => {
    stopAudio();
    const currentHist = [...interviewSession.chatHistory, { role: 'candidate', content: candidateAnswer }];

    setInterviewSession(prev => ({
      ...prev,
      chatHistory: currentHist
    }));

    setInterviewerState('thinking');

    if (interviewSession.type === 'cv') {
      await handleNextCvStep(currentHist, candidateAnswer);
    } else {
      await handleNextTechnicalStep(currentHist, candidateAnswer);
    }
  };

  // Next step for CV
  const handleNextCvStep = async (updatedHistory, latestAnswer) => {
    const questionIndex = interviewSession.currentQuestionIndex;

    // Check if introduction step
    if (questionIndex === 0) {
      try {
        const res = await fetch('/api/interview/cv/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cv_text: interviewSession.cvText,
            user_intro: latestAnswer,
            model: config?.model_name,
            api_key: config?.api_key,
            base_url: config?.base_url
          })
        });

        const data = await res.json();
        const nextQ = data.question;

        const newHistory = [...updatedHistory, { role: 'interviewer', content: nextQ }];
        const newInterviewData = [
          ...interviewSession.interviewData,
          {
            question_data: { question: "Candidate Introduction", answer: "" },
            candidate_answer: latestAnswer
          }
        ];

        setInterviewSession(prev => ({
          ...prev,
          currentQuestionIndex: 1,
          currentQuestionText: nextQ,
          currentQuestionMeta: { difficulty: 'medium', main_subject: 'Project Deep Dive' },
          chatHistory: newHistory,
          interviewData: newInterviewData
        }));

        playTextAudio(nextQ);
      } catch (err) {
        console.error("Error generating first CV question:", err);
      }
    } else if (questionIndex < interviewSession.totalQuestions - 1) {
      // Stream next question
      try {
        const res = await fetch('/api/interview/cv/next', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cv_text: interviewSession.cvText,
            chat_history: updatedHistory,
            model: config?.model_name,
            api_key: config?.api_key,
            base_url: config?.base_url
          })
        });

        const data = await res.json();
        const nextQ = data.question;

        const newHistory = [...updatedHistory, { role: 'interviewer', content: nextQ }];
        const prevQuestionText = interviewSession.currentQuestionText;
        const newInterviewData = [
          ...interviewSession.interviewData,
          {
            question_data: { question: prevQuestionText, answer: "" },
            candidate_answer: latestAnswer
          }
        ];

        setInterviewSession(prev => ({
          ...prev,
          currentQuestionIndex: prev.currentQuestionIndex + 1,
          currentQuestionText: nextQ,
          currentQuestionMeta: { difficulty: 'hard', main_subject: 'Technical Scenarios' },
          chatHistory: newHistory,
          interviewData: newInterviewData
        }));

        playTextAudio(nextQ);
      } catch (err) {
        console.error("Error generating next CV question:", err);
      }
    } else {
      // Completed all CV questions -> evaluate
      const prevQuestionText = interviewSession.currentQuestionText;
      const finalInterviewData = [
        ...interviewSession.interviewData,
        {
          question_data: { question: prevQuestionText, answer: "" },
          candidate_answer: latestAnswer
        }
      ];
      await handleGenerateEvaluation(finalInterviewData, 'cv');
    }
  };

  // Next step for Technical
  const handleNextTechnicalStep = async (updatedHistory, latestAnswer) => {
    const qIndex = interviewSession.currentQuestionIndex; // 0 is intro, 1..N are questions

    if (qIndex === 0) {
      // Intro answered, now ask technical question 1
      const techQ = interviewSession.selectedQuestions[0];
      await reformulateAndAsk(techQ, 1, updatedHistory, [
        {
          question_data: { question: "AI & ML Background Introduction", answer: "" },
          candidate_answer: latestAnswer
        }
      ]);
    } else {
      // Recorded answer to technical question (qIndex - 1)
      const prevTechQ = interviewSession.selectedQuestions[qIndex - 1];
      const newInterviewData = [
        ...interviewSession.interviewData,
        {
          question_data: prevTechQ,
          candidate_answer: latestAnswer
        }
      ];

      if (qIndex < interviewSession.selectedQuestions.length) {
        // Next technical question
        const nextTechQ = interviewSession.selectedQuestions[qIndex];
        await reformulateAndAsk(nextTechQ, qIndex + 1, updatedHistory, newInterviewData);
      } else {
        // All technical questions completed -> evaluate
        await handleGenerateEvaluation(newInterviewData, 'technical');
      }
    }
  };

  const reformulateAndAsk = async (questionData, nextIndex, currentHistory, currentInterviewData) => {
    try {
      const res = await fetch('/api/interview/technical/reformulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_data: questionData,
          model: config?.model_name,
          api_key: config?.api_key,
          base_url: config?.base_url
        })
      });

      const data = await res.json();
      const reformulated = data.reformulated_question;

      const newHistory = [...currentHistory, { role: 'interviewer', content: reformulated }];

      setInterviewSession(prev => ({
        ...prev,
        currentQuestionIndex: nextIndex,
        currentQuestionText: reformulated,
        currentQuestionMeta: questionData,
        chatHistory: newHistory,
        interviewData: currentInterviewData
      }));

      playTextAudio(reformulated);
    } catch (err) {
      console.error("Error reformulating technical question:", err);
      // Fallback to original question text
      const rawQ = questionData.question;
      const newHistory = [...currentHistory, { role: 'interviewer', content: rawQ }];

      setInterviewSession(prev => ({
        ...prev,
        currentQuestionIndex: nextIndex,
        currentQuestionText: rawQ,
        currentQuestionMeta: questionData,
        chatHistory: newHistory,
        interviewData: currentInterviewData
      }));

      playTextAudio(rawQ);
    }
  };

  // Generate Evaluation Report
  const handleGenerateEvaluation = async (finalData, type) => {
    setInterviewerState('thinking');
    stopAudio();

    try {
      const res = await fetch('/api/interview/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interview_type: type || interviewSession.type,
          interview_data: finalData || interviewSession.interviewData,
          model: config?.model_name,
          api_key: config?.api_key,
          base_url: config?.base_url
        })
      });

      const data = await res.json();
      setReportText(data.evaluation_report);
      setView('evaluation');
    } catch (err) {
      console.error("Error generating evaluation report:", err);
      setReportText("# Evaluation Report\nError generating report. Please check your LLM backend connection.");
      setView('evaluation');
    } finally {
      setInterviewerState('idle');
    }
  };

  // Reset Session
  const handleResetSession = () => {
    stopAudio();
    setView('setup');
    setInterviewSession({
      type: 'cv',
      cvText: '',
      selectedQuestions: [],
      currentQuestionIndex: 0,
      totalQuestions: 4,
      currentQuestionText: '',
      currentQuestionMeta: null,
      chatHistory: [],
      interviewData: []
    });
    setReportText('');
  };

  return (
    <>
      <Navbar
        config={config}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onResetSession={handleResetSession}
        isInterviewActive={view === 'interview'}
      />

      <main style={{ flex: 1 }}>
        {view === 'setup' && (
          <SetupView
            metadata={metadata}
            onStartInterview={handleStartInterview}
            onTestSpeaker={handleTestSpeaker}
            isTestingSpeaker={isTestingSpeaker}
          />
        )}

        {view === 'interview' && (
          <InterviewView
            sessionData={interviewSession}
            chatHistory={interviewSession.chatHistory}
            currentQuestionIndex={interviewSession.currentQuestionIndex}
            totalQuestions={interviewSession.totalQuestions}
            currentQuestionText={interviewSession.currentQuestionText}
            currentQuestionMeta={interviewSession.currentQuestionMeta}
            interviewerState={interviewerState}
            onSubmitAnswer={handleSubmitAnswer}
            onReplayAudio={() => playTextAudio(interviewSession.currentQuestionText)}
            onEndInterview={() => handleGenerateEvaluation(interviewSession.interviewData, interviewSession.type)}
            isAudioPlaying={isAudioPlaying}
            onStopAudio={stopAudio}
          />
        )}

        {view === 'evaluation' && (
          <EvaluationView
            reportText={reportText}
            interviewType={interviewSession.type}
            totalQuestions={interviewSession.totalQuestions}
            onResetSession={handleResetSession}
          />
        )}
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSaveConfig={(newConfig) => {
          setConfig(prev => ({ ...prev, ...newConfig }));
        }}
      />
    </>
  );
}
