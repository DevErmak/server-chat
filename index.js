const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");

// const multer = require("multer");
// const upload = multer({
//   dest: "files/", // Location where files will be saved
// });

// const formidable = require("formidable");
// const formidableMiddleware = require("express-formidable");

const app = express();

// const formidable = require("formidable");

app.use(express.json());

const multer = require("multer");
const upload = multer({ dest: __dirname + "/files/" });

// const upload = multer({ dest: "uploads/" });

// app.use(formidableMiddleware());

// const Busboy = require("busboy");
// const Busboy = require("busboy");

// app.use(express.bodyParser());
// app.use(formidable());
// app.use(express.json()); // Used to parse JSON bodies
// app.use(express.urlencoded()); // Parse URL-encoded bodies using query-string library
// or
// app.use(express.urlencoded({ extended: true }));

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
const isBuffer = require("is-buffer");

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

// const storage = multer.diskStorage({
//   destination: function (req, file, callback) {
//     callback(null, __dirname + "/files");
//   },
//   filename: function (req, file, callback) {
//     // You can write your own logic to define the filename here (before passing it into the callback), e.g:
//     console.log(file.originalname); // User-defined filename is available
//     const filename = `file_${crypto.randomUUID()}`; // Create custom filename (crypto.randomUUID available in Node 19.0.0+ only)
//     callback(null, filename);
//   },
// });
// const upload = multer({
//   storage: storage,
//   limits: {
//     fileSize: 1048576, // Defined in bytes (1 Mb)
//   },
// });
app.post("/audio", upload.single("audio"), (req, res) => {
  console.log("---------------->req.body", req.body);
  console.log("File:", req.file);

  if (!req.file) {
    return res.status(400).send("No file was uploaded.");
  }

  // Доступ к данным файла
  console.log("File:", req.file);

  // Возвращаем успешный ответ
  res.send("File uploaded successfully.");

  // console.log("---------------->wqr");
  // console.log(req.body);
  // res.end();
  // const form = new formidable.IncomingForm();
  // form.parse(req, function (err, fields, files) {
  //   let oldPath = files.profilePic.filepath;
  //   let newPath = path.join(__dirname, "files") + "/" + files.profilePic.name;
  //   console.log("---------------->newPath", newPath);
  //   let rawData = fs.readFileSync(oldPath);
  //   fs.writeFile(newPath, rawData, function (err) {
  //     if (err) console.log(err);
  //     return res.send("Successfully uploaded");
  //   });
  // });
  // const form = new formidable.IncomingForm();
  // form.parse(req, (err, fields, files) => {
  //   console.log(
  //     '---------------->__dirname + "/files/qwe.wav',
  //     __dirname + "/files/qwe.wav"
  //   );
  //   if (err) {
  //     console.log(err);
  //     return res
  //       .status(500)
  //       .json({ error: "Произошла ошибка при загрузке файла" });
  //   }
  //   // Проверяем, что загруженный файл формата WAV
  //   const uploadedFile = files.file;
  //   if (uploadedFile && uploadedFile.type === "audio/wav") {
  //     // Путь, куда сохранить файл на сервере
  //     const filePath = __dirname + "/files/qwe.wav";
  //     console.log("---------------->filePath", filePath);
  //     // Перемещаем файл из временной папки в папку на сервере
  //     fs.rename(uploadedFile.path, filePath, (err) => {
  //       if (err) {
  //         console.log(err);
  //         return res
  //           .status(500)
  //           .json({ error: "Произошла ошибка при сохранении файла" });
  //       }
  //       return res.status(200).json({ message: "Файл успешно сохранен" });
  //     });
  //   } else {
  //     return res.status(400).json({ error: "Некорректный формат файла" });
  //   }
  // });
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
    let messageDb;
    if (isBuffer(data.message)) {
      const blob = new Blob([data.message], { type: "audio/webm" });
      console.log("---------------->toBlob", blob);
      try {
        messageDb = await Messages.create({
          voice: blob,
          message: null,
        });
      } catch (err) {
        console.log("---------------->errr", err);
      }
    } else {
      console.log("---------------->toText");
      messageDb = await Messages.create({
        message: data.message,
        voice: null,
      });
    }
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

  // socket.on("send voice message", async (data) => {
  //   console.log("---------------->!!!!data", data);
  //   socket.join(data.roomId);
  //   const decodedToken = jwt.verify(data.token, "secretkeyappearshere");
  //   console.log("---------------->username message", decodedToken, data.roomId);

  //   const user = await Users.findByPk(decodedToken.userId);
  //   const room = await Rooms.findByPk(data.roomId);
  //   console.log("---------------->useruser", user);
  //   console.log("---------------->roomroom", room);

  //   console.log("Form data received:", data.message);

  //   // const messageDb = await Messages.create({
  //   //   message: data.message,
  //   // });
  //   // console.log("---------------->messageDb", messageDb);
  //   // console.log("---------------->room.id", room.id);
  //   // user.addMessages(messageDb);
  //   // room.addMessages(messageDb);

  //   io.to(data.roomId).emit("send voice message", {
  //     nickName: user.nickname,
  //     formData: data.message,
  //     id: messageDb.id,
  //   });
  // });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});
