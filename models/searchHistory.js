module.exports = (sequelize, DataTypes) => {
	const searchHistory = sequelize.define(
		"searchHistory",
		{
			query: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			userId: {
				type: DataTypes.INTEGER,
				references: { model: "user", key: "id" },
			},
			timestamp: {
				type: DataTypes.DATE,
				defaultValue: DataTypes.NOW,
			},
		},
		{
			timestamps: true,
		}
	);

	return searchHistory;
};
