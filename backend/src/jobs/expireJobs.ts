import cron from 'node-cron';
import { PrismaClient, JobStatus } from '@prisma/client';
import { sendPushNotification } from '../services/firebase.service';

const prisma = new PrismaClient();

/**
 * Every 5 minutes, expire REQUESTED jobs whose expiresAt has passed
 * and notify the customer (in their preferred language).
 */
export function startExpiryJob() {
    cron.schedule('*/5 * * * *', async () => {
        try {
            const now = new Date();

            const expiredJobs = await prisma.job.findMany({
                where: {
                    status: JobStatus.REQUESTED,
                    expiresAt: { lt: now },
                },
                include: {
                    customer: {
                        include: {
                            user: { select: { pushToken: true, preferredLanguage: true } },
                        },
                    },
                },
            });

            for (const job of expiredJobs) {
                await prisma.job.update({
                    where: { id: job.id },
                    data: { status: JobStatus.EXPIRED },
                });

                const customerUser = job.customer.user;
                if (customerUser.pushToken) {
                    const isSpanish = customerUser.preferredLanguage === 'es';
                    await sendPushNotification(
                        customerUser.pushToken,
                        isSpanish ? 'Sin técnicos disponibles' : 'No technicians available',
                        isSpanish
                            ? 'No encontramos técnicos disponibles. Por favor intenta de nuevo.'
                            : 'No technicians were available for your request. Please try again.',
                        { jobId: job.id, screen: 'jobs' }
                    );
                }
            }

            if (expiredJobs.length > 0) {
                console.log(`[ExpireJobs] Expired ${expiredJobs.length} job(s)`);
            }
        } catch (error) {
            console.error('[ExpireJobs] Error expiring jobs:', error);
        }
    });
}
