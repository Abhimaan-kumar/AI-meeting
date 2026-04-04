AI Meeting-to-Action System

What we are going to create = Task Management Web App

What will this application do
1. Input = live and recorded meeting voice and text
2. Output = Dashboard that show Actions that team have to do with all deadlines and work distribution across various teams
3. Tracks task progress and give Notifications for left out works
4. Dashboard can be edit in Collaboration in team (same as the way we have created our PPT)
5. Analytics Dashboard (optional, if allow us then we will do this)

How can we create this
1. Takes meeting voice by WebRTC or MediaRecorder API
2. Meeting voice will be converted to text
3. Then this text will given to NLP model or LLM (or we have to fine tune the model )
Example:
Input = "We should finish backend by Friday, Rahul take care of API"
Process to = {
"task": "Finish backend APIs",
"assigned_to": "Rahul",
"deadline": "Friday"
}
4. Action and deadlines will be automatically generated in step 3
5. Now, frontend will come and create dashboard for these actions and deadlines
6. Now we have to integrate edit in collaboration
7. Then track task by sync with Trello, Jira or Notion
8. Give notification alerts in the dashboard

Work flow

Speech → Context → Understanding → Action Items → Assignment → Tracking → Follow-up

System Design

Frontend (React)
↓
Backend API (Node.js / FastAPI)
↓
Meeting Input Layer (Audio/Text)
↓
AI Pipeline:
- Speech-to-Text
- NLP (LLM)
- Task Extraction
↓
Database (PostgreSQL / MongoDB)
↓
Task Engine + Notification Service
↓
Integrations (Slack, Email, Jira)
