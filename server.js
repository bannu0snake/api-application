const express = require("express");
const app = express();
const PORT = 5000;
const connectDB = require("./config/db");
connectDB();
app.use(express.json({ extended: false }));
app.get("/", (req, res) => res.send("Hello World!"));

// Define routes
app.use("/api/users", require("./routes/api/users"));
app.use("/api/auth", require("./routes/api/auth"));
app.use("/api/posts", require("./routes/api/posts"));
app.use("/api/profile", require("./routes/api/profile"));
app.listen(PORT, () => console.log(`Your Server is running on ${PORT}....`));
