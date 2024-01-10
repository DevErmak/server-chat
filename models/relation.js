const Messages = require("./messages");
const Rooms = require("./rooms");
const Users = require("./users");

const createRelation = () => {
  Rooms.hasMany(Messages);
  Messages.belongsTo(Rooms);

  Rooms.belongsToMany(Users, { through: "room_participants" });
  Users.belongsToMany(Rooms, { through: "room_participants" });

  Users.hasMany(Messages);
  Messages.belongsTo(Users);
};
module.exports = createRelation;
