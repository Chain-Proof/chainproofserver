import { DataTypes } from 'sequelize';
import crypto from 'crypto';
import { getSequelize } from '../config/sequelize.js';
import User from './UserSQL.js';

const sequelize = getSequelize();

const APIKey = sequelize.define('APIKey', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  key: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      len: {
        args: [1, 50],
        msg: 'Name cannot exceed 50 characters'
      }
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastUsed: {
    type: DataTypes.DATE,
    allowNull: true
  },
  usageCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  permissions: {
    type: DataTypes.JSONB,
    defaultValue: {
      analyze: true,
      riskScore: true,
      fullAnalysis: true,
      batch: true,
      registration: true
    }
  },
  rateLimit: {
    type: DataTypes.JSONB,
    defaultValue: {
      requestsPerMinute: 60,
      requestsPerDay: 10000
    }
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'api_keys'
});

// Define relationship
APIKey.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(APIKey, { foreignKey: 'userId', as: 'apiKeys' });

// Static method to generate a unique API key
APIKey.generateKey = function() {
  const prefix = 'cp'; // ChainProof prefix
  const randomBytes = crypto.randomBytes(32).toString('hex');
  return `${prefix}_${randomBytes}`;
};

// Instance method to check if key is expired
APIKey.prototype.isExpired = function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
};

// Instance method to record usage
APIKey.prototype.recordUsage = async function() {
  this.lastUsed = new Date();
  this.usageCount += 1;
  await this.save();
};

// Instance method to get JSON (hide full key, show only last 8 chars)
APIKey.prototype.toJSON = function() {
  const values = { ...this.get() };
  if (values.key) {
    values.keyPreview = `...${values.key.slice(-8)}`;
    delete values.key;
  }
  return values;
};

export default APIKey;
