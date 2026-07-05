"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, Loader2, MessageSquareText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DEPARTMENTS } from "./types";
import { useOfficeStore, type ChatMessage } from "./store";

interface ChatPanelProps {
  agentName: string | null;
  onClose: () => void;
}

export function ChatPanel({ agentName, onClose }: ChatPanelProps) {
  const agents = useOfficeStore((s) => s.agents);
  const chat = useOfficeStore((s) => s.chat);
  const addChatMessage = useOfficeStore((s) => s.addChatMessage);
  const setThinking = useOfficeStore((s) => s.setThinking);
  const returnHome = useOfficeStore((s) => s.returnHome);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const agent = agents.find((a) => a.name === agentName);
  const messages = agentName ? chat[agentName] ?? [] : [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, agentName]);

  async function send() {
    if (!agentName || !input.trim() || sending) return;
    const text = input.trim();
    setInput("");
    addChatMessage(agentName, {
      agent: "developer",
      role: "user",
      text,
    });
    setSending(true);
    setThinking(agentName, true);

    try {
      const res = await fetch("/api/agent/talk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent: agentName, message: text }),
      });
      const data = await res.json();
      setThinking(agentName, false);
      if (data.ok) {
        addChatMessage(agentName, {
          agent: agentName,
          role: "agent",
          text: data.reply || "(no reply)",
        });
      } else {
        addChatMessage(agentName, {
          agent: "system",
          role: "system",
          text: `Error: ${data.error || "request failed"}`,
        });
      }
    } catch (e) {
      setThinking(agentName, false);
      addChatMessage(agentName, {
        agent: "system",
        role: "system",
        text: `Network error: ${e instanceof Error ? e.message : "unknown"}`,
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <AnimatePresence mode="wait">
      {agent && (
        <motion.div
          key={agent.name}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 30 }}
          transition={{ duration: 0.25 }}
          className="flex h-full flex-col rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-sm"
        >
          {/* Header */}
          <div
            className="flex items-center justify-between border-b px-4 py-3"
            style={{ borderColor: `${DEPARTMENTS[agent.department].hex}40` }}
          >
            <div className="flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{
                  background: `linear-gradient(135deg, ${DEPARTMENTS[agent.department].hex}99, ${DEPARTMENTS[agent.department].hex}55)`,
                  border: `2px solid ${DEPARTMENTS[agent.department].hex}`,
                }}
              >
                {agent.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-100">
                    @{agent.name}
                  </span>
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider"
                    style={{
                      background: `${DEPARTMENTS[agent.department].hex}25`,
                      color: DEPARTMENTS[agent.department].hex,
                    }}
                  >
                    {DEPARTMENTS[agent.department].label}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">{agent.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 gap-1 px-2 text-slate-400 hover:text-slate-200"
                onClick={() => returnHome(agent.name)}
                title="Send agent back to their desk"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Desk
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-slate-400 hover:text-slate-200"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="wf-scroll flex-1 space-y-3 overflow-y-auto p-4"
          >
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-slate-500">
                <MessageSquareText className="h-10 w-10 opacity-40" />
                <p className="text-sm">No messages yet.</p>
                <p className="text-xs text-slate-600">
                  Say hello to @{agent.name} — they&apos;ll walk over from{" "}
                  {DEPARTMENTS[agent.department].label}.
                </p>
              </div>
            )}

            {messages.map((m) => (
              <ChatBubble key={m.id} message={m} agentName={agent.name} />
            ))}

            {agent.thinking && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>@{agent.name} is thinking...</span>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-slate-800 p-3">
            <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !sending) send();
                }}
                placeholder={`Message @${agent.name}...`}
                className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                disabled={sending}
              />
              <Button
                size="sm"
                onClick={send}
                disabled={sending || !input.trim()}
                className={cn(
                  "gap-1 bg-slate-200 text-slate-900 hover:bg-white",
                  sending && "opacity-60"
                )}
              >
                <Send className="h-3.5 w-3.5" />
                Send
              </Button>
            </div>
            <p className="mt-1.5 px-1 text-[10px] text-slate-600">
              Powered by{" "}
              <code className="rounded bg-slate-800 px-1 py-0.5 text-slate-400">
                WebForge Agent Runtime (DeepSeek v4 Flash)
              </code>
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ChatBubble({
  message,
  agentName,
}: {
  message: ChatMessage;
  agentName: string;
}) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  if (isSystem) {
    return (
      <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
        {message.text}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
          isUser
            ? "bg-amber-500 text-slate-950"
            : "border border-slate-700 bg-slate-800 text-slate-100"
        )}
      >
        {!isUser && (
          <div className="mb-0.5 text-[10px] font-semibold text-slate-400">
            @{agentName}
          </div>
        )}
        <div className="whitespace-pre-wrap break-words">{message.text}</div>
      </div>
    </motion.div>
  );
}
