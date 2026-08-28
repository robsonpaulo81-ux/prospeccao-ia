"use client";

// Página /atendimento-ao-vivo — Live Coach direto no navegador, sem precisar
// do app Electron. Compartilha a tela (com áudio do sistema, marcado como
// "lead") + o microfone (marcado como "agente"), transcreve os dois via
// Deepgram, e manda pro mesmo backend que já gera as sugestões.
//
// Também continua mostrando sugestões de sessões abertas pelo app Electron
// (se você preferir usar ele em vez do navegador).

import { useEffect, useRef, useState } from "react";
import { LiveCoachPanel } from "@/components/LiveCoachPanel";

type Turno = { speaker: "agente" | "lead"; text: string };

const BACKEND_URL = "/api/coach/live";
const SEND_INTERVAL_MS = 8000;

function floatTo16BitPCM(float32Array: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  let offset = 0;
  for (let i = 0; i < float32Array.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
}

type Pipeline = {
  audioCtx: AudioContext;
  processor: ScriptProcessorNode;
  source: MediaStreamAudioSourceNode;
  muteGain: GainNode;
  ws: WebSocket;
};

export default function AtendimentoAoVivoPage() {
  const [dgKey, setDgKey] = useState("");
  const [contexto, setContexto] = useState("");
  const [capturando, setCapturando] = useState(false);
  const [status, setStatus] = useState("parado");
  const [transcript, setTranscript] = useState<Turno[]>([]);
  const [callId, setCallId] = useState<string | null>(null);

  // sessão detectada de outra fonte (ex: app Electron), usada quando este
  // navegador não está capturando ativamente
  const [callIdRemoto, setCallIdRemoto] = useState<string | null>(null);

  const desktopStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const pipelinesRef = useRef<Pipeline[]>([]);
  const transcriptRef = useRef<Turno[]>([]);
  const transcriptDirtyRef = useRef(false);
  const sendTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setDgKey(localStorage.getItem("dgKey") || "");
  }, []);

  // Enquanto NÃO estivermos capturando por aqui, continua checando se há
  // uma sessão em andamento vinda de outra fonte (ex: app Electron).
  useEffect(() => {
    if (capturando) return;
    let cancelado = false;
    async function buscar() {
      try {
        const res = await fetch("/api/coach-suggestions/latest", { cache: "no-store" });
        const data = await res.json();
        if (!cancelado) setCallIdRemoto(data.callId ?? null);
      } catch {}
    }
    buscar();
    const intervalo = setInterval(buscar, 5000);
    return () => {
      cancelado = true;
      clearInterval(intervalo);
    };
  }, [capturando]);

  function addTranscriptLine(speaker: "agente" | "lead", text: string) {
    transcriptRef.current = [...transcriptRef.current, { speaker, text }];
    transcriptDirtyRef.current = true;
    setTranscript([...transcriptRef.current]);
  }

  function captureScreenshot(): string | null {
    const videoEl = videoElRef.current;
    if (!videoEl || !videoEl.videoWidth) return null;
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 1280 / videoEl.videoWidth);
    canvas.width = videoEl.videoWidth * scale;
    canvas.height = videoEl.videoHeight * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.6).split(",")[1];
  }

  function setupAudioPipeline(stream: MediaStream, speaker: "agente" | "lead", apiKey: string): Pipeline {
    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);
    const processor = audioCtx.createScriptProcessor(4096, 1, 1);
    const muteGain = audioCtx.createGain();
    muteGain.gain.value = 0;
    source.connect(processor);
    processor.connect(muteGain);
    muteGain.connect(audioCtx.destination);

    const wsUrl =
      `wss://api.deepgram.com/v1/listen?language=pt-BR&model=nova-2&smart_format=true` +
      `&interim_results=true&encoding=linear16&sample_rate=${audioCtx.sampleRate}&channels=1`;
    const ws = new WebSocket(wsUrl, ["token", apiKey]);
    ws.binaryType = "arraybuffer";

    ws.onopen = () => setStatus(`capturando (${speaker} conectado)`);
    ws.onerror = () => setStatus(`erro no Deepgram (${speaker}) — confira a chave`);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string);
        const alt = data.channel?.alternatives?.[0];
        if (data.is_final && alt?.transcript?.trim()) {
          addTranscriptLine(speaker, alt.transcript.trim());
        }
      } catch {}
    };

    processor.onaudioprocess = (e) => {
      if (ws.readyState !== WebSocket.OPEN) return;
      const input = e.inputBuffer.getChannelData(0);
      ws.send(floatTo16BitPCM(input));
    };

    return { audioCtx, processor, source, muteGain, ws };
  }

  async function sendToBackend(currentCallId: string) {
    if (!transcriptDirtyRef.current || transcriptRef.current.length === 0) return;
    transcriptDirtyRef.current = false;

    const screenshotBase64 = captureScreenshot();

    try {
      const res = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callId: currentCallId,
          callContext: contexto || undefined,
          transcript: transcriptRef.current,
          screenshotBase64,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setStatus("erro do backend: " + data.error);
      }
    } catch (err: any) {
      setStatus("falha ao enviar pro backend: " + err.message);
    }
  }

  async function startCapture() {
    if (!dgKey.trim()) {
      alert("Cole sua chave do Deepgram antes de iniciar.");
      return;
    }
    try {
      // Tela + áudio do sistema (marcado como "lead"). O Chrome mostra uma
      // opção "Compartilhar áudio da guia/tela" — marque-a na hora de escolher.
      const desktopStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      desktopStreamRef.current = desktopStream;
      micStreamRef.current = micStream;

      const videoEl = document.createElement("video");
      videoEl.srcObject = desktopStream;
      videoEl.muted = true;
      await videoEl.play();
      videoElRef.current = videoEl;

      const novoCallId = "live-" + Date.now();
      setCallId(novoCallId);
      transcriptRef.current = [];
      setTranscript([]);

      const pipelines: Pipeline[] = [];
      if (desktopStream.getAudioTracks().length > 0) {
        pipelines.push(setupAudioPipeline(desktopStream, "lead", dgKey.trim()));
      } else {
        setStatus(
          "atenção: nenhum áudio de sistema detectado — marque 'Compartilhar áudio' na hora de escolher a tela"
        );
      }
      pipelines.push(setupAudioPipeline(micStream, "agente", dgKey.trim()));
      pipelinesRef.current = pipelines;

      sendTimerRef.current = setInterval(() => sendToBackend(novoCallId), SEND_INTERVAL_MS);

      desktopStream.getVideoTracks()[0].addEventListener("ended", stopCapture);

      setCapturando(true);
      setStatus("capturando…");
    } catch (err: any) {
      setStatus("erro ao iniciar: " + err.message);
    }
  }

  function stopCapture() {
    setCapturando(false);
    if (sendTimerRef.current) clearInterval(sendTimerRef.current);

    pipelinesRef.current.forEach((p) => {
      try {
        p.ws.close();
        p.processor.disconnect();
        p.source.disconnect();
        p.audioCtx.close();
      } catch {}
    });
    pipelinesRef.current = [];

    [desktopStreamRef.current, micStreamRef.current].forEach((s) => {
      s?.getTracks().forEach((t) => t.stop());
    });
    desktopStreamRef.current = null;
    micStreamRef.current = null;

    setStatus("parado");
  }

  useEffect(() => {
    return () => stopCapture();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "24px 16px" }}>
      <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Atendimento ao vivo</h1>
      <p style={{ fontSize: 13, opacity: 0.7, marginBottom: 20 }}>
        Compartilhe sua tela e microfone direto daqui — sem precisar abrir nenhum app no PC.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
        <label style={{ fontSize: 12, fontWeight: 600 }}>
          Chave da API Deepgram
          <input
            type="password"
            value={dgKey}
            onChange={(e) => {
              setDgKey(e.target.value);
              localStorage.setItem("dgKey", e.target.value);
            }}
            placeholder="cole sua chave aqui"
            disabled={capturando}
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
          />
        </label>

        <label style={{ fontSize: 12, fontWeight: 600 }}>
          Contexto do atendimento (opcional)
          <input
            type="text"
            value={contexto}
            onChange={(e) => setContexto(e.target.value)}
            placeholder="ex: atendimento WhatsApp, lead do MCMV"
            disabled={capturando}
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
          />
        </label>

        <button
          onClick={capturando ? stopCapture : startCapture}
          style={{
            padding: 12,
            fontWeight: 700,
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            background: capturando ? "#e26565" : "#5fd4d0",
            color: capturando ? "#fff" : "#0b0f14",
          }}
        >
          {capturando ? "■ Parar captura" : "▶ Iniciar Live Coach"}
        </button>

        <p style={{ fontSize: 12, textAlign: "center", opacity: 0.7 }}>{status}</p>
      </div>

      {capturando && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Transcrição ao vivo</p>
          <div
            style={{
              maxHeight: 140,
              overflowY: "auto",
              border: "1px solid #ccc",
              borderRadius: 8,
              padding: 8,
              fontSize: 13,
            }}
          >
            {transcript.length === 0 && <p style={{ opacity: 0.6 }}>aguardando fala...</p>}
            {transcript.map((t, i) => (
              <p key={i} style={{ margin: "4px 0" }}>
                <b>{t.speaker === "agente" ? "você" : "lead"}:</b> {t.text}
              </p>
            ))}
          </div>
        </div>
      )}

      {capturando && callId && <LiveCoachPanel callId={callId} ativo={true} />}

      {!capturando && callIdRemoto && (
        <>
          <p style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>
            Mostrando sessão detectada de outra fonte (ex: app no PC):
          </p>
          <LiveCoachPanel callId={callIdRemoto} ativo={true} />
        </>
      )}

      {!capturando && !callIdRemoto && (
        <p style={{ fontSize: 13, opacity: 0.7 }}>Nenhum atendimento ao vivo em andamento no momento.</p>
      )}
    </div>
  );
}
