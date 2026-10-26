import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Trash2, Bot, User } from 'lucide-react';
import { API_BASE_URL } from '../config';
import type { DatasetProfile, Recommendation } from '../types';

interface AIChatSidebarProps {
  datasetId: string;
  profile: DatasetProfile | null;
  recommendations?: Recommendation[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTED_QUESTIONS = [
  "What are the biggest data-quality issues?",
  "Why is this column flagged?",
  "Which recommendations are risky?",
  "Explain missing-value handling.",
  "What happens if I apply this fix?"
];

export const AIChatSidebar: React.FC<AIChatSidebarProps> = ({ datasetId, profile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hey! I can help you understand your dataset, investigate data-quality issues, and explain cleaning recommendations. What would you like to know?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || !datasetId || isLoading) return;

    const userMessage: Message = { role: 'user', content: query.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    if (!textToSend) setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/datasets/${datasetId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query.trim(),
          history: updatedMessages.slice(0, -1) // all except the latest user message
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch chat response.');
      }

      const data = await response.json();
      setMessages([...updatedMessages, { role: 'assistant', content: data.response }]);
    } catch (err) {
      setMessages([
        ...updatedMessages,
        { role: 'assistant', content: "Sorry, I encountered an error communicating with the assistant. Please try again." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: "Conversation cleared. How else can I help with your dataset?"
      }
    ]);
  };

  if (!datasetId || !profile) {
    return null; // Don't show chat sidebar until a dataset is uploaded/profiled
  }

  return (
    <>
      {/* Floating Toggle Button on Right Edge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-50 bg-[#1c1c1a] hover:bg-black text-white px-2.5 py-3 rounded-l-lg shadow-lg flex items-center gap-2 transition-all"
        title="Toggle AI Enquire Chat"
        aria-label="Toggle AI Enquire Chat"
      >
        <MessageSquare className="w-4 h-4" />
        <span className="writing-mode-vertical text-[11px] font-mono font-medium tracking-wider uppercase hidden sm:inline">
          AI Enquire
        </span>
      </button>

      {/* Overlay for Mobile / Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 sm:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Right Side Drawer Panel */}
      <div className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white border-l border-[#e6e5e0] shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#e6e5e0] flex items-center justify-between bg-[#f7f6f3]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-[#1c1c1a] text-white flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#1c1c1a] m-0">AI Enquire</h3>
              <p className="text-[10px] text-stone-500 m-0">Your data-cleaning assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={clearChat}
              className="p-1.5 text-stone-500 hover:text-stone-800 rounded hover:bg-stone-200 transition-colors"
              title="Clear conversation"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-stone-500 hover:text-stone-800 rounded hover:bg-stone-200 transition-colors"
              title="Close panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50/50">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2.5 ${
                msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'user' ? 'bg-[#1c1c1a] text-white' : 'bg-stone-200 text-stone-700'
              }`}>
                {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>
              <div className={`max-w-[80%] p-3 rounded-lg text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#1c1c1a] text-white rounded-tr-none'
                  : 'bg-white border border-[#e6e5e0] text-[#1c1c1a] rounded-tl-none shadow-xs'
              }`}>
                <p className="whitespace-pre-wrap m-0">{msg.content}</p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="bg-white border border-[#e6e5e0] p-3 rounded-lg rounded-tl-none text-xs text-stone-500 flex items-center gap-2">
                <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Question Chips */}
        <div className="px-4 py-2 bg-white border-t border-[#e6e5e0] overflow-x-auto flex gap-1.5 scrollbar-none">
          {SUGGESTED_QUESTIONS.map((question, qIdx) => (
            <button
              key={qIdx}
              onClick={() => handleSend(question)}
              disabled={isLoading}
              className="px-2.5 py-1 bg-[#f7f6f3] hover:bg-stone-200 text-stone-700 text-[10px] rounded-full whitespace-nowrap border border-[#e6e5e0] transition-colors disabled:opacity-50"
            >
              {question}
            </button>
          ))}
        </div>

        {/* Message Composer */}
        <div className="p-3 border-t border-[#e6e5e0] bg-white">
          <div className="flex items-end gap-2 border border-[#e6e5e0] rounded-lg bg-[#f7f6f3] p-1.5 focus-within:border-stone-500">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your dataset..."
              rows={1}
              className="flex-1 bg-transparent text-xs p-1.5 focus:outline-none resize-none max-h-24 text-[#1c1c1a]"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="p-2 bg-[#1c1c1a] hover:bg-black text-white rounded transition-colors disabled:opacity-50 shrink-0"
              title="Send message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="[9px] text-stone-400 text-center mt-1.5">
            Press Enter to send, Shift+Enter for new line
          </div>
        </div>
      </div>
    </>
  );
};
