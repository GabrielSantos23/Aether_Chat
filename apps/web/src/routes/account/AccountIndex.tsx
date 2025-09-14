export default function AccountIndex() {
  return (
    <div className="account-index">
      <h1>Account Overview</h1>
      <p>Quick overview of your account status and recent activity.</p>

      <section className="account-summary">
        <h2>Account Summary</h2>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="label">Member since:</span>
            <span className="value">January 2024</span>
          </div>
          <div className="summary-item">
            <span className="label">Plan:</span>
            <span className="value">Premium</span>
          </div>
          <div className="summary-item">
            <span className="label">Usage this month:</span>
            <span className="value">1,234 queries</span>
          </div>
        </div>
      </section>
    </div>
  );
}
