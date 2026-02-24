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
     * Publish a vacancy
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
     * Get applies for a specific vacancy
     */
    async getApplies(vacancyId: number): Promise<unknown> {
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
     * Update an existing vacancy on Avito
     */
    async updateVacancy(avitoId: number, vacancyData: unknown): Promise<unknown> {
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
     * Deactivate (remove) a vacancy from Avito
     */
    async deactivateVacancy(avitoId: number): Promise<void> {
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
