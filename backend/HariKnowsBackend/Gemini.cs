// To run this code you need to install the following dependencies:
// dotnet add package Google.GenAI

using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using Google.GenAI;
using Google.GenAI.Types;

namespace HariKnowsBackend;

public static class GeminiSample
{
    public static async Task<string> RunSampleAsync(string input)
    {
        var client = new Client(
            apiKey: System.Environment.GetEnvironmentVariable("GEMINI_API_KEY")
        );

        var model = "gemini-flash-latest";
        var contents = new List<Content>
        {
            new Content
            {
                Role = "user",
                Parts = new List<Part>
                {
                    new Part { Text = input },
                }
            },
        };

        var tools = new List<Tool>
        {
            new Tool
            {
                GoogleSearch = new GoogleSearch
                {
                }
            },
        };


        var config = new GenerateContentConfig
        {
            ThinkingConfig = new ThinkingConfig
            {
                ThinkingBudget = -1,
            },
            Tools = tools,
        };

        var output = string.Empty;

        await foreach (var chunk in client.Models.GenerateContentStreamAsync(model, contents, config))
        {
            output += chunk.Text;
        }

        return output;
    }

}


