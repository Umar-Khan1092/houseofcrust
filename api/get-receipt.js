export default async function handler(req, res) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ success: false, error: 'Missing receipt ID' });
    }

    const REST_URL = process.env.KV_REST_API_URL;
    const REST_TOKEN = process.env.KV_REST_API_TOKEN;

    if (!REST_URL || !REST_TOKEN) {
      console.error("Upstash Database not connected");
      return res.status(500).json({ success: false, error: 'Database not connected' });
    }

    // Call Upstash REST API to get the receipt data
    const response = await fetch(`${REST_URL}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${REST_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(["GET", `receipt:${id}`])
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Upstash Fetch Error:", result);
      throw new Error('Database Error');
    }

    // result.result contains the JSON string we saved
    if (!result.result) {
      return res.status(404).json({ success: false, error: 'Receipt not found' });
    }

    const data = JSON.parse(result.result);
    return res.status(200).json({ success: true, data });

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}
