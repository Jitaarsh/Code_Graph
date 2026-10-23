from neo4j import GraphDatabase
import os
import json
import requests
import posixpath
from dotenv import load_dotenv

load_dotenv()

from Retrieval import get_stored_data, llmresponce, store_code_Neo4j, store_files_only_Neo4j

http_api = os.getenv("llm_endpoint")

uri = os.getenv('NEO4J_URI')
username = os.getenv('NEO4J_USERNAME')
password = os.getenv('NEO4J_PASSWORD')

driver = GraphDatabase.driver(uri, auth=(username, password))

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
    '.php': 'PHP',
    '.jsx': 'JavaScript',
    '.tsx': 'TypeScript',
    '.vue': 'Vue',
    '.swift': 'Swift',
    '.kt': 'Kotlin',
    '.cs': 'C#',
}


def _call_llm(messages: list) -> str:
    """Shared helper: POST to the LLM endpoint and return raw text content."""
    response = requests.post(
        http_api,
        json={"model": "gemma-4-31b", "messages": messages},
        timeout=120,
    )
    response.raise_for_status()
    return response.json()['choices'][0]['message']['content']


def _parse_llm_json(text: str, filename: str) -> dict | None:
    """Strip markdown fences and parse JSON from LLM response."""
    text = text.strip().removeprefix("```json").removesuffix("```").strip()
    try:
        parsed = json.loads(text)
        parsed['file'] = filename
        return parsed
    except json.JSONDecodeError:
        print(f"Skipping {filename!r} — LLM didn't return valid JSON:\n{text[:200]}")
        return None


def extract_relations(code: str, language: str, filename: str) -> dict | None:
    """Extract external + local imports with used functions (full mode)."""
    system_prompt = f"""Analyze this {language} code file named {filename}. Extract:
1. All external library imports and which functions are used from them
2. All local file imports (other code files in the project) — just the filename
Return ONLY valid JSON:
{{
  "file": "{filename}",
  "language": "{language}",
  "imports": [{{"library": "requests", "type": "external", "used_functions": ["post"]}}],
  "local_imports": ["Retrieval.py"]
}}"""
    text = _call_llm([
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": code},
    ])
    return _parse_llm_json(text, filename)


def Extract_only_file(code: str, language: str, filename: str) -> dict | None:
    """Extract ONLY local file imports (no external libraries)."""
    system_prompt = f"""Analyze this {language} code file named {filename}.
Extract ONLY local file imports (other code files in the project, NOT external libraries, NOT built-in modules).
Return the local imports with their FULL filename including extension (.py, .js, etc).
Return ONLY valid JSON:
{{
  "file": "{filename}",
  "language": "{language}",
  "local_imports": ["./config/db.py", "./routes/auth.py"]
}}
If you are not 100% sure a file is local (not a library), do NOT include it."""
    text = _call_llm([
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": code},
    ])
    return _parse_llm_json(text, filename)


def PROCESS_FILES_only(filepath: str, project: str = 'default', visited: set | None = None):
    """Recursively process a file and its local imports (files-only mode)."""
    if visited is None:
        visited = set()

    file_path = os.path.abspath(filepath)
    if file_path in visited:
        return
    visited.add(file_path)

    ext = os.path.splitext(file_path)[1]
    language = lang_map.get(ext, 'Unknown')
    print(f"Processing: {file_path} ({language})")

    try:
        with open(file_path, 'r', encoding='utf-8', errors='replace') as fh:
            code = fh.read()
    except OSError as e:
        print(f"Cannot read {file_path}: {e}")
        return

    rel_path = os.path.relpath(file_path).replace('\\', '/')
    result = Extract_only_file(code, language, rel_path)
    if result:
        store_files_only_Neo4j(result, project=project)
        for local_file in result.get('local_imports', []):
            local_path = os.path.join(os.path.dirname(file_path), local_file)
            if os.path.exists(local_path):
                PROCESS_FILES_only(local_path, project=project, visited=visited)
            else:
                print(f"File not found: {local_path}")


def PROCESS_FILES_only_mini(filepath: str, project: str = 'default'):
    """Process a single file without recursing into imports."""
    file_path = os.path.abspath(filepath)
    ext = os.path.splitext(file_path)[1]
    language = lang_map.get(ext, 'Unknown')
    print(f"Processing: {file_path} ({language})")

    try:
        with open(file_path, 'r', encoding='utf-8', errors='replace') as fh:
            code = fh.read()
    except OSError as e:
        print(f"Cannot read {file_path}: {e}")
        return

    rel_path = os.path.relpath(file_path).replace('\\', '/')
    result = Extract_only_file(code, language, rel_path)
    if result:
        store_files_only_Neo4j(result, project=project)


def PROCESS_FILES(filepath: str, project: str = 'default', visited: set | None = None):
    """Recursively process a file and its local imports (full relations mode)."""
    if visited is None:
        visited = set()

    file_path = os.path.abspath(filepath)
    if file_path in visited:
        return
    visited.add(file_path)

    ext = os.path.splitext(file_path)[1]
    language = lang_map.get(ext, 'Unknown')
    print(f"Processing: {file_path} ({language})")

    try:
        with open(file_path, 'r', encoding='utf-8', errors='replace') as fh:
            code = fh.read()
    except OSError as e:
        print(f"Cannot read {file_path}: {e}")
        return

    result = extract_relations(code, language, os.path.basename(file_path))
    if result:
        store_code_Neo4j(result, project=project)
        for local_file in result.get('local_imports', []):
            local_path = os.path.join(os.path.dirname(file_path), local_file)
            if os.path.exists(local_path):
                PROCESS_FILES(local_path, project=project, visited=visited)
            else:
                print(f"File not found: {local_path}")


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

def _find_entry_point(folder_path: str) -> str | None:
    """Return the path of the first entry-point file found in folder_path."""
    for ext in ['.py', '.js', '.ts', '.java']:
        for name in ['main', 'index', 'app', 'server']:
            candidate = os.path.join(folder_path, f'{name}{ext}')
            if os.path.exists(candidate):
                return candidate
    return None


if __name__ == '__main__':
    choice = input("Press 0 to store full relations, 1 for files-only, 2 for conversation: ").strip()

    if choice in ('0', '1'):
        folder_path = input("Enter folder path: ").strip()
        project_name = os.path.basename(folder_path.rstrip('/\\'))
        entry = _find_entry_point(folder_path)
        if entry:
            if choice == '0':
                PROCESS_FILES(entry, project=project_name)
            else:
                PROCESS_FILES_only(entry, project=project_name)
        else:
            print(f"No entry point found in {folder_path}")
        driver.close()

    elif choice == '2':
        user_prompt = input("Start the conversation: ").strip()
        context = get_stored_data(user_prompt)
        # Note: llmresponce(context, user_prompt) — context is first arg
        print(llmresponce(context, user_prompt))

    else:
        print("Unknown option.")