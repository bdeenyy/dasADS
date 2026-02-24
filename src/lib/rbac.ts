import { Role } from "@prisma/client"

/**
 * Checks if a user has the right to manage (invite/edit/delete) another user's role.
 * 
 * - MASTER can manage anyone (MASTER, MANAGER, RECRUITER)
 * - MANAGER can only manage RECRUITERs
 * - RECRUITER cannot manage anyone
 * 
 * @param currentUserRole The role of the user trying to perform the action
 * @param targetUserRole The role of the user being targeted
 * @returns boolean
 */
export function canManageUser(currentUserRole: Role, targetUserRole: Role): boolean {
    if (currentUserRole === 'MASTER') return true
    if (currentUserRole === 'MANAGER' && targetUserRole === 'RECRUITER') return true
    return false
}

/**
 * Checks if a user has access to organization settings (e.g. Avito keys)
 * 
 * - MASTER: Yes
 * - MANAGER: No
 * - RECRUITER: No
 * 
 * @param role 
 * @returns boolean
 */
export function canEditOrganizationSettings(role: Role): boolean {
    return role === 'MASTER'
}

/**
 * Checks if a user is allowed to delete a vacancy entirely.
 * 
 * - MASTER: Yes
 * - MANAGER: Yes
 * - RECRUITER: No
 * 
 * @param role 
 * @returns boolean
 */
export function canDeleteVacancy(role: Role): boolean {
    return role === 'MASTER' || role === 'MANAGER'
}

/**
 * Checks if a user is allowed to edit a specific vacancy.
 * 
 * - MASTER: Yes (any)
 * - MANAGER: Yes (any)
 * - RECRUITER: Yes, but ONLY if they are the owner (checked at the data level)
 * 
 * @param role 
 * @param isOwner boolean - true if the user.id matches the vacancy.ownerId
 * @returns boolean
 */
export function canEditVacancy(role: Role, isOwner: boolean): boolean {
    if (role === 'MASTER' || role === 'MANAGER') return true
    return role === 'RECRUITER' && isOwner
}
