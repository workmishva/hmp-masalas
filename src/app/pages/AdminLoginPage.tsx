import React, { FormEvent, useState } from 'react';
import { LockKeyhole, ShieldAlert } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function AdminLoginPage() {
  const { login, loginWithGoogle } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? '/admin';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const success = await login(username, password);
    if (success) {
      setError('');
      navigate(from, { replace: true });
      return;
    }
    setError('Invalid admin credentials. Please try again.');
  };

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const success = await loginWithGoogle();
      if (success) {
        navigate(from, { replace: true });
      } else {
        setError('This Google account is not authorized as admin. Use mishvapanchani17@gmail.com.');
      }
    } finally {
      setGoogleLoading(false);
    }
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
              Admin access is protected by secure bcrypt + JWT authentication. Google login is restricted to the authorized admin email only.
            </p>
          </div>
        </section>

        <form
          onSubmit={handleSubmit}
          className="rounded-[2rem] border border-border bg-card p-8 shadow-2xl shadow-secondary/15"
        >
          <h2 className="text-2xl font-black text-foreground">Admin Login</h2>
          <p className="mt-2 text-sm text-muted-foreground">Sign in with Google or enter your credentials.</p>

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-full border-2 border-border bg-white px-5 py-3.5 text-sm font-bold text-gray-700 shadow-sm transition hover:border-secondary hover:shadow-md disabled:opacity-60"
          >
            {googleLoading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-400 border-t-secondary" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            {googleLoading ? 'Signing in...' : 'Continue with Google'}
          </button>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-semibold text-muted-foreground">OR USE CREDENTIALS</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-foreground">Username</span>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="w-full rounded-2xl border border-border bg-muted px-4 py-3 outline-none transition focus:border-secondary focus:bg-card"
                placeholder="mishvapanchani"
                autoComplete="username"
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
