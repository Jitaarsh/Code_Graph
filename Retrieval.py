import os
from dotenv import load_dotenv
from neo4j import GraphDatabase
import requests
import json
load_dotenv()

url = os.getenv("llm_endpoint")
url_neo4j = os.getenv("NEO4J_URI")
username = os.getenv("NEO4J_USERNAME")
password = os.getenv("NEO4J_PASSWORD")

driver = GraphDatabase.driver(url_neo4j, auth=(username, password))

USELESS_WORDS = {"who", "is", "the", "of", "a", "an", "are", "was", "were", "what",
                 "where", "when", "how", "why", "did", "do", "does", "has", "have",
                 "had", "me", "tell", "about", "and", "or", "in", "on", "at", "to",
                 "for", "with", "by", "from", "that", "this", "it", "he", "she", "they"}

def get_stored_data(user_prompt):
    keywords = [w for w in user_prompt.lower().split() if w not in USELESS_WORDS]
    context = ""
    with driver.session() as session:
        for keyword in keywords:
            result = session.run(
                """
                MATCH (p:Project)-[:CONTAINS]->(f:File)-[r]->(n)
                WHERE toLower(p.name) CONTAINS $keyword
                   OR toLower(f.name) CONTAINS $keyword
                RETURN p.name AS project, f.name AS file, type(r) AS relation, n.name AS connected
                """,
                keyword=keyword
            )
            rows = result.data()
            for row in rows:
                context += f"[{row['project']}] {row['file']} -[{row['relation']}]-> {row['connected']}\n"
    return context

def llmresponce(user_prompt, context):
    response = requests.post(
        url,
        json={
            "model": "gemma-4-31b",
            "messages": [
                {
                    "role": "system",
                    "content": f"""You are a helpful code analysis assistant with deep knowledge of software architecture.
Given the knowledge graph context below, answer questions about code structure, dependencies and libraries.
Context:
{context}

Rules:
- If asked about files/dependencies → list the local files with a brief description of what each file likely does based on its name
- If asked about libraries → list the libraries with a one line description of what each library is used for
- If no local files exist, focus on the libraries and explain what they do in the context of this file
- If asked about both → cover both with descriptions
- Be conversational and helpful, not robotic
- If context is empty, say "I don't have information about that in my knowledge graph" """
                },
                {"role": "user", "content": user_prompt}
            ]
        }
    )
    result = response.json()
    return result['choices'][0]['message']['content']

def store_code_Neo4j(data, project='default'):
    with driver.session() as session:
        # create project node first
        session.run("MERGE (p:Project {name: $project})", project=project)

        filename = data.get('file', 'unknown')
        session.run("MERGE (f:File {name: $name, project: $project})", name=filename, project=project)

        # connect file to project
        session.run("""
            MATCH (p:Project {name: $project})
            MATCH (f:File {name: $file, project: $project})
            MERGE (p)-[:CONTAINS]->(f)
        """, project=project, file=filename)

        for inp in data.get('imports', []):
            session.run("MERGE (l:Library {name: $name, project: $project})", name=inp['library'], project=project)
            session.run("""
                MATCH (p:Project {name: $project})
                MATCH (l:Library {name: $lib, project: $project})
                MERGE (p)-[:CONTAINS]->(l)
            """, project=project, lib=inp['library'])
            session.run("""
                MATCH (f:File {name: $file, project: $project})
                MATCH (l:Library {name: $lib, project: $project})
                MERGE (f)-[:IMPORTS]->(l)
            """, file=filename, lib=inp['library'], project=project)

        for local_file in data.get('local_imports', []):
            session.run("MERGE (f2:File {name: $name, project: $project})", name=local_file, project=project)
            session.run("""
                MATCH (p:Project {name: $project})
                MATCH (f2:File {name: $local, project: $project})
                MERGE (p)-[:CONTAINS]->(f2)
            """, project=project, local=local_file)
            session.run("""
                MATCH (f:File {name: $file, project: $project})
                MATCH (f2:File {name: $local, project: $project})
                MERGE (f)-[:IMPORTS_LOCAL]->(f2)
            """, file=filename, local=local_file, project=project)
            
def store_files_only_Neo4j(data, project='default'):
    with driver.session() as session:
        # create project node first
        session.run("MERGE (p:Project {name: $project})", project=project)
        
        filename = data.get('file', 'unknown')
        session.run("MERGE (f:File {name: $name, project: $project})", name=filename, project=project)
        
        # connect file to project
        session.run("""
            MATCH (p:Project {name: $project})
            MATCH (f:File {name: $file, project: $project})
            MERGE (p)-[:CONTAINS]->(f)
        """, project=project, file=filename)

        for local_file in data.get('local_imports', []):
            normalized = local_file.replace('\\', '/').lstrip('./')
            session.run("MERGE (f2:File {name: $name, project: $project})", name=normalized, project=project)
            session.run("""
                MATCH (p:Project {name: $project})
                MATCH (f2:File {name: $name, project: $project})
                MERGE (p)-[:CONTAINS]->(f2)
            """, project=project, name=normalized)
            session.run("""
                MATCH (f:File {name: $file, project: $project})
                MATCH (f2:File {name: $local, project: $project})
                MERGE (f)-[:IMPORTS_LOCAL]->(f2)
            """, file=filename, local=normalized, project=project)