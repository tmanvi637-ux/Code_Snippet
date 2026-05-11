const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

transporter.verify()
    .then(() => console.log("✅ Mail server connected"))
    .catch((err) => console.error("❌ Mail server error:", err.message));


const sendWelcomeEmail = async (toEmail, username) => {
    try {
        await transporter.sendMail({
            from: `"Code Snippet" <${process.env.EMAIL_USER}>`,
            to: toEmail,
            subject: "Welcome to Code Snippet! 🚀",
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #0a0a0f; color: #e4e4e7; border-radius: 12px; overflow: hidden; border: 1px solid #27272a;">
                    <div style="background: linear-gradient(135deg, #6c63ff, #8b5cf6); padding: 32px 24px; text-align: center;">
                        <h1 style="margin: 0; color: #fff; font-size: 24px;">Welcome to Code Snippet</h1>
                    </div>
                    <div style="padding: 28px 24px;">
                        <p style="margin: 0 0 16px; font-size: 16px;">Hey <strong>${username || "there"}</strong>,</p>
                        <p style="margin: 0 0 16px; color: #a1a1aa; line-height: 1.6;">
                            Your account has been created successfully! You can now save, organize, and share your code snippets with the community.
                        </p>
                        <p style="margin: 0 0 24px; color: #a1a1aa; line-height: 1.6;">
                            Start by creating your first snippet or exploring public snippets shared by other developers.
                        </p>
                        <div style="text-align: center; margin: 24px 0;">
                            <span style="background: linear-gradient(135deg, #6c63ff, #8b5cf6); color: #fff; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">
                                Happy Coding! 🎉
                            </span>
                        </div>
                    </div>
                    <div style="padding: 16px 24px; border-top: 1px solid #27272a; text-align: center; color: #71717a; font-size: 12px;">
                        &copy; ${new Date().getFullYear()} Code Snippet — Code Snippet Platform
                    </div>
                </div>
            `
        });
        console.log(`📧 Welcome email sent to ${toEmail}`);
    } catch (err) {
        console.error("Failed to send welcome email:", err.message);
    }
};

const sendForkNotificationEmail = async (ownerEmail, ownerUsername, forkerUsername, snippetTitle) => {
    try {
        await transporter.sendMail({
            from: `"Code Snippet" <${process.env.EMAIL_USER}>`,
            to: ownerEmail,
            subject: `Your snippet "${snippetTitle}" was forked! 🍴`,
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #0a0a0f; color: #e4e4e7; border-radius: 12px; overflow: hidden; border: 1px solid #27272a;">
                    <div style="background: linear-gradient(135deg, #6c63ff, #8b5cf6); padding: 32px 24px; text-align: center;">
                        <h1 style="margin: 0; color: #fff; font-size: 24px;">Snippet Forked! 🍴</h1>
                    </div>
                    <div style="padding: 28px 24px;">
                        <p style="margin: 0 0 16px; font-size: 16px;">Hey <strong>${ownerUsername || "there"}</strong>,</p>
                        <p style="margin: 0 0 16px; color: #a1a1aa; line-height: 1.6;">
                            Great news! <strong style="color: #8b5cf6;">${forkerUsername || "Someone"}</strong> just forked your snippet:
                        </p>
                        <div style="background: #12121a; border: 1px solid #27272a; border-radius: 8px; padding: 16px; margin: 16px 0;">
                            <p style="margin: 0; font-size: 15px; font-weight: 600; color: #e4e4e7;">
                                📝 ${snippetTitle || "Untitled Snippet"}
                            </p>
                        </div>
                        <p style="margin: 16px 0 0; color: #a1a1aa; line-height: 1.6;">
                            Your code is helping others! Keep sharing great snippets. 🚀
                        </p>
                    </div>
                    <div style="padding: 16px 24px; border-top: 1px solid #27272a; text-align: center; color: #71717a; font-size: 12px;">
                        &copy; ${new Date().getFullYear()} Code Snippet — Code Snippet Platform
                    </div>
                </div>
            `
        });
        console.log(`📧 Fork notification sent to ${ownerEmail}`);
    } catch (err) {
        console.error("Failed to send fork notification:", err.message);
    }
};

module.exports = { sendWelcomeEmail, sendForkNotificationEmail };
