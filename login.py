import sqlite3
import functools
from flask import (
    Flask,
    render_template_string,
    request,
    redirect,
    url_for,
    session,
    flash,
    g,
)
import bcrypt

app = Flask(__name__)
app.secret_key = "change-this-to-a-random-secret-in-production"

DATABASE = "users.db"

# ── HTML Templates ────────────────────────────────────────────────────────────

BASE = """
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{% block title %}App{% endblock %}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #f4f6f9; color: #222; }
    nav { background: #1a1a2e; padding: 1rem 2rem; display: flex; gap: 1.5rem; align-items: center; }
    nav a { color: #e0e0e0; text-decoration: none; font-size: .95rem; }
    nav a:hover { color: #fff; }
    nav .brand { color: #fff; font-weight: 700; font-size: 1.1rem; margin-right: auto; }
    .container { max-width: 480px; margin: 4rem auto; padding: 0 1rem; }
    .card { background: #fff; border-radius: 10px; padding: 2rem; box-shadow: 0 2px 12px rgba(0,0,0,.08); }
    h1 { margin-bottom: 1.5rem; font-size: 1.5rem; }
    label { display: block; margin-bottom: .25rem; font-size: .9rem; font-weight: 600; color: #444; }
    input[type=text], input[type=password] {
      width: 100%; padding: .6rem .8rem; border: 1px solid #d0d0d0;
      border-radius: 6px; font-size: 1rem; margin-bottom: 1rem;
    }
    input:focus { outline: none; border-color: #5b6ef5; box-shadow: 0 0 0 3px rgba(91,110,245,.15); }
    button { width: 100%; padding: .7rem; background: #5b6ef5; color: #fff;
             border: none; border-radius: 6px; font-size: 1rem; cursor: pointer; }
    button:hover { background: #4758d4; }
    .flash { padding: .75rem 1rem; border-radius: 6px; margin-bottom: 1rem; font-size: .9rem; }
    .flash.error   { background: #fde8e8; color: #c0392b; }
    .flash.success { background: #e8f8f0; color: #1e8449; }
    .flash.info    { background: #eaf2fb; color: #1a5276; }
    .link-row { text-align: center; margin-top: 1rem; font-size: .9rem; }
    .link-row a { color: #5b6ef5; }
    .dash-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-top: 1.5rem; }
    .stat-card { background: #f0f2ff; border-radius: 8px; padding: 1.25rem; text-align: center; }
    .stat-card .num { font-size: 2rem; font-weight: 700; color: #5b6ef5; }
    .stat-card .lbl { font-size: .85rem; color: #666; margin-top: .25rem; }
  </style>
</head>
<body>
  <nav>
    <span class="brand">MyApp</span>
    {% if session.user_id %}
      <a href="{{ url_for('dashboard') }}">Dashboard</a>
      <a href="{{ url_for('logout') }}">Logout</a>
    {% else %}
      <a href="{{ url_for('login') }}">Login</a>
      <a href="{{ url_for('register') }}">Register</a>
    {% endif %}
  </nav>
  {% with messages = get_flashed_messages(with_categories=true) %}
    {% if messages %}
      <div class="container" style="margin-bottom:0; margin-top:1.5rem;">
        {% for category, message in messages %}
          <div class="flash {{ category }}">{{ message }}</div>
        {% endfor %}
      </div>
    {% endif %}
  {% endwith %}
  {% block content %}{% endblock %}
</body>
</html>
"""

REGISTER_HTML = BASE.replace(
    "{% block content %}{% endblock %}",
    """
{% block content %}
<div class="container">
  <div class="card">
    <h1>Create account</h1>
    <form method="post">
      <label for="username">Username</label>
      <input id="username" name="username" type="text" autocomplete="username" required>
      <label for="password">Password</label>
      <input id="password" name="password" type="password" autocomplete="new-password" required>
      <label for="confirm">Confirm password</label>
      <input id="confirm" name="confirm" type="password" autocomplete="new-password" required>
      <button type="submit">Register</button>
    </form>
    <div class="link-row">Already have an account? <a href="{{ url_for('login') }}">Log in</a></div>
  </div>
</div>
{% endblock %}
""",
)

LOGIN_HTML = BASE.replace(
    "{% block content %}{% endblock %}",
    """
{% block content %}
<div class="container">
  <div class="card">
    <h1>Welcome back</h1>
    <form method="post">
      <label for="username">Username</label>
      <input id="username" name="username" type="text" autocomplete="username" required>
      <label for="password">Password</label>
      <input id="password" name="password" type="password" autocomplete="current-password" required>
      <button type="submit">Log in</button>
    </form>
    <div class="link-row">No account? <a href="{{ url_for('register') }}">Register</a></div>
  </div>
</div>
{% endblock %}
""",
)

DASHBOARD_HTML = BASE.replace(
    "{% block content %}{% endblock %}",
    """
{% block content %}
<div class="container" style="max-width:700px;">
  <div class="card">
    <h1>Dashboard</h1>
    <p>Logged in as <strong>{{ username }}</strong></p>
    <div class="dash-grid">
      <div class="stat-card"><div class="num">1</div><div class="lbl">Active session</div></div>
      <div class="stat-card"><div class="num">0</div><div class="lbl">Notifications</div></div>
      <div class="stat-card"><div class="num">&#10003;</div><div class="lbl">Account verified</div></div>
    </div>
  </div>
</div>
{% endblock %}
""",
)

# ── Database ──────────────────────────────────────────────────────────────────


def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DATABASE, detect_types=sqlite3.PARSE_DECLTYPES)
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close_db(exc):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    db = sqlite3.connect(DATABASE)
    db.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id       INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT    NOT NULL UNIQUE,
            password TEXT    NOT NULL
        )
    """)
    db.commit()
    db.close()


# ── Auth decorator ────────────────────────────────────────────────────────────


def login_required(view):
    @functools.wraps(view)
    def wrapped(**kwargs):
        if not session.get("user_id"):
            flash("Please log in to access that page.", "info")
            return redirect(url_for("login"))
        return view(**kwargs)

    return wrapped


# ── Routes ────────────────────────────────────────────────────────────────────


@app.route("/")
def index():
    if session.get("user_id"):
        return redirect(url_for("dashboard"))
    return redirect(url_for("login"))


@app.route("/register", methods=["GET", "POST"])
def register():
    if session.get("user_id"):
        return redirect(url_for("dashboard"))

    if request.method == "POST":
        username = request.form["username"].strip()
        password = request.form["password"]
        confirm = request.form["confirm"]

        if not username or not password:
            flash("Username and password are required.", "error")
        elif len(password) < 8:
            flash("Password must be at least 8 characters.", "error")
        elif password != confirm:
            flash("Passwords do not match.", "error")
        else:
            db = get_db()
            if db.execute(
                "SELECT id FROM users WHERE username = ?", (username,)
            ).fetchone():
                flash("Username already taken.", "error")
            else:
                hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
                db.execute(
                    "INSERT INTO users (username, password) VALUES (?, ?)",
                    (username, hashed.decode()),
                )
                db.commit()
                flash("Account created — please log in.", "success")
                return redirect(url_for("login"))

    return render_template_string(REGISTER_HTML)


@app.route("/login", methods=["GET", "POST"])
def login():
    if session.get("user_id"):
        return redirect(url_for("dashboard"))

    if request.method == "POST":
        username = request.form["username"].strip()
        password = request.form["password"]

        db = get_db()
        user = db.execute(
            "SELECT id, password FROM users WHERE username = ?", (username,)
        ).fetchone()

        if user and bcrypt.checkpw(password.encode(), user["password"].encode()):
            session.clear()
            session["user_id"] = user["id"]
            session["username"] = username
            return redirect(url_for("dashboard"))

        flash("Invalid username or password.", "error")

    return render_template_string(LOGIN_HTML)


@app.route("/logout")
def logout():
    session.clear()
    flash("You have been logged out.", "info")
    return redirect(url_for("login"))


@app.route("/dashboard")
@login_required
def dashboard():
    return render_template_string(DASHBOARD_HTML, username=session["username"])


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    init_db()
    app.run(debug=True)
