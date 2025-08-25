from flask import Flask, render_template, jsonify, request
from functools import lru_cache
import instaloader

app = Flask(__name__, static_url_path="/static")

# --- Config: Categories & seed profiles with your notes ---
CATEGORIES = {
    "Entertainment": [
        {"username": "netflix", "note": "Streaming originals & trailers."},
        {"username": "marvel", "note": "Superheroes & films universe."},
        {"username": "natgeo", "note": "Nature, wildlife & exploration."},
    ],
    "Finance": [
        {"username": "forbes", "note": "Business news & billionaire lists."},
        {"username": "theeconomist", "note": "Global economics & analysis."},
        {"username": "bloombergbusiness", "note": "Markets & finance insights."},
    ],
    "Business": [
        {"username": "nike", "note": "Brand storytelling & campaigns."},
        {"username": "adidas", "note": "Sportswear & collabs."},
        {"username": "teslamotors", "note": "EVs, energy & tech."},
    ],
    "Sports": [
        {"username": "cristiano", "note": "Football icon & fitness."},
        {"username": "leomessi", "note": "GOAT. Football & family."},
        {"username": "nba", "note": "Official NBA highlights."},
    ],
}

# Instaloader context (reuse for speed)
LOADER = instaloader.Instaloader(
    download_pictures=True,
    download_videos=False,
    download_video_thumbnails=False,
    download_geotags=False,
    save_metadata=False,
    compress_json=False,
    quiet=True,
)

def format_number(n: int) -> str:
    if n is None:
        return "0"
    if n >= 1_000_000_000:
        return f"{n/1_000_000_000:.1f}B"
    if n >= 1_000_000:
        return f"{n/1_000_000:.1f}M"
    if n >= 1_000:
        return f"{n/1_000:.1f}K"
    return str(n)

@lru_cache(maxsize=512)
def fetch_profile(username: str) -> dict:
    """Fetch public profile info. Cached for speed."""
    try:
        profile = instaloader.Profile.from_username(LOADER.context, username)
        return {
            "ok": True,
            "username": profile.username,
            "full_name": profile.full_name or "",
            "bio": profile.biography or "",
            "followers": profile.followers or 0,
            "following": profile.followees or 0,
            "posts": profile.mediacount or 0,
            "followers_fmt": format_number(profile.followers or 0),
            "following_fmt": format_number(profile.followees or 0),
            "posts_fmt": format_number(profile.mediacount or 0),
            "profile_pic": str(profile.profile_pic_url),  # cast to str
            "profile_url": f"https://instagram.com/{profile.username}",
        }
    except Exception as e:
        return {"ok": False, "error": str(e), "username": username}

@app.route("/")
def home():
    # Send only skeleton info to template (usernames + notes + categories).
    return render_template("index.html", categories=CATEGORIES)

@app.get("/api/profile/<username>")
def api_profile(username):
    data = fetch_profile(username.strip())
    status = 200 if data.get("ok") else 404
    return jsonify(data), status

@app.get("/api/search")
def api_search():
    username = request.args.get("username", "").strip()
    if not username:
        return jsonify({"ok": False, "error": "username required"}), 400
    data = fetch_profile(username)
    status = 200 if data.get("ok") else 404
    return jsonify(data), status

if __name__ == "__main__":
    app.run(debug=True, port=5000)
