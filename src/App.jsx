import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import ResumeUpload from './components/ResumeUpload';
import InterviewChat from './components/InterviewChat';
import ResumeModal from './components/ResumeModal';
import SettingsModal from './components/SettingsModal';
import { 
  DEFAULT_CONFIG, 
  uploadResumePdf, 
  startInterviewSession, 
  sendCandidateAnswer, 
  checkBackendServices 
} from './services/api';

export default function App() {
  // Configuration
  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('hiregen_config');
      return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  // Services health status
  const [serviceStatus, setServiceStatus] = useState({
    stripper: { url: 'http://localhost:9090', alive: false, message: 'Checking...' },
    interviewer: { url: 'http://localhost:9091', alive: false, message: 'Checking...' },
  });

  // Interview state
  const [resumeText, setResumeText] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  
  // Reactive streaming states
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStage, setProcessStage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamContent, setCurrentStreamContent] = useState('');

  // Audio TTS setting
  const [audioEnabled, setAudioEnabled] = useState(false);

  // Modals
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Health check on load and config change
  const refreshHealth = useCallback(async (currentConfig = config) => {
    try {
      const status = await checkBackendServices(currentConfig);
      setServiceStatus(status);
    } catch (e) {
      console.warn("Health check error", e);
    }
  }, [config]);

  useEffect(() => {
    refreshHealth();
    const interval = setInterval(() => refreshHealth(), 15000);
    return () => clearInterval(interval);
  }, [refreshHealth]);

  // Save config
  const handleSaveConfig = (newConfig) => {
    setConfig(newConfig);
    localStorage.setItem('hiregen_config', JSON.stringify(newConfig));
    refreshHealth(newConfig);
  };

  // Pipeline: 1. Upload PDF -> ResumeTextStriper -> 2. Pass text -> QuestionMaker -> 3. Stream initial question
  const handleStartProcessing = async (pdfFile) => {
    setIsProcessing(true);
    setErrorMessage('');
    setProcessStage('1/3 Uploading PDF to ResumeTextStriper (Port 9090)...');

    try {
      // Step 1: Strip text from PDF
      const extractedText = await uploadResumePdf(pdfFile, config);
      setResumeText(extractedText);

      setProcessStage('2/3 Extracted text with Apache PDFBox. Calling QuestionMaker (Port 9091)...');

      // Step 2: Start interview with QuestionMaker
      let accumulatedStream = '';
      setIsStreaming(true);

      const convId = await startInterviewSession(
        extractedText,
        config,
        // On each incoming reactive SSE chunk
        (chunk) => {
          accumulatedStream += chunk;
          setCurrentStreamContent(accumulatedStream);
        },
        // On stream completion
        () => {
          setIsStreaming(false);
          const finalContent = accumulatedStream || "Welcome to the technical interview. Let's begin.";
          setMessages([
            {
              role: 'assistant',
              content: finalContent,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }
          ]);
          setCurrentStreamContent('');
          setIsProcessing(false);
        },
        // On error
        (err) => {
          setIsStreaming(false);
          setIsProcessing(false);
          setErrorMessage(err.message || 'Stream processing error');
        }
      );

      setConversationId(convId);
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
      setIsStreaming(false);
      setErrorMessage(err.message || 'An unexpected error occurred during interview initialization.');
    }
  };

  // Send candidate answer to QuestionMaker
  const handleSendMessage = async (userText) => {
    if (!conversationId) return;

    const userMsg = {
      role: 'user',
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsStreaming(true);
    setCurrentStreamContent('');

    let accumulatedStream = '';

    try {
      await sendCandidateAnswer(
        conversationId,
        userText,
        config,
        // On chunk
        (chunk) => {
          accumulatedStream += chunk;
          setCurrentStreamContent(accumulatedStream);
        },
        // On done
        () => {
          setIsStreaming(false);
          if (accumulatedStream) {
            setMessages(prev => [
              ...prev,
              {
                role: 'assistant',
                content: accumulatedStream,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              }
            ]);
          }
          setCurrentStreamContent('');
        },
        // On error
        (err) => {
          setIsStreaming(false);
          setCurrentStreamContent('');
          setMessages(prev => [
            ...prev,
            {
              role: 'assistant',
              content: `?? Error streaming answer: ${err.message}. Please try again.`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }
          ]);
        }
      );
    } catch (err) {
      console.error(err);
      setIsStreaming(false);
    }
  };

  // Reset interview
  const handleResetInterview = () => {
    if (messages.length > 0 && !window.confirm("Are you sure you want to end the current interview and start a new session?")) {
      return;
    }
    setResumeText('');
    setConversationId(null);
    setMessages([]);
    setIsProcessing(false);
    setIsStreaming(false);
    setCurrentStreamContent('');
    setErrorMessage('');
  };

  return (
    <div className="app-root">
      {/* Dynamic Animated Background Aura */}
      <div className="bg-glow bg-glow-1" />
      <div className="bg-glow bg-glow-2" />
      <div className="bg-grid-overlay" />

      {/* Main Top Navigation */}
      <Navbar 
        serviceStatus={serviceStatus}
        onRefreshHealth={refreshHealth}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        audioEnabled={audioEnabled}
        onToggleAudio={() => setAudioEnabled(!audioEnabled)}
        activeSession={Boolean(conversationId)}
        onResetInterview={handleResetInterview}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {!conversationId ? (
          <ResumeUpload 
            onStartProcessing={handleStartProcessing}
            isProcessing={isProcessing}
            processStage={processStage}
            errorMessage={errorMessage}
          />
        ) : (
          <InterviewChat 
            conversationId={conversationId}
            messages={messages}
            isStreaming={isStreaming}
            currentStreamContent={currentStreamContent}
            onSendMessage={handleSendMessage}
            onOpenResumeModal={() => setIsResumeModalOpen(true)}
            onResetInterview={handleResetInterview}
            audioEnabled={audioEnabled}
          />
        )}
      </main>

      {/* Extracted Resume Text Modal */}
      <ResumeModal 
        isOpen={isResumeModalOpen}
        onClose={() => setIsResumeModalOpen(false)}
        resumeText={resumeText}
      />

      {/* Backend Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        config={config}
        onSaveConfig={handleSaveConfig}
      />
    </div>
  );
}
