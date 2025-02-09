# Nifty Options Tracker

## Overview
Nifty Options Tracker is a Node.js application that periodically fetches and stores options chain data for NIFTY from the NSE website. It logs data in a MongoDB database and notifies via Telegram.

## Features
- Connects to MongoDB to store options data
- Fetches real-time options chain data from NSE
- Logs and updates strike price data with timestamps
- Sends notifications via Telegram for success/failure
- Runs periodically during trading hours on trading days

## Installation

### Prerequisites
- Node.js & npm installed
- MongoDB database
- Telegram bot for notifications

### Steps
1. Clone the repository:
   ```sh
   git clone https://github.com/yourusername/nifty-options-tracker.git
   cd nifty-options-tracker
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```env
   MONGODB_URL=your_mongodb_connection_string
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   TELEGRAM_CHAT_ID=your_telegram_chat_id
   NSE_API=your_nse_cookie
   ```
4. Start the application:
   ```sh
   node index.js
   ```

## How It Works
1. The script checks if today is a trading day.
2. If within trading hours (9:15 AM - 3:30 PM IST), it fetches options data from NSE.
3. Data is stored in MongoDB with timestamps.
4. A notification is sent to Telegram on success or failure.
5. The process repeats every minute during trading hours.

## MongoDB Schema
```js
const DailyOptionsDataSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true },
  timestamps: [{ timestamp: String }],
  strikePrices: [{
    strikePrice: { type: Number, required: true },
    data: [{
      CE: { timestamp: String, OI: Number, OICHANGE: Number, BuyQty: Number, SellQty: Number },
      PE: { timestamp: String, OI: Number, OICHANGE: Number, BuyQty: Number, SellQty: Number }
    }]
  }]
});
```

## Contributing
Feel free to submit issues and pull requests to improve the project.

## License
This project is licensed under the MIT License.

