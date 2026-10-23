

from neo4j import GraphDatabase
import os
from dotenv import load_dotenv
load_dotenv()
import json
from Retrieval import get_stored_data, llmresponce, store_code_Neo4j, store_files_only_Neo4j

http_api = os.getenv("llm_endpoint")

uri = os.getenv('NEO4J_URI')
username = os.getenv('NEO4J_USERNAME')
password = os.getenv('NEO4J_PASSWORD')

lang_map = {
    '.py': 'Python',
    '.js': 'JavaScript',
    '.ts': 'TypeScript',
    '.java': 'Java',
    '.go': 'Go',
    '.rs': 'Rust',
    '.cpp': 'C++',
    '.c': 'C',
    '.rb': 'Ruby',
    '.php': 'PHP'
}

import requests

def extract_relations(code, language, filename):
    response = requests.post(
        http_api,
        json={
            "model": "gemma-4-31b",
            "messages": [
                {
                    "role": "system",
                    "content": f"""Analyze this {language} code file named {filename}. Extract:
1. All external library imports and which functions are used from them
2. All local file imports (other code files in the project) — just the filename
Return ONLY valid JSON:
{{
  "file": "{filename}",
  "language": "{language}",
  "imports": [{{"library": "requests", "type": "external", "used_functions": ["post"]}}],
  "local_imports": ["Retrieval.py"]
}}"""
                },
                {"role": "user", "content": code}
            ]
        }
    )
    result = response.json()
    text = result['choices'][0]['message']['content']
    text = text.strip().removeprefix("```json").removesuffix("```").strip()
    try:
        parsed = json.loads(text)
        parsed['file'] = filename
        return parsed
    except json.JSONDecodeError:
        print(f"Skipping — LLM didn't return JSON: {text}")
        return None

def Extract_only_file(code, language, filename):
    response = requests.post(
        http_api,
        json={
            "model": "gemma-4-31b",
            "messages": [
                {
                    "role": "system",
                    "content": f"""Analyze this {language} code file named {filename}.
Extract ONLY local file imports (other code files in the project, NOT external libraries, NOT built-in modules).
Return the local imports with their FULL filename including extension (.py, .js, etc).
Return ONLY valid JSON:
{{
  "file": "{filename}",
  "language": "{language}",
  "local_imports": ["./config/db.py", "./routes/auth.py"]
}}
If you are not 100% sure a file is local (not a library), do NOT include it."""
                },
                {"role": "user", "content": code}
            ]
        }
    )
    result = response.json()
    text = result['choices'][0]['message']['content']
    text = text.strip().removeprefix("```json").removesuffix("```").strip()
    try:
        parsed = json.loads(text)
        parsed['file'] = filename
        return parsed
    except json.JSONDecodeError:
        print(f"Skipping — LLM didn't return JSON: {text}")
        return None

driver = GraphDatabase.driver(uri, auth=(username, password))

import posixpath

def store_files_only_Neo4j_change(data, project='default'):
    filename = posixpath.normpath(data.get('file', 'unknown').replace('\\', '/'))
    base = posixpath.dirname(filename)
    with driver.session() as session:
        session.run("MERGE (f:File {name: $name, project: $project})",
                    name=filename, project=project)
        for local_file in data.get('local_imports', []):
            target = posixpath.normpath(posixpath.join(base, local_file.replace('\\', '/')))
            session.run("""
                MERGE (a:File {name: $file, project: $project})
                MERGE (b:File {name: $target, project: $project})
                MERGE (a)-[:IMPORTS_LOCAL]->(b)
            """, file=filename, target=target, project=project)

def PROCESS_FILES_only(filepath, visited=set(), project='default'):
    file_path = os.path.abspath(filepath)
    if file_path in visited:
        return
    visited.add(file_path)
    ext = os.path.splitext(file_path)[1]
    language = lang_map.get(ext, 'Unknown')
    print(f"Processing: {file_path} ({language})")

    with open(file_path, 'r', encoding='utf-8') as f:
        code = f.read()
    rel_path = rel_path.split('/', 1)[1] if '/' in rel_path else rel_path
    result = Extract_only_file(code, language, rel_path)
    if result:
        store_files_only_Neo4j(result, project=project)
        for local_file in result.get('local_imports', []):
            local_path = os.path.join(os.path.dirname(file_path), local_file)
            if os.path.exists(local_path):
                PROCESS_FILES_only(local_path, visited, project=project)
            else:
                print(f"File not found: {local_path}")

def PROCESS_FILES_only_mini(filepath, project='default'):
    file_path = os.path.abspath(filepath)
    ext = os.path.splitext(file_path)[1]
    language = lang_map.get(ext, 'Unknown')
    print(f"Processing: {file_path} ({language})")

    with open(file_path, 'r', encoding='utf-8') as f:
        code = f.read()
    
    rel_path = os.path.relpath(file_path).replace('\\', '/')
    result = Extract_only_file(code, language, rel_path)
    if result:
        store_files_only_Neo4j(result, project=project)

def PROCESS_FILES(filepath, visited=set(), project='default'):
    file_path = os.path.abspath(filepath)
    if file_path in visited:
        return
    visited.add(file_path)
    ext = os.path.splitext(file_path)[1]
    language = lang_map.get(ext, 'Unknown')
    print(f"Processing: {file_path} ({language})")

    with open(file_path, 'r', encoding='utf-8') as f:
        code = f.read()
    result = extract_relations(code, language, os.path.basename(file_path))
    if result:
        store_code_Neo4j(result, project=project)
        for local_file in result.get('local_imports', []):
            local_path = os.path.join(os.path.dirname(file_path), local_file)
            if os.path.exists(local_path):
                PROCESS_FILES(local_path, visited, project=project)
            else:
                print(f"File not found: {local_path}")

def store_Neo4j(data):
    with driver.session() as session:
        for entity in data['entities']:
            session.run("MERGE (e:Entity {name: $name})", name=entity)
        for rel in data['relationships']:
            relation_type = rel['relation'].upper().replace(' ', '_')
            session.run(
                f"""
                MERGE (a:Entity {{name: $source}})
                MERGE (b:Entity {{name: $target}})
                MERGE (a)-[:{relation_type}]->(b)
                """,
                source=rel['source'], target=rel['target']
            )

def sentance_chumking(text):
    from nltk import sent_tokenize
    return sent_tokenize(text)

def Peragraph_chunking(text):
    return [p.strip() for p in text.split('\n\n') if p.strip()]


if __name__ == '__main__':
    input_text = input("press 0 for data storing, press 1 for storing files only, press 2 for conversation: - ")

    if input_text == "0":
        folder_path = input("enter folder path: ")
        project_name = os.path.basename(folder_path.rstrip('/\\'))
        for ext in ['.py', '.js', '.ts', '.java']:
            for entry_name in ['main', 'index', 'app', 'server']:
                entry = os.path.join(folder_path, f'{entry_name}{ext}')
                if os.path.exists(entry):
                    PROCESS_FILES(entry, project=project_name)
                    break
            else:
                continue
            break
        else:
            print(f"No entry point found in {folder_path}")
        driver.close()

    elif input_text == "1":
        folder_path = input("enter folder path: ")
        project_name = os.path.basename(folder_path.rstrip('/\\'))
        for ext in ['.py', '.js', '.ts', '.java']:
            for entry_name in ['main', 'index', 'app', 'server']:
                entry = os.path.join(folder_path, f'{entry_name}{ext}')
                if os.path.exists(entry):
                    PROCESS_FILES_only(entry, project=project_name)
                    break
            else:
                continue
            break
        else:
            print(f"No entry point found in {folder_path}")
        driver.close()

    elif input_text == "2":
        user_prompt = input("lets start the conversation : - ")
        context = get_stored_data(user_prompt)
        print(llmresponce(context, user_prompt))