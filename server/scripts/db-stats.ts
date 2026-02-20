import { prisma } from "../src/db/prisma.js";

async function main() {
    console.log("--- Global DB Stats ---");
    const clubs = await prisma.club.count();
    const users = await prisma.user.count();
    const members = await prisma.member.count();
    const tournaments = await prisma.tournament.count();
    const bookings = await prisma.booking.count();
    const courts = await prisma.court.count();

    console.log(`Clubs: ${clubs}`);
    console.log(`Users: ${users}`);
    console.log(`Members: ${members}`);
    console.log(`Tournaments: ${tournaments}`);
    console.log(`Bookings: ${bookings}`);
    console.log(`Courts: ${courts}`);

    if (clubs > 0) {
        const lastClub = await prisma.club.findFirst({ orderBy: { created_at: 'desc' } });
        console.log(`Last Club Created: ${lastClub?.legal_name} (${lastClub?.id})`);
    }

    const clubsList = await prisma.club.findMany({
        select: { id: true, legal_name: true, _count: { select: { members: true, bookings: true } } }
    });
    console.log("\nClubs details:");
    console.table(clubsList);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
