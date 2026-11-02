export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ message: 'Email and code are required' });
  }

  const RESEND_API_KEY = process.env.VITE_RESEND_API_KEY || process.env.RESEND_API_KEY;

  if (!RESEND_API_KEY) {
    return res.status(500).json({ message: 'Resend API key missing on server' });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'BiggoHomes <onboarding@resend.dev>',
        to: [email],
        subject: 'Your BiggoHomes Verification Code',
        html: `
          <div style="font-family: sans-serif; padding: 24px; background: #071326; color: #ffffff; border-radius: 16px; max-width: 480px; margin: auto;">
            <h2 style="color: #D9A52E; margin-bottom: 8px;">BiggoHomes Security Desk</h2>
            <p style="color: #94a3b8; font-size: 14px;">Your 6-digit email verification code is:</p>
            <div style="background: #0B1F4B; padding: 18px; border-radius: 12px; text-align: center; font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #D9A52E; margin: 24px 0; border: 1px solid rgba(217, 165, 46, 0.2);">
              ${code}
            </div>
            <p style="font-size: 12px; color: #64748b; margin-top: 16px;">This code will expire in 15 minutes.</p>
          </div>
        `
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ message: data.message || 'Resend error' });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Server error' });
  }
}