import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: "welcome" | "premium_upgrade" | "password_reset";
  to: string;
  name?: string;
  resetLink?: string;
}

const generateWelcomeEmail = (name: string) => ({
  subject: "Welcome to NeuroLoop Pro",
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #06070A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #06070A; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #0E1014; border-radius: 16px; border: 1px solid #1a1d24;">
              <!-- Header -->
              <tr>
                <td style="padding: 40px 40px 20px 40px; text-align: center;">
                  <div style="display: inline-flex; align-items: center; gap: 8px;">
                    <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #6C5CE7, #4D55FF); border-radius: 8px;"></div>
                    <span style="color: #ffffff; font-size: 20px; font-weight: 600;">NeuroLoop Pro</span>
                  </div>
                </td>
              </tr>
              
              <!-- Main Content -->
              <tr>
                <td style="padding: 20px 40px 40px 40px;">
                  <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 16px 0; text-align: center;">
                    Welcome, ${name || "Cognitive Athlete"}! 🧠
                  </h1>
                  
                  <p style="color: #A0A5B2; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
                    You've taken the first step toward elite cognitive performance. NeuroLoop Pro is designed to train higher-order thinking and decision-making excellence.
                  </p>
                  
                  <!-- Features Box -->
                  <div style="background-color: #0A0C0F; border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #1a1d24;">
                    <h3 style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 0 0 16px 0;">Your Training Journey Includes:</h3>
                    <ul style="color: #A0A5B2; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                      <li>Focus Arena – Sharpen selective attention</li>
                      <li>Critical Reasoning Studio – Master analytical thinking</li>
                      <li>Creativity Hub – Unlock divergent cognition</li>
                      <li>Daily cognitive metrics tracking</li>
                    </ul>
                  </div>
                  
                  <!-- CTA Button -->
                  <div style="text-align: center; margin: 32px 0;">
                    <a href="https://neuroloop.app/app" style="display: inline-block; background: linear-gradient(135deg, #6C5CE7, #4D55FF); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 16px; font-weight: 600;">
                      Start Training Now
                    </a>
                  </div>
                  
                  <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 24px 0 0 0;">
                    Your mind is your edge. Train it daily.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 20px 40px 30px 40px; border-top: 1px solid #1a1d24;">
                  <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">
                    © ${new Date().getFullYear()} SuperHuman Labs. Cognitive Performance Engineering.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `,
});

const generatePasswordResetEmail = (name: string, resetLink: string) => ({
  subject: "Reset Your NeuroLoop Pro Password",
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #06070A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #06070A; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #0E1014; border-radius: 16px; border: 1px solid #1a1d24;">
              <!-- Header -->
              <tr>
                <td style="padding: 40px 40px 20px 40px; text-align: center;">
                  <div style="display: inline-flex; align-items: center; gap: 8px;">
                    <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #6C5CE7, #4D55FF); border-radius: 8px;"></div>
                    <span style="color: #ffffff; font-size: 20px; font-weight: 600;">NeuroLoop Pro</span>
                  </div>
                </td>
              </tr>
              
              <!-- Main Content -->
              <tr>
                <td style="padding: 20px 40px 40px 40px;">
                  <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 16px 0; text-align: center;">
                    Password Reset Request
                  </h1>
                  
                  <p style="color: #A0A5B2; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
                    Hi ${name || "there"}, we received a request to reset the password for your NeuroLoop Pro account.
                  </p>
                  
                  <!-- Info Box -->
                  <div style="background-color: #0A0C0F; border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #1a1d24;">
                    <p style="color: #A0A5B2; font-size: 14px; line-height: 1.6; margin: 0;">
                      Click the button below to create a new password. This link will expire in 1 hour for security reasons.
                    </p>
                  </div>
                  
                  <!-- CTA Button -->
                  <div style="text-align: center; margin: 32px 0;">
                    <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #6C5CE7, #4D55FF); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 16px; font-weight: 600;">
                      Reset Password
                    </a>
                  </div>
                  
                  <!-- Security Note -->
                  <div style="background: linear-gradient(135deg, rgba(108, 92, 231, 0.1), rgba(77, 85, 255, 0.1)); border-radius: 12px; padding: 20px; margin: 24px 0; border: 1px solid rgba(108, 92, 231, 0.2);">
                    <p style="color: #A0A5B2; font-size: 13px; line-height: 1.6; margin: 0;">
                      <strong style="color: #ffffff;">Did not request this?</strong><br/>
                      If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
                    </p>
                  </div>
                  
                  <p style="color: #6b7280; font-size: 13px; text-align: center; margin: 24px 0 0 0;">
                    For security, this link expires in 1 hour.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 20px 40px 30px 40px; border-top: 1px solid #1a1d24;">
                  <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">
                    © ${new Date().getFullYear()} SuperHuman Labs. Cognitive Performance Engineering.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `,
});
const generatePremiumEmail = (name: string) => ({
  subject: "Welcome to NeuroLoop Pro Premium – Beta Access Confirmed",
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #06070A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #06070A; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #0E1014; border-radius: 16px; border: 1px solid #6C5CE7;">
              <!-- Header with Premium Badge -->
              <tr>
                <td style="padding: 40px 40px 20px 40px; text-align: center;">
                  <div style="display: inline-flex; align-items: center; gap: 8px; margin-bottom: 16px;">
                    <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #6C5CE7, #4D55FF); border-radius: 8px;"></div>
                    <span style="color: #ffffff; font-size: 20px; font-weight: 600;">NeuroLoop Pro</span>
                  </div>
                  <div style="display: inline-block; background: linear-gradient(135deg, #6C5CE7, #4D55FF); color: #ffffff; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; letter-spacing: 0.5px;">
                    🚀 BETA TESTER
                  </div>
                </td>
              </tr>
              
              <!-- Main Content -->
              <tr>
                <td style="padding: 20px 40px 40px 40px;">
                  <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 16px 0; text-align: center;">
                    Premium Access Confirmed! 🎉
                  </h1>
                  
                  <p style="color: #A0A5B2; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
                    Congratulations ${name || "Cognitive Athlete"}! You're now part of our exclusive beta program with full Premium access.
                  </p>
                  
                  <!-- Beta Status Box -->
                  <div style="background: linear-gradient(135deg, rgba(108, 92, 231, 0.1), rgba(77, 85, 255, 0.1)); border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid rgba(108, 92, 231, 0.3);">
                    <h3 style="color: #6C5CE7; font-size: 14px; font-weight: 600; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.5px;">Beta Access Details</h3>
                    <table style="width: 100%; color: #A0A5B2; font-size: 14px;">
                      <tr>
                        <td style="padding: 8px 0;">Status:</td>
                        <td style="padding: 8px 0; text-align: right; color: #6FF7B4; font-weight: 600;">Active</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">Payment:</td>
                        <td style="padding: 8px 0; text-align: right; color: #ffffff;">Free during beta</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">Renewal:</td>
                        <td style="padding: 8px 0; text-align: right; color: #ffffff;">No charge</td>
                      </tr>
                    </table>
                  </div>
                  
                  <!-- Premium Features -->
                  <div style="background-color: #0A0C0F; border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #1a1d24;">
                    <h3 style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 0 0 16px 0;">Your Premium Features:</h3>
                    <ul style="color: #A0A5B2; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                      <li><span style="color: #6FF7B4;">✓</span> All 3 Neuro Lab areas unlocked</li>
                      <li><span style="color: #6FF7B4;">✓</span> Neuro Activation morning ritual</li>
                      <li><span style="color: #6FF7B4;">✓</span> Unlimited daily sessions</li>
                      <li><span style="color: #6FF7B4;">✓</span> All session durations (30s–7min)</li>
                      <li><span style="color: #6FF7B4;">✓</span> Complete badge & level system</li>
                      <li><span style="color: #6FF7B4;">✓</span> Advanced cognitive analytics</li>
                    </ul>
                  </div>
                  
                  <!-- CTA Button -->
                  <div style="text-align: center; margin: 32px 0;">
                    <a href="https://neuroloop.app/app" style="display: inline-block; background: linear-gradient(135deg, #6C5CE7, #4D55FF); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 16px; font-weight: 600;">
                      Explore Premium Features
                    </a>
                  </div>
                  
                  <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 24px 0 0 0;">
                    You'll be notified before any changes to your subscription after beta.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 20px 40px 30px 40px; border-top: 1px solid #1a1d24;">
                  <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">
                    © ${new Date().getFullYear()} SuperHuman Labs. Cognitive Performance Engineering.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `,
});

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, to, name, resetLink }: EmailRequest = await req.json();

    console.log(`Sending ${type} email to ${to}`);

    if (!to || !type) {
      throw new Error("Missing required fields: to, type");
    }

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    let emailContent;
    if (type === "welcome") {
      emailContent = generateWelcomeEmail(name || "");
    } else if (type === "premium_upgrade") {
      emailContent = generatePremiumEmail(name || "");
    } else if (type === "password_reset") {
      if (!resetLink) {
        throw new Error("Reset link required for password reset email");
      }
      emailContent = generatePasswordResetEmail(name || "", resetLink);
    } else {
      throw new Error(`Unknown email type: ${type}`);
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "NeuroLoop Pro <onboarding@resend.dev>",
        to: [to],
        subject: emailContent.subject,
        html: emailContent.html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Log error but return success to prevent blocking the app
      // This typically happens when Resend domain isn't verified yet
      console.warn("Resend API error (non-blocking):", data);
      return new Response(JSON.stringify({ 
        success: false, 
        warning: "Email not sent - domain verification required",
        details: data.message 
      }), {
        status: 200, // Return 200 to not block the app
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    console.log("Email sent successfully:", data);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
