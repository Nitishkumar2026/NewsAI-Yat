import React, { useEffect, useState } from 'react';
import Card from './Card';
import NewsDetail from './NewsDetail';
import GlobalAiAssistant from './GlobalAiAssistant';
import { semanticRerank } from '../utils/aiService';
import { SearchIcon, MicIcon, YatAiLogo } from './Icons';
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
  const [isListening, setIsListening] = useState(false);
  const [settings, setSettings] = useState({
    aiTone: 'Professional',
    newsRegion: 'Global',
    autoRerank: true,
    fontSize: 'medium',
    appTheme: 'light',
    appLanguage: 'en'
  });

  // API KEYS
  const GNEWS_API_KEY = "ecc08c1ed5ec3a3e668a7e5e5bd99792";
  const NEWSAPI_KEY = "6990d1cc14354f439658e5dea2327782";

  // Load bookmarks and settings
  useEffect(() => {
    const savedBookmarks = JSON.parse(localStorage.getItem('newsBookmarks')) || [];
    setBookmarks(savedBookmarks);
    const savedSettings = JSON.parse(localStorage.getItem('yatSettings'));
    if (savedSettings) setSettings(savedSettings);
  }, []);

  const saveSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('yatSettings', JSON.stringify(newSettings));

    // Apply theme immediately if changed
    if (newSettings.appTheme !== theme) {
      setTheme(newSettings.appTheme);
      document.documentElement.setAttribute('data-theme', newSettings.appTheme);
    }
  };

  const toggleBookmark = (article) => {
    let updatedBookmarks;
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

    let apiQuery = query;
    if (!query || query === "All News" || query === "Top Stories") {
      apiQuery = "latest news";
    }

    try {
      const response = await fetch(`https://newsapi.org/v2/everything?q=${apiQuery}&pageSize=50&sortBy=publishedAt&apiKey=${NEWSAPI_KEY}`);
      if (!response.ok) throw new Error(`NewsAPI Error: ${response.status}`);
      const jsonData = await response.json();
      const validArticles = jsonData.articles?.filter(article =>
        article.title !== "[Removed]" && article.description !== "[Removed]" && article.urlToImage
      ) || [];

      if (validArticles.length > 0) {
        setNewsData(validArticles);
      } else {
        throw new Error("No articles found");
      }
    } catch (newsApiError) {
      try {
        const gnewsCategory = mapCategoryToGNews(query || "All News");
        let url = `https://gnews.io/api/v4/top-headlines?category=${gnewsCategory || 'general'}&lang=en&apikey=${GNEWS_API_KEY}`;
        if (query && query !== "All News" && !gnewsCategory) {
          url = `https://gnews.io/api/v4/search?q=${query}&lang=en&apikey=${GNEWS_API_KEY}`;
        }
        const response = await fetch(url);
        if (!response.ok) throw new Error(`GNews Error: ${response.status}`);
        const jsonData = await response.json();
        setNewsData(jsonData.articles || []);
      } catch (finalError) {
        setError("Unable to fetch news. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const mapCategoryToGNews = (cat) => {
    const mapping = {
      "All News": "general", "Top Stories": "general", "World": "world",
      "Trending": "nation", "Technology": "technology", "Business": "business",
      "Finance": "business", "Sports": "sports", "Health": "health",
      "Entertainment": "entertainment", "Science": "science"
    };
    return mapping[cat] || null;
  };

  useEffect(() => {
    getData("All News");
  }, []);

  const handleSearch = async (forcedQuery = null) => {
    const query = forcedQuery || search.trim();
    if (query) {
      setActiveCategory("Search Results");
      setSelectedArticle(null);

      setLoading(true);
      await getData(query);

      if (settings.autoRerank) {
        setLoading(true);
        setNewsData(async (prevData) => {
          if (!prevData || prevData.length === 0) return prevData;
          try {
            const rankedData = await semanticRerank(query, prevData);
            setNewsData(rankedData);
          } catch (e) {
            console.error("Rerank failed", e);
          } finally {
            setLoading(false);
          }
          return prevData;
        });
      }
    }
  };

  const startVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice Search is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSearch(transcript);
      handleSearch(transcript);
    };

    recognition.start();
  };

  const handleCategoryClick = (category) => {
    setActiveCategory(category);
    setSearch(category);
    getData(category);
    setSelectedArticle(null);
    setShowSidebar(false);
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
            <button className={`menu-item ${activeCategory === 'All News' ? 'active' : ''}`} onClick={() => handleCategoryClick("All News")}>🏠 Top Stories</button>
            <button className={`menu-item ${activeCategory === 'World' ? 'active' : ''}`} onClick={() => handleCategoryClick("World")}>🌍 World News</button>
            <button className={`menu-item ${activeCategory === 'Trending' ? 'active' : ''}`} onClick={() => handleCategoryClick("Trending")}>📈 Trending</button>
            <button className={`menu-item ${activeCategory === 'Bookmarks' ? 'active' : ''}`} onClick={() => handleCategoryClick("Bookmarks")}>🔖 Bookmarks ({bookmarks.length})</button>
          </div>

          <div className='menu-section'>
            <p className='menu-label'>INTERESTS</p>
            {['Technology', 'Finance', 'Sports', 'Health', 'Entertainment'].map(cat => (
              <button key={cat} className={`menu-item ${activeCategory === cat ? 'active' : ''}`} onClick={() => handleCategoryClick(cat)}>• {cat}</button>
            ))}
          </div>
        </div>

        <div className='sidebar-settings-btn' onClick={() => setShowSettings(true)}>
          <span className="settings-icon">⚙️</span>
          <span>Setttings</span>
        </div>

        <div className='sidebar-footer'>
          <p>© 2025 Yubisaki</p>
          <p>Product of YAT</p>
        </div>
      </aside>

      {showSidebar && <div className="sidebar-overlay" onClick={() => setShowSidebar(false)}></div>}

      {/* MAIN CONTENT */}
      <main className='main-content'>
        <header className='top-bar'>
          <div className="mobile-menu-btn" onClick={() => setShowSidebar(true)}>☰</div>
          <div className='search-container'>
            <input
              type='text'
              placeholder='Search by Voice or Topic...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={startVoiceSearch} className={`mic-btn ${isListening ? 'listening' : ''}`} title="Voice Search">
              <MicIcon color={isListening ? "#ef4444" : "var(--text-secondary)"} />
            </button>
            <button onClick={() => handleSearch()} className="search-confirm-btn" title="Search">
              <SearchIcon color="white" />
            </button>
          </div>

          <div className='top-actions'>
            <button className='action-btn' onClick={() => setShowSettings(true)}>⚙️</button>
            <button className='action-btn'>🔔</button>
          </div>
        </header>

        {newsData && newsData.length > 0 && activeCategory !== 'Bookmarks' && !selectedArticle && (
          <div className='news-ticker'>
            <div className='ticker-label'>BREAKING</div>
            <div className='ticker-content'>
              <div className='ticker-track'>
                {newsData.slice(0, 8).map((item, index) => <span key={index} className='ticker-item'>• {item.title}</span>)}
              </div>
            </div>
          </div>
        )}

        <div className='content-area'>
          {selectedArticle ? (
            <NewsDetail
              article={selectedArticle}
              onBack={() => setSelectedArticle(null)}
              fontSize={settings.fontSize}
            />
          ) : (
            <>
              <div className='content-header'>
                <h2>{activeCategory === 'All News' ? 'Top Stories' : activeCategory}</h2>
                <p>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>

              {loading ? (
                <div className='loading-container'><div className='spinner'></div></div>
              ) : error ? (
                <div className='error-message'><p>{error}</p><button className='read-more-btn' onClick={() => getData("All News")}>Try Again</button></div>
              ) : !newsData || newsData.length === 0 ? (
                <div className='empty-state'><p>{activeCategory === 'Bookmarks' ? "No bookmarks yet." : `No news for "${search}".`}</p></div>
              ) : (
                <div className='card-grid'><Card data={newsData} bookmarks={bookmarks} toggleBookmark={toggleBookmark} onArticleClick={(a) => { setSelectedArticle(a); window.scrollTo(0, 0); }} /></div>
              )}
            </>
          )}
        </div>
      </main>

      {/* SETTINGS MODAL */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="settings-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>YAT Customization</h3>
              <button className="close-x" onClick={() => setShowSettings(false)}>✕</button>
            </div>

            <div className="settings-scroll-area">
              <div className="settings-group">
                <label>AI Response Tone</label>
                <select value={settings.aiTone} onChange={e => saveSettings({ ...settings, aiTone: e.target.value })}>
                  <option>Professional</option>
                  <option>Concise</option>
                  <option>Creative</option>
                </select>
              </div>

              <div className="settings-group">
                <label>News Region</label>
                <select value={settings.newsRegion} onChange={e => saveSettings({ ...settings, newsRegion: e.target.value })}>
                  <option>Global</option>
                  <option>India</option>
                  <option>US</option>
                  <option>UK</option>
                </select>
              </div>

              <div className="settings-group">
                <label>Reader Font Size</label>
                <div className="font-size-toggle">
                  {['small', 'medium', 'large'].map(sz => (
                    <button
                      key={sz}
                      className={settings.fontSize === sz ? 'active' : ''}
                      onClick={() => saveSettings({ ...settings, fontSize: sz })}
                    >
                      {sz.charAt(0).toUpperCase() + sz.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="settings-group">
                <label>Appearance</label>
                <select value={settings.appTheme} onChange={e => saveSettings({ ...settings, appTheme: e.target.value })}>
                  <option value="light">Light Mode ☀️</option>
                  <option value="dark">Dark Mode 🌙</option>
                </select>
              </div>

              <div className="settings-group checkbox">
                <input
                  type="checkbox"
                  id="autoRerank"
                  checked={settings.autoRerank}
                  onChange={e => saveSettings({ ...settings, autoRerank: e.target.checked })}
                />
                <label htmlFor="autoRerank">Auto AI Reranking</label>
              </div>
            </div>
            <button className="primary-btn full-width" onClick={() => setShowSettings(false)}>Done</button>
          </div>
        </div>
      )}

      {!showAiWidget && <button className="ai-fab-branded" onClick={() => setShowAiWidget(true)} title="Ask YAT AI"><YatAiLogo size={50} /></button>}
      {showAiWidget && <GlobalAiAssistant onClose={() => setShowAiWidget(false)} selectedArticle={selectedArticle} />}
    </div>
  );
};

export default NewsApp;
