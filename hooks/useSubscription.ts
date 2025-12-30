import { useMemo } from 'react';
import { User } from '../types';

export const useSubscription = (user: User | null) => {
    const subscriptionStatus = useMemo(() => {
        if (!user) return { daysRemaining: 0, isExpired: true, isActive: false, isPro: false };

        const now = new Date();

        // Priority to new SaaS fields
        const isPro = user.plano === 'pro' && user.status_assinatura === 'ativa';
        let isPremium = user.isPremium || isPro;

        // Compatibility with old date-based logic
        if (isPremium && user.premiumUntil && !isPro) {
            const premiumUntilDate = new Date(user.premiumUntil);
            if (now > premiumUntilDate) {
                isPremium = false;
            }
        }

        // Trial Logic (7 days for Free users)
        let trialEndDate: Date;
        if (user.trialEnd) {
            trialEndDate = new Date(user.trialEnd);
        } else {
            const createdAt = new Date(user.createdAt);
            trialEndDate = new Date(createdAt);
            trialEndDate.setDate(trialEndDate.getDate() + 7);
        }

        const remainingTime = trialEndDate.getTime() - now.getTime();
        const daysRemaining = Math.max(0, Math.ceil(remainingTime / (1000 * 60 * 60 * 24)));

        const isTrialActive = remainingTime > 0;
        const isActive = isPremium || isTrialActive;

        return {
            daysRemaining: isPremium ? 365 : daysRemaining,
            isExpired: !isActive,
            isActive,
            isTrial: !isPremium && isTrialActive,
            isPro
        };
    }, [user]);

    return subscriptionStatus;
};
