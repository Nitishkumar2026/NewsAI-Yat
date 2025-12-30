import React, { useState, useEffect } from 'react';
import { extractFullContent } from '../utils/scraper';

const NewsDetail = ({ article, onBack, fontSize = 'medium', appLanguage = 'en' }) => {
    const [isReading, setIsReading] = useState(false);
    const [translatedContent, setTranslatedContent] = useState(null);
    const [translating, setTranslating] = useState(false);
    const [targetLang, setTargetLang] = useState('hi');
    const [fullContent, setFullContent] = useState(null);
    const [loadingContent, setLoadingContent] = useState(false);

    // Fetch full content on mount
    useEffect(() => {
        const getFullText = async () => {
            setLoadingContent(true);
            const content = await extractFullContent(article.url);
            setFullContent(content);
            setLoadingContent(false);
        };
        getFullText();

        return () => window.speechSynthesis.cancel();
    }, [article.url]);

    const [availableVoices, setAvailableVoices] = useState([]);
    const [selectedVoice, setSelectedVoice] = useState(null);
    const [speechRate, setSpeechRate] = useState(1.0);

    // Load available voices
    useEffect(() => {
        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            // Filter for high-quality voices (Google, Microsoft, Natural) depending on OS
            const highQualityVoices = voices.filter(v =>
                v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Premium')
            );
            setAvailableVoices(voices);
            // Default to a high-quality English voice if available
            const defaultVoice = highQualityVoices.find(v => v.lang.startsWith('en')) || voices.find(v => v.lang.startsWith('en'));
            if (defaultVoice) setSelectedVoice(defaultVoice.name);
        };

        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }, []);

    // Handle Text Selection for Speech
    useEffect(() => {
        const handleSelection = () => {
            const selection = window.getSelection().toString();
            if (selection && selection.length > 5 && !isReading) {
                // Optional: Show a small popup button near selection (simplified here for now)
            }
        };
        document.addEventListener('mouseup', handleSelection);
        return () => document.removeEventListener('mouseup', handleSelection);
    }, [isReading]);

    const handleListen = (textToRead = null) => {
        if (isReading) {
            window.speechSynthesis.cancel();
            setIsReading(false);
        } else {
            // Priority: Selected text -> Translated text -> Full article
            const selection = window.getSelection().toString();
            const content = textToRead || selection || translatedContent || fullContent || `${article.title}. ${article.description}`;

            if (!content) return;

            const utterance = new SpeechSynthesisUtterance(content);
            const voice = availableVoices.find(v => v.name === selectedVoice);
            if (voice) utterance.voice = voice;

            utterance.rate = speechRate;
            utterance.pitch = 1.0;

            utterance.onend = () => setIsReading(false);
            window.speechSynthesis.speak(utterance);
            setIsReading(true);
        }
    };

    const handleTranslate = async () => {
        if (targetLang === 'en') {
            setTranslatedContent(null); // English is the original
            return;
        }

        setTranslating(true);
        try {
            const textToTranslate = fullContent || `${article.title}\n\n${article.description}`;
            // AllOrigins to fetch translation from Lingva (avoiding CORS)
            const apiUrl = `https://lingva.ml/api/v1/en/${targetLang}/${encodeURIComponent(textToTranslate.slice(0, 5000))}`;
            const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(apiUrl)}`);
            const proxyData = await response.json();
            const data = JSON.parse(proxyData.contents);

            if (data.translation) {
                setTranslatedContent(data.translation);
            } else {
                throw new Error("Invalid response");
            }
        } catch (err) {
            console.error("Translation error:", err);
            alert("Translation failed. Try another language or try again later.");
        } finally {
            setTranslating(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className={`news-detail-container fade-in reader-font-${fontSize}`}>
            <div className="detail-nav">
                <button onClick={onBack} className="back-btn">← Back to Feed</button>
                <div className="detail-actions">
                    <div className="audio-controls">
                        {availableVoices.length > 0 && (
                            <select
                                className="voice-select"
                                value={selectedVoice || ''}
                                onChange={(e) => setSelectedVoice(e.target.value)}
                                title="Select Voice"
                            >
                                {availableVoices.filter(v => v.lang.startsWith('en') || v.lang.startsWith('hi')).map(v => (
                                    <option key={v.name} value={v.name}>{v.name.replace('Microsoft', '').replace('Google', '')}</option>
                                ))}
                            </select>
                        )}
                        <button onClick={() => setSpeechRate(r => r === 1.5 ? 0.8 : r + 0.1 > 1.5 ? 0.8 : r + 0.1)} className="speed-btn" title="Speed">
                            {speechRate.toFixed(1)}x
                        </button>
                        <button onClick={() => handleListen()} className={`action-btn-icon ${isReading ? 'active' : ''}`} title="Listen (Select text to read specifically)">
                            {isReading ? '🛑 Stop' : '🔊 Listen'}
                        </button>
                    </div>

                    <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)} className="lang-select">
                        <option value="en">English (Default)</option>
                        <option value="hi">Hindi (हिन्दी)</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="ja">Japanese</option>
                    </select>
                    <button onClick={handleTranslate} className="action-btn-icon" title="Translate" disabled={translating}>
                        {translating ? '⏳' : '🌐 Translate'}
                    </button>
                    <button onClick={() => window.open(article.url, '_blank')} className="action-btn-text">Open Original ↗</button>
                </div>
            </div>

            <div className="detail-content-full premium-reader inline-article">
                <div className="article-column-full">
                    <div className="article-hero enhanced">
                        <img
                            src={article.image || article.urlToImage || 'https://placehold.co/1200x600?text=YAT+News'}
                            alt={article.title}
                            className="detail-image"
                        />
                        <div className="hero-overlay">
                            <span className="detail-source-tag">{article.source?.name}</span>
                            <h1 className="detail-title-large">{article.title}</h1>
                        </div>
                    </div>

                    <div className="reader-meta">
                        <p className="author-line">Published {formatDate(article.publishedAt)} {article.author && `• By ${article.author}`}</p>
                    </div>

                    <div className="detail-body-premium">
                        {loadingContent ? (
                            <div className="loading-content-msg">
                                <div className="spinner"></div>
                                <p>Extracted full content for you...</p>
                            </div>
                        ) : translatedContent ? (
                            <div className="translated-box fade-in">
                                <div className="content-text-main translated">{translatedContent}</div>
                                <button className="secondary-btn" onClick={() => setTranslatedContent(null)}>← Show Original</button>
                            </div>
                        ) : (
                            <>
                                <p className="lead-text-premium">{article.description}</p>
                                <div className="content-text-main reader-content">
                                    {fullContent || article.content || "Fetching full content..."}
                                </div>
                            </>
                        )}

                        <div className="reader-separator"></div>
                        <p className="footer-note">This content was extracted and optimized for YAT NewsAI.
                            <a href={article.url} target="_blank" rel="noreferrer"> Read on original site</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewsDetail;
