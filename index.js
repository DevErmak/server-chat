const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const path = require("path");

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.append("Access-Control-Allow-Origin", ["*"]);
  res.append("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
  res.append("Access-Control-Allow-Headers", "Content-Type");
  next();
});
const server = http.createServer(app);
const io = socketIO(server);

// server.prependListener("request", (req, res) => {
//   res.setHeader("Access-Control-Allow-Origin", "*");
// });

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

app.post("/", (req, res) => {
  console.log("---------------->req.body.nickname", req.body);
  Users.create({
    nickname: req.body.nickName,
  });
  res.end();
});

app.post("/message", (req, res) => {
  console.log("---------------->req.body.nicknameqwe", req.body);
  Users.findOne({ where: { nickname: req.body.nickName } }).then((user) => {
    console.log("---------------->sauser", user);
    if (!user) return;
    user.getRooms().then((rooms) => {
      console.log("---------------->rooms", rooms);
      for (room of rooms) {
        console.log("rooorm", room);
      }
    });
  });
  res.end();
});

app.get("/users", (req, res) => {
  Users.findAll({ raw: true })
    .then((users) => {
      console.log(users);
      res.json(users);
    })
    .catch((err) => console.log(err));
  // res.end();
});

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("chat message", async ({ username, message }) => {
    console.log("---------------->username message", username, message);
    io.emit("chat message", { username, message });
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});
