import prisma from "@/lib/prisma"

export class AvitoAPI {
    private clientId: string;
    private clientSecret: string;
    private token: string | null = null;
    private tokenExpiresAt: number = 0;

    private baseUrl: string = "https://api.avito.ru";

    constructor(clientId: string, clientSecret: string) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
    }

    /**
     * Get OAuth token from Avito
     */
    async authenticate(): Promise<string> {
        if (this.token && Date.now() < this.tokenExpiresAt) {
            return this.token;
        }

        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        params.append('client_id', this.clientId);
        params.append('client_secret', this.clientSecret);

        const response = await fetch(`${this.baseUrl}/token/`, {
            method: 'POST',
            body: params,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to authenticate with Avito API: ${error}`);
        }

        const data = await response.json();
        this.token = data.access_token;
        // token expiration in seconds -> converted to ms. subtract 60s for buffer
        this.tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;

        return this.token!;
    }

    /**
     * Publish a vacancy (V2)
     */
    async publishVacancy(vacancyData: unknown): Promise<unknown> {
        const token = await this.authenticate();

        const response = await fetch(`${this.baseUrl}/job/v2/vacancies`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(vacancyData)
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to publish vacancy: ${error}`);
        }

        return response.json();
    }

    /**
     * Get applies for a specific vacancy (legacy — use getApplyIds + getAppliesByIds for enriched data)
     */
    async getApplies(vacancyId: string): Promise<unknown> {
        const token = await this.authenticate();

        const response = await fetch(`${this.baseUrl}/job/v1/vacancies/${vacancyId}/applies`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to get applies for vacancy ${vacancyId}: ${error}`);
        }

        return response.json();
    }

    /**
     * Get apply IDs with cursor-based pagination.
     * Use this to enumerate all apply IDs, then fetch full data via getAppliesByIds.
     * GET /job/v1/applications/get_ids
     */
    async getApplyIds(params: {
        updatedAtFrom: string;  // YYYY-MM-DD
        cursor?: string;        // ID последнего отклика из предыдущей страницы
        vacancyIds?: string;    // Фильтр по ID вакансий через запятую
        is_viewed?: boolean;    // Фильтр по просмотренности
    }): Promise<unknown> {
        const token = await this.authenticate();

        const query = new URLSearchParams();
        query.append('updatedAtFrom', params.updatedAtFrom);
        if (params.cursor) query.append('cursor', params.cursor);
        if (params.vacancyIds) query.append('vacancyIds', params.vacancyIds);
        if (params.is_viewed !== undefined) query.append('is_viewed', String(params.is_viewed));

        const response = await fetch(`${this.baseUrl}/job/v1/applications/get_ids?${query.toString()}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to get apply IDs: ${error}`);
        }

        return response.json();
    }

    /**
     * Get full apply data (enriched) by a list of apply IDs.
     * Max 100 IDs per request.
     * POST /job/v1/applications/get_by_ids
     */
    async getAppliesByIds(ids: string[]): Promise<unknown> {
        const token = await this.authenticate();

        const response = await fetch(`${this.baseUrl}/job/v1/applications/get_by_ids`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ids })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to get applies by IDs: ${error}`);
        }

        return response.json();
    }

    /**
     * Mark applies as viewed/unviewed on Avito.
     * Max 100 items per request.
     * POST /job/v1/applications/set_is_viewed
     */
    async setAppliesViewed(applies: Array<{ id: string; is_viewed: boolean }>): Promise<unknown> {
        const token = await this.authenticate();

        const response = await fetch(`${this.baseUrl}/job/v1/applications/set_is_viewed`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ applies })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to set applies viewed status: ${error}`);
        }

        return response.json();
    }

    /**
     * Update an existing vacancy on Avito (V2)
     */
    async updateVacancy(avitoId: string, vacancyData: unknown): Promise<unknown> {
        const token = await this.authenticate();

        const response = await fetch(`${this.baseUrl}/job/v2/vacancies/${avitoId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(vacancyData)
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to update vacancy ${avitoId}: ${error}`);
        }

        return response.json();
    }

    /**
     * Get all active item IDs for the user using the generic Avito Core API.
     * This bypasses the need for UUIDs in job/v2/vacancies/statuses.
     */
    async getActiveItemIds(): Promise<string[]> {
        const token = await this.authenticate();
        const allIds: string[] = [];
        let page = 1;
        const perPage = 100;

        while (true) {
            const response = await fetch(`${this.baseUrl}/core/v1/items?status=active&page=${page}&per_page=${perPage}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Failed to get active items: ${error}`);
            }

            const data = await response.json() as { resources?: Array<{ id: number }> };
            if (!data.resources || data.resources.length === 0) break;

            allIds.push(...data.resources.map(r => String(r.id)));
            if (data.resources.length < perPage) break;

            // Avito API limit: page * per_page <= 5000
            if (page * perPage >= 5000) break;
            page++;
        }

        return allIds;
    }

    /**
     * Get all active item objects for the user using the generic Avito Core API.
     * Useful for importing without needing to fetch the full 5000+ V2 vacancy catalog.
     */
    async getActiveItems(): Promise<Array<{ id: number, title: string, url: string }>> {
        const token = await this.authenticate();
        const allItems: Array<{ id: number, title: string, url: string }> = [];
        let page = 1;
        const perPage = 100;

        while (true) {
            const response = await fetch(`${this.baseUrl}/core/v1/items?status=active&page=${page}&per_page=${perPage}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Failed to get active items: ${error}`);
            }

            const data = await response.json() as { resources?: Array<{ id: number, title: string, url: string }> };
            if (!data.resources || data.resources.length === 0) break;

            allItems.push(...data.resources);
            if (data.resources.length < perPage) break;

            // Avito API limit: page * per_page <= 5000
            if (page * perPage >= 5000) break;
            page++;
        }

        return allItems;
    }

    /**
     * Get all old/archived item IDs for the user using the generic Avito Core API.
     */
    async getOldItemIds(): Promise<string[]> {
        const token = await this.authenticate();
        const allIds: string[] = [];
        let page = 1;
        const perPage = 100;

        while (true) {
            const response = await fetch(`${this.baseUrl}/core/v1/items?status=old&page=${page}&per_page=${perPage}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Failed to get old items: ${error}`);
            }

            const data = await response.json() as { resources?: Array<{ id: number }> };
            if (!data.resources || data.resources.length === 0) break;

            allIds.push(...data.resources.map(r => String(r.id)));
            if (data.resources.length < perPage) break;

            // Avito API limit: page * per_page <= 5000
            if (page * perPage >= 5000) break;
            page++;
        }

        return allIds;
    }

    /**
     * Deactivate (remove) a vacancy from Avito (V2)
     * DELETE /job/v2/vacancies/{id}
     */
    async deactivateVacancy(avitoId: string): Promise<void> {
        const token = await this.authenticate();

        const response = await fetch(`${this.baseUrl}/job/v2/vacancies/${avitoId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to deactivate vacancy ${avitoId}: ${error}`);
        }
    }

    /**
     * Reactivate (prolongate) an archived/expired vacancy.
     * POST /job/v1/vacancies/{id}/prolongate
     */
    async prolongateVacancy(avitoId: string, billingType: string = "package"): Promise<void> {
        const token = await this.authenticate();

        const response = await fetch(`${this.baseUrl}/job/v1/vacancies/${avitoId}/prolongate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ billing_type: billingType })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to prolongate vacancy ${avitoId}: ${error}`);
        }
    }

    /**
     * Get all vacancies for the current user.
     * GET /job/v2/vacancies
     */
    async getVacancies(): Promise<{ vacancies: unknown[] }> {
        const token = await this.authenticate();

        const allVacancies: unknown[] = [];
        let page = 1;
        const perPage = 100; // max allowed

        while (true) {
            const response = await fetch(`${this.baseUrl}/job/v2/vacancies?page=${page}&per_page=${perPage}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Failed to get vacancies: ${error}`);
            }

            const data = await response.json() as { vacancies?: unknown[], items?: unknown[] };

            // Extract the array of vacancies
            const items = data.vacancies || data.items || (Array.isArray(data) ? data : []);
            if (!items || items.length === 0) break;

            allVacancies.push(...items);

            // If we received fewer items than `per_page`, we're on the last page
            if (items.length < perPage) break;

            // Avito API limit: page * per_page <= 5000
            if (page * perPage >= 5000) break;
            page++;
        }

        return { vacancies: allVacancies };
    }

    /**
     * Get a specific vacancy by its ID to retrieve all its fields (description, salary, etc).
     * GET /job/v2/vacancies/{id}
     */
    async getVacancyById(avitoId: string): Promise<unknown> {
        const token = await this.authenticate();

        const response = await fetch(`${this.baseUrl}/job/v2/vacancies/${avitoId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to get vacancy ${avitoId}: ${error}`);
        }

        return response.json();
    }
}

/**
 * Create an AvitoAPI client using organization-specific credentials from the database.
 * This ensures multi-tenant isolation — each org uses its own Avito API keys.
 */
export async function createAvitoClient(organizationId: string): Promise<AvitoAPI> {
    const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { avitoClientId: true, avitoClientSecret: true }
    })

    if (!org?.avitoClientId || !org?.avitoClientSecret) {
        throw new Error("Avito API credentials are not configured for this organization. Please set them in Settings.")
    }

    return new AvitoAPI(org.avitoClientId, org.avitoClientSecret)
}
