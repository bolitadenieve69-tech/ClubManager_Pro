import { prisma } from "../db/prisma.js";

export async function createAuditLog(
    clubId: string,
    userId: string,
    action: string,
    resource: string,
    resourceId: string,
    details?: string
) {
    try {
        await prisma.auditLog.create({
            data: {
                club_id: clubId,
                user_id: userId,
                action,
                resource,
                resource_id: resourceId,
                details
            }
        });
    } catch (error) {
        console.error("Failed to create audit log:", error);
    }
}
