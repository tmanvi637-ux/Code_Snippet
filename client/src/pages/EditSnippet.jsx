import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getSnippetById, updateSnippet } from '../utils/API';
import { FiSave, FiArrowLeft } from 'react-icons/fi';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';
import './EditSnippet.css';

const LANGUAGES = [
  'JavaScript', 'Python', 'Java', 'C++', 'HTML', 'CSS',
  'Go', 'Rust', 'TypeScript', 'PHP', 'Ruby', 'Swift',
  'Kotlin', 'C#', 'SQL', 'Shell', 'Other'
];

const EditSnippet = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSnippet();
  }, [id]);

  const fetchSnippet = async () => {
    try {
      const { data } = await getSnippetById(id);
      setTitle(data.title || '');
      setCode(data.code || '');
      setLanguage(data.language || 'javascript');
      setIsPublic(data.isPublic);
    } catch (err) {
      toast.error('Failed to load snippet');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

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

    setSaving(true);
    try {
      await updateSnippet(id, { title, code, language, isPublic });
      toast.success('Snippet updated!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to update snippet');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="page-container">
      <div className="snippet-form-page animate-in">
        <button className="btn btn-ghost back-btn" onClick={() => navigate(-1)}>
          <FiArrowLeft size={16} />
          Back
        </button>

        <div className="page-header">
          <h1 className="page-title">Edit Snippet</h1>
          <p className="page-subtitle">Update your code snippet</p>
        </div>

        <form onSubmit={handleSubmit} className="snippet-form card">
          <div className="form-row">
            <div className="input-group form-field-grow">
              <label className="input-label" htmlFor="edit-title">Title</label>
              <input
                id="edit-title"
                type="text"
                className="input-field"
                placeholder="Snippet title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="input-group form-field-lang">
              <label className="input-label" htmlFor="edit-lang">Language</label>
              <select
                id="edit-lang"
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
            <label className="input-label" htmlFor="edit-code">Code</label>
            <textarea
              id="edit-code"
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
              disabled={saving}
            >
              <FiSave size={16} />
              {saving ? 'Saving...' : 'Update Snippet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSnippet;
