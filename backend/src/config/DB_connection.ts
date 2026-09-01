import mongoose from "mongoose";

const connetDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(process.env.MONGO_URL!);
        console.log(`MongoDB connected: ${connectionInstance.connection.host}`);
    } catch (err) {
        console.error(err);
    }
}

export default connetDB;