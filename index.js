const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const path = require("path");

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  // res.append("Access-Control-Allow-Origin", ["*"]);
  res.append("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
  res.append("Access-Control-Allow-Headers", "Content-Type");
  next();
});
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

app.post("/", async (req, res) => {
  console.log("---------------->req.body.nickname", req.body);
  try {
    const userDb = await Users.create({
      nickname: req.body.nickName,
    });
    res.send(userDb);
  } catch {
    res.status(500).send("user not create");
    return;
  }
});

app.post("/rooms", async (req, res) => {
  console.log("---------------->req.bodye", req.body);
  const user = await Users.findByPk(req.body.id);
  console.log("---------------->user1", user);
  if (!user) {
    res.status(500).send("user not found");
    return;
  }
  const rooms = await user.getRooms();
  console.log("rooorm", rooms);

  if (rooms === undefined || rooms.length == 0) {
    console.log("---------------->basd");
    res.send("user not have room");
    return;
  }
  console.log("---------------->qwess", rooms);
  res.json(rooms);
});

app.post("/createRoom", async (req, res) => {
  const users = await Users.findAll({ where: { user_id: req.body.id } });
  console.log("---------------->users", users);
  if (users === undefined || users.length == 0) {
    res.status(500).send("users not found");
    return;
  }
  const room = await Rooms.create();
  if (!room) {
    res.status(500).send("room not create");
    return;
  }
  users.map(async (user) => {
    console.log("---------------->111user", user);
    try {
      await user.addRooms(room);
    } catch {
      res.status(500).send("room not add for users:", user);
      return;
    }
  });
  res.json(room.dataValues);
});

app.get("/users", async (req, res) => {
  await Users.findAll({ raw: true })
    .then((users) => {
      console.log(users);
      res.json(users);
    })
    .catch((err) => console.log(err));
});

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("chat message", async ({ userId, roomId, message }) => {
    console.log("---------------->username message", userId, roomId);
    const user = await Users.findByPk(userId);
    const room = await Rooms.findByPk(roomId);
    console.log("---------------->useruser");
    console.log("---------------->roomroom", room);
    const messageDb = await Messages.create({
      message: message,
    });

    user.addMessages(messageDb);
    room.addMessages(messageDb);

    io.emit("chat message", { nickName: user.nickname, message });
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});
