export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const { id, data } = req.body;

    if (!id || !data) {
      return res.status(400).json({ success: false, error: 'Missing id or data' });
    }

    const REST_URL = process.env.KV_REST_API_URL;
    const REST_TOKEN = process.env.KV_REST_API_TOKEN;

    if (!REST_URL || !REST_TOKEN) {
      console.error("Upstash Database not connected");
      return res.status(500).json({ success: false, error: 'Database not connected' });
    }

    // Call Upstash REST API using the array syntax
    // We set an auto-expiration of 7 days (604800 seconds) so old receipts automatically delete and never waste space
    const response = await fetch(`${REST_URL}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${REST_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(["SET", `receipt:${id}`, JSON.stringify(data), "EX", 604800])
    });

    if (!response.ok) {
      const errData = await response.text();
      console.error("Upstash Save Error:", errData);
      throw new Error('Database Error');
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}
