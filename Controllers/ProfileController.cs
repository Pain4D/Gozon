using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Gozon.Data;
using Gozon.Models;
using Gozon.Models.Requests;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ProfileController : ControllerBase
{
    public class UpdateProfileRequest
    {
        public string Name { get; set; }
        public string NewPassword { get; set; }
    }

    private readonly ApplicationDbContext _context;
    private readonly IEmailService _emailService;
    private readonly IWebHostEnvironment _environment;

    public ProfileController(ApplicationDbContext context, IEmailService emailService, IWebHostEnvironment environment)
    {
        _context = context;
        _emailService = emailService;
        _environment = environment;
    }

    [HttpGet]
    public async Task<IActionResult> GetProfile()
    {
        try
        {
            var user = await GetCurrentUser();
            if (user == null)
                return Unauthorized();

            var addresses = await _context.DeliveryAddresses
                .Where(a => a.UserId == user.Id)
                .Select(a => new
                {
                    a.Id,
                    a.Address,
                    a.City,
                    a.PostalCode
                })
                .ToListAsync();

            var paymentMethods = await _context.PaymentMethods
                .Where(p => p.UserId == user.Id)
                .Select(p => new
                {
                    p.Id,
                    p.Type,
                    p.CardNumber
                })
                .ToListAsync();

            return Ok(new
            {
                user.Id,
                user.Name,
                user.Email,
                user.AvatarUrl,
                Addresses = addresses,
                PaymentMethods = paymentMethods
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("update")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var user = await GetCurrentUser();
        
        user.Name = request.Name;
        if (!string.IsNullOrEmpty(request.NewPassword))
        {
            user.Password = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        }

        await _context.SaveChangesAsync();
        return Ok();
    }

    [HttpPost("avatar")]
    public async Task<IActionResult> UploadAvatar(IFormFile file)
    {
        var user = await GetCurrentUser();
        
        if (file == null || file.Length == 0)
            return BadRequest("Файл не загружен");

        var uploadsFolder = Path.Combine(_environment.WebRootPath, "avatars");
        if (!Directory.Exists(uploadsFolder))
            Directory.CreateDirectory(uploadsFolder);

        var fileName = $"{user.Id}_{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
        var filePath = Path.Combine(uploadsFolder, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        user.AvatarUrl = $"/avatars/{fileName}";
        await _context.SaveChangesAsync();

        return Ok(new { avatarUrl = user.AvatarUrl });
    }

    [HttpPost("address")]
    public async Task<IActionResult> AddAddress([FromBody] AddAddressRequest request)
    {
        try
        {
            var user = await GetCurrentUser();
            if (user == null)
                return Unauthorized();

            var address = new DeliveryAddress
            {
                UserId = user.Id,
                Address = request.Address,
                City = request.City,
                PostalCode = request.PostalCode
            };

            _context.DeliveryAddresses.Add(address);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                address.Id,
                address.Address,
                address.City,
                address.PostalCode
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("address/{id}")]
    public async Task<IActionResult> DeleteAddress(int id)
    {
        var address = await _context.DeliveryAddresses.FindAsync(id);
        if (address == null) return NotFound();

        var user = await GetCurrentUser();
        if (address.UserId != user.Id) return Forbid();

        _context.DeliveryAddresses.Remove(address);
        await _context.SaveChangesAsync();
        return Ok();
    }

    [HttpPost("payment")]
    public async Task<IActionResult> AddPaymentMethod([FromBody] AddPaymentMethodRequest request)
    {
        try
        {
            var user = await GetCurrentUser();
            if (user == null)
                return Unauthorized();

            if (request.Type == "CARD" && string.IsNullOrEmpty(request.CardNumber))
            {
                return BadRequest(new { message = "Для карты необходимо указать номер" });
            }

            var paymentMethod = new PaymentMethod
            {
                UserId = user.Id,
                Type = request.Type,
                CardNumber = request.Type == "CARD" ? request.CardNumber : null
            };

            _context.PaymentMethods.Add(paymentMethod);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                paymentMethod.Id,
                paymentMethod.Type,
                paymentMethod.CardNumber
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("orders")]
    public async Task<IActionResult> GetOrders()
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized();

        var orders = await _context.Orders
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
            .Include(o => o.DeliveryAddress)
            .Include(o => o.PaymentMethod)
            .Where(o => o.UserId == user.Id)
            .OrderByDescending(o => o.OrderDate)
            .Select(o => new OrderViewModel
            {
                Id = o.Id,
                OrderDate = o.OrderDate,
                Status = o.Status,
                TotalAmount = o.TotalAmount,
                DeliveryAddress = $"{o.DeliveryAddress.City}, {o.DeliveryAddress.Address}",
                PaymentMethod = o.PaymentMethod.Type == "CARD" 
                    ? $"Карта *{o.PaymentMethod.CardNumber}" 
                    : "Наличные",
                Items = o.OrderItems.Select(oi => new OrderItemViewModel
                {
                    ProductName = oi.Product.Name,
                    ProductImage = oi.Product.ImageUrl,
                    Quantity = oi.Quantity,
                    Price = oi.Price,
                    Total = oi.Price * oi.Quantity
                }).ToList()
            })
            .ToListAsync();

        return Ok(orders);
    }

    [HttpGet("orders/{id}")]
    public async Task<IActionResult> GetOrderDetails(int id)
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized();

        var order = await _context.Orders
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
            .Include(o => o.DeliveryAddress)
            .Include(o => o.PaymentMethod)
            .Where(o => o.UserId == user.Id && o.Id == id)
            .Select(o => new OrderViewModel
            {
                Id = o.Id,
                OrderDate = o.OrderDate,
                Status = o.Status,
                TotalAmount = o.TotalAmount,
                DeliveryAddress = $"{o.DeliveryAddress.City}, {o.DeliveryAddress.Address}",
                PaymentMethod = o.PaymentMethod.Type == "CARD" 
                    ? $"Карта *{o.PaymentMethod.CardNumber}" 
                    : "Наличные",
                Items = o.OrderItems.Select(oi => new OrderItemViewModel
                {
                    ProductName = oi.Product.Name,
                    ProductImage = oi.Product.ImageUrl,
                    Quantity = oi.Quantity,
                    Price = oi.Price,
                    Total = oi.Price * oi.Quantity
                }).ToList()
            })
            .FirstOrDefaultAsync();

        if (order == null) return NotFound();

        return Ok(order);
    }

    private async Task<User> GetCurrentUser()
    {
        var email = User.FindFirst(ClaimTypes.Email)?.Value;
        return await _context.Users
            .Include(u => u.DeliveryAddresses)
            .Include(u => u.PaymentMethods)
            .FirstOrDefaultAsync(u => u.Email == email);
    }
} 