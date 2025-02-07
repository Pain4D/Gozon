public interface IEmailService
{
    Task SendOrderConfirmationAsync(string email, int orderId);
} 