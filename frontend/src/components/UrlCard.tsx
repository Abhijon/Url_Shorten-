import { useState } from 'react';
import type { Url } from '../types/url';
import './UrlCard.css';

interface UrlCardProps {
  url: Url;
  onDelete?: (id: number) => void;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

/**
 * Displays a single shortened URL entry.
 * Short URL is plain text (not an <a href>) so page load / prefetch
 * cannot hit the redirect endpoint and inflate click counts.
 */
export function UrlCard({ url, onDelete }: UrlCardProps) {
  const [copied, setCopied] = useState(false);
  const shortUrl = `${API_BASE}/${url.shortCode}`;

  async function handleCopy(): Promise<void> {
    await navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  function handleOpen(): void {
    window.open(shortUrl, '_blank', 'noopener,noreferrer');
  }

  return (
    <article className="url-card">
      <div className="url-card__body">
        <p className="url-card__code">{shortUrl}</p>
        <p className="url-card__meta">{url.clickCount} clicks</p>
        <div className="url-card__actions">
          <button type="button" className="url-card__action" onClick={() => void handleCopy()}>
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button type="button" className="url-card__action" onClick={handleOpen}>
            Open
          </button>
        </div>
      </div>
      {onDelete ? (
        <button
          type="button"
          className="url-card__delete"
          onClick={() => onDelete(url.id)}
        >
          Delete
        </button>
      ) : null}
    </article>
  );
}
