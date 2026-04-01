# Interview Study Guide: Finance Dashboard Backend

Use this guide to understand exactly what we built and how to explain it confidently in an interview. Even as a beginner, expressing these concepts clearly will make you sound like a highly competent engineer!

## 1. The Request Flow (The Architecture)
When a user makes a request (like creating a new financial record), it travels through 5 distinct layers. You should explain this **"Separation of Concerns"** to the interviewer:

1. **Routes (`/src/routes`)**: The entry point. It simply says "If a POST request comes to `/api/records`, run the middleware and then send it to the controller."
2. **Middleware (`/src/middleware`)**: The security guards. 
   - `auth.js` checks if the user has a valid JWT token.
   - `rbac.js` checks if the user's role is allowed (e.g., must be 'admin').
   - `validate.js` checks if the incoming data format is correct.
3. **Controllers (`/src/controllers`)**: The messengers. They take the request, pass the data down to the Service layer, and return a clean JSON response back to the user. Controllers never interact with the database directly!
4. **Services (`/src/services`)**: The brain. This is where the actual business logic lives and where we write the raw database SQL queries.
5. **Database (SQLite)**: The storage layer.

## 2. Key Decisions & How to Defend Them

> [!TIP]
> **Why SQLite instead of MongoDB?**
> **Your Answer:** "Because this was an assessment designed to be run locally, I prioritized a 'zero-configuration' setup. SQLite doesn't require the reviewer to install a database server or configure connection strings. Furthermore, the dashboard required complex analytics (like calculating SUMs and grouping by month) which are incredibly powerful and native to relational SQL."

> [!TIP]
> **What is JWT and how does it work here?**
> **Your Answer:** "JWT stands for JSON Web Token. When a user logs in successfully, the backend creates a token containing their `id` and `role`. For every future request, the client sends this token. My `auth.js` middleware verifies the token signature. If valid, it attaches the user's identity to the request, so the app always knows who is performing the action without having to look up passwords again."

> [!TIP]
> **How did you handle Access Control?**
> **Your Answer:** "I used a middleware pattern. Instead of writing messy `if/else` statements inside my core logic, I built an `authorize()` middleware. You can clearly read the security rules right on the route definitions (e.g., `authorize('analyst', 'admin')`). It stops unauthorized users before they even reach the business logic."

> [!TIP]
> **Why use `deleted_at` instead of actually deleting rows?**
> **Your Answer:** "This is called a **Soft Delete**. In financial systems, you never want to permanently erase records because you need an audit trail. By setting a `deleted_at` timestamp, the record becomes invisible to standard queries (like the dashboard) but remains in the database for historical and compliance purposes."

## 3. How to Answer Common Interview Questions

**Q: What happens if a user submits bad data? (e.g. text instead of a number for the Amount)**  
> "I used the `express-validator` library. Before the request even hits the controller, the rules check if the fields match the required types. If validation fails, my `validate.js` middleware instantly returns a `400 Bad Request` with an array of exact errors. It saves the database from trying to save bad data."

**Q: What happens if the app throws a random error? Does the server crash?**  
> "No, all my controller functions use a `try/catch` block. If an unexpected error occurs, it is passed using `next(err)` to my Global Error Handler middleware. This acts as a safety net, ensuring the server stays alive and returns a generic 500 JSON error response to the client."

**Q: Why separate Controllers and Services?**  
> "It makes the code much cleaner and easier to test. Controllers only worry about reading HTTP requests and sending HTTP responses. Services only worry about the core logic and talking to the database. If I ever wanted to change Express to a different framework, I would only have to rewrite the controllers—my services would stay exactly the same."
