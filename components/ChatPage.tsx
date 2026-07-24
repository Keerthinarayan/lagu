import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { ChatMessage, sendChatMessage, isChatAvailable } from '../services/chatService';
import { sendGroqChatMessage, isGroqChatAvailable } from '../services/groqChatService';

interface ChatProvider {
  id: 'gemini' | 'groq';
  name: string;
  available: boolean;
  send: (history: ChatMessage[], newMessage: string, documentText?: string) => Promise<string>;
  envVar: string;
  signupUrl: string;
  signupLabel: string;
}

const CHAT_PROVIDERS: ChatProvider[] = [
  {
    id: 'gemini',
    name: 'Gemini',
    available: isChatAvailable(),
    send: sendChatMessage,
    envVar: 'GEMINI_API_KEY',
    signupUrl: 'https://aistudio.google.com/apikey',
    signupLabel: 'aistudio.google.com/apikey',
  },
  {
    id: 'groq',
    name: 'Groq (Llama 3.3)',
    available: isGroqChatAvailable(),
    send: sendGroqChatMessage,
    envVar: 'GROQ_API_KEY',
    signupUrl: 'https://console.groq.com/keys',
    signupLabel: 'console.groq.com/keys',
  },
];

const BASE_SUGGESTIONS = [
  'ಸಂಧಿ ಎಂದರೇನು? ಉದಾಹರಣೆ ಕೊಡಿ.',
  'ಲಘು ಮತ್ತು ಗುರು ಅಕ್ಷರಗಳ ವ್ಯತ್ಯಾಸ ಏನು?',
  'ಸಮಾಸ ಎಷ್ಟು ವಿಧ? ಒಂದೊಂದು ಉದಾಹರಣೆ ಕೊಡಿ.',
  'ಕಂದ ಪದ್ಯದ ಲಕ್ಷಣ ತಿಳಿಸಿ.',
];

const DOCUMENT_SUGGESTIONS = [
  'ಈ ಪಠ್ಯದಲ್ಲಿ ಎಷ್ಟು ಗುರು ಅಕ್ಷರಗಳಿವೆ?',
  'ಈ ಪಠ್ಯದ ಸಾರಾಂಶ ಕೊಡಿ.',
  'ಈ ಪಠ್ಯದಲ್ಲಿ ಯಾವ ಸಂಧಿ/ಸಮಾಸ ಉದಾಹರಣೆಗಳಿವೆ?',
];

const MAX_CONTEXT_CHARS = 40000;

interface ChatPageProps {
  poemText?: string;
}

const ChatPage: React.FC<ChatPageProps> = ({ poemText }) => {
  const availableProviders = useMemo(() => CHAT_PROVIDERS.filter((p) => p.available), []);
  const [providerId, setProviderId] = useState<ChatProvider['id']>(
    () => availableProviders[0]?.id ?? 'gemini'
  );
  const activeProvider = CHAT_PROVIDERS.find((p) => p.id === providerId) ?? CHAT_PROVIDERS[0];

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const hasDocument = !!poemText?.trim();
  const isTruncated = (poemText?.trim().length ?? 0) > MAX_CONTEXT_CHARS;
  const suggestions = hasDocument ? [...DOCUMENT_SUGGESTIONS, ...BASE_SUGGESTIONS] : BASE_SUGGESTIONS;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading || !activeProvider.available) return;

    setError(null);
    setInput('');
    const history = messages;
    setMessages((prev) => [...prev, { role: 'user', text: trimmed }]);
    setIsLoading(true);

    try {
      const reply = await activeProvider.send(history, trimmed, poemText);
      setMessages((prev) => [...prev, { role: 'model', text: reply }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, poemText, activeProvider]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-18rem)] min-h-[28rem] animate-fade-in">
      {/* Header */}
      <div className="px-5 py-4 border-b border-neutral-200 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-neutral-900 font-kannada">ಅಕ್ಷರ ಗುರು</h2>
          <p className="text-xs text-neutral-500">Kannada Grammar &amp; Prosody Tutor · Powered by {activeProvider.name}</p>
        </div>

        {/* Provider switcher — only shown when more than one provider has a key configured */}
        {availableProviders.length > 1 && (
          <div className="shrink-0 flex gap-0.5 p-0.5 bg-neutral-100 rounded-full border border-neutral-200">
            {availableProviders.map((p) => (
              <button
                key={p.id}
                onClick={() => setProviderId(p.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                  p.id === providerId ? 'bg-white text-indigo-700 shadow-sm' : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                {p.id === 'gemini' ? 'Gemini' : 'Groq'}
              </button>
            ))}
          </div>
        )}

        {hasDocument && (
          <span
            title={isTruncated ? `Only the first ${MAX_CONTEXT_CHARS.toLocaleString()} characters of your text are used as context.` : 'Your loaded text is available as context for this chat.'}
            className="shrink-0 flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Text loaded{isTruncated ? ' (partial)' : ''}
          </span>
        )}
      </div>

      {availableProviders.length === 0 ? (
        <div className="flex-1 p-6 text-sm text-neutral-600 leading-relaxed overflow-y-auto custom-scrollbar flex items-center justify-center">
          <div className="max-w-md">
            <p className="font-semibold text-neutral-900 mb-3 text-base text-center">This chat needs at least one free API key</p>
            <ul className="space-y-2">
              {CHAT_PROVIDERS.map((p) => (
                <li key={p.id}>
                  <span className="font-medium text-neutral-800">{p.name}:</span> get a free key at{' '}
                  <span className="font-mono text-indigo-600">{p.signupLabel}</span> and set{' '}
                  <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-indigo-600">{p.envVar}</code> in{' '}
                  <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-indigo-600">.env.local</code>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-neutral-400 text-center">Restart the dev server after adding a key.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-4">
            {messages.length === 0 && (
              <div className="max-w-2xl mx-auto pt-6">
                <p className="text-center text-neutral-500 mb-5 font-kannada text-lg">
                  {hasDocument
                    ? 'ನಿಮ್ಮ ಪಠ್ಯದ ಬಗ್ಗೆ ಅಥವಾ ಕನ್ನಡ ವ್ಯಾಕರಣದ ಬಗ್ಗೆ ಏನಾದರೂ ಕೇಳಿ.'
                    : 'ಕನ್ನಡ ವ್ಯಾಕರಣ ಅಥವಾ ಛಂದಸ್ಸಿನ ಬಗ್ಗೆ ಏನಾದರೂ ಕೇಳಿ.'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSend(s)}
                      className="text-left text-sm font-kannada px-4 py-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 hover:border-indigo-300 text-neutral-700 transition-all"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] sm:max-w-[75%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap font-kannada leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-neutral-900 text-white rounded-br-sm'
                      : 'bg-neutral-100 text-neutral-800 rounded-bl-sm'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="px-4 py-3 rounded-2xl bg-neutral-100 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"></span>
                </div>
              </div>
            )}
            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 max-w-2xl mx-auto">
                {error}
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-3 sm:p-4 border-t border-neutral-200 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="ಪ್ರಶ್ನೆ ಕೇಳಿ... (e.g. ಆಗಮ ಸಂಧಿ ಎಂದರೇನು?)"
              disabled={isLoading}
              className="flex-1 bg-neutral-50 border border-neutral-200 rounded-full px-4 py-3 text-sm font-kannada text-neutral-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              aria-label="Send"
              className="shrink-0 w-11 h-11 rounded-full bg-neutral-900 disabled:opacity-40 flex items-center justify-center text-white transition-opacity hover:bg-neutral-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default ChatPage;
