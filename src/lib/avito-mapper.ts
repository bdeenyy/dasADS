

/**
 * Avito XML feed payload types based on the official Avito documentation.
 * Reference: Справочные_материалы/avito.md
 */
export type AvitoVacancyPayload = {
    Id: string                  // Unique ID for Avito (use vacancy.id)
    Category: "Вакансии"        // Always "Вакансии"
    Industry: string            // Company industry sector (required)
    Profession: string          // Profession from Avito list (required)
    Title: string               // Vacancy title, max 100 chars (required)
    Description: string         // Min 200, max 7500 chars (required)
    EmploymentType: string      // "Полная" | "Частичная" | "Временная" | "Стажировка"
    JobType: string             // "Фиксированный" | "Сменный" | "Гибкий" | "Вахта"
    Experience: string          // "Без опыта" | "Более 1 года" | etc.
    Address: string             // Full address, max 256 chars
    Salary?: string             // e.g. "от 50000"
    SalaryBase?: { From?: number; To?: number }
    SalaryBaseBonus?: string
    ContactMethod?: string      // "В сообщениях" | "По телефону" | "По телефону и в сообщениях"
    ManagerName?: string
    ContactPhone?: string
    Images?: { Image: { url: string }[] }
}

// Map internal experience values to Avito's enumeration
const EXPERIENCE_MAP: Record<string, string> = {
    "Без опыта": "Без опыта",
    "1-3 года": "Более 1 года",
    "3-6 лет": "Более 3 лет",
    "Более 6 лет": "Более 5 лет",
    // Direct Avito values (pass-through)
    "Более 1 года": "Более 1 года",
    "Более 3 лет": "Более 3 лет",
    "Более 5 лет": "Более 5 лет",
    "Более 10 лет": "Более 10 лет",
}

// Map internal employment types to Avito's enumeration
const EMPLOYMENT_TYPE_MAP: Record<string, string> = {
    "Полная занятость": "Полная",
    "Частичная занятость": "Частичная",
    "Проектная работа": "Временная",
    "Стажировка": "Стажировка",
    // Direct Avito values
    "Полная": "Полная",
    "Частичная": "Частичная",
    "Временная": "Временная",
}

// Map job type / schedule to Avito's enumeration
const JOB_TYPE_MAP: Record<string, string> = {
    "Полный день": "Фиксированный",
    "Сменный график": "Сменный",
    "Гибкий": "Гибкий",
    "Удаленная работа": "Гибкий",
    "Вахтовый метод": "Вахта",
    "Свободный график": "Гибкий",
    // Direct Avito values
    "Фиксированный": "Фиксированный",
    "Сменный": "Сменный",
    "Вахта": "Вахта",
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
 * Maps internal vacancy data + avitoConfig into a proper Avito API payload.
 * Validates required fields and throws descriptive errors for missing ones.
 */
export function mapVacancyToAvito(vacancy: VacancyData, avitoConfig: AvitoConfig): AvitoVacancyPayload {
    const errors: string[] = []

    // Required field checks
    if (!avitoConfig.industry) errors.push("Не указана сфера деятельности (Industry)")
    if (!avitoConfig.profession) errors.push("Не указана профессия (Profession)")
    if (!avitoConfig.address) errors.push("Не указан адрес")
    if (!vacancy.title) errors.push("Не указано название вакансии")

    const description = vacancy.description || ""
    if (description.length < 200) errors.push(`Описание слишком короткое (${description.length}/200 символов)`)
    if (description.length > 7500) errors.push(`Описание слишком длинное (${description.length}/7500 символов)`)

    if (vacancy.title && vacancy.title.length > 100) errors.push(`Название слишком длинное (${vacancy.title.length}/100 символов)`)

    // Determine experience
    const experience = avitoConfig.experience
        || (vacancy.experience ? EXPERIENCE_MAP[vacancy.experience] : null)
    if (!experience) errors.push("Не указан опыт работы (Experience)")

    // Determine employment type
    const employmentType = avitoConfig.employmentType
        || (vacancy.employmentType ? EMPLOYMENT_TYPE_MAP[vacancy.employmentType] : null)
    if (!employmentType) errors.push("Не указан тип занятости (EmploymentType)")

    // Determine job type (schedule)
    const jobType = avitoConfig.jobType
        ? JOB_TYPE_MAP[avitoConfig.jobType] || avitoConfig.jobType
        : "Фиксированный"

    if (errors.length > 0) {
        throw new Error(`Ошибка маппинга Avito:\n${errors.join("\n")}`)
    }

    const payload: AvitoVacancyPayload = {
        Id: vacancy.id,
        Category: "Вакансии",
        Industry: avitoConfig.industry!,
        Profession: avitoConfig.profession!,
        Title: vacancy.title.slice(0, 100),
        Description: description,
        EmploymentType: employmentType!,
        JobType: jobType,
        Experience: experience!,
        Address: avitoConfig.address!,
    }

    // Optional: salary
    if (vacancy.salaryMin || vacancy.salaryMax) {
        payload.SalaryBase = {}
        if (vacancy.salaryMin) payload.SalaryBase.From = vacancy.salaryMin
        if (vacancy.salaryMax) payload.SalaryBase.To = vacancy.salaryMax
    }

    // Optional: contact info
    if (avitoConfig.contactMethod) payload.ContactMethod = avitoConfig.contactMethod
    if (avitoConfig.managerName) payload.ManagerName = avitoConfig.managerName
    if (avitoConfig.contactPhone) payload.ContactPhone = avitoConfig.contactPhone

    // Optional: image
    if (avitoConfig.imageUrl) {
        payload.Images = { Image: [{ url: avitoConfig.imageUrl }] }
    }

    return payload
}
