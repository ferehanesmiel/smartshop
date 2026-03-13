/**
 * SMS Service for SmartShop Ethiopia
 * This service handles sending SMS notifications to customers.
 * In a production environment, this would integrate with Twilio or a local SMS gateway.
 */

interface SMSPayload {
  to: string;
  message: string;
  shopName: string;
}

export const sendSMS = async (payload: SMSPayload): Promise<boolean> => {
  const { to, message, shopName } = payload;
  
  // LOGGING FOR SIMULATION
  console.log(`[SMS SERVICE] Sending to: ${to}`);
  console.log(`[SMS SERVICE] From: ${shopName}`);
  console.log(`[SMS SERVICE] Message: ${message}`);

  /**
   * INTEGRATION EXAMPLE (TWILIO):
   * 
   * const response = await fetch('/api/send-sms', {
   *   method: 'POST',
   *   headers: { 'Content-Type': 'application/json' },
   *   body: JSON.stringify({ to, message })
   * });
   * return response.ok;
   */

  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return true;
};
