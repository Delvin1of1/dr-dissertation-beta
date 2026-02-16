// pages/auth/callback.jsx
// Handles OAuth callback from Google/other providers

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // Handle the OAuth callback
    const handleCallback = async () => {
      try {
        // Get the session from the URL
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          router.push('/auth/login?error=callback_failed');
          return;
        }

        if (data.session) {
          // Create user profile if it doesn't exist
          const { data: profile } = await supabase
            .from('users')
            .select('id')
            .eq('id', data.session.user.id)
            .single();

          if (!profile) {
            await supabase.from('users').insert({
              id: data.session.user.id,
              email: data.session.user.email,
              full_name: data.session.user.user_metadata?.full_name || data.session.user.user_metadata?.name || '',
            });
          }

          // Redirect to dashboard
          router.push('/dashboard');
        } else {
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('Unexpected error in auth callback:', error);
        router.push('/auth/login?error=unexpected');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="callback-container">
      <div className="spinner"></div>
      <p>Signing you in...</p>

      <style jsx>{`
        .callback-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .spinner {
          width: 48px;
          height: 48px;
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        p {
          color: white;
          font-size: 1.125rem;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
