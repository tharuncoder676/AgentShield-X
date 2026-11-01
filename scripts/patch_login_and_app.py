import re

# 1. Patch Login.tsx
with open('apps/console/src/pages/Login.tsx', 'r', encoding='utf-8') as f:
    login_text = f.read()

login_text = login_text.replace('const { login } = useAuth();', 'const { login, loginWithGoogle } = useAuth();')
login_text = login_text.replace('navigate("/overview")', 'navigate("/security-challenge")')

old_oauth_block = '''  const handleOAuthClick = async (provider: "google" | "apple") => {
    setError(null);
    // 1. Try real Supabase OAuth redirect'''

new_oauth_block = '''  const handleOAuthClick = async (provider: "google" | "apple") => {
    setError(null);
    if (provider === "google") {
      setLoading(true);
      try {
        await loginWithGoogle();
        navigate("/security-challenge");
        return;
      } catch (err: any) {
        console.warn("Firebase Google login fallback:", err);
      } finally {
        setLoading(false);
      }
    }
    // 1. Try real Supabase OAuth redirect'''

if old_oauth_block in login_text:
    login_text = login_text.replace(old_oauth_block, new_oauth_block)
    print("Patched handleOAuthClick in Login.tsx")
else:
    # Try with CRLF normalized
    norm = login_text.replace('\r\n', '\n')
    if old_oauth_block in norm:
        norm = norm.replace(old_oauth_block, new_oauth_block)
        login_text = norm
        print("Patched handleOAuthClick (normalized) in Login.tsx")
    else:
        print("Could not match old_oauth_block in Login.tsx")

with open('apps/console/src/pages/Login.tsx', 'w', encoding='utf-8') as f:
    f.write(login_text)

# 2. Patch App.tsx
with open('apps/console/src/App.tsx', 'r', encoding='utf-8') as f:
    app_text = f.read()

# Add SecurityChallenge and NotFound imports
if 'SecurityChallenge' not in app_text:
    import_marker = 'import { Landing } from "./pages/Landing";'
    new_imports = '''import { Landing } from "./pages/Landing";
import { SecurityChallenge } from "./pages/SecurityChallenge";
import { NotFound } from "./pages/NotFound";'''
    app_text = app_text.replace(import_marker, new_imports)
    print("Added SecurityChallenge and NotFound imports to App.tsx")

# Update ProtectedRoute to check securityChallengePassed
old_protected = '''const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg text-fg flex items-center justify-center font-chakra text-xs tracking-widest uppercase">
        <span className="animate-pulse">Loading Security Context...</span>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};'''

new_protected = '''const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { token, securityChallengePassed, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#07080b] text-white flex items-center justify-center font-sora text-xs tracking-widest uppercase">
        <span className="animate-pulse">Loading Security Context...</span>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!securityChallengePassed) {
    return <Navigate to="/security-challenge" replace />;
  }

  return <>{children}</>;
};'''

app_text_norm = app_text.replace('\r\n', '\n')
old_protected_norm = old_protected.replace('\r\n', '\n')
new_protected_norm = new_protected.replace('\r\n', '\n')

if old_protected_norm in app_text_norm:
    app_text_norm = app_text_norm.replace(old_protected_norm, new_protected_norm)
    print("Updated ProtectedRoute to require securityChallengePassed")
else:
    print("Warning: old_protected not matched in App.tsx")

# Add /security-challenge route
challenge_route = '''            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/security-challenge" element={<SecurityChallenge />} />'''

old_auth_routes = '''            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />'''

app_text_norm = app_text_norm.replace(old_auth_routes, challenge_route)

# Replace catch-all redirect with 404 NotFound
old_catch_all = '<Route path="*" element={<Navigate to="/command-center" replace />} />'
new_catch_all = '<Route path="*" element={<NotFound />} />'
app_text_norm = app_text_norm.replace(old_catch_all, new_catch_all)

with open('apps/console/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(app_text_norm)

print("Updated App.tsx successfully.")

