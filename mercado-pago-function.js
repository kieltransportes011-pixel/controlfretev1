/**
 * FIREBASE CLOUD FUNCTION: processPayment
 */
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { MercadoPagoConfig, Payment } = require("mercadopago");

if (!admin.apps.length) {
  admin.initializeApp();
}

// Chave de Produção Oficial
const MP_ACCESS_TOKEN = "APP_USR-5220193210096311-122719-be527becb762558ba471f0fcdaa4fdd5-2034012095";

const client = new MercadoPagoConfig({ 
  accessToken: MP_ACCESS_TOKEN,
  options: { timeout: 15000 } 
});

const payment = new Payment(client);

exports.processPayment = functions.https.onCall(async (data, context) => {
  // 1. Verificação de Autenticação
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Você precisa estar logado para realizar um pagamento.");
  }

  // 2. Validação de Argumentos
  if (!data || !data.formData || !data.userId) {
    throw new functions.https.HttpsError("invalid-argument", "Dados de pagamento incompletos.");
  }

  const { formData, userId } = data;

  try {
    const paymentBody = {
      transaction_amount: Number(formData.transaction_amount),
      description: "Assinatura Profissional - Control Frete",
      payment_method_id: String(formData.payment_method_id),
      payer: {
        email: String(formData.payer.email),
        identification: formData.payer.identification ? {
            type: String(formData.payer.identification.type),
            number: String(formData.payer.identification.number)
        } : undefined,
      },
      metadata: {
        user_id: String(userId)
      }
    };

    // Campos opcionais de cartão
    if (formData.token) {
      paymentBody.token = String(formData.token);
      paymentBody.installments = Number(formData.installments || 1);
      paymentBody.issuer_id = formData.issuer_id ? String(formData.issuer_id) : undefined;
    }

    const response = await payment.create({
      body: paymentBody,
      requestOptions: { idempotencyKey: `pay_${userId}_${Date.now()}` }
    });

    const status = String(response.status);
    const paymentId = String(response.id);

    // Caso: Pagamento Aprovado Imediatamente
    if (status === "approved") {
      const db = admin.firestore();
      const expiry = new Date();
      expiry.setFullYear(expiry.getFullYear() + 1);

      await db.collection("users").doc(userId).update({
        isPremium: true,
        premiumUntil: expiry.toISOString(),
        lastPaymentId: paymentId
      });

      return { status: "success", paymentId };
    } 
    
    // Caso: Pagamento Pendente (Pix/Boleto)
    if (status === "pending" || status === "in_process") {
      const result = {
        status: "pending",
        paymentId,
        paymentMethod: String(formData.payment_method_id)
      };

      if (formData.payment_method_id === "pix") {
        result.pixData = {
          qrCode: response.point_of_interaction?.transaction_data?.qr_code,
          qrCodeBase64: response.point_of_interaction?.transaction_data?.qr_code_base64
        };
      }

      return result;
    }

    // Caso: Recusado ou outro status
    return { 
      status: "error", 
      message: response.status_detail || "O pagamento não pôde ser processado pelo Mercado Pago."
    };

  } catch (error) {
    console.error("Erro MP SDK:", error);
    
    let errorMessage = "Erro na comunicação com o Mercado Pago.";
    
    if (error.cause && Array.isArray(error.cause) && error.cause[0]) {
      errorMessage = error.cause[0].description || errorMessage;
    } else if (error.message) {
      errorMessage = error.message;
    }

    // Retorna um erro formatado para o Firebase não acusar 'internal' genérico
    throw new functions.https.HttpsError("internal", errorMessage, { message: errorMessage });
  }
});