'use client'

import { useState, useEffect, useRef } from 'react'

const DEFAULT_STREAM_URL = process.env.NEXT_PUBLIC_PI_STREAM_URL ?? 'http://192.168.1.16:8000/stream'
const STORAGE_KEY = 'catalyze_pi_stream_url'

type StreamState = 'connecting' | 'live' | 'offline' | 'idle'

export default function LivePage() {
  const [url, setUrl] = useState('')
  const [inputUrl, setInputUrl] = useState('')
  const [streamState, setStreamState] = useState<StreamState>('idle')
  const [showConfig, setShowConfig] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()

  // Load saved URL from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) ?? DEFAULT_STREAM_URL
    setUrl(saved)
    setInputUrl(saved)
  }, [])

  // Auto-connect when url is set
  useEffect(() => {
    if (url) connect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url])

  function connect() {
    if (!url) return
    setStreamState('connecting')
    clearTimeout(timeoutRef.current)
    // 8-second timeout to detect offline device
    timeoutRef.current = setTimeout(() => {
      setStreamState(prev => prev === 'connecting' ? 'offline' : prev)
    }, 8_000)
  }

  function handleImgLoad() {
    clearTimeout(timeoutRef.current)
    setStreamState('live')
  }

  function handleImgError() {
    clearTimeout(timeoutRef.current)
    setStreamState('offline')
  }

  function saveAndConnect() {
    const trimmed = inputUrl.trim()
    if (!trimmed) return
    localStorage.setItem(STORAGE_KEY, trimmed)
    setUrl(trimmed)
    setShowConfig(false)
    connect()
  }

  function retry() {
    setStreamState('idle')
    setTimeout(connect, 100)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Live Feed</h1>
        <button
          onClick={() => setShowConfig(v => !v)}
          className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M8.34 1.804A1 1 0 019.32 1h1.36a1 1 0 01.98.804l.295 1.473c.497.144.971.342 1.416.587l1.25-.834a1 1 0 011.262.125l.962.962a1 1 0 01.125 1.262l-.834 1.25c.245.445.443.919.587 1.416l1.473.294a1 1 0 01.804.98v1.361a1 1 0 01-.804.98l-1.473.295a6.95 6.95 0 01-.587 1.416l.834 1.25a1 1 0 01-.125 1.262l-.962.962a1 1 0 01-1.262.125l-1.25-.834a6.953 6.953 0 01-1.416.587l-.294 1.473a1 1 0 01-.98.804H9.32a1 1 0 01-.98-.804l-.295-1.473a6.957 6.957 0 01-1.416-.587l-1.25.834a1 1 0 01-1.262-.125l-.962-.962a1 1 0 01-.125-1.262l.834-1.25a6.957 6.957 0 01-.587-1.416l-1.473-.294A1 1 0 011 10.68V9.32a1 1 0 01.804-.98l1.473-.295c.144-.497.342-.971.587-1.416l-.834-1.25a1 1 0 01.125-1.262l.962-.962A1 1 0 015.38 2.93l1.25.834a6.957 6.957 0 011.416-.587L8.34 1.804zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
          Configure
        </button>
      </div>

      {/* URL config panel */}
      {showConfig && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2">
          <p className="text-xs text-gray-500 font-medium">Pi stream URL</p>
          <div className="flex gap-2">
            <input
              type="url"
              value={inputUrl}
              onChange={e => setInputUrl(e.target.value)}
              placeholder="http://192.168.1.16:8000/stream"
              className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              onClick={saveAndConnect}
              className="px-4 py-2 bg-brand-500 text-white rounded-xl text-sm font-semibold hover:bg-brand-600 transition-colors"
            >
              Connect
            </button>
          </div>
          <p className="text-[11px] text-gray-400">
            Must be on the same WiFi network as the Pi to view the stream.
          </p>
        </div>
      )}

      {/* Stream viewport */}
      <div
        className="relative bg-black rounded-2xl overflow-hidden"
        style={{ aspectRatio: '16/9' }}
      >
        {/* Stream image (always mounted so it can load) */}
        {url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={imgRef}
            src={streamState === 'idle' ? '' : `${url}?t=${Date.now()}`}
            alt="Live feed"
            onLoad={handleImgLoad}
            onError={handleImgError}
            className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${streamState === 'live' ? 'opacity-100' : 'opacity-0'}`}
          />
        )}

        {/* Connecting overlay */}
        {streamState === 'connecting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a10 10 0 100 10l-1.41-1.41A8 8 0 014 12z" />
            </svg>
            <p className="text-white text-sm font-medium">Connecting to device…</p>
          </div>
        )}

        {/* Offline overlay */}
        {streamState === 'offline' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-10 h-10 text-gray-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
            </svg>
            <div>
              <p className="text-white font-semibold text-sm">Device not reachable</p>
              <p className="text-gray-400 text-xs mt-1">
                Make sure you&apos;re on the same WiFi as the Pi,<br />
                and the detection loop is running.
              </p>
            </div>
            <button
              onClick={retry}
              className="mt-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-xl transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Idle — initial state before url loaded */}
        {streamState === 'idle' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-500 text-sm">Loading…</p>
          </div>
        )}

        {/* LIVE badge */}
        {streamState === 'live' && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-white text-xs font-semibold tracking-wide">LIVE</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">About Live Feed</p>
        <p className="text-sm text-gray-600 leading-relaxed">
          This shows the real-time camera view from the litterbox device. The stream is direct from the
          Raspberry Pi — you must be connected to the same WiFi network as the device to view it.
        </p>
      </div>
    </div>
  )
}
