# AWS S3 Integration Guide for LMS Platform

## What is AWS S3?

AWS S3 (Simple Storage Service) is a cloud storage solution perfect for storing your LMS files like course thumbnails, video lessons, PDF documents, and user uploads. It's scalable, secure, and cost-effective.

## Why Use AWS S3?

**Benefits:**
- Pay only for what you use (around $0.023 per GB)
- Handle unlimited file sizes and traffic
- Fast global delivery with CloudFront CDN
- Built-in security and encryption
- 99.99% uptime guarantee

**Free Tier (First 12 Months):**
- 5GB of storage - FREE
- 20,000 file downloads - FREE
- 2,000 file uploads - FREE

---

## Step 1: Create Your AWS Account

1. Visit https://aws.amazon.com
2. Click "Create an AWS Account"
3. Follow the signup process (you'll need a credit card, but the free tier is available)
4. Complete email verification

---

## Step 2: Create an S3 Bucket

Think of a bucket as a folder in the cloud where all your files will be stored.

**Instructions:**

1. Log into AWS Console
2. Search for "S3" in the top search bar
3. Click "Create bucket"
4. Enter a bucket name (must be unique globally):
   - Example: `lms-platform-files-yourname`
5. Choose your region (pick the closest to your users):
   - For India: `ap-south-1`
   - For US: `us-east-1`
6. Keep "Block Public Access" enabled (we'll use secure URLs)
7. Click "Create bucket"

**Configure CORS (Cross-Origin Resource Sharing):**

This allows your website to upload files to S3.

1. Go to your bucket
2. Click the "Permissions" tab
3. Scroll to "CORS" section
4. Click "Edit"
5. Paste this configuration:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": [
            "http://localhost:5173",
            "https://your-production-domain.com"
        ],
        "ExposeHeaders": ["ETag"]
    }
]
```

6. Click "Save changes"

---

## Step 3: Create Access Keys

You need special keys to let your application upload files to S3.

**Create an IAM User:**

1. Go to "IAM" service (search in top bar)
2. Click "Users" in the left menu
3. Click "Create user"
4. Enter username: `lms-s3-uploader`
5. Click "Next"

**Set Permissions:**

1. Select "Attach policies directly"
2. Search for "AmazonS3FullAccess"
3. Check the box next to it
4. Click "Next"
5. Click "Create user"

**Get Your Access Keys:**

1. Click on the user you just created
2. Go to "Security credentials" tab
3. Scroll to "Access keys" section
4. Click "Create access key"
5. Select "Application running outside AWS"
6. Click "Next"
7. Click "Create access key"

**IMPORTANT:** Save these keys somewhere safe (you won't see them again):
- Access Key ID: Starts with `AKIA...`
- Secret Access Key: Long random string

---

## Step 4: Install AWS SDK in Your Project

Open your terminal in the backend folder and run:

```bash
cd backend
npm install aws-sdk
```

---

## Step 5: Configure Your Backend

**Add to your `.env` file:**

Open `backend/.env` and add these lines:

```
AWS_ACCESS_KEY_ID=AKIA...your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=ap-south-1
AWS_S3_BUCKET=lms-platform-files-yourname
```

**Add to `env.example` too:**

```
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=ap-south-1
AWS_S3_BUCKET=your_bucket_name
```

---

## Step 6: Create S3 Service File

Create a new file: `backend/services/s3Service.js`

This file handles all file uploads and deletions. The code is ready to use - just copy it from the technical guide or I can help you create it.

---

## Step 7: Update Your Course Controller

Modify your course creation to upload thumbnails to S3 instead of local storage.

The changes are simple:
1. Import the S3 service
2. Upload file to S3 when creating a course
3. Delete file from S3 when deleting a course

---

## Step 8: Deploy to Render

When you deploy your backend to Render, add these environment variables:

1. Go to Render Dashboard
2. Select your backend service
3. Go to "Environment" tab
4. Add these variables:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_REGION`
   - `AWS_S3_BUCKET`
5. Click "Save Changes"

Render will automatically redeploy with the new settings.

---

## Cost Breakdown

**Example Monthly Usage:**
- Store 10GB of files: $0.23
- 5,000 file uploads: $0.03
- 50,000 file downloads: $0.02
- 100GB data transfer: $9.00

**Total: About $9.30 per month**

**With Free Tier (First Year):**
- First 5GB: FREE
- First 20,000 downloads: FREE
- First 2,000 uploads: FREE

---

## Common Issues and Solutions

**Problem: "Access Denied" error**
- Check that your access keys are correct in `.env`
- Verify the IAM user has S3 permissions
- Make sure CORS is configured in your bucket

**Problem: "File too large" error**
- Increase the file size limit in your upload middleware
- For very large files (over 100MB), use multipart upload

**Problem: Slow uploads**
- Consider using CloudFront CDN for faster delivery
- Enable direct browser-to-S3 uploads with presigned URLs

---

## Optional: Add CloudFront CDN

CloudFront makes file delivery faster and cheaper by caching files at edge locations worldwide.

**Benefits:**
- Faster file downloads for users globally
- Lower bandwidth costs
- Support for custom domains

**Setup:**
1. Go to CloudFront service in AWS
2. Click "Create distribution"
3. Select your S3 bucket as the origin
4. Click "Create distribution"
5. Use the CloudFront URL instead of S3 URL in your app

---

## Next Steps

1. Create AWS account ✓
2. Create S3 bucket ✓
3. Create IAM user and get access keys ✓
4. Install AWS SDK ✓
5. Add environment variables ✓
6. Create S3 service file
7. Update course controller
8. Test uploads locally
9. Deploy to Render

**Need help with the code implementation?** Let me know and I'll help you set it up!

---

**Last Updated:** December 2025
