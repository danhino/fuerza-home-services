export const parseApiError = (
    error: any,
    language: 'en' | 'es' = 'en'
): string => {
    const status = error?.response?.status;
    const messages: Record<number, { en: string; es: string }> = {
        400: { en: 'Invalid request.', es: 'Solicitud inválida.' },
        401: {
            en: 'Session expired. Please log in again.',
            es: 'Sesión expirada. Inicia sesión de nuevo.'
        },
        403: { en: 'Not authorized.', es: 'No autorizado.' },
        404: { en: 'Not found.', es: 'No encontrado.' },
        409: {
            en: 'Conflict. Please try again.',
            es: 'Conflicto. Intenta de nuevo.'
        },
        429: {
            en: 'Too many attempts. Please wait.',
            es: 'Demasiados intentos. Espera un momento.'
        },
        500: {
            en: 'Something went wrong. Please try again.',
            es: 'Algo salió mal. Intenta de nuevo.'
        },
    };
    const msg = messages[status];
    if (msg) return language === 'es' ? msg.es : msg.en;
    if (!error?.response) return language === 'es'
        ? 'Sin conexión a internet.'
        : 'No internet connection.';
    return language === 'es'
        ? 'Error inesperado.'
        : 'Unexpected error.';
};
