const axios = require("axios");
//validated
if (!process.env.UNSPLASH_ACCESS_KEY) {
	console.log("UNSPLASH_ACCESS_KEY is missing in .env file");
	process.exit(1); //application exit
}

//axiosInstance
const axiosInstance = axios.create({
	baseURL: "https://api.unsplash.com",
	headers: {
		Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
	},
});

module.exports = { axiosInstance };
