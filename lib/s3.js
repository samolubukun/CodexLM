import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
    endpoint: process.env.SPACES_ENDPOINT,
    region: process.env.SPACES_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.SPACES_KEY,
        secretAccessKey: process.env.SPACES_SECRET,
    },
});

export async function uploadFile(file, key) {
    const command = new PutObjectCommand({
        Bucket: process.env.SPACES_BUCKET,
        Key: key,
        Body: file,
        ACL: "public-read",
    });

    await s3Client.send(command);
    // Strip the https:// from the endpoint for URL construction
    const endpoint = process.env.SPACES_ENDPOINT?.replace("https://", "") || "";
    return `https://${process.env.SPACES_BUCKET}.${endpoint}/${key}`;
}

export async function getPresignedUrl(key) {
    const command = new GetObjectCommand({
        Bucket: process.env.SPACES_BUCKET,
        Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}
