# Wedding Operations Platform — Product Requirements Document

**Version:** 1.0  
**Status:** Developer Ready — V1 Scope  
**Product Type:** Private-instance Wedding Operations Platform  
**Primary Market:** Indian wedding planners and event management companies  
**Platform:** Responsive web application  
**Primary Communication Channel:** WhatsApp via click-to-chat + phone  
**Recommended Backend:** Supabase  
**Deployment:** Private deployment for one wedding management company

---

# 1. Product Overview

## 1.1 Product Vision

Build a centralized Wedding Operations Platform that allows an Indian wedding/event management company to manage the complete lifecycle of a wedding from the first lead through final payment and project closure.

The platform is not intended to be a generic CRM.

The core operating model is:

**Lead → Client → Wedding Project → Functions → Execution → Closure**

The platform combines:

- CRM
- Wedding/project management
- Vendor management
- Task management
- Guest management
- Budget management
- Payment tracking
- Document management
- Timeline management
- Team coordination
- Reporting
- Operational reminders

The primary objective is to eliminate fragmented management across WhatsApp, phone calls, spreadsheets, notebooks, and disconnected files.

---

# 2. Problem Statement

Wedding managers frequently coordinate many moving parts simultaneously.

The primary problems identified for V1 are:

1. Forgetting client follow-ups
2. Vendor management becoming difficult
3. Payment tracking
4. Client communication
5. Managing multiple wedding functions and deadlines
6. Keeping team members aligned
7. Maintaining visibility into project profitability
8. Keeping documents and project information organized

A normal CRM is insufficient because a wedding is not simply a sales opportunity.

A wedding may contain:

- Multiple functions
- Multiple venues
- Dozens of vendors
- Hundreds of guests
- Many tasks
- Client approvals
- Vendor payments
- Client payments
- Event timelines
- Staff assignments
- Documents
- Operational dependencies

The software must therefore prioritize execution after the sales process is complete.

---

# 3. Product Positioning

## 3.1 Product Name

Working name:

**Wedding Operations Platform**

The final commercial name can be decided later.

## 3.2 Positioning

The product should be positioned as:

> A central command center for managing an entire wedding from enquiry to final settlement.

Not:

> Another CRM.

The CRM is one part of the platform.

---

# 4. Product Goals

## 4.1 Primary Goals

The V1 system must:

- Centralize leads and clients
- Prevent missed follow-ups
- Convert won leads into structured wedding projects
- Manage multiple functions inside a wedding
- Maintain a reusable vendor database
- Track vendor bookings
- Track client payments
- Track vendor payments
- Track wedding budgets
- Calculate project profitability
- Assign and monitor team tasks
- Maintain guest lists and RSVPs
- Store project documents
- Provide wedding timelines
- Surface urgent operational work
- Provide role-specific dashboards
- Work effectively on desktop and mobile browsers

## 4.2 Non-Goals for V1

The following are explicitly outside V1:

- Multi-tenant SaaS
- Native iOS application
- Native Android application
- Full WhatsApp Business API integration
- WhatsApp conversation synchronization
- Automated WhatsApp chatbot
- Online payment gateway
- Advanced guest logistics
- Vendor self-service portal
- Client self-service portal
- Complex AI automation
- Marketplace for vendors

These may be considered in later versions.

---

# 5. Target Users

## 5.1 Owner / Admin

Responsibilities:

- Overall business visibility
- Sales oversight
- Wedding oversight
- Team management
- Financial visibility
- Vendor oversight
- Reports
- Settings

Needs:

- Company-wide dashboard
- Active wedding overview
- Revenue
- Outstanding payments
- Vendor liabilities
- Profitability
- Team workload
- Upcoming weddings
- Critical issues

## 5.2 Sales

Responsibilities:

- Lead capture
- Lead qualification
- Follow-ups
- Meetings
- Requirements
- Proposals
- Negotiations
- Conversion

Needs:

- Lead pipeline
- Follow-up reminders
- Lead details
- Client communication information
- Proposal status
- Conversion reporting

## 5.3 Wedding Planner / Event Manager

Responsibilities:

- Wedding planning
- Function planning
- Vendor coordination
- Task management
- Client coordination
- Timeline management
- Execution

Needs:

- Wedding dashboard
- Today's tasks
- Upcoming deadlines
- Vendor status
- Client approvals
- Payment reminders
- Function timeline

## 5.4 Operations / Coordinator

Responsibilities:

- Operational tasks
- Vendor coordination
- Function preparation
- Execution support
- Issue tracking

Needs:

- Assigned tasks
- Function information
- Vendor information
- Deadlines
- Operational notes

## 5.5 Vendor Manager

Responsibilities:

- Vendor database
- Vendor selection
- Vendor bookings
- Vendor pricing
- Vendor coordination
- Vendor payment coordination

Needs:

- Vendor directory
- Vendor history
- Current bookings
- Payment status
- Vendor performance information

## 5.6 Finance

Responsibilities:

- Client receivables
- Vendor payables
- Payment recording
- Invoices
- Receipts
- Financial reporting

Needs:

- Payment dashboard
- Due payments
- Overdue payments
- Project profitability
- Client balances
- Vendor balances

## 5.7 Field / Execution Staff

Responsibilities:

- Completing assigned tasks
- Updating task status
- Reporting issues
- Viewing relevant function information

Needs:

- Mobile-friendly My Tasks
- Task details
- Due dates
- Priority
- Notes
- Status updates

---

# 6. Core Business Model

The core relationship is:

```text
Lead
  ↓
Client
  ↓
Wedding Project
  ↓
Functions
  ├── Tasks
  ├── Vendors
  ├── Guests
  ├── Timeline
  └── Budget
       ├── Client Payments
       └── Vendor Payments
```

A Client and Wedding are separate entities.

This is intentional.

A client/family may potentially work with the company for more than one event in the future.

---

# 7. End-to-End Workflow

## 7.1 Lead

A lead enters the system.

Required information:

- Lead name
- Primary contact
- Phone
- WhatsApp number
- Email, if available
- Wedding/event date
- Location
- Estimated guest count
- Estimated budget
- Expected functions
- Lead source
- Requirements
- Assigned sales person
- Next follow-up
- Notes

Lead statuses:

1. New
2. Contacted
3. Meeting Scheduled
4. Requirements Collected
5. Proposal Sent
6. Negotiation
7. Won
8. Lost

## 7.2 First Contact

The responsible sales person records:

- Contact attempt
- Contact outcome
- Notes
- Next action
- Next follow-up date

The system must make overdue follow-ups highly visible.

## 7.3 Meeting

A meeting can be recorded against the lead/client.

Information:

- Date/time
- Meeting type
- Participants
- Notes
- Requirements discovered
- Decisions
- Follow-up actions

## 7.4 Requirements

Requirements can include:

- Wedding date
- Functions
- Venue requirements
- Guest count
- Catering
- Decor
- Photography
- Entertainment
- Makeup
- Transportation
- Accommodation
- Hospitality
- Invitations
- Other requirements

## 7.5 Proposal

The system should record:

- Proposal amount
- Scope
- Proposal date
- Validity
- Status
- Notes
- Document attachment

Proposal statuses:

- Draft
- Sent
- Under Review
- Negotiation
- Accepted
- Rejected

## 7.6 Negotiation

Record:

- Original value
- Revised value
- Negotiation notes
- Final agreed value
- Decision date

## 7.7 Won / Booking

When a lead becomes Won:

- Create/select Client
- Create Wedding Project
- Store agreed project value
- Record advance
- Create payment schedule
- Create wedding functions
- Assign project team
- Begin planning

The conversion should preserve the sales history.

---

# 8. Wedding Project

The Wedding Project is the primary operational entity.

## 8.1 Wedding Information

Fields:

- Wedding name
- Client
- Bride name
- Groom name
- Primary contact
- Secondary contacts
- Wedding date/range
- City
- State
- Primary venue
- Estimated guest count
- Project value
- Project status
- Project manager
- Assigned team
- Notes
- Documents

## 8.2 Wedding Status

Suggested statuses:

1. Planning
2. Vendor Booking
3. Pre-Event
4. Event in Progress
5. Completed
6. Closed
7. Cancelled

---

# 9. Functions

One wedding can contain multiple functions.

Example:

```text
Sharma Wedding

- Engagement
- Haldi
- Mehendi
- Sangeet
- Wedding
- Reception
```

Each function contains:

- Function name
- Date
- Start time
- End time
- Venue
- Guest count
- Description
- Vendors
- Tasks
- Staff
- Timeline
- Requirements
- Notes
- Documents
- Budget allocation

Functions must be independently manageable while remaining part of the parent wedding.

---

# 10. Vendor Management

Vendor management is a core V1 module.

## 10.1 Vendor Directory

Vendor categories:

- Venue
- Decorator
- Caterer
- Photographer
- Videographer
- Makeup Artist
- Mehendi Artist
- DJ
- Band
- Artist / Entertainment
- Florist
- Lighting
- Sound
- Furniture
- Transportation
- Hospitality
- Invitation / Printing
- Gifts
- Security
- Other

## 10.2 Vendor Profile

Fields:

- Vendor name
- Business name
- Category
- Contact person
- Phone
- WhatsApp
- Email
- Address
- City
- Service description
- Pricing notes
- Documents
- Internal notes
- Rating
- Status

## 10.3 Vendor Reuse

Vendors are reusable across weddings.

The system must maintain vendor history.

Example:

```text
Raj Photography

Previous Weddings:
- Sharma Wedding
- Agarwal Wedding
- Mehta Wedding

Current Bookings:
- Gupta Wedding
```

Useful historical information:

- Number of bookings
- Total business value
- Previous pricing
- Payment history
- Internal rating
- Notes
- Functions served

## 10.4 Vendor Booking

A vendor can be booked for a particular wedding and optionally for a particular function.

Booking fields:

- Vendor
- Wedding
- Function
- Service
- Agreed amount
- Booking date
- Status
- Advance
- Payment schedule
- Balance
- Deliverables
- Notes
- Documents

Vendor booking statuses:

- Planned
- Contacted
- Quotation Received
- Negotiation
- Confirmed
- In Progress
- Completed
- Cancelled

---

# 11. Client Management

## 11.1 Client Profile

Fields:

- Name
- Phone
- WhatsApp
- Email
- Address
- Family information
- Notes
- Communication notes
- Previous projects

## 11.2 Client History

A client profile should show:

- Current weddings
- Previous weddings
- Total project value
- Payments
- Documents
- Notes
- Communication history recorded in the CRM

---

# 12. Task Management

Tasks are central to operations.

## 12.1 Task Fields

- Task name
- Description
- Wedding
- Function
- Assigned user
- Priority
- Status
- Start date
- Due date
- Completion date
- Dependency
- Notes
- Attachments

## 12.2 Task Status

- Not Started
- In Progress
- Blocked
- Completed
- Cancelled

## 12.3 Priority

- Low
- Medium
- High
- Critical

## 12.4 My Tasks

Every team member should have a simple view:

```text
TODAY

High Priority
- Confirm decorator
- Call client
- Collect vendor quotation

Due Soon
- Finalize transport
- Confirm guest list

Overdue
- Payment follow-up
```

The system should make overdue work difficult to miss.

---

# 13. Budget Management

Budgeting is a V1 feature.

## 13.1 Budget Structure

A wedding can have multiple budget categories.

Example:

```text
Decor
Photography
Catering
Venue
Entertainment
Transportation
Accommodation
Hospitality
Invitations
Gifts
Miscellaneous
```

Each category can have:

- Planned amount
- Committed amount
- Actual amount
- Variance
- Notes

## 13.2 Project Financial Summary

Display:

- Contract value
- Total planned cost
- Total committed cost
- Total actual cost
- Received from client
- Outstanding from client
- Paid to vendors
- Outstanding vendor payments
- Estimated profit
- Actual profit

## 13.3 Profit Calculation

Basic V1 model:

```text
Estimated Profit
= Contract Value - Expected/Actual Project Costs
```

The PRD should distinguish clearly between estimated and actual figures.

---

# 14. Client Payments

The platform tracks payments rather than processing them.

## 14.1 Payment Schedule

Fields:

- Wedding
- Client
- Amount
- Due date
- Payment type
- Status
- Payment date
- Payment method
- Reference number
- Notes
- Receipt/document

Payment statuses:

- Upcoming
- Due
- Paid
- Partially Paid
- Overdue
- Cancelled

## 14.2 Payment Reminders

The system should surface:

- Upcoming payments
- Due today
- Overdue payments

V1 reminders are internal system reminders.

Invoices and receipts can be attached or generated as documents.

---

# 15. Vendor Payments

Vendor payments are tracked separately from client receivables.

Fields:

- Vendor
- Wedding
- Function
- Booking
- Amount
- Due date
- Payment status
- Payment date
- Payment method
- Reference
- Notes
- Receipt/document

The system must show total vendor liabilities.

---

# 16. Guest Management

V1 provides basic guest management.

## 16.1 Guest Fields

- Guest name
- Family/group
- Phone
- Email
- RSVP status
- Number of guests
- Function attendance
- Notes

## 16.2 RSVP Status

- Pending
- Invited
- Confirmed
- Declined
- Maybe

## 16.3 Guest Overview

For each wedding:

- Total guests
- Confirmed
- Pending
- Declined
- Function-specific attendance

Advanced accommodation, room allocation, transport routing, meal planning, and guest logistics are future scope.

---

# 17. Timeline Management

Each wedding and function should have a timeline.

Timeline items can represent:

- Client decision
- Vendor confirmation
- Payment deadline
- Task deadline
- Setup deadline
- Function milestone
- Meeting
- Delivery
- Other event

The timeline should support chronological visibility.

A wedding planner should be able to understand what is happening over the next:

- 7 days
- 30 days
- 60 days
- Entire wedding lifecycle

---

# 18. Document Management

Documents can be attached to:

- Lead
- Client
- Wedding
- Function
- Vendor
- Vendor booking
- Payment
- Task

Examples:

- Proposal
- Contract
- Quotation
- Invoice
- Receipt
- Agreement
- Guest list
- Itinerary
- Reference images
- Other project documents

The system should avoid forcing all files into a single global folder.

Contextual attachments are preferred.

---

# 19. Communication

## 19.1 WhatsApp

V1 does not integrate with the WhatsApp API.

Instead:

- Store WhatsApp number
- Show WhatsApp contact action
- Open WhatsApp conversation using click-to-chat
- Allow internal communication notes

## 19.2 Phone

Phone number should support a click-to-call action on supported devices.

## 19.3 Communication Notes

The team should be able to record important interactions:

- Date
- Contact person
- Channel
- Summary
- Outcome
- Follow-up required
- Follow-up date

This allows important information to remain in the project even when the actual conversation happens outside the system.

---

# 20. Dashboard

The dashboard should answer:

> What needs my attention right now?

## 20.1 Owner Dashboard

Show:

- Active weddings
- Upcoming weddings
- New leads
- Follow-ups due
- Outstanding client payments
- Vendor payments due
- Revenue
- Estimated profit
- Team workload
- Critical issues
- Upcoming functions

## 20.2 Sales Dashboard

Show:

- New leads
- Follow-ups due
- Overdue follow-ups
- Meetings
- Proposals
- Negotiations
- Won leads
- Lost leads
- Pipeline value

## 20.3 Planner Dashboard

Show:

- Today's tasks
- Overdue tasks
- Upcoming functions
- Vendor confirmations
- Pending client decisions
- Payment deadlines
- Critical project issues

## 20.4 Finance Dashboard

Show:

- Client receivables
- Overdue receivables
- Vendor payables
- Upcoming payments
- Paid amount
- Outstanding amount
- Project profitability

---

# 21. Navigation

Recommended primary navigation:

```text
Dashboard

Sales
  ├── Leads
  ├── Pipeline
  └── Follow-ups

Weddings
  ├── All Weddings
  ├── Upcoming
  └── Calendar

Clients

Vendors

Tasks
  ├── My Tasks
  ├── Team Tasks
  └── Calendar

Guests

Finance
  ├── Client Payments
  ├── Vendor Payments
  └── Budgets

Documents

Reports

Settings
```

The exact UI can be refined during design.

---

# 22. Wedding Detail Page

The Wedding page should be the most important operational screen.

Suggested structure:

```text
Wedding Header

Client
Wedding Date
Location
Project Value
Status
Project Manager

Overview
Functions
Tasks
Vendors
Guests
Budget
Payments
Timeline
Documents
Notes
```

The page should make it possible to manage most wedding operations without repeatedly navigating to unrelated sections.

---

# 23. Calendar

Calendar views should support:

- Wedding dates
- Function dates
- Meetings
- Tasks
- Payment due dates
- Vendor deadlines

Recommended views:

- Month
- Week
- Day
- Agenda

Filtering should allow users to isolate:

- Weddings
- Functions
- Tasks
- Payments
- Meetings

---

# 24. Search

Global search should allow users to quickly find:

- Leads
- Clients
- Weddings
- Vendors
- Tasks
- Guests
- Payments
- Documents

Search should support common identifiers such as:

- Name
- Phone
- Wedding name
- Vendor name

---

# 25. Reporting

V1 reports should focus on operational decisions.

## Sales

- Leads by status
- Leads by source
- Conversion rate
- Pipeline value
- Sales performance

## Weddings

- Active weddings
- Upcoming weddings
- Completed weddings
- Weddings by month
- Wedding workload

## Vendors

- Vendor bookings
- Vendor spend
- Vendor history
- Vendor performance

## Finance

- Client receivables
- Vendor payables
- Revenue
- Project cost
- Project profitability

## Operations

- Completed tasks
- Overdue tasks
- Tasks by employee
- Upcoming deadlines

Reports should support filtering by:

- Date
- Wedding
- Employee
- Status
- Category

Exports can support CSV/Excel in V1.

---

# 26. Notifications and Reminders

The system should create internal notifications for important events.

Examples:

### Follow-up

Lead follow-up due.

### Payment

Client payment approaching or overdue.

### Vendor

Vendor confirmation/payment deadline approaching.

### Task

Assigned task approaching deadline.

### Wedding

Upcoming wedding requiring attention.

### Function

Upcoming function with incomplete critical work.

Notifications should link directly to the relevant record.

---

# 27. Automation Rules

V1 automation should remain predictable and rule-based.

Examples:

## Lead Follow-up

When a follow-up date arrives:

→ notify assigned sales person.

## Overdue Follow-up

When a follow-up becomes overdue:

→ mark it as overdue.

## Payment Reminder

Before a payment due date:

→ notify responsible finance/user.

## Wedding Preparation

When a wedding reaches a configurable number of days before the event:

→ surface incomplete critical tasks.

## Function Preparation

When a function approaches:

→ highlight incomplete vendors, tasks, payments and requirements.

## Task Escalation

If a critical task becomes overdue:

→ notify assigned user and relevant manager.

---

# 28. AI Opportunities

AI is not a dependency for the core system.

All core functionality must work without AI.

Potential AI features:

## 28.1 Wedding Assistant

Users can ask natural-language questions about their operational data.

Examples:

> What needs my attention today?

> Which vendors are still unconfirmed?

> Which payments are overdue?

> What is pending for this wedding?

> Summarize this wedding.

## 28.2 Requirement Extraction

Given notes from a meeting, AI could identify:

- Requirements
- Tasks
- Vendor needs
- Deadlines
- Client decisions

AI must require user review before creating important records automatically.

## 28.3 Summaries

AI can summarize:

- Wedding status
- Client notes
- Vendor history
- Project risks
- Outstanding tasks

## 28.4 Future Communication Intelligence

Future versions may support:

- WhatsApp conversation summarization
- Requirement extraction from WhatsApp
- Follow-up detection
- Drafting responses
- Automatic task creation from communication

These are not required for V1.

---

# 29. Permissions

Permissions should be role-based.

## Owner/Admin

Full access.

## Sales

Can:

- View/manage leads
- Manage assigned clients
- Manage proposals
- View relevant weddings

Should not normally modify financial records unless explicitly permitted.

## Planner

Can:

- Manage assigned weddings
- Manage functions
- Manage tasks
- Manage vendors
- View relevant financial information

## Operations

Can:

- View assigned weddings
- Manage assigned tasks
- Update operational information

## Vendor Manager

Can:

- Manage vendors
- Manage vendor bookings
- View relevant payments

## Finance

Can:

- Manage payments
- Manage budgets
- View financial reports
- Manage invoices/receipts

## Field Staff

Can:

- View assigned tasks
- Update task status
- View necessary event information

Delete permissions should be restricted to administrators.

---

# 30. Auditability

Important actions should be logged.

Examples:

- Record created
- Record edited
- Payment recorded
- Payment modified
- Task reassigned
- Status changed
- Document uploaded/deleted
- User permissions changed

Audit logs are especially important for financial information.

---

# 31. Settings

Settings should include:

## Organization

- Company name
- Logo
- Contact details
- Address
- Business information

## Users

- Add user
- Remove user
- Assign role
- Activate/deactivate

## Wedding Settings

- Default function types
- Default task templates
- Default payment terms

## Vendor Settings

- Vendor categories

## Finance

- Currency
- Payment methods
- Budget categories

## Notifications

- Reminder preferences

## Security

- Password
- Sessions
- Authentication
- Audit logs

---

# 32. Authentication

V1 should support secure authentication.

Recommended:

- Email/password
- Secure session management
- Password reset
- Role-based authorization

Google login can be added later if required.

Two-factor authentication can be considered as a future enhancement.

---

# 33. Data Architecture — Conceptual

The developer should model the system around these core entities:

```text
User
Role
Lead
Client
Wedding
Function
Task
Vendor
VendorBooking
Guest
Budget
BudgetItem
ClientPayment
VendorPayment
Document
TimelineItem
CommunicationNote
Notification
AuditLog
```

Relationships:

```text
Lead
  └── Client

Client
  └── Wedding

Wedding
  ├── Functions
  ├── Tasks
  ├── VendorBookings
  ├── Guests
  ├── BudgetItems
  ├── ClientPayments
  ├── VendorPayments
  ├── Documents
  ├── TimelineItems
  └── CommunicationNotes

Vendor
  └── VendorBookings

User
  └── Tasks
```

A detailed normalized database schema should be created during technical design after this PRD is approved.

---

# 34. Data Ownership

The company owns all operational data.

Data should not be exposed between unrelated deployments.

The system must maintain historical records.

Completed weddings should remain searchable.

Records should generally be archived rather than permanently deleted when historical integrity matters.

---

# 35. Responsive Design

The system is a responsive web application.

## Desktop

Primary environment for:

- Owner
- Sales
- Finance
- Planning
- Reporting

## Mobile Browser

Primary use cases:

- Field staff
- Planners during events
- Quick task updates
- Calling clients
- Opening WhatsApp
- Checking vendor details
- Checking timelines
- Updating status

The mobile experience should prioritize speed and essential information rather than attempting to reproduce every desktop feature.

---

# 36. UX Principles

The application should follow these principles:

1. Operational clarity over visual decoration
2. Important information should be visible immediately
3. Minimize unnecessary clicks
4. Avoid forcing users to enter the same information multiple times
5. Contextual actions should appear near the relevant data
6. Wedding planners should be able to operate the system quickly on mobile
7. Financial information should be unambiguous
8. Overdue work should be highly visible
9. The system should favor practical tables, timelines and dashboards over decorative UI
10. The most important question should always be: "What needs attention?"

---

# 37. V1 Feature Prioritization

## Must Have

### CRM

- Leads
- Lead pipeline
- Follow-ups
- Clients
- Lead conversion

### Wedding Management

- Wedding projects
- Multiple functions
- Wedding dashboard
- Wedding status
- Team assignment

### Vendors

- Vendor directory
- Vendor categories
- Vendor profiles
- Vendor bookings
- Vendor history

### Tasks

- Task creation
- Assignment
- Due dates
- Priority
- Status
- My Tasks
- Overdue tasks

### Finance

- Wedding budget
- Budget categories
- Client payments
- Vendor payments
- Payment schedules
- Outstanding balances
- Basic profitability

### Guests

- Guest list
- RSVP
- Function attendance

### Documents

- Upload
- Attach to records
- Download/view

### Timeline

- Wedding timeline
- Function timeline
- Task/payment deadlines

### Communication

- WhatsApp click-to-chat
- Phone click-to-call
- Communication notes

### Dashboard

- Role-based dashboard
- Upcoming work
- Follow-ups
- Payments
- Tasks
- Upcoming weddings

### Authentication & Permissions

- Login
- Roles
- Permissions
- User management

---

# 38. Should Have

- Calendar
- CSV/Excel export
- Proposal tracking
- Invoice generation
- Receipt generation
- Notification center
- Vendor ratings
- Task templates
- Wedding templates
- Advanced filtering
- Saved views
- Activity history
- Audit logs
- Basic reports

---

# 39. Nice to Have

- AI Wedding Assistant
- AI meeting-note extraction
- AI project summaries
- AI requirement extraction
- Advanced profitability analytics
- Custom dashboards
- Automated report generation
- Google Calendar integration

---

# 40. Future Versions

## V2

Potentially:

- WhatsApp Business API
- WhatsApp conversation history
- Automated WhatsApp reminders
- Client portal
- Vendor portal
- Advanced guest logistics
- Accommodation management
- Transportation management
- Room allocation
- Native mobile application
- Advanced AI assistant

## V3

Potentially:

- Multi-tenant SaaS
- Subscription billing
- Vendor marketplace
- Vendor discovery
- Cross-company benchmarking
- Advanced AI operations
- Automated communication workflows
- Enterprise features
- White-label deployments

---

# 41. Critical Product Rules

## Rule 1 — Don't turn the product into a generic CRM

Wedding operations remain the core.

## Rule 2 — Don't make WhatsApp a dependency

The system must work even when communication happens externally.

## Rule 3 — Don't make AI a dependency

Core business operations must function without AI.

## Rule 4 — Preserve historical data

Completed weddings, vendor history, payments and financial information should remain available.

## Rule 5 — Avoid duplicate data

Client information should not need to be re-entered when converting a lead.

## Rule 6 — Financial records require care

Payment changes should be traceable.

## Rule 7 — Wedding is the operational center

Most operational screens should connect back to a wedding/function.

---

# 42. Key User Stories

## Sales

- As a salesperson, I want to see all leads so I know who needs attention.
- As a salesperson, I want follow-up reminders so I don't forget prospects.
- As a salesperson, I want to convert a won lead into a client and wedding without re-entering information.
- As a salesperson, I want to see my pipeline.

## Planner

- As a planner, I want to see everything related to a wedding in one place.
- As a planner, I want to break a wedding into functions.
- As a planner, I want to assign tasks to team members.
- As a planner, I want to see overdue work.
- As a planner, I want to see unconfirmed vendors.
- As a planner, I want to see upcoming deadlines.

## Vendor Manager

- As a vendor manager, I want a reusable vendor database.
- As a vendor manager, I want to see a vendor's previous bookings.
- As a vendor manager, I want to track vendor booking status.
- As a vendor manager, I want to see outstanding vendor payments.

## Finance

- As finance, I want to know how much each client owes.
- As finance, I want to know which payments are overdue.
- As finance, I want to know how much is owed to vendors.
- As finance, I want to understand project profitability.

## Owner

- As an owner, I want a company-wide view of active weddings.
- As an owner, I want to see revenue and outstanding payments.
- As an owner, I want to know which projects are at risk.
- As an owner, I want to understand team workload.

## Field Staff

- As field staff, I want to see my assigned tasks on my phone.
- As field staff, I want to mark tasks complete quickly.
- As field staff, I want to see the information necessary to execute my work.

---

# 43. Acceptance Criteria — Core Workflow

The following end-to-end scenario must work:

1. User creates a lead.
2. Lead is assigned to a salesperson.
3. Salesperson records contact.
4. Follow-up is scheduled.
5. Requirements are recorded.
6. Meeting is recorded.
7. Proposal information is recorded.
8. Negotiation is recorded.
9. Lead is marked Won.
10. Client is created or selected.
11. Wedding project is created.
12. Wedding functions are created.
13. Project team is assigned.
14. Vendors are selected from the vendor database.
15. Vendor bookings are created.
16. Tasks are created and assigned.
17. Budget is created.
18. Client payment schedule is created.
19. Vendor payment obligations are created.
20. Guest list is added.
21. RSVP status is updated.
22. Documents are uploaded.
23. Timeline is maintained.
24. Upcoming work appears on dashboards.
25. Overdue tasks and payments are surfaced.
26. Wedding is marked completed.
27. Final payments are recorded.
28. Project is closed.
29. Historical wedding remains accessible.

---

# 44. Success Metrics

The product should ultimately be measured against business outcomes.

Primary metrics:

- Reduction in missed follow-ups
- Reduction in overdue tasks
- Reduction in payment tracking errors
- Reduction in vendor coordination errors
- Time required to understand wedding status
- Time required to find project information
- Percentage of active weddings fully tracked
- Percentage of tasks completed on time
- Percentage of client payments collected on time
- Project profitability visibility
- User adoption by team members

The most important qualitative success criterion is:

> A wedding manager should be able to understand what is happening across their weddings without opening multiple spreadsheets, notebooks, or WhatsApp conversations.

---

# 45. Development Recommendation

Recommended implementation direction:

## Frontend

- Next.js
- TypeScript
- Responsive web application
- shadcn/ui or equivalent component system

## Backend

- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage
- Row-level security where appropriate

## Hosting

- Vercel for frontend
- Supabase for backend/database/storage

The exact stack can be changed by the developer if there is a strong technical reason, but the product requirements must remain unchanged.

---

# 46. Development Phases

## Phase 1 — Foundation

- Authentication
- Users
- Roles
- Organization settings
- Database foundation
- Navigation
- Core UI system

## Phase 2 — CRM

- Leads
- Pipeline
- Follow-ups
- Clients
- Lead conversion

## Phase 3 — Wedding Operations

- Weddings
- Functions
- Tasks
- Timeline
- Team assignments

## Phase 4 — Vendors

- Vendor directory
- Vendor profiles
- Vendor bookings
- Vendor history

## Phase 5 — Finance

- Budgets
- Client payments
- Vendor payments
- Profitability
- Invoices/receipts

## Phase 6 — Guests & Documents

- Guest list
- RSVP
- Documents
- Attachments

## Phase 7 — Dashboard & Reporting

- Role-based dashboards
- Calendar
- Reports
- Notifications
- Global search

## Phase 8 — QA & Deployment

- Permission testing
- Financial data testing
- Mobile testing
- Workflow testing
- Security testing
- Backup verification
- Production deployment

---

# 47. Testing Requirements

The developer must test:

## Authentication

- Login
- Logout
- Password reset
- Unauthorized access

## Permissions

- Role restrictions
- Financial access
- Delete restrictions
- User management

## CRM

- Lead creation
- Follow-up
- Conversion
- Client creation

## Weddings

- Wedding creation
- Multiple functions
- Team assignments
- Status changes

## Vendors

- Vendor creation
- Reuse
- Booking
- Payment

## Finance

- Payment creation
- Partial payments
- Overdue payments
- Balance calculations
- Profit calculations

## Tasks

- Assignment
- Due dates
- Overdue status
- Completion

## Guests

- Guest creation
- RSVP
- Function attendance

## Documents

- Upload
- Download
- Attachments
- Access permissions

## Responsive

Test at:

- Desktop
- Tablet
- Mobile browser

---

# 48. Security Requirements

Minimum requirements:

- Secure authentication
- Role-based authorization
- Server-side permission validation
- Protected financial records
- Secure document storage
- Audit trail for sensitive changes
- Input validation
- Secure file upload validation
- HTTPS in production
- Regular database backups
- Environment secrets must not be exposed to frontend code

---

# 49. Backup and Recovery

The system must maintain reliable backups of:

- Database
- Uploaded documents
- Important configuration

Recovery procedures should be documented before production launch.

---

# 50. Open Product Decisions

The following are intentionally not hard-coded because they are implementation/business decisions that can be finalized during development:

- Final product branding/name
- Exact invoice design
- Exact proposal format
- Exact wedding templates
- Exact notification timing
- Exact default wedding/function categories
- Exact financial tax requirements
- Exact document storage limits
- Exact reporting formats
- Final UI visual language

These should not block the core product architecture.

---

# 51. Final Product Definition

The V1 product is a **private Wedding Operations Platform for Indian wedding/event management companies**.

Its central workflow is:

```text
LEAD
 ↓
CLIENT
 ↓
WEDDING
 ↓
FUNCTIONS
 ↓
PLANNING
 ↓
VENDORS + TASKS + GUESTS + BUDGET
 ↓
EXECUTION
 ↓
PAYMENTS
 ↓
CLOSURE
```

The system's primary purpose is to give the wedding management team one reliable operational source of truth.

The product should answer four questions at all times:

1. **What weddings are we managing?**
2. **What needs to happen next?**
3. **Who is responsible for it?**
4. **What money is coming in or going out?**

If the software consistently answers those four questions, it is solving the core problem it was built for.
