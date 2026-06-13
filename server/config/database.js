import mongoose from "mongoose";

let isConnected = false;

export async function connectDatabase() {
  if (isConnected) {
    return mongoose.connection;
  }

  const mongoUri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || "lumina_tutor";

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not configured");
  }

  await mongoose.connect(mongoUri, {
    dbName,
    autoIndex: true,
  });

  isConnected = true;
  console.log(`MongoDB connected: ${mongoose.connection.host}/${dbName}`);

  return mongoose.connection;
}

export default connectDatabase;
