import mongoose from 'mongoose';
import fetch from 'node-fetch';

// MongoDB connection
mongoose.connect('mongodb+srv://kunnuv3:rpBiLsTBk6fiYOH7@cluster0.a0fu5.mongodb.net/V3')
  .then(() => {
    console.log('Connected to MongoDB');
    sendTelegramMessage('MongoDB Connection', 'Successfully connected to MongoDB');
  })
  .catch((error) => {
    console.error('MongoDB Connection error:', error);
    sendTelegramMessage('MongoDB Connection Error', `Failed to connect to MongoDB: ${error.message}`);
  });

// Telegram configuration
const botToken = '7595498223:AAE89tHasgl7R8WGBznjpYGzDY14gDDvb7I';
const chatId = '-1002257707907';

// Telegram message sender
const sendTelegramMessage = async (status, details) => {
  const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const message = `
🕒 **Timestamp:** ${timestamp}
📈 **Status:** ${status}
📋 **Details:** ${details}
  `.trim();

  const payload = {
    chat_id: chatId,
    text: message,
    parse_mode: 'Markdown'
  };

  try {
    const response = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!result.ok) throw new Error(JSON.stringify(result));
    console.log('Message sent to Telegram:', message);
  } catch (error) {
    console.error('Error sending message to Telegram:', error);
  }
};

// MongoDB Schema
const DailyOptionsDataSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true },
  timestamps: [{timestamp: String}],
  strikePrices: [{
    strikePrice: { type: Number, required: true },
    data: [ { CE: {
      timestamp: String,
      OI: Number,
      OICHANGE: Number,
      OICHANGEPERCENTAGE : Number,
      BuyQty: Number,
      SellQTY: Number
    },
    PE: {
      timestamp: String,
      OI: Number,
      OICHANGE: Number,
      OICHANGEPERCENTAGE : Number,
      BuyQty: Number,
      SellQTY: Number
    } }]
  }]
});

const DailyOptionsData = mongoose.model('DailyOptionsData', DailyOptionsDataSchema);

// Function to check if it's a trading day (excluding weekends and major holidays)
const isTradingDay = (date) => {
  const dayOfWeek = date.getDay();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // Check for weekends
  if (dayOfWeek === 0 || dayOfWeek === 6) return false;

  // Major Indian stock market holidays (2024 as an example, update yearly)
  const holidays = [
    '1-1',   // New Year's Day
    '26-1',  // Republic Day
    '8-3',   // Maha Shivaratri
    '25-3',  // Holi
    '29-3',  // Good Friday
    '11-4',  // Id-Ul-Fitr
    '17-4',  // Ram Navami
    '1-5',   // Maharashtra Day
    '17-6',  // Bakri Id
    '15-8',  // Independence Day
    '2-10',  // Mathatma Gandhi Jayanti
    '31-10', // Diwali-Laxmi Pujan
    '1-11',  // Diwali-Balipratipada
    '25-12'  // Christmas
  ];

  return !holidays.includes(`${day}-${month}`);
};

// Function to check if it's within trading hours
const isWithinTradingHours = (date) => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return (hours > 9 || (hours === 9 && minutes >= 15)) && (hours < 15 || (hours === 15 && minutes <= 30));
};
const convertToIST = (timestamp) => {
    const date = new Date(timestamp);
    return new Date(date.getTime() + (5.5 * 60 * 60 * 1000)); // Adding 5 hours and 30 minutes for IST
  };
  

// Main function to fetch and store options data
const getOptionsData = async () => {
  try {
    const response = await fetch("https://www.nseindia.com/api/option-chain-indices?symbol=NIFTY", {
       headers : {
        'accept': '*/*',
        'accept-language': 'en-US,en;q=0.7',
        'cookie': 'nsit=iciqmlYvi4LOLWB-KR9kqDbd; AKA_A2=A; *abck=B93F482623BEF9F317FBE50115BA01EF~0~YAAQMyEPFz7HHtuRAQAA0PvXFwzLiLN+/9D/rG4RZjtNlPz6OWF0PpMDm8uy5DIACAQbn62ziE2A6KxpNBD7Vtm4uyfMwETm40iKl7epVz+LVbsZpP87Wj8QWVaKdT/R8L+e1MpS2/LAo0kG6j0OLhUjjHY2ufV2/kPDAFjyYoCScwlYQTJAq5GmouwCF80SIA4gmnTYgzBBvQhX4QZqDCVAiVJzWcKmA656UtnRwcwAbEr80hLFp3u/TzztzveYeACTl6qRbrN605nrJIxCK7hCHODW8PBBMhahQdp2uWzHdIjd0osbaxXpX/trsm9U33Bv0sACBKTUJyrnhHQVzjwXwlfR5Z1d2QB6mO5BiHgkVhe70teBpjgfc7xtcOYMmTVeWLyz5wnpzZyVx331fFTwXuLcLUhHcYQ=~-1~-1~-1; defaultLang=en; ak*bmsc=5E6E3FD57D3C5DCBFB527F924EBEFCC0~000000000000000000000000000000~YAAQMyEPF2/HHtuRAQAAoQHYFxnG/z6wE7i/CMmFb+PTXI6oVJ3tU7jzhaZyh8IKgYxDNLhFMhhaOEiwIbQsgTCJG05CEZNvXW7uQ6uSn7on2ZXfxbIX1XjVy5UtsFd9z8NyYX5ByZK5b7zq3v0Fedfl6NHqlGgNkEpqE4VwxDaBEUl7d8oKoC2kE6IWVVHtw3yNBJHtJ7HhpSuLQeSwOXI3xvh58S4SRai8ryemSigKQZVRcSteA6i4NHzkF3DpB0OVXD1WZnC35bEYOvY+dQ95N0sFNUAtk1IZJormTaX8VDIrU23dPZHMRTAZ/iK1cR+GTsDA7ziQB1RPP1pfORJsP9n0AtYelZWDsU9iXeKg0k5W7HsoziqAaa+6KvmOM8e9d2dwVNttczRSmAcqPmhlomLmZ7QWemsNfhCugm+FkuKyL59E0IGHLAQNZf+KvV0HhopWlofce12A9W1o; nseappid=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJhcGkubnNlIiwiYXVkIjoiYXBpLm5zZSIsImlhdCI6MTcyNjk3ODY4NCwiZXhwIjoxNzI2OTg1ODg0fQ.nfzkgPbGlZfK9hj_qX_GTp-orMKkSLssYPf42HIatGQ; bm_sz=FC2F4A1DE1A7B81D513F8C80CBA8FFA2~YAAQMyEPF5zFH9uRAQAA3HTzFxmisGpRU76NRKVS2yc06hfr+tTS/mhzxzOONh7Y++gPLKLqeVq3CnZ9VuNmy2rjCFZjoLl4S8Fm2fKgAXXCjyQxF3Onv7xzGOxgTCgvJA+fQkEakuAZi7gbgApn52VrVYyJswuaPBgOAmlZZlBTy419N3dc7r7EukAaUMsf/Y+SHOoKH2AvhbOz4ObbHZ9OmhCZ7+KhncEtyjOQDJrdw6t34lvdmL8MClkZ71ij7aDrD+28lcSrRFuHIiIAFMKVtV6Im2flnfqV3HDraSlzODnJjGLgSGonWiQ5iCNDMnZIl4MEvXOQOOJ5OjATrPZ4vwKI8qg6LOdj7owMyKN+U+rbifo+HvBIVhh/8HaqLa23IOzdNWQT5ZAPPVh3eLp1pWuytbqSMrnile+4~4601396~3158321; bm_sv=FBC4F9C5CD7CB9AEDFED1AE748B021D1~YAAQMyEPF+nFH9uRAQAAfHjzFxnqYjjQu0Xik3IzBGMLX8/Ao7cMOjuSWr/Ejo6rXJupH5BM0/xEZtilBlZypkKQfZLSfUatGsZ7/G5fueHEahjMogpz5+2jmt9R77p8aou5wDN0gZfyWmz2jwfcKFTqCnxrzO9zFBHAW8pXjtuPRNDCHgWU3kwAqrAfTx1bA1xPn9rfL167O+sP4ccc7wd48Es69KiUoASHtywV59MpAf6TOwlCEJzyG0LM5BfGC0pSLg==~1',
        'priority': 'u=1, i',
        'referer': 'https://www.nseindia.com/option-chain',
        'sec-ch-ua': '"Brave";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'sec-gpc': '1',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();
    console.log("Data fetched successfully");
    sendTelegramMessage('Data Fetch Success ✅', 'Data fetched successfully from NSE');

    const strikePriceData = data.filtered.data;
    const rawTimestamp = data['records']['timestamp'];

    const timestamp = convertToIST(rawTimestamp);
    const currentDate = timestamp.toISOString().split('T')[0];
    console.log(timestamp);

    let dailyData = await DailyOptionsData.findOne({ date: currentDate });

    if (!dailyData) {
      // If no document exists for the current date, create a new one
      dailyData = new DailyOptionsData({
        date: currentDate,
        timestamps: [{timestamp: rawTimestamp}],
        strikePrices: []
      });
    } else {
      // Check if the timestamp already exists
      const timestampExists = dailyData.timestamps.some(t => t.timestamp === rawTimestamp);
      if (timestampExists) {
        console.log('Timestamp already exists. Skipping data save.');
        sendTelegramMessage('Data Update Skipped ⏭️', 'Timestamp already exists in the database');
        return; // Exit the function early
      }
    }

    // If we reach here, it means we need to add new data
    dailyData.timestamps.push({timestamp: rawTimestamp});

    const formattedStrikePrices = strikePriceData.map(item => ({
      strikePrice: item.strikePrice,
      newData: { CE: {
        timestamp: rawTimestamp,
        OI: item.CE?.openInterest || 0,
        OICHANGE: item.CE?.changeinOpenInterest || 0,
        OICHANGEPERCENTAGE : item.CE?.pchangeinOpenInterest || 0,
        BuyQty: item.CE?.totalBuyQuantity || 0,
        SellQTY: item.CE?.totalSellQuantity || 0
      },
      PE: {
        timestamp: rawTimestamp,
        OI: item.PE?.openInterest || 0,
        OICHANGE: item.PE?.changeinOpenInterest || 0,
        OICHANGEPERCENTAGE : item.PE?.pchangeinOpenInterest || 0,
        BuyQty: item.PE?.totalBuyQuantity || 0,
        SellQTY: item.PE?.totalSellQuantity || 0
      } }
    }));

    formattedStrikePrices.forEach(item => {
      const strikeEntry = dailyData.strikePrices.find(sp => sp.strikePrice === item.strikePrice);
      if (strikeEntry) {
        strikeEntry.data.push(item.newData);
      } else {
        dailyData.strikePrices.push({
          strikePrice: item.strikePrice,
          data: [item.newData]
        });
      }
    });

    await dailyData.save();
    console.log('Document updated with new data and timestamp.');
    sendTelegramMessage('Data Updated Successfully ✅', 'Document updated with new data and timestamp');

  } catch (error) {
    console.error('Error fetching or updating data:', error);
    sendTelegramMessage('Data Fetch/Update Error ❌', `Error: ${error.message}`);
  }
};



const runPeriodically = async (intervalMinutes) => {
  while (true) {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));

    if (isTradingDay(now) && isWithinTradingHours(now)) {
      await getOptionsData();
    } else {
      console.log("Outside trading hours or non-trading day. Waiting for next interval.");
    }5
    await new Promise(resolve => setTimeout(resolve, intervalMinutes * 45 * 1000));
  }
};

// Start the periodic execution
runPeriodically(1);




