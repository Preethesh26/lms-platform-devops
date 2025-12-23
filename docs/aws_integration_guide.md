# AWS Integration Guide for LMS Platform

## Overview

AWS S3 is ideal for storing and serving your LMS files:
- **Course Thumbnails** (images)
- **Video Lessons** (large video files)
- **Documents** (PDFs, materials)
- **User Uploads** (assignments, profiles)

## Benefits

✅ **Scalable**: Handle unlimited file sizes and traffic  
✅ **Cost-effective**: Pay only for what you use (~$0.023/GB)  
✅ **Fast**: Global CDN with CloudFront  
✅ **Secure**: Fine-grained access control  
✅ **Reliable**: 99.99% uptime guarantee

---

## Step 1: Create AWS Account

1. Go to https://aws.amazon.com
2. Click **Create an AWS Account**
3. Follow the signup process (requires credit card but has free tier)

### AWS Free Tier Includes:
- **5GB** S3 storage
- **20,000** GET requests
- **2,000** PUT requests
- Valid for **12 months**

---

## Step 2: Create S3 Bucket

### 2.1 Navigate to S3
1. Login to AWS Console
2. Search for **"S3"** in the search bar
3. Click **Create bucket**

### 2.2 Configure Bucket
- **Bucket name**: `lms-platform-files` (must be globally unique)
- **Region**: Choose closest to your users (e.g., `ap-south-1` for India)
- **Block Public Access**: Keep enabled (we'll use signed URLs)
- Click **Create bucket**

### 2.3 Configure CORS
1. Go to your bucket → **Permissions** tab
2. Scroll to **CORS** section
3. Click **Edit** and paste:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": ["http://localhost:5173", "https://your-production-domain.com"],
        "ExposeHeaders": ["ETag"]
    }
]
```

---

## Step 3: Create IAM User

### 3.1 Create User
1. Go to **IAM** service
2. Click **Users** → **Create user**
3. Username: `lms-s3-uploader`
4. Check **Provide user access to AWS Management Console** (optional)
5. Click **Next**

### 3.2 Set Permissions
1. Select **Attach policies directly**
2. Search and check **AmazonS3FullAccess** (or create custom policy below)
3. Click **Next** → **Create user**

### 3.3 Custom Policy (Recommended - More Secure)
Instead of full access, create a custom policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::lms-platform-files",
                "arn:aws:s3:::lms-platform-files/*"
            ]
        }
    ]
}
```

### 3.4 Get Access Keys
1. Go to the user you created
2. Click **Security credentials** tab
3. Scroll to **Access keys**
4. Click **Create access key**
5. Select **Application running on AWS compute service** or **Other**
6. Click **Create**
7. **SAVE THESE KEYS** (you won't see them again):
   - Access Key ID: `AKIA...`
   - Secret Access Key: `wJalrXUtn...`

---

## Step 4: Install AWS SDK

```bash
cd backend
npm install aws-sdk
```

---

## Step 5: Configure Backend

### 5.1 Add to `.env`

```bash
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=AKIA...your_access_key
AWS_SECRET_ACCESS_KEY=wJalrXUtn...your_secret_key
AWS_REGION=ap-south-1
AWS_S3_BUCKET=lms-platform-files
```

### 5.2 Add to `env.example`

```bash
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=ap-south-1
AWS_S3_BUCKET=your_bucket_name
```

### 5.3 Create `services/s3Service.js`

```javascript
const AWS = require('aws-sdk');

// Configure AWS
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET;

// Upload file to S3
const uploadFile = async (file, folder = 'uploads') => {
    const key = `${folder}/${Date.now()}-${file.originalname}`;
    
    const params = {
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read' // Or 'private' for signed URLs
    };

    const result = await s3.upload(params).promise();
    return result.Location; // Returns the file URL
};

// Delete file from S3
const deleteFile = async (fileUrl) => {
    const key = fileUrl.split('.com/')[1]; // Extract key from URL
    
    const params = {
        Bucket: BUCKET_NAME,
        Key: key
    };

    await s3.deleteObject(params).promise();
};

// Get signed URL (for private files)
const getSignedUrl = (key, expiresIn = 3600) => {
    const params = {
        Bucket: BUCKET_NAME,
        Key: key,
        Expires: expiresIn // URL valid for 1 hour
    };

    return s3.getSignedUrl('getObject', params);
};

module.exports = {
    uploadFile,
    deleteFile,
    getSignedUrl
};
```

---

## Step 6: Update Course Controller

### Modify `controllers/courseController.js`

```javascript
const { uploadFile, deleteFile } = require('../services/s3Service');

// In your create course function
exports.createCourse = async (req, res) => {
    try {
        // ... other code ...

        // Upload thumbnail to S3
        let thumbnailUrl = null;
        if (req.file) {
            thumbnailUrl = await uploadFile(req.file, 'thumbnails');
        }

        const course = await Course.create({
            ...req.body,
            thumbnail: thumbnailUrl
        });

        res.status(201).json({ success: true, data: course });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// In your delete course function
exports.deleteCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        
        // Delete thumbnail from S3
        if (course.thumbnail) {
            await deleteFile(course.thumbnail);
        }

        await course.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
```

---

## Step 7: Update Multer Configuration

### Modify your upload middleware

```javascript
const multer = require('multer');

// Use memory storage instead of disk
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept images and videos
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'), false);
        }
    }
});

module.exports = upload;
```

---

## Step 8: Add to Render Environment

In Render Dashboard → Environment:

```
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=wJalrXUtn...
AWS_REGION=ap-south-1
AWS_S3_BUCKET=lms-platform-files
```

---

## Advanced: Add CloudFront CDN (Optional)

### Benefits:
- **Faster delivery** via global edge locations
- **Lower costs** (cheaper than S3 direct access)
- **Custom domain** support

### Setup:
1. Go to **CloudFront** service
2. Click **Create distribution**
3. Origin domain: Select your S3 bucket
4. Create distribution
5. Use the CloudFront URL instead of S3 URL

---

## Cost Estimation

### Example Usage (Monthly):
- **Storage**: 10GB = $0.23
- **Uploads**: 5,000 PUT requests = $0.03
- **Downloads**: 50,000 GET requests = $0.02
- **Data transfer**: 100GB = $9.00

**Total**: ~$9.30/month

### Free Tier (First 12 months):
- First 5GB storage: **FREE**
- First 20,000 GET requests: **FREE**
- First 2,000 PUT requests: **FREE**

---

## Troubleshooting

### Issue: "Access Denied"
- Check IAM permissions
- Verify bucket CORS configuration
- Ensure access keys are correct

### Issue: "File too large"
- Increase Multer limit
- Consider multipart upload for large files

### Issue: "Slow uploads"
- Use CloudFront
- Consider direct browser → S3 uploads with presigned URLs

---

## Next Steps

1. ✅ Create AWS account
2. ✅ Create S3 bucket
3. ✅ Create IAM user and get keys
4. ✅ Install AWS SDK
5. ✅ Configure environment variables
6. ✅ Create S3 service file
7. ✅ Update course controller
8. ✅ Test uploads locally
9. ✅ Deploy to Render

**Ready to start?** Let me know if you need help with any step!
