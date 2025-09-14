import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const data = await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: email,
      subject: "Test Email from Aether AI",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Test Email</h1>
          <p>This is a test email to verify that Resend is working correctly with your Aether AI application.</p>
          <p>If you received this email, the integration is working properly!</p>
          <div style="margin-top: 20px; padding: 15px; background-color: #f0f9ff; border-radius: 5px;">
            <p style="margin: 0; color: #0369a1;">
              <strong>Next Steps:</strong> You can now use the magic link authentication feature.
            </p>
          </div>
        </div>
      `,
      text: `Test Email from Aether AI\n\nThis is a test email to verify that Resend is working correctly with your Aether AI application.\n\nIf you received this email, the integration is working properly!\n\nNext Steps: You can now use the magic link authentication feature.`,
      tags: [
        {
          name: "category",
          value: "test_email",
        },
      ],
    });

    return NextResponse.json({
      success: true,
      message: "Test email sent successfully",
      emailId: data.id,
    });
  } catch (error) {
    console.error("Failed to send test email:", error);
    return NextResponse.json(
      {
        error: "Failed to send test email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
