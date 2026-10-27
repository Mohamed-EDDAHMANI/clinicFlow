import { z } from 'zod';
import db from '../config/db.js';
import userModel from '../models/userModel.js';
import { ROLES } from '../config/permissions.js';
import { name, email, password } from '../validations/authValidation.js';

const adminSchema = z.object({
    ADMIN_NAME: name,
    ADMIN_EMAIL: email,
    ADMIN_PASSWORD: password,
});

const seedAdmin = async () => {
    const result = adminSchema.safeParse(process.env);

    if (!result.success) {
        console.error('Invalid admin variables in .env:');
        for (const issue of result.error.issues) {
            console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
        }
        process.exitCode = 1;
        return;
    }

    const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = result.data;

    const existing = await userModel.findOne(ADMIN_EMAIL);
    if (existing) {
        console.log(`Admin already exists: ${ADMIN_EMAIL}`);
        return;
    }

    const id = await userModel.createUser({
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        role: ROLES.ADMIN,
    });

    console.log(`Admin created: ${ADMIN_EMAIL} (id ${id})`);
};

try {
    await seedAdmin();
} catch (error) {
    console.error('Seed failed:', error);
    process.exitCode = 1;
} finally {
    await db.end();
}
