// pages/dashboard/index.jsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getCurrentUser, getUserProfile, signOut } from '@/lib/auth-helpers';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Promo code state
  const [promoCode, setPromoCode] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoMessage, setPromoMessage] = useState('');
  const [promoError, setPromoError] = useState('');

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

  async function handleRedeemPromo() {
    if (!promoCode.trim()) {
      setPromoError('Please enter a promo code');
      return;
    }

    setPromoLoading(true);
    setPromoError('');
    setPromoMessage('');

    try {
      // Validate the code
      const validateRes = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode, userId: user.id }),
      });

      const validateData = await validateRes.json();

      if (!validateRes.ok) {
        setPromoError(validateData.error || 'Invalid promo code');
        setPromoLoading(false);
        return;
      }

      // Redeem the code
      const redeemRes = await fetch('/api/promo/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promoCodeId: validateData.promoCodeId, userId: user.id }),
      });

      const redeemData = await redeemRes.json();

      if (!redeemRes.ok) {
        setPromoError(redeemData.error || 'Failed to redeem code');
        setPromoLoading(false);
        return;
      }

      // Success!
      setPromoMessage(
        `Success! Added ${redeemData.credits_granted.quicklooks} QuickLook${
          redeemData.credits_granted.quicklooks !== 1 ? 's' : ''
        } and ${redeemData.credits_granted.full_reviews} Full Review${
          redeemData.credits_granted.full_reviews !== 1 ? 's' : ''
        }!`
      );
      setPromoCode('');

      // Reload profile to show new credits
      await loadUserData();
    } catch (error) {
      setPromoError('An error occurred. Please try again.');
    } finally {
      setPromoLoading(false);
    }
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
          <p className="credit-note">You don't have any credits yet. Purchase credits or use a promo code below.</p>
        </div>

        <div className="card">
          <h3>Have a Promo Code?</h3>
          <p style={{ marginBottom: '1rem', color: '#718096' }}>
            Enter your beta code or promo code to get free credits
          </p>
          <div className="promo-input-group">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              placeholder="Enter code (e.g., BETA001)"
              disabled={promoLoading}
              className="promo-input"
              onKeyPress={(e) => e.key === 'Enter' && handleRedeemPromo()}
            />
            <button
              onClick={handleRedeemPromo}
              disabled={promoLoading || !promoCode.trim()}
              className="btn-redeem"
            >
              {promoLoading ? 'Redeeming...' : 'Redeem'}
            </button>
          </div>
          {promoError && <div className="promo-error">{promoError}</div>}
          {promoMessage && <div className="promo-success">{promoMessage}</div>}
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

  .promo-input-group {
    display: flex;
    gap: 0.75rem;
  }

  .promo-input {
    flex: 1;
    padding: 0.75rem 1rem;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 1rem;
    font-family: monospace;
    text-transform: uppercase;
    transition: all 0.2s;
  }

  .promo-input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  .promo-input:disabled {
    background: #f7fafc;
    cursor: not-allowed;
  }

  .btn-redeem {
    padding: 0.75rem 2rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
  }

  .btn-redeem:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }

  .btn-redeem:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .promo-error {
    margin-top: 1rem;
    padding: 0.75rem 1rem;
    background: #fff5f5;
    border-left: 3px solid #f56565;
    border-radius: 4px;
    color: #c53030;
    font-size: 0.875rem;
  }

  .promo-success {
    margin-top: 1rem;
    padding: 0.75rem 1rem;
    background: #f0fff4;
    border-left: 3px solid #48bb78;
    border-radius: 4px;
    color: #22543d;
    font-size: 0.875rem;
    font-weight: 600;
  }
`;
