
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Checking DB counts...");
        const clubs = await prisma.club.count();
        const users = await prisma.user.count();
        const members = await prisma.member.count();
        const tournaments = await prisma.tournament.count();

        console.log(`Clubs: ${clubs}`);
        console.log(`Users: ${users}`);
        console.log(`Members: ${members}`);
        console.log(`Tournaments: ${tournaments}`);

        const clubsList = await prisma.club.findMany({
            select: { id: true, legal_name: true }
        });
        console.log("Clubs List:", JSON.stringify(clubsList, null, 2));

        const usersList = await prisma.user.findMany({
            select: { email: true, club_id: true }
        });
        console.log("Users List:", JSON.stringify(usersList, null, 2));

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
