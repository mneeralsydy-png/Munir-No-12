let number = "";
let logs = [];
let balance = 1.0;

const display = document.getElementById("numberDisplay");
const logsList = document.getElementById("logsList");
const balanceEl = document.getElementById("balance");

function press(n){
  number += n;
  display.innerText = number;
}

function nav(id){
  document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

async function call(){
  if(balance <= 0){
    alert("الرصيد غير كاف");
    return;
  }

  const res = await fetch("/api/call",{
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      "Authorization": "Bearer " + localStorage.token
    },
    body:JSON.stringify({ to:number })
  });

  const data = await res.json();

  if(data.ok){
    logs.unshift({ number, time: new Date().toLocaleTimeString() });
    renderLogs();
    balance -= 0.5;
    balanceEl.innerText = "$"+balance.toFixed(2);
    localStorage.balance = balance;
    number="";
    display.innerText="";
  }else{
    alert(data.error);
  }
}

function renderLogs(){
  logsList.innerHTML = logs.map(l=>`<li><span>${l.number}</span> <small>${l.time}</small></li>`).join("");
}

// Initialize balance from localStorage
window.onload = () => {
  if (localStorage.balance) {
    balance = parseFloat(localStorage.balance);
    balanceEl.innerText = "$" + balance.toFixed(2);
  }
  if (!localStorage.token && location.pathname.includes("app.html")) {
    location.href = "index.html";
  }
}

function logout(){
  localStorage.clear();
  location.href="index.html";
}