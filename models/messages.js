const { DataTypes } = require("sequelize");
const db = require("../db.js");
const Users = require("./users.js");
const Rooms = require("./rooms.js");

const Messages = db.define("messages", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT || DataTypes.BLOB,
  },
  voice: {
    type: DataTypes.BLOB,
  },
});
module.exports = Messages;
