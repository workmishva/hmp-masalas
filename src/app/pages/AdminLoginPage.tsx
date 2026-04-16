import React, { FormEvent, useState } from 'react';
import { LockKeyhole, ShieldAlert } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function AdminLoginPage() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const from = (location.state as { from?: string } | null)?.from ?? '/admin';

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (login(username, password)) {
      setError('');
      navigate(from, { replace: true });
      return;
    }

    setError('Invalid admin credentials. Please try again.');
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(233,162,28,0.35)_0%,rgba(233,162,28,0.15)_38%,rgba(93,64,55,0.2)_68%,rgba(93,64,55,0.95)_100%)] px-6 pb-16 pt-32">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.1fr,0.9fr]">
        <section className="rounded-[2rem] border border-border/80 bg-card/85 p-8 shadow-2xl shadow-secondary/30 backdrop-blur">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-secondary/40 bg-secondary/15 px-4 py-2 text-sm font-semibold text-secondary">
            <LockKeyhole size={16} />
            Restricted Access
          </div>
          <h1 className="text-4xl font-black tracking-tight text-foreground">The admin panel is locked</h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground">
            Only authorized admins can change product data. Without login, the admin controls and website data editor stay locked.
          </p>

          <div className="mt-8 rounded-[1.5rem] border border-border bg-neutral p-6 text-neutral-foreground">
            <div className="mb-3 flex items-center gap-2 text-secondary">
              <ShieldAlert size={18} />
              Security note
            </div>
            <p className="text-sm leading-6 text-neutral-foreground/75">
              This protection locks the admin route at the front-end level. For production-grade security, use backend authentication, database permissions, and server-side APIs.
            </p>
          </div>
        </section>

        <form
          onSubmit={handleSubmit}
          className="rounded-[2rem] border border-border bg-card p-8 shadow-2xl shadow-secondary/15"
        >
          <h2 className="text-2xl font-black text-foreground">Admin Login</h2>
          <p className="mt-2 text-sm text-muted-foreground">Enter your credentials to open the secure admin panel.</p>

          <div className="mt-8 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-foreground">Username</span>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="w-full rounded-2xl border border-border bg-muted px-4 py-3 outline-none transition focus:border-secondary focus:bg-card"
                placeholder="admin"
                autoComplete="username"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-foreground">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-border bg-muted px-4 py-3 outline-none transition focus:border-secondary focus:bg-card"
                placeholder="Enter admin password"
                autoComplete="current-password"
                required
              />
            </label>
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-medium text-primary">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            className="mt-6 w-full rounded-full bg-primary px-5 py-4 text-lg font-bold text-white transition hover:bg-primary/90"
          >
            Login to Admin Panel
          </button>

          <Link
            to="/"
            className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-border px-5 py-3 font-semibold text-muted-foreground transition hover:border-secondary hover:text-secondary"
          >
            Back to website
          </Link>
        </form>
      </div>
    </div>
  );
}
