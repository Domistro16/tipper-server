import mongoose from "mongoose";

export const DB_connection = async () => {
  try {
    mongoose.set("strictQuery", false);
    const conn = await mongoose.connect(
      process.env.CONNECTION_STRING || process.env.MONGO_URL
    );
    console.log(`MongoDB connection success on : ${conn.connection.host}`);
  } catch (error) {
    console.log(error);
  }
};
