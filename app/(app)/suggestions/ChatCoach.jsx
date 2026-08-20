'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles } from 'lucide-react';

const STARTERS = [
  'What should I eat for dinner to hit my protein goal?',
  'Is my day balanced so far?',
  'Suggest a healthy 300 kcal snack.',
];

export default function ChatCoach({ name }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Hi ${name || 'there'}! I'm your AI nutrition coach. Ask me anything about your food, macros, or what to eat next. 🥗` },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setError('');
    setInput('');
    const next = [...messages, { role: 'user', content }];
    setMessages(next);
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next.filter((m) => m.role !== 'system').slice(-10) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Chat failed.');
      setMessages((m) => [...m, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="glass mb-3 flex max-h-[55vh] min-h-[300px] flex-col gap-3 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm"
              style={m.role === 'user'
                ? { background: 'var(--primary)', color: '#fff', borderBottomRightRadius: 4 }
                : { background: 'var(--bg-glass)', color: 'var(--text-main)', borderBottomLeftRadius: 4 }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl px-4 py-2.5" style={{ background: 'var(--bg-glass)' }}>
              <Loader2 size={16} className="animate-spin" color="var(--primary)" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {messages.length <= 1 && (
        <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto">
          {STARTERS.map((s) => (
            <button key={s} onClick={() => send(s)}
              className="flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium"
              style={{ borderColor: 'var(--border-medium)', color: 'var(--text-muted)' }}>
              <Sparkles size={12} /> {s.length > 32 ? s.slice(0, 32) + '…' : s}
            </button>
          ))}
        </div>
      )}

      {error && <p className="mb-2 text-sm" style={{ color: 'var(--error)' }}>{error}</p>}

      <div className="flex gap-2">
        <input className="input-field" placeholder="Ask your coach…" value={input}
          onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} />
        <button onClick={() => send()} disabled={loading || !input.trim()} className="btn-primary shrink-0">
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
