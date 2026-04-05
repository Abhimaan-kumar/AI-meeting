# 📊 Meeting Information Structure

## Complete Data Schema for Meetings in the AI Meeting-to-Action System

---

## 🎯 Main Meeting Information

### Core Fields (Stored in `meetings` table)

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| **id** | UUID | Unique identifier for the meeting | `550e8400-e29b-41d4-a716-446655440000` |
| **title** | Text (255 chars) | Meeting name/title | `"Q1 Planning Session"` |
| **date** | Date | Meeting date | `2026-04-15` |
| **time** | Time | Meeting start time | `14:00:00` (2:00 PM) |
| **duration** | Text (50 chars) | How long the meeting lasted | `"60 min"`, `"1.5 hours"` |
| **status** | Enum | Current state of meeting | `completed`, `in-progress`, `scheduled` |
| **location** | Text (255 chars) | Where the meeting took place | `"Conference Room A"`, `"Zoom"`, `"Building 2, Floor 3"` |
| **user_id** | UUID | Owner/creator of the meeting | Links to authenticated user |
| **created_at** | Timestamp | When the meeting record was created | Auto-generated |
| **updated_at** | Timestamp | Last modification time | Auto-updated |

---

## 📝 Meeting Content

### Summary & Transcript

| Field | Type | Description | Purpose |
|-------|------|-------------|---------|
| **summary** | Long Text | AI-generated or manual summary of meeting | Quick overview of what was discussed, key points, decisions made |
| **transcript** | Long Text | Full text transcript of the meeting | Complete record of everything said in the meeting |
| **recording_url** | Text (URL) | Link to audio/video recording | Store links to Zoom recordings, uploaded files, etc. |

**Example Summary:**
```
"Discussed Q1 goals and budget allocation. Team agreed to 
prioritize mobile app development. Marketing budget increased 
by 15%. Next meeting scheduled for April 20th."
```

**Example Transcript:**
```
"[00:00] John: Good morning everyone, let's start with...
[02:15] Sarah: I think we should focus on...
[05:30] Mike: That's a great point, what if we..."
```

---

## 👥 Participants Information

### Stored in `meeting_participants` table (linked to meetings)

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| **id** | UUID | Unique participant record ID | Auto-generated |
| **meeting_id** | UUID | Links to the meeting | References `meetings.id` |
| **participant_name** | Text (255 chars) | Full name of participant | `"Sarah Johnson"` |
| **participant_email** | Text (255 chars) | Email address (optional) | `"sarah@company.com"` |
| **role** | Text (100 chars) | Their role in the meeting | `"Presenter"`, `"Note-taker"`, `"Attendee"` |
| **created_at** | Timestamp | When they were added | Auto-generated |

**Multiple participants per meeting:** Each meeting can have unlimited participants

---

## ✅ Related Action Items

### Linked through `action_items` table

Each meeting can have multiple action items. See the Action Items section for full details, but key linked data includes:

- **Action item title** - Task to complete
- **Assignee** - Who's responsible
- **Due date** - When it's due
- **Priority** - High/Medium/Low
- **Status** - Todo/In Progress/Completed
- **Description** - Details about the task

**Example:**
- Meeting: "Q1 Planning Session"
  - Action 1: "Finalize mobile app mockups" → Assigned to Sarah → Due: Apr 20
  - Action 2: "Review marketing budget" → Assigned to Mike → Due: Apr 18
  - Action 3: "Schedule follow-up meeting" → Assigned to John → Due: Apr 15

---

## 📊 Visual Display in the App

### Dashboard Overview Shows:
- ✅ Meeting title
- 📅 Date and time
- ⏱️ Duration
- 🏷️ Status badge (completed/in-progress/scheduled)
- 👥 Participant avatars (first 3-4)

### Meeting List Shows:
- All of the above, plus:
- 📍 Location
- 📊 Number of action items
- ✅ Number of completed actions
- 🔍 Search and filter by status

### Meeting Detail Page Shows:
- **All core information**
- **Full list of participants** with names and roles
- **Complete summary** (with AI sparkle icon)
- **Full transcript** (if available)
- **All action items** linked to this meeting
- **Recording link** (if available)
- **Export/Download** options
- **Share** functionality

---

## 🎨 What You See in the UI

### When Creating a Meeting:
```
┌─────────────────────────────────────┐
│ Create New Meeting                  │
├─────────────────────────────────────┤
│ Title: ___________________________  │
│ Date:  ___________________________  │
│ Time:  ___________________________  │
│ Duration: [30 min ▼]               │
│ Participants: _____________________  │
│ (Optional fields available)         │
└─────────────────────────────────────┘
```

### In Meeting Cards:
```
┌────────────────────────────────────┐
│ 🎥 Q1 Planning Session             │
│ 📅 Apr 15, 2026 • 2:00 PM • 60 min│
│ 👤👤👤 +2 participants              │
│ [scheduled] 3 actions, 1 completed │
└────────────────────────────────────┘
```

### In Meeting Detail:
```
┌─────────────────────────────────────────┐
│ ← Back to Meetings                      │
│                                          │
│ Q1 Planning Session                     │
│ 📅 Apr 15, 2026  ⏰ 2:00 PM • 60 min   │
│ 📍 Conference Room A                    │
│ [⬇ Export] [🔗 Share]                  │
├─────────────────────────────────────────┤
│ Tabs: [Summary] [Transcript] [Actions] │
├─────────────────────────────────────────┤
│                                          │
│ ✨ AI Summary:                          │
│ Discussed Q1 goals and budget           │
│ allocation. Team agreed to...           │
│                                          │
│ 👥 Participants (4):                    │
│ • Sarah Johnson (Presenter)             │
│ • Mike Chen (Note-taker)                │
│ • John Smith (Attendee)                 │
│ • Emily Davis (Attendee)                │
│                                          │
└─────────────────────────────────────────┘
```

---

## 💾 Data Persistence

**Where it's stored:**
- ✅ **Supabase PostgreSQL Database** (cloud storage)
- 🔐 **Row Level Security** enabled (users only see their own meetings)
- 🔄 **Real-time sync** across devices
- 📱 **Accessible anywhere** with internet connection

**Data retention:**
- Permanent storage (won't be deleted unless user deletes it)
- Survives browser refresh
- Persists across logout/login
- Backed up by Supabase automatically

---

## 🔍 Advanced Features

### Search & Filter:
- Search by meeting title
- Filter by status (all/completed/scheduled/in-progress)
- Sort by date, recent, etc.

### Analytics Tracking:
- Total meetings count
- Meetings this week
- Total hours in meetings
- Unique participants count

### Export Options:
- Download meeting summary
- Export transcript
- Share meeting details

---

## 🔗 Relationships

```
MEETING
├── Has many → PARTICIPANTS
├── Has many → ACTION ITEMS
├── Belongs to → USER (owner)
└── Has optional → RECORDING_URL
```

---

## 📝 Complete Example

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Q1 2026 Planning Session",
  "date": "2026-04-15",
  "time": "14:00:00",
  "duration": "60 min",
  "status": "completed",
  "location": "Conference Room A",
  "summary": "Discussed Q1 goals and budget allocation. Team agreed to prioritize mobile app development. Marketing budget increased by 15%. Key action items assigned.",
  "transcript": "[Full transcript of meeting here...]",
  "recording_url": "https://zoom.us/rec/share/abc123...",
  "user_id": "user-123-456-789",
  "created_at": "2026-04-15T14:00:00Z",
  "updated_at": "2026-04-15T15:05:00Z",
  
  "participants": [
    {
      "participant_name": "Sarah Johnson",
      "participant_email": "sarah@company.com",
      "role": "Presenter"
    },
    {
      "participant_name": "Mike Chen",
      "participant_email": "mike@company.com",
      "role": "Note-taker"
    },
    {
      "participant_name": "John Smith",
      "participant_email": "john@company.com",
      "role": "Attendee"
    }
  ],
  
  "action_items": [
    {
      "title": "Finalize mobile app mockups",
      "assignee": "Sarah Johnson",
      "due_date": "2026-04-20",
      "priority": "high",
      "status": "in_progress"
    },
    {
      "title": "Review marketing budget",
      "assignee": "Mike Chen",
      "due_date": "2026-04-18",
      "priority": "medium",
      "status": "completed"
    }
  ]
}
```

---

## 🎯 Summary

**Total Data Points per Meeting:**
- 11 core meeting fields
- Unlimited participants (each with 4 fields)
- Unlimited action items (linked)
- 2 timestamps (created/updated)
- Status tracking
- Full text content (summary + transcript)

**Everything is fully functional and stored in Supabase cloud database!** 🎉
