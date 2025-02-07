using Microsoft.AspNetCore.Mvc;
using Gozon.Models;
using Gozon.Services;
using System.ComponentModel.DataAnnotations;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(User user)
    {
        var result = await _authService.Register(user);
        if (result)
            return Ok("Регистрация успешна");
        return BadRequest("Ошибка при регистрации");
    }

    public class LoginRequest
    {
        [Required]
        public string Email { get; set; }
        [Required]
        public string Password { get; set; }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (request == null || string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
            return BadRequest("Email и пароль обязательны");

        var token = await _authService.Login(request.Email, request.Password);
        if (token != null)
            return Ok(new { token });
        return Unauthorized();
    }
} 