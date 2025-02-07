using System.Collections.Generic;
using System.Threading.Tasks;
using Gozon.Models;

namespace Gozon.Services
{
    public interface IProductService
    {
        Task<IEnumerable<Product>> GetAllProducts();
    }
} 