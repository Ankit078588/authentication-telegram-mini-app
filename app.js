const express = require('express');
require('dotenv').config();
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const db = require('./config/db_connection');
const User = require('./models/users');
const crypto = require('crypto');
const PORT = process.env.PORT || 3000;



const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



// Create dummy data to test using POSTMAN
app.post('/createdata', async (req, res) => {
    const { telegramUserId, name } = req.body;

    if (!telegramUserId || !name) {
        return res.status(400).json({ error: 'Telegram ID and name are required' });
    }

    try {
        // Create and save a new user
        const newUser = new User({ telegramId: telegramUserId, name });
        await newUser.save();

        // Generate the hash
        const BOT_TOKEN = 'AAGdO4ujR4R0p6Gn9cDFRrgeXYaKl-xG_dQ'; 
        const secret = crypto.createHash('sha256').update(BOT_TOKEN).digest();                              // Hash BOT token to generate SECRET
        const dataCheckString = `name=${name}\nid=${telegramUserId}`;                                       // Create data string - name + telegramUserId
        const hash = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');             // Generate HMAC hash

        res.json({ telegramUserId, name, hash });
    } catch (error) {
        console.error('Error creating data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Authentication 
app.post('/authenticate', async (req, res) => {
    const { telegramUserId, name, hash } = req.body;

    if (!telegramUserId || !name || !hash) {
        return res.status(400).json({ error: 'Authentication failed' });
    }


    try {
        const BOT_TOKEN = 'AAGdO4ujR4R0p6Gn9cDFRrgeXYaKl-xG_dQ';
        const secret = crypto.createHash('sha256').update(BOT_TOKEN).digest();                                  // Hash BOT token to generate SECRET 
        const dataCheckString = `name=${name}\nid=${telegramUserId}`;                                           // Create data string - name + telegramUserId
        const computedHash = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');         // Generate HMAC hash
        
        if (computedHash !== hash) {
            return res.status(403).json({ error: 'Authentication failed' });
        }


        try {
            let user = await User.findOne({ telegramId: telegramUserId });
            if (!user) {
                // Store First-time-user in DB
                user = new User({ telegramId: telegramUserId, name });
                await user.save();     
            }

            res.json({ status: 'authenticated', user });
        } catch (error) {
            console.error('Error authenticating user:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    } catch (error) {
        console.error('Error generating hash:', error);
        res.status(500).json({ error: 'Internal server error' });
    }

});




// create referral link
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

        // Generate referral link
        const referralId = `r_${telegramId}`;
        const referralLink = `https://t.me/BOT_USERNAME?startapp=${referralId}`;
        // Update user's referral link
        user.referralId = referralId;
        user.referralLink = referralLink;
        await userModel.save();

        res.json({ referralLink });
    } catch (error) {
        console.error('Error creating referral link:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
