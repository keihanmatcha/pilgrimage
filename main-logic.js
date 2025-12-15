<script type="module">
import { db, auth } from "./firebase-inits.js";
import { 
    collection, getDocs, query, where, addDoc, setDoc, doc 
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

let map;
let spotMarkers = {};

let isSpotCreationMode = false;
let newSpotMarker = null;

const listElement = document.getElementById("visited-list");
const checkInButton = document.getElementById("check-in-button");
const newSpotForm = document.getElementById("new-spot-form");
const spotLatInput = document.getElementById('spot-lat');
const spotLngInput = document.getElementById('spot-lng');

// ---------------------------
// Firebase Auth
auth.onAuthStateChanged(user => {
    if (user) {
        console.log(`${user.displayName} さんがログインしました`);
        listElement.innerHTML = "スタンプ帳を読み込み中...";
        initializeSpots(user.uid);
        loadVisitedSpots(user.uid);
        checkInButton.disabled = false;
    } else {
        console.log("ログアウトしました");
        checkInButton.disabled = true;
        newSpotForm.reset();
        listElement.innerHTML = "<li>ログインしてください</li>";
        initializeSpots(null);
    }
});

// ---------------------------
// 地図初期化
function initializeMap() {
    map = L.map("map").setView([35.6, 140.0], 7);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);

    map.on('click', onMapClickForSpot);
}

// ---------------------------
// スポット初期化
async function initializeSpots(userId) {
    Object.values(spotMarkers).forEach(marker => marker.remove());
    spotMarkers = {};
    allSpots = [];

    try {
        const q = query(collection(db, "spots"), where("approved", "==", true));
        const snapshot = await getDocs(q);
        snapshot.forEach(docSnap => allSpots.push({ id: docSnap.id, ...docSnap.data() }));
    } catch(e) { console.error(e); }

    allSpots = allSpots.concat(spots);

    let visitedData = {};
    if (userId) {
        try {
            const vsSnap = await getDocs(collection(db, userId));
            vsSnap.forEach(docSnap => visitedData[docSnap.id] = true);
        } catch(e) { console.error(e); }
    }

    allSpots.forEach(spot => {
        if (!spot.lat || !spot.lng) return;
        const isVisited = visitedData[spot.id] === true;
        const marker = L.marker([spot.lat, spot.lng]).addTo(map)
            .bindPopup(`<b>${spot.name}</b><br>${spot.description || ''}`);
        if (isVisited) {
            marker.setIcon(L.icon({ iconUrl:'visited_icon.png', iconSize:[25,41] }));
        }
        spotMarkers[spot.id] = marker;
    });
}

// ---------------------------
// チェックイン
function onCheckInButton() {
    if (!navigator.geolocation) { alert("位置情報を取得できません"); return; }

    navigator.geolocation.getCurrentPosition(async (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;
        const user = auth.currentUser;
        if (!user) return;

        let checkedInSpotId = null;
        allSpots.forEach(spot => {
            if (!spot.lat || !spot.lng) return;
            const distance = map.distance([userLat, userLng], [spot.lat, spot.lng]);
            if (distance < 50) checkedInSpotId = spot.id;
        });

        if (checkedInSpotId) {
            try {
                await setDoc(doc(db, user.uid, checkedInSpotId), {
                    visited: true,
                    timestamp: new Date()
                });
                loadVisitedSpots(user.uid);
                if (spotMarkers[checkedInSpotId]) {
                    spotMarkers[checkedInSpotId].setIcon(L.icon({ iconUrl:'visited_icon.png', iconSize:[25,41] }));
                }
            } catch(e) { console.error(e); }
        } else {
            alert("近くにチェックイン可能なスポットはありません");
        }
    }, (err) => { console.error(err); });
}

// ---------------------------
// スタンプ帳
async function loadVisitedSpots(userId) {
    listElement.innerHTML = "読み込み中...";
    try {
        const snapshot = await getDocs(collection(db, userId));
        if (snapshot.empty) {
            listElement.innerHTML = "<li>まだ訪問した聖地はありません</li>";
            return;
        }
        listElement.innerHTML = "";
        snapshot.forEach(docSnap => {
            const spotInfo = allSpots.find(s => s.id === docSnap.id);
            const li = document.createElement('li');
            li.textContent = spotInfo ? spotInfo.name : `不明な聖地 (${docSnap.id})`;
            listElement.appendChild(li);
        });
    } catch(e) { console.error(e); }
}

// ---------------------------
// 新規聖地投稿
async function submitNewSpot(event) {
    event.preventDefault();
    const user = auth.currentUser;
    if (!user) { alert("ログインしてください"); return; }

    const name = document.getElementById('spot-name').value;
    const desc = document.getElementById('spot-desc').value;
    const lat = parseFloat(spotLatInput.value);
    const lng = parseFloat(spotLngInput.value);
    const artistId = document.getElementById('spot-artist').value;
    const relatedVideoId = document.getElementById('spot-video').value;

    if (!name || isNaN(lat) || isNaN(lng)) {
        alert("「聖地名」「緯度」「経度」は必須です");
        return;
    }

    try {
        await addDoc(collection(db, "spots"), {
            name, description: desc,
            lat, lng,
            artistId: artistId || null,
            relatedVideoId: relatedVideoId || null,
            submittedBy: user.uid,
            approved: false
        });
        alert("聖地情報を投稿しました！（承認後に地図に表示されます）");
        cancelSpotCreationMode();
    } catch(e) {
        console.error(e);
        alert("投稿に失敗しました");
    }
}

// ---------------------------
// 聖地作成モード
function enterSpotCreationMode() {
    isSpotCreationMode = true;
    alert("聖地投稿モードです。地図をクリックしてくだ
