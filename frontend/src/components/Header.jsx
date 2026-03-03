function Header({ isLogin, onLogout }) {
  return (
    <header>
      <div className="brand-tab">
        <h1>📑NoteIt</h1>
        <p className="header-subtitle">Your AI-powered note companion</p>
      </div>

      {isLogin ? (
        <div className="auth-tabs">
          <p>{isLogin.username}</p>
          <button className="logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      ) : null}
    </header>
  );
}

export default Header;
