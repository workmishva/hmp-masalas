import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGO_URI;

    if (!mongoURI) {
      console.error('[MongoDB] Error: MONGO_URI environment variable is not defined in .env file.');
      process.exit(1);
    }

    const conn = await mongoose.connect(mongoURI);

    console.log(`[MongoDB] Connected successfully to Atlas: ${conn.connection.host}/${conn.connection.name}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error(`[MongoDB] Connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[MongoDB] Disconnected from database');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('[MongoDB] Connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error(`[MongoDB] Failed to connect: ${(error as Error).message}`);
    process.exit(1);
  }
};

export default connectDB;
