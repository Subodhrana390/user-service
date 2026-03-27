import { v2 as cloudinary } from "cloudinary";
import { config } from "./index.js";

cloudinary.config({
    cloud_name: config.cloudinary.cloudname,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.api_secret,
});

export default cloudinary;
