import React, { useState, useEffect } from 'react';

const NewsDetail = ({ article, onBack }) => {
    const [showIframe, setShowIframe] = useState(false);
    const [isReading, setIsReading] = useState(false);
    const [translatedContent, setTranslatedContent] = useState(null);
    const [translating, setTranslating] = useState(false);
    const [targetLang, setTargetLang] = useState('hi'); // Default Hindi

    // Stop speech on unmount
    useEffect(() => {
        return () => window.speechSynthesis.cancel();
    }, []);

    const handleListen = () => {
        if (isReading) {
            window.speechSynthesis.cancel();
            setIsReading(false);
        } else {
            const textToRead = `${article.title}. ${article.description}. ${article.content || ''}`;
            const utterance = new SpeechSynthesisUtterance(textToRead);
            utterance.onend = () => setIsReading(false);
            window.speechSynthesis.speak(utterance);
            setIsReading(true);
        }
    };

    const handleTranslate = async () => {
        setTranslating(true);
        try {
            const text = `${article.title}\n\n${article.description}\n\n${article.content || ''}`;
            // Using a public Lingva instance (free libre translation mirror)
            const response = await fetch(`https://lingva.ml/api/v1/en/${targetLang}/${encodeURIComponent(text)}`);
            const data = await response.json();
            if (data.translation) {
                setTranslatedContent(data.translation);
            } else {
                alert("Translation failed. Try again later.");
            }
        } catch (err) {
            console.error("Translation error:", err);
            alert("Translation unavailable right now.");
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
        <div className="news-detail-container">
            <div className="detail-nav">
                <button onClick={onBack} className="back-btn">← Back</button>
                <div className="detail-actions">
                    <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)} className="lang-select">
                        <option value="hi">Hindi</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="ja">Japanese</option>
                    </select>
                    <button onClick={handleTranslate} className="action-btn-icon" title="Translate" disabled={translating}>
                        {translating ? '⏳' : '🌐'}
                    </button>
                    <button onClick={handleListen} className={`action-btn-icon ${isReading ? 'active' : ''}`} title="Listen">
                        {isReading ? '🛑 Stop' : '🔊 Listen'}
                    </button>
                    <button onClick={() => window.open(article.url, '_blank')} className="action-btn-text">Source ↗</button>
                </div>
            </div>

            <div className="detail-content-full premium-reader">
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
                        {translatedContent ? (
                            <div className="translated-box fade-in">
                                <h3>Translation ({targetLang.toUpperCase()})</h3>
                                <div className="content-text-main translated">{translatedContent}</div>
                                <button className="secondary-btn" onClick={() => setTranslatedContent(null)}>Show Original</button>
                            </div>
                        ) : (
                            <>
                                <p className="lead-text-premium">{article.description}</p>
                                <div className="content-text-main">
                                    {article.content?.split('[')[0]}
                                    {/* Mock full content for demonstration if snippet is too short */}
                                    {(!article.content || article.content.length < 200) && (
                                        <p className="reader-hint">
                                            The full article continues at the official source. YAT AI Aggregator has extracted the key highlights above to save you time.
                                            You can use the 'Read Full Article' button below to stay on this page while browsing the original site.
                                        </p>
                                    )}
                                </div>
                            </>
                        )}

                        <div className="reader-separator"></div>

                        {!showIframe ? (
                            <div className="read-more-wrapper">
                                <button onClick={() => setShowIframe(true)} className="primary-btn-premium">
                                    Read Full Article (In-App View)
                                </button>
                            </div>
                        ) : (
                            <div className="iframe-wrapper enhanced">
                                <div className="iframe-header">
                                    <span>YAT SafeView: {article.source?.name}</span>
                                    <button onClick={() => setShowIframe(false)}>✕ Close</button>
                                </div>
                                <iframe src={article.url} title="News Source" className="news-iframe-large" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewsDetail;
