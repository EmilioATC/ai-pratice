"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentResponse, setCurrentResponse] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentResponse]);

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage = input.trim();
    setInput("");
    setIsStreaming(true);
    setCurrentResponse("");

    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    const requestId = Math.random().toString(36).substring(7);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ message: userMessage, requestId }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let result = "";

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        result += decoder.decode(value);
        setCurrentResponse(result);
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: result },
      ]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error al procesar la respuesta." },
      ]);
    } finally {
      setIsStreaming(false);
      setCurrentResponse("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans">
      {/* Header */}
      <header className="border-b border-zinc-100 py-5">
        <div className="max-w-2xl mx-auto px-6">
          <h1 className="text-xl font-semibold tracking-tight">AI Streaming</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-6 py-8">
        {/* Messages */}
        <div className="space-y-8 mb-8">
          {messages.length === 0 && (
            <div className="text-center py-20">
              <div className="text-7xl mb-4">🤖</div>
              <p className="text-zinc-400 text-sm">Tu asistente de IA</p>
              <div className="mt-8 flex justify-center gap-2">
                <span className="px-3 py-1 bg-zinc-50 text-zinc-500 text-xs rounded-full border border-zinc-100">Escribe para comenzar</span>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className="group">
              {msg.role === "assistant" ? (
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-zinc-100 border border-zinc-100 flex items-center justify-center flex-shrink-0 group-hover:border-zinc-200 transition-colors">
                    <span className="text-lg">🤖</span>
                  </div>
                  <div className="flex-1 pt-1">
                    <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2 block">AI - Emiliusss</span>
                    <p className="text-sm leading-relaxed text-zinc-800">{msg.content}</p>
                  </div>
                </div>
              ) : (
                <div className="flex gap-4 flex-row-reverse">
                  <div className="w-10 h-10 rounded-2xl bg-zinc-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">👤</span>
                  </div>
                  <div className="flex-1 pt-1 text-right">
                    <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2 block">Tú</span>
                    <p className="text-sm leading-relaxed text-zinc-800">{msg.content}</p>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Streaming */}
          {isStreaming && currentResponse && (
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center flex-shrink-0">
                <span className="text-lg animate-pulse">🤖</span>
              </div>
              <div className="flex-1 pt-1">
                <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2 block">AI</span>
                <p className="text-sm leading-relaxed text-zinc-800">
                  {currentResponse}
                  <span className="inline-block w-1 h-4 ml-1 bg-zinc-300 animate-pulse align-middle"></span>
                </p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="sticky bottom-0 bg-white pt-4 pb-2">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent h-8 -top-8 pointer-events-none"></div>
            <div className="flex gap-3 items-center">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe tu mensaje..."
                  disabled={isStreaming}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-full px-5 py-4 pr-14 text-sm focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 transition-all disabled:bg-zinc-100 disabled:text-zinc-400 shadow-sm"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isStreaming}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-zinc-900 text-white rounded-full flex items-center justify-center hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 transition-all active:scale-95"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <p className="text-center text-xs text-zinc-300 mt-3">Enter para enviar</p>
        </div>
      </main>
    </div>
  );
}
