require('dotenv').config();
const express = require('express');
const twilio = require('twilio');
const cors = require('cors');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// --- Firebase ---
let serviceAccount;
try {
    if (fs.existsSync('serviceAccount.json')) {
        serviceAccount = require('./serviceAccount.json');
    } else {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
    }
} catch (e) { console.error("Firebase Config Error"); }

if (!admin.apps.length && serviceAccount && serviceAccount.project_id) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL || "https://call-now-24582-default-rtdb.firebaseio.com"
    });
}
const db = admin.apps.length ? admin.database() : null;

// --- Twilio ---
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const apiKeySid = process.env.TWILIO_API_KEY;
const apiKeySecret = process.env.TWILIO_API_SECRET;
const appSid = process.env.TWILIO_APP_SID;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = (accountSid && authToken) ? twilio(accountSid, authToken) : null;

// --- Helper: Ensure Database ---
const checkDb = (req, res, next) => {
    if (!db) return res.status(500).json({ error: "Firebase not configured" });
    next();
};

// --- Route: Setup User ---
app.post('/setup-user', checkDb, async (req, res) => {
    const { uid, email } = req.body;
    if (!uid) return res.status(400).send("UID required");

    try {
        const userRef = db.ref('users/' + uid);
        const userSnap = await userRef.once('value');
        const userData = userSnap.val();

        if (!userData) {
            let uniqueAccountNumber = null;
            let attempts = 0;
            const maxAttempts = 20; 
            while (!uniqueAccountNumber && attempts < maxAttempts) {
                const randomPart = Math.floor(1000000 + Math.random() * 9000000);
                const candidateNumber = `+1822${randomPart}`;
                const numberCheck = db.ref('users').orderByChild('account_number').equalTo(candidateNumber).limitToFirst(1);
                const snapshot = await numberCheck.once('value');
                if (!snapshot.exists()) {
                    uniqueAccountNumber = candidateNumber;
                }
                attempts++;
            }

            await userRef.update({ 
                account_number: uniqueAccountNumber || `+1822${Math.floor(Math.random()*10000000)}`,
                email: email,
                balance: 1.00
            });
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Route: Token ---
app.get('/token', (req, res) => {
    if (!accountSid || !apiKeySid || !apiKeySecret || !appSid) {
        return res.status(500).send("Twilio credentials missing");
    }
    const identity = req.query.identity || 'user';
    const AccessToken = twilio.jwt.AccessToken;
    const VoiceGrant = AccessToken.VoiceGrant;
    const voiceGrant = new VoiceGrant({ outgoingApplicationSid: appSid, incomingAllow: true });
    const token = new AccessToken(accountSid, apiKeySid, apiKeySecret, { identity: identity });
    token.addGrant(voiceGrant);
    res.send(token.toJwt());
});

// --- Route: Voice TwiML ---
app.post('/voice', (req, res) => {
    const voiceResponse = new twilio.twiml.VoiceResponse();
    const to = req.body.To;
    const callerId = req.body.CallerId || twilioPhoneNumber;
    
    if (to) {
        voiceResponse.dial({ callerId, action: '/status-callback' }).number(to);
    } else {
        voiceResponse.hangup();
    }
    res.type('text/xml');
    res.send(voiceResponse.toString());
});

// --- Route: Status Callback ---
app.post('/status-callback', checkDb, (req, res) => {
    if (req.body.CallStatus === 'completed') {
        const duration = parseFloat(req.body.CallDuration || 0);
        const cost = (duration / 60) * 0.05;
        const callerUid = req.body.Caller; // Assuming identity is passed as caller
        if (callerUid) {
            db.ref('users/' + callerUid + '/balance').transaction(b => (b || 0) - cost);
            db.ref('users/' + callerUid + '/logs').push({ 
                to: req.body.To, 
                date: Date.now(), 
                cost: cost,
                duration: duration
            });
        }
    }
    res.send('');
});

// --- Route: SMS ---
app.post('/send-sms', checkDb, async (req, res) => {
    const { uid, to, body } = req.body;
    if (!client) return res.status(500).send("Twilio client not initialized");
    
    try {
        const cost = 0.05;
        await db.ref('users/' + uid + '/balance').transaction(bal => {
            if ((bal || 0) < cost) throw new Error("Insufficient balance");
            return (bal || 0) - cost;
        });

        const message = await client.messages.create({ body, from: twilioPhoneNumber, to });
        db.ref('users/' + uid + '/messages').push({ to, text: body, date: Date.now(), cost });
        res.json({ success: true, sid: message.sid });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
