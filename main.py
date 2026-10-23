import nltk
from nltk import sent_tokenize
from neo4j import GraphDatabase
import os
from dotenv import load_dotenv
load_dotenv()
import json
from Retrieval import get_stored_data, llmresponce,store_code_Neo4j,store_files_only_Neo4j

nltk.download('punkt_tab')
http_api=os.getenv("llm_endpoint")

uri=os.getenv('NEO4J_URI')
username=os.getenv('NEO4J_USERNAME')
password=os.getenv('NEO4J_PASSWORD')

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
def extract_relations(code,language,filename):
    responce = requests.post(
        http_api,
         json={
             "model":"gemma-4-31b",
             "messages":
             [
          {
              "role": "system",
                          "content": 
            f"""Analyze this {language} code file named {filename}. Extract:
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
          {
              "role": "user",
              "content": code
          }
         ]
         })
    result = responce.json()
    text = result['choices'][0]['message']['content']
    text = text.strip().removeprefix("```json").removesuffix("```").strip()
    try:
        parsed = json.loads(text)
        parsed['file'] = filename  # force correct filename
        return parsed
    except json.JSONDecodeError:
        print(f"Skipping — LLM didn't return JSON: {text}")
        return None

driver =GraphDatabase.driver(
    uri,
    auth=(username,password)
)


def Extract_only_file(code,language,filename):
    responce = requests.post(
        http_api,
             json={
                 "model":"gemma-4-31b",
                 "messages":
                 [
              {
                  "role": "system",
                              "content": 
                f"""Analyze this {language} code file named {filename}.
Extract ONLY local file imports (other code files in the project, NOT external libraries).
Return the local imports as relative paths exactly as they appear in the import statements.
Return ONLY valid JSON:
{{
  "file": "{filename}",
  "language": "{language}",
  "local_imports": ["./config/db.js", "./routes/authRoutes.js"]
}}"""
              },
              {
                  "role": "user",
                  "content": code
              }
             ]
             })
    result = responce.json()
    text = result['choices'][0]['message']['content']
    text = text.strip().removeprefix("```json").removesuffix("```").strip()
    try:
        parsed = json.loads(text)
        parsed['file'] = filename  # force correct filename
        return parsed
    except json.JSONDecodeError:
        print(f"Skipping — LLM didn't return JSON: {text}")
        return None


def PROCESS_FILES_only(filepath,visited=set()):
    file_path= os.path.abspath(filepath)
    if file_path in visited:
        return
    visited.add(file_path)
    ext=os.path.splitext(file_path)[1]
    language= lang_map.get(ext,'Unknown')
    print(f"Processing: {file_path} ({language})")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        code = f.read()
    rel_path = os.path.relpath(file_path).replace('\\', '/')
    result = Extract_only_file(code, language, rel_path)
    if result:
        store_files_only_Neo4j(result)
        for local_file in result.get('local_imports', []):
            local_path = os.path.join(os.path.dirname(file_path), local_file)
            if os.path.exists(local_path):
                PROCESS_FILES_only(local_path, visited)
            else:
                print(f"File not found: {local_path}")

def PROCESS_FILES(filepath,visited=set()):
    file_path= os.path.abspath(filepath)
    if file_path in visited:
        return
    visited.add(file_path)
    ext=os.path.splitext(file_path)[1]
    language= lang_map.get(ext,'Unknown')
    print(f"Processing: {file_path} ({language})")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        code = f.read()
    result = extract_relations(code,language,os.path.basename(file_path))
    if result:
        store_code_Neo4j(result)
        for local_file in result.get('local_imports', []):
            local_path = os.path.join(os.path.dirname(file_path), local_file)
            if os.path.exists(local_path):
                PROCESS_FILES(local_path, visited)
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
    chunks=sent_tokenize(text)
    return chunks

def Peragraph_chunking(text):
    chunks = [p.strip() for p in text.split('\n\n') if p.strip()]
    return chunks

input_text=input("press 0 for data storing, press 1 for conversation , 2 for storing files only: - ")
if input_text == "0":
    PROCESS_FILES('main.py')
    driver.close()
elif input_text == "2":
    user_prompt= input("lets start the conversation : - ")
    context =get_stored_data(user_prompt)
    print(llmresponce(context,user_prompt))
elif input_text == "1":
    PROCESS_FILES_only('main_1.py')
    driver.close()
