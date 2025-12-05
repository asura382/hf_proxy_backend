// ✅ api/hf-proxy.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { model, image } = req.body;
  if (!model || !image) {
    return res.status(400).json({ error: "Missing model or image" });
  }

  const hfApiKey = process.env.HUGGINGFACE_API_KEY;
  if (!hfApiKey) {
    return res.status(500).json({ error: "Missing HF API key in server" });
  }

  try {
    const buffer = Buffer.from(image, "base64");

    // ✅ The correct, updated Hugging Face Router endpoint
    const url = `https://router.huggingface.co/hf-inference/models/${model}`;

    console.log("➡️ Calling Hugging Face model:", url);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${hfApiKey}`,
        "Content-Type": "application/octet-stream",
        Accept: "image/png",
      },
      body: buffer,
    });

    console.log("📡 Response:", response.status, response.statusText);

    if (!response.ok) {
      const text = await response.text();
      console.error("HF Error:", response.status, text);
      return res.status(response.status).json({ error: text });
    }

    const imgBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(imgBuffer).toString("base64");

    res.status(200).json({ image: base64 });
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: err.message });
  }
}
