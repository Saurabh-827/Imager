const {
	createNewUser,
	searchImages,
	savedPhoto,
	addTagsByPhotoId,
	getPhotoFromDb,
	searchByTag,
	getSearchHistory,
} = require("../controllers/userController");
const axiosInstance = require("../lib/axios.lib");
const { user, photo, tag, searchHistory } = require("../models");
const { doesUserExist } = require("../services/userService");
const {
	isEmailValid,
	isRequestBodyValid,
	validateQueryTerm,
	validImageUrl,
	validTags,
	tagsEmpty,
} = require("../validations/userValidation");

//mocking axios for http requests
jest.mock("../lib/axios.lib", () => ({
	get: jest.fn(), //here get was inaccessible but become accessible when used ()=> () this outer circle brackets
}));

//mocking user model
jest.mock("../models", () => ({
	user: {
		create: jest.fn(), //mocking create method because it is used in createNewUser function
		findOne: jest.fn(), //mocking findOne method
	},
	photo: {
		create: jest.fn(),
		findOne: jest.fn(),
		findAll: jest.fn(),
	},
	tag: {
		create: jest.fn(),
		bulkCreate: jest.fn(),
		findAll: jest.fn(),
	},
	searchHistory: {
		create: jest.fn(),
		findAll: jest.fn(),
	},
}));

// Mocking the doesUserExist function
jest.mock("../services/userService", () => ({
	doesUserExist: jest.fn(),
}));

jest.mock("../validations/userValidation", () => ({
	isRequestBodyValid: jest.fn(),
	isEmailValid: jest.fn(),
	validateQueryTerm: jest.fn(),
	validImageUrl: jest.fn(),
	validTags: jest.fn(),
	tagsEmpty: jest.fn(),
}));

describe("User Controller's createNewUser", () => {
	//test for requestbody validation
	it("should return 400 if request.body not include email or username", async () => {
		const req = {
			body: {},
		};

		const res = { json: jest.fn(), status: jest.fn(() => res) };

		isEmailValid.mockResolvedValue(true);
		doesUserExist.mockResolvedValue(false);
		await createNewUser(req, res);
		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({
			message: "Username and Email is required.",
		});
	});

	//test for email validation
	it("should return 400 if email is not valid", async () => {
		const req = {
			body: {
				username: "newUser",
				email: "newUseremail.com",
			},
		};
		isRequestBodyValid.mockReturnValue(true);
		isEmailValid.mockReturnValue(false);
		doesUserExist.mockResolvedValue(false);
		const res = { json: jest.fn(), status: jest.fn(() => res) };
		await createNewUser(req, res);
		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({
			message: "Please give valid email.",
		});
	});

	//test for user already exists
	it("should return 400 if user already existed in database", async () => {
		const req = {
			body: {
				username: "newUser",
				email: "newUser@example.com",
			},
		};
		doesUserExist.mockResolvedValue(true);
		isEmailValid.mockReturnValue(true);
		doesUserExist.mockResolvedValue(true);
		const res = { json: jest.fn(), status: jest.fn(() => res) };
		await createNewUser(req, res);
		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({
			message: "User already exists",
		});
	});

	it("should create a new user", async () => {
		//mocking the response
		const mockResponse = {
			message: "user created successfully.",
			newUser: { username: "newUser", email: "newuser@example.com" },
		};
		//mocking the request object
		const req = {
			body: {
				username: "new8User",
				email: "newuser6@example.com",
			},
		};
		//mocking the create method of user model
		user.create.mockResolvedValue({
			username: "newUser",
			email: "newuser@example.com",
		});
		isRequestBodyValid.mockReturnValue(true);
		isEmailValid.mockReturnValue(true);
		doesUserExist.mockResolvedValue(false);
		//mocking the response object
		const res = { json: jest.fn(), status: jest.fn(() => res) };
		await createNewUser(req, res);
		expect(res.json).toHaveBeenCalledWith(mockResponse);
		expect(res.status).toHaveBeenCalledWith(201);
	});

	it("should return 500 internal server error if server error", async () => {
		user.create.mockRejectedValue(new Error("Server error"));
		const req = {
			body: {
				username: "newUser",
				email: "newUser@email.com",
			},
		};
		const res = { json: jest.fn(), status: jest.fn(() => res) };

		await createNewUser(req, res);
		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({
			message: "Internal server error",
			error: "Server error",
		});
	});
});

describe("User Controller's searchImages", () => {
	it("should return 400 on invalid queryTerm", async () => {
		const req = {
			query: {
				queryTerm: "",
			},
		};
		const res = { json: jest.fn(), status: jest.fn(() => res) };
		validateQueryTerm.mockReturnValue({ message: "Query term is required." });

		await searchImages(req, res);
		expect(res.json).toHaveBeenCalledWith({
			message: "Query term is required.",
		});
		expect(res.status).toHaveBeenCalledWith(400);
	});
	it("should search images with 200 status", async () => {
		const req = {
			query: {
				queryTerm: "nature",
			},
		};
		const res = { json: jest.fn(), status: jest.fn(() => res) };
		const mockResponse = {
			data: {
				results: [
					{
						urls: {
							regular: "https://images.unsplash.com/nature",
						},
						alt_description: "nature",
						description: "nature",
					},
				],
			},
		};
		validateQueryTerm.mockReturnValue(undefined);
		axiosInstance.get.mockResolvedValue(mockResponse);
		await searchImages(req, res);

		expect(res.json).toHaveBeenCalledWith([
			{
				imageUrl: "https://images.unsplash.com/nature",
				altDescription: "nature",
				description: "nature",
			},
		]);
		expect(axiosInstance.get).toHaveBeenCalledWith("/search/photos", {
			params: { query: "nature" },
		});
		expect(res.status).toHaveBeenCalledWith(200);
	});

	it("should return 404 if no photos found", async () => {
		const req = {
			query: {
				queryTerm: "nature",
			},
		};
		const res = { json: jest.fn(), status: jest.fn(() => res) };
		const mockResponse = {
			data: {
				results: [],
			},
		};
		validateQueryTerm.mockReturnValue(undefined);
		axiosInstance.get.mockResolvedValue(mockResponse);
		await searchImages(req, res);
		expect(res.json).toHaveBeenCalledWith({
			message: "No images found for the given query.",
		});
		expect(res.status).toHaveBeenCalledWith(404);
	});

	it("should return 500 for server error", async () => {
		const req = {
			query: {
				queryTerm: "nature",
			},
		};
		const res = { json: jest.fn(), status: jest.fn(() => res) };
		validateQueryTerm.mockReturnValue(undefined);
		axiosInstance.get.mockRejectedValue(new Error("Server error"));
		await searchImages(req, res);
		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({
			message: "Failed to fetch unsplash api.",
			error: "Server error",
		});
	});
});

describe("User Controller's savedPhoto", () => {
	it("should return 400 for invalid image url", async () => {
		const req = {
			body: {
				imageUrl: "<https://images.unsplash.com/photo-...",
				description: "Beautiful landscape",
				altDescription: "Mountain view",
				tags: ["nature", "mountain"],
				userId: 1,
			},
		};
		const res = { json: jest.fn(), status: jest.fn(() => res) };
		validImageUrl.mockReturnValue(false);

		await savedPhoto(req, res);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({
			message: "Invalid Image Url.",
		});
	});

	it("should return 400 for invalid tags", async () => {
		const req = {
			body: {
				imageUrl: "https://images.unsplash.com/photo-...",
				description: "Beautiful landscape",
				altDescription: "Mountain view",
				tags: ["nature", "mountain", "beach", "city", "sky", "forest"],
				userId: 1,
			},
		};
		const res = { json: jest.fn(), status: jest.fn(() => res) };
		validImageUrl.mockReturnValue(true);
		validTags.mockReturnValue(false);

		await savedPhoto(req, res);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({
			message:
				"Tags must be 5 or less and does not have more than 20 characters.",
		});
	});

	it("should return 200 by saving photo", async () => {
		const req = {
			body: {
				imageUrl: "https://images.unsplash.com/photo-...",
				description: "Beautiful landscape",
				altDescription: "Mountain view",
				tags: ["nature", "mountain"],
				userId: 1,
			},
		};
		const res = { json: jest.fn(), status: jest.fn(() => res) };
		validImageUrl.mockReturnValue(true);
		validTags.mockReturnValue(true);
		photo.create.mockResolvedValue({
			imageUrl: "https://images.unsplash.com/photo-...",
			description: "Beautiful landscape",
			altDescription: "Mountain view",
			userId: 1,
		}); //if you can also used it mockResolvedValueOnce with mockResponse just put  these data intp mockResponse variable
		tag.create.mockResolvedValue({ name: "nature", photoId: 1 });
		tag.create.mockResolvedValue({ name: "mountain", photoId: 1 });
		await savedPhoto(req, res);
		expect(res.json).toHaveBeenCalledWith({
			message: "Photo saved successfully.",
		});
		expect(res.status).toHaveBeenCalledWith(200);
	});

	it("should return 500 for server error", async () => {
		const req = {
			body: {
				imageUrl: "https://images.unsplash.com/photo-...",
				description: "Beautiful landscape",
				altDescription: "Mountain view",
				tags: ["nature", "mountain"],
				userId: 1,
			},
		};
		const res = { json: jest.fn(), status: jest.fn(() => res) };
		validImageUrl.mockReturnValue(true);
		validTags.mockReturnValue(true);
		photo.create.mockRejectedValue(new Error("Server error"));
		await savedPhoto(req, res);
		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({
			message: "Error while saving photo.",
			error: "Server error",
		});
	});
});

describe("User Controller's addTagsByPhotoId", () => {
	it("should return 404 if photo not found for adding tags", async () => {
		const req = {
			params: {
				photoId: 1,
			},
			body: {
				tags: ["nature", "mountain"],
			},
		};
		const res = { json: jest.fn(), status: jest.fn(() => res) };
		photo.findOne.mockResolvedValue(null);
		await addTagsByPhotoId(req, res);
		expect(res.status).toHaveBeenCalledWith(404);
		expect(res.json).toHaveBeenCalledWith({ message: "Photo not found." });
	});

	it("should 400 for empty tags", async () => {
		const req = {
			params: {
				photoId: 1,
			},
			body: {
				tags: [],
			},
		};
		const res = { json: jest.fn(), status: jest.fn(() => res) };
		photo.findOne.mockResolvedValue({ tags: [] });
		tagsEmpty.mockReturnValue(true);
		await addTagsByPhotoId(req, res);
		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({
			message: "Tags must be non-empty and have non-empty strings.",
		});
	});

	it("should return 400 for invalid tags", async () => {
		const req = {
			params: {
				photoId: 1,
			},
			body: {
				tags: ["nature", "mountain", "beach", "city", "sky", "forest"],
			},
		};

		const res = { json: jest.fn(), status: jest.fn(() => res) };
		tagsEmpty.mockReturnValue(false);
		validTags.mockReturnValue(false);
		await addTagsByPhotoId(req, res);
		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({
			message:
				"Tags must be 5 or less and does not have more than 20 characters.",
		});
	});

	it("should return 200 and add tags ", async () => {
		const req = {
			params: {
				photoId: 31,
			},
			body: {
				tags: ["nature", "mountain"],
			},
		};
		const res = { json: jest.fn(), status: jest.fn(() => res) };
		tagsEmpty.mockReturnValue(false);
		validTags.mockReturnValue(true);
		tag.bulkCreate.mockResolvedValue([
			{ name: "nature", photoId: 31 },
			{ name: "mountain", photoId: 31 },
		]);
		await addTagsByPhotoId(req, res);
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith({
			message: "Tags added successfully.",
		});
	});

	it("should return 500 for server error", async () => {
		const req = {
			params: {
				photoId: 31,
			},
			body: {
				tags: ["nature", "mountain"],
			},
		};
		const res = { json: jest.fn(), status: jest.fn(() => res) };
		tagsEmpty.mockReturnValue(false);
		validTags.mockReturnValue(true);
		tag.bulkCreate.mockRejectedValue(new Error("Server error"));
		await addTagsByPhotoId(req, res);
		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({
			message: "Error while adding tags",
			error: "Server error",
		});
	});
});

describe("User Controller's getPhotoFromDb", () => {
	it("should return 400 for invalid photoId", async () => {
		const req = {
			params: {
				photoId: 0,
			},
		};
		const res = {
			json: jest.fn(),
			status: jest.fn(() => res),
		};

		await getPhotoFromDb(req, res);
		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({ message: "Invalid photo ID." });
	});

	it("should return 404 if photo not found", async () => {
		const req = {
			params: {
				photoId: 1,
			},
		};
		const res = { json: jest.fn(), status: jest.fn(() => res) };
		photo.findOne.mockResolvedValue(null);
		await getPhotoFromDb(req, res);
		expect(res.status).toHaveBeenCalledWith(404);
		expect(res.json).toHaveBeenCalledWith({ message: "Photo not found." });
	});
	it("should return 200 if photo founded", async () => {
		const req = {
			params: {
				photoId: 32,
			},
		};
		const mockResponse = {
			id: 32,
			imageUrl: "https://images.unsplash.com/photo-...",
			description: "Beautiful233434landscape",
			altDescription: "monkey view",
			dateSaved: "2025-02-08T17:50:08.382Z",
			userId: 1,
			createdAt: "2025-02-08T17:50:08.382Z",
			updatedAt: "2025-02-08T17:50:08.382Z",
		};
		const res = { json: jest.fn(), status: jest.fn(() => res) };
		photo.findOne.mockResolvedValue(mockResponse);
		await getPhotoFromDb(req, res);
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith(mockResponse);
	});

	it("should return 500 for server error", async () => {
		const req = {
			params: {
				photoId: 32,
			},
		};
		const res = { json: jest.fn(), status: jest.fn(() => res) };
		photo.findOne.mockRejectedValue(new Error("Server error"));
		await getPhotoFromDb(req, res);
		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({ message: "Internal server error" });
	});
});

describe("User Controller's searchByTag", () => {
	it("should return 400 for invalid query", async () => {
		const req = {
			query: {
				sort: "ASC",
				userId: 32,
			},
		};
		const res = { json: jest.fn(), status: jest.fn(() => res) };
		await searchByTag(req, res);
		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({
			message: "A string tag is required.",
		});
	});

	it("should return 400 for invalid sort", async () => {
		const req = {
			query: {
				queryTag: "nature",
				sort: "nnnn",
				userId: 32,
			},
		};
		const res = { json: jest.fn(), status: jest.fn(() => res) };
		await searchByTag(req, res);
		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({
			message: "Invalid sort parameter.",
		});
	});

	it("should return 200 with photos", async () => {
		const req = {
			query: {
				queryTag: "nature",
				sort: "ASC",
				userId: 2,
			},
		};

		const res = { json: jest.fn(), status: jest.fn(() => res) };
		const mockResponse = [
			{
				id: 30,
				imageUrl: "https://images.unsplash.com/photo-...",
				description: "Beautiful landscape",
				altDescription: "Mountain view",
				dateSaved: "2025-02-08T17:47:50.261Z",
				userId: 1,
				createdAt: "2025-02-08T17:47:50.261Z",
				updatedAt: "2025-02-08T17:47:50.261Z",
				tags: [
					{
						name: "nature",
					},
					{
						name: "mountain",
					},
				],
			},
			{
				id: 32,
				imageUrl: "https://images.unsplash.com/photo-...",
				description: "Beautiful233434landscape",
				altDescription: "monkey view",
				dateSaved: "2025-02-08T17:50:08.382Z",
				userId: 1,
				createdAt: "2025-02-08T17:50:08.382Z",
				updatedAt: "2025-02-08T17:50:08.382Z",
				tags: [
					{
						name: "immune",
					},
					{
						name: "mountain",
					},
					{
						name: "nature",
					},
					{
						name: "mountain",
					},
				],
			},
		];
		tag.findAll.mockResolvedValue([
			{
				name: "nature",
				photoId: [30, 32], // Ensure it matches the test data
			},
		]);
		photo.findAll.mockResolvedValue(mockResponse);
		await searchByTag(req, res);
		expect(res.json).toHaveBeenCalledWith(mockResponse);
		expect(res.status).toHaveBeenCalledWith(200);
	});

	it("should return 404 if tag not exist", async () => {
		const req = {
			query: {
				queryTag: "ngvg",
				sort: "ASC",
				userId: 2,
			},
		};
		const res = { json: jest.fn(), status: jest.fn(() => res) };
		tag.findAll.mockResolvedValue([]);
		await searchByTag(req, res);
		expect(res.status).toHaveBeenCalledWith(404);
		expect(res.json).toHaveBeenCalledWith({ message: "Tag not found." });
	});

	it("should return 500 for server error", async () => {
		const req = {
			query: {
				queryTag: "nature",
				sort: "ASC",
				userId: 2,
			},
		};
		const res = { json: jest.fn(), status: jest.fn(() => res) };
		tag.findAll.mockRejectedValue(new Error("Server error"));

		await searchByTag(req, res);
		expect(res.json).toHaveBeenCalledWith({ message: "Internal server error" });
		expect(res.status).toHaveBeenCalledWith(500);
	});
});

describe("User Controller's getSearchHistory", () => {
	it("should return 400 for invalid userId", async () => {
		const req = {
			query: {},
		};
		const res = { json: jest.fn(), status: jest.fn(() => res) };
		await getSearchHistory(req, res);
		expect(res.json).toHaveBeenCalledWith({
			message: "User Id is required. And it should be a number.",
		});
		expect(res.status).toHaveBeenCalledWith(400);
	});

	it("should return 404 for no history data", async () => {
		const req = {
			query: {
				userId: 1,
			},
		};
		const res = { json: jest.fn(), status: jest.fn(() => res) };
		searchHistory.findAll.mockResolvedValue([]);
		await getSearchHistory(req, res);
		expect(res.json).toHaveBeenCalledWith({
			message: "No search history found for the user.",
		});
		expect(res.status).toHaveBeenCalledWith(404);
	});

	it("should return 200 when getting user history", async () => {
		const req = {
			query: {
				userId: 1,
			},
		};
		const res = { json: jest.fn(), status: jest.fn(() => res) };
		const mockResponse = [
			{
				query: "mountain",
				timestamp: "2025-02-08T17:40:01.614Z",
			},
			{
				query: "mountain",
				timestamp: "2025-02-08T17:44:54.712Z",
			},
			{
				query: "mountain",
				timestamp: "2025-02-08T17:45:36.722Z",
			},
			{
				query: "mountain",
				timestamp: "2025-02-08T17:48:03.178Z",
			},
			{
				query: "mountain",
				timestamp: "2025-02-08T17:49:11.905Z",
			},
			{
				query: "mountain",
				timestamp: "2025-02-08T17:50:16.190Z",
			},
			{
				query: "mountain",
				timestamp: "2025-02-08T17:55:30.561Z",
			},
			{
				query: "mountain",
				timestamp: "2025-02-08T17:57:51.194Z",
			},
			{
				query: "mountain",
				timestamp: "2025-02-08T17:59:29.788Z",
			},
			{
				query: "mountain",
				timestamp: "2025-02-08T18:02:25.937Z",
			},
			{
				query: "mountain",
				timestamp: "2025-02-08T18:02:43.086Z",
			},
			{
				query: "mountain",
				timestamp: "2025-02-08T18:05:54.727Z",
			},
			{
				query: "mountain",
				timestamp: "2025-02-08T18:06:47.977Z",
			},
			{
				query: "mountain",
				timestamp: "2025-02-08T18:08:48.655Z",
			},
			{
				query: "mountain",
				timestamp: "2025-02-09T12:18:00.905Z",
			},
			{
				query: "mountain",
				timestamp: "2025-02-09T12:19:40.575Z",
			},
			{
				query: "mountain",
				timestamp: "2025-02-09T12:22:32.825Z",
			},
			{
				query: "mountain",
				timestamp: "2025-02-09T13:02:13.912Z",
			},
			{
				query: "mountain",
				timestamp: "2025-02-09T13:03:22.201Z",
			},
			{
				query: "mountain",
				timestamp: "2025-02-09T13:04:13.039Z",
			},
			{
				query: "mountain",
				timestamp: "2025-02-09T13:10:17.740Z",
			},
			{
				query: "mountain",
				timestamp: "2025-02-09T13:11:28.681Z",
			},
			{
				query: "mountain",
				timestamp: "2025-02-10T05:46:15.892Z",
			},
			{
				query: "mountain",
				timestamp: "2025-02-10T05:49:50.639Z",
			},
			{
				query: "mountain",
				timestamp: "2025-02-10T05:51:03.015Z",
			},
			{
				query: "mountain",
				timestamp: "2025-02-10T05:52:24.352Z",
			},
			{
				query: "mountain",
				timestamp: "2025-02-10T05:54:17.096Z",
			},
			{
				query: "mountain",
				timestamp: "2025-02-10T05:56:29.472Z",
			},
			{
				query: "mountain",
				timestamp: "2025-02-10T05:59:17.403Z",
			},
			{
				query: "mountain",
				timestamp: "2025-02-10T06:05:33.666Z",
			},
			{
				query: '"',
				timestamp: "2025-02-10T06:21:29.842Z",
			},
			{
				query: "apha",
				timestamp: "2025-02-10T06:22:07.660Z",
			},
			{
				query: "apha",
				timestamp: "2025-02-10T06:22:59.785Z",
			},
			{
				query: "123",
				timestamp: "2025-02-10T06:24:10.049Z",
			},
			{
				query: "123",
				timestamp: "2025-02-10T06:25:02.188Z",
			},
			{
				query: "mountain",
				timestamp: "2025-02-10T06:25:14.146Z",
			},
			{
				query: "mountain",
				timestamp: "2025-02-12T09:20:11.346Z",
			},
			{
				query: "mountain",
				timestamp: "2025-02-12T09:25:39.171Z",
			},
		];
		searchHistory.findAll.mockResolvedValue(mockResponse);

		await getSearchHistory(req, res);
		expect(res.json).toHaveBeenCalledWith(mockResponse);
		expect(res.status).toHaveBeenCalledWith(200);
	});

	it("should return 500 for server error", async () => {
		const req = {
			query: {
				userId: 1,
			},
		};
		const res = { json: jest.fn(), status: jest.fn(() => res) };

		searchHistory.findAll.mockRejectedValue(new Error("Server error"));
		await getSearchHistory(req, res);
		expect(res.json).toHaveBeenCalledWith({
			message: "Internal server error",
			error: "Server error",
		});
		expect(res.status).toHaveBeenCalledWith(500);
	});
});
