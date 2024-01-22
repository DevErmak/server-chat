const { DataTypes } = require("sequelize");
const db = require("../db.js");
const Messages = require("./messages.js");
const Rooms = require("./rooms.js");

const Users = db.define("users", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  nickname: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

// Messages.belongsTo(Users);
// Users.hasMany(Messages);

// Users.belongsToMany(Rooms, { through: "room_participants" });

module.exports = Users;
