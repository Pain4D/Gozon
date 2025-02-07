using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Security.Claims;
using System.ComponentModel.DataAnnotations;
using Gozon.Data;
using Gozon.Models;
using Gozon.Services;

namespace Gozon.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class OrderController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IEmailService _emailService;

        public OrderController(ApplicationDbContext context, IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest request)
        {
            var user = await GetCurrentUser();
            if (user == null) return Unauthorized();

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Получаем корзину пользователя
                var cart = await _context.Carts
                    .Include(c => c.Items)
                    .ThenInclude(i => i.Product)
                    .FirstOrDefaultAsync(c => c.UserId == user.Id);

                if (cart == null || !cart.Items.Any())
                    return BadRequest(new { message = "Корзина пуста" });

                // Создаем заказ
                var order = new Order
                {
                    UserId = user.Id,
                    OrderDate = DateTime.UtcNow,
                    Status = "Новый",
                    DeliveryAddressId = request.DeliveryAddressId,
                    PaymentMethodId = request.PaymentMethodId,
                    TotalAmount = cart.Items.Sum(i => i.Price * i.Quantity)
                };

                _context.Orders.Add(order);
                await _context.SaveChangesAsync();

                // Создаем элементы заказа
                foreach (var item in cart.Items)
                {
                    var orderItem = new OrderItem
                    {
                        OrderId = order.Id,
                        ProductId = item.ProductId,
                        Quantity = item.Quantity,
                        Price = item.Price
                    };
                    _context.OrderItems.Add(orderItem);
                }

                // Очищаем корзину
                _context.CartItems.RemoveRange(cart.Items);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                // Отправляем email
                await _emailService.SendOrderConfirmationAsync(user.Email, order.Id);

                return Ok(new { orderId = order.Id, message = "Заказ успешно создан" });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return BadRequest(new { message = "Ошибка при создании заказа: " + ex.Message });
            }
        }

        private async Task<User> GetCurrentUser()
        {
            var email = User.FindFirst(ClaimTypes.Email)?.Value;
            return await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        }
    }

    public class CreateOrderRequest
    {
        [Required]
        public int DeliveryAddressId { get; set; }
        [Required]
        public int PaymentMethodId { get; set; }
    }
} 