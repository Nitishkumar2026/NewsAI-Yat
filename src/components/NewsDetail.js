import React, { useState, useEffect } from 'react';
import { callDeepSeek } from '../utils/aiService';

const NewsDetail = ({ article, onBack }) => {
    const [showIframe, setShowIframe] = useState(false);

    // Helper to format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="news-detail-container fade-in">
            {/* Header / Nav */}
            <div className="detail-nav">
                <button onClick={onBack} className="back-btn">
                    ← Back to Feed
                </button>
                <div className="detail-actions">
                    <button onClick={() => window.open(article.url, '_blank')} className="action-btn-text">
                        Open Original ↗
                    </button>
                </div>
            </div>

            <div className="detail-content-full">
                {/* Article Info */}
                <div className="article-column-full">
                    <div className="article-hero">
                        <img
                            src={article.image || article.urlToImage || 'https://placehold.co/800x400?text=News+Image'}
                            alt={article.title}
                            className="detail-image"
                            onError={(e) => { e.target.src = 'https://placehold.co/800x400?text=News+Image'; }}
                        />
                        <span className="detail-source">{article.source?.name}</span>
                    </div>

                    <h1 className="detail-title">{article.title}</h1>
                    <div className="detail-meta">
                        <span>{formatDate(article.publishedAt)}</span>
                        {article.author && <span> • By {article.author}</span>}
                    </div>

                    <div className="detail-body">
                        <p className="lead-text">{article.description}</p>
                        <div className="content-text-main">
                            {article.content?.split('[')[0]}
                        </div>

                        {!showIframe ? (
                            <div className="read-more-wrapper">
                                <p>To read the full story, you can view the source directly.</p>
                                <button onClick={() => setShowIframe(true)} className="primary-btn">
                                    Read Full Article Here (Preview)
                                </button>
                            </div>
                        ) : (
                            <div className="iframe-wrapper">
                                <div className="iframe-header">
                                    <span>Source: {article.source?.name}</span>
                                    <button onClick={() => setShowIframe(false)}>Close Preview</button>
                                </div>
                                <p className="iframe-warning">Note: Some websites may block previews. If it doesn't load, <a href={article.url} target="_blank" rel="noreferrer">click here</a>.</p>
                                <iframe
                                    src={article.url}
                                    title="News Source"
                                    className="news-iframe"
                                    sandbox="allow-scripts allow-same-origin allow-popups" // Security
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewsDetail;
