# Project Specification Document - Dobby

This is an expense tracking and visualization webapp to start with. This project is a passion project which promises quality but is not funded so we will use free tier serices with scaling constraints. Write code that is scalable and the expectation is the app to be constrained by infrastructure and not coding implementation. 
If we need to scale up, the app should automatically be scalable if given resources on teh infrastrcuture level.
Adhere to good design patterns, reuse components wherever possible, avoid lengthy functions that are complicated. Break functional components down into smaller ones that keep things manageable. Follow separation of concern, and keep things decoupled as much as possible.

Keep the build as lean as possible, pull in packages wherever necessary but don't promote bloating the project with a lot of dependencies.

## 1. Project Overview
- **Project Name**: [Dobby]
- **Project Description**: Dobby helps users track their expenses using their financial transactions data. It groups by category and surfaces to the user where their money is being spent monthly, and what their current budget is.  
- **Purpose/Goals**: 
    - Show users a good easy visulaization of what categories cost them how much monthly.
    - Show transaction that were beyond a acceptable threshold and what are the outliers that particular month.
    - Overall track the household expenses and give them a rich categorical filter capability, including types of expenditures, custom categorical tagging to customize what each user considers as a particular category.
- **Target Users**: Any user with a valid bank account and a credit card hisotry.
- **Timeline**: 1 week

## 2. Technology Stack
- **Platform**: [Webapp]
- **Frontend Framework**: [React]
- **Backend Framework**: [FastAPI]
- **Database**: [SQLite for local, PostgreSQL (Supabase) for production]
- **Authentication**: [JWT]
- **Hosting**: 
    - Vercel for APIs and FE application
    - Supabase for Database and User Authentication.
    - Supabase for edge functions that will sync data from Plaid APIs to supabase database
    - Local development should be off of a sqlite database for development
- **Additional Tools/Libraries**: 
    - python Plaid API sdk
    - any good and well supported visulization library for UI viz
    - supabase sdks for FastAPI backend work
    - supabase authentication

## 3. Database Modeling
### 3.1 Entity-Relationship Overview

- Every user can own many transaction. User -> Transaction is Foreign Key relationship.
- Every transaction can have one category, but a custom category can be related to many transactions.
- Every custom categry can be related to only one user. But a user can have many categories.

### 3.2 Database Schema
```
[Include ER diagram or detailed schema definitions]

Example:
- Users (id, email, password_hash, created_at, updated_at)
- Transactions (Fields matching Plaid API response object and additionally, our user_id, custom_category)
- Categories (id, label, value, created_at, updated_at, user_id, color)
```

### 3.3 Constraints and Rules of Development
- First focus on getting a clean local development set up and secondary set up the scaffolding for deplyment. We will focus on getting this production ready after we verify the app is working locally with local components.
- Limit the number of users at 15. For any users trying to sign up or login after then system has 50 users, create a waitlisting mechanism where they can request access. This is to prevent unforeseen scale up. 
- Admin should be able to see a list of user emails which are waitlisted. Once apprved, they should be allowed to login.
- Only use free tier services for production. This project has a very tight budget can will focus on the dependability of functionality first rather than scaling out for many users.
- Focus on building a deterministic system wherever possible, and make sure the code generated is scalable within constraints. 
- The frontend of the webapp should be highly responsive since the users will access it in different browsers/mobile screens.
- The UI should be simple and modern. Due to lack of mock ups, there is not design standard. Decide a design standard and replicate the styling to be at par with popular applications which exhibit good design language.
- Simplicity and cleanliness in design over complexity and sophisticated design.
- We are dealing with real financial data. Consider all security concerns and data integrity rules to protect customer data over anything. Flag any issue that you can't resolve with optimum choice. Users data should never be available to anybody in raw text except the user themselves.

## 4. Feature Set & Functionality
### 4.1 Core Features
- User should be able to login using login with Supabase auth system with provider as google.
- User should be able to fetch their own categories if created, their User profile details to view on the frontend.
- User should be able to delete their entire data if they so choose to from the platform. This shold perform a soft delete on the data and slate it for deletion after 45 days of retention.
- User should be able to link their bank account that they want to track finances against.
- User should link using Plaid API to get public token, and using this, the system should fetch the access token for future sync data.
- The system should save this token and the cursor to use for  fetching data.
- User should be able to create categories and tag transactions shown to them conveniently with custom categories if they want.
- User should see their transactions visualized as Line graphs over the past month, percentage chart by category and and they historical spending habit for the past 3 months summed up.


### 4.2 Secondary Features
- [ ] Feature A: [Description]
- [ ] Feature B: [Description]

### 4.3 Admin/Moderation Features
Admin should not be able to see user data, but should be able to purge users data on request.

## 5. User Journeys
### 5.1 Primary User Journey: [Journey Name]
**Actor**: [User type]
**Goal**: [What the user wants to accomplish]

1. User arrives at [location]
2. User performs [action]
3. System responds with [expected outcome]
4. User performs [action]
5. [Continue until goal is achieved]

**Happy Path**: [Expected successful flow]
**Error Cases**: [What happens if something goes wrong]

### 5.2 Secondary User Journey: [Journey Name]
[Repeat structure above]

## 6. Component Architecture
### 6.1 Frontend Components
- **Layout Components**
  - Header: [Description]
  - Sidebar: [Description]
  - Footer: [Description]
  
- **Page Components**
  - Home Page: [Key elements]
  - Dashboard Page: [Key elements]
  
- **Reusable Components**
  - Button: [Variations/states]
  - Modal: [Behavior]
  - Form Input: [Features]

### 6.2 Backend Endpoints

#### Transactions
```
GET /api/v1/transactions?filter[start_date]=<value>&filter[end_date]=<value>
- Filter based on dates; additional filtering done on frontend to reduce API calls
- Default range: 1st of current month to current date
- Edge cases: validate max date range, return error if invalid

POST /api/v1/transactions/<id>/category
- Tag a transaction with a custom category
- Frontend prioritizes custom categories over Plaid defaults
- Returns 404 if transaction/category not found

DELETE /api/v1/transactions/<id>
- Soft delete transaction (mark for retention period)
```

#### Categories
```
GET /api/v1/categories
- Retrieve user-defined categories

POST /api/v1/categories
- Create custom category (name, color, user_id)

PUT /api/v1/categories/<id>
- Update existing category

DELETE /api/v1/categories/<id>
- Delete category; reassign tagged transactions to default
```

#### Users
```
GET /api/v1/users/profile
- Retrieve user details and settings

POST /api/v1/users/link-account
- Exchange Plaid public token for access token
- Store access token and cursor for data syncing

POST /api/v1/users/sync-transactions
- Trigger transaction sync from Plaid API
- Use stored cursor for incremental updates

DELETE /api/v1/users/account
- Soft delete all user data; slate for deletion after 45 days
```

#### Admin
```
GET /api/v1/admin/waitlist
- Retrieve waitlisted user emails (admin only)

POST /api/v1/admin/approve/<user_id>
- Approve waitlisted user for access

POST /api/v1/admin/purge/<user_id>
- Hard delete user data on request (admin only)
```

#### Authentication
```
POST /api/v1/auth/google
- Google OAuth callback handler via Supabase
```

## 7. UI/UX Requirements
- **Design System**: Google Material Design 3
- **Responsive Design**: [Mobile / Tablet / Desktop breakpoints]
- **Key User Flows**: [Visual description or wireframes]

## 8. Non-Functional Requirements
- **Performance**: [Load time targets, optimization requirements]
- **Security**: [Encryption, HTTPS, input validation, rate limiting]
- **Testing**: [Unit test coverage of 85%, use stubs wherever possible to test with external dependencies]
- **Documentation**: [README, inline comments]

## 9. Third-Party Integrations
- **Plaid API**: Transaction fetching and account linking
  - Public token exchange for access token
  - Transaction sync via cursor-based incremental updates
- **Supabase**: Authentication, database, edge functions
  - Google OAuth provider
  - PostgreSQL database
  - Edge functions for Plaid sync jobs
  - Plaid calls our webhook, we NEVER setup a manual sync to fetch data on demand of the user.

## 10. Deployment & DevOps
- **Environment Setup**: [Development (local), production]
- **CI/CD Pipeline**: 
    - Github Actions
        - Add a step for pre-commit linter with necessary rules. No need to be very stringent, but I expect a basic sanitation of code and formatting/linting.
        - Run all unit tests on CI. 

## 11. Edge Cases & Error Handling
- **Input Validation**: Whitelist allowed characters, enforce max/min lengths on all string inputs, validate date ranges, reject null/undefined critical fields
- **Error Messages**: Return user-friendly HTTP status codes with descriptive messages (no stack traces or internal details exposed)
- **Rate Limiting**:
  - Global rate limit: 1000 requests per hour per IP
  - Per-endpoint limits:
    - `/api/v1/auth/login`: 5 attempts per 15 minutes per IP (brute force protection)
    - `/api/v1/transactions`: 100 requests per hour per user
    - `/api/v1/categories`: 50 requests per hour per user
    - `/api/v1/users/sync-transactions`: 10 requests per hour per user (Plaid sync throttle)
    - `/api/v1/admin/*`: 50 requests per hour per admin user
  - Implementation:
    - Use FastAPI middleware with `slowapi` library for distributed rate limiting
    - Return `429 Too Many Requests` with `Retry-After` header when limit exceeded
    - Log rate limit violations for DDoS detection
  - DDoS Mitigation:
    - IP-based blocking after 10,000 requests in 1 hour
    - Temporary blacklist (1 hour duration)
    - Admin dashboard to monitor and manage blocked IPs

## 12. Future Enhancements
- Once the app is working and functional, we will consider adding caching for basic performance.We will choose vercel for cachign since our hosting is on Vercel.
- [Scalability improvements]
- [Performance optimizations]

---

**Document Version**: 1.1
**Last Updated**: [22nd March 2026]
**Owner**: [Debojit Kaushik]