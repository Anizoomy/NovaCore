exports.registerOTP = (otp, name) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>NovaCore Email Verification</title>

    <style>
      body {
        margin: 0;
        padding: 0;
        background: linear-gradient(140deg, #4338CA, #6366F1);
        font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
      }

      .wrapper {
        width: 100%;
        padding: 40px 0;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .card {
        background: #ffffff;
        max-width: 480px;
        width: 92%;
        border-radius: 18px;
        padding: 38px 32px;
        box-shadow: 0 12px 35px rgba(0,0,0,0.15);
        border-top: 5px solid #0EA5E9;
        animation: fadeIn 0.4s ease-in-out;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(15px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .title {
        text-align: center;
        font-size: 24px;
        font-weight: 700;
        color: #4338CA;
      }

      .subtitle {
        text-align: center;
        color: #64748B;
        margin-bottom: 24px;
        font-size: 15px;
      }

      .otp-box {
        background: #F8FAFC;
        border: 2px solid #4338CA;
        color: #0F172A;
        font-size: 34px;
        font-weight: 700;
        letter-spacing: 8px;
        padding: 16px;
        text-align: center;
        border-radius: 12px;
        margin-bottom: 27px;
        box-shadow: 0 0 14px rgba(67,56,202,0.35);
      }

      .text {
        color: #334155;
        font-size: 15px;
        line-height: 1.6;
        margin-bottom: 26px;
      }

      .footer {
        text-align: center;
        color: #94A3B8;
        font-size: 13px;
        margin-top: 22px;
      }

    </style>
  </head>

  <body>
    <div class="wrapper">
      <div class="card">

        <div class="title">Verify Your NovaCore Account</div>
        <div class="subtitle">Hello <strong>${name}</strong>, use this code to complete your verification.</div>

        <div class="otp-box">${otp}</div>

        <div class="text">
          This verification code expires in <strong>10 minutes</strong>.
          For your security, do not share this OTP with anyone.
        </div>

        <div class="footer">
          © ${new Date().getFullYear()} NovaCore — Modular Backend Infrastructure System
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
}
