using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Gozon.Data;
using Gozon.Models;

namespace Gozon.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CartController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CartController(ApplicationDbContext context, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
        }

        [HttpGet]
        public async Task<IActionResult> GetCart()
        {
            var cart = await _context.Carts
                .Include(c => c.Items)
                    .ThenInclude(i => i.Product)
                .FirstOrDefaultAsync();

            if (cart == null)
            {
                cart = new Cart();
                _context.Carts.Add(cart);
                await _context.SaveChangesAsync();
            }

            return Ok(cart);
        }

        [HttpPost("add")]
        public async Task<IActionResult> AddToCart([FromBody] AddToCartRequest request)
        {
            var cart = await _context.Carts
                .Include(c => c.Items)
                .FirstOrDefaultAsync();

            if (cart == null)
            {
                cart = new Cart();
                _context.Carts.Add(cart);
            }

            var product = await _context.Products.FindAsync(request.ProductId);
            if (product == null)
                return NotFound("Товар не найден");

            var cartItem = cart.Items.FirstOrDefault(i => i.ProductId == request.ProductId);
            if (cartItem == null)
            {
                cartItem = new CartItem
                {
                    ProductId = request.ProductId,
                    Quantity = request.Quantity
                };
                cart.Items.Add(cartItem);
            }
            else
            {
                cartItem.Quantity += request.Quantity;
            }

            await _context.SaveChangesAsync();

            // Возвращаем обновленную корзину
            return Ok(await _context.Carts
                .Include(c => c.Items)
                    .ThenInclude(i => i.Product)
                .FirstAsync(c => c.Id == cart.Id));
        }

        [HttpPost("update")]
        public async Task<IActionResult> UpdateCartItem([FromBody] AddToCartRequest request)
        {
            var cart = await _context.Carts
                .Include(c => c.Items)
                .FirstOrDefaultAsync();

            if (cart == null)
                return NotFound("Корзина не найдена");

            var cartItem = cart.Items.FirstOrDefault(i => i.ProductId == request.ProductId);
            if (cartItem == null)
                return NotFound("Товар не найден в корзине");

            cartItem.Quantity = request.Quantity;
            await _context.SaveChangesAsync();

            return Ok(await _context.Carts
                .Include(c => c.Items)
                    .ThenInclude(i => i.Product)
                .FirstAsync(c => c.Id == cart.Id));
        }

        [HttpDelete("remove/{productId}")]
        public async Task<IActionResult> RemoveFromCart(int productId)
        {
            var cart = await _context.Carts
                .Include(c => c.Items)
                .FirstOrDefaultAsync();

            if (cart == null)
                return NotFound("Корзина не найдена");

            var cartItem = cart.Items.FirstOrDefault(i => i.ProductId == productId);
            if (cartItem != null)
            {
                cart.Items.Remove(cartItem);
                await _context.SaveChangesAsync();
            }

            return Ok(await _context.Carts
                .Include(c => c.Items)
                    .ThenInclude(i => i.Product)
                .FirstAsync(c => c.Id == cart.Id));
        }

        [HttpPost("comment")]
        public async Task<IActionResult> AddComment([FromBody] CartCommentRequest request)
        {
            var user = await GetCurrentUser();
            if (user == null)
                return Unauthorized();

            var cart = await GetOrCreateCart(user.Id);
            cart.Comment = request.Comment;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Комментарий добавлен" });
        }

        [HttpPost("clear")]
        public async Task<IActionResult> ClearCart()
        {
            var cart = await _context.Carts
                .Include(c => c.Items)
                .FirstOrDefaultAsync();

            if (cart == null)
                return NotFound("Корзина не найдена");

            cart.Items.Clear();
            await _context.SaveChangesAsync();

            return Ok(cart);
        }

        private async Task<User> GetCurrentUser()
        {
            var email = User.FindFirst(ClaimTypes.Email)?.Value;
            if (string.IsNullOrEmpty(email))
                return null;

            return await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        }

        private async Task<Cart> GetOrCreateCart(int userId)
        {
            var cart = await _context.Carts
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart == null)
            {
                cart = new Cart { UserId = userId };
                _context.Carts.Add(cart);
                await _context.SaveChangesAsync();
            }

            return cart;
        }
    }

    public class AddToCartRequest
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
    }
} 