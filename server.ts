import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Swap Submission
  app.post("/api/swap/submit", async (req, res) => {
    const { txId, fromAsset, toAsset, fromAmount, toAmount, receivingAddress } = req.body;

    console.log("Received Swap Request:", { txId, fromAsset, toAsset, fromAmount, toAmount, receivingAddress });

    // Nodemailer configuration
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.ethereal.email",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_PORT === "465", // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || "mock_user",
        pass: process.env.SMTP_PASS || "mock_pass",
      },
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false
      }
    });

    const mailOptions = {
      from: '"DeepSpace Swap" <noreply@deepspace.swap>',
      to: process.env.ADMIN_EMAIL || "e2fatools@outlook.com",
      subject: `New Swap Request: ${txId}`,
      text: `
        New Transaction ID: ${txId}
        Swap Pair: ${fromAmount} ${fromAsset} -> ${toAmount} ${toAsset}
        User's Receiving Address: ${receivingAddress}
        Status: Pending Verification
      `,
      html: `
        <div style="font-family: sans-serif; padding: 20px; background: #0B0E11; color: #ffffff;">
          <h2 style="color: #F3BA2F;">New Swap Request</h2>
          <p><strong>Transaction ID:</strong> ${txId}</p>
          <p><strong>Swap Pair:</strong> ${fromAmount} ${fromAsset} &rarr; ${toAmount} ${toAsset}</p>
          <p><strong>User's Receiving Address:</strong> <code style="background: #1E2329; padding: 4px 8px; border-radius: 4px;">${receivingAddress}</code></p>
          <p><strong>Status:</strong> <span style="color: #F3BA2F;">Pending Verification</span></p>
          <hr style="border: 0; border-top: 1px solid #1E2329; margin: 20px 0;">
          <p style="font-size: 12px; color: #8E9299;">This is an automated notification from DeepSpace Swap.</p>
        </div>
      `,
    };

    try {
      if (process.env.SMTP_USER && process.env.SMTP_USER !== "mock_user") {
        await transporter.sendMail(mailOptions);
        console.log(`Swap notification sent to ${mailOptions.to}`);
      } else {
        console.log("--- MOCK SWAP NOTIFICATION ---");
        console.log(`To: ${mailOptions.to}`);
        console.log(`Subject: ${mailOptions.subject}`);
        console.log(`Content: ${mailOptions.text}`);
        console.log("------------------------------");
        console.log("NOTE: Set SMTP_USER and SMTP_PASS in environment variables for real email delivery.");
      }
      
      res.json({ success: true, message: "Swap request submitted successfully." });
    } catch (error) {
      console.error("Email Error:", error);
      res.status(500).json({ success: false, message: "Failed to send notification. Check server logs." });
    }
  });

  // Support Chat Endpoint
  app.post("/api/support/message", async (req, res) => {
    const { name, email, message } = req.body;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.ethereal.email",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER || "mock_user",
        pass: process.env.SMTP_PASS || "mock_pass",
      },
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false
      }
    });

    const mailOptions = {
      from: '"DeepSpace Support" <support@deepspace.swap>',
      to: process.env.ADMIN_EMAIL || "e2fatools@outlook.com",
      subject: `New Support Message from ${name}`,
      text: `
        Name: ${name}
        Email: ${email}
        Message: ${message}
      `,
      html: `
        <div style="font-family: sans-serif; padding: 20px; background: #0B0E11; color: #ffffff;">
          <h2 style="color: #00F3FF;">New Support Message</h2>
          <p><strong>From:</strong> ${name} (${email})</p>
          <p><strong>Message:</strong></p>
          <div style="background: #1E2329; padding: 15px; border-radius: 8px; border-left: 4px solid #00F3FF;">
            ${message}
          </div>
        </div>
      `,
    };

    try {
      if (process.env.SMTP_USER && process.env.SMTP_USER !== "mock_user") {
        await transporter.sendMail(mailOptions);
        console.log(`Support message from ${name} sent to ${mailOptions.to}`);
      } else {
        console.log("--- MOCK SUPPORT MESSAGE ---");
        console.log(`From: ${name} (${email})`);
        console.log(`To: ${mailOptions.to}`);
        console.log(`Message: ${message}`);
        console.log("----------------------------");
        console.log("NOTE: Set SMTP_USER and SMTP_PASS in environment variables for real email delivery.");
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Support Email Error:", error);
      res.status(500).json({ success: false });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
