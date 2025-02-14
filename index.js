const express = require("express");
const cors = require("cors");
const db = require("./models/index");
const app = express();
app.use(express.json());
app.use(cors());
const {
	createNewUser,
	searchImages,
	savedPhoto,
	addTagsByPhotoId,
	getPhotoFromDb,
	searchByTag,
	getSearchHistory,
} = require("./controllers/userController");

db.sequelize
	.authenticate()
	.then(() => {
		console.log("Connection has been established successfully.");
	})
	.catch((err) => {
		console.error("Unable to connect to the database:", err);
	});

//step 1: Define a new POST endpoint which will be responsible for creating new users in the DB
app.post("/api/users", createNewUser);
app.get("/api/photos/search", searchImages);
app.post("/api/photos", savedPhoto);
app.post("/api/photos/:photoId/tags", addTagsByPhotoId);
app.get("/api/photos/:photoId", getPhotoFromDb);
app.get("/api/photos/tag/search", searchByTag);
app.get("/api/search-history", getSearchHistory);

const port = 3000;
app.listen(port, () => {
	console.log(`Server is started at port ${port}.`);
});
