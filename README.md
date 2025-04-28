# WhatsApp Server Project

This project is a comprehensive WhatsApp server system consisting of multiple services and a frontend application. It enables managing WhatsApp sessions, sending and receiving messages, and interacting with chats through a modular and scalable architecture.

## Project Components

### 1. API Service (`api-service/`)

- Built with Lumen 10 micro-framework (PHP).
- Provides RESTful API endpoints for managing WhatsApp sessions, messages, and chats.
- Uses PostgreSQL as the database backend.
- Implements database migrations to automate schema creation and updates.
- Modular folder structure for maintainability:
  - Controllers under `app/Http/Controllers/{Module}`
  - Models under `app/Models/{Module}`
- Key API endpoints:
  - Session management: create, list, delete sessions.
  - Message sending and replying.
  - Chat and message retrieval.
- Configuration:
  - Database connection configured via `.env` file.
  - Migrations located in `database/migrations/`.
- To run:
  1. Install dependencies with `composer install`.
  2. Configure `.env` with your PostgreSQL credentials.
  3. Run migrations: `php artisan migrate`.
  4. Start the server: `php -S localhost:8000 -t public`.

### 2. WhatsApp Service (`whatsapp-service/`)

- Node.js service (details not covered here).
- Handles actual WhatsApp interactions and business logic.
- API service proxies some requests to this service.

### 3. Frontend (`frontend/`)

- Vue.js 3 application.
- Uses the 
 components and styling.
- Provides user interface for interacting with WhatsApp sessions, messages, and chats.

## How to Use

1. Ensure PostgreSQL is installed and running.
2. Set up the API service:
   - Configure `.env` with database credentials.
   - Run migrations to create necessary tables.
   - Start the Lumen API server.
3. Set up and start the WhatsApp service (refer to its own documentation).
4. Start the frontend application.
5. Use the frontend or API endpoints to manage WhatsApp sessions and messages.

## Development Notes

- The API service follows Lumen conventions for folder structure and namespaces.
- Database migrations help keep schema in sync and avoid manual table creation.
- Modular design allows easy extension and maintenance.
- The frontend uses Vue 3 with the latest Bootstrap 5 and BootstrapVue 3 for modern, responsive UI design.

## License

MIT License
