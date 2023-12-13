const fs = require("fs");

const validator = require("email-validator");

let users = [];

fs.readFile("users.json", "utf8", (err, data) => {
  if (!err) {
    try {
      const parsedData = JSON.parse(data);
      if (Array.isArray(parsedData)) {
        users = parsedData;
      }
    } catch (error) {
      console.error("Error parsing existing users:", error);
    }
  }
});

function saveUsersToFile() {
  fs.writeFile("users.json", JSON.stringify(users), (err) => {
    if (err) {
      console.error("Error saving users to file:", err);
    }
  });
}

function isEmailUnique(email) {
  return !users.some((user) => user.email === email);
}

function generateRandomId() {
  return Math.floor(10 + Math.random() * 90); // Generates a random 2-digit ID
}

function Signup(req, res) {
  const data = req.body;
  

  if (!data.name || !data.email) {
    res.status(400).json({ error: "Name and email are required" });
    return;
  }

  if (!validator.validate(data.email)) {
    res.status(400).json({ error: "Invalid email format" });
    return;
  }

  if (!isEmailUnique(data.email)) {
    res.status(400).json({ error: "Email is already in use" });
    return;
  }

  const newUser = {
    id: generateRandomId(), // Generate a random 2-digit ID
    name: data.name,
    email: data.email,
  };

  users.push(newUser);
  saveUsersToFile();

  res.status(201).json({ detail: newUser, message: "Sign up successful by user" });
}

function Login(req, res) {
  const data = req.body;

  if (!data.email) {
    res.status(400).json({ error: "Email is required" });
    return;
  }

  const foundUser = users.find((user) => user.email === data.email);

  if (foundUser) {
    res.status(200).json({ data: foundUser, message: "Login successful" });
  } else {
    res.status(401).json({ error: "Login failed" });
  }
}

// Function to find a user by ID
function findUserById(id) {
  return users.find((user) => user.id === id);
}

// Route to get a user by ID
const getUser = (req, res) => {
  const userId = parseInt(req.params.id);

  const user = findUserById(userId);

  if (user) {
    res.status(200).json(user);
  } else {
    res.status(404).json({ error: "user on the database does exist" });
  }
};

// Route to update a user by ID
const updateUser = (req, res) => {
  const userId = parseInt(req.params.id);
  const user = findUserById(userId);
  console.log(user);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const newData = req.body;

  if (newData.name) {
    user.name = newData.name;
  }

  if (newData.email) {
    user.email = newData.email;
  }

  // You can add more fields to update as needed

  saveUsersToFile();

  res.status(200).json({ data: newData, message: "User updated successfully" });
};

// Route to delete a user by ID
const deleteUser = (req, res) => {
  const userId = parseInt(req.params.id);
  const userIndex = users.findIndex((user) => user.id === userId);

  if (userIndex === -1) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  // Remove the user from the users array
  users.splice(userIndex, 1);

  saveUsersToFile();

  res.status(200).json("user successfully removed"); // Respond with 204 (No Content) for a successful deletion
};

module.exports = { Signup, Login, updateUser, getUser, deleteUser };