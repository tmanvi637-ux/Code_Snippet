import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getSnippetById, forkSnippet } from '../utils/API';
import { useAuth } from '../context/AuthContext';
import CodeBlock from '../components/CodeBlock';
import Loader from '../components/Loader';
import { FiArrowLeft, FiGitBranch, FiUser, FiClock, FiGlobe, FiLock } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './SnippetDetail.css';

const SnippetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [snippet, setSnippet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [forking, setForking] = useState(false);

  useEffect(() => {
    fetchSnippet();
  }, [id]);

  const fetchSnippet = async () => {
    try {
      const { data } = await getSnippetById(id);
      setSnippet(data);
    } catch (err) {
      const msg = err.response?.data?.msg || 'Snippet not found';
      toast.error(msg);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleFork = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to fork snippets');
      navigate('/login');
      return;
    }

    setForking(true);
    try {
      await forkSnippet(id);
      toast.success('Snippet forked to your collection!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to fork snippet');
    } finally {
      setForking(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) return <Loader />;
  if (!snippet) return null;

  return (
    <div className="page-container">
      <div className="snippet-detail animate-in">
        <button className="btn btn-ghost back-btn" onClick={() => navigate(-1)}>
          <FiArrowLeft size={16} />
          Back
        </button>

        <div className="detail-header">
          <div className="detail-header-left">
            <h1 className="detail-title">{snippet.title || 'Untitled Snippet'}</h1>
            <div className="detail-meta">
              <span className={`lang-badge ${snippet.language?.toLowerCase() || 'default'}`}>
                {snippet.language || 'text'}
              </span>
              <span className="detail-meta-item">
                {snippet.isPublic ? <FiGlobe size={14} /> : <FiLock size={14} />}
                {snippet.isPublic ? 'Public' : 'Private'}
              </span>
              {snippet.User && (
                <span className="detail-meta-item">
                  <FiUser size={14} />
                  {snippet.User.username || 'anonymous'}
                </span>
              )}
              <span className="detail-meta-item">
                <FiClock size={14} />
                {formatDate(snippet.createdAt)}
              </span>
            </div>
            {snippet.forkedFromId && (
              <Link to={`/snippet/${snippet.forkedFromId}`} className="forked-from-link">
                <FiGitBranch size={14} />
                Forked from snippet #{snippet.forkedFromId}
              </Link>
            )}
          </div>

          <div className="detail-header-actions">
            <button
              className="btn btn-secondary"
              onClick={handleFork}
              disabled={forking}
            >
              <FiGitBranch size={16} />
              {forking ? 'Forking...' : 'Fork'}
            </button>
          </div>
        </div>

        <div className="detail-code-wrapper">
          <CodeBlock code={snippet.code || ''} language={snippet.language} />
        </div>
      </div>
    </div>
  );
};

export default SnippetDetail;
