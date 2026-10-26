/**
 * scripts/set-role.ts
 * Enterprise Role Provisioning Script for KLE Technological University
 * Sets cryptographically signed Firebase Custom Claims on user accounts.
 *
 * Usage:
 *   npx tsx scripts/set-role.ts <email-or-uid> <role>
 *   Roles: STUDENT | FACULTY | COE_AUTHOR
 *
 * Examples:
 *   npx tsx scripts/set-role.ts coe.sterling@university.edu COE_AUTHOR
 *   npx tsx scripts/set-role.ts eleanor.vance@university.edu FACULTY
 *   npx tsx scripts/set-role.ts alex.rivera@student.university.edu STUDENT
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth, type UserRecord } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin with project credentials
const projectId = process.env.FIREBASE_PROJECT_ID || 'ai-studio-ea8ff412-651d-4d93-9ef2-360585997684';

if (!getApps().length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      initializeApp({
        credential: cert(serviceAccount),
        projectId,
      });
    } else {
      initializeApp({
        projectId,
      });
    }
    console.log(`[Firebase Admin] Initialized for project: ${projectId}`);
  } catch (err: any) {
    console.error('[Firebase Admin Init Error]:', err.message);
  }
}

export type AcademicRole = 'STUDENT' | 'FACULTY' | 'COE_AUTHOR';

export async function setUserRole(identifier: string, roleInput: string): Promise<void> {
  const normalizedRole = roleInput.toUpperCase() as AcademicRole;
  const validRoles: AcademicRole[] = ['STUDENT', 'FACULTY', 'COE_AUTHOR'];

  if (!validRoles.includes(normalizedRole)) {
    throw new Error(`Invalid role '${roleInput}'. Must be one of: ${validRoles.join(', ')}`);
  }

  const auth = getAuth();
  let userRecord: UserRecord;

  try {
    if (identifier.includes('@')) {
      userRecord = await auth.getUserByEmail(identifier);
    } else {
      userRecord = await auth.getUser(identifier);
    }
  } catch (err: any) {
    if (err.code === 'auth/user-not-found') {
      console.log(`User '${identifier}' not found in Firebase Auth. Creating user record...`);
      userRecord = await auth.createUser({
        email: identifier.includes('@') ? identifier : `${identifier}@university.edu`,
        displayName: identifier.split('@')[0],
      });
    } else {
      throw err;
    }
  }

  // Set Firebase Custom Claims
  await auth.setCustomUserClaims(userRecord.uid, {
    role: normalizedRole,
    assignedAt: new Date().toISOString(),
    institution: 'KLE Technological University',
  });

  console.log(`Successfully assigned custom claim { role: '${normalizedRole}' } to user ${userRecord.email} (UID: ${userRecord.uid})`);

  // Sync to Firestore users collection
  try {
    const db = getFirestore();
    await db.collection('users').doc(userRecord.uid).set(
      {
        id: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName || userRecord.email?.split('@')[0],
        role: normalizedRole,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    console.log(`Synchronized user document /users/${userRecord.uid} with role: ${normalizedRole}`);
  } catch (dbErr: any) {
    console.warn(`Firestore user document sync notice: ${dbErr.message}`);
  }
}

// CLI Execution Support
async function main() {
  const args = process.argv.slice(2);
  const identifier = args[0] || process.env.ADMIN_CLAIM_EMAIL || 'uvikasbadiger@gmail.com';
  const role = args[1] || process.env.BOOTSTRAP_ROLE || 'COE_AUTHOR';

  if (!identifier) {
    console.error('Error: Please provide an email or UID.');
    console.log('Usage: npx tsx scripts/set-role.ts <email-or-uid> <role>');
    process.exit(1);
  }

  try {
    await setUserRole(identifier, role);
    process.exit(0);
  } catch (err: any) {
    console.error('Failed to set role:', err.message);
    process.exit(1);
  }
}

if (process.argv[1]?.endsWith('set-role.ts')) {
  main();
}
