import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { createAvitoClient } from "@/lib/avito"

export async function POST(req: Request) {
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
                let fullVacancy: any = null;
                try {
                    fullVacancy = await avitoClient.getVacancyById(avitoId);
                } catch (e) {
                    console.error(`[AVITO_IMPORT] Failed to fetch full details for vacancy ${avitoId}`, e);
                }

                // Extract city from address string if possible
                let city = item.address ? item.address.split(',')[0].trim() : "Не указан";
                if (fullVacancy?.addressDetails?.city) {
                    city = fullVacancy.addressDetails.city;
                }

                // Parse salary
                let salaryMin = null;
                let salaryMax = null;
                if (fullVacancy?.params?.salary) {
                    if (typeof fullVacancy.params.salary === 'object') {
                        salaryMin = fullVacancy.params.salary.from || null;
                        salaryMax = fullVacancy.params.salary.to || null;
                    } else if (typeof fullVacancy.params.salary === 'number' || typeof fullVacancy.params.salary === 'string') {
                        salaryMin = Number(fullVacancy.params.salary);
                    }
                } else if (fullVacancy?.salary) {
                    if (typeof fullVacancy.salary === 'object') {
                        salaryMin = fullVacancy.salary.from || null;
                        salaryMax = fullVacancy.salary.to || null;
                    } else if (typeof fullVacancy.salary === 'number' || typeof fullVacancy.salary === 'string') {
                        salaryMin = Number(fullVacancy.salary);
                    }
                }

                // Map Avito params to local fields
                const experience = fullVacancy?.params?.experience || "Без опыта";
                const workFormat = fullVacancy?.params?.work_format || "В офисе";
                const employmentType = fullVacancy?.params?.employment || "Полная занятость";
                const description = fullVacancy?.description || "";

                // If it doesn't exist, create it locally
                await prisma.vacancy.create({
                    data: {
                        title: fullVacancy?.title || item.title || "Импортированная вакансия без названия",
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
