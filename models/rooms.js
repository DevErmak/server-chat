const { DataTypes } = require("sequelize");
const db = require("../db.js");
const Messages = require("./messages.js");

const Rooms = db.define("rooms", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

// console.log("---------------->Messages", Messages);
// Messages.belongsTo(Rooms);
// Rooms.hasMany(Messages);

// Rooms.belongsToMany(Users, { through: "room_participants" });

module.exports = Rooms;
