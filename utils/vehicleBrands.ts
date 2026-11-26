export const VEHICLE_BRANDS = [
    'Iveco',
    'Volvo',
    'Scania',
    'Mercedes-Benz',
    'DAF',
    'MAN',
    'Volkswagen',
    'Ford',
    'Hyundai',
    'Kia',
    'Renault',
    'Fiat',
] as const;

// Marcas sem entrada aqui ainda (pendente a logo real) caem no ícone genérico de caminhão.
const BRAND_ICONS: Record<string, string> = {
    IVECO: '/assets/brand-icons/iveco.webp',
    VOLVO: '/assets/brand-icons/volvo.webp',
    MERCEDESBENZ: '/assets/brand-icons/mercedes-benz.webp',
    DAF: '/assets/brand-icons/daf.webp',
    MAN: '/assets/brand-icons/man.webp',
    VOLKSWAGEN: '/assets/brand-icons/volkswagen.webp',
    FORD: '/assets/brand-icons/ford.webp',
    HYUNDAI: '/assets/brand-icons/hyundai.webp',
    KIA: '/assets/brand-icons/kia.webp',
    RENAULT: '/assets/brand-icons/renault.webp',
    FIAT: '/assets/brand-icons/fiat.webp',
    SCANIA: '/assets/brand-icons/scania.webp',
};

const normalizeBrandKey = (brand: string) =>
    brand
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');

export const getBrandIcon = (brand?: string | null): string | null => {
    if (!brand) return null;
    const key = normalizeBrandKey(brand);
    return BRAND_ICONS[key] ?? null;
};
