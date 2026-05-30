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
  doc
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



  updateDoc(visitorsRef, {
    count: increment(1)
  });

 

onSnapshot(visitorsRef, (docSnap) => {

  if(docSnap.exists()){

    document.getElementById("visitorsCount").textContent =
      docSnap.data().count || 0;

  }

});

let cart = JSON.parse(
  localStorage.getItem("cart")
) || [];
let allProducts = [];
let isAdmin =
localStorage.getItem("isAdmin") === "true";



function renderProducts(list){

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
: 'https://via.placeholder.com/300x300?text=No+Image'}"

referrerpolicy="no-referrer"

onerror="
this.onerror=null;
this.src='https://via.placeholder.com/300x300/ffffff/ff4fa3?text=Image';
"

style="
background:white;
display:block;
">

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

<button
onclick="event.stopPropagation(); addToCart('${p.name}',${p.price})">

أضف للسلة

</button>

${isAdmin ? `

<button
class="copy-link-btn"
onclick="event.stopPropagation();
copyProductLink('${p.id}')">

🔗 نسخ رابط المنتج

</button>

` : ""}

` : `

<button disabled
style="
background:#ccc;
cursor:not-allowed;
">

غير متوفر

</button>

`}

${isAdmin ? `

<div class="admin-actions">

<button
onclick="event.stopPropagation();
quickEdit('${p.name}')">

✏️ تعديل

</button>

<button
onclick="event.stopPropagation();
quickDelete('${p.name}')">

🗑️ حذف

</button>

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

  document.getElementById("productPopup")
  .style.display = "flex";

  document.getElementById("scrollTopBtn")
  .classList.remove("show");

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

  if(cat === "الكل"){

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

  const product =
allProducts.find(p=>p.name===name);

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

    <button class="remove-btn"
    onclick="removeItem(${index})">

    حذف

    </button>

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

document.getElementById("total").innerText =
total + delivery;
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


window.sendOrder = function(){

  // التحقق من الحقول
  if(
    !cname.value.trim() ||
    !cphone.value.trim() ||
    !caddress.value.trim()
  ){
     alert("يرجى ملء الاسم والهاتف والعنوان"); return;
  }

  // التحقق من السلة
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

  msg += `\nالتوصيل: ${delivery} IQD`;
  msg += `\nالمجموع النهائي: ${total + delivery} IQD`;

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

  document.getElementById("overlay")
  .style.display = "flex";

  document.getElementById("loginBox")
  .style.display = "block";

  document.getElementById("addPanel")
  .style.display = "none";

  document.getElementById("deletePanel")
  .style.display = "none";

  document.getElementById("editPanel")
  .style.display = "none";
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

    document.getElementById("loginMenuBtn")
    .style.display = "none";

    document.getElementById("logoutMenuBtn")
    .style.display = "block";

  }else{

    document.getElementById("loginMenuBtn")
    .style.display = "block";

    document.getElementById("logoutMenuBtn")
    .style.display = "none";
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

    document.getElementById("overlay")
    .style.display = "none";

    document.getElementById("loginBox")
    .style.display = "none";

    if(window.mode === "add"){

      document.getElementById("addPanel")
      .style.display = "block";

    }else if(window.mode === "delete"){

      document.getElementById("deletePanel")
      .style.display = "block";

    }else if(window.mode === "edit"){

      document.getElementById("editPanel")
      .style.display = "block";

    }

  }catch(err){

    document.getElementById("loginMsg")
    .innerText =
    "بيانات الدخول غير صحيحة";
  }
};

window.closePanels = function(){

  document.getElementById("overlay")
  .style.display = "none";

  document.getElementById("loginBox")
  .style.display = "none";

  document.getElementById("addPanel")
  .style.display = "none";

  document.getElementById("deletePanel")
  .style.display = "none";

  document.getElementById("editPanel")
  .style.display = "none";
};

window.logoutAdmin = function(){

  isAdmin = false;

localStorage.removeItem("isAdmin");
 loadProducts();
 updateAdminUI();

  window.mode = "";

  document.getElementById("overlay")
  .style.display = "none";

  document.getElementById("loginBox")
  .style.display = "block";

  document.getElementById("addPanel")
  .style.display = "none";

  document.getElementById("deletePanel")
  .style.display = "none";

  document.getElementById("editPanel")
.style.display = "none";

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

  document.getElementById("msg")
  .innerText = "تمت الإضافة ✅";

  document.getElementById("name").value = "";

document.getElementById("price").value = "";

document.getElementById("imageFile").value = "";

document.getElementById("desc").value = "";

document
.querySelectorAll(
'#cat input[type="checkbox"]'
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

    document.getElementById("deleteMsg")
    .innerText = "تم حذف المنتج ✅";

    document.getElementById("deleteName")
    .value = "";

    loadProducts();

  }else{

    document.getElementById("deleteMsg")
    .innerText = "المنتج غير موجود";
  }

  setTimeout(()=>{

    document.getElementById("deleteMsg")
    .innerText = "";

  },2000);

};

window.loadProductData = async function(){


  let oldName =
  document.getElementById("oldName")
  .value
  .trim()
  .toLowerCase();

  if(!oldName){

    alert("اكتب اسم المنتج");

    return;
  }

  const snap =
  await getDocs(collection(db,"products"));

  let found = false;

  for(const item of snap.docs){

    const data = item.data();

    if(
      data.name
      ?.trim()
      .toLowerCase()

      === oldName
    ){

      document.getElementById("newName")
      .value = data.name || "";

      document.getElementById("editPrice")
      .value = data.price || "";

      document.getElementById("editImage")
      .value = data.image || "";

      document.getElementById("editDesc")
      .value = data.desc || "";

      document
.querySelectorAll(
'#editCat input[type="checkbox"]'
)
.forEach(cb => {

  cb.checked =
  (data.cat || []).includes(cb.value);

});

      document.getElementById("editAvailable")
      .value =

      data.available === false

      ? "false"

      : "true";

      window.editingId = item.id;

      found = true;

      break;
    }
  }

  if(!found){

    alert("المنتج غير موجود");
  }
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

  openEditLogin();

  document.getElementById("oldName")
  .value = name;

  setTimeout(()=>{

    loadProductData();

  },300);
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

  let image =
document.getElementById("editImage").value;

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

  document.getElementById("editMsg")
  .innerText = "تم حفظ التعديل ✅";
  document.getElementById("editImageFile").value = "";

  loadProducts();

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

  document.getElementById(
    "deliveryPopup"
  ).style.display = "none";
};

window.sortProducts = function(){

  let value =
  document.getElementById(
    "sortSelect"
  ).value;

  let sorted = [...allProducts];

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

  renderProducts(allProducts);

  // فتح المنتج من الرابط بعد اكتمال التحميل
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


// منع الكلك اليمين
document.addEventListener("contextmenu", function(e){
  e.preventDefault();
});

// منع أدوات المطور
document.addEventListener("keydown", function(e){

  if(
    e.key === "F12" ||
    (e.ctrlKey && e.shiftKey && e.key === "I") ||
    (e.ctrlKey && e.key === "u")
  ){
    e.preventDefault();
  }

});