import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '../supabase';

// Registers this device for push notifications and keeps its token saved in
// Supabase so the backend knows where to send things like "conta vencendo"
// or "resposta do suporte". No-ops entirely on web — push tokens only make
// sense for the native Android app.
export function usePushNotifications(userId: string | undefined) {
  useEffect(() => {
    if (!userId || !Capacitor.isNativePlatform()) return;

    let cancelled = false;

    const saveToken = async (token: string) => {
      if (cancelled) return;
      await supabase.from('push_tokens').upsert(
        {
          user_id: userId,
          token,
          platform: Capacitor.getPlatform(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,token' }
      );
    };

    const registrationListener = PushNotifications.addListener('registration', (token) => {
      saveToken(token.value);
    });

    const registrationErrorListener = PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error:', error);
    });

    const setup = async () => {
      const status = await PushNotifications.checkPermissions();
      let receive = status.receive;

      if (receive === 'prompt' || receive === 'prompt-with-rationale') {
        const requested = await PushNotifications.requestPermissions();
        receive = requested.receive;
      }

      if (receive !== 'granted') {
        // User declined — nothing else to do, no in-app nagging.
        return;
      }

      await PushNotifications.register();
    };

    setup();

    return () => {
      cancelled = true;
      registrationListener.then(l => l.remove());
      registrationErrorListener.then(l => l.remove());
    };
  }, [userId]);
}
