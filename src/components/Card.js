import React from 'react';

// Sub-component for individual news item to manage its own state (bookmark)
const NewsItem = ({ item, isBookmarked, toggleBookmark, onArticleClick }) => {
    
    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: item.title,
                    text: item.description,
                    url: item.url,
                });
            } catch (error) {
                console.log('Error sharing', error);
            }
        } else {
            // Fallback: Copy to clipboard
            navigator.clipboard.writeText(item.url);
            alert("Link copied to clipboard!");
        }
    };

    const handleReadMore = () => {
        if (onArticleClick) {
            onArticleClick(item);
        } else {
            window.open(item.url, '_blank');
        }
    };

    const imageUrl = item.image || item.urlToImage || 'https://placehold.co/600x400?text=News+Image';

    return (
        <div className='news-card'>
            <div className='card-image-container'>
                <img 
                    src={imageUrl} 
                    alt={item.title} 
                    className='card-image'
                    onError={(e) => { e.target.src = 'https://placehold.co/600x400?text=News+Image'; }} 
                />
                <span className='source-badge'>{item.source?.name || 'News'}</span>
            </div>
            
            <div className='card-content'>
                <h3 className='card-title' onClick={handleReadMore}>
                    {item.title}
                </h3>
                <p className='card-desc'>
                    {item.description || "Click 'Read More' to read the full article."}
                </p>
                
                <div className='card-footer'>
                    <button className='read-more-btn' onClick={handleReadMore}>Read More</button>
                    
                    <div className='card-actions'>
                        <button 
                            className={`icon-btn ${isBookmarked ? 'active' : ''}`} 
                            onClick={() => toggleBookmark(item)}
                            title={isBookmarked ? "Remove Bookmark" : "Bookmark"}
                        >
                            {isBookmarked ? '★' : '☆'}
                        </button>
                        <button 
                            className='icon-btn' 
                            onClick={handleShare}
                            title="Share"
                        >
                            ↗
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Card = ({ data, bookmarks, toggleBookmark, onArticleClick }) => {
    return (
        <>
            {data && data.map((curItem, index) => {
                // Ensure unique key if possible, fallback to index
                const uniqueKey = curItem.url || index;
                const isBookmarked = bookmarks?.some(b => b.url === curItem.url);

                return (
                    <NewsItem 
                        key={uniqueKey} 
                        item={curItem} 
                        isBookmarked={isBookmarked}
                        toggleBookmark={toggleBookmark}
                        onArticleClick={onArticleClick}
                    />
                );
            })}
        </>
    );
};

export default Card;
