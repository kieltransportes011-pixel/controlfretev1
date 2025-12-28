# Mercado Pago Integration: Migration to Supabase

## Overview
This document outlines the strategy for migrating the existing `mercado-pago-function.js` (currently a Firebase Cloud Function) to a Supabase Edge Function (`process-payment`).

## Current Implementation (Firebase)
- **Environment**: Node.js (Firebase Cloud Functions)
- **Dependencies**: `mercadopago`, `firebase-admin`, `firebase-functions`
- **Logic**:
  1.  Validates authentication (`context.auth`).
  2.  Validates input data (`formData`, `userId`).
  3.  Creates a payment preference/intent using the Mercado Pago SDK.
  4.  Handles response:
      -   **Approved**: Updates user profile in Firestore (`isPremium: true`).
      -   **Pending (Pix)**: Returns QR Code data.
      -   **Error**: Returns detailed error message.

## Proposed Implementation (Supabase Edge Functions)

### 1. Setup
- **Runtime**: Deno (Supabase Edge Functions use Deno, not Node.js).
- **Dependencies**: Use `npm:` specifiers or Deno-compatible CDNs (esm.sh) for `mercadopago` SDK.

### 2. Code Structure (`supabase/functions/process-payment/index.ts`)

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { MercadoPagoConfig, Payment } from 'npm:mercadopago'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MP_ACCESS_TOKEN = "APP_USR-5220193210096311-122719-be527becb762558ba471f0fcdaa4fdd5-2034012095"

serve(async (req) => {
  // CORS Headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Auth Check (Supabase Auth)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const { formData, userId } = await req.json()

    // 2. Setup Mercado Pago
    const client = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });
    const payment = new Payment(client);

    // 3. Create Payment
    const paymentBody = {
      transaction_amount: Number(formData.transaction_amount),
      description: "Assinatura Profissional - Control Frete",
      payment_method_id: String(formData.payment_method_id),
      payer: {
        email: String(formData.payer.email),
        // ... include identification if needed
      },
      metadata: {
        user_id: user.id 
      }
    };

    if (formData.token) {
        paymentBody.token = String(formData.token);
        paymentBody.installments = Number(formData.installments || 1);
        paymentBody.issuer_id = formData.issuer_id ? String(formData.issuer_id) : undefined;
    }

    const response = await payment.create({
        body: paymentBody,
        requestOptions: { idempotencyKey: `pay_${user.id}_${Date.now()}` }
    });

    const status = String(response.status);
    const paymentId = String(response.id);

    // 4. Handle Success
    if (status === "approved") {
        // Create Admin Client to bypass RLS for update if needed, or use service_role
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        await supabaseAdmin.from('profiles').update({
            is_premium: true,
            // Add premium_until if column exists
        }).eq('id', user.id);

        return new Response(JSON.stringify({ status: "success", paymentId }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    }

    // 5. Handle Pending (Pix)
    if (status === "pending" || status === "in_process") {
         const result: any = { status: "pending", paymentId, paymentMethod: String(formData.payment_method_id) };
         
         if (formData.payment_method_id === "pix") {
            result.pixData = {
                qrCode: response.point_of_interaction?.transaction_data?.qr_code,
                qrCodeBase64: response.point_of_interaction?.transaction_data?.qr_code_base64
            };
         }

         return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    }

    // 6. Handle Error
    return new Response(JSON.stringify({ status: "error", message: response.status_detail }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
```

## Migration Steps
1.  **Install Supabase CLI**: Ensure user has Supabase CLI installed.
2.  **Initialize Functions**: Run `supabase functions new process-payment`.
3.  **Copy Logic**: Adapt the logic as shown above.
4.  **Set Secrets**: Run `supabase secrets set APP_USR_ACCESS_TOKEN=...`.
5.  **Deploy**: Run `supabase functions deploy process-payment`.
6.  **Update Frontend**: Update `Paywall.tsx` to call `supabase.functions.invoke('process-payment', ...)` instead of `httpsCallable`.
