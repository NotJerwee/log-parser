import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
	region: process.env.AWS_REGION,
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
	},
});

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url);
	const filename = searchParams.get("filename");

	if (!filename) {
		return new Response(JSON.stringify({ error: "Missing filename" }), { status: 400 });
	}

	try {
		const command = new GetObjectCommand({
			Bucket: process.env.AWS_BUCKET_NAME,
			Key: `results/${filename.replace('.log', '.json')}`,
		});

		const url = await getSignedUrl(s3, command, { expiresIn: 60 });
		return new Response(JSON.stringify({ url }));
	} catch (err) {
		console.error("Error generating presigned URL:", err);
		return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
	}
} 