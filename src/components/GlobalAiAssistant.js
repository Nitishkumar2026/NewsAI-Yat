import React, { useState, useRef, useEffect } from 'react';
import { callDeepSeek } from '../utils/aiService';
import { YatAiLogo } from './Icons';
import './GlobalAiAssistant.css';

const GlobalAiAssistant = ({ onClose, selectedArticle }) => {
    const [messages, setMessages] = useState([
        { role: 'ai', text: "Hello! I'm your YAT Assistant. I can help with news summaries, translations, or general questions. How can I help you today?" }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [targetLang, setTargetLang] = useState('Hindi');
    const messagesEndRef = useRef(null);

    // Stop speech when unmounting
    useEffect(() => {
        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const getSystemContext = () => {
        if (!selectedArticle) {
            return "You are a knowledgeable news assistant. Help the user with their questions about news, current events, or general knowledge. Keep answers concise and helpful.";
        }
        return `You are a helpful news assistant. The user is reading an article titled "${selectedArticle.title}" from "${selectedArticle.source?.name}". 
        Description: "${selectedArticle.description}". 
        Content: "${selectedArticle.content}".`;
    };

    const handleSend = async (e, customPrompt = null) => {
        if (e) e.preventDefault();
        const userText = customPrompt || input;
        if (!userText.trim()) return;

        if (!customPrompt) setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userText }]);
        setLoading(true);

        try {
            const aiText = await callDeepSeek(userText, getSystemContext());
            setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
        } catch (err) {
            console.error("Assistant component error:", err);
            setMessages(prev => [...prev, { role: 'ai', text: "I'm having trouble connecting to my brain right now. Please try again in a moment." }]);
        } finally {
            setLoading(false);
        }
    };

    const handleSummarize = () => {
        handleSend(null, "Please provide a comprehensive summary of this news topic in 3 bullet points.");
    };

    const handleTranslate = () => {
        handleSend(null, `Translate the summary or the main points of this article into ${targetLang}. Keep the tone professional.`);
    };

    const handleSpeak = () => {
        if ('speechSynthesis' in window) {
            if (isSpeaking) {
                window.speechSynthesis.cancel();
                setIsSpeaking(false);
            } else {
                const lastAiMsg = [...messages].reverse().find(m => m.role === 'ai')?.text;
                const textToRead = lastAiMsg || (selectedArticle ? selectedArticle.description : "No content to read.");
                const utterance = new SpeechSynthesisUtterance(textToRead);
                utterance.onend = () => setIsSpeaking(false);
                window.speechSynthesis.speak(utterance);
                setIsSpeaking(true);
            }
        } else {
            alert("Text-to-Speech is not supported in this browser.");
        }
    };

    return (
        <div className="global-ai-widget fade-in-up">
            <div className="global-ai-header">
                <div className="header-title">
                    <YatAiLogo size={30} />
                    <h3>YAT AI Assistant {selectedArticle ? ' (Article Mode)' : ''}</h3>
                </div>
                <button onClick={onClose} className="close-btn">×</button>
            </div>

            {selectedArticle && (
                <div className="ai-context-bar">
                    <select
                        className="lang-select-small"
                        value={targetLang}
                        onChange={(e) => setTargetLang(e.target.value)}
                    >
                        <option value="Hindi">Hindi</option>
                        <option value="Spanish">Spanish</option>
                        <option value="French">French</option>
                        <option value="German">German</option>
                    </select>
                    <button onClick={handleSummarize} disabled={loading} className="context-tool-btn" title="Summarize">
                        📝 Sum
                    </button>
                    <button onClick={handleTranslate} disabled={loading} className="context-tool-btn" title="Translate">
                        🌐 Trans
                    </button>
                    <button onClick={handleSpeak} className={`context-tool-btn ${isSpeaking ? 'active' : ''}`} title="Listen">
                        {isSpeaking ? '🛑' : '🔊'}
                    </button>
                </div>
            )}

            <div className="global-ai-messages">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`message ${msg.role}`}>
                        <div className="message-bubble">
                            {msg.text}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="message ai">
                        <div className="message-bubble typing">
                            <span>.</span><span>.</span><span>.</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="global-ai-input">
                <input
                    type="text"
                    placeholder="Ask something..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={loading}
                />
                <button type="submit" disabled={loading || !input.trim()}>
                    ➤
                </button>
            </form>
        </div>
    );
};

export default GlobalAiAssistant;
