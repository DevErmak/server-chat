const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const path = require("path");
const jwt = require("jsonwebtoken");

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
const { Op } = require("sequelize");

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
  console.log("---------------->req.body.token", req.body);
  console.log("---------------->aaaa");
  let userDb;
  try {
    userDb = await Users.create({
      nickname: req.body.nickName,
    });
  } catch {
    res.status(500).send("user not create");
    return;
  }
  let token;
  console.log("---------------->userDb", userDb);
  try {
    token = jwt.sign(
      {
        userId: userDb.dataValues.user_id,
        nickName: userDb.dataValues.nickname,
      },
      "secretkeyappearshere",
      { expiresIn: "1h" }
    );
  } catch {
    res.status(500).send("user not create token");
    return;
  }
  const decodedToken = jwt.verify(token, "secretkeyappearshere");
  console.log("---------------->decodedToken", decodedToken);
  res.send({
    token: token,
    userId: userDb.dataValues.user_id,
    nickName: userDb.dataValues.nickname,
  });
});

app.post("/rooms", async (req, res) => {
  const decodedToken = jwt.verify(req.body.token, "secretkeyappearshere");
  const user = await Users.findByPk(decodedToken.userId);
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

app.post("/users", async (req, res) => {
  console.log("---------------->aaa");
  const decodedToken = jwt.verify(req.body.token, "secretkeyappearshere");
  console.log("---------------->decodedToken", decodedToken);
  await Users.findAll({
    raw: true,
    where: {
      [Op.not]: { user_id: decodedToken.userId },
    },
  })
    .then((users) => {
      console.log(users);
      res.json(users);
    })
    .catch((err) => console.log(err));
});

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("sent message", async ({ token, roomId, message }) => {
    const decodedToken = jwt.verify(token, "secretkeyappearshere");
    console.log(
      "---------------->username message",
      decodedToken.userId,
      roomId
    );
    const user = await Users.findByPk(decodedToken.userId);
    const room = await Rooms.findByPk(roomId);
    console.log("---------------->useruser");
    console.log("---------------->roomroom", room);
    const messageDb = await Messages.create({
      message: message,
    });

    user.addMessages(messageDb);
    room.addMessages(messageDb);

    io.emit("sent message", {
      nickName: user.nickname,
      text: message,
      id: messageDb.id,
    });
  });

  socket.on("get prev message", async ({ roomId }) => {
    //todo права на запрос. В общем сделать приватный запрос
    console.log("---------------->roomIdjkjn", roomId);
    const room = await Rooms.findByPk(roomId);
    console.log("---------------->useruser");
    console.log("---------------->roomroom", room);
    const prevMessage = await room.getMessages();
    console.log("---------------->prevMessage", prevMessage);
    const message = await Promise.all(
      prevMessage.map(async (message) => {
        console.log("---------------->message.userUserId", message.userUserId);
        const user = await Users.findByPk(message.userUserId);
        console.log("---------------->user123", user);
        return {
          text: message.message,
          id: message.id,
          nickName: user.nickname,
        };
      })
    );
    console.log("---------------->message", message);
    io.emit("get prev message", { message });
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});
