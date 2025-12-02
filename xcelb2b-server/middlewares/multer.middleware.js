import multer from "multer";
import sharp from "sharp";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import s3client from "../utils/s3client.js";

const storage = multer.memoryStorage();
const upload = multer({ storage });

const processAndUploadImage = async (file) => {
  const { originalname, buffer } = file;
  const filename = `${process.env.UPLOAD_FOLDER}/${Date.now()}-${originalname
    .toLowerCase()
    .split(" ")
    .join("-")}`;

  try {
    const processedBuffer = await sharp(buffer)
      .resize(800)
      .jpeg({ quality: 80 })
      .toBuffer();

    await s3client.send(
      new PutObjectCommand({
        Bucket: process.env.SPACES_BUCKET,
        Key: filename,
        Body: processedBuffer,
        ACL: "public-read",
        ContentType: "image/jpeg",
      })
    );

    return filename;
  } catch (error) {
    console.error("Image processing/upload failed:", error);
    throw error;
  }
};

const compressImage = async (req, res, next) => {
  if (!req.files && !req.file) return next();

  try {
    // Handle single file upload (for subcategories)
    if (req.file) {
      req.file.filename = await processAndUploadImage(req.file);
    }

    // Handle multiple files upload (for products)
    if (req.files) {
      if (req.files.image) {
        req.files.image[0].filename = await processAndUploadImage(
          req.files.image[0]
        );
      }

      if (req.files.images) {
        await Promise.all(
          req.files.images.map(async (file, index) => {
            req.files.images[index].filename = await processAndUploadImage(
              file
            );
          })
        );
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

export { upload, compressImage };
