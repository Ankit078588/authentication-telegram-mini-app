const express = require('express');
require('dotenv').config();
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const db = require('./config/db_connection');
const User = require('./models/users');
const crypto = require('crypto');
const PORT = process.env.PORT || 3000;

const app = express();
app.set('view engine', 'ejs');
app.use(express.static('./public'));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));




app.get('/', (req, res) => {
    res.render('index', { user: req.user || {} }); 
});



// Authentication
app.post('/authenticate', async (req, res) => {
    const { telegramUserId, name, hash, authDate } = req.body;
    console.log('1: ' + telegramUserId);
    console.log('2: ' + name);
    console.log('3: ' + hash);
    console.log('4: ' + authDate);
    

    if (!telegramUserId || !name || !hash || !authDate) {
        return res.status(400).json({ error: 'Authentication data missing' });
    }

    try{
        const BOT_TOKEN = '7266000337:AAFxRzIlq8Q4I-3I2lAG-_PoffQehH-o0EM';
        const secret = crypto.createHash('sha256').update(BOT_TOKEN).digest().toString('hex');
        // const dataCheckString = `auth_date=${authDate}\nid=${telegramUserId}`;
        const dataCheckString = `auth_date=${authDate}\nid=${telegramUserId}\nname=${name}`;
        const computedHash = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');
        console.log('5: ' + BOT_TOKEN);
        console.log('6: ' + secret);
        console.log('7: ' + dataCheckString);
        console.log('8: ' + computedHash);   

        if (computedHash !== hash) {
            console.log('hash not matched');
            return res.status(403).json({ error: 'Authentication failed' });
        }

        let user = await User.findOne({ telegramId: telegramUserId });
        if (!user) {
            user = new User({ telegramId: telegramUserId, name });
            await User.save();
        }

        res.json({ status: 'authenticated', user });
    } catch (error) {
        console.error('Error during authentication:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Create referral link
app.post('/generate-referral', async (req, res) => {
    const { telegramId, name } = req.body;

    if (!telegramId || !name) {
        return res.status(400).json({ error: 'Telegram ID and name are required' });
    }

    try {
        let user = await User.findOne({ telegramId });
        if (!user) {
            user = new User({ telegramId, name });
            await User.save();
        }

        const referralId = `r_${telegramId}`;
        const referralLink = `https://t.me/BOT_USERNAME?startapp=${referralId}`;
        user.referralId = referralId;
        user.referralLink = referralLink;
        await User.save();

        res.json({ referralLink });
    } catch (error) {
        console.error('Error creating referral link:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
