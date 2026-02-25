import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { createAvitoClient } from "@/lib/avito"

export async function POST() {
    const session = await auth()
    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    // Only MASTER and MANAGER can run mass import
    if (session.user.role === "RECRUITER") {
        return new NextResponse("Forbidden", { status: 403 })
    }

    try {
        const avitoClient = await createAvitoClient(session.user.organizationId)

        // Get all customer IDs for the organization to assign the imported vacancy
        // For simplicity, we can assign it to the first customer, or let the user choose.
        // Let's just create a default customer for imports if none exists, or use the first one.
        let defaultCustomer = await prisma.customer.findFirst({
            where: { organizationId: session.user.organizationId }
        })

        if (!defaultCustomer) {
            defaultCustomer = await prisma.customer.create({
                data: {
                    name: "Импортированные с Avito",
                    organizationId: session.user.organizationId,
                    ownerId: session.user.id
                }
            })
        }

        let importedCount = 0;
        let alreadyExistsCount = 0;

        // Fetch active items directly from the Core API (bypassing the huge 5000-item Job API fetch)
        let activeItems: Array<{ id: number, title: string, url: string, address?: string }> = [];
        try {
            activeItems = await avitoClient.getActiveItems();
        } catch (e) {
            console.error("[AVITO_IMPORT] Failed to fetch active items", e);
        }

        if (activeItems.length > 0) {
            for (const item of activeItems) {
                const avitoId = String(item.id);

                const existing = await prisma.vacancy.findUnique({
                    where: { avitoId }
                })

                if (existing) {
                    alreadyExistsCount++;
                    continue;
                }

                // Fetch full vacancy details
                let fullVacancy: unknown = null;
                try {
                    fullVacancy = await avitoClient.getVacancyById(avitoId);
                } catch (e) {
                    console.error(`[AVITO_IMPORT] Failed to fetch full details for vacancy ${avitoId}`, e);
                }

                const fv = fullVacancy as Record<string, unknown> | null;

                // Extract city from address string if possible
                let city = item.address ? item.address.split(',')[0].trim() : "Не указан";
                const addressDetails = fv?.addressDetails as Record<string, unknown> | undefined;
                if (addressDetails?.city) {
                    city = addressDetails.city as string;
                }

                // Parse salary
                let salaryMin = null;
                let salaryMax = null;
                const params = fv?.params as Record<string, unknown> | undefined;
                const fvSalary = (params?.salary || fv?.salary); // Handle as unknown

                if (fvSalary && typeof fvSalary === 'object') {
                    const s = fvSalary as Record<string, unknown>;
                    salaryMin = (s.from as number) || null;
                    salaryMax = (s.to as number) || null;
                } else if (typeof fvSalary === 'number' || typeof fvSalary === 'string') {
                    salaryMin = Number(fvSalary);
                }

                // Map Avito params to local fields
                const experience = (params?.experience as string) || "Без опыта";
                const workFormat = (params?.work_format as string) || "В офисе";
                const employmentType = (params?.employment as string) || "Полная занятость";
                const description = (fv?.description as string) || "";

                // If it doesn't exist, create it locally
                await prisma.vacancy.create({
                    data: {
                        title: (fv?.title as string) || item.title || "Импортированная вакансия без названия",
                        description: description,
                        salaryMin: salaryMin,
                        salaryMax: salaryMax,
                        avitoId,
                        avitoStatus: "active", // We know it's active based on the filter
                        status: "ACTIVE", // Make it active locally too
                        customerId: defaultCustomer.id,
                        ownerId: session.user.id,
                        experience: experience,
                        workFormat: workFormat,
                        employmentType: employmentType,
                        city: city,
                    }
                })

                importedCount++;
            }
        }

        return NextResponse.json({
            success: true,
            importedCount,
            alreadyExistsCount,
            message: `Успешно импортировано ${importedCount} активных вакансий`
        })
    } catch (error) {
        console.error("[AVITO_IMPORT_POST]", error)
        return new NextResponse(
            error instanceof Error ? error.message : "Internal Error",
            { status: 500 }
        )
    }
}
