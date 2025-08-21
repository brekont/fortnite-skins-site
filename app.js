// إعدادات عامة
const API_KEY = "2f08e4d7-7108e7b5-c41f7e58-7f701a86";
const API_URL = "https://fortniteapi.io/v2/shop?lang=en";
const PURCHASE_URL = "https://luckymarket.net/luckyhelmet";

const grid = document.getElementById("grid");
const statusEl = document.getElementById("status");
const titleEl = document.getElementById("sectionTitle");
const countInfo = document.getElementById("countInfo");
const form = document.getElementById("searchForm");
const qInput = document.getElementById("q");
const raritySelect = document.getElementById("rarity");
const resetBtn = document.getElementById("resetBtn");
const cardTpl = document.getElementById("cardTpl");

// أدوات مساعدة
function showStatus(msg, type="info"){ 
  statusEl.textContent = msg; 
  statusEl.classList.remove("hidden"); 
}
function hideStatus(){ statusEl.classList.add("hidden"); }
function clearGrid(){ grid.innerHTML = ""; countInfo.textContent = ""; }
function setCount(n){ countInfo.textContent = n ? `عدد العناصر: ${n}` : ""; }

function createSkeletons(n=12){
  clearGrid();
  for(let i=0;i<n;i++){
    const d = document.createElement("div");
    d.className = "skel card";
    grid.appendChild(d);
  }
}

// تحويل قيمة الندرة إلى نص عربي
function rarityLabel(value=""){
  const v = (value||"").toLowerCase();
  switch(v){
    case "legendary": return "أسطوري";
    case "epic": return "ملحمي";
    case "rare": return "نادر";
    case "uncommon": return "غير شائع";
    case "common": return "عادي";
    default: return value;
  }
}

function renderItems(items){
  clearGrid();
  setCount(items.length);
  const frag = document.createDocumentFragment();

  items.forEach(it => {
    const node = cardTpl.content.cloneNode(true);
    const img = node.querySelector("img");
    const nameEl = node.querySelector(".name");
    const badge = node.querySelector(".badge");
    const series = node.querySelector(".series");
    const buy = node.querySelector(".buy");

    const imgUrl = it.images?.icon || it.images?.smallIcon || it.images?.featured || "";
    img.src = imgUrl || "";
    img.alt = it.name || "skin";

    nameEl.textContent = it.name || "بدون اسم";
    badge.textContent = rarityLabel(it.rarity?.value || it.rarity || "");

    series.textContent = it.series?.name ? `سلسلة: ${it.series.name}` : "";

    buy.href = PURCHASE_URL;

    frag.appendChild(node);
  });

  grid.appendChild(frag);
}

// جلب متجر اليوم
async function loadItemShop() {
  try {
    const response = await fetch(API_URL, {
      headers: {
        Authorization: API_KEY
      }
    });

    if (!response.ok) {
      throw new Error("API Error: " + response.status);
    }

    const data = await response.json();
    const shopContainer = document.getElementById("shop");
    shopContainer.innerHTML = "";

    data.shop.forEach(item => {
      const div = document.createElement("div");
      div.className = "item";
      div.innerHTML = `
        <img src="${item.displayAssets[0].url}" alt="${item.displayName}">
        <h3>${item.displayName}</h3>
        <p>Price: ${item.price.finalPrice} V-Bucks</p>
        <a href="https://luckymarket.net/luckyhelmet" target="_blank">اشتري الآن</a>
      `;
      shopContainer.appendChild(div);
    });
  } catch (error) {
    document.getElementById("shop").innerHTML = 
      "<p>تعذّر تحميل متجر اليوم. جرّب تحديث الصفحة أو تحقق من API Key.</p>";
    console.error(error);
  }
}

loadItemShop();

// البحث
async function doSearch(name, rarity){
  try{
    hideStatus();
    titleEl.textContent = "نتائج البحث";
    createSkeletons(12);

    const url = new URL(API_SEARCH_ALL);
    if(name) url.searchParams.set("name", name);
    if(rarity) url.searchParams.set("rarity", rarity);
    url.searchParams.set("language", "ar");

    const res = await fetch(url.toString(), { cache: "no-store" });
    if(!res.ok) throw new Error("فشل البحث");
    const json = await res.json();
    const data = json?.data || [];

    const items = data.map(it => ({
      id: it.id, name: it.name, rarity: it.rarity, images: it.images, series: it.series
    }));
    renderItems(items);
  }catch(err){
    console.error(err);
    showStatus("حدث خطأ أثناء البحث. حاول لاحقاً.");
    clearGrid();
  }
}

// أحداث الواجهة
form.addEventListener("submit", (e)=>{
  e.preventDefault();
  const name = qInput.value.trim();
  const r = raritySelect.value;
  doSearch(name, r);
});

resetBtn.addEventListener("click", ()=>{
  qInput.value = "";
  raritySelect.value = "";
  loadShop();
});

// تحميل أولي
loadShop();
