import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMySnippets, deleteSnippet } from '../utils/API';
import SnippetCard from '../components/SnippetCard';
import Loader from '../components/Loader';
import { FiPlus, FiCode } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './Dashboard.css';

const Dashboard = () => {
  const [snippets, setSnippets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMySnippets();
  }, []);

  const fetchMySnippets = async () => {
    try {
      const { data } = await getMySnippets();
      setSnippets(data);
    } catch (err) {
      toast.error('Failed to load your snippets');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this snippet?')) return;

    try {
      await deleteSnippet(id);
      setSnippets((prev) => prev.filter((s) => s.id !== id));
      toast.success('Snippet deleted');
    } catch (err) {
      toast.error('Failed to delete snippet');
    }
  };

  return (
    <div className="page-container">
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">My Snippets</h1>
          <p className="page-subtitle">
            {snippets.length} snippet{snippets.length !== 1 ? 's' : ''} in your collection
          </p>
        </div>
        <Link to="/create" className="btn btn-primary">
          <FiPlus size={16} />
          New Snippet
        </Link>
      </div>

      {loading ? (
        <Loader />
      ) : snippets.length > 0 ? (
        <div className="snippets-grid">
          {snippets.map((snippet) => (
            <SnippetCard
              key={snippet.id}
              snippet={snippet}
              showActions={true}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon"><FiCode /></div>
          <p className="empty-state-text">No snippets yet</p>
          <p className="empty-state-sub">Create your first code snippet to get started</p>
          <Link to="/create" className="btn btn-primary">
            <FiPlus size={16} />
            Create Snippet
          </Link>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
