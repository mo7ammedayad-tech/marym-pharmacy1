async function compressImage(file){
  return new Promise((resolve)=>{
    const img = new Image();
    const reader = new FileReader();
    reader.onload = e => {
      img.src = e.target.result;
    };
    img.onload = () => {
      const canvas =
      document.createElement("canvas");
      let width = img.width;
      let height = img.height;
      const maxWidth = 700;
      if(width > maxWidth){
        height *= maxWidth / width;
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx =
      canvas.getContext("2d");
      ctx.drawImage(
        img,
        0,
        0,
        width,
        height
      );
      canvas.toBlob(
        blob => {
          resolve(blob);
        },
        "image/webp",
        0.55
      );
    };
    reader.readAsDataURL(file);
  });
}
async function uploadImage(file){
  const compressed =
  await compressImage(file);
  const formData =
  new FormData();
  formData.append(
    "image",
    compressed
  );
  const res = await fetch(
    "https://api.imgbb.com/1/upload?key=7c17217bfd8a943dbc318552c7307b53",
    {
      method:"POST",
      body:formData
    }
  );
  const data =
  await res.json();
  return data.data.url;
}
import { initializeApp }
from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  increment,
  onSnapshot,
  doc,
  setDoc
}
from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";
import {
  getAuth,
  signInWithEmailAndPassword
}
from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
const firebaseConfig = {
  apiKey: "AIzaSyCNLcHgGv7Cq2ONzBJtM3JPFVR4qSWdE1A",
  authDomain: "pharmacy-440bf.firebaseapp.com",
  projectId: "pharmacy-440bf",
  storageBucket: "pharmacy-440bf.firebasestorage.app",
  messagingSenderId: "70472218671",
  appId: "1:70472218671:web:3da3dad68c0b1fc3696eda"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const visitorsRef = doc(db, "stats", "visitors");
if(!localStorage.getItem("visited")){
  updateDoc(visitorsRef, {
    count: increment(1)
  });
  localStorage.setItem("visited", "true");
}
onSnapshot(visitorsRef, (docSnap) => {
  if(docSnap.exists()){
    document.getElementById("visitorsCount").textContent =
      docSnap.data().count || 0;
  }
});
let appliedDiscount = 0;
let appliedCode = null;
let cart = JSON.parse(
  localStorage.getItem("cart")
) || [];
let allProducts = [];
let currentProducts = [];
let isAdmin =
localStorage.getItem("isAdmin") === "true";
function renderProducts(list){
  currentProducts = [...list];
  const box =
  document.getElementById("products");
  box.innerHTML = "";
  document.getElementById("productsCount")
.innerText =
"عدد المنتجات: " + list.length;
const available =
list.filter(p =>
p.available !== false
).length;
const unavailable =
list.filter(p =>
p.available === false
).length;
document.getElementById(
"availableCount"
).innerText =
"المتوفرة: " + available;
document.getElementById(
"unavailableCount"
).innerText =
"غير المتوفرة: " + unavailable;
  list.forEach(p=>{
    box.innerHTML += `
    <div class="card"
     data-id="${p.id}"
     onclick='openPopup(${JSON.stringify(p)})'>
    <img
    loading="lazy"
src="${p.image && p.image.trim() !== '' 
? p.image 
: 'https://via.placeholder.com/300x300?text=No+Image'}"referrerpolicy="no-referrer"
onerror="this.onerror=null;this.src='https://via.placeholder.com/300x300/ffffff/ff4fa3?text=Image';"
style="background:white;display:block;">
      <div class="card-content">
        <h3>${p.name}</h3>
          <p>
          ${p.desc ? p.desc : "لا يوجد وصف"}
          </p>
        <div class="price"> 
        ${p.price} IQD
        </div>
        <div class="stock-status">
        ${p.available !== false
        ? '🟢 متوفر'
        : '🔴 غير متوفر'}
        </div>
       ${p.available !== false ? `

<button onclick="event.stopPropagation(); addToCart('${p.name}',${p.price})">أضف للسلة</button>
${isAdmin ? `
<button class="copy-link-btn" onclick="event.stopPropagation(); copyProductLink('${p.id}')">
🔗 نسخ رابط المنتج</button>
` : ""}
` : `
<button disabled style=" background:#ccc; cursor:not-allowed; ">غير متوفر</button>
`}
${isAdmin ? `
<div class="admin-actions">
<button onclick="event.stopPropagation(); quickEdit('${p.name}')">✏️ تعديل</button>
<button onclick="event.stopPropagation(); quickDelete('${p.name}')">🗑️ حذف</button>
</div>
` : ""}
      </div>
    </div>
    `;
  });
}
window.addEventListener(
"DOMContentLoaded",
loadProducts
);
window.addEventListener(
"DOMContentLoaded",
updateCart
);
window.searchProducts = function(text){
  if(!text){
    renderProducts(allProducts);
    return;
  }
  let filtered =
  allProducts.filter(p =>
    p.name.toLowerCase().includes(text.toLowerCase()) ||
    (p.desc &&
    p.desc.toLowerCase().includes(text.toLowerCase()))
  );
  renderProducts(filtered);
};
window.openPopup = function(product){
  document.getElementById("productPopup") .style.display = "flex";
  document.getElementById("scrollTopBtn") .classList.remove("show");
  document.getElementById("popupImage")
  .src =
  product.image ||
  "https://via.placeholder.com/300";
  document.getElementById("popupName")
  .innerText = product.name;
  document.getElementById("popupDesc")
  .innerText =
  product.desc || "";
  document.getElementById("popupPrice")
  .innerText =
  product.price + " IQD";
  document.getElementById("popupBtn")
  .onclick = function(){
    addToCart(
      product.name,
      product.price
    );
  };
};
window.closePopup = function(){
  document.getElementById("productPopup")
  .style.display = "none";
};

window.filterCat = function(cat,event){
  document.querySelectorAll(".cat")
  .forEach(c=>c.classList.remove("active"));
  event.currentTarget.classList.add("active");
  document.getElementById("sortSelect").value = "default";
  if(cat === "latest"){
    const latestProducts =
      [...allProducts]
      .sort((a,b)=>
        (b.createdAt || 0) -
        (a.createdAt || 0)
      )
      .slice(0,10);
    renderProducts(latestProducts);
  }else if(cat === "الكل"){
    renderProducts(allProducts);
  }else{
    renderProducts(
      allProducts.filter(p=>
        Array.isArray(p.cat)
        ? p.cat.includes(cat)
        : p.cat === cat
      )
    );
  }
};

function showToast(){
  const toast =
  document.getElementById("toast");
  toast.classList.add("show");
  setTimeout(()=>{
    toast.classList.remove("show");
  },1800);
}
window.addToCart = function(name,price){
  const product = allProducts.find(p=>p.name===name);
if(product && product.available === false){
  alert("المنتج غير متوفر حالياً");
  return;
}
  let exist =
  cart.find(i=>i.name===name);
  if(exist){
    exist.qty++;
  }else{
    cart.push({
      name,
      price,
      qty:1
    });
  }
  updateCart();
  showToast();
};
function updateCart(){
  let total = 0;
  const box =
  document.getElementById("cartItems");
  box.innerHTML = "";
  cart.forEach((i,index)=>{
    total += i.price * i.qty;
    box.innerHTML += `
<div class="cart-item">
  <div class="cart-top">
    <b>${i.name}</b>
    <button class="remove-btn" onclick="removeItem(${index})"> حذف </button>
  </div>
  <div class="cart-price">
    ${i.price} IQD
  </div>
  <div class="qty-box">
    <span>الكمية:</span>
    <input type="number"
    min="1"
    value="${i.qty}"
    onchange="changeQty(${index},this.value)">
  </div>
</div>
`;
  });
document.getElementById("count").innerText =
cart.reduce((a,b)=>a+b.qty,0);
const delivery = 5000;
let finalTotal =
total + delivery;
if(appliedDiscount){
  const discountValue =
  Math.round(
    finalTotal *
    appliedDiscount / 100
  );
  finalTotal -= discountValue;
  document.getElementById(
  "discountResult"
  ).innerHTML =
  `الخصم:
  ${discountValue}
  IQD (${appliedDiscount}%)`;
}else{
  document.getElementById(
  "discountResult"
  ).innerHTML = "";
}
document.getElementById("total")
.innerText = finalTotal;
localStorage.setItem(
  "cart",
  JSON.stringify(cart)
);
}
window.changeQty = function(i,val){
  cart[i].qty = parseInt(val);
  updateCart();
};
window.removeItem = function(i){
  cart.splice(i,1);
  updateCart();
};
window.toggleCart = function(){
  document.getElementById("cart")
  .classList.toggle("open");
};
document.addEventListener("click",function(e){
  const cart =
  document.getElementById("cart");
  const btn =
  document.querySelector(".cart-btn");
  if(
  cart.classList.contains("open") &&
  !cart.contains(e.target) &&
  !btn.contains(e.target) &&
  !e.target.classList.contains("remove-btn")
){
  cart.classList.remove("open");
}
});
window.sendOrder = async function(){
  if(
    !cname.value.trim() ||
    !cphone.value.trim() ||
    !caddress.value.trim()
  ){
     alert("يرجى ملء الاسم والهاتف والعنوان"); return;
  }
  if(cart.length === 0){
    alert("السلة فارغة");
    return;
  }
  let msg = "🛒 طلب جديد\n\n";
  msg += `الاسم: ${cname.value}\n`;
  msg += `الهاتف: ${cphone.value}\n`;
  msg += `العنوان: ${caddress.value}\n\n`;
  let total = 0;
  cart.forEach(i=>{
    let t = i.price * i.qty;
    msg += `${i.name} x${i.qty} = ${t} IQD\n`;
    total += t;
  });
const delivery = 5000;
let finalTotal = total + delivery;
let discountValue = 0;
if(appliedDiscount){
  discountValue = Math.round(
    finalTotal *
    appliedDiscount / 100
  );
  finalTotal -= discountValue;
  msg += `\nالخصم: ${discountValue} IQD`;
}
msg += `\nالتوصيل: ${delivery} IQD`;
msg += `\nالمجموع النهائي: ${finalTotal} IQD`;
addDoc(collection(db,"orders"),{
  name: cname.value,
  phone: cphone.value,
  address: caddress.value,
  items: cart,
  total: total,
  delivery: delivery,
  discount: appliedDiscount,
  discountValue: discountValue,
  finalTotal: finalTotal,
  discountCode:
  appliedCode?.code || "",
  createdAt: Date.now()
});
 if(appliedCode){
  const discountRef =
  doc(db,"discountCodes",appliedCode.code);
  if(appliedCode.type === "single"){
    await updateDoc(discountRef,{
      used:true
    });
  }
  if(appliedCode.type === "limited"){
    await updateDoc(discountRef,{
      currentUses: increment(1)
    });
  }
}
appliedDiscount = 0;
appliedCode = null;
document.getElementById("discountCode").value = "";
cart = [];
localStorage.removeItem("cart");
updateCart();
  window.open(
    "https://wa.me/9647876700165?text=" +
    encodeURIComponent(msg)
  );
};
window.toggleMenu = function(){
  const menu =
  document.getElementById("dropdownMenu");
  if(
    menu.style.display === "block"
  ){
    menu.style.display = "none";
  }else{
    menu.style.display = "block";
  }
};
document.addEventListener("click",function(e){
  const menu =
  document.getElementById("dropdownMenu");
  const btn =
  document.querySelector(".menu-btn");
  if(
    menu &&
    !menu.contains(e.target) &&
    !btn.contains(e.target)
  ){
    menu.style.display = "none";
  }
});
window.openAdminLogin = function(){
  document.getElementById("overlay") .style.display = "flex";
  document.getElementById("loginBox") .style.display = "block";
  document.getElementById("addPanel") .style.display = "none";
  document.getElementById("deletePanel") .style.display = "none";
  document.getElementById("editPanel") .style.display = "none";
};
window.openAddLogin = function(){
  if(isAdmin){
    document.getElementById("overlay").style.display = "flex";
    document.getElementById("loginBox").style.display = "none";
    document.getElementById("addPanel").style.display = "block";
    document.getElementById("deletePanel").style.display = "none";
    document.getElementById("editPanel").style.display = "none";
    return;
  }
  window.mode = "add";
  document.getElementById("overlay").style.display = "flex";
  document.getElementById("loginBox").style.display = "block";
  document.getElementById("addPanel").style.display = "none";
  document.getElementById("deletePanel").style.display = "none";
  document.getElementById("editPanel").style.display = "none";
};
window.openDeleteLogin = function(){
  if(isAdmin){
    document.getElementById("overlay").style.display = "flex";
    document.getElementById("loginBox").style.display = "none";
    document.getElementById("deletePanel").style.display = "block";
    document.getElementById("addPanel").style.display = "none";
    document.getElementById("editPanel").style.display = "none";
    return;
  }
  window.mode = "delete";
  document.getElementById("overlay").style.display = "flex";
  document.getElementById("loginBox").style.display = "block";
  document.getElementById("addPanel").style.display = "none";
  document.getElementById("deletePanel").style.display = "none";
  document.getElementById("editPanel").style.display = "none";
};
window.openEditLogin = function(){
  if(isAdmin){
    document.getElementById("overlay").style.display = "flex";
    document.getElementById("loginBox").style.display = "none";
    document.getElementById("editPanel").style.display = "block";
    document.getElementById("addPanel").style.display = "none";
    document.getElementById("deletePanel").style.display = "none";
    return;
  }
  window.mode = "edit";
  document.getElementById("overlay").style.display = "flex";
  document.getElementById("loginBox").style.display = "block";
  document.getElementById("addPanel").style.display = "none";
  document.getElementById("deletePanel").style.display = "none";
  document.getElementById("editPanel").style.display = "none";
};
function updateAdminUI(){

  if(isAdmin){
    document.getElementById("loginMenuBtn") .style.display = "none";
    document.getElementById("logoutMenuBtn") .style.display = "block";
    document.getElementById("ordersMenuBtn") .style.display = "block";
    document.getElementById("discountsMenuBtn") .style.display = "block";
    document.getElementById("addProductMenuBtn").style.display = "block";
  }else{
    document.getElementById("loginMenuBtn")  .style.display = "block";
    document.getElementById("logoutMenuBtn") .style.display = "none";
    document.getElementById("ordersMenuBtn") .style.display = "none";
    document.getElementById("discountsMenuBtn") .style.display = "none";
    document.getElementById("addProductMenuBtn").style.display = "none";
  }
}
window.loginAdmin = async function(){

  let email =
  document.getElementById("adminEmail").value;
  let pass =
  document.getElementById("adminPass").value;
  try{
    await signInWithEmailAndPassword(
      auth,
      email,
      pass
    );
    isAdmin = true;
    localStorage.setItem(
      "isAdmin",
      "true"
    );
    loadProducts();
    updateAdminUI();
    document.getElementById("overlay") .style.display = "none";
    document.getElementById("loginBox") .style.display = "none";
    if(window.mode === "add"){
      document.getElementById("addPanel")
      .style.display = "block";
    }else if(window.mode === "delete"){
      document.getElementById("deletePanel") .style.display = "block";
    }else if(window.mode === "edit"){
      document.getElementById("editPanel")  .style.display = "block";
    }else if(window.mode === "orders"){
     document.getElementById("ordersPanel")  .style.display = "block";
     loadOrders();
    }
  }catch(err){
    document.getElementById("loginMsg")
    .innerText =
    "بيانات الدخول غير صحيحة";
  }
};
window.closePanels = function(){
  document.getElementById("overlay") .style.display = "none";
  document.getElementById("loginBox") .style.display = "none";
  document.getElementById("addPanel") .style.display = "none";
  document.getElementById("deletePanel") .style.display = "none";
  document.getElementById("editPanel") .style.display = "none";
};
window.logoutAdmin = function(){
  isAdmin = false;
localStorage.removeItem("isAdmin");
 loadProducts();
 updateAdminUI();
  window.mode = "";
  document.getElementById("overlay") .style.display = "none";
  document.getElementById("loginBox") .style.display = "block";
  document.getElementById("addPanel") .style.display = "none";
  document.getElementById("deletePanel") .style.display = "none";
  document.getElementById("editPanel")  .style.display = "none";
};
window.addProduct = async function(){
  let name =
  document.getElementById("name").value.trim();
  let price =
  document.getElementById("price").value;
  let file =
  document.getElementById("imageFile")
  .files[0];
  let image = "";
  if(file){
  image = await uploadImage(file);
 }
  let desc =
  document.getElementById("desc").value;
  let cat = Array.from(
document.querySelectorAll(
'#cat input[type="checkbox"]:checked'
)
).map(cb => cb.value);
  if(!name || !price){
    alert("املأ البيانات");
    return;
  }
  await addDoc(collection(db,"products"),{
    name,
    price:Number(price),
    image,
    desc,
    cat,
    available:true,
    createdAt: Date.now()
  });
  document.getElementById("msg") .innerText = "تمت الإضافة ✅";
  document.getElementById("name").value = "";
  document.getElementById("price").value = "";
  document.getElementById("imageFile").value = "";
  document.getElementById("desc").value = "";
  document.querySelectorAll('#cat input[type="checkbox"]'
)
.forEach(cb => cb.checked = false);
setTimeout(()=>{
  document.getElementById("msg")
  .innerText = "";
},2000);
  loadProducts();
};
window.deleteProduct = async function(){
  let name =
  document.getElementById("deleteName")
  .value
  .trim()
  .toLowerCase();
  if(!name){
    alert("اكتب اسم المنتج");
    return;
  }
  const snap =
  await getDocs(collection(db,"products"));
  let found = false;
  for (const item of snap.docs){
    const data = item.data();
    const productName =
    data.name
    ?.trim()
    .toLowerCase();
    if(productName === name){
      await deleteDoc(
        doc(db,"products",item.id)
      );
      found = true;
    }
  }
  if(found){
    document.getElementById("deleteMsg") .innerText = "تم حذف المنتج ✅";
    document.getElementById("deleteName") .value = "";
    loadProducts();
  }else{
    document.getElementById("deleteMsg") .innerText = "المنتج غير موجود";
  }
  setTimeout(()=>{
    document.getElementById("deleteMsg") .innerText = "";
  },2000);
};
window.quickDelete = async function(name){
  if(!confirm("حذف المنتج؟")){
    return;
  }
  const snap =
  await getDocs(collection(db,"products"));
  for(const item of snap.docs){
    const data = item.data();
    if(data.name === name){
      await deleteDoc(
        doc(db,"products",item.id)
      );
    }
  }
  loadProducts();
};
window.quickEdit = async function(name){
  const product =
  allProducts.find(
    p => p.name === name
  );
  if(!product) return;
  window.editingId = product.id;
  document.getElementById("overlay") .style.display = "flex";
  document.getElementById("loginBox") .style.display = "none";
  document.getElementById("editPanel") .style.display = "block";
  document.getElementById("newName") .value = product.name || "";
  document.getElementById("editPrice") .value = product.price || "";
  document.getElementById("editDesc") .value = product.desc || "";
  document.querySelectorAll(
    '#editCat input[type="checkbox"]'
  ).forEach(cb => {
    cb.checked =
    (product.cat || [])
    .includes(cb.value);
  });
  document.getElementById(
    "editAvailable"
  ).value =
  product.available === false
  ? "false"
  : "true";
};
window.editProduct = async function(){
  if(!window.editingId){
    alert("ابحث عن المنتج أولاً");
    return;
  }
  let newName =
  document.getElementById("newName")
  .value
  .trim();
  let price =
  document.getElementById("editPrice")
  .value;
const oldProduct =
allProducts.find(
  p => p.id === window.editingId
);
let image =
oldProduct?.image || "";
let editFile =
document.getElementById("editImageFile").files[0];
if(editFile){
  image = await uploadImage(editFile);
}
  let desc =
  document.getElementById("editDesc")
  .value;
  let cat = Array.from(
document.querySelectorAll(
'#editCat input[type="checkbox"]:checked'
)
).map(cb => cb.value);
  let available =
   document.getElementById(
   "editAvailable"
   ).value === "true";
  await updateDoc(
    doc(db,"products",window.editingId),
    {
      name:newName,
      price:Number(price),
      image,
      desc,
      cat,
      available
    }
  );
  document.getElementById("editMsg") .innerText = "تم حفظ التعديل ✅";
  document.getElementById("editImageFile").value = "";
  await loadProducts();
  setTimeout(()=>{
    document.getElementById("editMsg")
    .innerText = "";
  },2000);
};
document.getElementById("productPopup")
.addEventListener("click",function(e){
  if(e.target.id === "productPopup"){
    closePopup();
  }
});
window.copyProductLink = function(id){
  const link =
`${window.location.origin}${window.location.pathname}?product=${id}`;
  navigator.clipboard.writeText(link);
  const toast =
  document.getElementById("toast");
  toast.innerText =
  "🔗 تم نسخ رابط المنتج";
  toast.classList.add("show");
  setTimeout(()=>{
    toast.classList.remove("show");
    toast.innerText =
    "✅ تمت إضافة المنتج للسلة";
  },1800);
}
window.addEventListener("scroll",()=>{
  const categories =
  document.querySelector(".categories");
  if(window.scrollY > 180){
    categories.classList.add(
      "sticky-active"
    );
  }else{
    categories.classList.remove(
      "sticky-active"
    );
  }
});
window.openWhatsappPopup = function(){
  document.getElementById(
    "whatsappPopup"
  ).style.display = "flex";
};
window.closeWhatsappPopup = function(){
  document.getElementById(
    "whatsappPopup"
  ).style.display = "none";
};
window.openOriginalPopup = function(){
  document.getElementById(
    "originalPopup"
  ).style.display = "flex";
};
window.closeOriginalPopup = function(){
  document.getElementById(
    "originalPopup"
  ).style.display = "none";
};
window.openDeliveryPopup = function(){
  document.getElementById(
    "deliveryPopup"
  ).style.display = "flex";
};
window.closeDeliveryPopup = function(){
  document.getElementById("deliveryPopup").style.display = "none";
};
window.sortProducts = function(){
  let value =
  document.getElementById("sortSelect").value;
  let sorted = [...currentProducts];
  if(value === "name"){
    sorted.sort((a,b)=>
      a.name.localeCompare(b.name)
    );
  }
  else if(value === "lowPrice"){
    sorted.sort((a,b)=>
      Number(a.price) -
      Number(b.price)
    );
  }
  else if(value === "highPrice"){
    sorted.sort((a,b)=>
      Number(b.price) -
      Number(a.price)
    );
  }
  else{
    sorted.sort((a,b)=>
      (b.createdAt || 0) -
      (a.createdAt || 0)
    );
  }
  renderProducts(sorted);
};
updateAdminUI();
if("serviceWorker" in navigator){
  navigator.serviceWorker.register(
    "./service-worker.js"
  );
}
async function loadProducts(){
  const box =
  document.getElementById("products");
  box.innerHTML = `
  <div class="skeleton-card">
    <div class="skeleton-img"></div>
    <div class="skeleton-content">
      <div class="skeleton-line"></div>
      <div class="skeleton-line short"></div>
      <div class="skeleton-line"></div>
    </div>
  </div>
  `;
  const snap =
  await getDocs(collection(db,"products"));
  allProducts = [];
  snap.forEach(doc=>{
    allProducts.push({
      id:doc.id,
      ...doc.data()
    });
  });
  
  const latestProducts =
  [...allProducts]
  .sort((a,b)=>
    (b.createdAt || 0) -
    (a.createdAt || 0)
  )
  .slice(0,10);
renderProducts(latestProducts);

  const params =
  new URLSearchParams(location.search);
  const productId =
  params.get("product");
  if(productId){
    const product =
    allProducts.find(
      p => p.id === productId
    );
    if(product){
      setTimeout(()=>{
        openPopup(product);
      },300);
    }
  }
}
window.scrollToTop = function(){
  window.scrollTo({
    top:0,
    behavior:"smooth"
  });
};
window.addEventListener("scroll",()=>{
  const btn =
  document.getElementById("scrollTopBtn");
  const popup =
  document.getElementById("productPopup");
  if(
    window.scrollY > 300 &&
    popup.style.display !== "flex"
  ){
    btn.classList.add("show");
  }else{
    btn.classList.remove("show");
  }
});
window.addEventListener("load",()=>{
  const params =
  new URLSearchParams(window.location.search);
  const productId =
  params.get("product");
  if(productId){
    const checkProduct = setInterval(()=>{
      const product =
      allProducts.find(
        p => p.id === productId
      );
      if(product){
        openPopup(product);
        clearInterval(checkProduct);
      }
    },300);
  }
});
cphone.addEventListener("input", ()=>{
  cphone.value = cphone.value.replace(/\D/g,'');
});
window.closeCart = function(){
  document.getElementById("cart")
  .classList.remove("open");
};
window.openOrdersPage = function(){
   if(isAdmin){
    const panel =
    document.getElementById("ordersPanel");
    panel.style.display = "flex";
    loadOrders();
    return;
  }
  window.mode = "orders";
  document.getElementById("overlay") .style.display = "flex";
  document.getElementById("loginBox") .style.display = "block";
};
async function loadOrders(){
  const box =
  document.getElementById("ordersList");
  box.innerHTML = "جاري التحميل...";
  const snap =
  await getDocs(collection(db,"orders"));
  let totalProfit = 0;
  let html = "";
  snap.forEach(docItem => {
    const data = docItem.data();
    totalProfit += Number(
  data.finalTotal || data.total || 0
);
    html += `
<div style="
border:1px solid #ddd;
padding:10px;
margin:10px 0;
border-radius:10px;
text-align:right;
">
  <b>الاسم:</b>
  ${data.name}<br>
  <b>الهاتف:</b>
  ${data.phone}<br>
  <b>العنوان:</b>
  ${data.address}<br>
  <b>المجموع:</b>
  ${data.total} IQD<br>
  <b>الخصم:</b>
  ${data.discount || 0}%<br>
  <b>قيمة الخصم:</b>
  ${data.discountValue || 0} IQD<br>
  <b>المجموع النهائي:</b>
  ${data.finalTotal || data.total} IQD<br>
  <b>عدد المنتجات:</b>
  ${data.items?.length || 0}
</div>
`;
  });
  document.getElementById("ordersTotal").innerText =
  "مجموع الأرباح: " +
   totalProfit.toLocaleString() +
  " IQD";
  const siteProfit = totalProfit * 0.05;
  document.getElementById("siteProfit").innerText =
  "أرباح الموقع 5%: " +
  siteProfit.toLocaleString() +
  " IQD";
  box.innerHTML =
  html || "لا توجد طلبات";
}
window.toggleDarkMode = function(){
  document.body.classList.toggle(
    "dark-mode"
  );
  localStorage.setItem(
    "darkMode",
    document.body.classList.contains(
      "dark-mode"
    )
  );
};
window.openDiscountsPanel = function(){
  document.getElementById(
  "discountsPanel"
  ).style.display = "flex";
  loadDiscountCodes();
}
window.closeDiscountsPanel = function(){
  document.getElementById(
    "discountsPanel"
  ).style.display = "none";
}
window.addDiscountCode = function(){
  const code =
  document.getElementById(
  "discountCodeInput"
  ).value;
  const discount =
  document.getElementById(
  "discountPercentInput"
  ).value;
  const type =
  document.getElementById(
  "discountType"
  ).value;
  console.log({
    code,
    discount,
    type
  });
  alert("تمت إضافة الكود مؤقتاً");
}
window.toggleUsageLimit = function(){
  const type =
  document.getElementById(
  "discountType"
  ).value;
  document.getElementById(
  "usageLimitBox"
  ).style.display =
  type === "limited"
  ? "block"
  : "none";
}
window.addDiscountCode = async function(){
  const code =
  document.getElementById(
  "discountCodeInput"
  ).value.trim();
  const discount =
  Number(
    document.getElementById(
    "discountPercentInput"
    ).value
  );
  const type =
  document.getElementById(
  "discountType"
  ).value;
  const usageLimit =
  Number(
    document.getElementById(
    "usageLimit"
    )?.value || 0
  );
  if(!code || !discount){
    alert("املأ جميع الحقول");
    return;
  }
  await setDoc(
    doc(db,"discountCodes",code),
    {
      code,
      discount,
      type,
      active:true,
      used:false,
      maxUses:usageLimit,
      currentUses:0
    }
  );
  alert("تم إضافة الكود");
  loadDiscountCodes();
}
window.loadDiscountCodes = async function(){
  const list =
  document.getElementById(
  "discountsList"
  );
  const snap =
  await getDocs(
    collection(db,"discountCodes")
  );
  if(snap.empty){
    list.innerHTML =
    "لا توجد أكواد حالياً";
    return;
  }
  list.innerHTML = "";
  snap.forEach(docSnap=>{
    const data =
    docSnap.data();
    list.innerHTML += `
<div style="
background:#fff5fa;
border:1px solid #ffd1e4;
border-radius:14px;
padding:12px;
margin-bottom:10px;
">
  <b>${data.code}</b>
  <br>
  الخصم:
  ${data.discount}%
  <br>
  النوع:
  ${
    data.type === "single"
    ? "مرة واحدة"
    : data.type === "limited"
      ? "عدد مرات محدد"
      : "دائم"
  }
  <br>
  ${
    data.type === "limited"
    ? `الاستخدام: ${data.currentUses || 0} / ${data.maxUses || 0}`
    : ""
  }
  <br>
  ${
    data.used
    ? "✅ مستخدم"
    : data.active
      ? "🟢 مفعل"
      : "🔴 معطل"
  }
  <br><br>
  <button
  onclick="toggleDiscountStatus('${data.code}',${data.active})">
  ${
    data.active
    ? "تعطيل"
    : "تفعيل"
  }
  </button>
  <button
  onclick="deleteDiscountCode('${data.code}')">
  حذف
  </button>
</div>
`;
  });
}
window.toggleDiscountStatus =
async function(code,current){
  await updateDoc(
    doc(db,"discountCodes",code),
    {
      active:!current
    }
  );
  loadDiscountCodes();
}
window.deleteDiscountCode =
async function(code){
  if(
    !confirm(
      "حذف الكود ؟"
    )
  ) return;
  await deleteDoc(
    doc(
      db,
      "discountCodes",
      code
    )
  );
  loadDiscountCodes();
}
window.applyDiscountCode = async function(){
  const code =
  document.getElementById(
  "discountCode"
  ).value.trim();
  if(!code){
    alert("أدخل كود الخصم");
    return;
  }
  const snap =
  await getDocs(
    collection(db,"discountCodes")
  );
  let found = null;
  snap.forEach(docSnap=>{
    const data =
    docSnap.data();
    if(
      data.code.toLowerCase() ===
      code.toLowerCase()
    ){
      found = data;
    }
  });
  if(!found){
    alert("كود الخصم غير موجود");
    return;
  }
  if(!found.active){
    alert("كود الخصم معطل");
    return;
  }
  if(
  found.type === "single" &&
  found.used
){
  alert(
    "تم استخدام هذا الكود سابقاً"
  );
  return;
}
if(
  found.type === "limited" &&
  found.currentUses >= found.maxUses
){
  alert(
    "انتهت صلاحية الكود"
  );
  return;
}
  appliedDiscount =
  found.discount;
  appliedCode =
  found;
  updateCart();
}