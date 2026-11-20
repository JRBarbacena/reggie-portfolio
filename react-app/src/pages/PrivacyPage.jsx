export default function PrivacyPage() {
  return (
    <main id="main" className="content-column privacy-page" aria-labelledby="privacy-title">
      <section className="card" data-reveal data-viewport-section>
        <p className="react-eyebrow">Privacy</p>
        <h1 id="privacy-title">A small portfolio with limited data collection.</h1>
        <p>Normal portfolio browsing does not require an account. Zenith&apos;s portfolio answers run in your browser and are not sent to an AI provider.</p>

        <h2>Contact messages</h2>
        <p>If you use the contact form, the private inbox stores your name, email address, topic, message, consent time, and up to six recent Zenith question-and-answer messages for reply context. Only the allow-listed portfolio administrator can read them.</p>
        <p>Inquiries marked replied or archived are automatically deleted 180 days after their last update. You may request earlier deletion through the direct email link on this site.</p>

        <h2>Temporary live chat</h2>
        <p>Live chat stores an optional display name and the conversation in private Supabase tables. The browser receives an opaque session token; only its hash is stored. The conversation expires one hour after the latest message and is then deleted.</p>
        <p>If chat notifications are enabled, the first message and display name may be sent through Resend to notify Reggie. Later chat messages are not emailed.</p>

        <h2>Services and security</h2>
        <p>Vercel serves the site and its two server functions. Supabase provides authentication, private content storage, and the message database. Public portfolio media may use short-lived signed URLs. Server credentials are not included in browser code.</p>
        <p>Please do not submit passwords, payment details, government identifiers, or other sensitive information through the portfolio.</p>
      </section>
    </main>
  );
}
