# Supabase email templates (Authentication → Emails)

The app signs people in with a **6-digit code**, so each template must contain `{{ .Token }}`.
Templates can only be edited after custom SMTP is set up (Authentication → Emails → Set up SMTP).

## SMTP — quick start with Gmail (free, ~500 emails/day; switch to Resend/Postmark with your domain before launch)
1. Google Account (themirrordating@gmail.com) → Security → turn on **2-Step Verification**.
2. Google Account → search **"App passwords"** → create one named "Supabase" → copy the 16-character password.
3. Supabase → Authentication → Emails → **Set up SMTP**:
   - Sender email: `themirrordating@gmail.com` · Sender name: `Mirror`
   - Host: `smtp.gmail.com` · Port: `587` · Username: `themirrordating@gmail.com` · Password: *the app password*
4. Save. Then Authentication → **Rate Limits** → raise "emails per hour" (e.g. 100).

---

## 1. Magic Link  (used for every sign-in)
**Subject:** `Your Mirror code: {{ .Token }}`

```html
<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#131821">
  <h2 style="margin:0 0 8px">Your Mirror sign-in code</h2>
  <p style="margin:0 0 20px;color:#5B5F6A">Enter this code in the Mirror app to continue.</p>
  <p style="font-size:34px;letter-spacing:8px;font-weight:bold;color:#E07A5F;margin:0 0 20px">{{ .Token }}</p>
  <p style="margin:0;color:#787A7C;font-size:13px">The code expires soon. If you didn't request it, you can safely ignore this email.</p>
</div>
```

## 2. Confirm signup  (first sign-in for a new email)
**Subject:** `Welcome to Mirror — your code: {{ .Token }}`

```html
<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#131821">
  <h2 style="margin:0 0 8px">Welcome to Mirror</h2>
  <p style="margin:0 0 20px;color:#5B5F6A">Enter this code in the app to verify your email and start meeting people, on purpose.</p>
  <p style="font-size:34px;letter-spacing:8px;font-weight:bold;color:#E07A5F;margin:0 0 20px">{{ .Token }}</p>
  <p style="margin:0;color:#787A7C;font-size:13px">If you didn't sign up for Mirror, you can ignore this email.</p>
</div>
```

## 3. Change Email Address
**Subject:** `Confirm your new Mirror email: {{ .Token }}`

```html
<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#131821">
  <h2 style="margin:0 0 8px">Confirm your new email</h2>
  <p style="margin:0 0 20px;color:#5B5F6A">Enter this code in the Mirror app to finish changing your email.</p>
  <p style="font-size:34px;letter-spacing:8px;font-weight:bold;color:#E07A5F;margin:0 0 20px">{{ .Token }}</p>
  <p style="margin:0;color:#787A7C;font-size:13px">If you didn't ask for this, contact support from the app.</p>
</div>
```

Also check: Authentication → Sign In / Providers → **Email** → "Email OTP Length" = **6**.
