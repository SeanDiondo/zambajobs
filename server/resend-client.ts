import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  console.log('DEBUG: RESEND_API_KEY exists:', !!apiKey);
  console.log('DEBUG: RESEND_FROM_EMAIL exists:', !!fromEmail);
  console.log('DEBUG: API_KEY starts with re_?:', apiKey?.startsWith('re_'));
  console.log('DEBUG: FROM_EMAIL:', fromEmail);

  if (!apiKey || !fromEmail) {
    throw new Error('Resend not connected - missing API key or from email');
  }
  
  return {apiKey, fromEmail};
}

export async function getUncachableResendClient() {
  console.log('DEBUG: getUncachableResendClient called');
  const credentials = await getCredentials();
  console.log('DEBUG: Credentials received:', { apiKey: credentials.apiKey ? 'REDACTED' : 'MISSING', fromEmail: credentials.fromEmail });
  
  try {
    const client = new Resend(credentials.apiKey);
    console.log('DEBUG: Resend client created successfully');
    return {
      client,
      fromEmail: credentials.fromEmail
    };
  } catch (error) {
    console.log('DEBUG: Error creating Resend client:', error);
    throw error;
  }
}
