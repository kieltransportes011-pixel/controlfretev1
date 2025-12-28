import { useMemo } from 'react';
import { User } from '../types';

export const useSubscription = (user: User | null) => {
    const subscriptionStatus = useMemo(() => {
        if (!user) return { daysRemaining: 0, isExpired: true, isActive: false };

        // Date-based Logic (DB)
        const now = new Date();

        let isPremium = user.isPremium;

        // Double check expiration if premium
        if (isPremium && user.premiumUntil) {
            const premiumUntilDate = new Date(user.premiumUntil);
            if (now > premiumUntilDate) {
                isPremium = false; // Expired
            }
        }

        // Trial Logic
        let trialEndDate: Date;

        if (user.trialEnd) {
            // Use DB source of truth
            trialEndDate = new Date(user.trialEnd);
        } else {
            // Fallback for old users without trial_end: 7 days from creation
            const createdAt = new Date(user.createdAt);
            trialEndDate = new Date(createdAt);
            trialEndDate.setDate(trialEndDate.getDate() + 7);
        }

        const remainingTime = trialEndDate.getTime() - now.getTime();
        const daysRemaining = Math.max(0, Math.ceil(remainingTime / (1000 * 60 * 60 * 24)));

        // Active if Premium OR (Trial is valid)
        // Strict check: if now > trialEndDate, trial is over.
        const isTrialActive = remainingTime > 0;
        const isActive = isPremium || isTrialActive;

        return {
            daysRemaining: isPremium ? 365 : daysRemaining, // Visual helper
            isExpired: !isActive,
            isActive,
            isTrial: !isPremium && isTrialActive
        };
    }, [user]);

    return subscriptionStatus;
};
