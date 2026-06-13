import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";

const SUGGESTIONS = [
  "I love Dior Sauvage — what should I try?",
  "Looking for a warm winter scent",
  "Best perfume for a gift?",
  "Something smoky and oud-forward",
];

export function ShoppingAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const initial: UIMessage[] = [
    {
      id: "welcome",
      role: "assistant",
      parts: [
        {
          type: "text",
          text: "Hi, I'm Amber — your fragrance guide at Abdulrahman Perfumes. Tell me what you love (a designer scent, a mood, a season) and I'll find your match.",
        },
      ],
    },
  ];

  const { messages, sendMessage, status } = useChat({
    id: "shopping-assistant",
    messages: initial,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isBusy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t || isBusy) return;
    void sendMessage({ text: t });
    setInput("");
  };

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-50 rounded-full p-4 shadow-[var(--shadow-elegant)] text-white"
        style={{ background: "var(--gradient-gold)" }}
        aria-label={open ? "Close assistant" : "Open shopping assistant"}
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-50 w-[calc(100vw-2.5rem)] sm:w-96 h-[32rem] bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <header className="p-4 border-b border-border flex items-center gap-3" style={{ background: "var(--gradient-warm)" }}>
            <div className="w-9 h-9 rounded-full grid place-items-center text-white" style={{ background: "var(--gradient-gold)" }}>
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="font-display text-base leading-tight">Amber</div>
              <div className="text-xs text-muted-foreground">AI fragrance assistant</div>
            </div>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
            {messages.map((m) => {
              const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
              const mine = m.role === "user";
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2 whitespace-pre-wrap leading-relaxed ${
                      mine ? "bg-foreground text-background" : "bg-secondary"
                    }`}
                  >
                    {text || (isBusy ? "…" : "")}
                  </div>
                </div>
              );
            })}
            {status === "submitted" && (
              <div className="flex justify-start">
                <div className="bg-secondary rounded-2xl px-3.5 py-2 text-muted-foreground">Thinking…</div>
              </div>
            )}

            {messages.length <= 1 && (
              <div className="pt-2 space-y-2">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Try asking</div>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="block w-full text-left text-xs px-3 py-2 rounded-lg border border-border hover:border-[var(--amber-deep)]/40 hover:bg-secondary transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="p-3 border-t border-border flex gap-2"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a scent…"
              className="flex-1 rounded-full px-4 py-2 bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-ring text-sm"
              disabled={isBusy}
            />
            <button
              type="submit"
              disabled={isBusy || !input.trim()}
              className="rounded-full p-2 text-white disabled:opacity-50"
              style={{ background: "var(--gradient-gold)" }}
              aria-label="Send"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
