const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

server.prependListener("request", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
});

const PORT = 4000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const db = require("./db.js");
const Users = require("./models/users.js");
const Rooms = require("./models/rooms.js");
const Messages = require("./models/messages.js");
const createRelation = require("./models/relation.js");

const init_BDD = async () => {
  try {
    await db.authenticate();
    console.log("Connection has been established successfully.");
    const created = db.sync();

    if (created) {
      console.log("==> TABLE DONE !");
    }
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};
init_BDD();
createRelation();

app.get("/", (req, res) => {
  res.send("Hello World!");
});

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("chat message", async ({ username, message }) => {
    console.log("---------------->username message", username, message);
    await Users.create({
      nickname: username,
      avatar: message,
    });
    await Rooms.create({
      last_message: message,
    });
    await Messages.create({
      message: message,
    });
    io.emit("chat message", { username, message });
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});
