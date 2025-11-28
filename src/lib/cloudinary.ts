export const getCloudinaryUrl = (publicId: string) => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    if (!cloudName) {
        console.error("Cloudinary cloud name is missing");
        return "";
    }
    return `https://res.cloudinary.com/${cloudName}/video/upload/${publicId}`;
};

export const getCloudinaryThumbnail = (publicId: string) => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    if (!cloudName) return "";
    return `https://res.cloudinary.com/${cloudName}/video/upload/w_300,h_200,c_fill/${publicId}.jpg`;
};
