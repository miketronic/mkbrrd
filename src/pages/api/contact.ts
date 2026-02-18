import type { APIRoute } from "astro";
import nodemailer from "nodemailer";

export const POST: APIRoute = async ({ request }) => {
  let data;

  try {
    data = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400 }
    );
  }

  const { name, email, message } = data;

  if (!name || !email || !message) {
    return new Response(
      JSON.stringify({ error: "Missing fields" }),
      { status: 400 }
    );
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: import.meta.env.GMAIL_USER,
      pass: import.meta.env.GMAIL_APP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: `"MKBRRD Contact Form" <${import.meta.env.GMAIL_USER}>`,
    to: import.meta.env.GMAIL_USER,
    replyTo: email,
    subject: `Message from ${name}`,
    html: `
      <h2>Contact form message --</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong></p>
      <p>${message}</p>
    `,
  });

  return new Response(JSON.stringify({ success: true }));
};
