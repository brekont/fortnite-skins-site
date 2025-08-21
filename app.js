// إعدادات عامة
const API_SHOP = "2f08e4d7-7108e7b5-c41f7e58-7f701a86";
const API_SEARCH_ALL = "https://fortniteapi.io/v2/shop?lang=en";
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
async function loadShop(){
  try{
    hideStatus();
    titleEl.textContent = "متجر اليوم";
    createSkeletons(16);

    // كاش بسيط لمدة 30 دقيقة
    const now = Date.now();
    const cached = localStorage.getItem("shop_cache_v1");
    if(cached){
      try{
        const obj = JSON.parse(cached);
        if(obj.t && (now - obj.t) < 30*60*1000 && Array.isArray(obj.items)){
          renderItems(obj.items);
          return; // كفاية الكاش
        }
      }catch{}
    }

    const res = await fetch(API_SHOP, { cache: "no-store" });
    if(!res.ok) throw new Error("فشل الاتصال بالـ API");
    const json = await res.json();

    const entries = json?.data?.entries || [];
    const items = entries.flatMap(e => e?.items || []).filter(Boolean).map(it => ({
      id: it.id,
      name: it.name,
      rarity: it.rarity,
      images: it.images,
      series: it.series
    }));

    // إزالة التكرارات حسب id
    const unique = Array.from(new Map(items.map(x => [x.id, x])).values());

    renderItems(unique);
    localStorage.setItem("shop_cache_v1", JSON.stringify({ t: now, items: unique }));
  }catch(err){
    console.error(err);
    showStatus("تعذّر تحميل متجر اليوم. جرّب تحديث الصفحة أو تعطيل مانع الإعلانات مؤقتاً.");
    clearGrid();
  }
}

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
