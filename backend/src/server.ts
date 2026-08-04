import dotenv from "dotenv";
import connectDB from "./config/DB_connection.js";
import app from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});
