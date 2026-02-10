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
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({ to:number })
  });

  const data = await res.json();

  if(data.ok){
    logs.unshift(number);
    renderLogs();
    balance -= 0.5;
    balanceEl.innerText = "$"+balance.toFixed(2);
    number="";
    display.innerText="";
  }else{
    alert(data.error);
  }
}

function renderLogs(){
  logsList.innerHTML = logs.map(n=>`<li>${n}</li>`).join("");
}

function logout(){
  localStorage.clear();
  location.href="index.html";
}