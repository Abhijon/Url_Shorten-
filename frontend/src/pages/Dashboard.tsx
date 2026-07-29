import { useEffect, useState } from 'react';
import { UrlCard } from '../components/UrlCard';
import { deleteUrl, listUrls } from '../api/url.api';
import { getApiErrorMessage } from '../api/axios';
import type { Url } from '../types/url';
import './Dashboard.css';

export function Dashboard() {
  const [urls, setUrls] = useState<Url[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      try {
        const data = await listUrls();
        if (!cancelled) {
          setUrls(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, 'Failed to load URLs'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDelete(id: number): Promise<void> {
    try {
      await deleteUrl(id);
      setUrls((current) => current.filter((url) => url.id !== id));
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to delete URL'));
    }
  }

  return (
    <main className="dashboard">
      <header className="dashboard__header">
        <h1>Dashboard</h1>
        <p>Manage your shortened URLs.</p>
      </header>

      {loading ? <p className="dashboard__status">Loading…</p> : null}
      {error ? <p className="dashboard__error">{error}</p> : null}

      {!loading && urls.length === 0 ? (
        <p className="dashboard__status">No URLs yet. Create one from Home.</p>
      ) : null}

      <div className="dashboard__list">
        {urls.map((url) => (
          <UrlCard key={url.id} url={url} onDelete={handleDelete} />
        ))}
      </div>
    </main>
  );
}
