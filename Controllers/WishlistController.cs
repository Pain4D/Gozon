using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Gozon.Data;
using Gozon.Models;

namespace Gozon.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WishlistController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public WishlistController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetWishlist()
        {
            var user = await GetCurrentUser();
            if (user == null) return Unauthorized();

            var wishlistItems = await _context.WishlistItems
                .Include(w => w.Product)
                .Where(w => w.UserId == user.Id)
                .OrderByDescending(w => w.AddedDate)
                .ToListAsync();

            return Ok(wishlistItems);
        }

        [HttpPost("add")]
        [Authorize]
        public async Task<IActionResult> AddToWishlist([FromBody] AddToWishlistRequest request)
        {
            var user = await GetCurrentUser();
            if (user == null) return Unauthorized();

            var exists = await _context.WishlistItems
                .AnyAsync(w => w.UserId == user.Id && w.ProductId == request.ProductId);

            if (exists)
                return BadRequest(new { message = "Товар уже в списке желаемого" });

            var wishlistItem = new WishlistItem
            {
                UserId = user.Id,
                ProductId = request.ProductId,
                AddedDate = DateTime.UtcNow
            };

            _context.WishlistItems.Add(wishlistItem);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Товар добавлен в список желаемого" });
        }

        [HttpDelete("{productId}")]
        [Authorize]
        public async Task<IActionResult> RemoveFromWishlist(int productId)
        {
            var user = await GetCurrentUser();
            if (user == null) return Unauthorized();

            var wishlistItem = await _context.WishlistItems
                .FirstOrDefaultAsync(w => w.UserId == user.Id && w.ProductId == productId);

            if (wishlistItem == null)
                return NotFound();

            _context.WishlistItems.Remove(wishlistItem);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Товар удален из списка желаемого" });
        }

        private async Task<User> GetCurrentUser()
        {
            var email = User.FindFirst(ClaimTypes.Email)?.Value;
            return await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        }
    }
} 