import { UrlForm } from '../components/UrlForm';
import './Home.css';

export function Home() {
  return (
    <main className="home">
      <div className="home__hero">
        <p className="home__brand">ShortLink</p>
        <h1 className="home__headline">Short links. Clear system design.</h1>
        <p className="home__sub">
          Paste a long URL to create a compact redirect backed by PostgreSQL and Redis.
        </p>
        <UrlForm />
      </div>
    </main>
  );
}
