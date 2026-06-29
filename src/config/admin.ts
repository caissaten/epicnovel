/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * CONFIGURATION FILE: ADMIN EMAILS
 * Path: src/config/admin.ts
 * 
 * This file lists the email addresses of users who are allowed to access
 * the Admin Dashboard and perform create, update, and delete actions on the website.
 * 
 * To add a new administrator:
 * 1. Open this file: `src/config/admin.ts`
 * 2. Add their email to the `ADMIN_EMAILS` array below.
 * 3. Save the file.
 * 
 * Example before:
 * ```typescript
 * export const ADMIN_EMAILS = [
 *   "admin@example.com"
 * ];
 * ```
 * 
 * Example after adding "myemail@gmail.com":
 * ```typescript
 * export const ADMIN_EMAILS = [
 *   "admin@example.com",
 *   "myemail@gmail.com"
 * ];
 * ```
 */
export const ADMIN_EMAILS = [
  "caissaorg@gmail.com",   // The user's logged-in email from metadata
  "admin@example.com",     // Default fallback admin
];

/**
 * Checks if a given email is registered as an administrator.
 * @param email The user's email address
 * @returns boolean indicating if user is an admin
 */
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.map(e => e.toLowerCase()).includes(email.toLowerCase());
}
