// pages/dashboard/index.jsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getCurrentUser, getUserProfile, signOut } from '@/lib/auth-helpers';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    const { user: currentUser, error: userError } = await getCurrentUser();

    if (userError || !currentUser) {
      router.push('/auth/login');
      return;
    }

    setUser(currentUser);

    const { data: profileData } = await getUserProfile(currentUser.id);
    setProfile(profileData);
    setLoading(false);
  }

  async function handleSignOut() {
    await signOut();
    router.push('/auth/login');
  }

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading...</div>
        <style jsx>{`${styles}`}</style>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Dashboard</h1>
          <button onClick={handleSignOut} className="btn-signout">
            Sign Out
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="welcome-card">
          <h2>Welcome back, {profile?.full_name || user?.email}! 🎉</h2>
          <p>Your account is set up and ready.</p>
        </div>

        <div className="card">
          <h3>Your Credits</h3>
          <div className="credits-grid">
            <div className="credit-item">
              <div className="credit-label">⚡ QuickLook (First)</div>
              <div className="credit-value">{profile?.credits_quicklook_first || 0}</div>
            </div>
            <div className="credit-item">
              <div className="credit-label">⚡ QuickLook (Regular)</div>
              <div className="credit-value">{profile?.credits_quicklook_regular || 0}</div>
            </div>
            <div className="credit-item">
              <div className="credit-label">📊 Full Review</div>
              <div className="credit-value">{profile?.credits_full_review || 0}</div>
            </div>
          </div>
          <p className="credit-note">You don't have any credits yet. Purchase credits to start using reviews.</p>
        </div>

        <div className="card">
          <h3>Account Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">Email</div>
              <div className="info-value">{user?.email}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Account Created</div>
              <div className="info-value">
                {new Date(user?.created_at).toLocaleDateString()}
              </div>
            </div>
            <div className="info-item">
              <div className="info-label">Email Verified</div>
              <div className="info-value">
                {user?.email_confirmed_at ? '✓ Verified' : '⚠ Not verified'}
              </div>
            </div>
          </div>
        </div>

        <div className="next-steps">
          <h3>Next Steps</h3>
          <ul>
            <li>✅ Account created successfully</li>
            <li>✅ Logged in to dashboard</li>
            <li>⏳ Purchase credits (coming soon)</li>
            <li>⏳ Submit your first review (coming soon)</li>
          </ul>
        </div>
      </div>

      <style jsx>{`${styles}`}</style>
    </div>
  );
}

const styles = `
  .dashboard-container {
    min-height: 100vh;
    background: #f7fafc;
  }

  .dashboard-header {
    background: white;
    border-bottom: 1px solid #e2e8f0;
    padding: 1.5rem 2rem;
  }

  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .dashboard-header h1 {
    margin: 0;
    font-size: 1.75rem;
    font-weight: 700;
    color: #1a202c;
  }

  .btn-signout {
    padding: 0.5rem 1rem;
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 600;
    color: #4a5568;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-signout:hover {
    border-color: #cbd5e0;
    background: #f7fafc;
  }

  .dashboard-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    font-size: 1.25rem;
    color: #718096;
  }

  .welcome-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .welcome-card h2 {
    margin: 0 0 0.5rem 0;
    font-size: 1.75rem;
  }

  .welcome-card p {
    margin: 0;
    opacity: 0.9;
  }

  .card {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .card h3 {
    margin: 0 0 1.5rem 0;
    font-size: 1.25rem;
    font-weight: 700;
    color: #1a202c;
  }

  .credits-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .credit-item {
    padding: 1rem;
    background: #f7fafc;
    border-radius: 8px;
    text-align: center;
  }

  .credit-label {
    font-size: 0.875rem;
    color: #718096;
    margin-bottom: 0.5rem;
  }

  .credit-value {
    font-size: 2rem;
    font-weight: 700;
    color: #1a202c;
  }

  .credit-note {
    margin: 1rem 0 0 0;
    padding: 1rem;
    background: #fffbeb;
    border-left: 3px solid #f59e0b;
    border-radius: 4px;
    color: #92400e;
    font-size: 0.875rem;
  }

  .info-grid {
    display: grid;
    gap: 1rem;
  }

  .info-item {
    display: flex;
    justify-content: space-between;
    padding: 1rem;
    background: #f7fafc;
    border-radius: 8px;
  }

  .info-label {
    font-weight: 600;
    color: #718096;
  }

  .info-value {
    color: #1a202c;
  }

  .next-steps {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .next-steps h3 {
    margin: 0 0 1rem 0;
    font-size: 1.25rem;
    font-weight: 700;
    color: #1a202c;
  }

  .next-steps ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .next-steps li {
    padding: 0.75rem 0;
    font-size: 1rem;
    color: #4a5568;
    border-bottom: 1px solid #e2e8f0;
  }

  .next-steps li:last-child {
    border-bottom: none;
  }
`;
