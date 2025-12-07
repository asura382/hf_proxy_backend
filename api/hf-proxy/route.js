// api/hf-proxy/route.js
import fetch from "node-fetch";

export async function POST(req) {
  try {
    const { model, image } = await req.json();
    if (!model || !image) {
      return new Response(
        JSON.stringify({ error: "Missing model or image" }),
        { status: 400 }
      );
    }

    const hfApiKey = process.env.HUGGINGFACE_API_KEY;
    if (!hfApiKey) {
      return new Response(
        JSON.stringify({ error: "Missing HF API key in server" }),
        { status: 500 }
      );
    }

    const buffer = Buffer.from(image, "base64");
    const url = `https://router.huggingface.co/hf-inference/models/${model}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${hfApiKey}`,
        "Content-Type": "application/octet-stream",
        Accept: "image/png",
      },
      body: buffer,
    });

    if (!response.ok) {
      const text = await response.text();
      return new Response(
        JSON.stringify({ error: text }),
        { status: response.status }
      );
    }

    const imgBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(imgBuffer).toString("base64");
    return new Response(JSON.stringify({ image: base64 }), { status: 200 });
  } catch (err) {
    console.error("Proxy error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
}
