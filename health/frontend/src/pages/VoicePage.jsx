import React, { useState, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Languages, 
  Send, 
  Bot, 
  User, 
  FileText, 
  AlertCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { chatAPI, reportsAPI } from '../services/api';

export default function VoiceAssistantPage({ user }) {
  const [language, setLanguage] = useState('ta'); // Default to Tamil as requested
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [speechText, setSpeechText] = useState('');
  const [editableInput, setEditableInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [queryReports, setQueryReports] = useState(true);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, []);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser speech recognition is not supported in this browser. Please use the text input below.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'ta' ? 'ta-IN' : 'en-US';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechText('Listening...');
      };

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        setSpeechText(transcript);
        setEditableInput(transcript);
      };

      recognition.onerror = (event) => {
        console.error("Speech error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  const handleSpeakResponse = (text) => {
    if (!window.speechSynthesis) return;
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();

    // Clean text of markdown asterisks and icons for speech
    const cleanText = text.replace(/[*#_~]/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language === 'ta' ? 'ta-IN' : 'en-US';
    utterance.rate = 0.95;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!editableInput.trim() || loading) return;

    const query = editableInput.trim();
    setEditableInput('');
    setSpeechText('');

    const newMsg = { sender: 'user', text: query, lang: language };
    setMessages(prev => [...prev, newMsg]);
    setLoading(true);

    try {
      const res = await chatAPI.sendMessage(user.id, query, language, queryReports);
      const replyMsg = { 
        sender: 'ai', 
        text: res.data.reply, 
        lang: language,
        isUrgent: res.data.is_urgent,
        source: res.data.source
      };
      setMessages(prev => [...prev, replyMsg]);
      // Read aloud automatically
      handleSpeakResponse(res.data.reply);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-800">Tamil and English Voice Assistant</h1>
            <span className="text-[10px] bg-teal-50 text-teal-700 px-2.5 py-0.5 rounded-full font-semibold border border-teal-200">
              Feature 4
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Voice input and text-to-speech engine. Ask questions in Tamil or English about your health and uploaded reports.
          </p>
        </div>

        {/* Language selector & Sound Control */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => { setLanguage('ta'); stopSpeaking(); }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                language === 'ta' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              தமிழ் (Tamil)
            </button>
            <button
              onClick={() => { setLanguage('en'); stopSpeaking(); }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                language === 'en' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              English
            </button>
          </div>

          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold animate-pulse"
            >
              <VolumeX className="w-3.5 h-3.5" />
              <span>Stop Audio</span>
            </button>
          )}
        </div>
      </div>

      {/* Voice Interaction Central Console */}
      <div className="bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 text-white rounded-3xl p-8 shadow-xl text-center space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs text-teal-200 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>{language === 'ta' ? 'குரல் வழி நல உதவியாளர்' : 'Speech-to-Speech Engine Active'}</span>
          </div>

          <h2 className="text-xl font-bold tracking-tight">
            {language === 'ta' 
              ? 'மைக்ரோஃபோனை அழுத்தி உங்கள் கேள்வியைப் பேசுங்கள்'
              : 'Tap the Microphone and Speak Your Health Question'}
          </h2>
          <p className="text-xs text-teal-100/80">
            {language === 'ta'
              ? 'உங்கள் பேச்சு உரையாக மாற்றப்பட்டு, சரிபார்க்கப்பட்ட பின்னரே சமர்ப்பிக்கப்படும்.'
              : 'Your voice will be transcribed into editable text for verification before submission.'}
          </p>
        </div>

        {/* Interactive Big Mic Button */}
        <div className="flex flex-col items-center justify-center space-y-3">
          <button
            onClick={startListening}
            disabled={isListening}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-xl ${
              isListening 
                ? 'bg-rose-500 text-white animate-ping ring-8 ring-rose-400/40' 
                : 'bg-teal-500 hover:bg-teal-400 text-slate-950 hover:scale-105 shadow-teal-500/30'
            }`}
          >
            {isListening ? <MicOff className="w-8 h-8 text-white" /> : <Mic className="w-8 h-8" />}
          </button>
          <span className="text-xs text-teal-200 font-medium">
            {isListening ? (language === 'ta' ? 'கேட்கிறது...' : 'Listening...') : (language === 'ta' ? 'பேச தொடங்குங்கள்' : 'Click to Speak')}
          </span>
        </div>

        {/* Editable Transcript Input Box */}
        <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 text-left space-y-3">
          <div className="flex items-center justify-between text-xs text-teal-200">
            <span>{language === 'ta' ? 'உரையாடல் சரிபார்ப்பு (Editable Transcript):' : 'Speech Transcript (Edit before sending):'}</span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={queryReports}
                onChange={(e) => setQueryReports(e.target.checked)}
                className="rounded text-teal-400"
              />
              <span className="text-[11px] text-teal-100">{language === 'ta' ? 'அறிக்கைகளை இணைக்கவும்' : 'Query Uploaded Reports'}</span>
            </label>
          </div>

          <textarea
            rows="2"
            value={editableInput}
            onChange={(e) => setEditableInput(e.target.value)}
            placeholder={
              language === 'ta'
                ? 'பேசப்பட்ட வார்த்தைகள் இங்கு தோன்றும். தேவைப்பட்டால் திருத்தி "அனுப்பு" என்பதை அழுத்தவும்...'
                : 'Spoken text appears here. You can edit before sending...'
            }
            className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-sm text-white placeholder-teal-200/50 focus:outline-none focus:ring-2 focus:ring-teal-400"
          />

          <div className="flex justify-between items-center pt-1">
            <span className="text-[11px] text-teal-200/70">
              {speechSupported ? 'Browser WebSpeech API Ready' : 'Speech API fallback active'}
            </span>
            <button
              onClick={handleSend}
              disabled={!editableInput.trim() || loading}
              className="px-5 py-2 bg-teal-400 hover:bg-teal-300 disabled:bg-white/20 text-slate-900 font-bold rounded-xl text-xs flex items-center gap-2 shadow transition-all"
            >
              <span>{language === 'ta' ? 'அனுப்பு' : 'Submit Question'}</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Spoken Responses & Fallback Text Thread */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-800">Voice Conversation History</h2>
          <span className="text-xs text-slate-400">Click speaker icon to replay audio</span>
        </div>

        {messages.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No voice queries submitted yet. Try asking: "What was my cholesterol level?" or "காய்ச்சல் வந்தால் என்ன செய்ய வேண்டும்?"
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((m, idx) => {
              const isAi = m.sender === 'ai';
              return (
                <div key={idx} className={`p-4 rounded-2xl text-xs leading-relaxed space-y-2 ${
                  isAi ? 'bg-slate-50 border border-slate-200/80' : 'bg-teal-50/70 border border-teal-100'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5 text-slate-800">
                      {isAi ? <Bot className="w-4 h-4 text-teal-600" /> : <User className="w-4 h-4 text-slate-600" />}
                      <span>{isAi ? 'MediMate Voice Response' : 'Your Query'}</span>
                    </span>

                    {isAi && (
                      <button
                        onClick={() => handleSpeakResponse(m.text)}
                        title="Read aloud"
                        className="p-1.5 text-teal-600 hover:bg-teal-100 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-medium"
                      >
                        <Volume2 className="w-4 h-4" />
                        <span>Replay</span>
                      </button>
                    )}
                  </div>
                  <p className="text-slate-700 whitespace-pre-wrap">{m.text}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
