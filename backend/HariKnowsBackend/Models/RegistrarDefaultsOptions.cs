namespace HariKnowsBackend.Models;

public sealed class RegistrarDefaultsOptions
{
    public List<string> Departments { get; set; } = [];
    public List<RegistrarDefaultCollege> Colleges { get; set; } = [];
}

public sealed class RegistrarDefaultCollege
{
    public string Name { get; set; } = string.Empty;
    public List<RegistrarDefaultProgram> Programs { get; set; } = [];
}

public sealed class RegistrarDefaultProgram
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Group { get; set; } = string.Empty;
}
