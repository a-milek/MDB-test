const express = require("express");
const cors = require("cors");
const MdbPayService = require("mdb_pay_service");

require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const apiClient = MdbPayService.ApiClient.instance;
apiClient.basePath = process.env.MDB_BASE_PATH;

const api = new MdbPayService.DevelopersApi();
console.log("Server loaded");

app.get("/open-session", (req, res) => {
  api.sessionOpenGet((error, data) => {
    if (error) {
      console.error("Session open failed:", error);
      return res.status(500).json({ success: false, error });
    }
    console.log("Session opened successfully");
    res.json({ success: true, data });
  });
});

app.get("/close-session", (req, res) => {
  api.sessionCloseGet((error, data) => {
    if (error) {
      console.error("Session close failed:", error);
      return res.status(500).json({ success: false, error });
    }
    console.log("Session closed successfully");
    res.json({ success: true, data });
  });
});

app.post("/vend-request", (req, res) => {
  const { price, itemNumber } = req.body;
  console.log(`Vend request item: ${itemNumber} price: ${price}`);

  api.vendRequestGet({ price, itemNumber }, (error, data, response) => {
    
    if (error) {
      return res.status(500).json({ success: false, error: response?.body || error });
    }

    res.json({ success: true, data });
  });
});

app.post("/vend-success", (req, res) => {
  const { itemNumber } = req.body;

  api.vendSuccessGet({ itemNumber }, (error, data, response) => {
    if (error) {
      console.error("Vend success failed:", response?.body || error);
      return res.status(500).json({ success: false, error: response?.body || error });
    }
    res.json({ success: true, data });
  });
});

app.get("/status", (req, res) => {
  api.getStatusGet((error, data, response) => {
    if (error) {
      console.error("Get status failed:", response?.body || error);
      return res.status(500).json({ success: false, error: response?.body || error });
    }

    let parsedData;
    try {
      if (response && response.body) {
        parsedData = typeof response.body === "string" ? JSON.parse(response.body) : response.body;
      } else {
        parsedData = data;
      }
    } catch (e) {
      console.error("Failed to parse JSON:", e);
      parsedData = null;
    }

    res.json({ success: true, data: parsedData });
  });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`MDB backend running on port ${PORT}`);

});


const WebSocket = require("ws");

const MDB_WS = `${process.env.MDB_BASE_PATH}/ws`;
const WS_PORT = process.env.WS_PORT || 3001;

const wss = new WebSocket.Server({ port: WS_PORT });

wss.on("connection", (client) => {
  console.log("Frontend connected to watch");

  let mdbWs = null;
  let retryTimeout = null;
  let disposed = false;

  function connectMdb() {
    if (disposed) return;
    mdbWs = new WebSocket(MDB_WS);

    mdbWs.on("open", () => {
      console.log("Connected to MDB upstream WS");
    });

    mdbWs.on("message", (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(parsed));
        }
      } catch (e) {
        console.error("WS parse error:", e);
      }
    });

    mdbWs.on("close", () => {
      console.log("MDB upstream WS disconnected");
      if (!disposed) {
        retryTimeout = setTimeout(connectMdb, 3000);
      }
    });

    mdbWs.on("error", (err) => {
      console.error("MDB upstream WS error:", err.message);
    });
  }

  connectMdb();

  client.on("close", () => {
    disposed = true;
    if (retryTimeout) clearTimeout(retryTimeout);
    if (mdbWs) mdbWs.close();
  });
});