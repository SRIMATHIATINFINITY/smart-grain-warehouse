import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
} from "react-router-dom";
import { Leaf, LogOut } from "lucide-react";
import Dashboard from "./features/dashboard/Dashboard.jsx";
import BinDetailPage from "./features/bins/BinDetailPage.jsx";
import SignInPage from "./features/auth/SignInPage.jsx";
import WarehouseSelectionPage from "./features/warehouse/WarehouseSelectionPage.jsx";
import {
  isFirebaseConfigured,
  isRealtimeDatabaseEnabled,
} from "./services/firebase/config.js";

function App() {
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState(null);
  const [authorizationStatus, setAuthorizationStatus] = useState("checking");
  const [authError, setAuthError] = useState("");
  const [database, setDatabase] = useState(null);
  const [databaseError, setDatabaseError] = useState("");
  const [signOutError, setSignOutError] = useState("");

  useEffect(() => {
    let active = true;
    let unsubscribe;
    let authRevision = 0;

    if (!isFirebaseConfigured()) {
      setAuthReady(true);
      return () => {
        active = false;
      };
    }

    import("./services/firebase/auth.js")
      .then(({ hasDashboardReaderClaim, observeFirebaseAuth }) => {
        if (!active) return;
        unsubscribe = observeFirebaseAuth(
          async (nextUser) => {
            const currentRevision = ++authRevision;
            if (!active) return;
            setUser(nextUser);
            setAuthError("");
            setAuthorizationStatus(nextUser ? "checking" : "none");
            setAuthReady(!nextUser);
            if (!nextUser) return;

            try {
              const isAuthorized = await hasDashboardReaderClaim(nextUser);
              if (!active || currentRevision !== authRevision) return;
              setAuthorizationStatus(isAuthorized ? "authorized" : "denied");
              setAuthReady(true);
            } catch (error) {
              if (!active || currentRevision !== authRevision) return;
              setAuthorizationStatus("error");
              setAuthError(error.message);
              setAuthReady(true);
            }
          },
          (error) => {
            if (!active) return;
            authRevision += 1;
            setUser(null);
            setAuthorizationStatus("error");
            setAuthError(error.message);
            setAuthReady(true);
          },
        );
      })
      .catch((error) => {
        if (!active) return;
        setAuthError(error.message);
        setAuthReady(true);
      });

    return () => {
      active = false;
      authRevision += 1;
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    setDatabase(null);
    setDatabaseError("");

    if (
      !user ||
      authorizationStatus !== "authorized" ||
      !isRealtimeDatabaseEnabled()
    ) {
      return undefined;
    }

    let active = true;
    import("./services/firebase/database.js")
      .then(({ getFirebaseDatabase }) => {
        if (active) setDatabase(getFirebaseDatabase(user));
      })
      .catch((error) => {
        if (active) setDatabaseError(error.message);
      });

    return () => {
      active = false;
    };
  }, [authorizationStatus, user]);

  async function handleSignIn(email, password) {
    const { signInWithEmailPassword } = await import("./services/firebase/auth.js");
    return signInWithEmailPassword(email, password);
  }

  async function handleSignOut() {
    setSignOutError("");
    try {
      const { signOutFirebaseUser } = await import("./services/firebase/auth.js");
      await signOutFirebaseUser();
    } catch (error) {
      setSignOutError(error.message);
    }
  }

  if (!isFirebaseConfigured()) {
    return (
      <AppFrame>
        <Notice
          title="Firebase setup required"
          message="Copy .env.example to .env.local and enter your Firebase web app settings. No database access is attempted until configuration is complete."
        />
      </AppFrame>
    );
  }

  if (!authReady) {
    return (
      <AppFrame>
        <PageMessage message="Checking Firebase Authentication..." />
      </AppFrame>
    );
  }

  if (authError) {
    return (
      <AppFrame>
        <Notice
          title="Authentication could not be initialized"
          message={authError}
        />
      </AppFrame>
    );
  }

  if (!user) {
    return (
      <AppFrame>
        <SignInPage onSignIn={handleSignIn} />
      </AppFrame>
    );
  }

  if (authorizationStatus === "checking") {
    return (
      <AppFrame user={user} onSignOut={handleSignOut}>
        <PageMessage message="Checking your dashboard access..." />
      </AppFrame>
    );
  }

  if (authorizationStatus !== "authorized") {
    return (
      <AppFrame user={user} onSignOut={handleSignOut}>
        <Notice
          title="This account is not authorized for dashboard data"
          message="Ask your administrator to assign the dashboardReader: true custom claim using a trusted server-side process. No database reads were started."
        />
      </AppFrame>
    );
  }

  if (!isRealtimeDatabaseEnabled()) {
    return (
      <AppFrame user={user} onSignOut={handleSignOut}>
        {signOutError && (
          <Notice title="Could not sign out" message={signOutError} />
        )}
        <Notice
          title="Database access is disabled"
          message="Deploy the secure Realtime Database rules and provision the dashboardReader authorization process before setting VITE_FIREBASE_RULES_DEPLOYED=true in .env.local. No bin data is being requested."
        />
      </AppFrame>
    );
  }

  if (databaseError) {
    return (
      <AppFrame user={user} onSignOut={handleSignOut}>
        <Notice title="Database initialization failed" message={databaseError} />
      </AppFrame>
    );
  }

  if (!database) {
    return (
      <AppFrame user={user} onSignOut={handleSignOut}>
        <PageMessage message="Preparing the authenticated database connection..." />
      </AppFrame>
    );
  }

  return (
    <BrowserRouter>
      <AppFrame user={user} onSignOut={handleSignOut}>
        {signOutError && (
          <div className="mx-auto mt-5 max-w-7xl px-4 sm:px-6 lg:px-8">
            <Notice title="Could not sign out" message={signOutError} />
          </div>
        )}
        <Routes>
          <Route path="/" element={<WarehouseSelectionPage />} />
          <Route
            path="/warehouses/:warehouseId"
            element={<Dashboard database={database} />}
          />
          <Route
            path="/warehouses/:warehouseId/bins/:binId"
            element={<BinDetailPage database={database} />}
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AppFrame>
    </BrowserRouter>
  );
}

function AppFrame({ children, user, onSignOut }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-stone-200/80 bg-white/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <a className="flex items-center gap-3" href="/" aria-label="GrainGuard home">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-forest text-white">
              <Leaf size={23} strokeWidth={2.2} />
            </span>
            <span>
              <span className="block text-lg font-bold tracking-tight text-stone-900">
                GrainGuard
              </span>
              <span className="block text-xs font-medium text-stone-500">
                Warehouse monitor
              </span>
            </span>
          </a>
          {user && (
            <div className="flex items-center gap-3">
              <span className="hidden max-w-52 truncate text-sm text-stone-500 sm:block">
                {user.email}
              </span>
              <button
                type="button"
                onClick={onSignOut}
                className="inline-flex items-center gap-2 rounded-xl border border-stone-200 px-3 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          )}
        </div>
      </header>
      {children}
    </div>
  );
}

function Notice({ title, message }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <section
        className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950 sm:p-6"
        role="alert"
      >
        <h1 className="text-lg font-bold">{title}</h1>
        <p className="mt-2 text-sm leading-6">{message}</p>
      </section>
    </main>
  );
}

function PageMessage({ message }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 text-sm text-stone-600 sm:px-6">
      {message}
    </main>
  );
}

function NotFoundPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-stone-900">Page not found</h1>
      <Link className="mt-3 inline-block font-semibold text-forest" to="/">
        Choose a warehouse
      </Link>
    </main>
  );
}

export default App;
