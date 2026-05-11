import { useState } from 'react';
import { FiCopy, FiCheck } from 'react-icons/fi';
import './CodeBlock.css';

const CodeBlock = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const langClass = language ? language.toLowerCase().replace(/\+/g, 'p') : 'default';

  return (
    <div className="code-block">
      <div className="code-block-header">
        <span className={`lang-badge ${language?.toLowerCase() || 'default'}`}>
          {language || 'text'}
        </span>
        <button
          className="copy-btn"
          onClick={handleCopy}
          title={copied ? 'Copied!' : 'Copy code'}
        >
          {copied ? (
            <>
              <FiCheck size={14} />
              <span>Copied</span>
            </>
          ) : (
            <>
              <FiCopy size={14} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="code-block-body">
        <pre>
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};

export default CodeBlock;
