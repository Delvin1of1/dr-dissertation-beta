// components/Footer.jsx
import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div>
          <div className="footer-brand-name">Dr. Dissertation</div>
          <p className="footer-brand-desc">
            AI-powered dissertation review using the HAIST© methodology. Get expert feedback in minutes, not weeks.
          </p>
        </div>
        <div className="footer-col">
          <h4>Product</h4>
          <Link href="/#pricing">QuickLook Review</Link>
          <Link href="/#pricing">Full Review</Link>
          <Link href="/features/analysis">HAIST© Methodology</Link>
          <Link href="/#pricing">Pricing</Link>
        </div>
        <div className="footer-col">
          <h4>Resources</h4>
          <Link href="/features/research">Research Foundation</Link>
          <Link href="/features/expert">Expert Team</Link>
          <Link href="/features/secure">Privacy &amp; Security</Link>
          <Link href="/contact">FAQ</Link>
        </div>
        <div className="footer-col">
          <h4>Support</h4>
          <Link href="/contact">Contact Us</Link>
          <Link href="/auth/login">Sign In</Link>
          <Link href="/auth/signup">Create Account</Link>
          <a href="mailto:support@doctordissertation.com">Email Support</a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {year} Dr. Dissertation by Symbiotic Scholar. All rights reserved.</span>
        <div className="footer-bottom-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}
