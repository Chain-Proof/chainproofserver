import { Sequelize } from 'sequelize';

let sequelize;

const getSequelize = () => {
  if (!sequelize) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not defined');
    }
    sequelize = new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      },
      logging: process.env.NODE_ENV === 'development' ? console.log : false
    });
  }
  return sequelize;
};

const connectDB = async () => {
  try {
    console.log('🔌 Attempting to connect to PostgreSQL...');
    const db = getSequelize();

    await db.authenticate();
    console.log('✅ PostgreSQL connected successfully!');
    console.log(`📊 Database: ${db.config.database}`);
    console.log(`🌐 Host: ${db.config.host}`);

    // Sync models (create tables if they don't exist)
    await db.sync({ alter: false });
    console.log('✅ Database models synced successfully');

    return true;
  } catch (error) {
    console.error('❌ Database Connection Error:');
    console.error('   Message:', error.message);
    console.error('   Code:', error.code || 'N/A');
    if (error.parent) {
      console.error('   Parent Error:', error.parent.message);
    }
    console.log('⚠️  Server will continue without database. Auth features will not work.');
    return false;
  }
};

export { getSequelize, connectDB };
export default connectDB;
