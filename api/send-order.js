export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const { message, to } = req.body;

    if (!message || !to) {
      return res.status(400).json({ success: false, error: 'Message and target number (to) are required' });
    }

    // Securely loaded from Vercel Environment Variables
    const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
    const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

    if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
      console.error("Missing Environment Variables");
      return res.status(500).json({ success: false, error: 'Server misconfiguration' });
    }

    // Call Meta's Official WhatsApp Cloud API
    const response = await fetch(`https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: {
          preview_url: false,
          body: message
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("WhatsApp API Error:", data);
      return res.status(response.status).json({ success: false, error: data.error?.message || 'Failed to send message' });
    }

    console.log("SUCCESS! Automated message sent via WhatsApp API to:", to);
    return res.status(200).json({ success: true, messageId: data.messages?.[0]?.id });

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}
