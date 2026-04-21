import { PrismaClient } from '@prisma/client';
import { sendPushNotification } from './firebase.service';

const prisma = new PrismaClient();

/**
 * Send push notifications to online technicians about a new job.
 * Fire-and-forget — never await this in a request handler.
 */
export const sendNewJobAlert = async (
    technicianUserIds: string[],
    job: any
): Promise<void> => {
    if (technicianUserIds.length === 0) return;

    const technicians = await prisma.user.findMany({
        where: {
            id: { in: technicianUserIds },
            pushToken: { not: null },
        },
        select: { id: true, pushToken: true, preferredLanguage: true },
    });

    const notifications = technicians.map((tech) => {
        const isSpanish = tech.preferredLanguage === 'es';
        const title = isSpanish ? '¡Nueva Solicitud!' : 'New Job Request!';
        const price = job.serviceFee ?? job.estimateLow ?? '';
        const body = isSpanish
            ? `${job.trade} • ${job.address} • $${price}`
            : `${job.trade} • ${job.address} • $${price}`;

        return sendPushNotification(
            tech.pushToken!,
            title,
            body,
            { jobId: job.id, screen: 'job-detail' }
        );
    });

    await Promise.allSettled(notifications);
};

/**
 * Send a push notification to a user about a job status change.
 * Fire-and-forget — never await this in a request handler.
 */
export const sendJobStatusAlert = async (
    userId: string,
    status: string,
    jobId: string
): Promise<void> => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { pushToken: true, preferredLanguage: true },
    });
    if (!user?.pushToken) return;

    const isSpanish = user.preferredLanguage === 'es';
    const statusMessages: Record<string, { en: string; es: string }> = {
        MATCHED: { en: 'Technician found!', es: '¡Técnico encontrado!' },
        EN_ROUTE: { en: 'Technician is on the way', es: 'Técnico en camino' },
        ARRIVED: { en: 'Technician has arrived', es: 'Técnico ha llegado' },
        COMPLETED: { en: 'Job complete!', es: '¡Trabajo completado!' },
    };
    const msg = statusMessages[status];
    if (!msg) return;

    const screen = status === 'MATCHED' ? 'job-accepted' : 'tracking';

    await sendPushNotification(
        user.pushToken,
        isSpanish ? msg.es : msg.en,
        isSpanish ? `ID de trabajo: ${jobId}` : `Job ID: ${jobId}`,
        { jobId, screen }
    );
};
