const { user } = require("../models");
//service function
const doesUserExist = async (email) => {
	const findUser = await user.findOne({ where: { email } });
	return !!findUser; //(!!findUser) is a common JavaScript pattern used to explicitly convert a value to a boolean
};

module.exports = { doesUserExist };
