const express = require("express");
const fs = require("fs");
const Rcon = require("rcon");
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
  var conn = null;
  ws.on("message", function incoming(data) {
    let res = JSON.parse(data);

    if (res.code == 0) { // auth
      try {
        conn = new Rcon(res.host, res.port, res.password);
        conn.on("auth", function () {
          ws.send(JSON.stringify({ code: 1, msg: "Authenticated!\n" }));
        });

        conn.on("response", data => {
          ws.send(JSON.stringify({ code: 1, msg: data + "\n" }));
        });

        conn.on("server", data => {
          ws.send(JSON.stringify({ code: 1, msg: data + "\n" }));
        });

        conn.on("error", function () {
          ws.send(JSON.stringify({ code: 2, error: "Rcon connection error!\n" }));
          conn = null;
        });

        conn.on("end", function () {
          ws.send(JSON.stringify({ code: 1, msg: "Rcon connection close!\n" }));
          conn.disconnect();
          conn = null;
        });
        conn.connect();
      } catch (e) {
        ws.send(JSON.stringify({ code: 2, error: "Rcon error : " + e.message + "\n" }));
      }

    } else if (res.code == 1) { // cmd
      if (!conn) ws.send(JSON.stringify({ code: 2, error: "Rcon is not connected without any server\n" }));
      else if (res.msg != "exit") conn.send(res.msg);
      else conn.disconnect();
    } else // other
      ws.send(JSON.stringify({ code: res.code, msg: res.msg, error: "Unknown code\n" }));
  });
  ws.send(JSON.stringify({ code: 1, msg: "Welcome to web rcon client!\n" }));
});

// server run message
server.listen(port, () => {
  console.info("Server start on interface : " + hostname + " with port :" + port);
});
