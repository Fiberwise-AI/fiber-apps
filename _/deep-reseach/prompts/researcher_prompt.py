RESEARCHER_PROMPT = """
You are an expert researcher. Based on the provided research plan, your task is to generate a list
of 3-5 specific and effective web search queries that will gather the necessary information.

Do not try to answer the questions in the plan. Only generate the search queries.
Each query should be on a new line.

Research Plan:
---
{plan}
---

Web Search Queries:
"""
