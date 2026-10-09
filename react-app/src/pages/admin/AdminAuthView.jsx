export default function AdminAuthView({ session, email, busy, message, onEmailChange, onSubmit }) {
  return (
    <main id="main" className="react-admin admin-login" aria-labelledby="admin-title">
      <section className="react-admin__panel">
        <p className="react-eyebrow">Private area</p>
        <h1 id="admin-title">Portfolio admin</h1>
        {!session && (
          <form onSubmit={onSubmit}>
            <label>Email<input type="email" value={email} onChange={onEmailChange} required autoComplete="email" /></label>
            <button disabled={busy}>Send secure sign-in link</button>
          </form>
        )}
        {session && <p>Your account is signed in but is not on the portfolio-admin allow list.</p>}
        {message && <p className="react-admin__message" role="status">{message}</p>}
      </section>
    </main>
  );
}
