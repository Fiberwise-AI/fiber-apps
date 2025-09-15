import os
import asyncio
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.schema.output_parser import StrOutputParser

from .prompts.planner_prompt import PLANNER_PROMPT
from .prompts.researcher_prompt import RESEARCHER_PROMPT
from .prompts.writer_prompt import WRITER_PROMPT
from .tools.web_tools import search_tavily, scrape_website

# Ensure API keys are set as environment variables
# os.environ["OPENAI_API_KEY"] = "sk-..."
# os.environ["TAVILY_API_KEY"] = "tvly-..."

class DeepResearchAgent:
    """
    An agent that performs a multi-step research process, from planning to synthesis.
    """
    def __init__(self, activation_context):
        self.context = activation_context
        self.llm = ChatOpenAI(model="gpt-4-turbo-preview")
        self.log_callback = self.context.get('log_callback')

    async def log(self, message):
        """Helper to send logs to the frontend if a callback is available."""
        if self.log_callback:
            await self.log_callback(message)

    async def activate(self, prompt: str):
        """
        Main entry point for the agent. Orchestrates the research process.
        """
        await self.log(f"Starting deep research for: '{prompt}'")

        # Phase 1: Planning
        await self.log("Phase 1: Generating research plan...")
        plan = await self.generate_plan(prompt)
        await self.log(f"Research Plan:\n{plan}")

        # Phase 2: Iterative Research
        await self.log("Phase 2: Executing research...")
        research_results = await self.execute_research(plan)
        await self.log("Research complete. Gathered context from multiple sources.")

        # Phase 3: Synthesis
        await self.log("Phase 3: Synthesizing final report...")
        report = await self.write_report(prompt, research_results)
        await self.log("Report generation complete.")

        return {"report": report, "sources": research_results}

    async def generate_plan(self, query: str) -> str:
        """Generates a research plan using the planner prompt."""
        planner_chain = ChatPromptTemplate.from_template(PLANNER_PROMPT) | self.llm | StrOutputParser()
        plan = await planner_chain.ainvoke({"query": query})
        return plan

    async def execute_research(self, plan: str) -> list:
        """Executes the research plan by searching and scraping."""
        research_chain = ChatPromptTemplate.from_template(RESEARCHER_PROMPT) | self.llm | StrOutputParser()
        
        # Generate search queries from the plan
        search_queries_str = await research_chain.ainvoke({"plan": plan})
        search_queries = [q.strip() for q in search_queries_str.split("\n") if q.strip()]
        
        all_scraped_content = []

        for i, query in enumerate(search_queries):
            await self.log(f"  - Searching for: '{query}' ({i+1}/{len(search_queries)})")
            search_results = await search_tavily(query)
            
            if not search_results:
                await self.log(f"    -> No search results found.")
                continue

            # Scrape the top 2 results for simplicity
            for result in search_results[:2]:
                url = result.get('url')
                if url:
                    await self.log(f"    -> Scraping: {url}")
                    content = await scrape_website(url)
                    if content:
                        all_scraped_content.append({
                            "url": url,
                            "content": content[:2000] # Truncate for context window
                        })
        
        return all_scraped_content

    async def write_report(self, query: str, research_context: list) -> str:
        """Writes the final report based on the gathered context."""
        context_str = "\n\n".join([f"Source URL: {item['url']}\nContent: {item['content']}" for item in research_context])
        
        writer_chain = ChatPromptTemplate.from_template(WRITER_PROMPT) | self.llm | StrOutputParser()
        report = await writer_chain.ainvoke({
            "query": query,
            "context": context_str
        })
        return report
