const Sequilize = require("sequelize");

module.exports = new Sequilize("test_chat", "user_sequilize", "123", {
  host: "localhost",
  dialect: "postgres",
  operatorsAliases: 0,
  pool: {
    max: 5,
    min: 0,
    acquire: 3000,
    idle: 10000,
  },
});
