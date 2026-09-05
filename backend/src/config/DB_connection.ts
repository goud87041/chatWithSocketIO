import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(process.env.MONGO_URL!);
    console.log(
      `✅ MongoDB connected: ${connectionInstance.connection.host} (DB: ${connectionInstance.connection.name})`
    );
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  }
};

export default connectDB;