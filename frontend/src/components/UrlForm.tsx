import { useState } from 'react';
import type { FormEvent } from 'react';
import { useShortenUrl } from '../hooks/useShortenUrl';
import './UrlForm.css';

export function UrlForm() {
  const [originalUrl, setOriginalUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const { shorten, data, loading, error, reset } = useShortenUrl();

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!originalUrl.trim()) return;
    setCopied(false);
    await shorten(originalUrl.trim());
  }

  async function handleCopy(): Promise<void> {
    if (!data?.shortUrl) return;
    await navigator.clipboard.writeText(data.shortUrl);
    setCopied(true);
  }

  return (
    <section className="url-form">
      <form onSubmit={handleSubmit} className="url-form__form">
        <label htmlFor="originalUrl" className="url-form__label">
          Paste a long URL
        </label>
        <div className="url-form__row">
          <input
            id="originalUrl"
            type="url"
            name="originalUrl"
            placeholder="https://example.com/very/long/path"
            value={originalUrl}
            onChange={(e) => {
              setOriginalUrl(e.target.value);
              if (data || error) reset();
              setCopied(false);
            }}
            required
            className="url-form__input"
          />
          <button type="submit" disabled={loading} className="url-form__submit">
            {loading ? 'Shortening…' : 'Shorten'}
          </button>
        </div>
      </form>

      {error ? <p className="url-form__error">{error}</p> : null}

      {data ? (
        <div className="url-form__result">
          <p className="url-form__result-label">Short URL</p>
          <div className="url-form__result-row">
            <a href={data.shortUrl} target="_blank" rel="noreferrer">
              {data.shortUrl}
            </a>
            <button type="button" className="url-form__copy" onClick={() => void handleCopy()}>
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
