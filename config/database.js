import mongoose from 'mongoose';

const connectDB = () => {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
      console.log('✅ MongoDB connected...');
      console.log(`📊 Database: ${mongoose.connection.name}`);
    })
    .catch(err => {
      console.error('❌ MongoDB Connection Error:', err.message);
      console.log('⚠️  Server will continue without database. Auth features will not work.');
    });
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err.message);
});

mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connected');
});

export default connectDB;
