namespace FlowCRM.Domain.Enums;

public enum LeadStatus
{
    New = 1,
    Contacted = 2,
    Qualified = 3,
    Unqualified = 4,
    Converted = 5
}

public enum TaskPriority
{
    Low = 1,
    Medium = 2,
    High = 3,
    Urgent = 4
}

public enum TaskStatus
{
    Pending = 1,
    InProgress = 2,
    Completed = 3,
    Cancelled = 4
}

public enum ActivityType
{
    Call = 1,
    Email = 2,
    Meeting = 3,
    Note = 4,
    FollowUp = 5,
    StageChange = 6,
    TaskCompleted = 7,
    LeadConverted = 8
}

public enum UserRole
{
    Admin = 1,
    Manager = 2,
    SalesRepresentative = 3
}
