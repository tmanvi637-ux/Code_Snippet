import { useState, useEffect } from 'react';
import { getPublicSnippets } from '../utils/API';
import SnippetCard from '../components/SnippetCard';
import Loader from '../components/Loader';
import { FiSearch, FiCode, FiGlobe } from 'react-icons/fi';
import './Home.css';

const LANGUAGES = ['All', 'JavaScript', 'Python', 'Java', 'C++', 'HTML', 'CSS', 'Go', 'Rust', 'TypeScript'];

const Home = () => {
  const [snippets, setSnippets] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [langFilter, setLangFilter] = useState('All');

  useEffect(() => {
    fetchSnippets();
  }, []);

  useEffect(() => {
    filterSnippets();
  }, [search, langFilter, snippets]);

  const fetchSnippets = async () => {
    try {
      const { data } = await getPublicSnippets();
      setSnippets(data);
      setFiltered(data);
    } catch (err) {
      console.error('Failed to fetch snippets:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterSnippets = () => {
    let result = [...snippets];

    if (langFilter !== 'All') {
      result = result.filter(
        (s) => s.language?.toLowerCase() === langFilter.toLowerCase()
      );
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.title?.toLowerCase().includes(q) ||
          s.code?.toLowerCase().includes(q) ||
          s.User?.username?.toLowerCase().includes(q)
      );
    }

    setFiltered(result);
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-glow"></div>
        <div className="hero-content">
          <div className="hero-badge">
            <FiGlobe size={14} />
            <span>Open Source Snippets</span>
          </div>
          <h1 className="hero-title">
            Discover & Share<br />
            <span className="hero-accent">Code Snippets</span>
          </h1>
          <p className="hero-subtitle">
            Browse community-shared code snippets, fork them for your own use, and share your solutions with the world.
          </p>
        </div>
      </section>

      {/* Filters */}
      <div className="page-container">
        <div className="filter-bar">
          <div className="search-wrapper">
            <FiSearch className="search-icon" />
            <input
              type="text"
              className="input-field search-input"
              placeholder="Search snippets by title, code, or author..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="lang-filters">
            {LANGUAGES.map((lang) => (
              <button
                key={lang}
                className={`lang-filter-btn ${langFilter === lang ? 'active' : ''}`}
                onClick={() => setLangFilter(lang)}
              >
                {lang === 'All' ? 'All' : lang}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="results-info">
          <span>{filtered.length} snippet{filtered.length !== 1 ? 's' : ''} found</span>
        </div>

        {/* Content */}
        {loading ? (
          <Loader />
        ) : filtered.length > 0 ? (
          <div className="snippets-grid">
            {filtered.map((snippet) => (
              <SnippetCard key={snippet.id} snippet={snippet} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon"><FiCode /></div>
            <p className="empty-state-text">No snippets found</p>
            <p className="empty-state-sub">
              {search || langFilter !== 'All'
                ? 'Try adjusting your search or filter'
                : 'Be the first to share a snippet!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
