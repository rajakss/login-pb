const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "userData.db");
const bc = require("bcrypt");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const l = password.length;
  const hp = await bc.hash(password, 10);
  const query = `select * from user where username='${username}'`;
  const r = await db.get(query);
  if (r !== undefined) {
    response.status(400);
    response.send("User already exists");
  } else if (l < 5) {
    response.status(400);
    response.send("Password is too short");
  } else {
    const q = `insert into user(username,name,password,gender,location)
        values(
            '${username}',
            '${name}',
            '${hp}',
            '${gender}',
            '${location}'
        )`;
    await db.run(q);
    response.status(200);
    response.send("User created successfully");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const query = `select * from user where username='${username}'`;
  const r = await db.get(query);
  if (r === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const iss = await bc.compare(password, r.password);
    if (iss === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const l = newPassword.length;
  const q = `select * from user where username='${username}'`;
  const tt = await bc.hash(newPassword, 10);
  const t = await db.get(q);
  const hh = await bc.compare(oldPassword, t.password);
  if (hh !== true) {
    response.status(400);
    response.send("Invalid current password");
  } else if (l < 5) {
    response.status(400);
    response.send("Password is too short");
  } else {
    const u = `update user
        set
        password='${tt}'
        where username='${username}'`;
    await db.run(u);
    response.status(200);
    response.send("Password updated");
  }
});
module.exports = app;
