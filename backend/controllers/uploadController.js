const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const path = require('path');
const fs = require('fs');

// Initialize S3 Client for Cloudflare R2
const s3Client = process.env.R2_ACCESS_KEY_ID ? new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
}) : null;

exports.uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload a file' });
        }

        const file = req.file;
        const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;

        // If Cloudflare R2 credentials are provided, upload to R2
        if (s3Client) {
            const uploadParams = {
                Bucket: process.env.R2_BUCKET_NAME,
                Key: `thumbnails/${fileName}`,
                Body: file.buffer,
                ContentType: file.mimetype,
            };

            await s3Client.send(new PutObjectCommand(uploadParams));

            // Generate public URL (either from a custom domain or the R2 public URL)
            const publicUrl = `${process.env.R2_PUBLIC_URL}/thumbnails/${fileName}`;

            return res.status(200).json({
                success: true,
                url: publicUrl,
                message: 'Uploaded to Cloudflare R2'
            });
        }

        // Fallback: Save locally if no R2 credentials
        // Note: Multer is configured to use memoryStorage if we want both, 
        // but for local fallback we need to write the buffer.
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const localFilePath = path.join(uploadDir, fileName);
        fs.writeFileSync(localFilePath, file.buffer);

        const host = req.get('host');
        const protocol = req.protocol;
        const url = `${protocol}://${host}/uploads/${fileName}`;

        res.status(200).json({
            success: true,
            url: url,
            message: 'Uploaded to local storage (No R2 credentials found)'
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ success: false, message: 'Server error during upload' });
    }
};
