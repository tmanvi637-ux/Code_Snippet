import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSnippet } from '../utils/API';
import { FiSave, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './CreateSnippet.css';

const LANGUAGES = [
  'JavaScript', 'Python', 'Java', 'C++', 'HTML', 'CSS',
  'Go', 'Rust', 'TypeScript', 'PHP', 'Ruby', 'Swift',
  'Kotlin', 'C#', 'SQL', 'Shell', 'Other'
];

const CreateSnippet = () => {
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('JavaScript');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!code.trim()) {
      toast.error('Please enter some code');
      return;
    }

    setLoading(true);
    try {
      await createSnippet({ title, code, language, isPublic });
      toast.success('Snippet created!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create snippet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="snippet-form-page animate-in">
        <button className="btn btn-ghost back-btn" onClick={() => navigate(-1)}>
          <FiArrowLeft size={16} />
          Back
        </button>

        <div className="page-header">
          <h1 className="page-title">Create Snippet</h1>
          <p className="page-subtitle">Save a new code snippet to your collection</p>
        </div>

        <form onSubmit={handleSubmit} className="snippet-form card">
          <div className="form-row">
            <div className="input-group form-field-grow">
              <label className="input-label" htmlFor="snippet-title">Title</label>
              <input
                id="snippet-title"
                type="text"
                className="input-field"
                placeholder="e.g. Binary Search Implementation"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="input-group form-field-lang">
              <label className="input-label" htmlFor="snippet-lang">Language</label>
              <select
                id="snippet-lang"
                className="input-field"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang.toLowerCase()}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="snippet-code">Code</label>
            <textarea
              id="snippet-code"
              className="input-field code-textarea"
              placeholder="Paste your code here..."
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={14}
            />
          </div>

          <div className="form-footer">
            <div className="toggle-wrapper">
              <div
                className={`toggle ${isPublic ? 'active' : ''}`}
                onClick={() => setIsPublic(!isPublic)}
              ></div>
              <span className="toggle-label">
                {isPublic ? 'Public — visible to everyone' : 'Private — only you can see'}
              </span>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              <FiSave size={16} />
              {loading ? 'Saving...' : 'Save Snippet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSnippet;
