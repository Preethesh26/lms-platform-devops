# Mock Payment Implementation Plan

## Goal
Replace Razorpay with a simulated "Mock Payment" system. Students must "pay" (simulate transaction) to enroll and access course content.

## Changes

### Backend

#### 1. Payment Controller (`backend/controllers/paymentController.js`)
- **Remove** Razorpay dependency
- **Update** `createOrder`: Create a local payment record directly
- **Update** `verifyPayment`: Verify the mock transaction ID

#### 2. Payment Model (`backend/models/Payment.js`)
- Remove `razorpayOrderId`, `razorpayPaymentId`, `razorpaySignature`
- Add `transactionId` (internal mock ID)

### Frontend

#### 1. Course Player (`src/pages/user/CoursePlayer.tsx`)
- **Remove** Razorpay script usage
- **Add** Mock Payment Dialog
    - Show "Processing Payment..." spinner
    - Simulate 2-second delay
    - Show "Payment Successful" message
- **Update** Payment Handler to call backend mock endpoints

#### 2. API (`src/lib/api.ts`)
- Update payment endpoints to match new mock controller structure

## User Flow
1. Student clicks "Buy Now"
2. "Processing Payment..." dialog appears
3. After 2 seconds -> "Payment Successful!"
4. Student is enrolled and course unlocks

## Benefits
- No API keys required
- No external dependencies
- Works offline/locally
- Perfect for demonstration
