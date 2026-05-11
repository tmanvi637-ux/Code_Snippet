const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./User");

const Snippet = sequelize.define("Snippet", {
    title: {
        type: DataTypes.STRING,
        allowNull: true
    },
    code: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    language: {
        type: DataTypes.STRING, // JAVA/CPP/PYTHON
        allowNull: true
    },
    isPublic: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    timestamps: true
});

// Associations
User.hasMany(Snippet, { foreignKey: 'userId' });
Snippet.belongsTo(User, { foreignKey: 'userId' });

Snippet.hasMany(Snippet, { as: 'Forks', foreignKey: 'forkedFromId' });
Snippet.belongsTo(Snippet, { as: 'ForkedFrom', foreignKey: 'forkedFromId' });

module.exports = Snippet;