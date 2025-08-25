// Helper: fill a single card from API data
function fillCard(cardEl, data) {
  const avatar = cardEl.querySelector(".avatar");
  if (avatar && data.profile_pic) {
    // Replace skeleton with real img
    const img = new Image();
    img.className = "avatar";
    img.alt = data.username;
    img.src = data.profile_pic;
    cardEl.querySelector(".avatar-wrapper").replaceChildren(img);
  }

  const titleEl = cardEl.querySelector(".card-title");
  if (titleEl) titleEl.textContent = data.full_name || data.username;

  const stats = cardEl.querySelectorAll(".stat-number");
  if (stats.length >= 3) {
    stats[0].textContent = data.followers_fmt;
    stats[1].textContent = data.following_fmt;
    stats[2].textContent = data.posts_fmt;
  }

  const btn = cardEl.querySelector(".btn");
  if (btn) {
    btn.classList.remove("disabled");
    btn.href = data.profile_url;
    btn.textContent = "View Profile";
  }
}

// Fetch & fill all seeded cards
async function hydrateSeedCards() {
  const cards = document.querySelectorAll(".profile-card[data-username]");
  for (const card of cards) {
    const uname = card.getAttribute("data-username");
    try {
      const res = await fetch(`/api/profile/${encodeURIComponent(uname)}`);
      const data = await res.json();
      if (res.ok && data.ok) {
        fillCard(card, data);
      } else {
        card.querySelector(".card-title").textContent = "Unavailable";
        const btn = card.querySelector(".btn");
        btn.textContent = "Open on Instagram";
        btn.classList.remove("disabled");
        btn.href = `https://instagram.com/${uname}`;
      }
    } catch (e) {
      // fallback
      card.querySelector(".card-title").textContent = "Error";
    }
  }
}

// Build a result card for search dynamically
function buildResultCard(data) {
  const col = document.createElement("div");
  col.className = "col-12 col-sm-6 col-md-4 col-lg-3";
  col.innerHTML = `
    <div class="card profile-card h-100">
      <div class="card-body text-center">
        <div class="avatar-wrapper mx-auto mb-3">
          <img class="avatar" src="${data.profile_pic || ""}" alt="${data.username}">
        </div>
        <h5 class="card-title mb-1">${data.full_name || data.username}</h5>
        <p class="text-muted small mb-2">@${data.username}</p>
        <div class="d-flex justify-content-around text-center mb-3">
          <div><div class="stat-number">${data.followers_fmt}</div><div class="stat-label">Followers</div></div>
          <div><div class="stat-number">${data.following_fmt}</div><div class="stat-label">Following</div></div>
          <div><div class="stat-number">${data.posts_fmt}</div><div class="stat-label">Posts</div></div>
        </div>
        <a class="btn btn-outline-primary w-100" href="${data.profile_url}" target="_blank" rel="noopener">View Profile</a>
      </div>
    </div>
  `;
  return col;
}

// Search logic
async function doSearch(username) {
  const alertBox = document.getElementById("searchAlert");
  const section = document.getElementById("searchResults");
  const grid = document.getElementById("searchGrid");
  alertBox.style.display = "none";
  grid.replaceChildren();

  try {
    const res = await fetch(`/api/search?username=${encodeURIComponent(username)}`);
    const data = await res.json();
    if (res.ok && data.ok) {
      section.style.display = "block";
      grid.appendChild(buildResultCard(data));
    } else {
      section.style.display = "block";
      alertBox.style.display = "block";
      alertBox.className = "alert alert-warning";
      alertBox.textContent = `User not found: ${username}`;
    }
  } catch (e) {
    section.style.display = "block";
    alertBox.style.display = "block";
    alertBox.className = "alert alert-danger";
    alertBox.textContent = "Network error. Please try again.";
  }
}

// Category filter
function setupCategoryFilter() {
  const select = document.getElementById("categoryFilter");
  select.addEventListener("change", () => {
    const val = select.value;
    document.querySelectorAll(".category-block").forEach(block => {
      block.style.display = (val === "all" || block.dataset.category === val) ? "" : "none";
    });
    window.scrollTo({top: document.querySelector("section.py-5").offsetTop, behavior: 'smooth'});
  });
}

// Search form handlers
function setupSearch() {
  const form = document.getElementById("searchForm");
  const input = document.getElementById("searchInput");
  const clearBtn = document.getElementById("clearSearch");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const uname = input.value.trim();
    if (uname) doSearch(uname);
  });
  clearBtn.addEventListener("click", () => {
    document.getElementById("searchResults").style.display = "none";
    document.getElementById("searchGrid").replaceChildren();
    document.getElementById("searchAlert").style.display = "none";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  hydrateSeedCards();
  setupCategoryFilter();
  setupSearch();
});
