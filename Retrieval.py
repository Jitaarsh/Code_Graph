import os
from dotenv import load_dotenv
from neo4j import GraphDatabase
import requests
import json
load_dotenv()

url=os.getenv("llm_endpoint")
url_neo4j=os.getenv("NEO4J_URI")

username=os.getenv("NEO4J_USERNAME")
password=os.getenv("NEO4J_PASSWORD")

driver = GraphDatabase.driver(url_neo4j,auth=(username,password))

USELESS_WORDS={"who", "is", "the", "of", "a", "an", "are", "was", "were", "what", 
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
                MATCH (f:File {name: $keyword})-[r]->(n)
                RETURN f.name AS file, type(r) AS relation, n.name AS connected
                UNION
                MATCH (f:File)-[r]->(n)
                WHERE toLower(f.name) CONTAINS $keyword
                RETURN f.name AS file, type(r) AS relation, n.name AS connected
                """,
                keyword=keyword
            )
            rows = result.data()
            for row in rows:
                context += f"{row['file']} -[{row['relation']}]-> {row['connected']}\n"
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
                {
                    "role": "user",
                    "content": user_prompt
                }
            ]
        }
    )
    result = response.json()
    return result['choices'][0]['message']['content']

def store_code_Neo4j(data):
    with driver.session() as session:
        filename = data.get('file', 'unknown')
        session.run("MERGE (f:File {name: $name})", name=filename)

        # external libraries
        for inp in data.get('imports', []):
            session.run("MERGE (l:Library {name: $name})", name=inp['library'])
            session.run("""
                MATCH (f:File {name: $file})
                MATCH (l:Library {name: $lib})
                MERGE (f)-[:IMPORTS]->(l)
            """, file=filename, lib=inp['library'])

        # local files
        for local_file in data.get('local_imports', []):
            session.run("MERGE (f2:File {name: $name})", name=local_file)
            session.run("""
                MATCH (f:File {name: $file})
                MATCH (f2:File {name: $local})
                MERGE (f)-[:IMPORTS_LOCAL]->(f2)
            """, file=filename, local=local_file)
def store_files_only_Neo4j(data):
    with driver.session() as session:
        filename = data.get('file', 'unknown')
        session.run("MERGE (f:File {name: $name})", name=filename)

        for local_file in data.get('local_imports', []):
            # normalize the path
            normalized = local_file.replace('\\', '/').lstrip('./')
            session.run("MERGE (f2:File {name: $name})", name=normalized)
            session.run("""
                MATCH (f:File {name: $file})
                MATCH (f2:File {name: $local})
                MERGE (f)-[:IMPORTS_LOCAL]->(f2)
            """, file=filename, local=normalized)