import React, { useState, useEffect } from 'react';
import { extractFullContent } from '../utils/scraper';

const NewsDetail = ({ article, onBack }) => {
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

    const handleListen = () => {
        if (isReading) {
            window.speechSynthesis.cancel();
            setIsReading(false);
        } else {
            const textToRead = translatedContent || fullContent || `${article.title}. ${article.description}`;
            const utterance = new SpeechSynthesisUtterance(textToRead);

            // Voice improvement: Try to find a high-quality voice
            const voices = window.speechSynthesis.getVoices();
            // Favor 'Google' or 'Premium' sounding voices
            const premiumVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Natural')) || voices[0];
            if (premiumVoice) utterance.voice = premiumVoice;

            utterance.rate = 1.0; // Normal speed
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
        <div className="news-detail-container fade-in">
            <div className="detail-nav">
                <button onClick={onBack} className="back-btn">← Back to Feed</button>
                <div className="detail-actions">
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
                    <button onClick={handleListen} className={`action-btn-icon ${isReading ? 'active' : ''}`} title="Listen">
                        {isReading ? '🛑 Stop' : '🔊 Listen'}
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
                                <div className="content-text-main">
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
