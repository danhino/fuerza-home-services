import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'fuerza-photos';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || '';

let s3Client: S3Client | null = null;

function getR2Client(): S3Client {
    if (!s3Client) {
        s3Client = new S3Client({
            region: 'auto',
            endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: R2_ACCESS_KEY_ID,
                secretAccessKey: R2_SECRET_ACCESS_KEY,
            },
        });
    }
    return s3Client;
}

/**
 * Upload a photo buffer to R2.
 * @returns The full public URL of the uploaded photo.
 */
export async function uploadPhoto(
    file: Buffer,
    key: string,
    mimeType: string
): Promise<string> {
    const client = getR2Client();

    await client.send(
        new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
            Body: file,
            ContentType: mimeType,
        })
    );

    return `${R2_PUBLIC_URL}/${key}`;
}

/**
 * Delete a photo from R2.
 */
export async function deletePhoto(key: string): Promise<void> {
    const client = getR2Client();
    await client.send(
        new DeleteObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
        })
    );
}

/**
 * Generate a pre-signed upload URL for direct mobile → R2 uploads (future use).
 */
export async function generatePresignedUploadUrl(key: string): Promise<string> {
    const client = getR2Client();
    const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
    });
    return getSignedUrl(client, command, { expiresIn: 3600 });
}
