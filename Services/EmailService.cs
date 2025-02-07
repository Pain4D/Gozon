using System.Net.Mail;
using System.Net;

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;

    public EmailService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task SendOrderConfirmationAsync(string email, int orderId)
    {
        var smtpSettings = _configuration.GetSection("SmtpSettings");
        var client = new SmtpClient(smtpSettings["Host"])
        {
            Port = int.Parse(smtpSettings["Port"]),
            Credentials = new NetworkCredential(smtpSettings["Username"], smtpSettings["Password"]),
            EnableSsl = true,
        };

        var message = new MailMessage
        {
            From = new MailAddress(smtpSettings["Username"]),
            Subject = $"Заказ №{orderId} успешно оформлен",
            Body = $"Спасибо за ваш заказ №{orderId}! Мы начали его обработку.",
            IsBodyHtml = false
        };
        message.To.Add(email);

        await client.SendMailAsync(message);
    }
} 