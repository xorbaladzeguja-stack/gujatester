import { useState, useRef, useEffect, useCallback } from 'react'
import { handleCommand } from './commands.js'
import { SpeechRecognition } from '@capacitor-community/speech-recognition'
import { TextToSpeech } from '@capacitor-community/text-to-speech'
import { Capacitor } from '@capacitor/core'

// მხოლოდ ნამდვილ Android გარემოში (APK-ში) გამოვიყენოთ ეს პლაგინები.
// ბრაუზერში ტესტისას (npm run dev) ხმის ფუნქციები უბრალოდ გამოტოვდება.
const isNative = Capacitor.isNativePlatform()

const ORB_STATE = {
  IDLE: 'idle',
  LISTENING: 'listening',
  SPEAKING: 'speaking',
}

export default function App() {
  const [orbState, setOrbState] = useState(ORB_STATE.IDLE)
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [chatOpen, setChatOpen] = useState(false)
  const pressTimer = useRef(null)

  const speak = useCallback(async (text) => {
    setOrbState(ORB_STATE.SPEAKING)
    if (isNative) {
      try {
        await TextToSpeech.speak({ text, lang: 'ka-GE', rate: 1.0, pitch: 1.0 })
      } catch (e) {
        // TTS ვერ ჩაირთო - მაინც ვაჩვენოთ ტექსტი
      }
    }
    setOrbState(ORB_STATE.IDLE)
  }, [])

  const processText = useCallback(
    (text) => {
      if (!text) return
      setMessages((prev) => [...prev, { from: 'user', text }])
      const { reply } = handleCommand(text)
      setMessages((prev) => [...prev, { from: 'gio', text: reply }])
      speak(reply)
    },
    [speak]
  )

  const startListening = useCallback(async () => {
    setOrbState(ORB_STATE.LISTENING)
    if (!isNative) {
      // ბრაუზერში ტესტისას - საჩვენებელი placeholder
      return
    }
    try {
      const { available } = await SpeechRecognition.available()
      if (!available) {
        setOrbState(ORB_STATE.IDLE)
        return
      }
      await SpeechRecognition.requestPermissions()
      SpeechRecognition.addListener('partialResults', (data) => {
        if (data?.matches?.[0]) setInputText(data.matches[0])
      })
      await SpeechRecognition.start({
        language: 'ka-GE',
        maxResults: 1,
        partialResults: true,
        popup: false,
      })
    } catch (e) {
      setOrbState(ORB_STATE.IDLE)
    }
  }, [])

  const stopListening = useCallback(async () => {
    if (isNative) {
      try {
        await SpeechRecognition.stop()
        SpeechRecognition.removeAllListeners()
      } catch (e) {
        /* noop */
      }
    }
    setOrbState(ORB_STATE.IDLE)
    setInputText((current) => {
      if (current) processText(current)
      return ''
    })
  }, [processText])

  const handleOrbPressStart = () => {
    pressTimer.current = setTimeout(() => {
      startListening()
    }, 120)
  }

  const handleOrbPressEnd = () => {
    clearTimeout(pressTimer.current)
    if (orbState === ORB_STATE.LISTENING) stopListening()
  }

  const handleSubmitText = (e) => {
    e.preventDefault()
    if (!inputText.trim()) return
    setChatOpen(true)
    processText(inputText)
    setInputText('')
  }

  useEffect(() => {
    return () => {
      if (isNative) SpeechRecognition.removeAllListeners()
    }
  }, [])

  return (
    <div className="app">
      <div className="grid-bg" />

      <header className="topbar">
        <button className="icon-btn" aria-label="მენიუ">
          <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
            <rect width="22" height="2.5" rx="1.25" fill="white" />
            <rect y="6.75" width="15" height="2.5" rx="1.25" fill="white" />
            <rect y="13.5" width="22" height="2.5" rx="1.25" fill="white" />
          </svg>
        </button>
        <button className="avatar-btn" aria-label="პროფილი">
          <div className="avatar-badge">✦</div>
        </button>
      </header>

      {!chatOpen && (
        <div className="hero">
          <h1 className="hero-title">
            მოგესალმებათ
            <br />
            გიო
          </h1>
        </div>
      )}

      <main className="stage">
        {chatOpen && (
          <div className="chat-log">
            {messages.map((m, i) => (
              <div key={i} className={`bubble ${m.from}`}>
                {m.text}
              </div>
            ))}
          </div>
        )}

        <div className="orb-wrap">
          <button
            className={`orb ${orbState}`}
            onMouseDown={handleOrbPressStart}
            onMouseUp={handleOrbPressEnd}
            onMouseLeave={handleOrbPressEnd}
            onTouchStart={handleOrbPressStart}
            onTouchEnd={handleOrbPressEnd}
            aria-label="დააჭირე და ილაპარაკე"
          >
            <span className="pulse-ring" />
            <span className="pulse-ring delay" />
            <div className="eyes">
              <span className="eye" />
              <span className="eye" />
            </div>
          </button>
          {orbState === ORB_STATE.LISTENING && <p className="hint">გისმენ...</p>}
        </div>
      </main>

      <form className="bottom-bar" onSubmit={handleSubmitText}>
        <div className="text-pill">
          <span className="sparkle">✦</span>
          <input
            type="text"
            placeholder="მკითხე"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
        </div>
        <button
          type="button"
          className={`mic-btn ${orbState === ORB_STATE.LISTENING ? 'active' : ''}`}
          onClick={() => (orbState === ORB_STATE.LISTENING ? stopListening() : startListening())}
          aria-label="ხმით ლაპარაკი"
        >
          <svg width="16" height="18" viewBox="0 0 16 18" fill="none">
            <rect x="0" y="4" width="3" height="10" rx="1.5" fill="white" />
            <rect x="6.5" y="0" width="3" height="18" rx="1.5" fill="white" />
            <rect x="13" y="6" width="3" height="6" rx="1.5" fill="white" />
          </svg>
        </button>
      </form>
    </div>
  )
}
