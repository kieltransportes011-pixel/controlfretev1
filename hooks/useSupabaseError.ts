import { useCallback } from 'react';

/**
 * Hook to centralize Supabase error handling.
 * @param setError - state setter for error message (string | null).
 * @returns a function that receives an error (any) and updates the error state.
 */
export const useSupabaseError = (setError: (msg: string | null) => void) => {
    return useCallback(
        (error: any) => {
            if (!error) {
                setError(null);
                return;
            }
            // Supabase errors usually have a `message` property.
            const message = error.message ?? 'Erro inesperado ao comunicar com o servidor.';
            setError(message);
        },
        [setError]
    );
};
