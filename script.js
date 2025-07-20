// CẤU HÌNH GITHUB
const GITHUB_USERNAME = "sdrake5699"; // Thay bằng username GitHub của bạn
const GITHUB_REPO = "Roblox-download";   // Tên repository
const GITHUB_TOKEN = "ghp_yourtokenhere";   // Thay bằng token mới của bạn
const GITHUB_API = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/games.json`;

// BIẾN TOÀN CỤC
let currentGames = {};

// 1. HÀM KHỞI TẠO
async function init() {
  await loadGames();
  renderGames();
}

// 2. HÀM TẢI DỮ LIỆU TỪ GITHUB
async function loadGames() {
  try {
    const response = await fetch(GITHUB_API, {
      headers: { 
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      currentGames = JSON.parse(atob(data.content));
    } else {
      const errorData = await response.json().catch(() => null);
      let errorMessage = `Lỗi khi tải dữ liệu: ${response.status}`;
      if (errorData && errorData.message) {
        errorMessage += ` - ${errorData.message}`;
      }
      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error("Lỗi tải dữ liệu:", error);
    currentGames = { "all": [], "phổ biến": [], "mới nhất": [] };
    alert(error.message);
  }
}

// 3. HÀM LƯU DỮ LIỆU LÊN GITHUB
async function saveGames() {
  try {
    // Lấy SHA file hiện tại
    const getRes = await fetch(GITHUB_API, {
      headers: { 
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    const sha = getRes.ok ? (await getRes.json()).sha : null;

    // Chuẩn bị dữ liệu
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(currentGames, null, 2))));
    
    // Gửi lên GitHub
    const response = await fetch(GITHUB_API, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify({
        message: `Cập nhật lúc ${new Date().toLocaleString()}`,
        content,
        sha
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      let errorMessage = `Lỗi khi lưu dữ liệu: ${response.status}`;
      if (errorData && errorData.message) {
        errorMessage += ` - ${errorData.message}`;
      }
      throw new Error(errorMessage);
    }
    
    return true;
  } catch (error) {
    console.error("Lỗi lưu dữ liệu:", error);
    alert(error.message);
    return false;
  }
}

// 4. HÀM THÊM GAME MỚI
async function addGame(gameData) {
  if (!currentGames[gameData.tab]) {
    currentGames[gameData.tab] = [];
  }
  
  // Thêm vào tab cụ thể
  currentGames[gameData.tab].push(gameData);
  
  // Thêm vào tab 'all'
  currentGames.all.push(gameData);
  
  // Đồng bộ lên GitHub
  const success = await saveGames();
  
  if (success) {
    // Cập nhật giao diện
    renderGames();
  }
}

// 5. HÀM HIỂN THỊ GAME
function renderGames() {
  const container = document.getElementById('games-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  currentGames.all.forEach(game => {
    container.innerHTML += `
      <div class="game-card">
        <h3>${game.title}</h3>
        <p>${game.description}</p>
        <a href="${game.link}" target="_blank">Tải về</a>
      </div>
    `;
  });
}

// KHỞI CHẠY
document.addEventListener('DOMContentLoaded', init);
