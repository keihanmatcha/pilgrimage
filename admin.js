import { db } from "./firebase-inits.js";
import { 
  collection, getDocs, updateDoc, deleteDoc, doc 
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";


const listContainer = document.getElementById("spotsList");

// ---------------------------
// 未承認スポットを一覧表示
// ---------------------------
async function loadSpots() {
  listContainer.innerHTML = "<p>読み込み中...</p>";

  const snapshot = await getDocs(collection(db, "spots"));
  const spots = [];
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    if (data.approved === false) {
      spots.push({ id: docSnap.id, ...data });
    }
  });

  if (spots.length === 0) {
    listContainer.innerHTML = "<p>未承認スポットはありません。</p>";
    return;
  }

  listContainer.innerHTML = "";

  spots.forEach(spot => {
    const card = document.createElement("div");
    card.className = "spot-card";
    card.innerHTML = `
      <h3>${spot.name}</h3>
      <p>${spot.description || "（説明なし）"}</p>
      <p><b>緯度:</b> ${spot.lat}, <b>経度:</b> ${spot.lng}</p>
      <div id="map-${spot.id}" class="map-preview"></div>
      <div class="btn-container">
        <button class="approve-btn" data-id="${spot.id}">✅ 承認</button>
        <button class="delete-btn" data-id="${spot.id}">🗑️ 削除</button>
      </div>
    `;
    listContainer.appendChild(card);

    // 地図プレビュー生成
    if (spot.lat && spot.lng) {
      const map = L.map(`map-${spot.id}`, {
        center: [spot.lat, spot.lng],
        zoom: 10,
        zoomControl: false,
        attributionControl: false
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
      L.marker([spot.lat, spot.lng]).addTo(map);
    }
  });

  // イベント設定（承認／削除）
  document.querySelectorAll(".approve-btn").forEach(btn => {
    btn.addEventListener("click", approveSpot);
  });
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", deleteSpot);
  });
}

// ---------------------------
// 承認処理
// ---------------------------
async function approveSpot(event) {
  const id = event.target.dataset.id;
  if (!confirm("このスポットを承認しますか？")) return;

  try {
    await updateDoc(doc(db, "spots", id), { approved: true });
    alert("承認しました！");
    loadSpots(); // リロード
  } catch (e) {
    console.error(e);
    alert("承認に失敗しました。");
  }
}

// ---------------------------
// 削除処理
// ---------------------------
async function deleteSpot(event) {
  const id = event.target.dataset.id;
  if (!confirm("このスポットを削除しますか？")) return;

  try {
    await deleteDoc(doc(db, "spots", id));
    alert("削除しました！");
    loadSpots();
  } catch (e) {
    console.error(e);
    alert("削除に失敗しました。");
  }
}

// ---------------------------
// 実行
// ---------------------------
loadSpots();
