# Deep Research From Scratch Agent

This FiberWise application implements an autonomous AI agent capable of performing comprehensive research on a given topic, starting with nothing but a user's query.

## The Meaning of "Deep Research from Scratch"

This system embodies a paradigm shift from simple information retrieval to **automated, agentic knowledge synthesis**.

*   **From Scratch:** The system begins with only a user's query. It has no pre-existing, curated knowledge base. It must dynamically build its understanding by actively exploring the live internet.
*   **Deep:** The process is an iterative, multi-step investigation. The "depth" comes from the system's ability to decompose a problem, explore multiple sources, critically evaluate content, and synthesize its findings into a coherent narrative.
*   **Agentic:** The core of the system is an LLM-powered agent that can reason, plan, and use tools (like web search and scraping) to achieve its goal.

## The Workflow

The agent operates in three main phases, mimicking a human researcher:

### 1. Planning
The agent receives a high-level topic and generates a structured research plan, breaking the topic down into a series of logical sub-questions.

### 2. Iterative Research & Execution
The agent enters a loop to execute its plan:
1.  **Selects a task** from the plan.
2.  **Chooses the best tool** (e.g., `web_search`).
3.  **Executes the tool** to find relevant URLs.
4.  **Uses another tool** (`scrape_website`) to read the most promising sources.
5.  **Updates its memory** with the new information.
6.  **Repeats** until the plan is complete.

### 3. Synthesis and Report Generation
Once the research is complete, the agent consolidates all the information it has gathered and uses a final LLM call to write a comprehensive, well-structured report.

This application provides a powerful example of how AI agents can be used to automate complex knowledge work.
