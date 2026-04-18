"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecResult = { isFinal: boolean; 0: { transcript: string } };
type SpeechRecResultList = { length: number; [i: number]: SpeechRecResult };
type SpeechRecEvent = { resultIndex: number; results: SpeechRecResultList };
type SpeechRecError = { error: string };

type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onresult: ((ev: SpeechRecEvent) => void) | null;
  onerror: ((ev: SpeechRecError) => void) | null;
  onend: (() => void) | null;
};

function recognitionCtor(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export type UseSpeechToTextOptions = {
  lang?: string;
  getPrefix: () => string;
  onText: (full: string) => void;
  onError?: (message: string) => void;
};

export function useSpeechToText(options: UseSpeechToTextOptions) {
  const { lang = "zh-CN", getPrefix, onText, onError } = options;
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recRef = useRef<SpeechRecognitionInstance | null>(null);
  const listeningRef = useRef(false);

  useEffect(() => {
    setSupported(recognitionCtor() !== null);
  }, []);

  const stop = useCallback(() => {
    listeningRef.current = false;
    const r = recRef.current;
    recRef.current = null;
    if (r) {
      try {
        r.stop();
      } catch {
        // noop
      }
    }
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const Ctor = recognitionCtor();
    if (!Ctor) {
      onError?.("当前浏览器不支持语音识别");
      return;
    }

    const prev = recRef.current;
    if (prev) {
      try {
        prev.stop();
      } catch {
        // noop
      }
      recRef.current = null;
    }

    const prefix = getPrefix();
    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onresult = (event: SpeechRecEvent) => {
      let interim = "";
      let finals = "";
      for (let i = 0; i < event.results.length; i++) {
        const row = event.results[i];
        const piece = row[0]?.transcript ?? "";
        if (row.isFinal) finals += piece;
        else interim += piece;
      }
      onText(prefix + finals + interim);
    };

    rec.onerror = (event: SpeechRecError) => {
      if (event.error === "aborted") return;
      const map: Record<string, string> = {
        "not-allowed": "未获得麦克风权限",
        "audio-capture": "无法访问麦克风",
        network: "语音识别网络错误",
        "no-speech": "未检测到语音，可再试一次",
        "service-not-allowed": "语音服务不可用",
      };
      onError?.(map[event.error] ?? `语音识别：${event.error}`);
      listeningRef.current = false;
      recRef.current = null;
      setListening(false);
    };

    rec.onend = () => {
      if (recRef.current === rec) recRef.current = null;
      listeningRef.current = false;
      setListening(false);
    };

    recRef.current = rec;
    listeningRef.current = true;
    setListening(true);
    try {
      rec.start();
    } catch {
      onError?.("无法启动语音识别");
      recRef.current = null;
      listeningRef.current = false;
      setListening(false);
    }
  }, [getPrefix, lang, onError, onText]);

  const toggle = useCallback(() => {
    if (listeningRef.current) stop();
    else start();
  }, [start, stop]);

  useEffect(() => () => stop(), [stop]);

  return { supported, listening, start, stop, toggle };
}

