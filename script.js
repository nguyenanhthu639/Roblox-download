// CẤU HÌNH GITHUB (KIỂM TRA LẠI THÔNG TIN)
const GITHUB_USERNAME = "nguyenanhthu639"; // Đảm bảo đúng username GitHub
const GITHUB_REPO = "Roblox-download"; // Đảm bảo repository tồn tại
const GITHUB_TOKEN = "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"; // Token mới có quyền repo
const GITHUB_API = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/games.json`;

// BIẾN TOÀN CỤC
let currentGames = {};

// 1. HÀM KHỞI TẠO
async function init() {
  await loadGames();
  renderGames();
}

// 2. HÀM TẢI DỮ LIỆU - ĐÃ FIX 404
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
    } else if (response.status === 404) {
      console.log("File không tồn tại, khởi tạo dữ liệu mới");
      currentGames = { 
        "all": [], 
        "phổ biến": [], 
        "mới nhất": [] 
      };
      await createInitialFile(); // Tạo file lần đầu
    } else {
      throw new Error(`Lỗi ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Lỗi tải dữ liệu:", error);
    alert("Không thể tải dữ liệu: " + error.message);
    currentGames = { "all": [], "phổ biến": [], "mới nhất": [] };
  }
}

// 3. HÀM TẠO FILE LẦN ĐẦU - FIX 404
async function createInitialFile() {
  try {
    const content = btoa(JSON.stringify(currentGames));
    const response = await fetch(GITHUB_API, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify({
        message: "Khởi tạo file games.json",
        content: content
      })
    });

    if (!response.ok) {
      throw new Error(`Lỗi tạo file: ${response.status}`);
    }
    console.log("Đã tạo file games.json thành công!");
  } catch (error) {
    console.error("Lỗi khi tạo file:", error);
    throw error;
  }
}

// 4. HÀM LƯU DỮ LIỆU - ĐÃ FIX 404
async function saveGames() {
  try {
    // 1. Lấy SHA file hiện tại (nếu có)
    let sha = null;
    try {
      const getRes = await fetch(GITHUB_API, {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      if (getRes.ok) {
        sha = (await getRes.json()).sha;
      }
    } catch (e) {
      console.log("Chưa có file, sẽ tạo mới");
    }

    // 2. Chuẩn bị nội dung
    const content = btoa(unescape(encodeURIComponent(
      JSON.stringify(currentGames, null, 2)
    )));

    // 3. Gửi request lưu dữ liệu
    const response = await fetch(GITHUB_API, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify({
        message: `Cập nhật lúc ${new Date().toISOString()}`,
        content: content,
        sha: sha // null nếu là file mới
      })
    });

    // 4. Xử lý kết quả
    if (!response.ok) {
      // Nếu lỗi 404 do file chưa tồn tại
      if (response.status === 404) {
        return await createInitialFile();
      }
      const errorData = await response.json();
      throw new Error(errorData.message || "Lỗi không xác định");
    }

    console.log("Lưu dữ liệu thành công!");
    return true;
  } catch (error) {
    console.error("Lỗi lưu dữ liệu:", error);
    alert("Lỗi khi lưu: " + error.message);
    return false;
  }
}

// 5. HÀM THÊM GAME MỚI
async function addGame(gameData) {
  // Kiểm tra và khởi tạo tab nếu chưa có
  if (!currentGames[gameData.tab]) {
    currentGames[gameData.tab] = [];
  }

  // Thêm ID tự động
  gameData.id = Date.now();

  // Thêm vào các danh sách
  currentGames[gameData.tab].push(gameData);
  currentGames.all.push(gameData);

  // Lưu lên GitHub
  const success = await saveGames();
  if (success) {
    renderGames();
    alert("Đã thêm game thành công!");
  }
}

// 6. HÀM HIỂN THỊ
function renderGames() {
  const container = document.getElementById('games-container');
  if (!container) return;

  container.innerHTML = currentGames.all.length === 0
    ? '<div class="empty-state">Chưa có game nào</div>'
    : currentGames.all.map(game => `
        <div class="game-card">
          <h3>${game.title}</h3>
          <p>${game.description}</p>
          <a href="${game.link}" target="_blank">Tải về</a>
        </div>
      `).join('');
}

// KHỞI CHẠY ỨNG DỤNG
document.addEventListener('DOMContentLoaded', init);
