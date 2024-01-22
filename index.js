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
  try {
    console.log("---------------->aas");
    const user = await Users.create({
      nickname: req.body.nickName,
    });
    console.log("---------------->userDb", user);
    const token = jwt.sign(
      {
        userId: user.dataValues.id,
        nickName: user.dataValues.nickname,
      },
      "secretkeyappearshere",
      { expiresIn: "1h" }
    );
    res.send({
      token: token,
      userId: user.dataValues.id,
      nickName: user.dataValues.nickname,
    });
  } catch (err) {
    res.status(500).send(`user not create ${err}`);
  }
});

// app.post("/rooms", async (req, res) => {
//   const decodedToken = jwt.verify(req.body.token, "secretkeyappearshere");
//   const user = await Users.findByPk(decodedToken.userId);
//   console.log("---------------->user1", user);
//   if (!user) {
//     res.status(500).send("user not found");
//     return;
//   }
//   const rooms = await user.getRooms();
//   console.log("rooorm", rooms);

//   if (rooms === undefined || rooms.length == 0) {
//     console.log("---------------->basd");
//     res.send("user not have room");
//     return;
//   }
//   console.log("---------------->qwess", rooms);
//   res.json(rooms);
// });

// app.post("/createRoom", async (req, res) => {
//   const users = await Users.findAll({ where: { user_id: req.body.id } });
//   console.log("---------------->users", users);
//   if (users === undefined || users.length == 0) {
//     res.status(500).send("users not found");
//     return;
//   }
//   const room = await Rooms.create();
//   if (!room) {
//     res.status(500).send("room not create");
//     return;
//   }
//   users.map(async (user) => {
//     console.log("---------------->111user", user);
//     try {
//       await user.addRooms(room);
//     } catch {
//       res.status(500).send("room not add for users:", user);
//       return;
//     }
//   });
//   res.json(room.dataValues);
// });

// app.post("/createRoom", async (req, res) => {
//   try {
//     console.log("---------------->req.body", req.body);
//     const room = await Rooms.create({
//       name: req.body.roomName,
//     });
//     console.log("---------------->aqqaaa");
//     res.json(room);
//   } catch {
//     res.status(500).send("room not create");
//   }
// });

// app.get("/rooms", async (req, res) => {
//   // const decodedToken = jwt.verify(req.body.token, "secretkeyappearshere");
//   // const user = await Users.findByPk(decodedToken.userId);
//   // console.log("---------------->user1", user);
//   // if (!user) {
//   // res.status(500).send("user not found");
//   // return;
//   // }
//   const rooms = await Rooms.findAll();
//   console.log("rooorm", rooms);

//   if (rooms === undefined || rooms.length == 0) {
//     console.log("---------------->basd");
//     res.send("not have room");
//     return;
//   }
//   console.log("---------------->qwess", rooms);
//   res.json(rooms);
// });

app.post("/users", async (req, res) => {
  console.log("---------------->aaa");
  const decodedToken = jwt.verify(req.body.token, "secretkeyappearshere");
  console.log("---------------->decodedToken", decodedToken);
  await Users.findAll({
    raw: true,
    where: {
      [Op.not]: { id: decodedToken.userId },
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

  socket.on("send message", async (data) => {
    console.log("---------------->!!!!data", data);
    socket.join(data.roomId);
    const decodedToken = jwt.verify(data.token, "secretkeyappearshere");
    console.log("---------------->username message", decodedToken, data.roomId);
    const user = await Users.findByPk(decodedToken.userId);
    const room = await Rooms.findByPk(data.roomId);
    console.log("---------------->useruser", user);
    console.log("---------------->roomroom", room);
    const messageDb = await Messages.create({
      message: data.message,
    });
    console.log("---------------->messageDb", messageDb);
    console.log("---------------->room.id", room.id);
    user.addMessages(messageDb);
    room.addMessages(messageDb);

    io.to(data.roomId).emit("send message", {
      nickName: user.nickname,
      text: data.message,
      id: messageDb.id,
    });
  });

  socket.on("get prev message", async ({ roomId }) => {
    //todo права на запрос. В общем сделать приватный запрос
    socket.join(roomId);

    console.log("---------------->roomIdjkjn", roomId);
    const room = await Rooms.findByPk(roomId);
    console.log("---------------->useruser");
    console.log("---------------->roomroom", room);
    const prevMessage = await room.getMessages();
    console.log("---------------->prevMessage", prevMessage);
    const message = await Promise.all(
      prevMessage.map(async (msg) => {
        console.log("---------------->message22", msg);
        console.log("---------------->message.userUserId", msg.userId);
        const user = await Users.findByPk(msg.userId);
        console.log("---------------->user123", user);
        return {
          text: msg.message,
          id: msg.id,
          nickName: user.nickname,
        };
      })
    );
    console.log("---------------->message", message);
    io.to(roomId).emit("get prev message", message);
  });

  socket.on("get rooms", async () => {
    const rooms = await Rooms.findAll();
    console.log("rooorm", rooms);

    if (rooms === undefined || rooms.length == 0) {
      console.log("---------------->basd");
      io.emit("get rooms", "not have room");
      return;
    }
    console.log("---------------->qwess", rooms);
    io.emit("get rooms", rooms);
  });

  socket.on("add room", async (data) => {
    console.log("---------------->req.body", data.roomName);
    const room = await Rooms.create({
      name: data.roomName,
    });
    console.log("---------------->qwess", room);
    io.emit("add room", room);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});
