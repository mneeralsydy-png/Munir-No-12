let number = "";
const token = localStorage.token;
if(!token) location.href = 'index.html';

const display = document.getElementById("numberDisplay");
const balanceEl = document.getElementById("balance");
const walletBalanceEl = document.getElementById("wallet-balance");

function press(n){
    number += n;
    display.innerText = number;
}

function del(){
    number = number.slice(0, -1);
    display.innerText = number;
}

function nav(id){
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.getElementById(id).classList.add("active");
    document.querySelectorAll(".bottom-nav button").forEach(b => b.classList.remove("active"));
    event.currentTarget.classList.add("active");
}

async function makeCall(){
    if(!number) return alert("يرجى إدخال الرقم");
    const res = await fetch("/api/call", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ to: number })
    });
    const data = await res.json();
    if(data.ok) {
        alert("جاري الاتصال...");
        updateUserData();
        number = "";
        display.innerText = "";
    } else {
        alert(data.error);
    }
}

async function updateUserData() {
    const res = await fetch("/api/user", {
        headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();
    if(data.ok) {
        const bal = `$${data.user.balance.toFixed(2)}`;
        balanceEl.innerText = bal;
        if(walletBalanceEl) walletBalanceEl.innerText = bal;
        localStorage.balance = data.user.balance;
    }
}

function logout() {
    localStorage.clear();
    location.href = 'index.html';
}

updateUserData();
