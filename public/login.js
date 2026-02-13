const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const msg = document.getElementById('msg');

function saveToken(token){
    localStorage.setItem('token', token);
}

// تسجيل الدخول
loginBtn.addEventListener('click', () => {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    if(!email || !password){
        msg.innerText = "الرجاء إدخال البريد وكلمة المرور";
        return;
    }

    fetch('/api/login', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({email,password})
    })
    .then(res => res.json())
    .then(data => {
        if(data.success){
            saveToken(data.token);
            window.location = 'app.html'; // دخول مباشر بعد تسجيل الدخول
        } else {
            msg.innerText = data.error;
        }
    })
    .catch(e => msg.innerText = "خطأ في الاتصال بالسيرفر");
});

// تسجيل مستخدم جديد
registerBtn.addEventListener('click', () => {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    if(!email || !password){
        msg.innerText = "الرجاء إدخال البريد وكلمة المرور";
        return;
    }

    fetch('/api/register', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({email,password})
    })
    .then(res => res.json())
    .then(data => {
        if(data.success){
            saveToken(data.token);
            window.location = 'app.html'; // دخول مباشر بعد التسجيل
        } else {
            msg.innerText = data.error;
        }
    })
    .catch(e => msg.innerText = "خطأ في الاتصال بالسيرفر");
});