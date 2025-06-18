import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createLead({ name, phone, source, message }) {
    try {
        const lead = await prisma.lead.create({
            data: {
                name,
                phone,
                source,
                message,
            },
        });
        return lead;
    } catch (error) {
        if (error.code === 'P2002' && error.meta?.target?.includes('phone')) {
            throw new Error('A lead with this phone number already exists');
        }
        if (error.message.includes('connect')) {
            throw new Error('Database connection error');
        }
        throw new Error(`Failed to create lead: ${error.message}`);
    } finally {
        await prisma.$disconnect();
    }
}

async function testCreateLead() {
    try {
        const result = await createLead({
            name: 'Rohit Sharma',
            phone: '1234567890',
            source: 'Website',
            message: 'Interested in property',
        });
        console.log('Lead created:', result);
    } catch (err) {
        console.error('Error creating lead:', err.message);
    }
}

// testCreateLead();
