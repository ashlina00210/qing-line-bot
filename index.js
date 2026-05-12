const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

function categorizeExpense(text) {
  const lower = text.toLowerCase();

  if (lower.includes("午餐") || lower.includes("晚餐") || lower.includes("早餐") || lower.includes("吃") || lower.includes("水餃") || lower.includes("飲料")) {
    return "飲食";
  }

  if (lower.includes("搭車") || lower.includes("坐車") || lower.includes("捷運") || lower.includes("加油") || lower.includes("停車")) {
    return "交通";
  }

  if (lower.includes("房租")) {
    return "居住";
  }

  if (lower.includes("醫美") || lower.includes("保養")) {
    return "美容";
  }

  return "其他";
}

app.post("/webhook", async (req, res) => {
  try {
    const event = req.body.events?.[0];

    if (!event || event.type !== "message") {
      return res.sendStatus(200);
    }

    const userText = event.message.text;

    const amountMatch = userText.match(/-?\d+/);

    if (!amountMatch) {
      await axios.post(
        "https://api.line.me/v2/bot/message/reply",
        {
          replyToken: event.replyToken,
          messages: [
            {
              type: "text",
              text: "請輸入像這樣：午餐 -150"
            }
          ]
        },
        {
          headers: {
            Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
            "Content-Type": "application/json"
          }
        }
      );

      return res.sendStatus(200);
    }

    const amount = amountMatch[0];
    const category = categorizeExpense(userText);

    await axios.post(
      "https://api.line.me/v2/bot/message/reply",
      {
        replyToken: event.replyToken,
        messages: [
          {
            type: "text",
            text: `已記錄 ✅\n分類：${category}\n金額：${amount}`
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.sendStatus(200);

  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

app.get("/", (req, res) => {
  res.send("晴的管帳寶寶運作中 🚀");
});

app.listen(process.env.PORT || 3000);
