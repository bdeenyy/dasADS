import { NextResponse } from 'next/server';
import { createAvitoClient } from '@/lib/avito';
import { auth } from '@/lib/auth';

export async function GET() {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const client = await createAvitoClient(session.user.organizationId);
        const data = await client.getVacancies();
        return NextResponse.json(data);
    } catch (err: unknown) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
