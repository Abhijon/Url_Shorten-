import type { Url } from '../types/url';
import './UrlCard.css';

interface UrlCardProps {
  url: Url;
  onDelete?: (id: number) => void;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

/**
 * Displays a single shortened URL entry.
 */
export function UrlCard({ url, onDelete }: UrlCardProps) {
  const shortUrl = `${API_BASE}/${url.shortCode}`;

  return (
    <article className="url-card">
      <div className="url-card__body">
        <a className="url-card__code" href={shortUrl} target="_blank" rel="noreferrer">
          {shortUrl}
        </a>
        <a
          className="url-card__original"
          href={url.originalUrl}
          target="_blank"
          rel="noreferrer"
        >
          {url.originalUrl}
        </a>
        <p className="url-card__meta">{url.clickCount} clicks</p>
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
