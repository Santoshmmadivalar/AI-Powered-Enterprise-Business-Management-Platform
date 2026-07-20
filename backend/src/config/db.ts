import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/outpro';
    
    mongoose.connection.on('connected', () => {
      console.log('MongoDB connection established successfully.');
    });

    mongoose.connection.on('error', (err) => {
      console.error(`MongoDB connection error: ${err.message || err}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB connection disconnected.');
    });

    // Enable standard Mongoose buffering for smooth operations
    mongoose.set('bufferCommands', true);

    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
    });
  } catch (error: any) {
    console.error('Initial database connection attempt failed:', error.message);
  }
};
