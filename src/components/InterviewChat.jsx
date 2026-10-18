import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Copy, 
  Check, 
  Volume2, 
  Mic, 
  MicOff, 
  Clock, 
  Hash, 
  FileText, 
  Download, 
  RotateCcw, 
  Sparkles, 
  Terminal, 
  AlertTriangle,
  Brain
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function InterviewChat({
  conversationId,
  messages,
  isStreaming,
  currentStreamContent,
  onSendMessage,
  onOpenResumeModal,
  onResetInterview,
  audioEnabled
}) {
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  const [copiedMessageIndex, setCopiedMessageIndex] = useState(null);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);

  // Live timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll inside messages container ONLY - never scroll whole window
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, currentStreamContent, isStreaming]);

  // Read aloud via SpeechSynthesis if audio is enabled
  useEffect(() => {
    if (!audioEnabled || !window.speechSynthesis) return;

    // Speak latest completed assistant message
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === 'assistant' && !isStreaming) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(lastMsg.content);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }, [messages, isStreaming, audioEnabled]);

  // Check if interview concluded
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === 'assistant' && !isStreaming) {
      const lower = lastMsg.content.toLowerCase();
      if (lower.includes('summarize and end') || lower.includes('concludes our interview') || lower.includes('thank you for your time') || lower.includes('interview is now complete')) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    }
  }, [messages, isStreaming]);

  // Accent & Locale state (defaults to en-IN for Indian English accent, with en-US and en-GB options)
  const [speechLang, setSpeechLang] = useState('en-IN');
  const initialTextRef = useRef('');

  // Web Speech API with regional acoustic model support
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = speechLang;
      recognition.maxAlternatives = 1;

      // Preserve any text already typed in the input box
      initialTextRef.current = inputText;

      recognition.onstart = () => setIsRecording(true);
      
      recognition.onresult = (event) => {
        let finalSpeech = '';
        let interimSpeech = '';

        for (let i = 0; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            finalSpeech += item[0].transcript + ' ';
          } else {
            interimSpeech += item[0].transcript;
          }
        }

        const prefix = initialTextRef.current ? initialTextRef.current.trim() + ' ' : '';
        const combined = prefix + finalSpeech + interimSpeech;
        setInputText(combined);
      };

      recognition.onerror = (err) => {
        console.warn("Speech Recognition Notice:", err.error);
        if (err.error !== 'no-speech') {
          setIsRecording(false);
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error("Speech Recognition Start Error:", e);
      setIsRecording(false);
    }
  };

  const handleSend = () => {
    if (!inputText.trim() || isStreaming) return;
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }
    const msg = inputText.trim();
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    onSendMessage(msg);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaInput = (e) => {
    setInputText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
  };

  const copyConversationId = () => {
    navigator.clipboard.writeText(conversationId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const copyMessage = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageIndex(index);
    setTimeout(() => setCopiedMessageIndex(null), 2000);
  };

  const speakText = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  const formatTimer = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const downloadTranscript = () => {
    let transcript = `# Technical Screening Interview Transcript\n`;
    transcript += `Date: ${new Date().toLocaleString()}\n`;
    transcript += `Conversation ID: ${conversationId}\n`;
    transcript += `Total Turns: ${messages.length}\n`;
    transcript += `Duration: ${formatTimer(secondsElapsed)}\n\n---\n\n`;

    messages.forEach((m, idx) => {
      const sender = m.role === 'assistant' ? 'AI Interviewer' : 'Candidate';
      transcript += `### [${idx + 1}] ${sender} (${m.timestamp || ''})\n\n${m.content}\n\n`;
    });

    const blob = new Blob([transcript], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-transcript-${conversationId.slice(0, 8)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const quickReplies = [
    "Could you please clarify the specific constraint?",
    "Here is how I would design the architecture:",
    "In my previous project, we solved this by...",
    "Ready for the next question."
  ];

  const questionCount = messages.filter(m => m.role === 'assistant').length;

  return (
    <div className="chat-layout">
      {/* Top Header Bar */}
      <div className="chat-header">
        <div className="header-left">
          <div className="conversation-pill" onClick={copyConversationId} title="Click to copy Conversation ID">
            <Hash className="icon-xs text-accent" />
            <span className="conv-id-label">ID:</span>
            <span className="conv-id-value">{conversationId}</span>
            {copiedId ? <Check className="icon-xs text-success ml-1" /> : <Copy className="icon-xs text-muted ml-1" />}
          </div>

          <div className="memory-badge" title="Spring AI MessageWindowChatMemory maintains 10 latest messages">
            <Brain className="icon-xs text-violet" />
            <span>Memory: 10 turns</span>
          </div>

          <div className="timer-badge">
            <Clock className="icon-xs text-muted" />
            <span>{formatTimer(secondsElapsed)}</span>
          </div>

          <div className="turn-badge">
            <span>Turn {questionCount}</span>
          </div>
        </div>

        <div className="header-right">
          <button 
            className="btn-outline-sm" 
            onClick={onOpenResumeModal}
            title="Inspect text extracted by ResumeTextStriper"
          >
            <FileText className="icon-xs mr-1" />
            <span>View Resume</span>
          </button>

          <button 
            className="btn-outline-sm" 
            onClick={downloadTranscript}
            title="Download full interview transcript as Markdown"
          >
            <Download className="icon-xs mr-1" />
            <span>Export</span>
          </button>

          <button 
            className="btn-outline-sm btn-outline-danger" 
            onClick={onResetInterview}
            title="Start fresh interview with new resume"
          >
            <RotateCcw className="icon-xs mr-1" />
            <span>Restart</span>
          </button>
        </div>
      </div>

      {/* Messages Scroll View */}
      <div className="messages-container" ref={messagesContainerRef}>
        {messages.map((msg, index) => {
          const isAi = msg.role === 'assistant';
          return (
            <div key={index} className={`message-row ${isAi ? 'ai-row' : 'user-row'}`}>
              <div className="message-avatar">
                {isAi ? <Bot className="avatar-icon ai-avatar" /> : <User className="avatar-icon user-avatar" />}
              </div>

              <div className="message-bubble-wrapper">
                <div className="message-header-meta">
                  <span className="sender-name">{isAi ? 'AI Technical Interviewer' : 'You (Candidate)'}</span>
                  <span className="message-time">{msg.timestamp}</span>
                </div>

                <div className="message-bubble">
                  <div className="message-text">{msg.content}</div>
                </div>

                {/* Message Actions */}
                <div className="message-actions">
                  <button 
                    className="msg-action-btn"
                    onClick={() => copyMessage(msg.content, index)}
                    title="Copy message"
                  >
                    {copiedMessageIndex === index ? <Check className="icon-xs text-success" /> : <Copy className="icon-xs" />}
                  </button>
                  {isAi && (
                    <button 
                      className="msg-action-btn"
                      onClick={() => speakText(msg.content)}
                      title="Speak question"
                    >
                      <Volume2 className="icon-xs" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Live Reactive Stream Bubble */}
        {isStreaming && (
          <div className="message-row ai-row streaming-row">
            <div className="message-avatar">
              <Bot className="avatar-icon ai-avatar pulse-avatar" />
            </div>

            <div className="message-bubble-wrapper">
              <div className="message-header-meta">
                <span className="sender-name">AI Technical Interviewer</span>
                  <span className="streaming-badge">
                  <span className="stream-dot" /> Thinking
                </span>
              </div>

              <div className="message-bubble streaming-bubble">
                <div className="message-text">
                  {currentStreamContent}
                  <span className="cursor-blink">?</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Replies Helper Bar */}
      {!isStreaming && (
        <div className="quick-replies-bar">
          <span className="quick-label">Suggestions:</span>
          {quickReplies.map((reply, i) => (
            <button 
              key={i} 
              className="quick-chip"
              onClick={() => setInputText(reply)}
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      {/* Chat Input Bar */}
      <div className="chat-input-wrapper">
        <div className="input-box">
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={handleTextareaInput}
            onKeyDown={handleKeyDown}
            placeholder={isStreaming ? "Interviewer is responding..." : "Type your technical answer here (Enter to send, Shift+Enter for new line)..."}
            disabled={isStreaming}
            className="chat-textarea"
          />

          <div className="input-controls">
            {/* Speech-to-text mic */}
            <button 
              type="button"
              className={`mic-btn ${isRecording ? 'recording' : ''}`}
              onClick={toggleSpeechRecognition}
              title={isRecording ? "Stop Voice Recording" : "Speak your answer (Speech-to-Text)"}
              disabled={isStreaming}
            >
              {isRecording ? <MicOff className="icon-sm" /> : <Mic className="icon-sm" />}
            </button>

            {/* Send button */}
            <button 
              type="button"
              className="send-btn"
              onClick={handleSend}
              disabled={!inputText.trim() || isStreaming}
              title="Send Response"
            >
              <Send className="icon-sm" />
            </button>
          </div>
        </div>
        
        <div className="input-footer">
          <span className="footer-tip">
            Your conversation is private and updates in real time
          </span>
          <span className="char-count">{inputText.length} chars</span>
        </div>
      </div>
    </div>
  );
}
