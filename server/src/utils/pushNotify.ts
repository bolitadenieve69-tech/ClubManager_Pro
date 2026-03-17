import webpush from 'web-push';
import { prisma } from '../db/prisma.js';
import { env } from './env.js';

if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        env.VAPID_EMAIL,
        env.VAPID_PUBLIC_KEY,
        env.VAPID_PRIVATE_KEY
    );
}

export interface PushPayload {
    title: string;
    body: string;
    url?: string;
}

export async function notifyClub(clubId: string, payload: PushPayload) {
    if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) return;

    const subs = await prisma.pushSubscription.findMany({ where: { club_id: clubId } });
    if (subs.length === 0) return;

    const results = await Promise.allSettled(
        subs.map(sub =>
            webpush.sendNotification(
                { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                JSON.stringify(payload)
            )
        )
    );

    // Remove stale subscriptions (410 Gone or 404)
    for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result.status === 'rejected') {
            const err = result.reason as any;
            if (err?.statusCode === 410 || err?.statusCode === 404) {
                await prisma.pushSubscription.deleteMany({
                    where: { endpoint: subs[i].endpoint }
                }).catch(() => {});
            }
        }
    }
}
