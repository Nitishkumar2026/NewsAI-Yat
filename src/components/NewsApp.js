import React, { useEffect, useState } from 'react';
import Card from './Card';
import NewsDetail from './NewsDetail';
import GlobalAiAssistant from './GlobalAiAssistant';
import { semanticRerank } from '../utils/aiService';
import './GlobalAiAssistant.css';

const NewsApp = () => {
  const [search, setSearch] = useState("All News");
  const [newsData, setNewsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All News");
  const [theme, setTheme] = useState('light');
  const [bookmarks, setBookmarks] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showAiWidget, setShowAiWidget] = useState(false);

  // API KEYS
  const GNEWS_API_KEY = "ecc08c1ed5ec3a3e668a7e5e5bd99792";
  const NEWSAPI_KEY = "6990d1cc14354f439658e5dea2327782";

  // Load bookmarks from local storage on mount
  useEffect(() => {
    const savedBookmarks = JSON.parse(localStorage.getItem('newsBookmarks')) || [];
    setBookmarks(savedBookmarks);
  }, []);

  const toggleBookmark = (article) => {
    let updatedBookmarks;
    // Check if article is already bookmarked (by title/url uniqueness)
    const exists = bookmarks.find(b => b.url === article.url);

    if (exists) {
      updatedBookmarks = bookmarks.filter(b => b.url !== article.url);
    } else {
      updatedBookmarks = [...bookmarks, article];
    }

    setBookmarks(updatedBookmarks);
    localStorage.setItem('newsBookmarks', JSON.stringify(updatedBookmarks));
  };

  const getData = async (query) => {
    if (query === "Bookmarks") {
      setNewsData(bookmarks);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Normalize query for NewsAPI
    let apiQuery = query;
    if (!query || query === "All News" || query === "Top Stories") {
      apiQuery = "latest news";
    }

    try {
      // STRATEGY 1: NewsAPI (High Volume: up to 100 articles)
      console.log("Fetching NewsAPI:", apiQuery);

      const response = await fetch(`https://newsapi.org/v2/everything?q=${apiQuery}&pageSize=100&sortBy=publishedAt&apiKey=${NEWSAPI_KEY}`);

      if (!response.ok) {
        throw new Error(`NewsAPI Error: ${response.status}`);
      }

      const jsonData = await response.json();

      // Filter out articles with removed content (common in NewsAPI)
      const validArticles = jsonData.articles?.filter(article =>
        article.title !== "[Removed]" && article.description !== "[Removed]"
      ) || [];

      if (validArticles.length > 0) {
        setNewsData(validArticles);
      } else {
        throw new Error("NewsAPI returned no valid articles");
      }

    } catch (newsApiError) {
      console.warn("NewsAPI failed, switching to GNews fallback...", newsApiError);

      // STRATEGY 2: GNews (Reliable but limited to 10)
      try {
        const gnewsCategory = mapCategoryToGNews(query || "All News");
        let url;

        if ((!query || query === "All News" || query === "Top Stories") || gnewsCategory) {
          url = `https://gnews.io/api/v4/top-headlines?category=${gnewsCategory || 'general'}&lang=en&apikey=${GNEWS_API_KEY}`;
        } else {
          url = `https://gnews.io/api/v4/search?q=${query}&lang=en&apikey=${GNEWS_API_KEY}`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error(`GNews Error: ${response.status}`);

        const jsonData = await response.json();
        setNewsData(jsonData.articles || []);

      } catch (finalError) {
        console.error(finalError);
        setError("Unable to fetch news from any source. Please check your internet connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  const mapCategoryToGNews = (cat) => {
    const mapping = {
      "All News": "general",
      "Top Stories": "general",
      "World": "world",
      "Trending": "nation",
      "Technology": "technology",
      "Business": "business",
      "Finance": "business",
      "Sports": "sports",
      "Health": "health",
      "Entertainment": "entertainment",
      "Science": "science"
    };
    return mapping[cat] || null;
  };

  useEffect(() => {
    getData("All News");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInput = (e) => {
    setSearch(e.target.value);
  };

  const handleSearch = async () => {
    if (search.trim()) {
      const query = search.trim();
      setActiveCategory("Search Results");
      setSelectedArticle(null);

      // Step 1: Normal fetch
      await getData(query);

      // Step 2: Semantic Rerank ("Vector Search")
      setLoading(true); // Show loading while reranking
      setNewsData(prevData => {
        if (!prevData || prevData.length === 0) return prevData;

        // Perform reranking asynchronously
        semanticRerank(query, prevData).then(rankedData => {
          setNewsData(rankedData);
          setLoading(false);
        });

        return prevData; // Keep old data while ranking
      });
    }
  };

  const handleCategoryClick = (category) => {
    setActiveCategory(category);
    setSearch(category);
    getData(category);
    setSelectedArticle(null);
    setShowSidebar(false);
  };

  const handleArticleClick = (article) => {
    setSelectedArticle(article);
    window.scrollTo(0, 0);
  };

  // Mock User
  const user = {
    name: "John Doe",
    status: "Premium Member",
    avatar: "https://ui-avatars.com/api/?name=John+Doe&background=random"
  };

  return (
    <div className='app-container'>
      {/* SIDEBAR */}
      <aside className={`sidebar ${showSidebar ? 'show' : ''}`}>
        <div className='logo-area'>
          <button className="close-sidebar-btn" onClick={() => setShowSidebar(false)}>✕</button>
          <div className='logo-icon'>YAT</div>
          <div className='logo-text'>
            <span>NewsAI</span>
            <small>BY YUBISAKI</small>
          </div>
        </div>

        <div className='sidebar-menu'>
          <div className='menu-section'>
            <p className='menu-label'>MENU</p>
            <button
              className={`menu-item ${activeCategory === 'All News' ? 'active' : ''}`}
              onClick={() => handleCategoryClick("All News")}
            >
              🏠 Top Stories
            </button>
            <button
              className={`menu-item ${activeCategory === 'World' ? 'active' : ''}`}
              onClick={() => handleCategoryClick("World")}
            >
              🌍 World News
            </button>
            <button
              className={`menu-item ${activeCategory === 'Trending' ? 'active' : ''}`}
              onClick={() => handleCategoryClick("Trending")}
            >
              📈 Trending
            </button>
            <button
              className={`menu-item ${activeCategory === 'Bookmarks' ? 'active' : ''}`}
              onClick={() => handleCategoryClick("Bookmarks")}
            >
              🔖 Bookmarks ({bookmarks.length})
            </button>
          </div>

          <div className='menu-section'>
            <p className='menu-label'>INTERESTS</p>
            <button
              className={`menu-item ${activeCategory === 'Technology' ? 'active' : ''}`}
              onClick={() => handleCategoryClick("Technology")}
            >
              • Technology
            </button>
            <button
              className={`menu-item ${activeCategory === 'Finance' ? 'active' : ''}`}
              onClick={() => handleCategoryClick("Finance")}
            >
              • Finance
            </button>
            <button
              className={`menu-item ${activeCategory === 'Sports' ? 'active' : ''}`}
              onClick={() => handleCategoryClick("Sports")}
            >
              • Sports
            </button>
            <button
              className={`menu-item ${activeCategory === 'Health' ? 'active' : ''}`}
              onClick={() => handleCategoryClick("Health")}
            >
              • Health
            </button>
            <button
              className={`menu-item ${activeCategory === 'Entertainment' ? 'active' : ''}`}
              onClick={() => handleCategoryClick("Entertainment")}
            >
              • Entertainment
            </button>
          </div>
        </div>

        <div className='user-profile'>
          <img src={user.avatar} alt="User" />
          <div className='user-info'>
            <p className='user-name'>{user.name}</p>
            <p className='user-status'>{user.status}</p>
          </div>
        </div>

        <div className='sidebar-footer'>
          <p>© 2025 Yubisaki</p>
          <p>Product of YAT</p>
        </div>
      </aside>

      {/* OVERLAY for Mobile Sidebar */}
      {showSidebar && <div className="sidebar-overlay" onClick={() => setShowSidebar(false)}></div>}

      {/* MAIN CONTENT */}
      <main className='main-content'>
        {/* HEADER */}
        <header className='top-bar'>
          <div className="mobile-menu-btn" onClick={() => setShowSidebar(true)}>
            ☰
          </div>

          <div className='search-container'>
            <input
              type='text'
              placeholder='Search for news...'
              value={search}
              onChange={handleInput}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch}>🔍</button>
          </div>

          <div className='top-actions'>
            <button className='action-btn' onClick={() => {
              const newTheme = theme === 'light' ? 'dark' : 'light';
              setTheme(newTheme);
              document.documentElement.setAttribute('data-theme', newTheme);
            }}>
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            <button className='action-btn'>🔔</button>
          </div>
        </header>

        {/* BREAKING NEWS TICKER - Hide in Detail View */}
        {newsData && newsData.length > 0 && activeCategory !== 'Bookmarks' && !selectedArticle && (
          <div className='news-ticker'>
            <div className='ticker-label'>BREAKING</div>
            <div className='ticker-content'>
              <div className='ticker-track'>
                {newsData.slice(0, 8).map((item, index) => (
                  <span key={index} className='ticker-item'>• {item.title}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CONTENT AREA */}
        <div className='content-area'>
          {selectedArticle ? (
            <NewsDetail
              article={selectedArticle}
              onBack={() => setSelectedArticle(null)}
            />
          ) : (
            <>
              <div className='content-header'>
                <h2>{activeCategory === 'All News' ? 'Top Stories' : activeCategory}</h2>
                <p>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>

              {loading ? (
                <div className='loading-container'>
                  <div className='spinner'></div>
                </div>
              ) : error ? (
                <div className='error-message'>
                  <p>{error}</p>
                  <button className='read-more-btn' onClick={() => getData("All News")}>Try Again</button>
                </div>
              ) : !newsData || newsData.length === 0 ? (
                <div className='empty-state'>
                  <p>
                    {activeCategory === 'Bookmarks'
                      ? "You haven't bookmarked any articles yet."
                      : `No news found for "${search}".`}
                  </p>
                </div>
              ) : (
                <div className='card-grid'>
                  <Card
                    data={newsData}
                    bookmarks={bookmarks}
                    toggleBookmark={toggleBookmark}
                    onArticleClick={handleArticleClick}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* GLOBAL AI ASSISTANT */}
      {!showAiWidget && (
        <button className="ai-fab" onClick={() => setShowAiWidget(true)} title="Ask AI">
          🤖
        </button>
      )}
      {showAiWidget && (
        <GlobalAiAssistant
          onClose={() => setShowAiWidget(false)}
          selectedArticle={selectedArticle}
        />
      )}
    </div>
  );
};

export default NewsApp;
