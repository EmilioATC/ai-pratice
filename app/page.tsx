"use client"

import { ReactNode, useEffect, useRef, useState } from "react"
import {
  Asterisk,
  AudioWaveform,
  ChevronDown,
  Code2,
  FolderOpen,
  Library,
  MessageCircle,
  PanelLeft,
  Plus,
  Search,
  SendHorizontal,
  UserCircle2,
} from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
interface Message {
  role: "user" | "assistant"
  content: string
}

const TABLE_SEPARATOR_REGEX = /^\s*\|?(?:\s*:?-{3,}:?\s*\|)+\s*:?-{3,}:?\s*\|?\s*$/

const parseInlineMarkdown = (text: string): ReactNode[] => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean)

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>
    }

    return <span key={index}>{part}</span>
  })
}

const parseTableRow = (row: string): string[] =>
  row
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim())

const renderMarkdown = (content: string): ReactNode => {
  const blocks = content
    .trim()
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)

  return blocks.map((block, blockIndex) => {
    const lines = block
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)

    const looksLikeTable =
      lines.length >= 2 && lines[0].includes("|") && TABLE_SEPARATOR_REGEX.test(lines[1])

    if (looksLikeTable) {
      const headers = parseTableRow(lines[0])
      const rows = lines.slice(2).map(parseTableRow)

      return (
        <div key={blockIndex} className="my-3 overflow-x-auto rounded-lg border border-[#3b3a36]">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#2a2a27]">
              <tr>
                {headers.map((header, headerIndex) => (
                  <th key={headerIndex} className="border-b border-[#3b3a36] px-3 py-2 font-semibold text-[#e4e1d9]">
                    {parseInlineMarkdown(header)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="odd:bg-[#262623] even:bg-[#2a2a27]">
                  {headers.map((_, colIndex) => (
                    <td key={colIndex} className="border-b border-[#3b3a36] px-3 py-2 text-[#e4e1d9]">
                      {parseInlineMarkdown(row[colIndex] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }

    const isList = lines.every((line) => /^[-*]\s+/.test(line))
    if (isList) {
      return (
        <ul key={blockIndex} className="my-2 list-disc space-y-1 pl-5 text-sm text-[#e4e1d9]">
          {lines.map((line, lineIndex) => (
            <li key={lineIndex}>{parseInlineMarkdown(line.replace(/^[-*]\s+/, ""))}</li>
          ))}
        </ul>
      )
    }

    return (
      <p key={blockIndex} className="my-2 whitespace-pre-wrap text-sm leading-relaxed text-[#e4e1d9]">
        {lines.map((line, lineIndex) => (
          <span key={lineIndex}>
            {parseInlineMarkdown(line)}
            {lineIndex < lines.length - 1 && <br />}
          </span>
        ))}
      </p>
    )
  })
}

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        h1: ({ children }) => (
          <h1 className="mt-6 mb-3 text-3xl font-bold text-[#e4e1d9]">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="mt-5 mb-2 text-2xl font-semibold text-[#e4e1d9]">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="mt-4 mb-2 text-xl font-semibold text-[#e4e1d9]">
            {children}
          </h3>
        ),
        p: ({ children }) => (
          <p className="my-2 leading-relaxed text-[#e4e1d9]">
            {children}
          </p>
        ),
        ul: ({ children }) => (
          <ul className="my-2 list-disc space-y-1 pl-6 text-[#e4e1d9]">
            {children}
          </ul>
        ),
        table: ({ children }) => (
          <div className="my-4 overflow-x-auto rounded-lg border border-[#3b3a36]">
            <table className="min-w-full text-sm text-left">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-[#2a2a27] text-[#e4e1d9]">
            {children}
          </thead>
        ),
        th: ({ children }) => (
          <th className="border-b border-[#3b3a36] px-3 py-2 font-semibold">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border-b border-[#3b3a36] px-3 py-2 text-[#e4e1d9]">
            {children}
          </td>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-white">
            {children}
          </strong>
        ),
        code: ({ children }) => (
          <code className="rounded bg-[#2a2a27] px-1 py-0.5 text-sm text-[#facc15]">
            {children}
          </code>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentResponse, setCurrentResponse] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, currentResponse])

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return

    const userMessage = input.trim()
    setInput("")
    setIsStreaming(true)
    setCurrentResponse("")
    setMessages((prev) => [...prev, { role: "user", content: userMessage }])

    const requestId = Math.random().toString(36).substring(7)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ message: userMessage, requestId }),
      })

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let result = ""

      while (true) {
        const { done, value } = await reader!.read()
        if (done) break
        result += decoder.decode(value)
        setCurrentResponse(result)
      }

      setMessages((prev) => [...prev, { role: "assistant", content: result }])
    } catch (error) {
      console.error("Error:", error)
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error al procesar la respuesta." },
      ])
    } finally {
      setIsStreaming(false)
      setCurrentResponse("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const quickActions = [
    { label: "Escribir", icon: MessageCircle },
    { label: "Aprender", icon: Library },
    { label: "Codigo", icon: Code2 },
    { label: "Vida personal", icon: UserCircle2 },
    { label: "Seleccion de Claude", icon: Asterisk },
  ]
  const hasMessages = messages.length > 0

  return (
    <div className="min-h-screen bg-[#1f1f1d] text-[#d9d6cf]">
      <div className="relative flex h-screen overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(255,255,255,0.05),transparent_40%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.02),transparent_28%,rgba(0,0,0,0.2))]" />

        <aside className="z-10 hidden w-[68px] flex-col items-center border-r border-[#2f2e2a] bg-[#1d1d1b] py-3 md:flex">
          <button className="grid size-8 place-items-center rounded-md text-[#8d8a82] hover:bg-[#2a2926] hover:text-[#d5d1c9]">
            <PanelLeft className="size-4" />
          </button>
          <div className="mt-6 flex flex-col items-center gap-2">
            <button className="grid size-9 place-items-center rounded-full bg-[#2f2e2a] text-[#c9c4b8] hover:bg-[#3a3934]">
              <Plus className="size-4" />
            </button>
            <button className="grid size-9 place-items-center rounded-full text-[#8d8a82] hover:bg-[#2a2926] hover:text-[#d5d1c9]">
              <Search className="size-4" />
            </button>
            <button className="grid size-9 place-items-center rounded-full text-[#8d8a82] hover:bg-[#2a2926] hover:text-[#d5d1c9]">
              <MessageCircle className="size-4" />
            </button>
            <button className="grid size-9 place-items-center rounded-full text-[#8d8a82] hover:bg-[#2a2926] hover:text-[#d5d1c9]">
              <FolderOpen className="size-4" />
            </button>
            <button className="grid size-9 place-items-center rounded-full text-[#8d8a82] hover:bg-[#2a2926] hover:text-[#d5d1c9]">
              <Library className="size-4" />
            </button>
            <button className="grid size-9 place-items-center rounded-full text-[#8d8a82] hover:bg-[#2a2926] hover:text-[#d5d1c9]">
              <Code2 className="size-4" />
            </button>
          </div>
          <div className="mt-auto">
            <button className="grid size-10 place-items-center rounded-full bg-[#d8d4c9] text-[#272622]">
              <UserCircle2 className="size-5" />
            </button>
          </div>
        </aside>

        <main className="relative z-10 flex min-w-0 flex-1 flex-col">
          <div className="flex h-12 items-center justify-between px-4 md:px-8">
            <div className="flex items-center gap-2 md:hidden">
              <button className="grid size-8 place-items-center rounded-md text-[#8d8a82] hover:bg-[#2a2926] hover:text-[#d5d1c9]">
                <PanelLeft className="size-4" />
              </button>
              <button className="grid size-8 place-items-center rounded-md text-[#8d8a82] hover:bg-[#2a2926] hover:text-[#d5d1c9]">
                <Plus className="size-4" />
              </button>
            </div>
            <div className="hidden md:block" />
            <button className="rounded-md px-2 py-1 text-xs text-[#8d8a82] hover:bg-[#2a2926] hover:text-[#d5d1c9]">?</button>
          </div>

          {!hasMessages && (
            <div className="flex flex-1 flex-col items-center justify-center px-4 pb-88">
              <div className="mb-7 rounded-xl border border-[#3a3934] bg-[#151513] px-4 py-2 text-sm text-[#b3aea1]">
                Plan gratuito - <span className="underline underline-offset-2">Actualizar</span>
              </div>
              <h1
                className="mb-8 flex items-center gap-2 text-[42px] font-medium leading-none tracking-tight text-[#d8d4cb] md:text-[50px]"
                style={{ fontFamily: 'serif, Georgia, Cambria, "Times New Roman", serif' }}
              >
                <Asterisk className="size-17 text-[#d07a4f] md:size-20" />
                <span>Buenos dias, Emilio</span>
              </h1>
            </div>
          )}

          {hasMessages && (
            <ScrollArea className="min-h-0 flex-1 px-4 pb-44 pt-2 md:px-8">
              <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
                {messages.map((message, index) => (
                  <div key={index} className={cn("flex", message.role === "assistant" ? "justify-start" : "justify-end")}>
                    <div
                      className={cn(
                        "w-full max-w-[90%] rounded-2xl px-4 py-3",
                        message.role === "assistant"
                          ? "border border-[#383732] bg-[#2a2a27] text-[#e4e1d9]"
                          : "border border-[#4a463e] bg-[#34322d] text-[#f0ece3]"
                      )}
                    >
                      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          {message.role === "assistant" ? "AI - Emiliusss" : "Usuario"}
                        </div>
                      {message.role === "assistant" ? (
                        <MarkdownRenderer content={message.content} />
                        //<div>{renderMarkdown(message.content)}</div>
                      ) : (
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                      )}
                    </div>
                  </div>
                ))}

                {isStreaming && currentResponse && (
                  <div className="flex justify-start">
                    <div className="w-full max-w-[90%] rounded-2xl border border-[#383732] bg-[#2a2a27] px-4 py-3 text-[#e4e1d9]">
                      <div>
                        {renderMarkdown(currentResponse)}
                        <span className="ml-1 inline-block h-4 w-1 animate-pulse align-middle bg-[#8f8a7c]" />
                      </div>
                    </div>
                  </div>
                )}
                {isStreaming && !currentResponse && (
                  <div className="flex justify-start">
                    <div className="w-full max-w-[90%] rounded-2xl border border-[#383732] bg-[#2a2a27] px-4 py-3 text-[#bcb7ab]">
                      Pensando...
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          )}

          <div
            className={cn(
              "pointer-events-none fixed bottom-6 left-0 right-0 px-4 md:left-[68px] md:px-8",
              !hasMessages && "bottom-[20vh]"
            )}
          >
            <div className="pointer-events-auto mx-auto w-full max-w-[760px]">
              <div className="rounded-[25px] border border-[#3a3934] bg-[#2a2a27] p-4 shadow-[0_10px_32px_rgba(0,0,0,0.4)]">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="¿Como puedo ayudarte hoy?"
                  disabled={isStreaming}
                  rows={2}
                  className="min-h-[30px] resize-none border-0 bg-transparent px-1 text-lg text-[#d9d6cf] placeholder:text-[#9a9589] shadow-none focus-visible:ring-0"
                />
                <div className="mt-1 flex items-center justify-between">
                  <button className="grid size-8 place-items-center rounded-full text-[#8f8a7d] transition hover:bg-[#34332f] hover:text-[#d9d6cf]">
                    <Plus className="size-4" />
                  </button>
                  <div className="flex items-center gap-3">
                    <button className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-[#b2ac9f] hover:bg-[#34332f]">
                      Sonnet 4.5
                      <ChevronDown className="size-3.5" />
                    </button>
                    <button className="grid size-8 place-items-center rounded-full text-[#8f8a7d] transition hover:bg-[#34332f] hover:text-[#d9d6cf]">
                      <AudioWaveform className="size-4" />
                    </button>
                    <button
                      onClick={sendMessage}
                      disabled={!input.trim() || isStreaming}
                      className="grid size-9 place-items-center rounded-full bg-[#d07a4f] text-[#201d18] transition hover:bg-[#e38a5d] disabled:cursor-not-allowed disabled:bg-[#5a574f] disabled:text-[#b1ab9f]"
                    >
                      <SendHorizontal className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
              {!hasMessages && (
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2 pb-40">
                  {quickActions.map((action) => (
                    <button
                      key={action.label}
                      type="button"
                      onClick={() => setInput(action.label)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#3a3934] bg-[#232320] px-3 py-1.5 text-sm text-[#c1bcae] transition hover:bg-[#2e2d29]"
                    >
                      <action.icon className="size-3.5" />
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
