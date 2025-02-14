//validations functions
const isRequestBodyValid = (body) => {
	return body.username && body.email;
};

const isEmailValid = (email) => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
};

const validateQueryTerm = (queryTerm) => {
	if (!queryTerm) {
		return { message: "Query term is required." };
	}
};

const validImageUrl = (imageUrl) => {
	const startImgUrl = "https://images.unsplash.com/";
	return imageUrl.startsWith(startImgUrl);
};

const validTags = (tags) => {
	return tags.length <= 5 && tags.every((tag) => tag.length <= 20);
};

const tagsEmpty = (tags) => {
	return !(tags.length > 0) || !tags.every((tag) => tag.length > 0);
};
module.exports = {
	isRequestBodyValid,
	isEmailValid,
	validateQueryTerm,
	validImageUrl,
	validTags,
	tagsEmpty,
};
