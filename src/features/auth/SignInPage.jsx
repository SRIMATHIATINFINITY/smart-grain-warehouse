import { useState } from "react";
import { LockKeyhole } from "lucide-react";

function SignInPage({ onSignIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await onSignIn(email.trim(), password);
    } catch (signInError) {
      setError(getSignInErrorMessage(signInError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-7xl justify-center px-4 py-12 sm:px-6 sm:py-16">
      <section className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <span className="flex size-12 items-center justify-center rounded-xl bg-emerald-50 text-forest">
          <LockKeyhole size={23} />
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-stone-900">
          Sign in to your warehouse
        </h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Use an approved account with dashboard read access. Public database
          access is not used.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-semibold text-stone-700">
            Email
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-stone-300 px-3.5 py-3 font-normal outline-none transition focus:border-forest focus:ring-2 focus:ring-emerald-100"
            />
          </label>
          <label className="block text-sm font-semibold text-stone-700">
            Password
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-stone-300 px-3.5 py-3 font-normal outline-none transition focus:border-forest focus:ring-2 focus:ring-emerald-100"
            />
          </label>
          {error && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-forest px-4 py-3 font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-5 text-xs leading-5 text-stone-500">
          Self-registration is disabled. Ask your project administrator to
          create an account, enable Email/Password, and assign the
          <code className="mx-1 rounded bg-stone-100 px-1 py-0.5 font-mono">
            dashboardReader
          </code>
          authorization claim.
        </p>
      </section>
    </main>
  );
}

function getSignInErrorMessage(error) {
  if (
    error?.code === "auth/invalid-credential" ||
    error?.code === "auth/user-not-found" ||
    error?.code === "auth/wrong-password"
  ) {
    return "The email or password was not accepted.";
  }
  if (error?.code === "auth/operation-not-allowed") {
    return "Email/Password sign-in is not enabled for this Firebase project.";
  }
  return error?.message || "Sign-in failed. Check your connection and try again.";
}

export default SignInPage;
