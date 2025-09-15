# Project Container App

## Overview

The Project Container App is a core application for the FiberWise platform, designed to provide a centralized interface for managing projects and their associated notebooks. It allows users to create, view, edit, and organize their work within distinct project contexts.

This app serves as the primary entry point for project-related activities and integrates with other platform features like AI agents and potentially plugins.

## Features

*   **Project Management:**
    *   List all accessible projects.
    *   Create new projects with names and descriptions.
    *   View a dashboard for individual projects.
    *   Configure project settings (name, description).
*   **Notebook Management:**
    *   List notebooks within a specific project.
    *   Create new notebooks with titles, types, and optional initial content.
    *   View and edit notebook content (currently using a basic textarea).
    *   Auto-save notebook content changes.
    *   Edit notebook titles inline.
*   **Agent Integration:**
    *   View agents associated with a project (in settings).
    *   Add new agent instances to a project from available agent types (via overlay/settings).
    *   Remove agents from a project.
    *   (Partially Implemented) Add agents during project creation.
*   **Navigation:** Provides clear routing and breadcrumbs for navigating between the project list, individual project dashboards, notebooks, and settings pages.
*   **Platform Integration:**
    *   Uses `AppBridge` for platform communication (notifications, routing).
    *   Leverages the `fiberwise` SDK for CRUD operations on core data models (`projects`, `notebooks`).
    *   Integrates with platform APIs for agent management (`/api/v1/...`).
    *   Defines routes, models, permissions, and UI components via `app_manifest.yaml`.
    *   Provides navigation components (`project-list-nav`) for the main site sidebar.

## Architecture

*   **Frontend Framework:** Built using standard Web Components (custom elements) and vanilla JavaScript. No specific frontend framework like React, Vue, or Angular is used.
*   **Styling:** CSS is encapsulated within each component's Shadow DOM. Some global styles might be inherited from the platform. Raw CSS files are imported into JavaScript components.
*   **Build Tool:** Uses Vite for development server, building, and optimizing the frontend assets.
*   **State Management:** A simple, custom global state object (`AppState` in `app-init.js`) is used to hold shared information like the `DynamicData` client, router instance, app configuration, and loaded data models.
*   **Data Interaction:**
    *   **Core Data (`projects`, `notebooks`):** Primarily uses the `fiberwise` SDK, interacting with the platform's DynamicData API (`/api/v1/data/{appSlug}/...`).
    *   **Agent Management:** Uses direct `fetch` calls to specific platform API endpoints (e.g., `/api/v1/projects/:projectId/agents`, `/api/v1/agent-types`).
*   **Routing:** Relies on the router provided by the `AppBridge` (`appBridge._router`). Navigation helpers are available in `AppState`. Routes are defined in `app_manifest.yaml`.

## Core Components

*   **`app/index.js`:** Main entry point, initializes the app, sets up `AppState`, and registers components.
*   **`app/app-init.js`:** Defines `AppState` and the main initialization logic.
*   **Pages (`app/ui/pages/`)**
    *   `project-page`: Displays the list of all projects.
    *   `new-project-page`: Form for creating a new project.
    *   `project-dashboard`: Main view for a single project, displaying notebooks and potentially other information (agents, stats, activity). Includes tabbed interface logic for plugins.
    *   `notebook-page`: View/edit page for a single notebook.
    *   `new-notebook-page`: Form for creating a new notebook within a project.
    *   `project-settings`: Overlay/page for managing project name, description, and associated agents.
    *   `new-agent-page`: Overlay/page for adding a new agent instance to a project.
*   **Components (`app/ui/components/`)**
    *   `notebook-list`: Reusable component to display a list of notebooks for a given project.
    *   `project-list-nav`: Component designed for the main site navigation sidebar, listing projects.
    *   `create-project-action` / `create-notebook-action`: Floating Action Buttons (FAB) used as page actions (defined in manifest).

## Data Models & Concepts

*   **`Project` (`projects` model slug):**
    *   `project_id` (Primary Key)
    *   `name` (String, Required)
    *   `description` (Text)
    *   `settings` (Object, optional): Contains project-specific settings like theme, visibility etc.
    *   *(Implicitly Related)*: Agents
*   **`Notebook` (`notebooks` model slug):**
    *   *(Implicit Primary Key)* `item_id`
    *   `title` (String, Required)
    *   `type` (String, e.g., 'general', 'research')
    *   `content` (Text)
    *   `project_id` (UUID, Foreign Key linking to Project)
    *   *(Implicitly Related)*: Agents (via `agent_assignments`)
*   **Platform Concepts (Interacted via API):**
    *   `Agent Type`: Defines available types of agents (e.g., 'research-agent', 'summary-agent').
    *   `Agent Instance`: A specific instance of an agent type, potentially with configuration, associated with a project.
    *   `Agent Assignment`: Links an Agent Instance to an entity (like a Project or Notebook).

## Platform Integration (`app_manifest.yaml`)

*   **`appName`, `appSlug`, `version`, `description`:** Basic app metadata.
*   **`entryPoint`:** Specifies the main JavaScript file (`dist/index.js`).
*   **`rootSlug`:** Defines the base URL path for the app (`/projects`).
*   **`slots`, `widgets`:** Declares integration points within the platform UI.
*   **`permissions`:** Declares required read/write access to data models (`projects`, `notebooks`).
*   **`models`:** Defines the structure of data models *as understood by the platform* (currently only `Project` is explicitly defined here).
*   **`components`:** Lists the web components used for pages/routes.
*   **`routes`:** Defines the application's URL structure, mapping paths to components, specifying titles, icons, dynamic parameters, overlay behavior, and page actions.

## Building the App

The application uses Vite for its build process.

*   **Development:**
    ```bash
    npm run dev
    ```
    Starts a local development server (likely on port 5557 as per `vite.config.js`).
*   **Production Build:**
    ```bash
    npm run build
    ```
    Creates an optimized build in the `dist/` directory.
*   **Watch Mode (for Platform Integration):**
    ```bash
    npm run watch
    # or
    vite build --watch
    ```
    Builds the app and watches for changes. Crucially, this mode outputs the build artifacts directly into the FiberWise platform's expected directory (`fiberwise_util/fiberwise_util/fiberwise_core/client/app_bundles/{app-id}/`), allowing for live updates during platform development.

## Dependencies

*   `@fortawesome/fontawesome-free`: Used for icons throughout the UI.
*   `fiberwise`: The FiberWise SDK for interacting with the DynamicData API (provided locally).
*   `vite`: Build tool and development server.

## Notes & Potential Improvements

*   The app uses a mix of the `DynamicData` SDK (for projects/notebooks) and direct `fetch` calls to platform APIs (for agents). Consolidating data access patterns could be considered.
*   Some components like action buttons use `window.router`, which might be outdated. They should ideally use the router instance provided via `AppBridge` or `AppState`.
*   Error handling can be further enhanced in API calls.
*   Inline editing functionality (e.g., for project description on the dashboard) is mentioned but not fully implemented.
*   The agent creation flow during *new project creation* seems less developed than adding agents via settings.
*   The plugin tab initialization in the dashboard relies on an external `pluginManager` which is not part of this codebase.
*   The Python agent code (`agent/test_activation.py`) and worker documentation (`worker/README.md`) provide context for backend processing but are not directly part of this frontend application package build/runtime.

