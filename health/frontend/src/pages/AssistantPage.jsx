import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  AlertTriangle, 
  Info, 
  Sparkles, 
  CheckCircle, 
  Trash2,
  FileQuestion,
  HelpCircle,
  ShieldCheck,
  Languages
} from 'lucide-react';
import { chatAPI } from '../services/api';

export default function AssistantPage({ user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState(user?.preferred_language || 'en');
  const [includeReports, setIncludeReports] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchHistory = async () => {
    try {
      const res = await chatAPI.getHistory(user.id);
      if (res.data && res.data.length > 0) {
        setMessages(res.data);
      } else {
        // Welcome default message
        setMessages([
          {
            id: 'welcome',
            sender: 'ai',
            language: language,
            message: language === 'ta'
              ? 'வணக்கம்! நான் உங்கள் MediMate AI சுகாதார வழிகாட்டி. உங்கள் உடல்நலக் கேள்விகள், அறிக்கைகளின் விளக்கம் அல்லது அறிகுறிகளைப் பற்றி கேளுங்கள்.\n\n⚠️ நினைவில் கொள்க: நான் மருத்துவக் கல்வித் தகவல்களை மட்டுமே வழங்குகிறேன். நோய்களைக் கண்டறியவோ மருந்துகளைப் பரிந்துரைக்கவோ மாட்டேன்.'
              : 'Hello! I am MediMate AI, your personal health information companion. Feel free to ask about lab terms, general wellness questions, or symptom observations.\n\n⚠️ Note: I provide educational health information only and never provide formal medical diagnoses or prescriptions.',
            source_indicator: 'general_info',
            is_urgent_warning: 0
          }
        ]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchHistory();
    }
  }, [user, language]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');

    const tempUserMsg = {
      id: Date.now(),
      sender: 'user',
      language: language,
      message: userText,
      source_indicator: 'user',
      is_urgent_warning: 0
    };

    setMessages(prev => [...prev, tempUserMsg]);
    setLoading(true);

    try {
      const res = await chatAPI.sendMessage(user.id, userText, language, includeReports);
      const aiReply = {
        id: Date.now() + 1,
        sender: 'ai',
        language: language,
        message: res.data.reply,
        source_indicator: res.data.source,
        is_urgent_warning: res.data.is_urgent ? 1 : 0,
        is_demo_mode: res.data.is_demo_mode
      };
      setMessages(prev => [...prev, aiReply]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        language: language,
        message: "We encountered a temporary connection issue. Please check your backend server.",
        source_indicator: 'insufficient_info',
        is_urgent_warning: 0
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = async () => {
    if (window.confirm("Clear all chat messages?")) {
      await chatAPI.clearHistory(user.id);
      fetchHistory();
    }
  };

  const sampleQuestions = [
    { en: "What does an HbA1c test result indicate?", ta: "HbA1c பரிசோதனை முடிவு எதைக் குறிக்கிறது?" },
    { en: "I've had a mild headache for 2 days. What should I observe?", ta: "எனக்கு 2 நாட்களாக லேசான தலைவலி உள்ளது. நான் எதைக் கவனிக்க வேண்டும்?" },
    { en: "How can I prepare for a routine fasting lipid panel?", ta: "இரத்த கொழுப்பு பரிசோதனைக்கு எவ்வாறு தயாராக வேண்டும்?" },
    { en: "I am feeling sudden severe chest pain and breathlessness", ta: "திடீரென நெஞ்சு வலி மற்றும் மூச்சுத் திணறல் ஏற்படுகிறது" }
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto h-[calc(100vh-2rem)] flex flex-col space-y-4">
      {/* Header Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-800">AI Health Assistant</h1>
            <span className="text-[10px] bg-teal-50 text-teal-700 px-2.5 py-0.5 rounded-full font-semibold border border-teal-200">
              Feature 1
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Symptom checker, follow-up guidance & health queries in English and Tamil
          </p>
        </div>

        {/* Controls: Language toggle & options */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                language === 'en' ? 'bg-white text-teal-700 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('ta')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                language === 'ta' ? 'bg-white text-teal-700 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              தமிழ் (Tamil)
            </button>
          </div>

          <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-xl border border-slate-200">
            <input
              type="checkbox"
              checked={includeReports}
              onChange={(e) => setIncludeReports(e.target.checked)}
              className="rounded text-teal-600 focus:ring-teal-500"
            />
            <span>Include Report Context</span>
          </label>

          <button
            onClick={clearChat}
            title="Clear Chat History"
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-slate-200"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Medical Safety Disclaimer Strip */}
      <div className="bg-amber-50/70 border border-amber-200/80 px-4 py-2.5 rounded-xl flex items-center gap-3 text-xs text-amber-800">
        <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
        <p className="text-[11px] leading-tight">
          <strong>Important Clinical Boundary:</strong> MediMate AI does not diagnose conditions or prescribe pharmaceuticals. It assists in organizing your symptoms and educational insights. In acute emergencies, visit an emergency room immediately.
        </p>
      </div>

      {/* Messages Thread Container */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 overflow-y-auto space-y-5">
        {messages.map((msg, index) => {
          const isAi = msg.sender === 'ai';
          const isUrgent = msg.is_urgent_warning === 1;

          return (
            <div
              key={msg.id || index}
              className={`flex items-start gap-3.5 ${isAi ? '' : 'flex-row-reverse'}`}
            >
              {/* Avatar */}
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isAi
                    ? isUrgent
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                      : 'bg-gradient-to-tr from-teal-600 to-blue-600 text-white shadow-md shadow-teal-600/20'
                    : 'bg-slate-700 text-white'
                }`}
              >
                {isAi ? isUrgent ? <AlertTriangle className="w-5 h-5" /> : <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>

              {/* Message Bubble */}
              <div className={`max-w-2xl space-y-1.5 ${isAi ? '' : 'text-right'}`}>
                <div
                  className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    isAi
                      ? isUrgent
                        ? 'bg-rose-50 border border-rose-200 text-rose-950 font-medium'
                        : 'bg-slate-50/90 border border-slate-200/70 text-slate-800'
                      : 'bg-teal-600 text-white text-left font-normal'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.message}</p>
                </div>

                {/* Source Indicator Tag & Timestamp */}
                {isAi && (
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 px-1">
                    {msg.source_indicator === 'report_data' && (
                      <span className="flex items-center gap-1 text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md font-medium border border-teal-200">
                        <CheckCircle className="w-3 h-3" /> Grounded in your Medical Reports
                      </span>
                    )}
                    {msg.source_indicator === 'general_info' && (
                      <span className="flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                        <Info className="w-3 h-3 text-slate-400" /> General Health Information
                      </span>
                    )}
                    {msg.source_indicator === 'insufficient_info' && (
                      <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-medium border border-amber-200">
                        <AlertTriangle className="w-3 h-3" /> Information Insufficient / Clarification Needed
                      </span>
                    )}
                    {msg.is_demo_mode && (
                      <span className="text-slate-400 italic">
                        (Demo Mode Safe Response)
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-3 text-slate-400 text-xs py-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <span>MediMate AI is reviewing health guidelines...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Starter Questions */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 text-[11px] font-semibold shrink-0">Try Asking:</span>
        {sampleQuestions.map((sq, i) => (
          <button
            key={i}
            onClick={() => setInput(sq[language])}
            className="shrink-0 bg-white hover:bg-teal-50 text-slate-600 hover:text-teal-700 border border-slate-200 px-3 py-1.5 rounded-xl transition-all font-medium text-xs truncate max-w-xs"
          >
            {sq[language]}
          </button>
        ))}
      </div>

      {/* Input Form Bar */}
      <form onSubmit={handleSend} className="bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            language === 'ta'
              ? 'உங்கள் உடல்நலம் அல்லது மருத்துவ அறிக்கை பற்றி தமிழில் கேளுங்கள்...'
              : 'Ask a health question, describe symptoms, or ask about lab values...'
          }
          className="flex-1 px-4 py-2 text-sm bg-transparent border-0 focus:outline-none focus:ring-0 text-slate-800 placeholder-slate-400"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-medium text-xs flex items-center gap-2 shadow-sm transition-all"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
