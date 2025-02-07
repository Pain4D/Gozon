using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;
using Gozon.Data;
using Gozon.Models;

namespace Gozon.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ProductsController> _logger;

        public ProductsController(ApplicationDbContext context, ILogger<ProductsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetProducts()
        {
            try
            {
                _logger.LogInformation("Получение списка товаров");
                var products = await _context.Products.ToListAsync();
                _logger.LogInformation($"Найдено {products.Count} товаров");
                return Ok(products);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при получении списка товаров");
                return StatusCode(500, "Внутренняя ошибка сервера");
            }
        }
    }
} 
