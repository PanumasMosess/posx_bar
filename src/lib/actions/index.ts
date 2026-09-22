"use server";

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import { KEYUTIL, KJUR, stob64, hextorstr } from "jsrsasign";

const s3Client = new S3Client({
  endpoint: process.env.ENDPOINT!,
  region: process.env.REGION!,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.KEY!,
    secretAccessKey: process.env.SECRET_KEY!,
  },
});

export const deleteFileS3 = async (key: string) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
    });

    await s3Client.send(command);

    return { success: true, message: "ลบไฟล์สำเร็จ" };
  } catch (error) {
    return { success: false, error: error };
  }
};

export const getS3KeyFromUrl = async (url: string) => {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    return decodeURIComponent(urlObj.pathname.substring(1));
  } catch (e) {
    return null;
  }
};

export const sendbase64toS3DataMultifile = async (
  base64Data: string,
  path: string,
  contentType: string = "image/png",
) => {
  try {
    const buffer = Buffer.from(base64Data, "base64");

    const extension = contentType.split("/")[1] || "png";

    const randomBytes = crypto.randomBytes(16);
    const key = `uploads/${path}/${randomBytes.toString("hex")}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: "public-read",
    });

    const data = await s3Client.send(command);

    let publicUrl;
    if (data) {
      publicUrl = `https://sgp1.digitaloceanspaces.com/${process.env.S3_BUCKET}/${key}`;
    }

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error("Error uploading Base64 file:", error);
    return { success: false, error: "Failed to upload file." };
  }
};
