import os
import json
import requests
from dotenv import load_dotenv
from neo4j import GraphDatabase

load_dotenv()

url = os.getenv("llm_endpoint")
url_neo4j = os.getenv("NEO4J_URI")
username = os.getenv("NEO4J_USERNAME")
password = os.getenv("NEO4J_PASSWORD")

driver = GraphDatabase.driver(url_neo4j, auth=(username, password))

USELESS_WORDS = {
    "who", "is", "the", "of", "a", "an", "are", "was", "were", "what",
    "where", "when", "how", "why", "did", "do", "does", "has", "have",
    "had", "me", "tell", "about", "and", "or", "in", "on", "at", "to",
    "for", "with", "by", "from", "that", "this", "it", "he", "she", "they",
}


def get_stored_data(user_prompt: str) -> str:
    """Query Neo4j for graph context relevant to the user's prompt keywords."""
    keywords = [w for w in user_prompt.lower().split() if w not in USELESS_WORDS]
    context_lines = []

    with driver.session() as session:
        for keyword in keywords:
            rows = session.run(
                """
                MATCH (p:Project)-[:CONTAINS]->(f:File)-[r]->(n)
                WHERE toLower(p.name) CONTAINS $keyword
                   OR toLower(f.name) CONTAINS $keyword
                RETURN p.name AS project, f.name AS file,
                       type(r) AS relation, n.name AS connected
                """,
                keyword=keyword,
            ).data()
            for row in rows:
                context_lines.append(
                    f"[{row['project']}] {row['file']} -[{row['relation']}]-> {row['connected']}"
                )

    return "\n".join(context_lines)


def llmresponce(context: str, user_prompt: str) -> str:
    """
    Call the LLM with graph context and return its answer.

    Args:
        context:     Graph knowledge context built from Neo4j.
        user_prompt: The user's original question.
    """
    system_content = f"""You are a helpful code analysis assistant with deep knowledge of software architecture.
Given the knowledge graph context below, answer questions about code structure, dependencies and libraries.
Context:
{context}

Rules:
- If asked about files/dependencies → list the local files with a brief description of what each file likely does based on its name
- If asked about libraries → list the libraries with a one-line description of what each library is used for
- If no local files exist, focus on the libraries and explain what they do in the context of this file
- If asked about both → cover both with descriptions
- Be conversational and helpful, not robotic
- If context is empty, say "I don't have information about that in my knowledge graph" """

    response = requests.post(
        url,
        json={
            "model": "gemma-4-31b",
            "messages": [
                {"role": "system", "content": system_content},
                {"role": "user", "content": user_prompt},
            ],
        },
        timeout=120,
    )
    response.raise_for_status()
    return response.json()['choices'][0]['message']['content']


def store_code_Neo4j(data: dict, project: str = 'default') -> None:
    """Store full code graph (file + external imports + local imports) into Neo4j."""
    with driver.session() as session:
        # Create project node
        session.run("MERGE (p:Project {name: $project})", project=project)

        filename = data.get('file', 'unknown')
        session.run(
            "MERGE (f:File {name: $name, project: $project})",
            name=filename, project=project,
        )
        session.run(
            """
            MATCH (p:Project {name: $project})
            MATCH (f:File {name: $file, project: $project})
            MERGE (p)-[:CONTAINS]->(f)
            """,
            project=project, file=filename,
        )

        for imp in data.get('imports', []):
            lib = imp['library']
            session.run(
                "MERGE (l:Library {name: $name, project: $project})",
                name=lib, project=project,
            )
            session.run(
                """
                MATCH (p:Project {name: $project})
                MATCH (l:Library {name: $lib, project: $project})
                MERGE (p)-[:CONTAINS]->(l)
                """,
                project=project, lib=lib,
            )
            session.run(
                """
                MATCH (f:File {name: $file, project: $project})
                MATCH (l:Library {name: $lib, project: $project})
                MERGE (f)-[:IMPORTS]->(l)
                """,
                file=filename, lib=lib, project=project,
            )

        for local_file in data.get('local_imports', []):
            session.run(
                "MERGE (f2:File {name: $name, project: $project})",
                name=local_file, project=project,
            )
            session.run(
                """
                MATCH (p:Project {name: $project})
                MATCH (f2:File {name: $local, project: $project})
                MERGE (p)-[:CONTAINS]->(f2)
                """,
                project=project, local=local_file,
            )
            session.run(
                """
                MATCH (f:File {name: $file, project: $project})
                MATCH (f2:File {name: $local, project: $project})
                MERGE (f)-[:IMPORTS_LOCAL]->(f2)
                """,
                file=filename, local=local_file, project=project,
            )


def store_files_only_Neo4j(data: dict, project: str = 'default') -> None:
    """
    Store file-dependency graph (local imports only) into Neo4j.

    Path normalisation: strips leading './' and backslashes so paths
    stored from different OS/call-sites remain consistent.
    """
    raw_filename = data.get('file', 'unknown')
    filename = raw_filename.replace('\\', '/').lstrip('./')

    with driver.session() as session:
        session.run(
            "MERGE (f:File {name: $name, project: $project})",
            name=filename, project=project,
        )

        for local_file in data.get('local_imports', []):
            target = local_file.replace('\\', '/').lstrip('./')
            session.run(
                """
                MERGE (a:File {name: $file, project: $project})
                MERGE (b:File {name: $target, project: $project})
                MERGE (a)-[:IMPORTS_LOCAL]->(b)
                """,
                file=filename, target=target, project=project,
            )