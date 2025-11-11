// app/models/masterplandoc.js
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const MasterPlanDoc = sequelize.define('MasterPlanDoc', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    doc_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    doc_type: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    doc_title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    revision_no: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    quarter: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    owner: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    doc_status: {
      type: DataTypes.STRING(50),
      defaultValue: 'Open'
    },
    is_uploaded: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    uploaded_file: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    file_type: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    file_size: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    storage_path: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    download_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    uploaded_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'masterplandocs',
    timestamps: false, // We're using created_at and updated_at manually
    underscored: false // Use camelCase for field names
  });

  return MasterPlanDoc;
};