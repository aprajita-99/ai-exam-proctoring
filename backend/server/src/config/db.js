import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // The { family: 4 } option forces Mongoose to use IPv4
    await mongoose.connect(process.env.MONGO_URI, {
      family: 4, 
    });
    console.log("MongoDB connected");
  } catch (err) {
    console.error("DB error", err);
    process.exit(1);
  }
};

export default connectDB;
