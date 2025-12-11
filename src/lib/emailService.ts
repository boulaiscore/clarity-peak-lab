import { supabase } from "@/integrations/supabase/client";

export type EmailType = "welcome" | "premium_upgrade" | "password_reset";

interface SendEmailParams {
  type: EmailType;
  to: string;
  name?: string;
  resetLink?: string;
}

export async function sendEmail({ type, to, name, resetLink }: SendEmailParams): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke("send-email", {
      body: { type, to, name, resetLink },
    });

    if (error) {
      console.error("Error sending email:", error);
      return false;
    }

    console.log(`${type} email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error("Error invoking send-email function:", error);
    return false;
  }
}

export async function sendWelcomeEmail(email: string, name?: string): Promise<boolean> {
  return sendEmail({ type: "welcome", to: email, name });
}

export async function sendPremiumUpgradeEmail(email: string, name?: string): Promise<boolean> {
  return sendEmail({ type: "premium_upgrade", to: email, name });
}

export async function sendPasswordResetEmail(email: string, resetLink: string, name?: string): Promise<boolean> {
  return sendEmail({ type: "password_reset", to: email, name, resetLink });
}
