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

const connectDB = () => {
  const db = getSequelize();
  db.authenticate()
    .then(() => {
      console.log('✅ PostgreSQL connected...');
      console.log(`📊 Database: neondb`);

      // Sync models (create tables if they don't exist)
      return db.sync({ alter: false });
    })
    .then(() => {
      console.log('✅ Database synced');
    })
    .catch((error) => {
      console.error('❌ Database Connection Error:', error.message);
      console.log('⚠️  Server will continue without database. Auth features will not work.');
    });
};

export { getSequelize, connectDB };
export default connectDB;
