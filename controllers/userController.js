const { user, photo, tag, searchHistory } = require("../models"); //Correct Initialization: The models/index.js file ensures that all models are correctly initialized with the sequelize instance and that all associations are set up. Got error due to direct import of user like const user = require("../models/user");
const {
	isRequestBodyValid,
	isEmailValid,
	validateQueryTerm,
	validImageUrl,
	validTags,
	tagsEmpty,
} = require("../validations/userValidation");

const { doesUserExist } = require("../services/userService");
const axiosInstance = require("../lib/axios.lib");

//step 3: Create a controller function named createNewUser
const createNewUser = async (req, res) => {
	//step 2: This endpoint will accept username & email in request body
	const { username, email } = req.body;

	//step 5: Validate the request body before creating a new record in the users table
	if (!isRequestBodyValid(req.body)) {
		return res.status(400).json({ message: "Username and Email is required." });
	}

	// step 4: Create service functions named doesUserExist(email) which will be responsible for querying the db to check if a user already exists and returns boolean value
	if (await doesUserExist(email)) {
		return res.status(400).json({
			message: "User already exists",
		});
	}
	//Validate if the email is a valid email address that includes both @ and .
	if (!isEmailValid(email)) {
		return res.status(400).json({ message: "Please give valid email." });
	}

	//creating new user
	try {
		const newUser = await user.create({ username, email });
		return res
			.status(201)
			.json({ message: "user created successfully.", newUser });
	} catch (error) {
		return res
			.status(500)
			.json({ message: "Internal server error", error: error.message });
	}
};

const searchImages = async (req, res) => {
	const queryTerm = req.query.queryTerm;
	const validQuery = validateQueryTerm(queryTerm);
	if (validQuery !== undefined) {
		return res.status(400).json({ message: validQuery.message });
	}
	try {
		const response = await axiosInstance.get("/search/photos", {
			params: { query: queryTerm },
		});
		const allPhotos = [];
		response.data.results.forEach((photo) => {
			allPhotos.push({
				imageUrl: photo.urls.regular,
				altDescription: photo.alt_description,
				description: photo.description,
			});
		});
		// MS1_Assignment_1.3: validation step 3:Handle cases where the search returns no results by returning an appropriate message like 'No images found for the given query.'
		if (allPhotos.length === 0) {
			return res
				.status(404)
				.json({ message: "No images found for the given query." });
		}

		return res.status(200).json(allPhotos);
	} catch (error) {
		return res
			.status(500)
			.json({ message: "Failed to fetch unsplash api.", error: error.message });
	}
};

//Create a Sequelize model named Photo that will store photo details, including imageUrl, description, altDescription, tags, and userId.
const savedPhoto = async (req, res) => {
	const { imageUrl, description, altDescription, tags, userId } = req.body;
	if (!imageUrl || !validImageUrl(imageUrl)) {
		return res.status(400).json({ message: "Invalid Image Url." });
	}

	if (!validTags(tags)) {
		return res.status(400).json({
			message:
				"Tags must be 5 or less and does not have more than 20 characters.",
		});
	}
	try {
		const newPhoto = await photo.create({
			imageUrl,
			description,
			altDescription,
			userId,
		});
		const newTags = tags.forEach(
			async (t) => await tag.create({ name: t, photoId: newPhoto.id })
		);
		// await newPhoto.setTags(newTags);
		return res.status(200).json({ message: "Photo saved successfully." });
	} catch (error) {
		return res
			.status(500)
			.json({ message: "Error while saving photo.", error: error.message });
	}
};

const addTagsByPhotoId = async (req, res) => {
	const photoId = req.params.photoId;
	const tags = req.body.tags;
	const photoOfId = await photo.findOne({
		where: { id: photoId },
		include: { model: tag },
	});
	if (!photoOfId) {
		return res.status(404).json({ message: "Photo not found." });
	}

	if (tagsEmpty(tags)) {
		return res
			.status(400)
			.json({ message: "Tags must be non-empty and have non-empty strings." });
	}
	if (!validTags(tags)) {
		return res.status(400).json({
			message:
				"Tags must be 5 or less and does not have more than 20 characters.",
		});
	}
	console.log(
		"Before the adding tags the tag count is ",
		photoOfId.tags.length
	);
	try {
		if (tags.length > 0 && photoOfId.tags.length + tags.length <= 5) {
			await tag.bulkCreate(tags.map((tag) => ({ name: tag, photoId })));
			// Re-fetch the photo with updated tags
			const updatedPhoto = await photo.findOne({
				where: { id: photoId },
				include: { model: tag },
			});
			console.log(
				"After the adding tags the tag count is ",
				updatedPhoto.tags.length
			);
			return res.status(200).json({ message: "Tags added successfully." });
		} else {
			return res.status(400).json({
				message: "Tags must be 5 or less.",
			});
		}
	} catch (error) {
		return res
			.status(500)
			.json({ message: "Error while adding tags", error: error.message });
	}
};

const getPhotoFromDb = async (req, res) => {
	let photoId = parseInt(req.params.photoId);
	// Validate photoId is a number
	if (isNaN(photoId) || photoId <= 0) {
		return res.status(400).json({ message: "Invalid photo ID." });
	}
	try {
		let gettedPhoto = await photo.findOne({ where: { id: photoId } });
		if (!gettedPhoto) {
			return res.status(404).json({ message: "Photo not found." });
		}
		return res.status(200).json(gettedPhoto);
	} catch (error) {
		return res.status(500).json({ message: "Internal server error" });
	}
};

const searchByTag = async (req, res) => {
	const { queryTag, sort = "ASC", userId } = req.query; //If the request does not include a sort parameter, the value will default to "ASC"

	//Only a single tag is accepted as input query.Ensure that a valid tag is provided.
	if (!queryTag || !typeof queryTag === "string") {
		return res.status(400).json({ message: "A string tag is required." });
	}
	//Create a searchHistory model to log the userId and search query (the tag) when the search is made.
	if (userId) {
		await searchHistory.create({ userId, query: queryTag });
	}

	//Validate that the sort query can either be ASC (ascending) or DESC (descending).

	if (sort !== "ASC" && sort !== "DESC") {
		return res.status(400).json({ message: "Invalid sort parameter." });
	}

	//Before searching for photos, check if the provided tag exists in the database.
	try {
		const isTagExist = await tag.findAll({
			where: { name: queryTag },
			include: { model: photo },
		});
		if (isTagExist.length > 0) {
			const photoId = isTagExist.map((tag) => tag.photoId);
			const photos = await photo.findAll({
				where: { id: photoId },
				include: { model: tag, attributes: ["name"] },
				order: [["dateSaved", sort.toUpperCase()]],
			});
			return res.status(200).json(photos);
		} else {
			return res.status(404).json({ message: "Tag not found." });
		}
	} catch (error) {
		return res.status(500).json({ message: "Internal server error" });
	}
};

//1.7: Tracking and Displaying Search History

const getSearchHistory = async (req, res) => {
	const userId = req.query.userId;
	if (!userId || isNaN(userId)) {
		return res
			.status(400)
			.json({ message: "User Id is required. And it should be a number." });
	}
	try {
		const searchHistoryOfUser = await searchHistory.findAll({
			where: { userId },
			attributes: ["query", "timestamp"],
		});
		if (!searchHistoryOfUser.length > 0) {
			return res
				.status(404)
				.json({ message: "No search history found for the user." });
		}
		return res.status(200).json(searchHistoryOfUser);
	} catch (error) {
		return res
			.status(500)
			.json({ message: "Internal server error", error: error.message });
	}
};
module.exports = {
	createNewUser,
	searchImages,
	savedPhoto,
	addTagsByPhotoId,
	getPhotoFromDb,
	searchByTag,
	getSearchHistory,
};
