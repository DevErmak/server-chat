const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = 4000;

server.prependListener("request", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("chat message", ({ username, message }) => {
    console.log("---------------->username message", username, message);
    io.emit("chat message", { username, message });
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});
