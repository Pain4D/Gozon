using System.Threading.Tasks;
using Gozon.Models;

namespace Gozon.Services
{
    public interface IAuthService
    {
        Task<bool> Register(User user);
        Task<string> Login(string email, string password);
    }
} 