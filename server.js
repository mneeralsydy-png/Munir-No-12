import express from "express";
import cors from "cors";
import sqlite3 from "sqlite3";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import twilio from "twilio";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = process.env.JWT_SECRET || "PRIVATE_DIALER_SECRET";

// قاعدة البيانات
const db = new sqlite3.Database("./database.db");
db.serialize(() => {
  db.run(`
  CREATE TABLE IF NOT EXISTS users (
   id INTEGER PRIMARY KEY,
   email TEXT UNIQUE,
   password TEXT,
   balance REAL DEFAULT 1.0
  )`);
});

// إعداد Twilio
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Added for Twilio webhooks
app.use(express.static(path.join(__dirname, "public")));

// تسجيل مستخدم جديد
app.post("/api/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.json({ ok: false, error: "Missing fields" });
    const hash = await bcrypt.hash(password, 10);
    db.run(
      "INSERT INTO users (email,password) VALUES (?,?)",
      [email, hash],
      function(err) {
        if (err) return res.json({ ok:false, error:err.message });
        res.json({ ok:true });
      }
    );
  } catch (e) {
    res.json({ ok: false, error: e.message });
  }
});

// تسجيل دخول
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  db.get("SELECT * FROM users WHERE email=?", [email], async (err, user) => {
    if (err) return res.json({ ok: false, error: err.message });
    if (!user) return res.json({ ok:false, error:"المستخدم غير موجود" });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.json({ ok:false, error:"كلمة المرور خاطئة" });
    const token = jwt.sign({ id:user.id }, SECRET);
    res.json({ ok:true, token, balance:user.balance });
  });
});

// إجراء مكالمة عبر Twilio
app.post("/api/call", (req, res) => {
  const { to } = req.body;
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    return res.json({ ok: false, error: "Twilio credentials missing" });
  }
  client.calls.create({
    to,
    from: process.env.TWILIO_PHONE_NUMBER,
    url: `https://${req.get('host')}/twiml`
  }).then(()=>res.json({ ok:true }))
    .catch(e=>res.json({ ok:false, error:e.message }));
});

// TwiML
app.post("/twiml", (req,res)=>{
  res.type("text/xml");
  const response = new twilio.twiml.VoiceResponse();
  response.dial(req.body.To || "");
  res.send(response.toString());
});

app.listen(PORT, ()=>console.log(`✅ Private Dialer Running on port ${PORT}`));