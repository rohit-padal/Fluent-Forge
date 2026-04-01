import { useState, useRef, useEffect } from 'react'
import { MessageSquare, Briefcase, Coffee, Send, KeyRound, Activity, TrendingUp, Target, Zap, ChevronDown, ChevronUp } from 'lucide-react'
import { initGemini, generateResponse } from './gemini'

function App() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '')
  const [isKeyValid, setIsKeyValid] = useState(!!localStorage.getItem('gemini_api_key'))
  const [mode, setMode] = useState(null)
  
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showMobileInsights, setShowMobileInsights] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSaveKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('gemini_api_key', apiKey.trim())
      setIsKeyValid(true)
    }
  }

  const startMode = (selectedMode) => {
    if (initGemini(apiKey)) {
      setMode(selectedMode)
      setMessages([])
    } else {
      alert("Invalid API Key format.")
    }
  }

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    const userMsg = { role: 'user', text: inputValue };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await generateResponse(messages, userMsg.text, mode);
      const aiMsg = { role: 'model', ...response };
      setMessages(prev => [...prev, aiMsg]);
      // Auto collapse mobile insights on new interaction
      setShowMobileInsights(false);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', raw: `Error: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  }

  if (!isKeyValid) {
    return (
      <div className="setup-container">
        <KeyRound size={48} color="var(--primary-color)" style={{ marginBottom: '24px' }} />
        <h1 style={{ margin: '0 0 12px 0', fontSize: '2rem', color: 'var(--text-dark)' }}>AI Language Trainer</h1>
        <p style={{ color: 'var(--text-light)', marginBottom: '32px', fontSize: '1.1rem' }}>Enter your Gemini API Key to secure your session</p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <input 
            type="password" 
            value={apiKey} 
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIzaSy..." 
            style={{ padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none', width: '100%', maxWidth: '320px', fontSize: '1rem', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }}
          />
          <button onClick={handleSaveKey} style={{ padding: '16px 28px', borderRadius: '12px', background: 'var(--primary-color)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '1rem', transition: 'background 0.2s', boxShadow: '0 4px 6px rgba(59, 130, 246, 0.2)' }}>Explore</button>
        </div>
      </div>
    )
  }

  if (!mode) {
    return (
      <div className="mode-selection">
        <h1 style={{ fontSize: '2.5rem', margin: '0 0 16px 0', color: 'var(--text-dark)' }}>Choose Your Practice Arena</h1>
        <p style={{ color: 'var(--text-light)', marginBottom: '48px', fontSize: '1.1rem' }}>Select a specialized scenario to dynamically test your communication skills.</p>
        <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap', width: '100%' }}>
          <button onClick={() => startMode('Job Interview')} className="mode-card">
            <div style={{ padding: '16px', background: '#eff6ff', borderRadius: '16px' }}><Briefcase size={40} color="var(--primary-color)" /></div>
            <h2>Job Interview</h2>
          </button>
          <button onClick={() => startMode('Daily Conversation')} className="mode-card">
            <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '16px' }}><Coffee size={40} color="#16a34a" /></div>
            <h2 style={{ color: '#16a34a' }}>Daily Conversation</h2>
          </button>
          <button onClick={() => startMode('Professional Communication')} className="mode-card">
            <div style={{ padding: '16px', background: '#faf5ff', borderRadius: '16px' }}><MessageSquare size={40} color="#c026d3" /></div>
            <h2 style={{ color: '#c026d3' }}>Professional Comm</h2>
          </button>
        </div>
        <button onClick={() => { setIsKeyValid(false); localStorage.removeItem('gemini_api_key'); setApiKey(''); }} style={{ marginTop: '60px', padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', color: 'var(--text-light)', fontWeight: '500', transition: 'all 0.2s' }}>Revoke API Key</button>
      </div>
    )
  }

  const modelMessages = messages.filter(m => m.role === 'model');
  const latestModelMsg = modelMessages.length > 0 ? modelMessages[modelMessages.length - 1] : null;

  const renderInsights = () => (
    <>
      <div className="insight-card style">
        <div className="insight-label"><MessageSquare size={16} /> Communication Style</div>
        <div className="insight-value">
          {latestModelMsg?.insight || 'Waiting for input...'}
        </div>
      </div>

      <div className="insight-card strengths">
        <div className="insight-label"><TrendingUp size={16} /> Strengths</div>
        <div className="insight-value">
          {latestModelMsg?.strengths || '-'}
        </div>
      </div>

      <div className="insight-card areas">
        <div className="insight-label"><Target size={16} /> Areas to Improve</div>
        <div className="insight-value">
          {latestModelMsg?.areasToImprove || '-'}
        </div>
      </div>

      <div className="insight-card upgrade">
        <div className="insight-label"><Zap size={16} /> Suggested Upgrade</div>
        <div className="insight-value">
          {latestModelMsg?.upgrade || '-'}
        </div>
      </div>
    </>
  );

  return (
    <div className="layout-wrapper">
      {/* Main Chat Container */}
      <div className="chat-main">
        <header>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              { mode === 'Job Interview' && <Briefcase size={20} color="var(--primary-color)" /> }
              { mode === 'Daily Conversation' && <Coffee size={20} color="#16a34a" /> }
              { mode === 'Professional Communication' && <MessageSquare size={20} color="#c026d3" /> }
            </div>
            <h2>{mode}</h2>
          </div>
          <button onClick={() => setMode(null)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-dark)', transition: 'background 0.2s' }}>End Session</button>
        </header>

        {/* Top Summary Bar */}
        {latestModelMsg?.level && latestModelMsg.level !== 'Not Detected' && (
          <div className="top-summary-bar">
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
               <span style={{ fontWeight: '500', color: 'var(--text-light)', fontSize: '0.9rem' }}>Detected Proficiency Level:</span>
               <span className="level-badge">{latestModelMsg.level}</span>
             </div>
          </div>
        )}
        
        <div className="chat-messages">
          {messages.length === 0 && (
             <div style={{ textAlign: 'center', padding: '40px 20px', background: '#f8fafc', borderRadius: '16px', border: '2px dashed #cbd5e1', maxWidth: '400px', margin: '40px auto', color: '#64748b' }}>
               <h3 style={{ margin: '0 0 10px 0', color: '#334155' }}>Ready to practice!</h3>
               <p style={{ margin: 0, fontSize: '0.95rem' }}>Send a message to start your session. I will evaluate your English and provide detailed feedback.</p>
             </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`message-wrapper ${msg.role === 'user' ? 'message-user' : 'message-ai'}`}>
              {msg.role === 'user' ? (
                msg.text
              ) : (
                msg.raw && !msg.feedback && !msg.nextQuestion ? (
                  <p style={{ margin: 0 }}>{msg.raw}</p>
                ) : (
                  <div className="ai-content">
                    {msg.feedback && msg.feedback.length > 5 && (
                       <div className="ai-section feedback">
                         <span className="ai-section-title">Feedback</span>
                         <p>{msg.feedback}</p>
                       </div>
                    )}
                    {msg.improved && msg.improved.length > 5 && (
                       <div className="ai-section improved">
                         <span className="ai-section-title">Improved Version</span>
                         <p>{msg.improved}</p>
                       </div>
                    )}
                    {msg.enhancement && msg.enhancement.length > 5 && !msg.enhancement.toLowerCase().includes('no specific') && !msg.enhancement.toLowerCase().includes('no further') && (
                       <div className="ai-section enhancement">
                         <span className="ai-section-title">Enhancement</span>
                         <p>{msg.enhancement}</p>
                       </div>
                    )}
                    {msg.nextQuestion && msg.nextQuestion.length > 5 && (
                       <div className="next-question">
                         <p>{msg.nextQuestion}</p>
                       </div>
                    )}
                  </div>
                )
              )}
            </div>
          ))}
          {isLoading && (
            <div className="message-wrapper message-ai" style={{ alignSelf: 'flex-start', padding: '24px' }}>
              <div className="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          )}
          
          {/* Mobile Insights Panel */}
          {latestModelMsg && (
             <div className="mobile-insights-container">
               <button 
                 className="mobile-insights-toggle"
                 onClick={() => setShowMobileInsights(!showMobileInsights)}
               >
                 <Activity size={18} />
                 {showMobileInsights ? 'Hide Session Insights' : 'Show Session Insights'}
                 {showMobileInsights ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
               </button>
               
               {showMobileInsights && (
                 <div className="mobile-insights-content">
                   {renderInsights()}
                 </div>
               )}
             </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                 e.preventDefault();
                 sendMessage();
              }
            }}
            placeholder="Type your message..." 
            autoFocus
          />
          <button 
            className="btn-send"
            onClick={sendMessage} 
            disabled={!inputValue.trim() || isLoading}
          >
            <Send size={22} style={{ marginLeft: '-2px' }} />
          </button>
        </div>
      </div>

      {/* Right Side Panel (Desktop Only) */}
      <div className="right-panel">
        <h3 className="panel-title"><Activity size={24} color="var(--primary-color)"/> Session Insights</h3>
        {renderInsights()}
      </div>
    </div>
  )
}

export default App
