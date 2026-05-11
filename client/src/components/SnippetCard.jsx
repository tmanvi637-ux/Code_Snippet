import { Link } from 'react-router-dom';
import { FiEdit2, FiTrash2, FiEye, FiGitBranch, FiUser, FiClock } from 'react-icons/fi';
import './SnippetCard.css';

const SnippetCard = ({ snippet, onDelete, showActions = false }) => {
  // Truncate code to first 4 lines for preview
  const codePreview = snippet.code
    ? snippet.code.split('\n').slice(0, 4).join('\n')
    : '';

  const hasMoreLines = snippet.code && snippet.code.split('\n').length > 4;

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="snippet-card card">
      <div className="snippet-card-header">
        <div className="snippet-card-meta">
          <h3 className="snippet-card-title">
            <Link to={`/snippet/${snippet.id}`}>
              {snippet.title || 'Untitled Snippet'}
            </Link>
          </h3>
          <div className="snippet-card-info">
            <span className={`lang-badge ${snippet.language?.toLowerCase() || 'default'}`}>
              {snippet.language || 'text'}
            </span>
            {snippet.forkedFromId && (
              <span className="forked-badge">
                <FiGitBranch size={12} />
                Forked
              </span>
            )}
            {!snippet.isPublic && (
              <span className="private-badge">Private</span>
            )}
          </div>
        </div>
      </div>

      {codePreview && (
        <div className="snippet-card-code">
          <pre><code>{codePreview}</code></pre>
          {hasMoreLines && <div className="code-fade"></div>}
        </div>
      )}

      <div className="snippet-card-footer">
        <div className="snippet-card-details">
          {snippet.User && (
            <span className="detail-item">
              <FiUser size={12} />
              {snippet.User.username || 'anonymous'}
            </span>
          )}
          <span className="detail-item">
            <FiClock size={12} />
            {formatDate(snippet.createdAt)}
          </span>
        </div>

        <div className="snippet-card-actions">
          <Link to={`/snippet/${snippet.id}`} className="btn btn-ghost btn-sm" title="View">
            <FiEye size={15} />
          </Link>
          {showActions && (
            <>
              <Link to={`/edit/${snippet.id}`} className="btn btn-ghost btn-sm" title="Edit">
                <FiEdit2 size={15} />
              </Link>
              <button
                className="btn btn-ghost btn-sm snippet-delete-btn"
                onClick={() => onDelete && onDelete(snippet.id)}
                title="Delete"
              >
                <FiTrash2 size={15} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SnippetCard;
