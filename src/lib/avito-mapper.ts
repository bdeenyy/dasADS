

import { AVITO_PROFESSIONS } from "@/lib/avito-professions"

/**
 * Avito V2 REST API payload types based on the VacancyV2Create schema.
 */
export type AvitoVacancyPayload = {
    title: string
    description: string
    billing_type: "package" | "packageOrSingle" | "single"
    business_area: number
    employment: "full" | "partial" | "temporary" | "internship"
    schedule: "flyInFlyOut" | "fixed" | "flexible" | "shift"
    experience: "noMatter" | "moreThan1" | "moreThan3" | "moreThan5" | "moreThan10"
    location: {
        address: {
            locality: string
            street?: string
            house?: string
        }
    }
    profession: number
    salary?: {
        from?: number
        to?: number
    }
    contacts?: {
        allow_messages?: boolean
        name?: string
        phone?: string
    }
    image_url?: string
}

// Map internal experience values to Avito V2 enumeration
const EXPERIENCE_MAP: Record<string, "noMatter" | "moreThan1" | "moreThan3" | "moreThan5" | "moreThan10"> = {
    "Без опыта": "noMatter",
    "1-3 года": "moreThan1",
    "3-6 лет": "moreThan3",
    "Более 6 лет": "moreThan5",
    // Fallbacks
    "Более 1 года": "moreThan1",
    "Более 3 лет": "moreThan3",
    "Более 5 лет": "moreThan5",
    "Более 10 лет": "moreThan10",
}

// Map internal employment types to Avito V2 enumeration
const EMPLOYMENT_TYPE_MAP: Record<string, "full" | "partial" | "temporary" | "internship"> = {
    "Полная занятость": "full",
    "Частичная занятость": "partial",
    "Проектная работа": "temporary",
    "Стажировка": "internship",
    // Fallbacks
    "Полная": "full",
    "Частичная": "partial",
    "Временная": "temporary",
}

// Map job type / schedule to Avito V2 enumeration
const JOB_TYPE_MAP: Record<string, "flyInFlyOut" | "fixed" | "flexible" | "shift"> = {
    "Полный день": "fixed",
    "Сменный график": "shift",
    "Гибкий": "flexible",
    "Удаленная работа": "flexible",
    "Вахтовый метод": "flyInFlyOut",
    "Свободный график": "flexible",
    // Fallbacks
    "Фиксированный": "fixed",
    "Сменный": "shift",
    "Вахта": "flyInFlyOut",
}

type VacancyData = {
    id: string
    title: string
    description?: string | null
    salaryMin?: number | null
    salaryMax?: number | null
    experience?: string | null
    employmentType?: string | null
    city?: string | null
}

type AvitoConfig = {
    address?: string
    contactMethod?: string
    managerName?: string
    contactPhone?: string
    imageUrl?: string
    jobType?: string
    industry?: string
    profession?: string
    experience?: string
    employmentType?: string
}

/**
 * Maps internal vacancy data + avitoConfig into a proper Avito V2 API payload.
 * Validates required fields and throws descriptive errors for missing ones.
 */
export function mapVacancyToAvito(vacancy: VacancyData, avitoConfig: AvitoConfig): AvitoVacancyPayload {
    const errors: string[] = []
    let professionId: number | undefined;

    // Required field checks
    if (!avitoConfig.profession) {
        errors.push("Не указана профессия (Profession)")
    } else {
        // Validate and map the profession string to its Avito ID
        const matchedProfession = AVITO_PROFESSIONS.find(p => p.name === avitoConfig.profession)
        if (!matchedProfession) {
            errors.push(`Профессия "${avitoConfig.profession}" не найдена в справочнике Авито. Пожалуйста, выберите значение из выпадающего списка.`)
        } else {
            professionId = matchedProfession.id
        }
    }

    if (!avitoConfig.address) errors.push("Не указан адрес")
    if (!vacancy.title) errors.push("Не указано название вакансии")

    const description = vacancy.description || ""
    if (description.length < 200) errors.push(`Описание слишком короткое (${description.length}/200 символов)`)
    if (description.length > 5000) errors.push(`Описание слишком длинное (${description.length}/5000 символов. Авито V2 лимит 5000)`)

    if (vacancy.title && vacancy.title.length > 50) errors.push(`Название слишком длинное (${vacancy.title.length}/50 символов. Авито V2 лимит 50)`)

    // Determine experience
    const rawExperience = avitoConfig.experience || vacancy.experience
    const experience = rawExperience ? EXPERIENCE_MAP[rawExperience] : "noMatter"
    if (!experience) errors.push("Не удалось замапить опыт работы (Experience)")

    // Determine employment type
    const rawEmployment = avitoConfig.employmentType || vacancy.employmentType
    const employmentType = rawEmployment ? EMPLOYMENT_TYPE_MAP[rawEmployment] : "full"
    if (!employmentType) errors.push("Не удалось замапить тип занятости (EmploymentType)")

    // Determine job type (schedule)
    const rawSchedule = avitoConfig.jobType
    const schedule = rawSchedule ? (JOB_TYPE_MAP[rawSchedule] || "fixed") : "fixed"

    if (errors.length > 0) {
        throw new Error(`Ошибка маппинга Avito:\n${errors.join("\n")}`)
    }

    // Default business area is 1 (services) or another fallback if industry isn't strictly numeric
    // The Avito V2 API expects an integer for business_area. For Vacancies, this is often hardcoded or retrieved via `getDictByID`.
    // According to Avito Job XML docs, they usually didn't have business_area, but V2 does. Let's use 1 as a generic default or attempt to parse if passed.
    const businessAreaId = 1;

    const payload: AvitoVacancyPayload = {
        title: vacancy.title.slice(0, 50),
        description: description,
        billing_type: "packageOrSingle",
        business_area: businessAreaId,
        employment: employmentType,
        schedule: schedule as "flyInFlyOut" | "fixed" | "flexible" | "shift",
        experience: experience as "noMatter" | "moreThan1" | "moreThan3" | "moreThan5" | "moreThan10",
        profession: professionId!,
        location: {
            // For now, mapping the whole address string to locality. 
            // In a full implementation, you'd split City/Street/House.
            address: {
                locality: avitoConfig.address!
            }
        }
    }

    // Optional: salary
    if (vacancy.salaryMin || vacancy.salaryMax) {
        payload.salary = {}
        if (vacancy.salaryMin) payload.salary.from = Number(vacancy.salaryMin)
        if (vacancy.salaryMax) payload.salary.to = Number(vacancy.salaryMax)
    }

    // Optional: contact info
    if (avitoConfig.contactMethod || avitoConfig.managerName || avitoConfig.contactPhone) {
        payload.contacts = {
            allow_messages: avitoConfig.contactMethod ? avitoConfig.contactMethod.includes("сообщениях") : true,
        }
        if (avitoConfig.managerName) payload.contacts.name = avitoConfig.managerName
        if (avitoConfig.contactPhone) payload.contacts.phone = avitoConfig.contactPhone
    }

    // Optional: image
    if (avitoConfig.imageUrl) {
        payload.image_url = avitoConfig.imageUrl
    }

    return payload
}
