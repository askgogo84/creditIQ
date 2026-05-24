import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';


export async function POST(req: NextRequest) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { email, cardName, oldValue, newValue, changeType } = await req.json();

    if (!email || !cardName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const subject = changeType === 'devaluation'
      ? `(!!) ${cardName} points devalued  --  act before ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { month: 'long', day: 'numeric' })}`
      : `📢 ${cardName} reward rate update`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background:#1B3A5C;padding:24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="color:#C9972E;font-size:20px;font-weight:700;letter-spacing:-0.5px;">Credit</span><span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;">IQ</span>
                    <span style="color:#C9972E;font-size:16px;margin-left:2px;"></span>
                  </td>
                  <td align="right">
                    <span style="background:#C9972E;color:#ffffff;font-size:11px;font-weight:600;padding:4px 10px;border-radius:20px;text-transform:uppercase;letter-spacing:0.5px;">
                      ${changeType === 'devaluation' ? '(!!) Devaluation Alert' : '📢 Rate Update'}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 8px;color:#1B3A5C;font-size:22px;font-weight:700;">${cardName}</h2>
              <p style="margin:0 0 24px;color:#6b7280;font-size:14px;">Reward rate change detected</p>

              <!-- Change Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px;" align="center">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="text-align:center;padding:0 16px;">
                          <div style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Before</div>
                          <div style="color:#1B3A5C;font-size:24px;font-weight:700;">${oldValue}</div>
                        </td>
                        <td style="padding:0 16px;color:#C9972E;font-size:24px;">-></td>
                        <td style="text-align:center;padding:0 16px;">
                          <div style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">After</div>
                          <div style="color:${changeType === 'devaluation' ? '#dc2626' : '#16a34a'};font-size:24px;font-weight:700;">${newValue}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              ${changeType === 'devaluation' ? `
              <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin-bottom:24px;">
                <p style="margin:0;color:#991b1b;font-size:14px;line-height:1.5;">
                  <strong>Redeem your points before this takes effect.</strong> Points already earned may be worth less after the devaluation kicks in.
                </p>
              </div>
              ` : ''}

              <a href="https://creditiq.app/optimize" style="display:block;background:#1B3A5C;color:#ffffff;text-decoration:none;text-align:center;padding:14px 24px;border-radius:8px;font-weight:600;font-size:15px;margin-bottom:24px;">
                Optimize My Points Now ->
              </a>

              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
                You're receiving this because you subscribed to devaluation alerts on CreditIQ.<br>
                <a href="https://creditiq.app/alerts/unsubscribe?email=${email}" style="color:#C9972E;">Unsubscribe</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 32px;">
              <p style="margin:0;color:#9ca3af;font-size:11px;text-align:center;">
                CreditIQ . India's affiliate-bias-free credit card platform . <a href="https://creditiq.app" style="color:#1B3A5C;">creditiq.app</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const { data, error } = await resend.emails.send({
      from: 'CreditIQ Alerts <alerts@creditiq.app>',
      to: email,
      subject,
      html,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });

  } catch (err) {
    console.error('Alert send error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
