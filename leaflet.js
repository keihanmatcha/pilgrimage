import { db } from "./firebase-inits.js";
import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// 地図を初期化（千葉県あたりを中心に）
const map = L.map("map").setView([35.6, 140.0], 7);

// タイルレイヤー追加
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

// Firestoreから approved==true のスポットを表示
async function loadApprovedSpots() {
  const q = query(collection(db, "spots"), where("approved", "==", true));
  const snapshot = await getDocs(q);

  snapshot.forEach(doc => {
    const spot = doc.data();
    if (spot.lat && spot.lng) {
      const marker = L.marker([spot.lat, spot.lng]).addTo(map);
      marker.bindPopup(`<b>${spot.name}</b><br>${spot.description || ""}`);
    }
  });
}

loadApprovedSpots();
