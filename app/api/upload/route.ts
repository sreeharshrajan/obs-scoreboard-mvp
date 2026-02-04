import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';
import { verifyRequest } from '@/lib/auth/verifyRequest';

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
    try {
        await verifyRequest(req);

        let folder = 'obs-scoreboard-users';
        try {
            const body = await req.json();
            if (body?.folder) folder = body.folder;
        } catch (e) {
            // No body or invalid JSON, use default
        }

        // Get the timestamp
        const timestamp = Math.round((new Date()).getTime() / 1000);

        // Generate the signature
        const signature = cloudinary.utils.api_sign_request({
            timestamp: timestamp,
            folder: folder,
        }, process.env.CLOUDINARY_API_SECRET || '');

        return NextResponse.json({
            signature,
            timestamp,
            cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
            apiKey: process.env.CLOUDINARY_API_KEY
        });
    } catch (error) {
        return NextResponse.json({ error: 'Unauthorized or Failed to generate signature' }, { status: 401 });
    }
}
