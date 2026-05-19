import React, { useEffect, useRef } from "react";
import { Terminal, Copy, Trash2, Check, RefreshCw } from "lucide-react";
import { SimulationLog } from "../types";

interface TerminalSimulatorProps {
  logs: SimulationLog[];
  onClear: () => void;
  isRunning: boolean;
}

export default function TerminalSimulator({ logs, onClear, isRunning }: TerminalSimulatorProps) {
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const copyLogsToClipboard = () => {
    const rawText = logs.map(l => `[${l.timestamp}] ${l.text}`).join("\n");
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-zinc-950 text-emerald-400 font-mono text-xs rounded-2xl p-5 shadow-2l border border-zinc-800 flex flex-col h-[320px]">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-90 w-full mb-3 text-zinc-400">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-500 animate-pulse" />
          <span className="font-bold tracking-tight text-zinc-300">Terminal Execução - Cloud Dev Environment</span>
        </div>

        <div className="flex items-center gap-2.5">
          {isRunning && (
            <div className="flex items-center gap-1 bg-emerald-950/40 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-900/30 text-[10px] animate-pulse">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>LIVE COMPILING</span>
            </div>
          )}
          <button
            onClick={copyLogsToClipboard}
            className="p-1.5 hover:bg-zinc-900 rounded text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Copiar logs completos"
            id="copy-terminal-logs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClear}
            className="p-1.5 hover:bg-zinc-900 rounded text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
            title="Limpar terminal"
            id="clear-terminal-logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1.5 pr-2 custom-scrollbar">
        {logs.length === 0 ? (
          <div className="text-zinc-500 italic flex items-center justify-center h-full">
            Pronto para executar. Informe sua proposta acima para iniciar o monitoramento...
          </div>
        ) : (
          logs.map((log, idx) => {
            let typeColor = "text-emerald-400";
            if (log.type === "warning") typeColor = "text-amber-400";
            if (log.type === "error") typeColor = "text-red-400 font-bold";
            if (log.type === "command") typeColor = "text-indigo-400";
            if (log.type === "success") typeColor = "text-emerald-300 font-semibold";

            return (
              <div key={idx} className="leading-relaxed hover:bg-zinc-900/40 px-1.5 py-0.5 rounded transition-colors break-words">
                <span className="text-zinc-600 mr-2">[{log.timestamp}]</span>
                {log.type === "command" && <span className="text-indigo-500 mr-1.5">$</span>}
                <span className={typeColor}>{log.text}</span>
              </div>
            );
          })
        )}
        <div ref={terminalEndRef} />
      </div>
    </div>
  );
}
