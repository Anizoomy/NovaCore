async function sendDepositEmail(to, amount) {
  const html = `<p>Your wallet has been funded with ₦${amount}. Thank you!</p>`;

  return tranEmailApi.sendTransacEmail({
    to: [{ email: to }],
    subject: "Deposit Successful",
    htmlContent: html,
    sender: { name: "NovaCore", email: "noreply@novacore.com" }
  });
}

module.exports = {
  sendDepositEmail
};
