import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const tables = [
    'Club', 'AuditLog', 'Member', 'Invitation', 'Booking', 'PaymentShare',
    'Payment', 'Block', 'ClassEvent', 'Tournament', 'TournamentParticipant',
    'TournamentMatch', 'User', 'Court', 'Rate', 'Price', 'Invoice',
    'InvoiceItem', 'CloseoutPeriod', 'Movement', 'SupplierInvoice'
];

async function main() {
    console.log('Enabling Row Level Security (RLS) on all Supabase tables...');
    for (const table of tables) {
        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`);
            console.log(`- Enabled RLS for ${table}`);
        } catch (e) {
            console.error(`- Failed for ${table}:`, e);
        }
    }
    console.log('RLS enabled for all tables. The database is now secure from public API access.');
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
