const express = require("express");
const fs = require("fs");
const WebSocket = require("ws");

// app settings
global.app = express();
global.port = process.env.PORT || 8080;
global.hostname = process.env.HOSTNAME || "localhost";

app.set("trust proxy", true); // Allow proxy
app.set("twig options", {
  allow_async: true,
  strict_letiables: false
});

// execute on all request
app.use((req, res, next) => {
    next();
});

// load public folder
app.use(express.static(__dirname + "/public"));

// routes
app.get("*", (req, res) => {
  fs.readFile(__dirname + "/entrypoint.html", (err, data) => res.end(data));
});

// ws
const server = require("http").createServer(app);
const wss = new WebSocket.Server({ clientTracking: false, noServer: true });
server.on("upgrade", async (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, async ws => {
    wss.emit("connection", ws, req);
  });
});

wss.on("connection", (ws, req) => {
  ws.on('message', function incoming(data) {
    //TODO:
    ws.send(JSON.stringify({ code: 1, msg: data + "\n" }));
    ws.send(JSON.stringify({ code: 2, error: "test\n" }));
  });
  ws.send(JSON.stringify({ code: 1, msg: "Welcome to web rcon client!\n"}));
});

// server run message
server.listen(port, () => {
  console.info("Server start on interface : " + hostname + " with port :" + port);
});
