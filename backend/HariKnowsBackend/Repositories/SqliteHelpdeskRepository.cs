using HariKnowsBackend.Models;
using Microsoft.Data.Sqlite;

namespace HariKnowsBackend.Repositories;

public sealed class SqliteHelpdeskRepository(string connectionString) : IHelpdeskRepository
{
    public ChatMessageDto CreateMessage(string sender, string content, DateTime createdAt)
    {
        using var connection = new SqliteConnection(connectionString);
        connection.Open();

        using var command = connection.CreateCommand();
        command.CommandText = @"
            INSERT INTO ChatMessages (Sender, Content, CreatedAt)
            VALUES ($sender, $content, $createdAt);
            SELECT last_insert_rowid();";
        command.Parameters.AddWithValue("$sender", sender);
        command.Parameters.AddWithValue("$content", content);
        command.Parameters.AddWithValue("$createdAt", createdAt.ToString("O"));

        var id = Convert.ToInt32(command.ExecuteScalar());
        return new ChatMessageDto(id, sender, content, createdAt);
    }

    public IReadOnlyList<ChatMessageDto> GetMessages(int? beforeId, int? afterId, int take)
    {
        using var connection = new SqliteConnection(connectionString);
        connection.Open();

        using var command = connection.CreateCommand();

        if (afterId.HasValue)
        {
            command.CommandText = @"
                SELECT Id, Sender, Content, CreatedAt
                FROM ChatMessages
                WHERE Id > $afterId
                ORDER BY Id ASC
                LIMIT $take;";
            command.Parameters.AddWithValue("$afterId", afterId.Value);
        }
        else if (beforeId.HasValue)
        {
            command.CommandText = @"
                SELECT Id, Sender, Content, CreatedAt
                FROM ChatMessages
                WHERE Id < $beforeId
                ORDER BY Id DESC
                LIMIT $take;";
            command.Parameters.AddWithValue("$beforeId", beforeId.Value);
        }
        else
        {
            command.CommandText = @"
                SELECT Id, Sender, Content, CreatedAt
                FROM ChatMessages
                ORDER BY Id DESC
                LIMIT $take;";
        }

        command.Parameters.AddWithValue("$take", take);

        var rows = new List<ChatMessageDto>();
        using var reader = command.ExecuteReader();
        while (reader.Read())
        {
            rows.Add(new ChatMessageDto(
                reader.GetInt32(0),
                reader.GetString(1),
                reader.GetString(2),
                DateTime.Parse(reader.GetString(3), null, System.Globalization.DateTimeStyles.RoundtripKind)
            ));
        }

        return rows;
    }
}
